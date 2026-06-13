import { put, list } from '@vercel/blob'

// Serverless sync endpoint. The client sends a `code` (a hash of the user's
// secret passphrase — NOT the passphrase) and an already-**encrypted** payload,
// so the server only ever holds ciphertext at an unguessable path. Public blob
// store; security comes from (1) the unguessable path and (2) E2E encryption.

export const config = { runtime: 'nodejs' }

interface Req { method?: string; query: Record<string, string | string[]>; body?: { code?: string; payload?: string } }
interface Res {
  status: (n: number) => Res
  json: (b: unknown) => void
  setHeader: (k: string, v: string) => void
  end: () => void
}

const ok = (c?: string) => typeof c === 'string' && /^[a-f0-9]{16,128}$/.test(c)

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  const code = (req.method === 'GET' ? req.query.code : req.body?.code) as string
  if (!ok(code)) { res.status(400).json({ error: 'invalid code' }); return }
  const pathname = `sync/${code}.json`

  try {
    if (req.method === 'POST') {
      const payload = req.body?.payload
      if (typeof payload !== 'string' || payload.length > 8_000_000) { res.status(400).json({ error: 'bad payload' }); return }
      await put(pathname, payload, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
      res.status(200).json({ ok: true })
      return
    }
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: pathname, limit: 1 })
      if (!blobs.length) { res.status(404).json({ error: 'not found' }); return }
      const r = await fetch(blobs[0].url + `?t=${Date.now()}`)
      const text = await r.text()
      res.status(200).json({ payload: text })
      return
    }
    res.status(405).json({ error: 'method' })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
}
