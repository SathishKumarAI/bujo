import { describe, expect, it } from 'vitest'
import {
  ACTIVITIES, ACTIVITY_KINDS, MODES, activitiesForMode, activityForSplit, asks, bestStat, fullLabelOf, hasKinds, kindsFor,
  defaultActivityFor, isActivityKey, labelOf, modeOf, normalizeActivity,
  type ActivityKey,
} from './activities'

const KEYS = Object.keys(ACTIVITIES) as ActivityKey[]

describe('registry shape', () => {
  it('every activity declares at least one required field', () => {
    for (const k of KEYS) expect(ACTIVITIES[k].required.length).toBeGreaterThan(0)
  })
  it('every mode has at least one activity, so a mode switch always has a target', () => {
    for (const m of MODES) expect(activitiesForMode(m).length).toBeGreaterThan(0)
  })
  it('activitiesForMode returns only that mode', () => {
    for (const m of MODES) {
      for (const [, a] of activitiesForMode(m)) expect(a.mode).toBe(m)
    }
  })
  it('defaultActivityFor lands inside its own mode', () => {
    for (const m of MODES) expect(modeOf(defaultActivityFor(m))).toBe(m)
  })
})

describe('modeOf', () => {
  it('derives the mode declared in the registry', () => {
    expect(modeOf('run')).toBe('cardio')
    expect(modeOf('push')).toBe('strength')
    expect(modeOf('pullups')).toBe('strength')
    expect(modeOf('pickleball')).toBe('sport')
  })
  it('falls back to cardio for an unknown key rather than throwing', () => {
    // A journal we cannot classify must still render something loggable.
    expect(modeOf('nonsense')).toBe('cardio')
  })
})

describe('asks — the only sanctioned field-visibility test', () => {
  it('separates the two cardio shapes', () => {
    expect(asks('run', 'distanceKm')).toBe(true)
    expect(asks('pickleball', 'distanceKm')).toBe(false) // duration only
    expect(asks('pickleball', 'durationMin')).toBe(true)
  })
  it('never offers sets to a cardio activity — the bug this registry exists to kill', () => {
    for (const [key] of activitiesForMode('cardio')) expect(asks(key, 'sets')).toBe(false)
  })
  it('never offers distance to a strength activity', () => {
    for (const [key] of activitiesForMode('strength')) {
      expect(asks(key, 'sets')).toBe(true)
      expect(asks(key, 'distanceKm')).toBe(false)
    }
  })
  it('asks a sport for its duration and nothing else — a game has no distance', () => {
    for (const [key] of activitiesForMode('sport')) {
      expect(asks(key, 'durationMin')).toBe(true)
      expect(asks(key, 'distanceKm')).toBe(false)
      expect(asks(key, 'sets')).toBe(false)
    }
  })
})

describe('labelOf', () => {
  it('reads the registry label', () => {
    expect(labelOf('homeWorkout')).toBe('Home workout')
    expect(labelOf('legs')).toBe('Leg day')
  })
  it('falls back to the raw value so an unmigrated row stays legible', () => {
    expect(labelOf('Kitesurfing')).toBe('Kitesurfing')
  })
})

describe('normalizeActivity', () => {
  it('is idempotent — a key maps to itself', () => {
    for (const k of KEYS) expect(normalizeActivity(k)).toBe(k)
  })
  it('maps the retired Fitness select labels', () => {
    expect(normalizeActivity('Run')).toBe('run')
    expect(normalizeActivity('Cycling')).toBe('cycle')
    expect(normalizeActivity('Home')).toBe('homeWorkout')
    expect(normalizeActivity('Yoga')).toBe('yoga')
  })
  it("maps Gym's template literal and the demo seeder's lowercase twin", () => {
    expect(normalizeActivity('Push day', 'push')).toBe('push')
    expect(normalizeActivity('push day')).toBe('push')
    expect(normalizeActivity('Leg day', 'legs')).toBe('legs')
  })
  it('prefers a real split over the free-form string it was derived from', () => {
    expect(normalizeActivity('anything at all', 'pull')).toBe('pull')
  })
  it('sends the splits that are not activities to the strength catch-all', () => {
    // upper/lower/full stay in `split` for the analytics; as an activity they
    // are just "a lifting session".
    expect(normalizeActivity('Upper day', 'upper')).toBe('strength')
    expect(normalizeActivity('Full body day', 'full')).toBe('strength')
  })
  it('never guesses a training day for a split-less strength row', () => {
    expect(normalizeActivity('Strength')).toBe('strength')
    expect(normalizeActivity('Strength')).not.toBe('push')
  })
  it('lands unknown, split-less values on `other`', () => {
    expect(normalizeActivity('Kitesurfing')).toBe('other')
    expect(normalizeActivity(undefined)).toBe('other')
    expect(normalizeActivity(42)).toBe('other')
  })
  it('always returns a key the rest of the registry recognises', () => {
    for (const input of ['Run', 'Kitesurfing', '', undefined, null, 7]) {
      expect(isActivityKey(normalizeActivity(input))).toBe(true)
    }
  })
})

