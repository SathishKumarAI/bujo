import { describe, it, expect } from 'vitest'

/**
 * **This file used to assert that bujo has no accounts. It no longer can.**
 *
 * That contract was right for what the app was: sign-in had been added in
 * *three copies of the same form* (`views/Account`, `views/Welcome`,
 * `views/Settings`) plus two direct call sites that went around the shared
 * hook, and a partial removal leaves two surfaces making contradictory
 * promises with nothing in the toolchain objecting. Asserting the *absence* of
 * an auth surface was the only shape that survived someone re-adding one in a
 * fourth place.
 *
 * Accounts are back, deliberately and under a narrower posture, so the
 * assertion has to change shape rather than be deleted. **What is defended is
 * no longer "there is no login" but "the login learns nothing".** The rules
 * below are the ones that, if broken, hand someone's journal to a server:
 *
 * | Rule | The failure it catches |
 * |---|---|
 * | One module talks to Supabase | A second call site that forgets to encrypt |
 * | The SDK is dynamically imported | An unconfigured build shipping and running a backend client |
 * | No password is ever collected | A credential to store, leak and reset, for a login whose only job is naming a row |
 * | No plaintext journal field on the wire | `data: jsonb` — the shape the retired schema actually had |
 * | The passphrase is never stored | F-8, the whole reason `lib/syncKey.ts` exists |
 *
 * Keep the sweep source-level. A rendering test cannot see a call site that
 * only runs when a project is configured, and this suite runs with none.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Matched on the basename: `import.meta.glob` keys are relative to *this*
 * file's directory, so a path-prefixed pattern silently matches nothing, which
 * would make every assertion below vacuously pass instead of failing. That trap
 * cost a real exception once; keep the basename form.
 */
const isSelf = (p: string) => /auth\.contract\.test\.ts$/.test(p)
/** The one module allowed to speak Supabase, and the one allowed to store a key. */
const isSupacloud = (p: string) => /(^|[./\\])supacloud\.ts$/.test(p)
const isSyncKey = (p: string) => /(^|[./\\])syncKey\.ts$/.test(p)

const files = Object.entries(SOURCES).filter(
  ([p]) => !/\.test\.tsx?$/.test(p) || isSelf(p),
)
const scannable = files.filter(([p]) => !isSelf(p))

describe('accounts are identity only', () => {
  it('scans the source tree', () => {
    expect(scannable.length).toBeGreaterThan(50)
  })

  it('has exactly one module that can reach the Supabase SDK at runtime', () => {
    // Type-only imports are erased by `verbatimModuleSyntax` and carry no
    // runtime reach — `import type { User }` cannot call `createClient`. So the
    // rule is about *value* imports: every other file must get its client from
    // `getSupabase()`, which is the single place that checks configuration and
    // the single place that can be told to encrypt first.
    const runtimeImporters = scannable
      // `[^\n]*`, not `[^;]*`: a negated class matches newlines too, so the
      // looser version walked from an unrelated `import { useState }` on one
      // line to the `@supabase` specifier on the next and reported both
      // type-only importers as runtime ones. A multiline regex that is not
      // anchored at both ends is a regex that matches the wrong line.
      .filter(([, src]) => /^\s*import\s+(?!type\b)[^\n]*['"]@supabase\/supabase-js['"]/m.test(src))
      .map(([p]) => p)
    expect(runtimeImporters).toEqual([])

    const dynamicImporters = scannable
      .filter(([, src]) => /import\(\s*['"]@supabase\/supabase-js['"]\s*\)/.test(src))
      .map(([p]) => p)
    expect(dynamicImporters.filter((p) => !isSupacloud(p))).toEqual([])
    expect(dynamicImporters).toHaveLength(1)
  })

  it('loads the SDK behind a dynamic import, so an unconfigured build never fetches it', () => {
    const src = scannable.find(([p]) => isSupacloud(p))?.[1] ?? ''
    expect(src).toMatch(/await import\(|import\(['"]@supabase\/supabase-js['"]\)/)
    expect(src).toMatch(/supabaseConfigured\(\)/)
  })

  it('reads its configuration from env vars only — no URL or key in the source', () => {
    const offenders = scannable
      .filter(([, s]) => /https:\/\/[a-z0-9-]+\.supabase\.co/.test(s))
      .map(([p]) => p)
    expect(offenders).toEqual([])
    // A service_role key would bypass RLS entirely. It must not exist here in
    // any form, including as a VITE_ variable that would be compiled in.
    const leaky = scannable.filter(([, s]) => /service_role|SERVICE_ROLE/.test(s)).map(([p]) => p)
    expect(leaky).toEqual([])
  })

  it('asks for no password, anywhere', () => {
    // A password INPUT is the giveaway. The sync passphrase and the passcode
    // both legitimately use `type="password"` to mask the field, so those are
    // matched by autocomplete intent instead — what must not exist is a login
    // credential. `email` is allowed now: the magic link needs an address, and
    // labelling it correctly is an accessibility requirement.
    const offenders = scannable
      .filter(([, src]) => /autoComplete=["'](current-password|new-password)["']/.test(src))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('has no password reset or password sign-in path', () => {
    const BANNED = /\b(signInWithPassword|signUpWithPassword|resetPasswordForEmail|updatePassword|onPasswordRecovery)\b/
    const offenders = scannable.filter(([, src]) => BANNED.test(src)).map(([p]) => p)
    expect(offenders).toEqual([])
  })
})

describe('the server cannot read the journal', () => {
  it('never puts a plaintext journal field on a Supabase row', () => {
    const src = scannable.find(([p]) => isSupacloud(p))?.[1] ?? ''
    expect(src).toContain('ciphertext')
    // The retired schema had `data jsonb not null` — the journal, readable,
    // server-side. Named here so re-introducing it fails a test, not a review.
    expect(src).not.toMatch(/\bdata:\s*(data|journal|payload)\b/)
  })

  it('encrypts before every send', () => {
    const src = scannable.find(([p]) => isSupacloud(p))?.[1] ?? ''
    const sendsAt = src.indexOf('.upsert(')
    const encryptsAt = src.indexOf('encryptString')
    expect(encryptsAt).toBeGreaterThan(-1)
    expect(sendsAt).toBeGreaterThan(encryptsAt)
  })

  it('stores no passphrase in localStorage — F-8 stays fixed', () => {
    // `bujo:sync` held the passphrase in the clear beside the ciphertext it
    // opens. The only file allowed to touch that key is the one that deletes it.
    //
    // Matched on the localStorage CALL, not on the string: `bujo:sync` is also
    // the name of the CustomEvent `SyncIndicator` listens for, so a plain
    // substring search named six innocent files — including two that only
    // mention the key in a comment explaining that it is gone. A grep for a
    // string is not a grep for a use.
    const USES = /localStorage\.(get|set|remove)Item\(\s*['"]bujo:sync['"]/
    const offenders = scannable
      .filter(([p, src]) => !isSyncKey(p) && USES.test(src))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('imports the passphrase non-extractably wherever a key is kept', () => {
    const src = scannable.find(([p]) => isSyncKey(p))?.[1] ?? ''
    expect(src).toContain('importPassphrase')
    // The call, not the word — the docstring names `exportKey` to explain that
    // it rejects, and a grep for the name would flag the explanation.
    expect(src).not.toMatch(/subtle\.exportKey\(/)
    // Storing the passphrase string would be the regression. The only
    // localStorage write here is the locator.
    const writes = [...src.matchAll(/localStorage\.setItem\(([^,]+),/g)].map((m) => m[1].trim())
    expect(writes).toEqual(['SYNC_CODE_KEY'])
  })
})
