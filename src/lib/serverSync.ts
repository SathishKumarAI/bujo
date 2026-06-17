// Sync the whole journal to a self-host PostgREST endpoint — the Docker stack's
// `/journals` table (see docker-compose.yml + docker/initdb.sql). Push on save
// (debounced by the caller) and a best-effort flush on tab close via a
// keepalive fetch. For E2E, encrypt `data` before calling these.

const DEVICE_KEY = 'bujo:device-id'

/** Stable per-device id used as the journals row key. */
export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

const base = (url: string) => url.replace(/\/$/, '')

/** Upsert the journal blob. `keepalive` lets it finish during pagehide/unload. */
export async function pushJournalToServer(apiUrl: string, data: unknown, token?: string): Promise<boolean> {
  if (!apiUrl) return false
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const r = await fetch(`${base(apiUrl)}/journals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: deviceId(), data, updated_at: new Date().toISOString() }),
      keepalive: true,
    })
    return r.ok
  } catch {
    return false
  }
}

/** Read this device's journal blob back (e.g. on load), or null. */
export async function pullJournalFromServer(apiUrl: string, token?: string): Promise<unknown | null> {
  if (!apiUrl) return null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const r = await fetch(`${base(apiUrl)}/journals?id=eq.${deviceId()}&select=data`, { headers })
    if (!r.ok) return null
    const rows = (await r.json()) as { data: unknown }[]
    return rows?.[0]?.data ?? null
  } catch {
    return null
  }
}
