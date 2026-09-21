import { barcodeOff, searchOff, searchUsda, type FoodHit } from './providers'

/**
 * ONE LOOKUP · barcode → Open Food Facts, name → OFF then USDA, then nothing.
 *
 * The order is not a retry loop. Each step answers a question the one before
 * it cannot: a barcode is exact and belongs to a packaged product, so OFF owns
 * it; a typed name is most often a branded food, so OFF leads; USDA is the
 * backstop for whole foods ("raw spinach") that no packet exists for.
 *
 * **Returning nothing is a result.** Manual entry is still the path underneath
 * all of this, and a lookup that invents a plausible row rather than admitting
 * a miss would put a fabricated number into a calorie total — the same rule
 * `voice/intent.ts` follows for food with no numbers.
 */

export interface LookupResult {
  hits: FoodHit[]
  /** Which providers actually answered, for the "searched N sources" line. */
  tried: string[]
  /** Set when every provider failed — offline, blocked, rate-limited. */
  error?: string
  /** True when these came from the local cache and no request was made. */
  cached?: boolean
}

/**
 * Cached lookups, so the second search for "oats" is instant and works on a
 * plane.
 *
 * `localStorage`, not the journal: this is a copy of somebody else's public
 * data, it is not yours, and it has no business in an export, a backup or a
 * sync payload. Keeping it out of `JournalData` also keeps it off the 5MB
 * journal budget that Settings → Data reports on.
 */
const CACHE_KEY = 'bujo:food-cache'
const MAX_ENTRIES = 300
/** A month. Packaged-food macros change slowly; a stale row is worse than a refetch. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

interface CacheEntry { at: number; hits: FoodHit[] }

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
  } catch {
    // A corrupt cache is not worth an error path — it is a cache.
    return {}
  }
}

function writeCache(c: Record<string, CacheEntry>) {
  try {
    const keys = Object.keys(c)
    if (keys.length > MAX_ENTRIES) {
      // Oldest out first. Unbounded growth in localStorage is how an app
      // starts throwing QuotaExceededError on an unrelated save.
      const sorted = keys.sort((a, b) => c[a].at - c[b].at).slice(0, keys.length - MAX_ENTRIES)
      for (const k of sorted) delete c[k]
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(c))
  } catch {
    // Full or blocked storage must not break the search that triggered it.
  }
}

/** How many entries are held, for the Settings line that offers to clear them. */
export function cachedFoodCount(): number {
  return Object.keys(readCache()).length
}

export function clearFoodCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* nothing to do */ }
}

const key = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ')

const isBarcode = (q: string) => /^\s*\d{8,14}\s*$/.test(q)

export interface LookupOpts {
  /** USDA key. Empty means the shared demo key, which is heavily rate-limited. */
  usdaKey?: string
  signal?: AbortSignal
  /** Skip the cache — for a deliberate refresh. */
  fresh?: boolean
}

/**
 * Look a food up.
 *
 * Callers must already have checked that the user turned lookup on. This
 * function does not read settings, so "is the network allowed" is decided in
 * one place instead of in three providers.
 */
export async function lookupFood(query: string, opts: LookupOpts = {}): Promise<LookupResult> {
  const q = key(query)
  if (!q) return { hits: [], tried: [] }

  const cache = readCache()
  const hit = cache[q]
  if (!opts.fresh && hit && Date.now() - hit.at < TTL_MS) {
    return { hits: hit.hits, tried: ['cache'], cached: true }
  }

  const tried: string[] = []
  const errors: string[] = []

  if (isBarcode(q)) {
    tried.push('Open Food Facts')
    try {
      const one = await barcodeOff(q, opts.signal)
      const hits = one ? [one] : []
      if (hits.length) {
        cache[q] = { at: Date.now(), hits }
        writeCache(cache)
      }
      return { hits, tried }
    } catch (e) {
      errors.push(String(e))
    }
    return { hits: [], tried, error: errors[0] }
  }

  const hits: FoodHit[] = []

  tried.push('Open Food Facts')
  try {
    hits.push(...(await searchOff(q, opts.signal)))
  } catch (e) {
    errors.push(`Open Food Facts: ${String(e)}`)
  }

  // USDA only when OFF was thin — it is the backstop for whole foods, and
  // running both every time doubles the requests for no gain on a branded hit.
  if (hits.length < 4) {
    tried.push('USDA')
    try {
      hits.push(...(await searchUsda(q, opts.usdaKey ?? '', opts.signal)))
    } catch (e) {
      errors.push(`USDA: ${String(e)}`)
    }
  }

  const deduped = dedupe(hits)
  if (deduped.length) {
    cache[q] = { at: Date.now(), hits: deduped }
    writeCache(cache)
  }
  // An error only counts as one when nothing came back; a USDA 429 behind a
  // good OFF result is not something to tell the user about.
  return { hits: deduped, tried, error: deduped.length === 0 ? errors[0] : undefined }
}

/**
 * Drop near-duplicates across providers.
 *
 * OFF and USDA both return "Oats", and showing it twice makes the list look
 * broken. Keyed on the name plus the calorie figure, because two genuinely
 * different products can share a name and should both survive.
 */
function dedupe(hits: FoodHit[]): FoodHit[] {
  const seen = new Set<string>()
  const out: FoodHit[] = []
  for (const h of hits) {
    const k = `${h.name.toLowerCase().replace(/\s+/g, ' ')}|${h.kcal}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(h)
  }
  return out
}

/**
 * Scale a per-100g hit to the grams the user actually ate.
 *
 * Providers report per 100g. Adding a hit unscaled logs 100g of everything,
 * which is wrong for a 30g slice of cheese in exactly the direction that
 * matters — quietly, and in the totals.
 */
export function scaleHit(hit: FoodHit, grams: number): FoodHit {
  const f = grams / 100
  const r = (n: number) => Math.round(n * f * 10) / 10
  return {
    ...hit,
    serving: `${Math.round(grams)} g`,
    kcal: Math.round(hit.kcal * f),
    protein: r(hit.protein),
    carbs: r(hit.carbs),
    fat: r(hit.fat),
  }
}
