import { describe, it, expect } from 'vitest'
import { fastHours, elapsedHours, fmtDuration, fastsOnDay, dayFastHours, fastingStreak, recentFasts } from './fasting'
import type { Fast } from './types'

const fast = (id: string, start: string, end: string): Fast => ({ id, start, end })

describe('fastHours / elapsedHours', () => {
  it('computes a 16h overnight fast', () => {
    expect(fastHours(fast('a', '2026-06-10T20:00:00Z', '2026-06-11T12:00:00Z'))).toBe(16)
  })
  it('never negative', () => {
    expect(fastHours(fast('a', '2026-06-11T12:00:00Z', '2026-06-10T12:00:00Z'))).toBe(0)
  })
  it('elapsed from a start instant', () => {
    const start = '2026-06-11T08:00:00Z'
    const now = new Date('2026-06-11T18:30:00Z').getTime()
    expect(elapsedHours(start, now)).toBe(10.5)
  })
})

describe('fmtDuration', () => {
  it('whole hours', () => expect(fmtDuration(16)).toBe('16h'))
  it('hours + minutes', () => expect(fmtDuration(16.5)).toBe('16h 30m'))
  it('clamps negatives to 0h', () => expect(fmtDuration(-3)).toBe('0h'))
})

describe('fastsOnDay / dayFastHours', () => {
  const fasts = [
    fast('a', '2026-06-10T20:00:00Z', '2026-06-11T12:00:00Z'), // ends 06-11
    fast('b', '2026-06-11T21:00:00Z', '2026-06-12T13:00:00Z'), // ends 06-12
  ]
  it('groups by the day the fast ended', () => {
    expect(fastsOnDay(fasts, '2026-06-11').map((f) => f.id)).toEqual(['a'])
  })
  it('best hours for a day', () => {
    expect(dayFastHours(fasts, '2026-06-12')).toBe(16)
    expect(dayFastHours(fasts, '2026-06-13')).toBe(0)
  })
})

describe('fastingStreak', () => {
  it('counts consecutive days meeting the target, back from today', () => {
    const fasts = [
      fast('a', '2026-06-09T20:00:00Z', '2026-06-10T12:00:00Z'), // 16h, ends 06-10
      fast('b', '2026-06-10T20:00:00Z', '2026-06-11T12:00:00Z'), // 16h, ends 06-11
    ]
    expect(fastingStreak(fasts, 16, '2026-06-11')).toBe(2)
  })
  it('a short fast breaks the streak', () => {
    const fasts = [fast('a', '2026-06-11T20:00:00Z', '2026-06-12T06:00:00Z')] // 10h < 16
    expect(fastingStreak(fasts, 16, '2026-06-12')).toBe(0)
  })
})

describe('recentFasts', () => {
  it('returns newest first, capped', () => {
    const fasts = [
      fast('a', '2026-06-09T20:00:00Z', '2026-06-10T12:00:00Z'),
      fast('b', '2026-06-10T20:00:00Z', '2026-06-11T12:00:00Z'),
    ]
    expect(recentFasts(fasts, 1).map((f) => f.id)).toEqual(['b'])
  })
})
