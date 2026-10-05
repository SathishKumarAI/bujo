import { put, list, copy, del } from '@vercel/blob'

// Serverless sync endpoint. The client sends a `code` (a hash of the user's
// secret passphrase — NOT the passphrase) and an already-**encrypted** payload,
// so the server only ever holds ciphertext at an unguessable path. Public blob
// store; security comes from (1) the unguessable path and (2) E2E encryption.
//
// That reasoning is sound for READS and says nothing about writes. The endpoint
// is unauthenticated by design, so before COD-266 a single POST replaced a
// journal permanently: `allowOverwrite: true`, in place, no history, no way
// back. The path being unguessable is not the same as the write being safe, and
// "sync is not a backup" (docs/AUTH.md) is a statement about version history,
// not a licence to have none at all.
//
// So each overwrite now leaves the previous payload behind at
// `sync/<code>/v<ms>.json`, three deep. `GET ?code=…&versions=1` lists them and
// `GET ?code=…&v=<ms>` reads one.
//
// ponytail: recovery, not concurrency. There is deliberately no compare-and-
// swap — and in this SDK version there could not be one: `PutCommandOptions`
// exposes no `ifMatch` (only `del` does), so a conditional write would mean
// hand-rolling the REST call. It would also buy less than it looks like: both
// clients already pull-before-push, and a prev-hash check stops no attacker,
// since anyone who can write can first read the hash. If two devices ever race
// hard enough to lose a write, the upgrade is an `ifMatch` put plus a 409 the
// client retries through `resolveIncoming`.

export const config = { runtime: 'nodejs' }

interface Req {
  method?: string
  query: Record<string, string | string[]>
  body?: { code?: string; payload?: string }
}
interface Res {
  status: (n: number) => Res
  json: (b: unknown) => void
  setHeader: (k: string, v: string) => void
  end: () => void
}

const ok = (c?: string) => typeof c === 'string' && /^[a-f0-9]{16,128}$/.test(c)

/** The live journal. */
const livePath = (code: string) => `sync/${code}.json`
/**
 * Prefix for this code's history. Note it cannot collide with the live blob:
 * `sync/<code>.json` is not a prefix of `sync/<code>/v…`, and vice versa, so a
 * `list` for either never sees the other.
 */
const histPrefix = (code: string) => `sync/${code}/v`

/** How many previous payloads to keep. */
const KEEP = 3
/**
 * Don't snapshot more often than this. Auto-sync pushes every 4 s of typing, so
 * a version per push would be thousands of near-identical blobs and five blob
 * operations on the hot path. Ten minutes is a real recovery timeline at two
 * operations per push, and the decision needs no extra request: `list` already
 * returns `uploadedAt`.
 */
const SNAPSHOT_EVERY_MS = 10 * 60_000

const ms = (d: Date) => new Date(d).getTime()
/** Newest first. */
const newestFirst = <T extends { uploadedAt: Date }>(b: T[]) =>
  [...b].sort((x, y) => ms(y.uploadedAt) - ms(x.uploadedAt))

/**
 * Copy the current payload into history, then prune to {@link KEEP}.
 *
 * Best-effort on purpose: a failure here must not fail the user's push. Losing
 * one history entry is a worse outcome than losing nothing, and a far better
 * one than refusing to save the journal.
 */
async function archive(code: string): Promise<void> {
  try {
    const hist = newestFirst((await list({ prefix: histPrefix(code) })).blobs)
    if (hist.length && Date.now() - ms(hist[0].uploadedAt) < SNAPSHOT_EVERY_MS) return
    const { blobs: live } = await list({ prefix: livePath(code), limit: 1 })
    if (!live.length) return // first write for this code — nothing to preserve
    await copy(live[0].url, `${histPrefix(code)}${Date.now()}.json`, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    })
    // The copy above now occupies the newest slot, so keep KEEP-1 of the old.
    const stale = hist.slice(KEEP - 1)
    if (stale.length) await del(stale.map((b) => b.url))
  } catch (e) {
    console.error('bujo/sync: archive failed', e)
  }
}

/**
 * Read a blob's text by pathname, or null when there is none.
 *
 * Still a prefix `list` rather than a `head`, as before. Both paths this is
 * called with are full pathnames ending `.json`, and neither can prefix the
 * other (see {@link histPrefix}), so the match is exact in practice. An
 * equality check on `blobs[0].pathname` was tried and removed: it adds no
 * safety and one failure mode, where a store returning a leading slash would
 * 404 a journal that exists — which reads as data loss.
 */
async function readAt(pathname: string): Promise<string | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 })
  if (!blobs.length) return null
  // Cache-bust: the blob URL is CDN-backed and we have just overwritten it.
  const r = await fetch(blobs[0].url + `?t=${Date.now()}`)
  return r.text()
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  const code = (req.method === 'GET' ? req.query.code : req.body?.code) as string
  if (!ok(code)) { res.status(400).json({ error: 'invalid code' }); return }

  try {
    if (req.method === 'POST') {
      const payload = req.body?.payload
      if (typeof payload !== 'string' || payload.length > 8_000_000) { res.status(400).json({ error: 'bad payload' }); return }
      await archive(code)
      await put(livePath(code), payload, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
      res.status(200).json({ ok: true })
      return
    }
    if (req.method === 'GET') {
      // `?versions=1` — what can be recovered, newest first. Timestamps only;
      // the payloads are ciphertext and cost a fetch each.
      if (req.query.versions) {
        const hist = newestFirst((await list({ prefix: histPrefix(code) })).blobs)
        res.status(200).json({
          versions: hist.map((b) => ({
            v: Number(b.pathname.slice(histPrefix(code).length, -'.json'.length)),
            savedAt: new Date(b.uploadedAt).toISOString(),
            bytes: b.size,
          })),
        })
        return
      }
      // `?v=<ms>` — one earlier payload, exactly as the live read returns one.
      const v = req.query.v
      const wanted = typeof v === 'string' && /^\d{10,16}$/.test(v)
        ? `${histPrefix(code)}${v}.json`
        : livePath(code)
      const text = await readAt(wanted)
      if (text == null) { res.status(404).json({ error: 'not found' }); return }
      res.status(200).json({ payload: text })
      return
    }
    res.status(405).json({ error: 'method' })
  } catch (e) {
    // The message used to be returned to the caller, which leaked store
    // internals to an unauthenticated endpoint. It goes to the function log.
    console.error('bujo/sync: request failed', e)
    res.status(500).json({ error: 'sync failed' })
  }
}
