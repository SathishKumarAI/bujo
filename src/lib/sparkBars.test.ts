import { describe, expect, it } from 'vitest'
import { barHeight } from './sparkBars'

/**
 * The bar heights, in px, after the chart spent its life drawing bars only
 * where there was no data.
 *
 * `height: ${(count / max) * 100}%` on a flex child with no height of its own
 * has no containing block to resolve against, so every real bar computed to
 * **0px** while the zero-weeks — which used an absolute `6px` — were the only
 * thing that drew. jsdom has no layout, so this cannot be asserted as
 * geometry; what it CAN assert is the property that made the bug possible:
 * the function returns a number of pixels, and it grows with the count.
 */
describe('barHeight', () => {
  it('returns a positive height for every real week', () => {
    for (const n of [1, 2, 3, 5, 12]) expect(barHeight(n, 12)).toBeGreaterThan(0)
  })

  it('grows with the count', () => {
    expect(barHeight(5, 10)).toBeGreaterThan(barHeight(2, 10))
    expect(barHeight(10, 10)).toBeGreaterThan(barHeight(5, 10))
  })

  it('makes a one-urge week taller than an empty one — the distinction the chart is for', () => {
    expect(barHeight(1, 8)).toBeGreaterThanOrEqual(barHeight(0, 8))
    expect(barHeight(0, 8)).toBe(6)
  })

  it('never exceeds the band, so the reset dot above it stays on screen', () => {
    expect(barHeight(99, 99)).toBeLessThanOrEqual(84)
  })

  it('survives an empty series without dividing by zero', () => {
    expect(Number.isFinite(barHeight(0, 0))).toBe(true)
    expect(Number.isFinite(barHeight(3, 0))).toBe(true)
  })
})
