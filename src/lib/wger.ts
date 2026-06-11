// Client for the wger public exercise database (https://wger.de).
// wger removed the autocomplete `/search/` endpoint, so we fetch the catalogue
// once via `/exerciseinfo/`, cache a slim index in localStorage, then search
// client-side. wger data & images are CC-BY-SA (credited in CREDITS.md).

const BASE = 'https://wger.de'
const CACHE_KEY = 'bujo:wger-catalog'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30 // 30 days

export interface WgerExercise {
  id: number
  name: string
  image: string | null
  video: string | null // wger-hosted clip when available
  muscles: number[] // wger muscle ids (primary + secondary)
}

interface Cache {
  at: number
  items: WgerExercise[]
}

let memo: WgerExercise[] | null = null

function readCache(): WgerExercise[] | null {
  if (memo) return memo
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cache
    if (Date.now() - c.at > CACHE_TTL) return null
    memo = c.items
    return memo
  } catch {
    return null
  }
}

/** Build the slim catalogue from wger's paginated exerciseinfo (English). */
async function buildCatalog(signal?: AbortSignal, onProgress?: (n: number) => void): Promise<WgerExercise[]> {
  const items: WgerExercise[] = []
  let url: string | null = `${BASE}/api/v2/exerciseinfo/?format=json&language=2&limit=100`
  let pages = 0
  while (url && pages < 10) {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`wger ${res.status}`)
    const json: any = await res.json()
    for (const r of json.results ?? []) {
      const t = (r.translations ?? []).find((x: any) => x.language === 2) ?? (r.translations ?? [])[0]
      if (!t?.name) continue
      const img = (r.images ?? []).find((i: any) => i.is_main) ?? (r.images ?? [])[0]
      const vid = (r.videos ?? [])[0]
      const muscles = [
        ...(r.muscles ?? []).map((m: any) => m.id),
        ...(r.muscles_secondary ?? []).map((m: any) => m.id),
      ]
      items.push({ id: r.id, name: t.name, image: img?.image ?? null, video: vid?.video ?? null, muscles })
    }
    onProgress?.(items.length)
    url = json.next
    pages++
  }
  // De-dup by name, prefer entries that have an image.
  const byName = new Map<string, WgerExercise>()
  for (const it of items) {
    const k = it.name.toLowerCase()
    const cur = byName.get(k)
    if (!cur || (!cur.image && it.image)) byName.set(k, it)
  }
  const slim = [...byName.values()]
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items: slim }))
  } catch {
    /* quota — fine, keep in memory */
  }
  memo = slim
  return slim
}

/** Ensure the catalogue is loaded (cached after first call). */
export async function ensureCatalog(signal?: AbortSignal, onProgress?: (n: number) => void): Promise<WgerExercise[]> {
  return readCache() ?? (await buildCatalog(signal, onProgress))
}

/**
 * Exact wger muscle ids for an exercise name, read ONLY from the cached
 * catalogue (no network). Returns null when the catalogue isn't cached yet or
 * no confident match — the caller then falls back to the keyword mapper.
 */
export function cachedMusclesForName(name: string): number[] | null {
  const all = readCache()
  if (!all) return null
  const q = name.trim().toLowerCase()
  if (!q) return null
  const exact = all.find((e) => e.name.toLowerCase() === q)
  const hit = exact ?? all.find((e) => e.name.toLowerCase().includes(q))
  return hit && hit.muscles.length ? hit.muscles : null
}

/** Search the cached wger catalogue by name. */
export async function searchExercises(term: string, signal?: AbortSignal, onProgress?: (n: number) => void): Promise<WgerExercise[]> {
  const all = await ensureCatalog(signal, onProgress)
  const q = term.trim().toLowerCase()
  if (!q) return []
  return all
    .filter((e) => e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.length - b.name.length) // shorter = closer match
    .slice(0, 24)
}
