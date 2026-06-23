import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { DevSession } from './types'
import { weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, projectedWeeklyMinutes, minutesByWeekday, longestSession, minutesByProject, interruptionsTrend, deepWorkHeatmap, focusByWeekday } from './focus'

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
  it('groups minutes by project, highest first, bucketing blanks', () => {
    const d = withSessions([
      S({ project: 'bujo', durationMin: 60 }),
      S({ project: 'bujo', durationMin: 30 }),
      S({ project: 'work', durationMin: 120 }),
      S({ project: '  ', durationMin: 15 }),
    ])
    expect(minutesByProject(d)).toEqual([
      { project: 'work', min: 120 },
      { project: 'bujo', min: 90 },
      { project: '(no project)', min: 15 },
    ])
    expect(minutesByProject(d, 1)).toEqual([{ project: 'work', min: 120 }])
    expect(minutesByProject(withSessions([]))).toEqual([])
  })
  it('builds an interruptions trend averaging per day, ignoring null', () => {
    const d = withSessions([
      S({ date: '2026-06-11', interruptions: 2 }),
      S({ date: '2026-06-11', interruptions: 4 }),
      S({ date: '2026-06-10', interruptions: 1 }),
      S({ date: '2026-06-09' }), // no interruptions field → not counted
    ])
    const t = interruptionsTrend(d, '2026-06-11', 3)
    expect(t.length).toBe(3)
    expect(t[0]).toEqual({ date: '2026-06-09', avg: 0, count: 0 })
    expect(t[1]).toEqual({ date: '2026-06-10', avg: 1, count: 1 })
    expect(t[2]).toEqual({ date: '2026-06-11', avg: 3, count: 2 })
  })

  it('builds a deep-work heatmap aligned to whole Sun..Sat weeks', () => {
    // today 2026-06-11 is a Thursday (wd 4) → window ends Sat 2026-06-13
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 120 }),
      S({ date: '2026-06-11', durationMin: 60 }), // same day → 180 total (busiest)
      S({ date: '2026-06-08', durationMin: 90 }),
    ])
    const { cells, max } = deepWorkHeatmap(d, '2026-06-11', 2)
    expect(cells.length).toBe(14) // 2 weeks * 7
    expect(max).toBe(180)
    expect(cells[0].weekday).toBe(0) // starts on a Sunday
    expect(cells[cells.length - 1].date).toBe('2026-06-13') // ends Saturday
    const thu = cells.find((c) => c.date === '2026-06-11')!
    expect(thu.min).toBe(180)
    expect(thu.level).toBe(4) // busiest day → top level
    const mon = cells.find((c) => c.date === '2026-06-08')!
    expect(mon.min).toBe(90)
    expect(mon.level).toBe(2) // 90/180 = 0.5 → ceil(2)
    const empty = cells.find((c) => c.date === '2026-06-09')!
    expect(empty.level).toBe(0)
  })

  it('heatmap reports a zero max and all-zero levels with no sessions', () => {
    const { cells, max } = deepWorkHeatmap(withSessions([]), '2026-06-11', 1)
    expect(max).toBe(0)
    expect(cells.every((c) => c.level === 0 && c.min === 0)).toBe(true)
  })

  it('averages focus score by weekday, duration-weighted', () => {
    // both Thursday: focus 8 over 60m and focus 6 over 60m → 7.0
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 60, focus: 8 }),
      S({ date: '2026-06-11', durationMin: 60, focus: 6 }),
      S({ date: '2026-06-08', durationMin: 30, focus: 9 }), // Monday
    ])
    const by = focusByWeekday(d)
    expect(by.length).toBe(7)
    expect(by[4]).toEqual({ day: 4, label: 'Thu', avg: 7, count: 2 })
    expect(by[1]).toEqual({ day: 1, label: 'Mon', avg: 9, count: 1 })
    expect(by[0]).toEqual({ day: 0, label: 'Sun', avg: 0, count: 0 })
  })
})
