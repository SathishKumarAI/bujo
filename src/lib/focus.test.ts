import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { DevSession } from './types'
import { weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, projectedWeeklyMinutes, minutesByWeekday, longestSession } from './focus'

function withSessions(ss: DevSession[]) {
  const d = emptyJournal()
  d.devSessions = ss
  return d
}
const S = (p: Partial<DevSession>): DevSession => ({ id: 'x', date: '2026-06-11', durationMin: 60, focus: 7, stress: 3, ...p })

describe('focus helpers', () => {
  it('sums weekly coding minutes in the window', () => {
    const d = withSessions([S({ date: '2026-06-11', durationMin: 90 }), S({ date: '2026-06-09', durationMin: 30 }), S({ date: '2026-06-01', durationMin: 99 })])
    expect(weeklyCodingMinutes(d, '2026-06-11')).toBe(120)
  })
  it('counts the active-day streak', () => {
    const d = withSessions([S({ date: '2026-06-11' }), S({ date: '2026-06-10' })])
    expect(focusStreak(d, '2026-06-11')).toBe(2)
  })
  it('computes duration-weighted averages as whole numbers', () => {
    const d = withSessions([S({ durationMin: 60, focus: 8 }), S({ durationMin: 60, focus: 6 })])
    expect(avgWeighted(d, 'focus')).toBe(7)
  })
  it('builds a daily series and tag totals', () => {
    const d = withSessions([S({ date: '2026-06-11', durationMin: 45, tags: ['typescript'] })])
    const series = dailyCodingMinutes(d, '2026-06-11', 3)
    expect(series.length).toBe(3)
    expect(series[2]).toEqual({ date: '2026-06-11', min: 45 })
    expect(topTags(d)).toEqual([{ tag: 'typescript', min: 45 }])
  })
  it('projects weekly minutes from the observed pace', () => {
    // 200m over a 4-day span (oldest = 3 days ago) → 200/4*7 = 350
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 50 }),
      S({ date: '2026-06-08', durationMin: 150 }),
    ])
    expect(projectedWeeklyMinutes(d, '2026-06-11')).toBe(350)
  })
  it('returns null projection once the week is fully observed', () => {
    // oldest is 6 days ago → observed = 7 = window, nothing left to project
    const d = withSessions([S({ date: '2026-06-05', durationMin: 60 }), S({ date: '2026-06-11', durationMin: 60 })])
    expect(projectedWeeklyMinutes(d, '2026-06-11')).toBeNull()
  })
  it('returns null projection when nothing logged this week', () => {
    expect(projectedWeeklyMinutes(withSessions([]), '2026-06-11')).toBeNull()
  })
  it('buckets minutes by weekday (Sun..Sat)', () => {
    // 2026-06-11 is a Thursday (idx 4), 2026-06-08 is a Monday (idx 1)
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 60 }),
      S({ date: '2026-06-11', durationMin: 30 }),
      S({ date: '2026-06-08', durationMin: 45 }),
    ])
    const by = minutesByWeekday(d)
    expect(by.length).toBe(7)
    expect(by[4]).toEqual({ day: 4, label: 'Thu', min: 90 })
    expect(by[1]).toEqual({ day: 1, label: 'Mon', min: 45 })
    expect(by[0].min).toBe(0)
  })
  it('finds the longest session', () => {
    const d = withSessions([S({ id: 'a', durationMin: 30 }), S({ id: 'b', durationMin: 120 }), S({ id: 'c', durationMin: 90 })])
    expect(longestSession(d)?.id).toBe('b')
    expect(longestSession(withSessions([]))).toBeNull()
  })
})
