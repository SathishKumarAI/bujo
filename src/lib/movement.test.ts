import { describe, it, expect } from 'vitest'
import { movementFor, activationAt, type Movement } from './movement'
import { muscleWorkFor, M } from './exerciseMuscles'
import { MUSCLES } from './muscles'
import { EXERCISE_LIBRARY } from './fitness'

/** Every lift a person is plausibly going to type into this app. */
const COMMON = [
  'Bench Press', 'Incline Bench', 'Close Grip Bench Press', 'Floor press', 'Landmine press',
  'Overhead Press', 'Push Press', 'Lateral Raise', 'Face Pull', 'Y raise', 'Scapular retractions',
  'Pull-up', 'Chin-up', 'Lat Pulldown', 'Muscle up', 'Barbell Row', 'Pendlay row', 'Inverted row',
  'Squat', 'Front squat', 'Goblet squat', 'Bulgarian split squat', 'Leg Press', 'Lunge',
  'Deadlift', 'Romanian Deadlift', 'Hip Thrust', 'Glute ham raise', 'Back extension', 'Reverse hyper',
  'Bicep Curl', 'Hammer Curl', 'Preacher curl', 'Tricep Extension', 'Skull crusher',
  'Calf Raise', 'Plank', 'Side plank', 'Pallof press', 'Hanging knee raise', 'Toes-to-bar',
  'Kettlebell swing', 'Power clean', 'Snatch', 'Thruster', 'Box jump', 'Burpees', 'Jump rope',
  'Farmer carry', 'Sled push', 'Sprints', 'Treadmill walk', 'Assault bike', 'Elliptical',
  'Hip abduction', 'Superman', 'Bird dog',
]

describe('movement coverage', () => {
  it('has a rep shape for every common lift', () => {
    // The gap this closes: 47 of 77 common names had no pattern, so the 3D
    // view stood still for most of what people actually log.
    const missing = COMMON.filter((n) => !movementFor(n))
    expect(missing).toEqual([])
  })

  it('covers the built-in library', () => {
    const missing = EXERCISE_LIBRARY.filter((n) => muscleWorkFor(n) && !movementFor(n))
    expect(missing).toEqual([])
  })

  it('never lets a broad keyword steal a well-known lift', () => {
    // `swing` and `clean` are deliberately broad, and they sit near the top of
    // the ordered list. This is the assertion that fails if a future rule is
    // added above the one that should win.
    const expected: Record<string, string> = {
      'Bench Press': 'press-h', 'Overhead Press': 'press-v', 'Pull-up': 'pull-v',
      'Barbell Row': 'pull-h', 'Squat': 'squat', 'Deadlift': 'hinge',
      'Bicep Curl': 'curl', 'Tricep Extension': 'extension', 'Lateral Raise': 'raise',
      'Calf Raise': 'calf', 'Plank': 'brace', 'Kettlebell swing': 'ballistic-hinge',
      'Sprints': 'gait', 'Farmer carry': 'carry', 'Treadmill walk': 'steady',
      'Side plank': 'anti-rotation', 'Toes-to-bar': 'hang-flex',
    }
    for (const [name, id] of Object.entries(expected)) {
      expect(movementFor(name)?.id, name).toBe(id)
    }
  })

  it('is null for something that is not an exercise', () => {
    expect(movementFor('interpretive dance')).toBeNull()
    expect(movementFor('')).toBeNull()
  })
})

describe('the rep itself', () => {
  const all = [...new Set(COMMON.map((n) => movementFor(n)).filter(Boolean))] as Movement[]

  it('produces finite joint angles across the whole cycle', () => {
    // A NaN here silently freezes the rig at its last good pose, which looks
    // like the animation simply not working.
    for (const mv of all) {
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const p = mv.pose(t)
        for (const [k, v] of Object.entries(p)) {
          expect(Number.isFinite(v), `${mv.id} ${k} at t=${t.toFixed(2)}`).toBe(true)
        }
      }
    }
  })

  it('loops — the end of a rep matches its start', () => {
    // The animation runs `t % 1` forever. A pattern whose t=1 differs from
    // t=0 snaps once per rep, which reads as a dropped frame.
    for (const mv of all) {
      const a = mv.pose(0)
      const b = mv.pose(1)
      for (const k of Object.keys(a) as (keyof typeof a)[]) {
        expect(Math.abs(a[k] - b[k]), `${mv.id} ${k} does not loop`).toBeLessThan(0.02)
      }
    }
  })

  it('keeps effort inside 0–1 for every muscle at every phase', () => {
    for (const name of COMMON) {
      for (let t = 0; t <= 1.0001; t += 0.1) {
        for (const [id, v] of Object.entries(activationAt(name, t))) {
          expect(v, `${name} muscle ${id} at ${t.toFixed(1)}`).toBeGreaterThanOrEqual(0)
          expect(v, `${name} muscle ${id} at ${t.toFixed(1)}`).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('only ever names muscles the rig can actually draw', () => {
    // An id the body has no mesh for lights nothing, silently.
    const known = new Set(MUSCLES.map((m) => m.id))
    for (const name of COMMON) {
      for (const id of Object.keys(activationAt(name, 0.5))) {
        expect(known.has(Number(id)), `${name} → unknown muscle ${id}`).toBe(true)
      }
    }
  })

  it('works the prime mover hardest at some point in the rep', () => {
    // The whole promise of the time axis: if a primary muscle never out-peaks
    // its assistants, the animation is telling the wrong story.
    for (const name of COMMON) {
      const work = muscleWorkFor(name)
      if (!work || work.secondary.length === 0) continue
      const peak = (id: number) => Math.max(...Array.from({ length: 21 }, (_, i) => activationAt(name, i / 20)[id] ?? 0))
      const bestPrimary = Math.max(...work.primary.map(peak))
      const bestSecondary = Math.max(...work.secondary.map(peak))
      expect(bestPrimary, `${name}: assistants out-work the prime mover`).toBeGreaterThanOrEqual(bestSecondary)
    }
  })

  it('puts the triceps at their hardest at lockout on a bench press', () => {
    // The specific claim the feature makes in its own caption, asserted.
    const early = activationAt('Bench Press', 0.05)[M.triceps] ?? 0
    const lock = activationAt('Bench Press', 0.75)[M.triceps] ?? 0
    expect(lock).toBeGreaterThan(early)
  })
})
