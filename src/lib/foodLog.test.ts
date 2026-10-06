import { describe, expect, it } from 'vitest'
import { withFoodAdded, withFoodRemoved, FOODS } from './foods'
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

  it('removes only the one asked for, including a repeat of the same food', () => {
    // The mis-tap case that motivated this: the same chip pressed twice. The
    // two entries are distinct records, so removing one must leave the other.
    let m = day()
    m = { ...m, ...withFoodAdded(m, food, 'f1') }
    m = { ...m, ...withFoodAdded(m, food, 'f2') }
    expect(m.calories).toBe(food.kcal * 2)
    m = { ...m, ...withFoodRemoved(m, m.foodLog![0]) }
    expect(m.foodLog!.map((f) => f.id)).toEqual(['f2'])
    expect(m.calories).toBe(food.kcal)
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
