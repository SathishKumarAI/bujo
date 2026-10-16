import { describe, expect, it } from 'vitest'
import { EXTREME_FLOOR, bestInTargetRun, dailySeries, extremes, heatDays } from './nutritionSeries'
import { DEFAULT_TARGETS } from './nutritionReview'
import type { DailyMetric, JournalData } from './types'

/**
 * The series behind the Trend row's two new visuals.
 *
 * The property worth pinning is the one this repo has got wrong twice: **a day
 * nobody logged is not a day of zero calories.** Every test here is about the
 * difference between "no measurement" and "a measurement of nothing".
 */
const data = (metrics: DailyMetric[]): JournalData => ({
  entries: [], habits: [], workouts: [], metrics, collections: [], settings: {},
} as unknown as JournalData)

const TODAY = '2026-10-16'

describe('dailySeries', () => {
  it('runs ascending and covers every day in the window, logged or not', () => {
    const s = dailySeries(data([{ date: '2026-10-15', calories: 1800 }]), 5, TODAY)
    expect(s).toHaveLength(5)
    expect(s[0].date).toBe('2026-10-12')
    expect(s[4].date).toBe(TODAY)
  })

  it('gives an unlogged day null, never zero', () => {
    const s = dailySeries(data([{ date: TODAY, calories: 1800 }]), 3, TODAY)
    expect(s.map((d) => d.kcal)).toEqual([null, null, 1800])
    // The distinction the chart draws as a gap. `0` here would be a claim that
    // the person ate nothing on a day they simply did not open the app.
    expect(s[0].kcal).not.toBe(0)
  })

  it('marks a day over only past the slack, and never on an unlogged day', () => {
    const s = dailySeries(data([
      { date: '2026-10-15', calories: 2080 }, // inside 5%
      { date: TODAY, calories: 2400 },
    ]), 3, TODAY, DEFAULT_TARGETS)
    expect(s.map((d) => d.over)).toEqual([false, false, true])
  })

  it('labels the x axis without the weekday, which repeats across eight weeks', () => {
    const s = dailySeries(data([]), 1, TODAY)
    expect(s[0].label).not.toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),/)
    expect(s[0].label.length).toBeGreaterThan(2)
  })
})

describe('extremes', () => {
  it('returns nulls under the floor rather than describing one day twice', () => {
    const s = dailySeries(data([{ date: TODAY, calories: 1800 }]), 7, TODAY)
    const e = extremes(s)
    expect(e.logged).toBe(1)
    expect(e.high).toBeNull()
    expect(e.low).toBeNull()
    expect(e.spread).toBeNull()
  })

  it('finds the peak and the trough once the floor is met', () => {
    const s = dailySeries(data([
      { date: '2026-10-14', calories: 1500 },
      { date: '2026-10-15', calories: 2900 },
      { date: TODAY, calories: 2000 },
    ]), 7, TODAY)
    const e = extremes(s)
    expect(e.logged).toBe(EXTREME_FLOOR)
    expect(e.high?.kcal).toBe(2900)
    expect(e.low?.kcal).toBe(1500)
    expect(e.spread).toBe(1400)
  })

  it('ignores the unlogged days when picking the trough', () => {
    // The bug this guards: a `0` for an unlogged day wins "lowest" every time,
    // and the card then reports a 2,900 kcal spread on a steady fortnight.
    const s = dailySeries(data([
      { date: '2026-10-10', calories: 1900 },
      { date: '2026-10-14', calories: 2100 },
      { date: TODAY, calories: 2000 },
    ]), 14, TODAY)
    expect(extremes(s).low?.kcal).toBe(1900)
  })
})

describe('heatDays', () => {
  it('emits one cell per day with zero for the days nobody logged', () => {
    const h = heatDays(data([{ date: TODAY, calories: 2100 }]), 4, TODAY)
    expect(h).toHaveLength(4)
    expect(h.at(-1)).toEqual({ date: TODAY, value: 2100 })
    // Zero is the heatmap's own spelling of "empty" — it quartiles over the
    // non-zero days, so these draw as the empty ground and never as a level.
    expect(h.slice(0, 3).every((d) => d.value === 0)).toBe(true)
  })
})

describe('bestInTargetRun', () => {
  it('counts the longest run and is broken by a gap, not only by going over', () => {
    const s = dailySeries(data([
      { date: '2026-10-11', calories: 1900 },
      { date: '2026-10-12', calories: 1950 },
      // 13th unlogged — a gap is not a day inside target
      { date: '2026-10-14', calories: 1800 },
      { date: '2026-10-15', calories: 1850 },
      { date: TODAY, calories: 1900 },
    ]), 7, TODAY)
    expect(bestInTargetRun(s, DEFAULT_TARGETS)).toBe(3)
  })

  it('is zero when every logged day went over', () => {
    const s = dailySeries(data([
      { date: '2026-10-15', calories: 3000 },
      { date: TODAY, calories: 2600 },
    ]), 4, TODAY)
    expect(bestInTargetRun(s, DEFAULT_TARGETS)).toBe(0)
  })
})
