import { describe, expect, it } from 'vitest'
import { weekColumn, weekdayLabels } from './date'
import { habitStreak } from './stats'
import { emptyJournal } from './storage'

describe('week start helpers', () => {
  it('orders weekday labels for Sunday vs Monday start', () => {
    expect(weekdayLabels(0)[0]).toBe('Sun')
    expect(weekdayLabels(1)[0]).toBe('Mon')
    expect(weekdayLabels(1)[6]).toBe('Sun')
  })
  it('computes the grid column for a date', () => {
    // 2026-06-10 is a Wednesday (getDay()===3)
    expect(weekColumn('2026-06-10', 0)).toBe(3) // Sun-start
    expect(weekColumn('2026-06-10', 1)).toBe(2) // Mon-start
  })
})

describe('habitStreak', () => {
  it('counts consecutive days a habit was done', () => {
    const d = { ...emptyJournal(), habitLog: { '2026-06-10': ['h'], '2026-06-09': ['h'], '2026-06-08': ['h'] } }
    expect(habitStreak(d, 'h', '2026-06-10')).toBe(3)
  })
  it('breaks on a missed day', () => {
    const d = { ...emptyJournal(), habitLog: { '2026-06-10': ['h'], '2026-06-08': ['h'] } }
    expect(habitStreak(d, 'h', '2026-06-10')).toBe(1)
  })
})
