import { describe, expect, it } from 'vitest'
import { withFoodAdded, withFoodEdited, withFoodRemoved, withFoodServings, FOODS } from './foods'
import type { DailyMetric, LoggedFood } from './types'

/**
 * "How can I undo the food I logged if I mis-clicked?"
 *
 * The answer used to be that the app could not, at any price: adding folded a
 * food's macros into four running totals and threw the food away, so there was
 * nothing left to remove. These tests pin the property that makes undo possible
 * — **removing gives back exactly what adding took** — because an undo that is
 * approximately right is a slow corruption of the numbers people trust.
 */
const day = (over: Partial<DailyMetric> = {}): DailyMetric => ({ date: '2026-10-06', ...over })
const food = FOODS[0]

describe('a logged food can be taken back off', () => {
  it('restores every macro exactly', () => {
    const before = day({ calories: 500, protein: 30, carbs: 50, fat: 15 })
    const added = { ...before, ...withFoodAdded(before, food, 'f1') }
    const entry = added.foodLog![0]
    const back = { ...added, ...withFoodRemoved(added, entry) }
    expect(back.calories).toBe(before.calories)
    expect(back.protein).toBe(before.protein)
    expect(back.carbs).toBe(before.carbs)
    expect(back.fat).toBe(before.fat)
    expect(back.foodLog).toEqual([])
  })

  it('counts a repeat of the same food as a serving, and undoes it by one', () => {
    /*
      THE MODEL CHANGED HERE, and this test changed with it.
      It used to assert that the same chip pressed twice wrote TWO entries, and
      that removing one left the other. That was the mis-tap case — but it was
      also the "I had three helpings of rice" case, and a day of rice read as
      three identical rows the review then counted as three foods. Asked for as
      "let's say I had a lot of rice today, so I want to add more rice on top
      of it".

      The property this test exists for is unchanged and still asserted below:
      **undoing gives back exactly what adding took.** What moved is where the
      undo lives — `−` on the row rather than `×` on one of two rows, with the
      delete reserved for taking the food off the day entirely.
    */
    let m = day()
    m = { ...m, ...withFoodAdded(m, food, 'f1') }
    m = { ...m, ...withFoodAdded(m, food, 'f2') }
    expect(m.foodLog).toHaveLength(1)
    expect(m.foodLog![0].servings).toBe(2)
    expect(m.calories).toBe(food.kcal * 2)

    // One serving back: the row survives and the day is exactly where it was.
    m = { ...m, ...withFoodServings(m, m.foodLog![0], 1) }
    expect(m.foodLog!.map((f) => f.id)).toEqual(['f1'])
    expect(m.calories).toBe(food.kcal)

    // And the whole row off: back to nothing, with nothing left over.
    m = { ...m, ...withFoodRemoved(m, m.foodLog![0]) }
    expect(m.foodLog).toEqual([])
    expect(m.calories).toBe(0)
  })

  it('still keeps two DIFFERENT foods apart', () => {
    let m = day()
    m = { ...m, ...withFoodAdded(m, food, 'f1') }
    m = { ...m, ...withFoodAdded(m, FOODS[1], 'f2') }
    expect(m.foodLog!.map((f) => f.id)).toEqual(['f1', 'f2'])
    m = { ...m, ...withFoodRemoved(m, m.foodLog![0]) }
    expect(m.foodLog!.map((f) => f.id)).toEqual(['f2'])
  })

  it('never drives a total negative when the numbers were also typed by hand', () => {
    // Log a chip, then lower the total yourself, then undo the chip. Naive
    // subtraction goes negative, and a negative-calorie day is a worse lie
    // than an approximate one.
    let m = day()
    m = { ...m, ...withFoodAdded(m, food, 'f1') }
    const entry = m.foodLog![0]
    m = { ...m, calories: 10, protein: 0, carbs: 0, fat: 0 }
    m = { ...m, ...withFoodRemoved(m, entry) }
    expect(m.calories).toBe(0)
    expect(m.protein).toBe(0)
  })

  it('adds to a day that has never been logged', () => {
    const m = withFoodAdded(undefined, food, 'f1')
    expect(m.calories).toBe(food.kcal)
    expect(m.foodLog).toHaveLength(1)
  })

  it('removing something not in the log changes nothing but is not an error', () => {
    let m = day({ calories: 100 })
    m = { ...m, ...withFoodAdded(m, food, 'f1') }
    const ghost: LoggedFood = { id: 'nope', name: 'x', kcal: 999, protein: 0, carbs: 0, fat: 0 }
    const after = { ...m, ...withFoodRemoved(m, ghost) }
    // The totals still move — the caller asked to subtract a thing. What must
    // NOT happen is the log losing an unrelated entry.
    expect(after.foodLog!.map((f) => f.id)).toEqual(['f1'])
  })
})

/**
 * Editing a row, which is the half of "I can't edit it or delete it" that did
 * not exist at all. The property is the same one as the undo's: the day's
 * totals move by exactly what the row moved by — never by a recount, because a
 * day's totals can also be typed by hand and a recount would throw that away.
 */
describe('a logged food can be corrected', () => {
  it('moves the day by the delta rather than re-summing the log', () => {
    // A hand-typed 3,000 with one logged row on it. Editing the row to 300
    // must leave 3,000 − the row + 300, not 300.
    const base = day({ calories: 3000, protein: 100, carbs: 300, fat: 80 })
    const m = { ...base, ...withFoodAdded(base, food, 'f1') } as DailyMetric
    const entry = m.foodLog![0]
    const after = withFoodEdited(m, entry, { name: 'Corrected', kcal: 300, protein: 20, carbs: 40, fat: 5 })
    expect(after.calories).toBe(3000 + food.kcal - entry.kcal + 300 - 0 + 0)
    expect(after.calories).toBe(3000 + 300)
    expect(after.foodLog![0].name).toBe('Corrected')
    expect(after.foodLog![0].id).toBe('f1')
  })

  it('is a no-op when the serving count has not moved', () => {
    const m = { ...day(), ...withFoodAdded(day(), food, 'f1') } as DailyMetric
    expect(withFoodServings(m, m.foodLog![0], 1)).toEqual({})
  })

  it('rounds per field, so three servings is not three roundings of a third', () => {
    const m = { ...day(), ...withFoodAdded(day(), food, 'f1') } as DailyMetric
    const up = withFoodServings(m, m.foodLog![0], 3)
    expect(up.foodLog![0].kcal).toBe(food.kcal * 3)
    expect(up.calories).toBe(food.kcal * 3)
  })
})
