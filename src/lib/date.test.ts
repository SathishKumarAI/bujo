import { describe, expect, it } from 'vitest'
import { addDays, dayDiff, daysInMonth, monthDays, prettyMonth, toISODay, ymOf } from './date'

describe('date helpers', () => {
  it('formats a local ISO day without UTC shift', () => {
    expect(toISODay(new Date(2026, 5, 10))).toBe('2026-06-10')
  })
  it('derives the year-month key', () => {
    expect(ymOf('2026-06-10')).toBe('2026-06')
    expect(ymOf(new Date(2026, 0, 1))).toBe('2026-01')
  })
  it('counts days in a month (incl. leap years)', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 6)).toBe(30)
  })
  it('adds and subtracts days across month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('computes whole-day differences', () => {
    expect(dayDiff('2026-06-01', '2026-06-10')).toBe(9)
    expect(dayDiff('2026-06-10', '2026-06-01')).toBe(-9)
  })
  it('lists all days of a month', () => {
    const days = monthDays('2026-02')
    expect(days).toHaveLength(28)
    expect(days[0]).toBe('2026-02-01')
    expect(days[27]).toBe('2026-02-28')
  })
  it('pretty-prints a month', () => {
    expect(prettyMonth('2026-06')).toBe('June 2026')
  })
})
