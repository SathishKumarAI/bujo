import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { lookupFood, scaleHit, clearFoodCache, cachedFoodCount } from './lookup'
import type { FoodHit } from './providers'

const hit = (over: Partial<FoodHit> = {}): FoodHit => ({
  id: 'off:1', source: 'off', name: 'Oats', serving: '100 g',
  kcal: 380, protein: 13, carbs: 67, fat: 7, cuisine: 'american', ...over,
})

const offPayload = (products: unknown[]) => ({ ok: true, json: async () => ({ products }) })
const usdaPayload = (foods: unknown[]) => ({ ok: true, json: async () => ({ foods }) })

beforeEach(() => { clearFoodCache(); vi.restoreAllMocks() })
afterEach(() => { vi.restoreAllMocks() })

describe('scaleHit', () => {
  it('scales per-100g figures to what was actually eaten', () => {
    // The bug this prevents: adding a hit unscaled logs 100g of everything,
    // so a 30g slice of cheese enters the day as 100g — quietly, in the total.
    const s = scaleHit(hit(), 30)
    expect(s.kcal).toBe(114)
    expect(s.protein).toBe(3.9)
    expect(s.serving).toBe('30 g')
  })

  it('is identity at 100g', () => {
    const s = scaleHit(hit(), 100)
    expect([s.kcal, s.protein, s.carbs, s.fat]).toEqual([380, 13, 67, 7])
  })

  it('handles a zero portion without producing NaN', () => {
    const s = scaleHit(hit(), 0)
    expect(Object.values({ k: s.kcal, p: s.protein, c: s.carbs, f: s.fat }).every(Number.isFinite)).toBe(true)
    expect(s.kcal).toBe(0)
  })
})

describe('lookupFood', () => {
  it('routes a barcode to the product endpoint, not search', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('/api/v2/product/')
      return { ok: true, json: async () => ({ status: 1, product: { code: '123', product_name: 'Beans', nutriments: { 'energy-kcal_100g': 90, proteins_100g: 5 } } }) }
    })
    vi.stubGlobal('fetch', fetchMock as never)
    const r = await lookupFood('01234567')
    expect(r.hits).toHaveLength(1)
    expect(r.hits[0].name).toBe('Beans')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('drops a product with no calories rather than showing it as 0 kcal', async () => {
    // A half-entered Open Food Facts row is common. Rendering it as 0 kcal
    // would put a fabricated number into a day's total.
    vi.stubGlobal('fetch', vi.fn(async () => offPayload([
      { code: '1', product_name: 'Ghost food', nutriments: {} },
      { code: '2', product_name: 'Real food', nutriments: { 'energy-kcal_100g': 120 } },
    ])) as never)
    const r = await lookupFood('food')
    expect(r.hits.map((h) => h.name)).toEqual(['Real food'])
  })

  it('falls back to USDA only when Open Food Facts came back thin', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url)
      if (url.includes('openfoodfacts')) {
        return offPayload(Array.from({ length: 6 }, (_, i) => ({ code: String(i), product_name: `P${i}`, nutriments: { 'energy-kcal_100g': 100 + i } })))
      }
      return usdaPayload([])
    }) as never)
    await lookupFood('cereal')
    expect(calls.some((c) => c.includes('nal.usda.gov'))).toBe(false)
  })

  it('does call USDA for a whole food Open Food Facts barely knows', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('openfoodfacts')) return offPayload([])
      return usdaPayload([{ fdcId: 9, description: 'Spinach, raw', dataType: 'SR Legacy', foodNutrients: [
        { nutrientNumber: '208', value: 23 }, { nutrientNumber: '203', value: 2.9 },
      ] }])
    }) as never)
    const r = await lookupFood('spinach')
    expect(r.hits[0]).toMatchObject({ name: 'Spinach, raw', source: 'usda', kcal: 23, protein: 2.9 })
  })

  it('reads nutrients by number, not by name', async () => {
    // USDA reports "Energy" and "Energy (Atwater General Factors)" — matching
    // on the name picks whichever came first.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('openfoodfacts')) return offPayload([])
      return usdaPayload([{ fdcId: 1, description: 'X', foodNutrients: [
        { nutrientName: 'Energy (Atwater General Factors)', nutrientNumber: '957', value: 999 },
        { nutrientName: 'Energy', nutrientNumber: '208', value: 50 },
      ] }])
    }) as never)
    const r = await lookupFood('x')
    expect(r.hits[0].kcal).toBe(50)
  })

  it('caches, and serves the second search without a request', async () => {
    const fetchMock = vi.fn(async () => offPayload([{ code: '1', product_name: 'Oats', nutriments: { 'energy-kcal_100g': 380 } }]))
    vi.stubGlobal('fetch', fetchMock as never)
    await lookupFood('oats')
    // One thin OFF result correctly triggers the USDA backstop, so the first
    // lookup is two requests. What matters is that the SECOND adds none.
    const afterFirst = fetchMock.mock.calls.length
    const second = await lookupFood('OATS  ')
    expect(second.cached).toBe(true)
    expect(second.hits[0].name).toBe('Oats')
    expect(fetchMock.mock.calls.length).toBe(afterFirst)
    expect(cachedFoodCount()).toBe(1)
  })

  it('reports an error only when nothing came back', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }) as never)
    const r = await lookupFood('anything')
    expect(r.hits).toEqual([])
    expect(r.error).toBeTruthy()
  })

  it('does not cache an empty result', async () => {
    // Otherwise one offline search poisons that query for a month.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }) as never)
    await lookupFood('bread')
    expect(cachedFoodCount()).toBe(0)
  })

  it('collapses the same food returned by both providers', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('openfoodfacts')) return offPayload([{ code: '1', product_name: 'Oats', nutriments: { 'energy-kcal_100g': 380 } }])
      return usdaPayload([{ fdcId: 2, description: 'Oats', foodNutrients: [{ nutrientNumber: '208', value: 380 }] }])
    }) as never)
    const r = await lookupFood('oats')
    expect(r.hits).toHaveLength(1)
  })

  it('returns nothing for an empty query without touching the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock as never)
    expect((await lookupFood('   ')).hits).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
