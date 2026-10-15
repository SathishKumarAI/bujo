// Account identity (Google) + the journal row it owns. COD-271, COD-309.
//
// ── Read this before changing anything here ────────────────────────────────
//
// This file has now reversed a decision twice, and both reversals are recorded
// rather than performed quietly. Accounts were removed from this app on
// 2026-09-11 and `lib/auth.contract.test.ts` existed to keep them out; COD-271
// brought them back with an end-to-end-encrypted row; COD-309 took the
// encryption off that row. `docs/AUTH.md` and that contract test are rewritten
// alongside each change, because a mechanism that contradicts its own
// documentation is worse than either.
//
// **The server can read your journal, and row-level security is what makes it
// yours.** Google says who you are, Postgres RLS says which row that is, and
// `data` holds the journal as JSON. There is no passphrase on this path.
//
// ── Why the encryption came off, since removing it looks like a regression ─
//
// Because it cannot coexist with the thing an account is for. **A server that
// can hand your journal to a brand-new device is a server that can read your
// journal.** The passphrase was the only secret the server never saw, and
// therefore the only thing that could open data the server could not read; the
// price was a second secret to carry to every device, and a lost-passphrase
// case that lost the journal permanently. Asked for directly — *"I don't want
// a passphrase. I just want to sign in. The data needs to sync directly, just
// like some other SaaS application"* — and that is a coherent product, not a
// misunderstanding. Notion, Todoist and Google Keep all work this way and all
// of them can read your content; Signal and 1Password cannot read yours and all
// of them make you carry a second secret. Nobody has both.
//
// What that costs, stated plainly so nothing downstream has to guess: someone
// holding a database admin key, or a dump, now gets the journal where before
// they got ciphertext. RLS is unchanged and forced, so no *account* reaches
// another's row. See `docs/AUTH.md` for the words every surface uses.
//
// (Spelled "admin key" rather than with the literal role name on purpose —
// `auth.contract.test.ts` forbids that string anywhere under `src/`, and that
// guard is worth more than this sentence's precision. The role is named in
// `supabase/schema.sql` and in `docs/AUTH.md`, neither of which is scanned.)
//
// **The cycle log is still not here.** `forEgress` strips it from this path as
// from every other, and `egress.contract.test.ts` fails the build if a new sync
// target forgets. That was never about encryption — it is the one domain that
// does not leave the device at all — and it survived this change deliberately.
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
// `isEncryptedBlob` only — this path no longer encrypts. It is kept so a row
// written by COD-271 is recognised and REFUSED rather than mistaken for a
// journal; see `pullAccount`.
import { isEncryptedBlob } from './crypto'
import { inlineImagesWithinBudget, notePhotosSkipped, externalizeImages } from './imageStore'
import { forEgress } from './cyclePrivacy'
import { markSignInStarted, clearSignInPending } from './authReturn'
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
        // **Spelled out, because the default is the weaker one.** auth-js
        // defaults to `implicit` (`GoTrueClient.js:24`), which returns from
        // Google with the access token itself in `#access_token=…`. A URL is
        // the least private part of a browser: it is in the address bar, in
        // `history`, in anything that logs or syncs URLs, and it is handed to
        // a service worker on every navigation. PKCE returns a single-use
        // `?code=` instead and trades it for the token over a POST the URL
        // never sees, with a verifier this browser generated and kept.
        //
        // The one thing to re-check if this is ever changed back: the
        // service-worker reload guard in `lib/swUpdate.ts` must keep matching
        // whichever parameter the flow uses, or COD-294 returns wearing a new
        // parameter name. `AUTH_PARAM` there already matches both.
        flowType: 'pkce',
      },
    })
  }
  return client
}

/**
 * Construct the client at startup, so the OAuth return is consumed no matter
 * which screen renders. COD-295.
 *
 * `detectSessionInUrl` is work the client does in its own `_initialize()` — it
 * reads `?code=…` off `window.location` (PKCE, set above; it still understands
 * an `#access_token=…` left over from a sign-in started by an older bundle),
 * exchanges or stores it, and strips it from the URL. So it
 * only ever happens **if a client exists while those params are still there**,
 * and `sb()` is lazy: the first thing to build one is whichever component calls
 * `currentUser()` or `onAuthChange()`.
 *
 * Every one of those components lives under two gates that can replace the
 * entire app:
 *
 *   `store.tsx`  → `if (!unlocked) return <LockScreen …/>`   (a passcode is set)
 *   `App.tsx`    → `if (!mode) return <Welcome />`           (no storage mode yet)
 *
 * Both return *instead of* `children`, so with a passcode set the whole tree —
 * `AccountMenu`, `AccountSync`, `AccountCard`, `AuthReturnReport` — is absent.
 * Come back from Google onto a locked journal and nothing constructs a client,
 * nothing reads the fragment, and the sign-in is simply dropped. It looks
 * exactly like COD-293 (the redirect that never came back) from the outside and
 * is a different cause entirely.
 *
 * Called from `main.tsx` before `createRoot`, which is the only place that runs
 * unconditionally. Cheap: `createClient` does no network work of its own, and
 * on a URL with no auth params `_initialize` finds nothing and stops.
 *
 * Returns whether a client was made, so a caller can tell "nothing to do" from
 * "not configured" — and so this is testable without a browser.
 */
