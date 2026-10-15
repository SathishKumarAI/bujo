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

describe('no credential is hardcoded into the source', () => {
  /**
   * This guard did not exist in the main tree — it was sitting in an agent
   * worktree, which is the same as not existing. Added once the project went
   * live, because that is the point at which a pasted key stops being
   * hypothetical.
   *
   * The two things that must never be committed, and why each is different:
   */

  it('contains no service_role key, in any spelling', () => {
    // A service_role key bypasses Row Level Security COMPLETELY. RLS is the
    // only thing making this app multi-tenant, so this one key undoes the
    // entire security model — it could read every user's row. It belongs in
    // no file, no comment and no test fixture.
    const offenders = scannable
      .filter(([, s]) => /service_role|SERVICE_ROLE|sb_secret_/.test(s))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('contains no hardcoded Supabase project URL', () => {
    // The URL is not itself a secret — it ships in the bundle via
    // `VITE_SUPABASE_URL`, by design. What this catches is someone pasting a
    // literal to "just make it work", which silently pins the build to one
    // project and takes the deployment out of the env vars that are supposed
    // to control it. `import.meta.env` is the only route in.
    const offenders = scannable
      .filter(([, s]) => /[a-z0-9]{15,}\.supabase\.co/.test(s))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('reads its configuration only from import.meta.env', () => {
    // Belt to the above braces: the client module is the one place allowed to
    // know how it is configured, and it must get that from the environment.
    const client = scannable.find(([p]) => p === CLIENT)
    expect(client, `${CLIENT} not found — has it moved?`).toBeDefined()
    expect(client![1]).toMatch(/import\.meta\.env\.VITE_SUPABASE_URL/)
    expect(client![1]).toMatch(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/)
  })
})


describe('the round trip takes the stronger of two defaults', () => {
  /**
   * Both assertions below are about a value auth-js would otherwise choose for
   * us, and in each case its choice is the weaker one. A silent revert — a
   * merge conflict resolved the wrong way, an options object rewritten — would
   * restore the weaker behaviour with nothing on screen and nothing in a log to
   * show for it. That is precisely the shape this file exists to catch.
   */
  const client = () => scannable.find(([p]) => p === CLIENT)?.[1] ?? ''

  it('asks for PKCE rather than taking the implicit default', () => {
    // Implicit returns the access token itself in `#access_token=…`. A URL is
    // the least private part of a browser — address bar, history, anything
    // that syncs or logs URLs, and handed to a service worker on every
    // navigation. PKCE trades a single-use `?code=` over a POST instead.
    const src = client()
    expect(src, `${CLIENT} not found — has it moved?`).not.toBe('')
    expect(code(src).some((l) => /flowType:\s*'pkce'/.test(l))).toBe(true)
  })

  it('signs out globally rather than taking the local default', () => {
    // auth-js defaults to `scope: 'local'`: the session leaves this browser and
    // the refresh token stays valid on every other device. For a journal that
    // is the wrong default — "sign me out" on a borrowed laptop has to reach
    // the phone too.
    const src = client()
    expect(code(src).some((l) => /signOut\(\{\s*scope:\s*'global'\s*\}\)/.test(l))).toBe(true)
  })

  it('has a service-worker reload guard that covers whichever parameter the flow uses', () => {
    // The cross-file half, and the reason this assertion is here rather than in
    // `swUpdate.test.ts`: changing `flowType` changes which parameter carries
    // the sign-in home, and a reload over it destroys the session before
    // `detectSessionInUrl` can persist it (COD-294). The guard must keep
    // matching BOTH, so neither direction of that change can reopen it.
    const sw = scannable.find(([p]) => p === './swUpdate.ts')?.[1] ?? ''
    expect(sw, 'swUpdate.ts not found — has it moved?').not.toBe('')
    const guard = code(sw).find((l) => /AUTH_PARAM\s*=/.test(l)) ?? ''
    expect(guard).toMatch(/access_token/)
    expect(guard).toMatch(/\bcode\b/)
  })
})

describe('what leaves for the account is bounded, even though it is no longer encrypted', () => {
  /**
   * ── This block asserted the opposite until COD-309 ────────────────────────
   *
   * It required `encryptString(` in the client and **forbade** a `data:`
   * column, on the grounds that a plain-JSONB row was the design
   * `docs/security/account-sync-plan.md` §0 explicitly rejected. That rejection
   * was reversed on request, and this test is re-aimed in the same commit
   * rather than deleted — the same move this file's own header describes making
   * when accounts came back. An assertion quietly dropped is a decision nobody
   * can find later.
   *
   * What survives the reversal is the half that was never about encryption:
   * **`forEgress` is the only boundary left**, so it matters more now, not
   * less. It strips the cycle log and this device's other sync tokens, and
   * under COD-271 anything that slipped past it was at least ciphertext on the
   * wire. There is no second line any more.
   */
  const client = () => scannable.find(([p]) => p === CLIENT)?.[1] ?? ''

  it('passes everything bound for the account through forEgress', () => {
    const src = client()
    expect(src, 'the client module is missing from the scan').not.toBe('')
    expect(src).toMatch(/forEgress\(/)
  })

  it('writes the journal to `data`, and no longer to `blob`', () => {
    // Pinned in both directions. A revert to `blob` here, with the schema left
    // on `data`, writes a column that does not exist — PostgREST answers that
    // with a 400, and the sync path swallows a 400 into `phase: 'error'`, which
    // on screen reads as "offline". Much cheaper to fail here.
    const src = client()
    expect(code(src).some((l) => /from\(['"]journals['"]\)/.test(l))).toBe(true)
    expect(code(src).some((l) => /\bdata:\s*payload\b/.test(l))).toBe(true)
    expect(code(src).some((l) => /\bblob\b/.test(l))).toBe(false)
  })

  it('never writes the row without saying what it expected to find', () => {
    // F-1. The account path was the only network writer in this app that
    // pushed blind: `App.tsx` (twice) and `ServerSync.tsx` all compare
    // `updatedAt` first, and this one upserted over whatever was there.
    //
    // Two devices is all it takes. Phone pulls at 09:00 and goes in a pocket,
    // laptop works all morning, phone wakes and its debounce overwrites the
    // lot — no error, and the laptop's next pull adopts the loss as truth.
    //
    // An `upsert` cannot express "only if unchanged", so its absence is the
    // assertion. The conditional update is `.eq('updated_at', …)`, and the
    // insert branch exists only for the no-row-yet case.
    const src = client()
    expect(code(src).some((l) => /\.upsert\(/.test(l)), 'a blind upsert is back').toBe(false)
    expect(code(src).some((l) => /\.eq\('updated_at', ifUnchangedSince\)/.test(l))).toBe(true)
    expect(src).toMatch(/ifUnchangedSince/)
  })

  it('reads the stamp back out, or a safe push is impossible', () => {
    // Half a guard is no guard: writing conditionally but never learning the
    // new stamp means the NEXT push sends a stale one and every write after
    // the first reports a conflict. The pull has to carry it too.
    const src = client()
    expect(code(src).some((l) => /select\('data, updated_at'\)/.test(l))).toBe(true)
    expect(src).toMatch(/updatedAt/)
  })

  it('still refuses a row left behind by the encrypted design', () => {
    // `isEncryptedBlob` is kept for exactly one purpose: a COD-271 row is a
    // perfectly good object and is NOT a journal, and `migrate()` would hand it
    // back as an empty one — which the sync path would then treat as readable
    // and upload over. The guard is three lines and the failure it prevents is
    // silent and total.
    expect(code(client()).some((l) => /isEncryptedBlob\(/.test(l))).toBe(true)
  })
})
