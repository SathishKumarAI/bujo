// GitHub storage via a private Gist. The user supplies a Personal Access Token
// with the `gist` scope; their journal is stored as `bujo.json` in a secret
// gist they own. api.github.com sends CORS headers, so this works client-side.
// The token is the user's own and kept in their localStorage (their choice).

const API = 'https://api.github.com'
const FILE = 'bujo.json'

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

/** Create or update the gist. Returns the gist id. */
export async function pushGist(token: string, gistId: string | undefined, obj: unknown): Promise<string> {
  const body = JSON.stringify({
    description: 'bujo journal (private)',
    public: false,
    files: { [FILE]: { content: JSON.stringify(obj) } },
  })
  const res = await fetch(gistId ? `${API}/gists/${gistId}` : `${API}/gists`, {
    method: gistId ? 'PATCH' : 'POST',
    headers: headers(token),
    body,
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 120)}`)
  const json = await res.json()
  return json.id
}

/** Read bujo.json from the gist (null if missing). */
export async function pullGist(token: string, gistId: string): Promise<unknown | null> {
  const res = await fetch(`${API}/gists/${gistId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const json = await res.json()
  const file = json.files?.[FILE]
  if (!file) return null
  // Gist content is truncated above ~1 MB; fall back to the raw URL.
  const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content
  return content ? JSON.parse(content) : null
}

/** Verify a token works and has gist access. */
export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${API}/user`, { headers: headers(token) })
  return res.ok
}
