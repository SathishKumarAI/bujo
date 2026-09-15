import { describe, expect, it } from 'vitest'
import { landingForCapture, landingForRecord, landingForRecords } from './captureLanding'
import { RECORD_KINDS, type ImportRecord } from './ingest/envelope'

/**
 * The table is the whole point of the module, so the test is a table too.
 *
 * The one assertion worth stating out loud: **every record kind must land
 * somewhere real**. A kind with no branch used to be impossible to notice — it
 * would fall through to Today and look like a plain note, which is exactly what
 * a mis-routed capture looks like anyway.
 */
const D = '2026-09-15'

describe('landingForRecord', () => {
  it('sends wellbeing metrics to Tracking and nutrition metrics to Nutrition', () => {
    expect(landingForRecord({ kind: 'metric', date: D, mood: 7 }).view).toBe('trackers')
    expect(landingForRecord({ kind: 'metric', date: D, calories: 2100 }).view).toBe('nutrition')
  })

  it('splits workouts by activity, not by the word "workout"', () => {
    expect(landingForRecord({ kind: 'workout', date: D, activity: 'strength' }).view).toBe('gym')
    expect(landingForRecord({ kind: 'workout', date: D, activity: 'run' }).view).toBe('fitness')
    expect(landingForRecord({ kind: 'workout', date: D, activity: 'pickleball' }).view).toBe('pickleball')
    expect(landingForRecord({ kind: 'workout', date: D, activity: 'pullups' }).view).toBe('pullups')
  })

  // Weight lives on Gym, which is the mapping nobody guesses right.
  it('sends body measurements to Strength', () => {
    expect(landingForRecord({ kind: 'body', date: D, weightKg: 74.2 }).view).toBe('gym')
  })

  it("names what was written in the user's terms, never the kind", () => {
    expect(landingForRecord({ kind: 'metric', date: D, mood: 7, sleep: 8 }).what).toBe('mood 7 · sleep 8h')
    expect(landingForRecord({ kind: 'habit', date: D, habit: 'Water', value: 6 }).what).toBe('Water 6')
    expect(landingForRecord({ kind: 'habit', date: D, habit: 'Read' }).what).toBe('Read ✓')
    expect(landingForRecord({ kind: 'entry', date: D, text: 'knee felt fine' }).what).toBe('knee felt fine')
  })

  it('has a branch for every kind in the envelope', () => {
    const sample: Record<string, ImportRecord> = {
      metric: { kind: 'metric', date: D, mood: 5 },
      workout: { kind: 'workout', date: D, activity: 'run' },
      body: { kind: 'body', date: D, weightKg: 70 },
      habit: { kind: 'habit', date: D, habit: 'Water' },
      entry: { kind: 'entry', date: D, text: 'note' },
      cycle: { kind: 'cycle', date: D, flags: ['spotting'] },
      pickleball: { kind: 'pickleball', date: D, gamesWon: 2, gamesLost: 1 },
    }
    for (const kind of RECORD_KINDS) {
      const landing = landingForRecord(sample[kind])
      expect(landing.view, `${kind} has no destination`).toBeTruthy()
      expect(landing.where, `${kind} has no page name`).toBeTruthy()
    }
  })
})

describe('landingForRecords', () => {
  it('keeps one landing per record, in the order they were said', () => {
    const landings = landingForRecords([
      { kind: 'workout', date: D, activity: 'run', distanceKm: 5 },
      { kind: 'metric', date: D, mood: 7 },
    ])
    expect(landings.map((l) => l.view)).toEqual(['fitness', 'trackers'])
  })
})

describe('landingForCapture', () => {
  it('routes the quick-add parser to the same pages', () => {
    expect(landingForCapture({ kind: 'gym', raw: '', confidence: 1, exercise: 'Bench', weight: 80, reps: 5, unit: 'kg' }).view).toBe('gym')
    expect(landingForCapture({ kind: 'cardio', raw: '', confidence: 1, activity: 'run', distanceKm: 5 }).view).toBe('fitness')
    expect(landingForCapture({ kind: 'metric', raw: '', confidence: 1, mood: 7 }).view).toBe('trackers')
    expect(landingForCapture({ kind: 'habit', raw: '', confidence: 1, habit: 'Water', value: 6 }).view).toBe('trackers')
    expect(landingForCapture({ kind: 'bullet', raw: 'called mum', confidence: 1 }).view).toBe('today')
  })
})
