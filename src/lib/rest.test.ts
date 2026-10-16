import { describe, expect, it } from 'vitest'
import { DEFAULT_REST, WARMUP_REST, restFor, restFromReps, restLabel, sessionMinutes } from './rest'

/**
 * The assertions worth having are the ones about PRECEDENCE — a remembered
 * per-exercise rest has to beat the rep rule, or "some exercise needs 3
 * minutes" is not a thing the app can honour — and the one about the last set,
 * because an estimate that counts a rest you will not take is an estimate that
 * says you cannot fit a session you can.
 */
describe('restFor', () => {
  it('prefers the exercise you set over the rep rule', () => {
    const s = { restByExercise: { deadlift: 180 } }
    expect(restFor({ exercise: 'Deadlift', reps: 12 }, s)).toBe(180)
    // Keyed case-insensitively: the logger writes whatever the picker gave it.
    expect(restFor({ exercise: 'deadlift', reps: 12 }, s)).toBe(180)
    expect(restFor({ exercise: 'Barbell Row', reps: 12 }, s)).toBe(30)
  })

  it('falls back to the rule the hypertrophy block already states', () => {
    expect(restFromReps(12)).toBe(30)
    expect(restFromReps(8)).toBe(120)
    expect(restFromReps(5)).toBe(180)
    expect(restFromReps(0)).toBe(DEFAULT_REST)
  })

  it('short-circuits a warm-up', () => {
    expect(restFor({ exercise: 'Squat', reps: 5, kind: 'warmup' }, { restByExercise: { squat: 300 } })).toBe(WARMUP_REST)
  })
})

describe('sessionMinutes', () => {
  const row = (exercise: string, reps: number) => ({ exercise, reps })

  it('counts work and rest, and not the rest after the last set', () => {
    // 3 sets x 5 reps: work 3x15s = 45s; rest after the first two only,
    // 180s each = 360s. 405s → 7 minutes.
    const e = sessionMinutes([row('Squat', 5), row('Squat', 5), row('Squat', 5)])
    expect(e.sets).toBe(3)
    expect(e.minutes).toBe(7)
    expect(e.restMin).toBe(6)
  })

  it('ignores rows with no reps yet, so the estimate does not jump as you type', () => {
    expect(sessionMinutes([row('Squat', 5), { exercise: 'Bench Press', reps: '' }]).sets).toBe(1)
    expect(sessionMinutes([{ exercise: '', reps: 5 }]).minutes).toBe(0)
  })

  it('answers the question it exists for: does this fit in an hour', () => {
    // Twelve working sets of five at three minutes' rest cannot: 11x180s is
    // 33 minutes of rest alone, plus the work.
    const twelve = Array.from({ length: 12 }, () => row('Deadlift', 5))
    expect(sessionMinutes(twelve).minutes).toBeGreaterThan(30)
    // The same twelve sets at twelve reps — and therefore 30s rest — do.
    const light = Array.from({ length: 12 }, () => row('Leg extension', 12))
    expect(sessionMinutes(light).minutes).toBeLessThan(60)
  })
})

describe('restLabel', () => {
  it('says it the way a lifter does', () => {
    expect(restLabel(45)).toBe('45s')
    expect(restLabel(90)).toBe('90s')
    expect(restLabel(120)).toBe('2m')
    expect(restLabel(150)).toBe('2m 30s')
  })
})
