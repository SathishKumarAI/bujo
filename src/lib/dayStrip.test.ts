import { describe, expect, it } from 'vitest'
import { stepWeek, stripDays } from './dayStrip'

const T = '2026-10-30'

describe('stripDays', () => {
  it('ends a trailing strip on today, never in the future', () => {
    expect(stripDays(T, T, 'trailing')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', T])
  })

  it('keeps the same window while the selection moves inside it', () => {
    expect(stripDays('2026-10-24', T, 'trailing')).toEqual(stripDays(T, T, 'trailing'))
  })

  it('pages back a whole week once the selection leaves the window', () => {
    expect(stripDays('2026-10-23', T, 'trailing')).toEqual(['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])
  })

  it('is the calendar week in week mode', () => {
    expect(stripDays(T, T, 'week', 1)[0]).toBe('2026-10-26')
  })
})

describe('stepWeek', () => {
  it('stops at today going forward and at the start going back', () => {
    expect(stepWeek('2026-10-27', 1, undefined, T)).toBe(T)
    expect(stepWeek('2026-10-25', -1, '2026-10-21')).toBe('2026-10-21')
    expect(stepWeek('2026-10-25', -1)).toBe('2026-10-18')
  })
})
