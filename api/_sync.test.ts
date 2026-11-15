import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * The bookkeeping behind COD-266, against a fake blob store.
 *
 * Worth testing rather than eyeballing because every assertion here is about a
 * *destructive* path — which copy is kept, which is deleted, and whether a
 * failure in the bookkeeping can take the user's push down with it. Those are
 * exactly the branches that are invisible until the day someone needs them.
 *
 * `api/` was typechecked by nothing until this change (`tsconfig.app.json`
 * includes only `src`), so this file is also the first thing of any kind to
 * read this handler.
 */

interface FakeBlob { pathname: string; url: string; uploadedAt: Date; size: number }

const store = { blobs: [] as FakeBlob[] }
const calls = { put: [] as string[], copy: [] as [string, string][], del: [] as string[][] }
let failArchive = false

vi.mock('@vercel/blob', () => ({
  list: async ({ prefix, limit }: { prefix: string; limit?: number }) => {
    if (failArchive && prefix.includes('/v')) throw new Error('store unavailable')
    const blobs = store.blobs.filter((b) => b.pathname.startsWith(prefix))
    return { blobs: limit ? blobs.slice(0, limit) : blobs, hasMore: false }
  },
  put: async (pathname: string, body: string) => {
    calls.put.push(pathname)
    store.blobs = store.blobs.filter((b) => b.pathname !== pathname)
    store.blobs.push({ pathname, url: `https://blob.test/${pathname}`, uploadedAt: new Date(), size: body.length })
    return { pathname }
  },
  copy: async (fromUrl: string, toPathname: string) => {
    calls.copy.push([fromUrl, toPathname])
    store.blobs.push({ pathname: toPathname, url: `https://blob.test/${toPathname}`, uploadedAt: new Date(), size: 1 })
    return { pathname: toPathname }
  },
  del: async (urls: string | string[]) => {
    const list = Array.isArray(urls) ? urls : [urls]
    calls.del.push(list)
    store.blobs = store.blobs.filter((b) => !list.includes(b.url))
  },
}))

const { default: handler } = await import('./sync')

const CODE = 'a'.repeat(40)
const live = `sync/${CODE}.json`
const hist = (ms: number) => `sync/${CODE}/v${ms}.json`

