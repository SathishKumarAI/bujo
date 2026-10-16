import { describe, expect, it } from 'vitest'
import { FOODS, KCAL_BANDS, KCAL_LIGHT_MAX, KCAL_MODERATE_MAX, SAMPLE_DAY, foodMatches, kcalBand, sumFoods } from './foods'

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

/**
 * The library grew from 48 to 86 foods on request ("add eggs, milk, rice,
 * biryani … and English food, food from Walmart, sourdough bread"). Two
 * properties are worth asserting over a hand-typed data table that size, and
 * both catch the same mistake — a dropped or added zero:
 *
 * 1. **Every food states its serving.** "230 kcal of rice" is not a fact; "1
 *    cup cooked" is what makes it one, and the ask included "how many rice?".
 * 2. **The macros are in the same ballpark as the calories.** 4·4·9 arithmetic
 *    is deliberately NOT enforced exactly — fibre, alcohol and rounding all
 *    break it, and `foodIssues` refuses to argue with a real packet for the
 *    same reason — but a value off by more than 45% is a typo, not a label.
 */
describe('the food library is typed by hand, so it is checked by machine', () => {
  it('gives every food a serving to make its numbers mean something', () => {
    for (const f of FOODS) {
      expect(f.serving.trim(), `${f.name} has no serving`).not.toBe('')
      expect(f.kcal, `${f.name} has no calories`).toBeGreaterThan(0)
    }
  })

  it('keeps every food’s macros within a sane distance of its calories', () => {
    for (const f of FOODS) {
      const fromMacros = f.protein * 4 + f.carbs * 4 + f.fat * 9
      const slack = Math.max(60, f.kcal * 0.45)
      expect(Math.abs(fromMacros - f.kcal), `${f.name}: ${f.kcal} kcal vs ${fromMacros} from macros`).toBeLessThanOrEqual(slack)
    }
  })

  it('has grown, and every name is distinct', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(80)
    expect(new Set(FOODS.map((f) => f.name.toLowerCase())).size).toBe(FOODS.length)
  })
})

describe('foodMatches', () => {
  it('matches a food by name or serving, case-insensitively', () => {
    const rice = FOODS.find((f) => f.name === 'Basmati rice (cooked)')!
    expect(foodMatches(rice, 'RICE')).toBe(true)
    expect(foodMatches(rice, 'cup')).toBe(true)
    expect(foodMatches(rice, 'biryani')).toBe(false)
    expect(foodMatches(rice, '  ')).toBe(true)
  })
})
