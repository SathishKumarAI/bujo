import { describe, expect, it } from 'vitest'
import { FOODS, SAMPLE_DAY, sumFoods } from './foods'

describe('foods', () => {
  it('has both cuisines represented', () => {
    expect(FOODS.some((f) => f.cuisine === 'indian')).toBe(true)
    expect(FOODS.some((f) => f.cuisine === 'american')).toBe(true)
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
