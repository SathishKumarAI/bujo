/**
 * Supabase — **identity only**, plus a row that holds ciphertext.
 *
 * This is a *cache*, exactly like the Vercel blob and the synced folder.
 * `localStorage['bujo:data']` / `['bujo:enc']` stays canonical
 * (`docs/DATA-STORE-DECISION.md` §1) and a Supabase row is rebuildable at any
 * time by pushing the local journal at it.
 *
 * ## What the server can and cannot see
 *
 * | Supabase holds | Supabase cannot hold |
 * |---|---|
 * | An email address and a user id (Auth) | The passphrase |
 * | `journals.ciphertext` — AES-GCM-256 bytes | The AES key, or anything it can be derived from |
 * | `journals.updated_at`, and the byte length | One word of the journal |
 *
 * The encryption is unchanged from `lib/crypto.ts`: PBKDF2 150 000 rounds →
 * AES-GCM-256, derived in this browser. **The row is addressed by `auth.uid()`,
 * never by anything derived from the passphrase** — which is strictly better
 * than the blob path's `SHA-256('bujo-sync:' + passphrase)` locator, because
 * that locator is a (weak) function of the secret and this one is not.
 *
 * ## Degrading when it is not configured
 *
 * No `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ⇒ {@link supabaseConfigured}
 * is false, {@link getSupabase} returns null, and every function here is a
 * no-op that cannot throw. **The SDK is behind a dynamic `import()`**, so an
 * unconfigured build never downloads it and the offline PWA is byte-for-byte
 * unaffected. That is not politeness: this is a local-first app and a build
 * with no backend has to behave exactly as it did before this file existed.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { encryptString, decryptString } from './crypto'
import { inlineImagesWithinBudget, notePhotosSkipped, externalizeImages } from './imageStore'
import type { PassKey } from './crypto'
import type { JournalData } from './types'

/** The one table. One row per user, holding one ciphertext. */
export const JOURNALS_TABLE = 'journals'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when this build was given a project to talk to. */
export function supabaseConfigured(): boolean {
  return !!URL && !!ANON
}

let client: SupabaseClient | null = null
let loading: Promise<SupabaseClient | null> | null = null

/**
 * The client, or null when unconfigured. Created once, lazily.
 *
 * `detectSessionInUrl` is why the SDK is worth a dependency here: the magic
 * link comes back as a URL fragment that has to be exchanged for a session and
 * then scrubbed from the address bar, and hand-rolling that is exactly the kind
 * of security-critical code not to hand-roll.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured()) return null
  if (client) return client
  loading ??= import('@supabase/supabase-js')
    .then(({ createClient }) => {
      client = createClient(URL!, ANON!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
      return client
    })
    .catch(() => null) // offline on first sign-in — the app carries on locally
  return loading
}

// ── Identity ─────────────────────────────────────────────────────────────────

/**
 * Email a one-time sign-in link. **No password is ever asked for or stored.**
 *
 * Deliberate: a password would be a second secret to keep, a reset flow to
 * build, and a credential users reuse — for a login whose only job is to say
 * *which row is yours*. A magic link has no reset path because it has nothing
 * to reset.
 */
export async function sendSignInLink(email: string): Promise<void> {
  const sb = await getSupabase()
  if (!sb) throw new Error('Accounts are not configured on this build.')
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  })
  if (error) throw error
}

/** The signed-in user, or null (also null when unconfigured or offline). */
export async function currentAccount(): Promise<User | null> {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getUser()
  return data.user ?? null
}

/** Sign out. Leaves the local journal completely alone — it is the canonical copy. */
export async function signOutAccount(): Promise<void> {
  const sb = await getSupabase()
  await sb?.auth.signOut()
}

/** Subscribe to sign-in / sign-out. Returns an unsubscribe. */
export async function onAccountChange(fn: (user: User | null) => void): Promise<() => void> {
  const sb = await getSupabase()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((_e, session) => fn(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}

// ── The ciphertext row ───────────────────────────────────────────────────────

/**
 * The exact shape of every byte sent to Supabase.
 *
 * Named and exported so `supacloud.contract.test.ts` can assert the payload has
 * these three fields and no others. A fourth field added here without a
 * matching thought about what it leaks is the failure this guards against.
 */
export interface JournalRow {
  user_id: string
  ciphertext: string
  updated_at: string
}

/** Build the row. Pure and exported so a test can read what would be sent. */
export async function buildRow(userId: string, key: PassKey | string, data: JournalData): Promise<{ row: JournalRow; skipped: number }> {
  const { payload, skipped } = await inlineImagesWithinBudget(data)
  const blob = await encryptString(JSON.stringify(payload), key)
  return {
    row: { user_id: userId, ciphertext: JSON.stringify(blob), updated_at: new Date().toISOString() },
    skipped,
  }
}

/** Encrypt + upsert the journal into the signed-in user's row. */
export async function pushSupabase(user: User, key: PassKey | string, data: JournalData): Promise<void> {
  const sb = await getSupabase()
  if (!sb) return
  const { row, skipped } = await buildRow(user.id, key, data)
  // `user_id` is sent for the upsert conflict target; RLS checks it against
  // auth.uid() anyway, so a forged one is rejected by the database, not by us.
  const { error } = await sb.from(JOURNALS_TABLE).upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`Supabase push failed: ${error.message}`)
  if (skipped) notePhotosSkipped(skipped)
}

/** Fetch + decrypt the signed-in user's row, or null if there is none yet. */
export async function pullSupabase(user: User, key: PassKey | string): Promise<JournalData | null> {
  const sb = await getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from(JOURNALS_TABLE)
    .select('ciphertext')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`Supabase pull failed: ${error.message}`)
  if (!data?.ciphertext) return null
  // Throws on the wrong passphrase. Never caught into "nothing stored" — a
  // decrypt failure and an empty row must not look the same, or a passphrase
  // typo reads as "start fresh" and the next push overwrites the real row.
  const json = await decryptString(JSON.parse(data.ciphertext), key)
  return externalizeImages(JSON.parse(json) as JournalData)
}
