import { describe, expect, it } from 'vitest'
import { generateDemoData } from './demo'
import { FOODS } from './foods'
import { topFoods } from './nutritionReview'

/**
 * THE DEMO'S FOOD RECEIPT ACTUALLY RESOLVES.
 *
 * Written after it stopped. `demoFoodLog` looks its names up in `FOODS` and
 * drops the misses — so when the library was rewritten from 48 foods to 103,
 * three of its six picks (`Chicken breast`, `Dal`, `Roti`) silently became
 * nothing. The seed kept running, `tsc`, eslint, vitest and the build stayed
 * green, and the only symptom was Nutrition's "What it was made of" card
 * rendering **two rows** on the demo journal — which reads as a thin feature
 * rather than as a broken seed.
 *
 * This is the repo's standing rule in a new place: **a lookup that silently
 * finds nothing passes.** The assertion is on the COUNT, because a name that
 * resolves to nothing contributes nothing and leaves no trace.
 */
const TODAY = '2026-10-16'

describe('the demo food log', () => {
  const data = generateDemoData(TODAY)
  const withFood = data.metrics.filter((m) => (m.foodLog?.length ?? 0) > 0)

  it('puts a receipt on a full fortnight, which is the window the cards read', () => {
    // `topFoods` reads 14 days. A seed covering four of them gives the page's
    // best card a third of its window and no way to say so.
    expect(withFood.length).toBeGreaterThanOrEqual(14)
  })

  it('resolves every name it seeds — no silent drops', () => {
    const known = new Set(FOODS.map((f) => f.name))
    for (const m of withFood) {
      for (const f of m.foodLog!) {
        expect(known.has(f.name), `${f.name} is not in FOODS any more`).toBe(true)
      }
    }
  })

  it('seeds at least three foods on every day it touches', () => {
    // The guard that actually caught the regression: a dropped name shortens
    // the day instead of failing, so assert the length the seed intends.
    for (const m of withFood) {
      expect(m.foodLog!.length, `${m.date} has a short receipt`).toBeGreaterThanOrEqual(3)
    }
  })

  it('carries real macros, so the share-of-calories card has something to divide', () => {
    for (const m of withFood) {
      for (const f of m.foodLog!) {
        expect(f.kcal).toBeGreaterThan(0)
      }
    }
  })

  it('gives the fortnight enough distinct foods for the Patterns card to be a list', () => {
    const top = topFoods(data, 14, TODAY)
    // Two rows is a stub. The card ranks by share of calories and is worth a
    // panel at five or more.
    expect(top.length).toBeGreaterThanOrEqual(5)
    expect(top[0].kcal).toBeGreaterThan(0)
  })
})
