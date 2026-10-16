import { describe, expect, it } from 'vitest'
import { FOODS, shortFood } from './foods'

/**
 * The bar list draws a shortened food name, and the shortening has one way to
 * go wrong that matters: dropping something that is not an alias.
 *
 * `Ground beef 85/15` is a RATIO. The first draft split on any slash and drew
 * it as "Ground beef 85", which is not a shorter name for the same food — it
 * is a different claim about it. These are the real library's awkward cases.
 */
describe('shortFood', () => {
  it('drops a parenthetical alias', () => {
    expect(shortFood('Rajma (kidney bean curry)')).toBe('Rajma')
    expect(shortFood('Tuna (canned, water)')).toBe('Tuna')
  })

  it('drops a spaced-slash alias', () => {
    expect(shortFood('Curd / dahi')).toBe('Curd')
    expect(shortFood('Roti / chapati')).toBe('Roti')
  })

  it('keeps a slash that is part of the number', () => {
    expect(shortFood('Ground beef 85/15')).toBe('Ground beef 85/15')
  })

  it('keeps a name that has nothing to drop', () => {
    expect(shortFood('Grilled chicken breast')).toBe('Grilled chicken breast')
    expect(shortFood('2% milk')).toBe('2% milk')
  })

  it('never returns an empty label for anything in the library', () => {
    // The `|| name` fallback, asserted rather than assumed: a name that is
    // entirely a parenthetical would otherwise draw a blank row.
    for (const f of FOODS) expect(shortFood(f.name).length, f.name).toBeGreaterThan(0)
  })
})
