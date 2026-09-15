import { describe, it, expect } from 'vitest'

/**
 * bujo has no accounts, and this is the check that keeps it that way.
 *
 * Sign-in was not in one place when it was removed — it was in **three copies
 * of the same form** (`views/Account`, `views/Welcome`, `views/Settings`) plus
 * two more direct call sites (`shell/AccountMenu`, `ExploreBanner`) that went
 * around the shared hook entirely. A partial removal is worse than none: it
 * leaves two surfaces making contradictory promises about whether the app has
 * accounts, and nothing in the toolchain objects to that.
 *
 * So this asserts the *absence* of an auth surface, which is the only shape of
 * assertion that survives someone re-adding one in a fourth place.
 *
 * There are no exceptions any more. The one-time rescue for a journal
 * stranded in the retired backend used to be one — `lib/supabase.ts` and
 * `lib/legacyAccount.ts`, read-and-close — and both are gone: the Supabase
 * project itself no longer resolves (NXDOMAIN, measured 2026-09-15), so the
 * rescue answered "nothing to bring across" for everyone regardless of whether
 * they had a journal there. A carve-out for a path that cannot succeed is a
 * hole in this contract and nothing else.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * This file only — it names the things it forbids, so it matches itself.
 *
 * Matched on the basename: `import.meta.glob` keys are relative to *this*
 * file's directory, so a path-prefixed pattern silently matches nothing, which
 * would make every assertion below vacuously pass instead of failing. That trap
 * cost a real exception once; keep the basename form.
 */
const ALLOWED = [/auth\.contract\.test\.ts$/]

const files = Object.entries(SOURCES).filter(
  ([p]) => !/\.test\.tsx?$/.test(p) || /auth\.contract/.test(p),
)

const scannable = files.filter(([p]) => !ALLOWED.some((re) => re.test(p)))

describe('the app has no accounts', () => {
  it('scans the source tree', () => {
    expect(scannable.length).toBeGreaterThan(50)
  })

  it('imports no auth backend at all', () => {
    const offenders = scannable
      .filter(([, src]) => /from ['"].*lib\/supabase['"]|@supabase\/supabase-js/.test(src))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('has no sign-in, sign-up or OAuth entry point', () => {
    // Word-boundary matched on purpose: "Signed out" in prose is fine, a
    // `signInGoogle(` call is not.
    const BANNED = /\b(signInGoogle|signInEmail|signUpEmail|signInGuest|resetPassword|updatePassword|onAuthChange|onPasswordRecovery|useAuthForm)\b/
    const offenders = scannable.filter(([, src]) => BANNED.test(src)).map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('asks for no password or email from the user', () => {
    // A password INPUT is the giveaway. The sync passphrase and the passcode
    // both legitimately use `type="password"` to mask the field, so those are
    // matched by name and allowed — what must not exist is a login credential.
    const offenders = scannable
      .filter(([, src]) => /autoComplete=["'](current-password|new-password|email|username)["']/.test(src))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })
})
