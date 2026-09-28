import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
/* Only the env-independent exports are imported statically. The four the
   first block exercises are re-imported inside it, after the env is stubbed. */
import { buildRow, JOURNALS_TABLE } from './supacloud'
import { decryptString, importPassphrase } from './crypto'
import { emptyJournal } from './storage'

/**
 * Two promises, both of which have to be checks rather than claims.
 *
 * 1. **With no Supabase configured the app is unchanged.** This is not a
 *    nicety — bujo is local-first, and a build with no backend must behave
 *    exactly as it did before this module existed.
 *
 *    The first block **stubs the environment** rather than relying on it being
 *    empty. It used to say "the vitest environment sets no `VITE_SUPABASE_*`",
 *    which is an assumption about an untracked file, not a check: vitest loads
 *    `.env`, so on any machine that actually has a project configured — a
 *    developer's, or anyone who followed `docs/AUTH.md` — both of these went
 *    red against correct code. It passed in CI only because CI has no `.env`.
 *    A test whose result depends on a file that is not in the repository is
 *    measuring the machine, not the code.
 *
 *    `URL` and `ANON` are module-level constants read at import time, so
 *    `vi.stubEnv` alone is not enough — the module has to be re-imported after
 *    the stub, which is what `vi.resetModules()` and the dynamic `import()`
 *    below are for.
 *
 * 2. **Nothing key-derived reaches the server.** `buildRow` is the only place
 *    that shapes an outgoing row, so asserting on its output covers the push
 *    path completely. The assertion is deliberately blunt: search the entire
 *    serialised payload for the passphrase and for the journal's own words.
 */
describe('with no Supabase configured', () => {
  /** Re-imported per test, because the module reads the env once at import. */
  const unconfigured = () => import('./supacloud')

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('reports itself unconfigured', async () => {
    expect((await unconfigured()).supabaseConfigured()).toBe(false)
  })

  it('never constructs a client, so the SDK is never even fetched', async () => {
    expect(await (await unconfigured()).getSupabase()).toBeNull()
  })

  it('answers "no account" instead of throwing', async () => {
    expect(await (await unconfigured()).currentAccount()).toBeNull()
  })

  it('signing out and subscribing are harmless no-ops', async () => {
    const m = await unconfigured()
    await expect(m.signOutAccount()).resolves.toBeUndefined()
    const off = await m.onAccountChange(() => { throw new Error('must never fire') })
    expect(() => off()).not.toThrow()
  })
})

describe('the row that goes to the server', () => {
  const PASS = 'correct-horse-battery-staple'
  const UID = '00000000-0000-4000-8000-000000000001'

  async function journalWithSecrets() {
    const j = emptyJournal()
    j.entries = [{
      id: 'e1', date: '2026-09-27', type: 'note', status: 'open',
      text: 'the therapist said something private',
      important: false, memory: false, tags: [], createdAt: '2026-09-27T09:00:00.000Z',
    }]
    return j
  }

  it('carries exactly three fields — user_id, ciphertext, updated_at', async () => {
    const { row } = await buildRow(UID, PASS, await journalWithSecrets())
    // A fourth field added without thinking about what it leaks is the failure
    // this guards. Sorted so the assertion does not depend on key order.
    expect(Object.keys(row).sort()).toEqual(['ciphertext', 'updated_at', 'user_id'])
  })

  it('is addressed by the user id, never by anything derived from the passphrase', async () => {
    const { row } = await buildRow(UID, PASS, await journalWithSecrets())
    expect(row.user_id).toBe(UID)
    // The blob path's locator is SHA-256('bujo-sync:' + passphrase). Assert the
    // account path does not smuggle one in: with a real user id there is no
    // reason to address a row by a function of the secret.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bujo-sync:' + PASS))
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    expect(JSON.stringify(row)).not.toContain(hex.slice(0, 40))
  })

  it('contains no trace of the passphrase or the journal in cleartext', async () => {
    const { row } = await buildRow(UID, PASS, await journalWithSecrets())
    const wire = JSON.stringify(row)
    expect(wire).not.toContain(PASS)
    expect(wire).not.toContain('therapist')
    expect(wire).not.toContain('private')
    expect(wire).not.toContain('"entries"')
  })

  it('leaks nothing through the PBKDF2 key either — it is not serialisable', async () => {
    // The push path can be handed a CryptoKey instead of a string. A key that
    // survived JSON.stringify would be a key on the wire.
    const key = await importPassphrase(PASS)
    const { row } = await buildRow(UID, key, await journalWithSecrets())
    expect(JSON.stringify(row)).not.toContain(PASS)
    expect(JSON.stringify(key)).toBe('{}')
  })

  it('round-trips: the ciphertext is the journal, and only the passphrase opens it', async () => {
    const journal = await journalWithSecrets()
    const { row } = await buildRow(UID, PASS, journal)
    const back = JSON.parse(await decryptString(JSON.parse(row.ciphertext), PASS))
    expect(back.entries[0].text).toBe('the therapist said something private')
    await expect(decryptString(JSON.parse(row.ciphertext), 'wrong-passphrase')).rejects.toThrow()
  })

  it('stamps updated_at as an ISO instant', async () => {
    const { row } = await buildRow(UID, PASS, emptyJournal())
    expect(Number.isNaN(Date.parse(row.updated_at))).toBe(false)
  })

  it('writes to the one table the migration creates', () => {
    expect(JOURNALS_TABLE).toBe('journals')
  })
})
