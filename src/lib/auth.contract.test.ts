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
 * `lib/legacyAccount.ts` and `lib/supabase.ts` are the deliberate exceptions:
 * the one-time rescue for a journal stranded in the retired backend. They are
 * read-and-close only — see the header of `supabase.ts`.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * The rescue path, and this file.
 *
 * Matched on the basename: `import.meta.glob` keys are relative to *this*
 * file's directory, so `lib/supabase.ts` arrives as `./supabase.ts` and a
 * path-prefixed pattern silently matches nothing — which would have made every
 * assertion below vacuously pass instead of failing.
 */
const ALLOWED = [/(^|\/)supabase\.ts$/, /(^|\/)legacyAccount\.ts$/, /auth\.contract\.test\.ts$/]

const files = Object.entries(SOURCES).filter(
  ([p]) => !/\.test\.tsx?$/.test(p) || /auth\.contract/.test(p),
)

const scannable = files.filter(([p]) => !ALLOWED.some((re) => re.test(p)))

describe('the app has no accounts', () => {
  it('scans the source tree', () => {
    expect(scannable.length).toBeGreaterThan(50)
  })

  it('imports no auth backend outside the one-time rescue path', () => {
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
