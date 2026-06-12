// Consent-based contact enrichment. We only ever call official, public,
// CORS-enabled APIs that the person opted into being on — no scraping, no
// people-search. Today: GitHub's public user endpoint.

export interface GithubProfile {
  name?: string
  avatar?: string
  bio?: string
  company?: string
  htmlUrl?: string
}

/**
 * Fetch a GitHub user's PUBLIC profile via the official API. Returns null on any
 * failure (unknown user, rate limit, offline) so callers degrade gracefully.
 * No token is sent — only public data, subject to GitHub's unauthenticated rate
 * limit (~60/hr per IP), which is plenty for adding a contact now and then.
 */
export async function fetchGithubProfile(username: string): Promise<GithubProfile | null> {
  const handle = username.trim().replace(/^@/, '')
  if (!handle) return null
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const j = await res.json()
    return {
      name: j.name ?? undefined,
      avatar: j.avatar_url ?? undefined,
      bio: j.bio ?? undefined,
      company: j.company ?? undefined,
      htmlUrl: j.html_url ?? undefined,
    }
  } catch {
    return null
  }
}