export function initAuth(): boolean {
  return sb() !== null
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

/**
 * Start the Google redirect. Resolves when the browser is on its way out.
 *
 * Stamps `bujo:auth.pending` first. **`redirectTo` is a request, not a
 * guarantee:** Supabase checks it against the project's Redirect URLs
 * allow-list and silently substitutes the Site URL when it is not on it — no
 * error, nothing in the response to read. So the browser can be sent somewhere
 * else entirely after Google and this app never runs again, which is COD-293
 * and is why the stamp exists. See `lib/authReturn.ts` for the whole shape.
 */
export async function signInGoogle(): Promise<void> {
  const c = sb()
  if (!c) throw new Error('Sign-in is not configured in this build.')
  markSignInStarted(window.location.origin)
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    // Back to the page they left, not to `/`. `detectSessionInUrl` above
    // consumes the fragment on arrival.
    options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
  })
  if (error) { clearSignInPending(); throw error }
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
  // An error is a resolution: the round trip came back, it just came back
  // badly. Clearing here is what keeps COD-293's "never came back" message
  // from firing on top of COD-290's "Google refused it" message — two
  // explanations for one event is worse than either alone.
  clearSignInPending()

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

/**
 * Sign out, on every device rather than only this one.
 *
 * `scope: 'global'` reverses the auth-js default of `'local'`, which drops the
 * session out of this browser's storage and leaves the refresh token valid
 * everywhere else. For a journal that is the wrong default: "sign me out" said
 * on a laptop you are handing back has to mean the phone-shaped copy of that
 * session dies too. The cost is that signing out of one device signs out of all
 * of them, which is what the words already promised.
 *
 * **What this deliberately does NOT do yet** is forget the sync passphrase.
 * `bujo:sync` survives sign-out, in plaintext, and it is the one secret that
 * opens the blob-sync copy of this journal (that target's storage path is
 * derived from the passphrase itself — `lib/crypto.ts`). Clearing it here is
 * the obvious fix and it is deferred on purpose: COD-309 is deciding whether
 * this app keeps a user-held key at all, and under a device-held key, wiping it
 * on sign-out would destroy the journal rather than protect it. Whichever way
 * that lands, this function is where it belongs.
 */
export async function signOut(): Promise<void> {
  await sb()?.auth.signOut({ scope: 'global' })
}

/**
 * Push the journal to this account's row.
 *
 * `forEgress` first, like every other network target — it drops the cycle log
 * and this device's sync secrets, and `egress.contract.test.ts` enforces that
 * this path calls it. **It matters more now, not less.** While the row was
 * ciphertext, a withheld domain that slipped through was at least unreadable
 * server-side; it is the only boundary left on this path, so it runs first,
 * before image inlining, so a withheld domain is never even assembled into the
 * payload.
 */
export type PushResult =
  /** Written. `updatedAt` is the server's new stamp — hold it for the next push. */
  | { ok: true; updatedAt: string }
  /**
   * Refused, because the row moved since `ifUnchangedSince`. Nothing was
   * written. The caller must pull, merge, and try again.
   */
  | { ok: false; reason: 'stale' }

/**
 * Push the journal to this account's row, **only if nobody else has written
 * it since we last looked.**
 *
 * ── Why this is not an upsert any more ────────────────────────────────────
 *
 * It was, and that made the account the only network writer in this app that
 * pushed blind. `App.tsx` (twice) and `ServerSync.tsx` all compare
 * `updatedAt` before writing; this path overwrote whatever was there.
 *
 * Two devices is all it takes. Phone pulls at 09:00 and sits in a pocket.
 * Laptop writes all morning. Phone wakes, its debounce fires, and it upserts
 * a 09:00 journal over the laptop's work — no error, no conflict, and the
 * laptop's next pull adopts the loss as the truth. The window is "between any
 * two pushes", which on a four-second debounce is most of the day.
 *
 * ── How it refuses ────────────────────────────────────────────────────────
 *
 * `update ... where id = me and updated_at = <what I last saw>`, then read
 * back how many rows that touched. Zero means the stamp moved, which means
 * somebody else wrote — so this returns `stale` rather than throwing, because
 * it is not an error: it is the mechanism working, and the caller's job is to
 * merge rather than to report a failure.
 *
 * `updated_at` is NOT sent on an update. The `journals_touch_updated_at`
 * trigger sets it server-side precisely so the ordering cannot be decided by
 * a client's clock, and `.select()` reads back the value it chose.
 *
 * `ifUnchangedSince: null` means "I pulled and the row did not exist", so
 * this inserts. A duplicate-key error there is the same race seen from the
 * other side — two devices both believing they are first — and is reported as
 * `stale` for the same reason.
 */
