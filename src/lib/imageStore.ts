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

/**
 * How much inlined JSON a network sync push may carry, before encryption.
 *
 * `/api/sync` runs on Vercel, whose **request body limit is 4.5 MB** — enforced
 * by the platform before the handler runs, so `api/sync.ts`'s own 8 MB check
 * never sees an oversized push. Between here and that limit the payload is
 * base64-encoded by `encryptString` (×~1.34) and then embedded as a JSON string
 * (×~1.05), so ~3 MB of JSON is ~4.2 MB on the wire. 2.8 MB leaves room.
 *
 * Photos are the only thing that can approach this: the journal itself is
 * ~2.35 MB at *ten years* (see `docs/DATA-STORE-DECISION.md` §3), while one
 * 1024px JPEG is ~160 KB base64 and progress photos are a weekly habit.
 */
export const SYNC_INLINE_BUDGET = 2_800_000

/**
 * Inline photos for a network push, but only if the result still fits.
 *
 * Inlining unconditionally is the obvious fix for "photos never sync" and it is
 * wrong on its own: a year of weekly progress photos is ~8 MB, which exceeds
 * every limit above, so the push would fail outright. That trades silent
 * *partial* loss (journal syncs, photos missing) for *total* failure, which is
 * worse — the text is the part you cannot re-take.
 *
 * So: inline when it fits, fall back to ids when it does not, and tell the
 * caller which happened so it can say so. All-or-nothing rather than "inline
 * the newest that fit" — a partial set means the receiving device shows some
 * photos and dangling references for the rest, with no way to know which.
 *
 * File-based targets (folder, Drive, gist) have no such limit and call
 * {@link inlineImages} directly.
 */
export async function inlineImagesWithinBudget<T extends { progressPhotos?: { photo: string }[] }>(
  data: T,
  maxBytes = SYNC_INLINE_BUDGET,
): Promise<{ payload: T; skipped: number }> {
  const photos = data?.progressPhotos?.length ?? 0
  if (!photos) return { payload: data, skipped: 0 }
  const inlined = await inlineImages(data)
  if (JSON.stringify(inlined).length <= maxBytes) return { payload: inlined, skipped: 0 }
  return { payload: data, skipped: photos }
}

/** Tell the UI that a push went out without its photos. `SyncIndicator` shows it. */
export function notePhotosSkipped(count: number): void {
  if (count > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bujo:sync', { detail: 'photos-skipped' }))
  }
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
