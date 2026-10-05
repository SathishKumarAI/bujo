import { describe, it, expect } from 'vitest'

/**
 * THE AUTH CONTRACT — now about the *shape* of sign-in, not its absence.
 *
 * ── What this file used to say, and why it changed ─────────────────────────
 *
 * Until COD-271 this test asserted that the app had **no accounts at all**: no
 * Supabase import, no `signInGoogle`, no credential input anywhere, zero
 * exceptions. That was a real decision (see `docs/AUTH.md` and
 * `docs/security/sync-hardening-plan.md` §0) and this test is what kept it.
 *
 * It was reversed on request: an account, Google sign-in, the journal reachable
 * from any device. The reversal is recorded in
 * `docs/security/account-sync-plan.md` rather than performed quietly, and this
 * file changed with the code rather than after it.
 *
 * **The instrument is not retired, it is re-aimed.** Deleting it would have
 * been the easy move and the wrong one, because the reason it existed is still
 * true: *the last implementation of sign-in in this app was copied into three
 * places* — `views/Account`, `views/Welcome`, `views/Settings` — plus two call
 * sites that bypassed the shared hook entirely. Removing it needed a tree-wide
 * sweep precisely because nothing had ever counted the copies.
 *
 * So the assertions now count. One module may talk to the auth backend; one
 * component may render a sign-in control. A fourth copy fails here instead of
 * being discovered by the next person who has to remove it.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Keys are relative to THIS file's directory: a sibling in `src/lib` is
 * `./supabase.ts` with no `lib/` segment, anything else is
 * `../components/…`. A pattern written `lib/supabase.ts` matches nothing and
 * every assertion built on it passes vacuously — the trap recorded at length in
 * `egress.contract.test.ts`, which cost a round of red there.
 */
const SELF = /auth\.contract\.test\.ts$/
const files = Object.entries(SOURCES).filter(
  ([p]) => !/\.test\.tsx?$/.test(p) || /auth\.contract/.test(p),
)
const scannable = files.filter(([p]) => !SELF.test(p))

/** The one module allowed to import the auth backend. */
const CLIENT = './supabase.ts'

const isComment = (l: string) => {
  const t = l.trimStart()
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')
}
const code = (src: string) => src.split('\n').filter((l) => !isComment(l))

describe('the auth backend has exactly one door', () => {
  it('scans the source tree', () => {
    // Tripwire for the key-shape trap above: a glob that matched nothing would
    // make every assertion in this file vacuously true.
    expect(scannable.length).toBeGreaterThan(50)
  })

  it('imports @supabase/supabase-js in one module only', () => {
    const importers = scannable
      .filter(([, src]) => code(src).some((l) => /from ['"]@supabase\/supabase-js['"]/.test(l)))
      .map(([p]) => p)
    expect(importers).toEqual([CLIENT])
  })

  it('calls the auth API in one module only', () => {
    // `supabase.auth.…` anywhere else means a second surface has grown its own
    // session handling, which is how the previous implementation ended up with
    // three copies that disagreed about recovery links.
    const offenders = scannable
      .filter(([p]) => p !== CLIENT)
      .filter(([, src]) => code(src).some((l) => /\.auth\.(signIn|signOut|getUser|getSession|onAuthStateChange)/.test(l)))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })
})

describe('sign-in is rendered in one place', () => {
  /**
   * Counted by the call, not by the word. `signInGoogle` is exported by the
   * client and may be *mentioned* in its own module; what must not spread is
   * the set of components that invoke it.
   */
  it('has at most one component calling signInGoogle', () => {
    const callers = scannable
      .filter(([p]) => p !== CLIENT)
      .filter(([, src]) => code(src).some((l) => /signInGoogle\s*\(/.test(l)))
      .map(([p]) => p)
    expect(callers.length).toBeLessThanOrEqual(1)
  })

  it('asks for no password or email of its own', () => {
    // Google is the only credential path. A hand-rolled email+password form is
    // what made the old implementation three forms deep, and it is also a
    // credential this project then has to be trusted with. The sync passphrase
    // and the passcode legitimately use `type="password"` to mask a field, so
    // the match is on `autoComplete`, which only a real credential form sets.
    const offenders = scannable
      .filter(([, src]) => /autoComplete=["'](current-password|new-password|email|username)["']/.test(src))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })
})

describe('the journal never reaches the account unencrypted', () => {
  /**
   * The property the whole design rests on, and the one most easily lost by a
   * well-meaning refactor: a push must encrypt, and it must go through the
   * egress boundary first.
   *
   * `egress.contract.test.ts` independently asserts that this module calls
   * `forEgress`, and its inventory tripwire fails on any NEW `lib` module that
   * types a `JournalData` and calls out. This is the other half: that what
   * leaves here is ciphertext.
   */
  it('encrypts in the client module', () => {
    const src = scannable.find(([p]) => p === CLIENT)?.[1]
    expect(src, 'the client module is missing from the scan').toBeDefined()
    expect(src!).toMatch(/encryptString\(/)
    expect(src!).toMatch(/forEgress\(/)
  })

  it('never selects or upserts a column holding a plain journal', () => {
    // The row holds `blob`. A `data` column would be the plaintext design that
    // `docs/security/account-sync-plan.md` §0 explicitly rejected, and this is
    // what would catch someone re-introducing it for convenience.
    const src = scannable.find(([p]) => p === CLIENT)?.[1] ?? ''
    expect(code(src).some((l) => /from\(['"]journals['"]\)/.test(l))).toBe(true)
    expect(src).not.toMatch(/\.upsert\(\s*\{[^}]*\bdata:\s*(?!null)/)
  })
})
