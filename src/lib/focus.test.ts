import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { DevSession } from './types'
import { weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags } from './focus'

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
})
