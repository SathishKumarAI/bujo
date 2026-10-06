import { describe, expect, it } from 'vitest'
import { FOODS, KCAL_BANDS, KCAL_LIGHT_MAX, KCAL_MODERATE_MAX, SAMPLE_DAY, kcalBand, sumFoods } from './foods'

describe('foods', () => {
  it('has both cuisines represented', () => {
    expect(FOODS.some((f) => f.cuisine === 'indian')).toBe(true)
    expect(FOODS.some((f) => f.cuisine === 'american')).toBe(true)
  })

  it('is only the two cuisines the owner eats — nothing else leaks in', () => {
    expect([...new Set(FOODS.map((f) => f.cuisine))].sort()).toEqual(['american', 'indian'])
  })

  it('kcalBand cuts exactly at the stated boundaries', () => {
    expect(kcalBand(KCAL_LIGHT_MAX)).toBe('light')
    expect(kcalBand(KCAL_LIGHT_MAX + 1)).toBe('moderate')
    expect(kcalBand(KCAL_MODERATE_MAX)).toBe('moderate')
    expect(kcalBand(KCAL_MODERATE_MAX + 1)).toBe('heavy')
    expect(kcalBand(0)).toBe('light')
  })

  // The picker draws a three-tone legend. A band no food falls in is a key
  // entry pointing at nothing — the legend would promise a distinction the
  // list cannot show.
  it('every band has at least one food in it, so the legend is never dead', () => {
    for (const band of Object.keys(KCAL_BANDS) as (keyof typeof KCAL_BANDS)[]) {
      expect(FOODS.filter((f) => kcalBand(f.kcal) === band).length).toBeGreaterThan(0)
    }
  })

  it('sumFoods adds macros across a list', () => {
    const t = sumFoods([
      { name: 'a', serving: '1', kcal: 100, protein: 10, carbs: 5, fat: 2, cuisine: 'american' },
      { name: 'b', serving: '1', kcal: 200, protein: 20, carbs: 10, fat: 4, cuisine: 'indian' },
    ])
    expect(t).toEqual({ calories: 300, protein: 30, carbs: 15, fat: 6 })
  })

  it('the sample day is a realistic ~1500–2200 kcal', () => {
    const t = sumFoods(SAMPLE_DAY)
    expect(t.calories).toBeGreaterThan(1400)
    expect(t.calories).toBeLessThan(2300)
    expect(t.protein).toBeGreaterThan(80)
  })
})
