import type { Food } from '../foods'

/**
 * FOOD LOOKUP · open nutrition data, opt-in, cached, offline after the first hit.
 *
 * Asked for as "MyFitnessPal". **MyFitnessPal has no public API** — it was
 * closed years ago, and the endpoints that circulate are scraped, unstable and
 * against their terms. Open Food Facts is the open-data equivalent and a
 * better fit for a local-first app: ODbL, 3M+ products, barcode lookup, no key
 * and no account.
 *
 * Two sources because they fail in opposite directions:
 *
 * | Source | Strong at | Weak at |
 * |---|---|---|
 * | Open Food Facts | branded and packaged food, barcodes | raw ingredients, patchy user-entered data |
 * | USDA FoodData Central | whole foods, lab-measured and consistent | branded products, needs a free key |
 *
 * So: barcode → OFF, name → OFF then USDA, and manual entry is still there
 * underneath. Each step is a real fallback, not a retry.
 *
 * **This app makes no network calls until you turn one on** — the weather
 * toggle says so on screen, and that promise is load-bearing for a private
 * journal. Lookup is off by default, and nothing here runs unless
 * `settings.foodLookup` is enabled. Callers must check; these functions do not
 * know about settings on purpose, so the decision lives in one place rather
 * than being re-made in every provider.
 */

/** A candidate from a provider, before the user picks one. */
export interface FoodHit extends Food {
  /** Where it came from, shown on the row — the user should know. */
  source: 'off' | 'usda'
  /** Provider's own id, for the cache key and for re-fetching. */
  id: string
  /** Brand or data-type qualifier, when the provider gives one. */
  detail?: string
}

/** Per-100g macros are the common denominator; both providers report them. */
const per100 = (n: number | undefined): number => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10) / 10 : 0)

/**
 * A product from Open Food Facts.
 *
 * Their search endpoint is generous with fields and inconsistent about which
 * are present, so every read is defensive: a product with no
 * `nutriments.energy-kcal_100g` is not an error, it is a product nobody has
 * finished entering. Those are dropped rather than shown as 0 kcal, which
 * would be a fabricated number in a calorie total.
 */
interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  serving_size?: string
  nutriments?: Record<string, number | string | undefined>
}

function offToHit(p: OffProduct): FoodHit | null {
  const n = p.nutriments ?? {}
  const num = (k: string) => {
    const v = n[k]
    return typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : undefined
  }
  const kcal = num('energy-kcal_100g')
  const name = (p.product_name ?? '').trim()
  // No name or no energy means the row cannot be shown honestly.
  if (!name || !Number.isFinite(kcal as number) || (kcal as number) <= 0) return null
  return {
    id: `off:${p.code ?? name}`,
    source: 'off',
    name,
    detail: (p.brands ?? '').split(',')[0]?.trim() || undefined,
    serving: p.serving_size?.trim() || '100 g',
    kcal: Math.round(kcal as number),
    protein: per100(num('proteins_100g')),
    carbs: per100(num('carbohydrates_100g')),
    fat: per100(num('fat_100g')),
    // The local `Food` type carries a cuisine for its own curated list; a
    // looked-up product has no honest answer, so it takes the neutral one.
    cuisine: 'american',
  }
}

const OFF_BASE = 'https://world.openfoodfacts.org'
/** OFF asks every client to identify itself; an anonymous one gets throttled. */
const UA = 'bujo-journal/1.0 (local-first journal; https://github.com/SathishKumarAI/bujo)'

const FIELDS = 'code,product_name,brands,serving_size,nutriments'

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const r = await fetch(url, { signal, headers: { Accept: 'application/json', 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

/** Search Open Food Facts by name. */
export async function searchOff(query: string, signal?: AbortSignal): Promise<FoodHit[]> {
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12&fields=${FIELDS}`
  const data = (await getJson(url, signal)) as { products?: OffProduct[] }
  return (data.products ?? []).map(offToHit).filter((x): x is FoodHit => x !== null)
}

/**
 * Look up one barcode.
 *
 * Separate from search because it is a different endpoint and a different
 * answer: a barcode is exact, so one hit or none — never a ranked list to
 * choose from.
 */
export async function barcodeOff(code: string, signal?: AbortSignal): Promise<FoodHit | null> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 8) return null
  const url = `${OFF_BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`
  const data = (await getJson(url, signal)) as { status?: number; product?: OffProduct }
  if (data.status !== 1 || !data.product) return null
  return offToHit(data.product)
}

/**
 * USDA FoodData Central.
 *
 * Needs a free key. `DEMO_KEY` works without one but is rate-limited hard and
 * shared globally, so it is the default only so the feature is *tryable* — the
 * Settings field is where a real key goes, and the UI says which is in use
 * rather than letting a mysterious 429 look like "no results".
 */
interface UsdaFood {
  fdcId?: number
  description?: string
  dataType?: string
  foodNutrients?: { nutrientName?: string; nutrientNumber?: string; value?: number }[]
}

export const USDA_DEMO_KEY = 'DEMO_KEY'

function usdaToHit(f: UsdaFood): FoodHit | null {
  const name = (f.description ?? '').trim()
  if (!name) return null
  // Nutrient *numbers* are stable; names are not ("Energy" vs "Energy (Atwater…)").
  const by = (num: string) => f.foodNutrients?.find((n) => n.nutrientNumber === num)?.value
  const kcal = by('208')
  if (!Number.isFinite(kcal as number) || (kcal as number) <= 0) return null
  return {
    id: `usda:${f.fdcId ?? name}`,
    source: 'usda',
    name,
    detail: f.dataType,
    serving: '100 g',
    kcal: Math.round(kcal as number),
    protein: per100(by('203')),
    carbs: per100(by('205')),
    fat: per100(by('204')),
    cuisine: 'american',
  }
}

export async function searchUsda(query: string, key: string, signal?: AbortSignal): Promise<FoodHit[]> {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=8&api_key=${encodeURIComponent(key || USDA_DEMO_KEY)}`
  const data = (await getJson(url, signal)) as { foods?: UsdaFood[] }
  return (data.foods ?? []).map(usdaToHit).filter((x): x is FoodHit => x !== null)
}
