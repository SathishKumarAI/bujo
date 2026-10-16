import { describe, expect, it } from 'vitest'
import { DISCREET_LABELS, discreetLabel, discreetly, isDiscreet } from './discreet'

/**
 * Discreet mode is a DISPLAY swap, and the tests exist to keep it one.
 *
 * The failure that would matter is not a wrong word on a chip — it is the mode
 * leaking into what is stored, or covering half a page and not the other half.
 */
describe('discreetLabel', () => {
  it('does nothing at all when the mode is off', () => {
    for (const k of Object.keys(DISCREET_LABELS)) expect(discreetLabel(k, false)).toBe(k)
  })

  it('swaps the explicit labels — the reason the mode exists', () => {
    expect(discreetLabel('Porn', true)).toBe('Pattern A')
    expect(discreetLabel('Masturbation', true)).toBe('Pattern B')
  })

  it('matches regardless of case or stray spacing', () => {
    expect(discreetLabel('  porn ', true)).toBe('Pattern A')
    expect(discreetLabel('NICOTINE', true)).toBe('Habit N')
  })

  it('leaves a name it does not know alone, rather than inventing one', () => {
    // Someone's own addiction called "Instagram" is their word. Stated on the
    // toggle rather than hidden: presets are covered, your own names are yours.
    expect(discreetLabel('Instagram', true)).toBe('Instagram')
    expect(discreetLabel('', true)).toBe('')
  })

  it('never returns an empty label for anything it does map', () => {
    // A blank chip is a control you cannot pick. Redaction was the obvious
    // design and it is the wrong one for a form.
    for (const k of Object.keys(DISCREET_LABELS)) {
      expect(discreetLabel(k, true).length, k).toBeGreaterThan(2)
    }
  })

  it('never maps a label back to something more explicit', () => {
    const banned = /porn|masturbat|nicotine|alcohol|gambl|smok/i
    for (const v of Object.values(DISCREET_LABELS)) expect(v, v).not.toMatch(banned)
  })
})

describe('isDiscreet', () => {
  it('is off unless explicitly on', () => {
    expect(isDiscreet(undefined)).toBe(false)
    expect(isDiscreet({})).toBe(false)
    expect(isDiscreet({ discreetRecovery: false })).toBe(false)
    expect(isDiscreet({ discreetRecovery: true })).toBe(true)
  })
})

describe('discreetly', () => {
  it('binds the setting so a card cannot swap half its labels', () => {
    const on = discreetly({ discreetRecovery: true })
    const off = discreetly({})
    expect(['Porn', 'Nicotine'].map(on)).toEqual(['Pattern A', 'Habit N'])
    expect(['Porn', 'Nicotine'].map(off)).toEqual(['Porn', 'Nicotine'])
  })
})
