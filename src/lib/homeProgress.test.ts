import { describe, expect, it } from 'vitest'
import { readyToProgress } from './homeProgress'
import { exerciseById, homeSetRows } from './homeExercises'
import { emptyJournal } from './storage'
import type { JournalData, Workout } from './types'

const TODAY = '2026-10-15'

/** `pushup` is `3×12` and has a `harder`; both are asserted below, not assumed. */
const PUSHUP = exerciseById('pushup')!
const PLANK = exerciseById('plank')!

/** One home session on `date`, with `reps` on each of `sets` rows. */
function session(date: string, name: string, sets: number, reps: number[], p: Partial<Workout> = {}): Workout {
  return {
    id: `w-${date}-${name}`, date, activity: 'homeWorkout', notes: '',
    sets: [`${name} ${sets}×${reps[0]}`],
    setRows: reps.map((r) => ({ exercise: name, reps: r, weight: 0, kind: 'working' as const })),
    ...p,
  }
}

function journalOf(workouts: Workout[]): JournalData {
  const j = emptyJournal()
  j.workouts = workouts
  return j
}

describe('the fixture is what the library actually says', () => {
  it('pushup is a 3×12 with a harder movement, and plank is a time hold', () => {
    // If the library is re-targeted these tests must move with it rather than
    // quietly testing a different prescription.
    expect(PUSHUP.reps).toBe('3×12')
    expect(PUSHUP.harder).toBeTruthy()
    expect(PLANK.reps).toMatch(/s$/)
  })
})

describe('readyToProgress', () => {
  const met = (date: string) => session(date, PUSHUP.name, 3, [12, 12, 12])

  it('suggests the next movement once the target is met three times', () => {
    const rows = readyToProgress(journalOf([met('2026-10-14'), met('2026-10-11'), met('2026-10-08')]), TODAY)
    expect(rows).toHaveLength(1)
    expect(rows[0].from.id).toBe('pushup')
    expect(rows[0].to.id).toBe(PUSHUP.harder)
    expect(rows[0].met).toBe(3)
    expect(rows[0].logged).toBe(3)
    expect(rows[0].bestReps).toBe(12)
    expect(rows[0].target).toBe('3×12')
  })

  it('does not suggest on two, because a floor of two is not a floor', () => {
    // `momentumIndicator` guarded on `length < 2` and reported three green
    // improvements off a two-day sample. Three sessions is where "I had a good
    // day" stops being the explanation.
    expect(readyToProgress(journalOf([met('2026-10-14'), met('2026-10-11')]), TODAY)).toEqual([])
  })

  it('does not credit a session where one set fell short', () => {
    const short = session('2026-10-08', PUSHUP.name, 3, [12, 12, 10])
    const rows = readyToProgress(journalOf([met('2026-10-14'), met('2026-10-11'), short]), TODAY)
    // 12 · 12 · 10 against a 3×12 is not a completed prescription. Two met of
    // three logged, which is under the floor — and the denominator is kept so
    // the card can say so instead of showing an arrow.
    expect(rows).toEqual([])
  })

  it('does not credit a session short of the set count', () => {
    const onlyTwo = session('2026-10-08', PUSHUP.name, 2, [12, 12])
    expect(readyToProgress(journalOf([met('2026-10-14'), met('2026-10-11'), onlyTwo]), TODAY)).toEqual([])
  })

  it('reports met against logged rather than met alone', () => {
    const rows = readyToProgress(journalOf([
      met('2026-10-14'), met('2026-10-11'), met('2026-10-08'),
      session('2026-10-05', PUSHUP.name, 3, [8, 8, 8]),
    ]), TODAY)
    expect(rows[0].met).toBe(3)
    expect(rows[0].logged).toBe(4)
  })

  it('says nothing about a time hold', () => {
    // `parseRepSpec` gives `'3×30s'` no reps, there is nowhere in `WorkoutSet`
    // to put a duration, and comparing a plank by its rep count compares
    // nothing with nothing.
    const holds = [1, 2, 3].map((i) => session(`2026-10-0${i}`, PLANK.name, 3, [30, 30, 30]))
    expect(readyToProgress(journalOf(holds), TODAY).some((r) => r.from.id === 'plank')).toBe(false)
  })

  it('ignores sessions outside the window and other activities', () => {
    const old = [met('2026-08-01'), met('2026-08-04'), met('2026-08-07')]
    expect(readyToProgress(journalOf(old), TODAY)).toEqual([])

    const gym = old.map((w) => ({ ...w, date: '2026-10-10', activity: 'strength' as const }))
    expect(readyToProgress(journalOf(gym), TODAY)).toEqual([])
  })

  it('makes no claim about a session logged before setRows existed', () => {
    // The pre-COD-315 shape: the prescription as a string, and no measurement.
    // Reading the target back as if it were the result would turn "I logged
    // this" into "I completed this" for every session ever stored.
    const legacy = [met('2026-10-14'), met('2026-10-11'), met('2026-10-08')]
      .map((w) => ({ ...w, setRows: undefined }))
    expect(readyToProgress(journalOf(legacy), TODAY)).toEqual([])
  })

  it('skips a movement at the end of its chain', () => {
    const terminal = exerciseById('burpee')!
    expect(terminal.harder).toBeUndefined() // the premise, asserted
    const ends = [1, 2, 3].map((i) => session(`2026-10-0${i}`, terminal.name, 3, [12, 12, 12]))
    expect(readyToProgress(journalOf(ends), TODAY)).toEqual([])
  })

  it('reads the rows the logger actually writes', () => {
    // Through `homeSetRows`, not hand-typed rows: a test that builds its own
    // shape stops testing the writer the moment the writer changes.
    const built = homeSetRows([{ name: PUSHUP.name, reps: '3×12' }])
    const rows = readyToProgress(journalOf([1, 2, 3].map((i) => ({
      id: `b${i}`, date: `2026-10-0${i}`, activity: 'homeWorkout' as const, notes: '',
      sets: [`${PUSHUP.name} 3×12`], setRows: built,
    }))), TODAY)
    expect(rows).toHaveLength(1)
    expect(rows[0].met).toBe(3)
  })
})
