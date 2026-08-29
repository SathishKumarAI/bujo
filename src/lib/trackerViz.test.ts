import { describe, expect, it } from 'vitest'
import { dayCompletion, weekdayConsistency, monthlyCompletion } from './stats'
import { emptyJournal } from './storage'
import type { Habit } from './types'

const habit = (id: string): Habit => ({ id, name: id, category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })

describe('tracker visualisations', () => {
  it('dayCompletion is null when nothing is scheduled', () => {
    expect(dayCompletion(emptyJournal(), '2026-06-10').ratio).toBeNull()
  })

  it('dayCompletion ratio reflects done/scheduled', () => {
    const d = emptyJournal()
    d.habits = [habit('a'), habit('b')]
    d.habitLog = { '2026-06-10': ['a'] }
    const c = dayCompletion(d, '2026-06-10')
    expect(c).toMatchObject({ done: 1, total: 2 })
    expect(c.ratio).toBeCloseTo(0.5)
  })

  it('weekdayConsistency returns 7 values in 0..1', () => {
    const d = emptyJournal()
    d.habits = [habit('a')]
    d.habitLog = { '2026-06-11': ['a'] }
    const wd = weekdayConsistency(d, 30, '2026-06-12')
    expect(wd).toHaveLength(7)
    // `not.toBeNull()` first: `expect(null).toBeGreaterThanOrEqual(0)` passes,
    // so a range assertion alone would have kept passing whatever this
    // returned. Every weekday has scheduled days here — the habit starts in
    // January — so a null in this fixture is a bug, not a no-data case.
    wd.forEach((v) => { expect(v).not.toBeNull(); expect(v!).toBeGreaterThanOrEqual(0); expect(v!).toBeLessThanOrEqual(1) })
  })

  /**
   * The distinction the charts are drawn from: a period with nothing scheduled
   * is unknown, not zero. Reporting it as 0 drew "Best weekdays" a bar at the
   * floor for a day the user was never asked to do anything on, and opened
   * "Monthly trend" with two months of apparent total failure that merely
   * predate the first habit.
   */
  it('weekdayConsistency is null for a weekday with nothing ever scheduled', () => {
    const d = emptyJournal()
    // Starts Thursday 2026-06-11; the window is the two days up to Friday, so
    // only Thu and Fri were ever scheduled.
    d.habits = [{ ...habit('a'), startedOn: '2026-06-11' }]
    d.habitLog = { '2026-06-11': ['a'] }
    const wd = weekdayConsistency(d, 2, '2026-06-12')
    expect(wd[4]).toBe(1)      // Thursday, done
    expect(wd[5]).toBe(0)      // Friday, scheduled and missed — a real zero
    expect(wd[0]).toBeNull()   // Sunday, never scheduled — not a zero
  })

  it('monthlyCompletion returns the requested number of months, oldest first', () => {
    const m = monthlyCompletion(emptyJournal(), 6, '2026-06-12')
    expect(m).toHaveLength(6)
    expect(m[0].ym < m[5].ym).toBe(true)
  })

  it('monthlyCompletion is null for months before anything was scheduled', () => {
    const d = emptyJournal()
    d.habits = [{ ...habit('a'), startedOn: '2026-06-01' }]
    d.habitLog = { '2026-06-10': ['a'] }
    const m = monthlyCompletion(d, 3, '2026-06-12')
    expect(m.map((x) => x.ym)).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(m[0].ratio).toBeNull()
    expect(m[1].ratio).toBeNull()
    expect(m[2].ratio).not.toBeNull()
  })
})