/** Minimal stand-in for the serverless req/res pair the handler is typed against. */
function call(req: {
  method: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) {
  const out: { code?: number; body?: unknown } = {}
  const res = {
    status(n: number) { out.code = n; return res },
    json(b: unknown) { out.body = b },
    setHeader() {},
    end() {},
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return handler({ query: {}, ...req } as any, res as any).then(() => out)
}

const seed = (pathname: string, agoMs = 0) =>
  store.blobs.push({
    pathname,
    url: `https://blob.test/${pathname}`,
    uploadedAt: new Date(Date.now() - agoMs),
    size: 10,
  })

beforeEach(() => {
  store.blobs = []
  calls.put = []; calls.copy = []; calls.del = []
  failArchive = false
  vi.stubGlobal('fetch', async (u: string) => ({ text: async () => `payload-of:${u.split('?')[0]}` }))
})

describe('a write never destroys the only copy', () => {
  it('archives the current payload before overwriting it', async () => {
    seed(live, 60 * 60_000) // an hour old, so no fresh snapshot exists
    const r = await call({ method: 'POST', body: { code: CODE, payload: 'new-ciphertext' } })
    expect(r.code).toBe(200)
    expect(calls.copy).toHaveLength(1)
    expect(calls.copy[0][0]).toBe(`https://blob.test/${live}`)
    expect(calls.copy[0][1]).toMatch(new RegExp(`^sync/${CODE}/v\\d+\\.json$`))
    expect(calls.put).toEqual([live])
  })

  it('archives nothing on the first write for a code', async () => {
    // Nothing to preserve, and an empty history must not become a 500.
    const r = await call({ method: 'POST', body: { code: CODE, payload: 'first' } })
    expect(r.code).toBe(200)
    expect(calls.copy).toEqual([])
    expect(calls.put).toEqual([live])
  })

  it('does not snapshot again within the throttle window', async () => {
    // Auto-sync pushes every 4s of typing. Without this, a day at the keyboard
    // is thousands of near-identical blobs.
    seed(live)
    seed(hist(Date.now() - 60_000), 60_000) // one minute old
    const r = await call({ method: 'POST', body: { code: CODE, payload: 'again' } })
    expect(r.code).toBe(200)
    expect(calls.copy).toEqual([])
    expect(calls.put).toEqual([live]) // the push itself still lands
  })

  it('snapshots again once the window has passed', async () => {
    seed(live)
    seed(hist(1), 11 * 60_000) // eleven minutes old
    await call({ method: 'POST', body: { code: CODE, payload: 'again' } })
    expect(calls.copy).toHaveLength(1)
  })

  it('keeps three versions and deletes only what is beyond them', async () => {
    seed(live)
    seed(hist(1), 40 * 60_000)
    seed(hist(2), 30 * 60_000)
    seed(hist(3), 20 * 60_000)
    await call({ method: 'POST', body: { code: CODE, payload: 'p' } })
    // The fresh copy takes the newest slot, so the two newest OLD ones stay and
    // the oldest goes. Off-by-one here would silently keep two or four.
    expect(calls.del).toHaveLength(1)
    expect(calls.del[0]).toEqual([`https://blob.test/${hist(1)}`])
    const kept = store.blobs.filter((b) => b.pathname.includes('/v')).map((b) => b.pathname)
    expect(kept).toHaveLength(3)
    expect(kept).toContain(hist(2))
    expect(kept).toContain(hist(3))
  })

  it('still saves the journal when the bookkeeping fails', async () => {
    // The whole point: history is best-effort. A store hiccup while archiving
    // must not turn into "your journal did not save".
    failArchive = true
    seed(live, 60 * 60_000)
    const r = await call({ method: 'POST', body: { code: CODE, payload: 'must-land' } })
    expect(r.code).toBe(200)
    expect(calls.put).toEqual([live])
  })
})

describe('what was archived can be read back', () => {
  it('lists versions newest first, with timestamps and sizes', async () => {
    seed(hist(1000000000000), 30 * 60_000)
    seed(hist(2000000000000), 10 * 60_000)
    const r = await call({ method: 'GET', query: { code: CODE, versions: '1' } })
    expect(r.code).toBe(200)
    const vs = (r.body as { versions: { v: number }[] }).versions
    expect(vs.map((x) => x.v)).toEqual([2000000000000, 1000000000000])
    expect(vs[0]).toHaveProperty('savedAt')
    expect(vs[0]).toHaveProperty('bytes', 10)
  })

  it('reads one earlier payload by its timestamp', async () => {
    seed(hist(1700000000000))
    const r = await call({ method: 'GET', query: { code: CODE, v: '1700000000000' } })
    expect(r.code).toBe(200)
    expect(r.body).toEqual({ payload: `payload-of:https://blob.test/${hist(1700000000000)}` })
  })

  it('reads the live payload when no version is asked for', async () => {
    seed(live)
    const r = await call({ method: 'GET', query: { code: CODE } })
    expect(r.body).toEqual({ payload: `payload-of:https://blob.test/${live}` })
  })

  it('falls back to the live payload rather than guessing at a junk version', async () => {
    seed(live)
    const r = await call({ method: 'GET', query: { code: CODE, v: 'not-a-timestamp' } })
    expect(r.code).toBe(200)
    expect(r.body).toEqual({ payload: `payload-of:https://blob.test/${live}` })
  })

  it('404s a version that does not exist', async () => {
    seed(live)
    const r = await call({ method: 'GET', query: { code: CODE, v: '1234567890123' } })
    expect(r.code).toBe(404)
  })
})

describe('the code arrives in a header now, and in a query string for one release', () => {
  /**
   * COD-267. A code in a query string is a secret written into serverless
   * access logs, CDN logs, browser history and `Referer` headers — and
   * possession of the code is what makes the passphrase cheap to attack. The
   * query arm stays only so a bundle cached before that release keeps syncing.
   */
  it('reads the code from x-sync-code', async () => {
    seed(live)
    const r = await call({ method: 'GET', headers: { 'x-sync-code': CODE } })
    expect(r.code).toBe(200)
    expect(r.body).toEqual({ payload: `payload-of:https://blob.test/${live}` })
  })

  it('still reads a legacy ?code= query', async () => {
    seed(live)
    expect((await call({ method: 'GET', query: { code: CODE } })).code).toBe(200)
  })

  it('prefers the header when both are present', async () => {
    // So a proxy that keeps forwarding an old query string cannot pin a client
    // to the legacy path once it has started sending the header.
    seed(live)
    const r = await call({
      method: 'GET',
      headers: { 'x-sync-code': CODE },
      query: { code: 'f'.repeat(40) },
    })
    expect(r.body).toEqual({ payload: `payload-of:https://blob.test/${live}` })
  })

  it('accepts the header on a POST too', async () => {
    const r = await call({ method: 'POST', headers: { 'x-sync-code': CODE }, body: { payload: 'p' } })
    expect(r.code).toBe(200)
    expect(calls.put).toEqual([live])
  })
})

describe('the endpoint still refuses what it always refused', () => {
  it('rejects a code that is not hex', async () => {
    expect((await call({ method: 'GET', query: { code: 'not-hex!' } })).code).toBe(400)
    expect((await call({ method: 'POST', body: { code: 'xyz', payload: 'p' } })).code).toBe(400)
  })

  it('rejects a payload over the size cap', async () => {
    const r = await call({ method: 'POST', body: { code: CODE, payload: 'x'.repeat(8_000_001) } })
    expect(r.code).toBe(400)
  })

  it('rejects a method it does not serve, however the code arrived', async () => {
    // Was asymmetric before COD-267: the code came from the BODY for anything
    // that was not a GET, so a DELETE carrying it in the query string was
    // refused as a bad code (400) and never reached the 405. `codeFrom` reads
    // all three sources for every method, so the two agree now.
    expect((await call({ method: 'DELETE', body: { code: CODE } })).code).toBe(405)
    expect((await call({ method: 'DELETE', query: { code: CODE } })).code).toBe(405)
    expect((await call({ method: 'DELETE', headers: { 'x-sync-code': CODE } })).code).toBe(405)
  })

  it('does not hand the caller the store error text', async () => {
    // It used to return `(e as Error).message` to an unauthenticated endpoint.
    vi.stubGlobal('fetch', async () => { throw new Error('secret-internal-detail') })
    seed(live)
    const r = await call({ method: 'GET', query: { code: CODE } })
    expect(r.code).toBe(500)
    expect(JSON.stringify(r.body)).not.toContain('secret-internal-detail')
    expect(r.body).toEqual({ error: 'sync failed' })
  })
})
