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

// Both clocks below are whole-millisecond, so ids minted in the same tick used
// to be IDENTICAL — measured: 50 calls in one tick produced 2 distinct ids. That
// was harmless while photos were only ever added one at a time by hand, and
// became silent data loss the moment `externalizeImages` started minting a batch
// in one `Promise.all` (48 of 50 photos would overwrite each other). The counter
// is what actually guarantees uniqueness; the clocks just keep ids sortable.
let _seq = 0

/** Mint a fresh image id. Exported so the uniqueness guarantee is testable
 *  without an IndexedDB, which the test environment does not have. */
export function newImageId(): string {
  return `img:${Date.now().toString(36)}-${(_seq++).toString(36)}-${Math.floor(performance.now() % 1e6).toString(36)}`
}

/** Store a data-URL, returning a stable id to reference it by. */
export async function putImage(dataUrl: string): Promise<string> {
  const id = newImageId()
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

/**
 * Inverse of {@link inlineImages}: move any inline `data:` photo back into
 * IndexedDB and leave an `img:` id in its place.
 *
 * Sync pushes call `inlineImages` so photo BYTES actually travel (before this,
 * every push shipped bare `img:` ids that resolve to nothing on the receiving
 * device — the photos silently never synced). That fix has a tail: a device
 * that adopts such a payload would then persist megabytes of data-URLs into the
 * ~5 MB localStorage blob, which is exactly what imageStore exists to prevent.
 * So every pull runs this on the way in, and the blob stays small on both ends.
 *
 * Idempotent: a value that is already an id (or absent) is left alone.
 */
export async function externalizeImages<T extends { progressPhotos?: { photo: string }[] }>(data: T): Promise<T> {
  if (!data?.progressPhotos?.length) return data
  if (!data.progressPhotos.some((p) => p.photo?.startsWith('data:'))) return data // nothing inline
  const clone: T = JSON.parse(JSON.stringify(data))
  clone.progressPhotos = await Promise.all(
    clone.progressPhotos!.map(async (p) =>
      p.photo?.startsWith('data:') ? { ...p, photo: await putImage(p.photo) } : p,
    ),
  )
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
