import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { TypingSession } from './types'
import {
  isWeekday, typingTodayMinutes, typingWeekMinutes, typingGoalProgress,
  bestWpm, avgWpm, wpmTrend, typingStreak, DEFAULT_TYPING_GOAL_MIN,
} from './typing'

function withSessions(ss: TypingSession[]) {
  const d = emptyJournal()
  d.typingSessions = ss
  return d
}
const T = (p: Partial<TypingSession>): TypingSession => ({ id: 'x', date: '2026-06-11', durationMin: 30, ...p })

describe('isWeekday', () => {
  it('flags Mon–Fri as weekdays, weekends false', () => {
    // 2026-06-11 is a Thursday; 2026-06-13 Sat, 2026-06-14 Sun, 2026-06-15 Mon.
    expect(isWeekday('2026-06-11')).toBe(true)
    expect(isWeekday('2026-06-13')).toBe(false)
    expect(isWeekday('2026-06-14')).toBe(false)
    expect(isWeekday('2026-06-15')).toBe(true)
  })
})

describe('minutes', () => {
  it('sums today minutes only', () => {
    const d = withSessions([T({ date: '2026-06-11', durationMin: 30 }), T({ date: '2026-06-11', durationMin: 20 }), T({ date: '2026-06-10', durationMin: 99 })])
    expect(typingTodayMinutes(d, '2026-06-11')).toBe(50)
  })
  it('returns 0 for empty data', () => {
    expect(typingTodayMinutes(emptyJournal(), '2026-06-11')).toBe(0)
    expect(typingWeekMinutes(emptyJournal(), '2026-06-11')).toBe(0)
  })
  it('sums minutes inside the rolling week window', () => {
    const d = withSessions([T({ date: '2026-06-11', durationMin: 40 }), T({ date: '2026-06-09', durationMin: 20 }), T({ date: '2026-06-01', durationMin: 99 })])
    expect(typingWeekMinutes(d, '2026-06-11')).toBe(60)
  })
})

describe('typingGoalProgress', () => {
  it('computes pct + met against the 60m default goal', () => {
    const d = withSessions([T({ date: '2026-06-11', durationMin: 30 })])
    const p = typingGoalProgress(d, '2026-06-11')
    expect(p).toEqual({ minutes: 30, goalMin: 60, pct: 50, met: false })
  })
  it('clamps pct at 100 and marks met when reached', () => {
    const d = withSessions([T({ date: '2026-06-11', durationMin: 90 })])
    const p = typingGoalProgress(d, '2026-06-11')
    expect(p.pct).toBe(100)
    expect(p.met).toBe(true)
  })
  it('honours a custom goal and avoids divide-by-zero', () => {
    const d = withSessions([T({ date: '2026-06-11', durationMin: 15 })])
    expect(typingGoalProgress(d, '2026-06-11', 30).pct).toBe(50)
    // goal of 0 falls back to the default rather than dividing by zero.
    expect(typingGoalProgress(d, '2026-06-11', 0).goalMin).toBe(DEFAULT_TYPING_GOAL_MIN)
    expect(Number.isFinite(typingGoalProgress(d, '2026-06-11', 0).pct)).toBe(true)
  })
})

describe('wpm stats', () => {
  it('best/avg are 0 when no session has wpm', () => {
    const d = withSessions([T({}), T({})])
    expect(bestWpm(d)).toBe(0)
    expect(avgWpm(d)).toBe(0)
  })
  it('ignores sessions without wpm in best/avg', () => {
    const d = withSessions([T({ wpm: 60 }), T({}), T({ wpm: 80 })])
    expect(bestWpm(d)).toBe(80)
    expect(avgWpm(d)).toBe(70)
  })
  it('avgWpm windows by days', () => {
    const d = withSessions([T({ date: '2026-06-11', wpm: 80 }), T({ date: '2026-06-01', wpm: 40 })])
    expect(avgWpm(d, 7, '2026-06-11')).toBe(80)
    expect(avgWpm(d, undefined, '2026-06-11')).toBe(60)
  })
})

describe('wpmTrend', () => {
  it('builds a dated series, marking days with/without a wpm session', () => {
    const d = withSessions([T({ date: '2026-06-11', wpm: 70 }), T({ date: '2026-06-11', wpm: 90 })])
    const series = wpmTrend(d, 3, '2026-06-11')
    expect(series.length).toBe(3)
    expect(series[2]).toEqual({ date: '2026-06-11', wpm: 90, has: true }) // takes the day's best
    expect(series[0].has).toBe(false)
    expect(series[0].wpm).toBe(0)
  })
  it('is empty-safe', () => {
    const series = wpmTrend(emptyJournal(), 2, '2026-06-11')
    expect(series.every((s) => !s.has)).toBe(true)
  })
})

describe('typingStreak', () => {
  it('is 0 for empty data', () => {
    expect(typingStreak(emptyJournal(), '2026-06-11')).toBe(0)
  })
  it('counts consecutive practiced weekdays', () => {
    // Wed 2026-06-10, Thu 2026-06-11.
    const d = withSessions([T({ date: '2026-06-10' }), T({ date: '2026-06-11' })])
    expect(typingStreak(d, '2026-06-11')).toBe(2)
  })
  it('a missed weekday breaks the streak', () => {
    // Practiced Tue 06-09 and Thu 06-11 but NOT Wed 06-10 → streak only counts Thu.
    const d = withSessions([T({ date: '2026-06-09' }), T({ date: '2026-06-11' })])
    expect(typingStreak(d, '2026-06-11')).toBe(1)
  })
  it('treats weekends as neutral — they neither break nor extend the streak', () => {
    // Fri 2026-06-12 and Mon 2026-06-15 practiced, weekend (Sat/Sun) skipped.
    const d = withSessions([T({ date: '2026-06-12' }), T({ date: '2026-06-15' })])
    expect(typingStreak(d, '2026-06-15')).toBe(2)
  })
  it('does not zero a real streak when today is not yet logged', () => {
    // Today = Mon 2026-06-15 unlogged, but Fri 06-12 practiced → still 1.
    const d = withSessions([T({ date: '2026-06-12' })])
    expect(typingStreak(d, '2026-06-15')).toBe(1)
  })
})
