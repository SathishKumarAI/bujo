// Anonymous in-app feedback → GitHub issue. The client POSTs a short message;
// this function files it on the repo using a server-side token the browser
// never sees. Public endpoint, so it is deliberately defensive: tight input
// caps, a honeypot field, and a best-effort per-IP rate limit.

export const config = { runtime: 'nodejs' }

interface Req {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: {
    message?: string
    category?: string
    contact?: string
    meta?: { url?: string; version?: number; ua?: string }
    hp?: string // honeypot — bots fill it, humans never see it
  }
}
interface Res {
  status: (n: number) => Res
  json: (b: unknown) => void
  setHeader: (k: string, v: string) => void
}

const CATEGORIES = ['bug', 'idea', 'praise', 'other'] as const
const REPO = process.env.GITHUB_REPO || 'SathishKumarAI/bujo'

// Best-effort throttle. Fluid Compute reuses instances so this catches bursts
// from one IP, but it is NOT durable across cold starts / regions — it is a
// speed bump, not a guarantee. Durable limits would need Redis/Edge Config.
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // crude memory cap
  return recent.length > MAX_PER_WINDOW
}

const clientIp = (req: Req): string => {
  const xff = req.headers['x-forwarded-for']
  const raw = Array.isArray(xff) ? xff[0] : xff
  return (raw || '').split(',')[0].trim() || 'unknown'
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return }

  const token = process.env.GITHUB_TOKEN
  if (!token) { res.status(503).json({ error: 'feedback not configured' }); return }

  const b = req.body || {}
  if (b.hp) { res.status(200).json({ ok: true }); return } // honeypot tripped → silently drop

  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (message.length < 3 || message.length > 5000) { res.status(400).json({ error: 'message must be 3–5000 chars' }); return }

  const category = CATEGORIES.includes(b.category as (typeof CATEGORIES)[number]) ? b.category! : 'other'
  const contact = typeof b.contact === 'string' ? b.contact.trim().slice(0, 200) : ''

  if (rateLimited(clientIp(req))) { res.status(429).json({ error: 'too many — try again in a minute' }); return }

  const meta = b.meta || {}
  const firstLine = message.split('\n')[0].slice(0, 70)
  const title = `[feedback:${category}] ${firstLine}`
  const body = [
    message,
    '',
    '---',
    `- category: ${category}`,
    contact ? `- contact: ${contact}` : '- contact: (none)',
    meta.url ? `- url: ${meta.url}` : '',
    meta.version != null ? `- data version: ${meta.version}` : '',
    meta.ua ? `- ua: ${meta.ua}` : '',
    '- via: in-app feedback',
  ].filter(Boolean).join('\n')

  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'bujo-feedback',
      },
      body: JSON.stringify({ title, body, labels: ['feedback', category] }),
    })
    if (!r.ok) {
      // Don't leak GitHub's token-scoped error detail to the client.
      console.error('feedback: github', r.status, await r.text().catch(() => ''))
      res.status(502).json({ error: 'could not file feedback' })
      return
    }
    const issue = (await r.json()) as { html_url?: string; number?: number }
    res.status(200).json({ ok: true, url: issue.html_url, number: issue.number })
  } catch (e) {
    console.error('feedback: error', e)
    res.status(500).json({ error: 'unexpected error' })
  }
}
