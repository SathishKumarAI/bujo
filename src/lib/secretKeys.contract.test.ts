import { describe, expect, it } from 'vitest'
import { SYNC_SECRET_KEYS } from './csv'

/**
 * COD-299. **Every credential-shaped field in `Settings` must be on the strip
 * list**, and this reads the type to find them rather than trusting a human to
 * remember.
 *
 * `usdaKey` was not on the list. It is a user-supplied API credential living in
 * `settings`, so it rode out plaintext to a self-hosted PostgREST row, into a
 * GitHub gist and into Google Drive, and travelled inside the encrypted blob on
 * the two end-to-end paths — where "two people share one passphrase" is a
 * documented setup, so they shared each other's key too.
 *
 * Nothing failed when it was missing. `stripSyncSecrets` had tests, and they
 * asserted that the six keys *on* the list get removed — which is the half that
 * cannot catch a seventh being forgotten. A fixture test proves the mechanism;
 * only a completeness test proves the list.
 *
 * This is the same shape as `egress.contract.test.ts` (enumerate destinations,
 * do not count adopters) and `viewChrome.test.ts` (assert the gate's id list
 * against the app's registry) — and the same lesson as the `BottomNav.PRIMARY`
 * trap: a hand-written list resolved against another source drifts, silently,
 * and the drift is only ever found by a test that regenerates the list.
 *
 * ── Why it parses the type instead of importing it ─────────────────────────
 *
 * TypeScript interfaces do not exist at runtime, so there is no object to
 * reflect over. Reading the source is the honest option; the alternative is a
 * second hand-written list of "fields that are secrets", which is the very
 * thing being guarded against.
 */
const SETTINGS_SRC = (await import('./types.ts?raw')).default as string

/** Field names in `Settings` that look like a credential. */
function credentialFields(src: string): string[] {
  const start = src.indexOf('export interface Settings')
  expect(start, 'the Settings interface moved or was renamed').toBeGreaterThan(-1)
  // To the first line that closes the interface at column 0.
  const end = src.indexOf('\n}', start)
  const body = src.slice(start, end)
  const names = [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\??\s*:/gm)].map((m) => m[1])
  return names.filter((n) => /token|key|secret|password|clientid|credential/i.test(n))
}

describe('every credential in settings is stripped before the journal leaves', () => {
  it('finds the credential fields at all — the parser must not silently match nothing', () => {
    // A regex that stops matching turns this whole file into a test that passes
    // by finding nothing, which is the failure mode it exists to prevent.
    const found = credentialFields(SETTINGS_SRC)
    expect(found.length, 'parsed zero credential fields — the Settings shape changed').toBeGreaterThanOrEqual(4)
    expect(found).toContain('githubToken')
    expect(found).toContain('usdaKey')
  })

  it('names every one of them on SYNC_SECRET_KEYS', () => {
    const missing = credentialFields(SETTINGS_SRC).filter(
      (f) => !(SYNC_SECRET_KEYS as readonly string[]).includes(f),
    )
    expect(
      missing,
      `these settings fields look like credentials and are NOT stripped before egress: ${missing.join(', ')}. `
      + 'Add them to SYNC_SECRET_KEYS in lib/csv.ts, or rename the field if it is not a secret.',
    ).toEqual([])
  })

  it('keeps the two non-obvious entries that a name check would miss', () => {
    // `selfHostUrl`, `githubGistId` and `googleEmail` are on the list and do NOT
    // match the credential-name pattern: a URL and an id locate someone's
    // private store, and the email identifies them. The name heuristic is a
    // floor, not the definition — deleting these because the regex does not
    // demand them would be reading this test backwards.
    for (const k of ['selfHostUrl', 'githubGistId', 'googleEmail']) {
      expect(SYNC_SECRET_KEYS as readonly string[], `${k} must stay on the strip list`).toContain(k)
    }
  })
})
