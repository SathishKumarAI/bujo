import { describe, expect, it } from 'vitest'

/**
 * The deployed CSP and the code that has to live inside it. COD-300.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * Three shipped features were dead in production and nothing said so. The
 * policy in `vercel.json` and the hosts in `src/` had drifted apart, and the
 * only reason it was ever noticed is that a human read both lists side by
 * side during an unrelated audit:
 *
 * | blocked | by | feature |
 * |---|---|---|
 * | `accounts.google.com/gsi/client` | `script-src 'self'` | Google Drive sync could not connect **at all** |
 * | `world.openfoodfacts.org` | absent from `connect-src` | food lookup failed whatever the toggle said |
 * | `api.nal.usda.gov` | absent from `connect-src` | same |
 *
 * A CSP failure is uniquely quiet: the request never leaves, the console note
 * is easy to miss, and the feature simply does nothing. Neither the type
 * checker nor any browser gate can see it, because the gates run against
 * `vite preview`, which serves **no headers at all** — `vercel.json` only
 * applies in production. So the drift is invisible everywhere except the one
 * place it matters.
 *
 * ── What this asserts, and the direction that matters ─────────────────────
 *
 * For every source file that makes a network call, every absolute host
 * mentioned in that file must be allowed by `connect-src`, or be listed in
 * `NOT_FETCHED` with a reason. Scoping to files that already fetch is what
 * makes it precise: the repo is full of citation links to `nih.gov` and
 * `jamesclear.com`, and an `<a href>` is not egress.
 *
 * The realistic regression is "someone adds a `fetch` to a module that already
 * fetches", and that is exactly what this catches.
 */
import vercel from '../../vercel.json'

type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

function directive(name: string): string[] {
  const rules = (vercel as { headers?: Rule[] }).headers ?? []
  const csp = rules.flatMap((r) => r.headers).find((h) => h.key.toLowerCase() === 'content-security-policy')
  expect(csp, 'vercel.json no longer sets a Content-Security-Policy').toBeTruthy()
  const found = csp!.value.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))
  return found ? found.split(/\s+/).slice(1) : []
}

/** Does `connect-src` permit this origin, honouring one level of wildcard? */
function allows(sources: string[], host: string): boolean {
  return sources.some((src) => {
    const s = src.replace(/^https?:\/\//, '').replace(/^wss:\/\//, '')
    if (s === host) return true
    if (s.startsWith('*.')) return host.endsWith(s.slice(1)) // *.supabase.co
    return false
  })
}

/**
 * Hosts that appear inside a networking module but are never fetched.
 *
 * Each needs a reason, because "it is only a link" is a claim about the code
 * that can stop being true.
 */
const NOT_FETCHED: Record<string, string> = {
  'localhost:11434': 'The local model. A hosted HTTPS page cannot reach plain-http localhost at all — the browser blocks it as mixed content before CSP is consulted, so no directive would help. VoiceModelCard says so on a hosted build.',
  '127.0.0.1': 'Same as above; an alternative spelling accepted by the endpoint allow-list.',
  'open-meteo.com': 'The bare domain appears in a comment/attribution; the fetch goes to api.open-meteo.com, which is allowed.',
  'example.com': 'Placeholder in a doc comment.',
  'api.example.com': 'Placeholder in a doc comment.',
  'evil.example.com': 'A negative example in an endpoint allow-list comment.',
  'localhost.evil.com': 'A negative example — the suffix trap the allow-list exists to reject.',
  'www.w3.org': 'SVG xmlns attribute, not a request.',
  'bujo-journal.vercel.app': 'The app\'s own deployed URL, in copy and in a share link.',
  'localhost:3000': 'A documented default in a comment.',
  'github.com': "Inside the User-Agent string Open Food Facts asks callers to identify themselves with (`food/providers.ts` UA) — it is sent as a header VALUE, never requested.",
}

const SOURCES = import.meta.glob('../**/*.{ts,tsx}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

/** A file that talks to the network. `fetchImpl` is the injected-fetch shape. */
const FETCHES = /\bfetch\s*\(|\bfetchImpl\s*\(|createElement\(['"`]script['"`]\)/

function hostsIn(src: string): string[] {
  const out = new Set<string>()
  for (const m of src.matchAll(/https?:\/\/([a-z0-9.*-]+(?::\d+)?)/gi)) out.add(m[1].toLowerCase())
  return [...out]
}

describe('the deployed CSP permits what the code actually does', () => {
  const connect = directive('connect-src')
  const script = directive('script-src')

  it('finds the policy and the sources at all', () => {
    // A scan that silently matches nothing is the failure mode this whole file
    // is guarding against, so it gets its own assertion.
    expect(connect.length, 'connect-src is empty or unparsed').toBeGreaterThan(5)
    expect(Object.keys(SOURCES).length, 'the source glob matched nothing').toBeGreaterThan(100)
    expect(Object.values(SOURCES).filter((s) => FETCHES.test(s)).length,
      'no file appears to make a network call — the detector is broken').toBeGreaterThan(3)
  })

  it('allows every host named inside a module that makes network calls', () => {
    const offenders: string[] = []
    for (const [path, src] of Object.entries(SOURCES)) {
      if (path.includes('.test.') || !FETCHES.test(src)) continue
      for (const host of hostsIn(src)) {
        if (NOT_FETCHED[host] || allows(connect, host)) continue
        offenders.push(`${path.replace('../', 'src/')} → ${host}`)
      }
    }
    expect(
      offenders,
      'these hosts are referenced in a networking module but are not in vercel.json\'s connect-src. '
      + 'Add the host to the policy, or add it to NOT_FETCHED with a reason if it is not actually fetched.',
    ).toEqual([])
  })

  it('allows the Google Identity script the Drive flow injects', () => {
    // `gdrive.ts` appends a <script src="https://accounts.google.com/gsi/client">.
    // `script-src 'self'` blocked it, so "Connect Drive" could only ever fail —
    // while `frame-src` already trusted the same host, which is how the
    // inconsistency survived.
    expect(allows(script, 'accounts.google.com'),
      'script-src must allow accounts.google.com or Google Drive sync cannot load').toBe(true)
  })

  it('keeps the policy from quietly becoming permissive', () => {
    // A regression here would be someone "fixing" a block with a wildcard.
    expect(script).not.toContain("'unsafe-eval'")
    expect(script.some((s) => s === 'https:' || s === '*'),
      'script-src must not be opened to every https host').toBe(false)
    expect(connect.some((s) => s === '*'), 'connect-src must not be opened to everything').toBe(false)
  })

  it('documents every exemption', () => {
    for (const [host, why] of Object.entries(NOT_FETCHED)) {
      expect(why.length, `${host} is exempted without a reason`).toBeGreaterThan(20)
    }
  })
})
