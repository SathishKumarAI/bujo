import { describe, expect, it, vi } from 'vitest'

/**
 * COD-295. `detectSessionInUrl` only runs when a client exists while the OAuth
 * params are still in the URL, and `sb()` is lazy — so the sign-in used to
 * depend on some *component* asking for the user first. Every such component
 * sits under two gates that return instead of the tree:
 *
 *   `store.tsx`  if (!unlocked) return <LockScreen …/>    a passcode is set
 *   `App.tsx`    if (!mode)     return <Welcome />        no storage mode yet
 *
 * So returning from Google onto a locked journal dropped the session silently.
 * `initAuth()` is the unconditional call that closes it, and this file holds
 * the properties that make it safe to put before `createRoot`.
 *
 * ── These assertions are deliberately environment-agnostic ────────────────
 *
 * The first draft asserted `isConfigured() === false`, on the assumption that
 * the test env has no `VITE_SUPABASE_*`. **It has them**: Vite loads
 * `.env.local` for `vitest` as well as for a build, so this suite runs
 * *configured* on a machine with that file and *unconfigured* in CI, which has
 * no `.env.local`. A test that encodes either answer passes in one place and
 * fails in the other, and the first version of this file did exactly that.
 *
 * So what is asserted here is the relationship, which holds in both: a client
 * is constructed when and only when the build has a project, never throws, and
 * is made at most once.
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() } })),
}))

const { createClient } = await import('@supabase/supabase-js')
const { initAuth, isConfigured } = await import('./supabase')

describe('initAuth', () => {
  it('never throws, whether or not this build has a project', () => {
    // It runs before `createRoot` in `main.tsx`. A throw here is a white screen
    // on first load, and for every clone of this public repo that has not
    // configured Supabase it would be the *only* thing that ever happened.
    expect(() => initAuth()).not.toThrow()
  })

  it('builds a client exactly when the build is configured, and not otherwise', () => {
    const made = initAuth()
    expect(made).toBe(isConfigured())
    // The two halves of "absent, not broken": configured means a real client,
    // unconfigured means nothing was constructed at all.
    if (isConfigured()) expect(vi.mocked(createClient)).toHaveBeenCalled()
    else expect(vi.mocked(createClient)).not.toHaveBeenCalled()
  })

  it('is idempotent — the client is memoised, not rebuilt per call', () => {
    // `main.tsx` calls it once, but components call `sb()` again on every
    // mount. A second client would mean a second `detectSessionInUrl` and two
    // `onAuthStateChange` streams racing to publish the same session.
    const before = vi.mocked(createClient).mock.calls.length
    initAuth()
    initAuth()
    expect(vi.mocked(createClient).mock.calls.length).toBe(before)
  })
})
