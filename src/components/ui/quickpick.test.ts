import { describe, expect, it } from 'vitest'
import { durationOptions } from './quickpick.options'

describe('durationOptions', () => {
  it('does not count the remainder twice', () => {
    // The bug this exists for. Written inline as `${m / 60}h${m % 60 ...}`,
    // 90 minutes rendered as "1.5h 30m" — the hours were not floored, so the
    // half hour appeared in both halves of the label. It reached a pushed
    // branch because the expression reads as obviously right; only clicking
    // the chip showed it.
    expect(durationOptions([90])[0].label).toBe('1h 30m')
    expect(durationOptions([135])[0].label).toBe('2h 15m')
  })

  it('drops the minutes on a whole hour, and the hours under one', () => {
    expect(durationOptions([60])[0].label).toBe('1h')
    expect(durationOptions([120])[0].label).toBe('2h')
    expect(durationOptions([45])[0].label).toBe('45m')
    expect(durationOptions([0])[0].label).toBe('0m')
  })

  it('keeps the value as the number of minutes, whatever the label says', () => {
    // The label is for the eye; the value is what gets stored. A chip reading
    // "1h 30m" must still write 90.
    expect(durationOptions([25, 90]).map((o) => o.value)).toEqual([25, 90])
  })
})