export async function pushAccount(
  data: JournalData,
  ifUnchangedSince: string | null,
): Promise<PushResult> {
  const c = sb()
  if (!c) throw new Error('Sign-in is not configured in this build.')
  const user = await currentUser()
  if (!user) throw new Error('Not signed in.')
  const { payload, skipped } = await inlineImagesWithinBudget(forEgress(data))

  if (ifUnchangedSince == null) {
    // No `owner` in the payload: the column defaults to `auth.uid()` and the
    // RLS `with check` refuses anything else, so it cannot be spoofed and does
    // not need to be trusted from here. Same rule as the self-host PostgREST
    // tier (docs/security/postgrest-hardening.md). `id` is sent because the
    // insert policy requires `id = auth.uid()` — a client that lies about it
    // is refused rather than believed.
    const { data: rows, error } = await c
      .from('journals')
      .insert({ id: user.id, data: payload })
      .select('updated_at')
    // 23505 is unique_violation: the row appeared between our pull and this
    // insert. Same race, other side.
    if (error) {
      if (error.code === '23505') return { ok: false, reason: 'stale' }
      throw error
    }
    if (skipped) notePhotosSkipped(skipped)
    return { ok: true, updatedAt: (rows?.[0]?.updated_at as string) ?? new Date().toISOString() }
  }

  const { data: rows, error } = await c
    .from('journals')
    .update({ data: payload })
    .eq('id', user.id)
    .eq('updated_at', ifUnchangedSince)
    .select('updated_at')
  if (error) throw error
  // Zero rows is the guard firing, not a failure to reach the server.
  if (!rows || rows.length === 0) return { ok: false, reason: 'stale' }
  if (skipped) notePhotosSkipped(skipped)
  return { ok: true, updatedAt: (rows[0].updated_at as string) ?? ifUnchangedSince }
}

/**
 * Read this account's journal back, or null when the account has never synced.
 *
 * **`null` means "no journal stored", and nothing else.** It is the one answer
 * that lets the caller overwrite the row, so every other outcome has to be
 * distinguishable from it: a transport error throws, and a row holding
 * something this build cannot use throws. A `catch` that turned either into
 * `null` would turn "I could not read your journal" into "you have no journal"
 * and then upload over it, which is the single failure `lib/accountSync.ts`
 * exists to prevent.
 *
 * The shape check is deliberately minimal — an object, not an array, not a
 * scalar. `migrate()` in `lib/storage.ts` is what actually reconciles an older
 * journal, and duplicating its knowledge here would give two places an opinion
 * about what a journal looks like. What this catches is a row left behind by a
 * *different* design: COD-271's `{v, salt, iv, data}` ciphertext, which is a
 * perfectly good object and is not a journal, and which `migrate` would happily
 * hand back as an empty one.
 */
export interface PullResult {
  /** The journal, or null when the account has never synced. */
  journal: JournalData | null
  /**
   * The server's stamp on the row we just read, or null when there was no row.
   *
   * This is the half that makes a safe push possible: it is the value the next
   * `pushAccount` sends as `ifUnchangedSince`, so a write can refuse if the
   * row moved underneath it. Reading the journal without carrying this is what
   * made the account the only blind writer in the app.
   */
  updatedAt: string | null
}

export async function pullAccount(): Promise<PullResult> {
  const c = sb()
  if (!c) return { journal: null, updatedAt: null }
  const user = await currentUser()
  if (!user) return { journal: null, updatedAt: null }
  const { data: row, error } = await c
    .from('journals')
    .select('data, updated_at')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  const seen = (row?.updated_at as string | undefined) ?? null
  const stored = row?.data as unknown
  if (stored == null) return { journal: null, updatedAt: seen }
  if (typeof stored !== 'object' || Array.isArray(stored)) {
    throw new Error('The stored journal is not in a format this version understands.')
  }
  if (isEncryptedBlob(stored)) {
    throw new Error(
      'This account still holds an encrypted journal from an older version of the app. '
      + 'Open it on a device that has the sync passphrase and export it, then sign in here again.',
    )
  }
  return { journal: await externalizeImages(stored as JournalData), updatedAt: seen }
}
