import { describe, expect, it } from 'vitest'
import { displayDistance, fromKm, toKm } from './units'

describe('distance units', () => {
  it('km is the identity — it is the canonical unit', () => {
    expect(toKm(5, 'km')).toBe(5)
    expect(fromKm(5, 'km')).toBe(5)
  })
  it('converts miles in and out', () => {
    expect(toKm(3, 'mi')).toBeCloseTo(4.828, 3)
    expect(fromKm(4.828, 'mi')).toBeCloseTo(3, 3)
  })
  it('round-trips without drift, so editing a session cannot shrink it', () => {
    // The old form re-read its own stored value through a different conversion
    // than it wrote; a save-reopen-save cycle walked the number.
    for (const v of [1, 3.1, 10, 26.2]) {
      expect(fromKm(toKm(v, 'mi'), 'mi')).toBeCloseTo(v, 6)
    }
  })
  it('displayDistance rounds to one decimal and treats missing as zero', () => {
    expect(displayDistance(4.828, 'mi')).toBe(3)
    expect(displayDistance(5.55, 'km')).toBe(5.6)
    expect(displayDistance(undefined, 'mi')).toBe(0)
  })
})
