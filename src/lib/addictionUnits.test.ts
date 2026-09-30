/**
 * UNITS · "three lapses" is the wrong measurement for half the list.
 *
 * The failure this prevents is a category error rendered as a fact: "0 hours"
 * beside cigarettes, or three sessions of scrolling reported as if the app knew
 * whether that was twenty minutes or four hours.
 */
import { describe, expect, it } from 'vitest'
import { defaultUnitFor, formatAmount, formatDuration, quickLabel, totalMinutes, UNITS, unitOf } from './addictionUnits'

describe('an unknown or absent unit is `times`, which is what count always meant', () => {
  it('falls back for absent', () => {
    expect(unitOf(undefined).id).toBe('times')
  })

  it('falls back for a unit this version does not know', () => {
    // A journal from a later version must not crash an older client.
    expect(unitOf('furlongs').id).toBe('times')
  })

  it('leaves an unmapped name on times rather than guessing', () => {
    expect(defaultUnitFor('Something personal')).toBe('times')
  })
})

describe('presets carry the unit that actually measures them', () => {
  it('counts cigarettes, not sessions', () => {
    expect(defaultUnitFor('Nicotine')).toBe('cigarettes')
  })

  it('measures scrolling in time, because a session length is unknowable', () => {
    expect(defaultUnitFor('Doomscrolling')).toBe('minutes')
    expect(defaultUnitFor('Social media')).toBe('minutes')
    expect(defaultUnitFor('Short-form video')).toBe('minutes')
  })

  it('counts drinks and portions', () => {
    expect(defaultUnitFor('Alcohol')).toBe('drinks')
    expect(defaultUnitFor('Junk food')).toBe('portions')
  })

  it('keeps times for the ones where times is the honest unit', () => {
    expect(defaultUnitFor('Masturbation')).toBe('times')
    expect(defaultUnitFor('Porn')).toBe('times')
  })
})

describe('amounts read as English', () => {
  it('singularises', () => {
    expect(formatAmount(1, 'cigarettes')).toBe('1 cigarette')
    expect(formatAmount(1, 'hours')).toBe('1 hour')
  })

  it('pluralises', () => {
    expect(formatAmount(14, 'cigarettes')).toBe('14 cigarettes')
    expect(formatAmount(0, 'times')).toBe('0 times')
  })

  it('does not print a long decimal', () => {
    expect(formatAmount(2.55, 'hours')).toBe('2.6 hours')
  })
})

describe('time lost is null for things that are not time', () => {
  /**
   * The distinction that matters: "no time lost" and "this is not measured in
   * time" are different facts, and printing 0 for the second states a category
   * error as a measurement.
   */
  it('returns null for a count unit', () => {
    expect(totalMinutes(14, 'cigarettes')).toBeNull()
    expect(totalMinutes(0, 'times')).toBeNull()
  })

  it('totals minutes for a duration unit', () => {
    expect(totalMinutes(90, 'minutes')).toBe(90)
    expect(totalMinutes(2, 'hours')).toBe(120)
  })
})

describe('durations read the way people say them', () => {
  it('stays in minutes under an hour', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('drops the minutes when there are none', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('says both when there are both', () => {
    expect(formatDuration(165)).toBe('2h 45m')
  })
})

describe('the unit table itself', () => {
  it('has no duplicate ids', () => {
    const ids = UNITS.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every duration unit a minutes conversion, or a total is impossible', () => {
    for (const u of UNITS.filter((x) => x.kind === 'duration')) {
      expect(u.minutes, u.id).toBeGreaterThan(0)
    }
  })

  it('steps minutes by more than one, because nobody taps + sixty times', () => {
    expect(unitOf('minutes').step).toBeGreaterThan(1)
  })
})

describe('quick amounts are the answers people actually give', () => {
  it('offers several per unit, so one tap logs a real amount', () => {
    for (const u of UNITS) {
      expect(u.quick.length, u.id).toBeGreaterThan(2)
      expect(u.quick.every((q) => q > 0), u.id).toBe(true)
    }
  })

  it('reaches a realistic evening without repeated tapping', () => {
    // The friction this removes: three hours of scrolling was twelve taps.
    expect(unitOf('minutes').quick).toContain(180)
    expect(unitOf('cigarettes').quick).toContain(20)
  })

  it('keeps them ascending, so the row reads left to right', () => {
    for (const u of UNITS) {
      expect([...u.quick].sort((a, b) => a - b), u.id).toEqual(u.quick)
    }
  })

  it('labels durations in the unit you would say out loud', () => {
    expect(quickLabel(15, 'minutes')).toBe('15m')
    expect(quickLabel(60, 'minutes')).toBe('1h')
    expect(quickLabel(180, 'minutes')).toBe('3h')
    expect(quickLabel(2, 'hours')).toBe('2h')
  })

  it('leaves counts bare, since the unit is stated once above the row', () => {
    expect(quickLabel(10, 'cigarettes')).toBe('10')
    expect(quickLabel(3, 'times')).toBe('3')
  })
})
