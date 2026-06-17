import { describe, it, expect } from 'vitest'
import { completionByHour, totalCheckins, peakHour, fmtHour } from './checkin'
import { emptyJournal } from './storage'

function withTimes(times: Record<string, Record<string, string>>) {
  return { ...emptyJournal(), habitTimes: times }
}

describe('completionByHour', () => {
  it('buckets timestamps by local hour', () => {
    const d = withTimes({
      '2026-06-10': { h1: '2026-06-10T07:30:00', h2: '2026-06-10T07:50:00' },
      '2026-06-11': { h1: '2026-06-11T20:00:00' },
    })
    const hours = completionByHour(d)
    expect(hours[7]).toBe(2)
    expect(hours[20]).toBe(1)
    expect(totalCheckins(hours)).toBe(3)
  })
  it('empty history → all zero, no peak', () => {
    const hours = completionByHour(emptyJournal())
    expect(totalCheckins(hours)).toBe(0)
    expect(peakHour(hours)).toBeNull()
  })
})

describe('peakHour / fmtHour', () => {
  it('finds the busiest hour', () => {
    const d = withTimes({ x: { a: '2026-06-10T06:00:00', b: '2026-06-10T06:10:00', c: '2026-06-10T09:00:00' } })
    expect(peakHour(completionByHour(d))).toBe(6)
  })
  it('formats 12-hour clock', () => {
    expect(fmtHour(0)).toBe('12am')
    expect(fmtHour(9)).toBe('9am')
    expect(fmtHour(13)).toBe('1pm')
  })
})