describe('activityForSplit', () => {
  it('names the three split days', () => {
    expect(activityForSplit('push')).toBe('push')
    expect(activityForSplit('legs')).toBe('legs')
  })
  it('falls back to the catch-all for the rest', () => {
    expect(activityForSplit('upper')).toBe('strength')
    expect(activityForSplit(undefined)).toBe('strength')
  })
})

describe('bestStat', () => {
  it('keys the summary headline off the activity', () => {
    expect(bestStat('run')).toBe('pace')
    expect(bestStat('pullups')).toBe('maxReps')
    expect(bestStat('push')).toBe('volume')
  })
})

/**
 * The sub-activity dimension. These guard the two ways it can go quiet: a kind
 * list keyed to an activity that does not exist (so the chip row never renders)
 * and a sub-activity stored but never shown (`fullLabelOf` not being called).
 */
describe('sub-activities', () => {
  it('only names kinds for activities that exist', () => {
    for (const key of Object.keys(ACTIVITY_KINDS)) {
      expect(isActivityKey(key)).toBe(true)
    }
  })

  it('never offers an empty kind list — absent and empty must not both mean no', () => {
    for (const [key, kinds] of Object.entries(ACTIVITY_KINDS)) {
      expect(kinds!.length, `${key} has an empty kind list; delete the entry instead`).toBeGreaterThan(0)
    }
  })

  it('has no duplicate kinds within one activity', () => {
    for (const [key, kinds] of Object.entries(ACTIVITY_KINDS)) {
      expect(new Set(kinds).size, `${key} repeats a kind`).toBe(kinds!.length)
    }
  })

  /**
   * The strength split and the sub-activity answer the same question, and an
   * activity carrying both would have two places to record one fact — which is
   * how `split` became an exception in the first place.
   */
  it('gives no kinds to the activities that carry a split', () => {
    for (const key of ['push', 'pull', 'legs', 'strength'] as ActivityKey[]) {
      expect(hasKinds(key), `${key} has both a split and kinds`).toBe(false)
    }
  })

  it('answers for an unknown key rather than throwing', () => {
    expect(kindsFor('nonsense')).toEqual([])
    expect(hasKinds('nonsense')).toBe(false)
  })

  it('every loggable-mode activity offers kinds, so the field is never only decorative', () => {
    // Not a style rule: the chip row IS the answer to "what kind of X did I
    // do", and an activity with no kinds silently has no answer. The report
    // that prompted this was about one activity; the gap was across all of them.
    for (const [key] of [...activitiesForMode('cardio'), ...activitiesForMode('sport')]) {
      expect(hasKinds(key), `${key} offers no kinds`).toBe(true)
    }
  })

  it('fullLabelOf joins the two, and degrades to the plain label', () => {
    expect(fullLabelOf('run', 'Intervals')).toBe('Run · Intervals')
    expect(fullLabelOf('run')).toBe('Run')
    expect(fullLabelOf('run', '')).toBe('Run')
    expect(fullLabelOf('homeWorkout', 'Upper body')).toBe('Home workout · Upper body')
    // An unknown key still renders its raw value rather than vanishing.
    expect(fullLabelOf('mystery', 'Thing')).toBe('mystery · Thing')
  })
})
