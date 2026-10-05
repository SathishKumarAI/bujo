import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { pullCloud, pushCloud } from './bujocloud'
import { deriveCode, encryptString, legacyCode } from './crypto'
import { emptyJournal } from './storage'
import type { JournalData } from './types'

/**
 * The v1→v2 path migration (COD-267), and the first tests this module has had.
 *
 * Worth more than the usual care because the failure mode is not an error: if
 * the fallback is wrong, a user who synced before this release is told
 * "nothing stored for that passphrase yet" and handed a fresh empty blob, which
 * from the chair is indistinguishable from their journal having been deleted.
 * Nothing in the app would log, throw or go red.
 */

const PASS = 'correct-horse-battery'

/** A fake blob store keyed by sync code, plus a log of what was asked for. */
let store: Record<string, string>
let seen: { method: string; code: string | null }[]

const journal = (note: string): JournalData => {
  const j = emptyJournal()
  j.entries = [{
    id: 'e1', date: '2026-10-01', type: 'note', text: note,
    status: 'open', important: false, memory: false, tags: [], createdAt: '2026-10-01',
  }]
  return j
}

beforeEach(() => {
  store = {}
  seen = []
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (method === 'POST') {
      const body = JSON.parse(String(init!.body))
      seen.push({ method, code: body.code })
      store[body.code] = body.payload
      return { ok: true, status: 200, json: async () => ({ ok: true }) }
    }
    const headers = (init?.headers ?? {}) as Record<string, string>
    const code = headers['x-sync-code'] ?? null
    seen.push({ method, code })
    const payload = code ? store[code] : undefined
    if (payload === undefined) return { ok: false, status: 404, json: async () => ({ error: 'not found' }) }
    return { ok: true, status: 200, json: async () => ({ payload }) }
  })
})
afterEach(() => vi.unstubAllGlobals())

/**
 * Put a journal at the **v1 path**, which is the half of "a pre-COD-267 client"
 * these tests are about. The payload itself is written with `encryptString`, so
 * it is a v2 blob at a v1 path — deliberately, because the round-count half of
 * the migration is a separate question and is covered in `crypto.test.ts`
 * against a hand-built v1 blob. Mixing both into one fixture here would mean a
 * failure could not say which half broke.
 */
async function seedLegacy(data: JournalData) {
  const code = await legacyCode(PASS)
  store[code] = JSON.stringify(await encryptString(JSON.stringify(data), PASS))
  return code
}

describe('a journal synced before the path changed is still found', () => {
  it('falls back to the v1 code when the new path is empty', async () => {
    await seedLegacy(journal('written by the old client'))
    const got = await pullCloud(PASS)
    expect(got?.entries[0].text).toBe('written by the old client')
  })

  it('asks the new path FIRST, and only then the old one', async () => {
    await seedLegacy(journal('old'))
    await pullCloud(PASS)
    const gets = seen.filter((s) => s.method === 'GET').map((s) => s.code)
    expect(gets[0]).toBe(await deriveCode(PASS))
    expect(gets[1]).toBe(await legacyCode(PASS))
  })

  it('moves it to the new path, re-encrypted, after a successful read', async () => {
    await seedLegacy(journal('migrate me'))
    await pullCloud(PASS)
    const next = await deriveCode(PASS)
    expect(store[next], 'the journal should now exist at the derived path').toBeDefined()
    expect(JSON.parse(store[next]).v).toBe(2)
    // Re-encrypted, not copied: a fresh salt means different bytes.
    expect(store[next]).not.toBe(store[await legacyCode(PASS)])
    const again = await pullCloud(PASS)
    expect(again?.entries[0].text).toBe('migrate me')
  })

  it('leaves the old blob alone, deliberately', async () => {
    // Deleting it would not undo the exposure — the weak code is derivable from
    // the passphrase with or without a blob behind it — and would need an
    // unauthenticated DELETE. See the note on `pullCloud`.
    const legacy = await seedLegacy(journal('x'))
    await pullCloud(PASS)
    expect(store[legacy]).toBeDefined()
  })

  it('still returns the journal when the move fails', async () => {
    // The read already succeeded. A failed migration must not turn a good pull
    // into an error; the next pull tries again.
    await seedLegacy(journal('read me anyway'))
    const real = globalThis.fetch
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) =>
      (init?.method === 'POST'
        ? { ok: false, status: 500, json: async () => ({ error: 'nope' }) }
        : (real as typeof fetch)(url, init)),
    )
    const got = await pullCloud(PASS)
    expect(got?.entries[0].text).toBe('read me anyway')
  })

  it('returns null when neither path has anything', async () => {
    expect(await pullCloud(PASS)).toBeNull()
  })

  it('does not look for a v1 blob once one exists at the new path', async () => {
    await pushCloud(PASS, journal('current'))
    seen = []
    const got = await pullCloud(PASS)
    expect(got?.entries[0].text).toBe('current')
    expect(seen.filter((s) => s.method === 'GET')).toHaveLength(1)
  })
})

describe('push writes only to the derived path', () => {
  it('never writes to the v1 code', async () => {
    await pushCloud(PASS, journal('new'))
    expect(seen.filter((s) => s.method === 'POST').map((s) => s.code))
      .toEqual([await deriveCode(PASS)])
    expect(store[await legacyCode(PASS)]).toBeUndefined()
  })

  it('sends the code in a header on reads, never in the URL', async () => {
    // The point of the change: a query string is logged by somebody else.
    await pushCloud(PASS, journal('x'))
    const urls: string[] = []
    const real = globalThis.fetch
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      urls.push(url)
      return (real as typeof fetch)(url, init)
    })
    await pullCloud(PASS)
    expect(urls.every((u) => !u.includes('code='))).toBe(true)
    expect(urls.every((u) => u === '/api/sync')).toBe(true)
  })
})
