import { describe, expect, it } from 'vitest'
import { isSurface, morningComplete, surfaceForHour } from './daySurface'

describe('day surfaces', () => {
  it('picks a surface from the clock, with the boundaries where they are stated', () => {
    expect(surfaceForHour(0)).toBe('morning')
    expect(surfaceForHour(10)).toBe('morning')
    expect(surfaceForHour(11)).toBe('day') // "Morning BEFORE 11:00"
    expect(surfaceForHour(17)).toBe('day')
    expect(surfaceForHour(18)).toBe('evening') // "Day UNTIL 18:00"
    expect(surfaceForHour(23)).toBe('evening')
  })

  it('only accepts the three surface names', () => {
    expect(isSurface('morning')).toBe(true)
    expect(isSurface('day')).toBe(true)
    expect(isSurface('evening')).toBe(true)
    expect(isSurface('afternoon')).toBe(false)
    expect(isSurface('')).toBe(false)
    expect(isSurface(null)).toBe(false)
    expect(isSurface(undefined)).toBe(false)
  })

  describe('morningComplete', () => {
    const full = { date: '2026-08-03', mood: 7, stress: 3, energy: 6, sleep: 7.5 }

    it('is true once all four ratings are answered', () => {
      expect(morningComplete(full)).toBe(true)
    })

    it('is false for a day with nothing on it', () => {
      expect(morningComplete(undefined)).toBe(false)
      expect(morningComplete({ date: '2026-08-03' })).toBe(false)
    })

    it('is false while any one rating is still blank', () => {
      // A half-filled check-in is still one to finish — summarising it would
      // hide the fields that are blank.
      for (const k of ['mood', 'stress', 'energy', 'sleep'] as const) {
        expect(morningComplete({ ...full, [k]: undefined })).toBe(false)
      }
    })

    it('counts a zero as an answer, not as missing', () => {
      // The bug this guards: `metric.mood && …` would treat a mood of 0 —
      // the worst possible day — as "not answered yet".
      expect(morningComplete({ ...full, mood: 0, stress: 0, energy: 0, sleep: 0 })).toBe(true)
    })

    it('does not require a first meal', () => {
      expect(morningComplete({ ...full, fastBreak: undefined })).toBe(true)
    })
  })
})
