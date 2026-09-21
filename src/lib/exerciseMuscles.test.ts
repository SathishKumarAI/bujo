import { describe, it, expect } from 'vitest'
import { M, muscleRolesFor, allMusclesForExercise } from './exerciseMuscles'
import { MUSCLES } from './muscles'
import { EXERCISE_LIBRARY } from './fitness'

describe('musclesForExercise', () => {
  it('answers the question this was built for', () => {
    // "I picked Tricep Extension, show me the triceps."
    expect(muscleRolesFor('Tricep Extension')?.primary).toEqual([M.triceps])
  })

  it('matches variations, not exact names', () => {
    // People type what they did, not the library entry.
    for (const n of ['incline dumbbell press', 'DB Incline Press', 'incline bench']) {
      expect(muscleRolesFor(n)?.primary, n).toContain(M.chest)
    }
  })

  it('puts the specific rule before the general one', () => {
    // The ordering bug this guards: `close grip bench` contains `bench`, and a
    // generic bench rule first would call a triceps lift a chest lift.
    expect(muscleRolesFor('Close Grip Bench Press')?.primary).toEqual([M.triceps])
    expect(muscleRolesFor('Bench Press')?.primary).toEqual([M.chest])
    // Same shape: a hammer curl is brachialis-led, a curl is biceps-led.
    expect(muscleRolesFor('Hammer Curl')?.primary[0]).toBe(M.brachialis)
    expect(muscleRolesFor('Bicep Curl')?.primary).toEqual([M.biceps])
    // And an RDL is not a conventional deadlift.
    expect(muscleRolesFor('Romanian Deadlift')?.primary).toEqual([M.hamstrings, M.glutes])
    expect(muscleRolesFor('Deadlift')?.primary).toContain(M.traps)
  })

  it('is null for an unknown name, not empty', () => {
    // "We don't know this lift" and "this lift works nothing" are different
    // answers, and the view renders them differently.
    expect(muscleRolesFor('interpretive dance')).toBeNull()
    expect(muscleRolesFor('')).toBeNull()
    expect(allMusclesForExercise('interpretive dance')).toEqual([])
  })

  it('never names a muscle the anatomy art cannot draw', () => {
    // Every id has to exist in MUSCLES, or the 2D overlay 404s and the 3D
    // view highlights nothing — silently, in both cases.
    const known = new Set(MUSCLES.map((m) => m.id))
    for (const name of ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Plank', 'Run', 'Swim', 'Burpee']) {
      for (const id of allMusclesForExercise(name)) {
        expect(known.has(id), `${name} → unknown muscle id ${id}`).toBe(true)
      }
    }
  })

  it('never lists a muscle as both primary and secondary', () => {
    for (const name of ['Bench Press', 'Deadlift', 'Squat', 'Pull-up', 'Dip', 'Plank']) {
      const w = muscleRolesFor(name)!
      const overlap = w.primary.filter((p) => w.secondary.includes(p))
      expect(overlap, `${name} lists ${overlap} twice`).toEqual([])
    }
  })

  it('covers most of the built-in exercise library', () => {
    // Not 100% — the library carries pull-up *program* steps like "Pull-up
    // assessment" that are drills, not lifts. But a mapping that misses half
    // the library would leave the 3D view blank for most picks, which is the
    // failure mode worth a number rather than a vibe.
    const hits = EXERCISE_LIBRARY.filter((n) => muscleRolesFor(n) !== null)
    expect(hits.length / EXERCISE_LIBRARY.length).toBeGreaterThan(0.75)
  })
})
