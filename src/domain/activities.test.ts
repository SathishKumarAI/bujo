import { describe, expect, it } from 'vitest'
import {
  ACTIVITIES, MODES, activitiesForMode, activityForSplit, asks, bestStat,
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
