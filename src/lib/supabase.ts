// Account identity (Google) + an end-to-end-encrypted journal row. COD-271.
//
// ── Read this before changing anything here ────────────────────────────────
//
// This file reverses a decision. Accounts were removed from this app on
// 2026-09-11 and `lib/auth.contract.test.ts` existed to keep them out; both
// `docs/AUTH.md` and that test are rewritten alongside this, because a
// mechanism that contradicts its own documentation is worse than either.
//
// **The server never sees a journal.** Google says *who* you are and picks
// which row is yours; a separate passphrase derives the key, and the journal is
// encrypted in this browser before it is uploaded. Supabase holds a blob of
// `{v, salt, iv, data}` and nothing else. That is a deliberate choice, made
// explicitly over the simpler plaintext-JSONB design, and it has a cost worth
// restating every time someone reads this file:
//
//   **The account is recoverable. The data is not.** Lose the passphrase and
//   the row is still yours, still syncing, and permanently unreadable. An
//   account normally implies "I can always get back in"; here it means "I can
//   always get back to my ciphertext". Any copy written near this feature has
//   to say so — see the words table in `docs/AUTH.md`.
//
// ── Absent by default ──────────────────────────────────────────────────────
//
// With no `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the whole feature is
// *absent*, not broken: `isConfigured()` is false, no client is constructed,
// and every caller renders nothing. The app is then exactly the local-first
// app it was. This matters because the project is public and most people
// cloning it will never set these — a sign-in button that throws on click is a
// worse first run than no sign-in button.
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { encryptString, decryptString, isEncryptedBlob, type EncryptedBlob } from './crypto'
import { inlineImagesWithinBudget, notePhotosSkipped, externalizeImages } from './imageStore'
import { forEgress } from './cyclePrivacy'
import type { JournalData } from './types'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when this build was given a project to talk to. */
export function isConfigured(): boolean {
  return !!URL && !!ANON
}

