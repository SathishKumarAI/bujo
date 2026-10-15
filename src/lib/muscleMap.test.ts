import { describe, expect, it } from 'vitest'
import { musclesForExercise as fromFitness, weeklySetsPerMuscle } from './fitness'
import { musclesForExercise as fromLeaf } from './muscleMap'
import { allMusclesForExercise } from './exerciseMuscles'
import { HOME_EXERCISES } from './homeExercises'
import { emptyJournal } from './storage'
import type { JournalData } from './types'

const TODAY = '2026-10-15'

/** One home session holding `n` working sets of `name`. */
function journalWith(name: string, n = 3): JournalData {
  const j = emptyJournal()
  j.workouts = [{
    id: 'w1', date: TODAY, activity: 'homeWorkout', notes: '',
    sets: [`${name} ${n}×12`],
    setRows: Array.from({ length: n }, () => ({ exercise: name, reps: 12, weight: 0, kind: 'working' as const })),
  }]
  return j
}

describe('the matcher moved without changing', () => {
  it('is the same function through both paths', () => {
    // `fitness` re-exports the leaf, so the five modules importing it from
    // there keep working and cannot drift from the one importing the leaf.
    expect(fromFitness).toBe(fromLeaf)
  })

  it('still answers the names it always answered', () => {
    // Numeric sort — `[10, 8].sort()` is `[10, 8]`, which is how this
    // assertion first failed against code that was right.
    const ids = (n: string) => [...fromLeaf(n)].sort((a, b) => a - b)
    expect(ids('Romanian Deadlift')).toEqual([8, 9, 10, 11, 12])
    expect(ids('Bench Press')).toEqual([2, 4, 5])
    expect(fromLeaf('Machine chest press')).not.toContain(12) // the `chin` in `machine` trap
  })
})

describe('a logged name the keyword table cannot read falls back to the roles table', () => {
  it('counted nothing for 32 of the 83 home movements', () => {
    // The premise, asserted rather than described — if the keyword table grows
    // this number moves and the ticket's measurement is stale.
    const blind = HOME_EXERCISES.filter((e) => fromLeaf(e.name).length === 0)
    expect(blind.length).toBe(32)
    expect(blind.every((e) => allMusclesForExercise(e.name).length > 0)).toBe(true)
  })

  it('now counts one of them', () => {
    const counts = weeklySetsPerMuscle(journalWith('Dead bug'), TODAY)
    expect(fromLeaf('Dead bug')).toEqual([]) // the keyword table is blind to it
    expect(counts.length).toBeGreaterThan(0)
    expect(counts.every((c) => c.sets === 3)).toBe(true)
  })

  it('does NOT override a name the keyword table can read', () => {
    // The two disagree here — keyword says traps and quads, the roles table
    // does not — and the keyword answer has to win, or every muscle chart in
    // the app silently re-bases. Measured across EXERCISE_LIBRARY: 35 of 42
    // names differ, in both directions. COD-316.
    const keyword = fromLeaf('Romanian Deadlift')
    const table = allMusclesForExercise('Romanian Deadlift')
    expect(new Set(keyword)).not.toEqual(new Set(table))

    const counts = weeklySetsPerMuscle(journalWith('Romanian Deadlift'), TODAY)
    expect(counts.map((c) => c.muscle).sort((a, b) => a - b)).toEqual([...keyword].sort((a, b) => a - b))
  })
})
