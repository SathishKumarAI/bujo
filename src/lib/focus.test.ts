import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { DevSession } from './types'
import { weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, projectedWeeklyMinutes } from './focus'

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
})