let client: SupabaseClient | null = null
/** The client, or null when unconfigured. Constructed lazily and once. */
function sb(): SupabaseClient | null {
  if (!isConfigured()) return null
  if (!client) {
    client = createClient(URL!, ANON!, {
      auth: {
        // The journal lives in `localStorage` already; the session living
        // beside it is consistent rather than a new exposure. `detectSessionInUrl`
        // is what completes the OAuth redirect back onto the app.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export type { User }

/** The signed-in user, or null. Null whenever unconfigured. */
export async function currentUser(): Promise<User | null> {
  const c = sb()
  if (!c) return null
  const { data } = await c.auth.getUser()
  return data.user ?? null
}

/**
 * Subscribe to sign-in / sign-out. Returns an unsubscribe.
 *
 * Exists because the old implementation did not have it: `AccountMenu` fetched
 * the user once on mount and never heard about a later sign-in, so the header
 * disagreed with the page until a reload (COD-134). Anything rendering identity
 * uses this, not a one-shot `currentUser()`.
 */
export function onAuthChange(fn: (user: User | null) => void): () => void {
  const c = sb()
  if (!c) return () => {}
  const { data } = c.auth.onAuthStateChange((_e, session) => fn(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}

/** Start the Google redirect. Resolves when the browser is on its way out. */
export async function signInGoogle(): Promise<void> {
  const c = sb()
  if (!c) throw new Error('Sign-in is not configured in this build.')
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    // Back to the page they left, not to `/`. `detectSessionInUrl` above
    // consumes the fragment on arrival.
    options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
  })
  if (error) throw error
}

/**
 * Read an OAuth failure off the return URL, and clear it. Null when the
 * current URL carries no failure, which is the overwhelmingly common case.
 *
 * The *success* leg needs no help: `detectSessionInUrl` above consumes the
 * fragment and `onAuthChange` re-renders everything that shows identity. The
 * *failure* leg had no handler at all. Google refuses the token exchange,
 * Supabase redirects back here with the reason in the fragment,
 * `detectSessionInUrl` finds no session to detect, and the app renders its
 * ordinary signed-out state. Reported as "I made a login, the screen is not
 * changing" — an exact description: the screen was the one place the failure
 * was invisible, while the address bar had been carrying
 * `error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code`
 * the whole time.
 *
 * Reads the fragment *and* the query because the reason arrives in both, and
 * decodes twice because the fragment copy is double-encoded (`%253A` for a
 * colon). The second decode is guarded: a malformed escape must not throw on
 * the only code path whose job is to report a failure.
 *
 * Deliberately does NOT touch the URL unless `error` is present — stripping
 * params on the success leg would be racing `detectSessionInUrl` for the
 * fragment it needs.
 */
export function consumeAuthError(): { message: string; detail: string } | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const pick = (k: string) => hash.get(k) || query.get(k) || ''

  const code = pick('error')
  if (!code) return null

  const described = pick('error_description')
  let detail = described
  try { detail = decodeURIComponent(described) } catch { /* keep the single-decoded form */ }

  for (const k of ['error', 'error_code', 'error_description']) { hash.delete(k); query.delete(k) }
  const q = query.toString()
  const h = hash.toString()
  window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + (h ? `#${h}` : ''))

  // A failed *exchange* means Supabase reached Google and Google refused the
  // trade — which is the provider credentials on the server, not anything about
  // this device or this journal. Worth saying plainly, because the provider's
  // own words ("Unable to exchange external code: 4/0A…") read like something
  // was lost, and nothing was: the journal is untouched on this device.
  const credentials = /exchange external code/i.test(detail)
  return {
    message: 'Google sign-in did not complete',
    detail: credentials
      ? 'Google refused the sign-in. That is the server-side provider setup, not your journal — nothing on this device changed and your entries are all still here.'
      : detail || code,
  }
}

export async function signOut(): Promise<void> {
  await sb()?.auth.signOut()
}

/**
 * Push the journal to this account's row, encrypted with `passphrase`.
 *
 * `forEgress` first, like every other network target — it drops the cycle log
 * and this device's sync secrets, and `egress.contract.test.ts` enforces that
 * this path calls it. Applied before image inlining so a withheld domain never
 * reaches the encryptor at all.
 */
export async function pushAccount(passphrase: string, data: JournalData): Promise<void> {
  const c = sb()
  if (!c) throw new Error('Sign-in is not configured in this build.')
  const user = await currentUser()
  if (!user) throw new Error('Not signed in.')
  const { payload, skipped } = await inlineImagesWithinBudget(forEgress(data))
  const blob = await encryptString(JSON.stringify(payload), passphrase)
  const { error } = await c
    .from('journals')
    // No `owner` in the payload: the column defaults to `auth.uid()` and the
    // RLS `with check` refuses anything else, so it cannot be spoofed and does
    // not need to be trusted from here. Same rule as the self-host PostgREST
    // tier (docs/security/postgrest-hardening.md).
    .upsert({ id: user.id, blob, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
  if (skipped) notePhotosSkipped(skipped)
}

/**
 * Read this account's journal back, or null when the row is empty.
 *
 * Throws on a wrong passphrase — `decryptString` does, and it must stay a throw
 * rather than a null: "nothing stored" and "you typed the wrong passphrase"
 * look identical to a caller that cannot tell them apart, and one of them is
 * recoverable by trying again.
 */
export async function pullAccount(passphrase: string): Promise<JournalData | null> {
  const c = sb()
  if (!c) return null
  const user = await currentUser()
  if (!user) return null
  const { data, error } = await c.from('journals').select('blob').eq('id', user.id).maybeSingle()
  if (error) throw error
  const blob = data?.blob as EncryptedBlob | undefined
  if (!blob) return null
  if (!isEncryptedBlob(blob)) throw new Error('The stored journal is not in a format this version understands.')
  const json = await decryptString(blob, passphrase)
  return externalizeImages(JSON.parse(json) as JournalData)
}
