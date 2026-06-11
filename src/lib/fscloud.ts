// "Their own cloud" via the File System Access API: the user points bujo at a
// folder inside their existing Drive / Dropbox / OneDrive sync folder. We write
// `bujo.json` there; their cloud client syncs it across devices. No OAuth, no
// account, no app verification. Chromium-based browsers only.
//
// The directory handle is persisted in IndexedDB (handles can't go in
// localStorage). Re-granting permission needs a user gesture after reload.

const FILE = 'bujo.json'
const IDB_NAME = 'bujo-fs'
const STORE = 'handles'
const KEY = 'dir'

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: string }) => Promise<PermissionState>
  requestPermission?: (o: { mode: string }) => Promise<PermissionState>
}

let dirHandle: DirHandle | null = null

export function isSupported(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
}

// ── IndexedDB handle persistence ─────────────────────────────────────────────
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function idbPut(value: unknown): Promise<void> {
  const db = await idb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
async function idbGet(): Promise<DirHandle | null> {
  const db = await idb()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(KEY)
    r.onsuccess = () => resolve((r.result as DirHandle) ?? null)
    r.onerror = () => resolve(null)
  })
}

async function ensurePermission(h: DirHandle, request: boolean): Promise<boolean> {
  const opts = { mode: 'readwrite' }
  if ((await h.queryPermission?.(opts)) === 'granted') return true
  if (request && (await h.requestPermission?.(opts)) === 'granted') return true
  return false
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Prompt the user to choose a folder (user gesture). Persists the handle. */
export async function pickFolder(): Promise<string> {
  const picker = (window as unknown as { showDirectoryPicker: (o: { mode: string }) => Promise<DirHandle> }).showDirectoryPicker
  const h = await picker({ mode: 'readwrite' })
  if (!(await ensurePermission(h, true))) throw new Error('Permission denied')
  dirHandle = h
  await idbPut(h)
  return h.name
}

/** Restore a previously-picked folder after reload. Returns true if usable now. */
export async function restoreFolder(request = false): Promise<boolean> {
  const h = dirHandle ?? (await idbGet())
  if (!h) return false
  dirHandle = h
  return ensurePermission(h, request)
}

export function hasFolder(): boolean {
  return !!dirHandle
}
export function folderName(): string | undefined {
  return dirHandle?.name
}
export async function forget(): Promise<void> {
  dirHandle = null
  await idbPut(null)
}

async function fileHandle(create: boolean): Promise<FileSystemFileHandle> {
  if (!dirHandle) throw new Error('No folder selected')
  return dirHandle.getFileHandle(FILE, { create })
}

/** Read bujo.json from the folder (null if absent/empty). */
export async function loadFromFolder(): Promise<unknown | null> {
  try {
    const fh = await fileHandle(false)
    const text = await (await fh.getFile()).text()
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

/** Write the journal to bujo.json in the folder. */
export async function saveToFolder(obj: unknown): Promise<void> {
  const fh = await fileHandle(true)
  const w = await fh.createWritable()
  await w.write(JSON.stringify(obj, null, 2))
  await w.close()
}
