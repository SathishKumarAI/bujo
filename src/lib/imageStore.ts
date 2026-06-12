// IndexedDB-backed image store. Photos are the one thing that blows past the
// ~5 MB localStorage budget, so we keep the JSON journal small by storing image
// data-URLs here (IndexedDB has a far larger, async quota) and referencing them
// by id. Back-compat: a "photo" value that still starts with "data:" is a legacy
// inline image and is returned as-is.

const DB = 'bujo-images'
const STORE = 'images'

let dbp: Promise<IDBDatabase> | null = null
function open(): Promise<IDBDatabase> {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return open().then((db) => db.transaction(STORE, mode).objectStore(STORE))
}

/** True when the value is an IndexedDB id (not a legacy inline data-URL). */
export const isImageId = (v: string | undefined): v is string => !!v && v.startsWith('img:')

/** Store a data-URL, returning a stable id to reference it by. */
export async function putImage(dataUrl: string): Promise<string> {
  const id = `img:${Date.now().toString(36)}-${Math.floor(performance.now() % 1e6).toString(36)}`
  const store = await tx('readwrite')
  await new Promise<void>((resolve, reject) => {
    const r = store.put(dataUrl, id)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
  return id
}

/** Resolve an id (or pass through a legacy inline data-URL) to a data-URL. */
export async function getImage(idOrDataUrl: string | undefined): Promise<string | undefined> {
  if (!idOrDataUrl) return undefined
  if (!isImageId(idOrDataUrl)) return idOrDataUrl // legacy inline image
  const store = await tx('readonly')
  return new Promise((resolve) => {
    const r = store.get(idOrDataUrl)
    r.onsuccess = () => resolve(r.result as string | undefined)
    r.onerror = () => resolve(undefined)
  })
}

/**
 * Return a deep copy of the journal with every IndexedDB image id replaced by its
 * inline data-URL, so a JSON export is self-contained and portable across devices.
 */
export async function inlineImages<T extends { progressPhotos?: { photo: string }[] }>(data: T): Promise<T> {
  const clone: T = JSON.parse(JSON.stringify(data))
  if (clone.progressPhotos) {
    clone.progressPhotos = await Promise.all(
      clone.progressPhotos.map(async (p) => ({ ...p, photo: (await getImage(p.photo)) ?? p.photo })),
    )
  }
  return clone
}

export async function deleteImage(id: string | undefined): Promise<void> {
  if (!isImageId(id)) return
  const store = await tx('readwrite')
  await new Promise<void>((resolve) => {
    const r = store.delete(id)
    r.onsuccess = () => resolve()
    r.onerror = () => resolve()
  })
}
