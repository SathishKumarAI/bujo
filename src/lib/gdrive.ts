// Optional Google Drive sync (opt-in). Uses Google Identity Services for an
// OAuth access token and the Drive REST API to store the journal as a single
// file in the hidden appDataFolder, plus browse the user's Drive files to
// reference images/docs. Local-first remains the default; this only runs when
// the user pastes a Google OAuth Client ID in Settings and connects.
//
// Requires a Google Cloud OAuth 2.0 Client ID (Web). See docs/GOOGLE_DRIVE.md.

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file'
const DATA_FILE = 'bujo.json'

// Minimal typings for the GIS global we load at runtime.
type TokenClient = { requestAccessToken: (opts?: { prompt?: string }) => void }
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            callback: (resp: { access_token?: string; error?: string }) => void
          }) => TokenClient
        }
      }
    }
  }
}

let tokenClient: TokenClient | null = null
let accessToken: string | null = null

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
}

/** Connect: load GIS, request an access token (shows Google consent once). */
export async function connect(clientId: string): Promise<void> {
  await loadGis()
  await new Promise<void>((resolve, reject) => {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) return reject(new Error(resp.error || 'no token'))
        accessToken = resp.access_token
        resolve()
      },
    })
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function isConnected(): boolean {
  return !!accessToken
}

export function disconnect(): void {
  accessToken = null
}

function authHeaders(): HeadersInit {
  if (!accessToken) throw new Error('Not connected to Google Drive')
  return { Authorization: `Bearer ${accessToken}` }
}

async function findDataFileId(): Promise<string | null> {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(`name='${DATA_FILE}'`)}&fields=files(id,name)`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Drive list failed (${res.status})`)
  const json = await res.json()
  return json.files?.[0]?.id ?? null
}

/** Upload the journal JSON to appDataFolder (create or update). */
export async function pushData(obj: unknown): Promise<void> {
  const id = await findDataFileId()
  const boundary = 'bujo-' + Math.abs(hash(JSON.stringify(obj).slice(0, 64))).toString(36)
  const metadata = id ? {} : { name: DATA_FILE, parents: ['appDataFolder'] }
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(obj)}\r\n--${boundary}--`
  const url = id
    ? `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
  const res = await fetch(url, {
    method: id ? 'PATCH' : 'POST',
    headers: { ...authHeaders(), 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`)
}

/** Download the journal JSON from appDataFolder (null if none yet). */
export async function pullData(): Promise<unknown | null> {
  const id = await findDataFileId()
  if (!id) return null
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`)
  return res.json()
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  webViewLink?: string
  iconLink?: string
}

/** Browse the user's Drive (images & docs) to reference. `q` is a name filter. */
export async function listFiles(q: string): Promise<DriveFile[]> {
  const filter = [
    "trashed=false",
    "(mimeType contains 'image/' or mimeType contains 'application/pdf' or mimeType contains 'document')",
    q ? `name contains '${q.replace(/'/g, "\\'")}'` : '',
  ].filter(Boolean).join(' and ')
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filter)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,iconLink)&pageSize=24&orderBy=modifiedTime desc`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Drive search failed (${res.status})`)
  const json = await res.json()
  return json.files ?? []
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}
