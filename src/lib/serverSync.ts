// Sync the whole journal to a self-host PostgREST endpoint — the Docker stack's
// `/journals` table (see docker-compose.yml + docker/initdb.sql). Push on save
// (debounced by the caller) and a best-effort flush on tab close via a
// keepalive fetch; pull on load to seed/merge the local journal.
//
// The API is now HARDENED (see docs/security/postgrest-hardening.md, BUJO-194):
//   • HTTPS only (the nginx api-proxy terminates TLS on :8443).
//   • Every /journals request MUST send `Authorization: Bearer <HS256 JWT>`
//     whose claims are { role: "bujo_user", sub: <deviceId> }. No token ⇒ 401.
//   • The DB sets `owner` from the token `sub`; the client MUST NOT send `owner`.
//   • Upserts keep `Prefer: resolution=merge-duplicates`.
//
// Config is the pasted base URL + Bearer token, persisted in the journal
// settings (settings.selfHostUrl / settings.selfHostToken) by the Settings UI.
// The token is a pre-minted HS256 JWT — mint it with the helper in the hardening
// doc; its `sub` should equal this device's `deviceId()` so it owns its row.

import type { JournalData } from './types'

const DEVICE_KEY = 'bujo:device-id'

/** Stable per-device id used as the journals row key (and the token's `sub`). */
export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

const base = (url: string) => url.replace(/\/$/, '')

/** True when both a URL and a token are present — the secured API needs both. */
export function serverConfigured(apiUrl?: string, token?: string): boolean {
  return !!apiUrl && !!token
}

/**
 * Upsert the journal blob to `<url>/journals`.
 * Sends the Bearer JWT + `Prefer: resolution=merge-duplicates`; never sends an
 * `owner` field (the DB derives it from the token `sub`). `keepalive` lets the
 * request finish during pagehide/unload. Returns true on a 2xx.
 */
export async function pushJournalToServer(apiUrl: string, data: unknown, token?: string): Promise<boolean> {
  if (!serverConfigured(apiUrl, token)) return false
  try {
    const r = await fetch(`${base(apiUrl)}/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
        Authorization: `Bearer ${token}`,
      },
      // No `owner` — the DB sets it from the verified token `sub`.
      body: JSON.stringify({ id: deviceId(), data, updated_at: new Date().toISOString() }),
      keepalive: true,
    })
    return r.ok
  } catch {
    return false
  }
}

/**
 * Read this device's journal blob back from `<url>/journals` (e.g. on load).
 * Returns the row's `data` typed as {@link JournalData}, or null when nothing is
 * stored, the endpoint is unreachable, or auth fails (401/403). RLS already
 * scopes the result to this owner, but we still filter by `id` for clarity.
 */
export async function pullJournalFromServer(apiUrl: string, token?: string): Promise<JournalData | null> {
  if (!serverConfigured(apiUrl, token)) return null
  try {
    const r = await fetch(`${base(apiUrl)}/journals?id=eq.${deviceId()}&select=data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return null // 401/403/etc. — fail closed, keep local data
    const rows = (await r.json()) as { data: JournalData }[]
    return rows?.[0]?.data ?? null
  } catch {
    return null
  }
}
