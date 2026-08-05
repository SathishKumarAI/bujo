import { describe, expect, it } from 'vitest'
import { quartileLevels } from './viz'

describe('quartileLevels', () => {
  it('leaves zero at level 0 — a rest day is not a quiet training day', () => {
    const level = quartileLevels([10, 20, 30, 40])
    expect(level(0)).toBe(0)
  })

  it('spreads an even distribution across all four steps', () => {
    const level = quartileLevels([10, 20, 30, 40])
    expect([level(10), level(20), level(30), level(40)]).toEqual([1, 2, 3, 4])
  })

  it('survives one outlier — the reason it is not linear', () => {
    // Twelve ordinary sessions and one very long one. Under linear scaling
    // against the max, every ordinary day is <25% of 180 and collapses to the
    // lightest step, so the grid reports "one good day and nothing else".
    const ordinary = [25, 28, 30, 31, 33, 35, 36, 38, 40, 42, 44, 45]
    const level = quartileLevels([...ordinary, 180])
    const levels = ordinary.map(level)
    expect(levels).toContain(1)
    expect(levels).toContain(4)
    expect(new Set(levels).size).toBeGreaterThan(2)
    expect(level(180)).toBe(4)
  })

  it('excludes zeroes from the distribution, so rest days cannot drag the cuts down', () => {
    const withRest = quartileLevels([0, 0, 0, 0, 0, 0, 10, 20, 30, 40])
    const without = quartileLevels([10, 20, 30, 40])
    for (const v of [10, 20, 30, 40]) expect(withRest(v)).toBe(without(v))
  })

  it('returns level 0 for everything when there is no data at all', () => {
    const level = quartileLevels([])
    expect(level(0)).toBe(0)
    expect(level(99)).toBe(0)
  })

  it('does not invent spread from too few values', () => {
    // Three sessions cannot express four tiers; collapsing the cuts is honest.
    const level = quartileLevels([10, 10, 10])
    expect(level(10)).toBe(1)
  })

  it('never returns a level outside the ramp', () => {
    const level = quartileLevels([1, 5, 9, 100])
    for (const v of [-5, 0, 1, 50, 100, 1e6]) {
      expect(level(v)).toBeGreaterThanOrEqual(0)
      expect(level(v)).toBeLessThanOrEqual(4)
    }
  })
})
