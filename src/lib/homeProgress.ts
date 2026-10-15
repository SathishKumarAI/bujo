// Home-training progress — has a movement been outgrown?
//
// WHAT THIS FILE OWNS: reading logged home sessions back, and deciding when a
// movement has been beaten often enough that the next one in its chain is the
// honest ask.
//
// WHAT IT DOES NOT OWN:
// - **The movements**, their rep targets and their easier/harder chain:
//   `lib/homeExercises.ts`. This file reads `harder` and `reps` and never
//   restates either, which is the lesson of 531596f.
// - **Muscle, volume and frequency arithmetic**: `lib/fitness.ts` does that for
//   every activity, and a home session feeds it now that `logSession` writes
//   `setRows` (COD-315). Nothing here duplicates that.
//
// Why it reads `setRows` and not the `sets` strings: a string is `'Push-ups
// 3×12'`, the *target* the session was built from, and it says nothing about
// what happened — the reps field is editable, so what was actually done lives in
// the structured rows. A session logged before COD-315 has no rows, and this
// file makes no claim about it rather than guessing from the prescription. That
// is deliberate: "you have beaten this five times" has to be five measurements.

import type { JournalData } from './types'
import { dayDiff, todayISO } from './date'
import { HOME_EXERCISES, exerciseById, parseRepSpec, type HomeExercise } from './homeExercises'

/** A movement met often enough that the next one in its chain is suggested. */
export interface Progression {
  from: HomeExercise
  to: HomeExercise
  /** Sessions in the window that met or beat the whole target. */
  met: number
  /** Sessions in the window that held this movement at all — the denominator. */
  logged: number
  /** Best single set in the window. The number that earns the suggestion. */
  bestReps: number
  /** The target that was beaten, as the library states it (`'3×12'`). */
  target: string
}

/** Name → movement. Names are the join key, because that is what a row stores. */
const BY_NAME = new Map(HOME_EXERCISES.map((e) => [e.name.toLowerCase(), e]))

/**
 * Movements ready to progress, best-evidenced first.
 *
 * A session counts as *met* when it held at least the target number of sets and
 * **every** one of them reached the target reps — 12, 12, 10 against a `3×12`
 * is not a completed prescription, and crediting it is how a suggestion arrives
 * before the strength does.
 *
 * `floor` is the number of met sessions required, and it is a real floor rather
 * than the two that `momentumIndicator` once used: three sessions is the point
 * at which "I had a good day" stops being the explanation. The caller is given
 * `met` and `logged` so it can state the coverage **as text** — an arrow with
 * the sample size hidden in a `title` is the lapse-detector trap in CLAUDE.md,
 * and on a phone that tooltip does not exist at all.
 *
 * A time hold (`'3×30s'`) is skipped: `parseRepSpec` gives it no reps, there is
 * nowhere in `WorkoutSet` to put a duration, and comparing a 30-second plank by
 * its rep count would compare nothing with nothing. Pure.
 */
export function readyToProgress(
  data: JournalData,
  today = todayISO(),
  days = 28,
  floor = 3,
): Progression[] {
  /** exercise name → one entry per session that held it */
  const perSession = new Map<string, { sets: number; minReps: number; maxReps: number }[]>()

  for (const w of data.workouts) {
    if (w.activity !== 'homeWorkout') continue
    const diff = dayDiff(w.date, today)
    if (!(diff >= 0 && diff < days)) continue

    const inSession = new Map<string, number[]>()
    for (const r of w.setRows ?? []) {
      if (r.kind === 'warmup' || r.reps == null) continue
      const key = r.exercise.trim().toLowerCase()
      if (!BY_NAME.has(key)) continue
      const reps = inSession.get(key) ?? []
      reps.push(r.reps)
      inSession.set(key, reps)
    }
    for (const [key, reps] of inSession) {
      const rows = perSession.get(key) ?? []
      rows.push({ sets: reps.length, minReps: Math.min(...reps), maxReps: Math.max(...reps) })
      perSession.set(key, rows)
    }
  }

  const out: Progression[] = []
  for (const [key, sessions] of perSession) {
    const from = BY_NAME.get(key)!
    const to = from.harder ? exerciseById(from.harder) : undefined
    if (!to) continue
    const target = parseRepSpec(from.reps)
    if (target.reps == null) continue

    const met = sessions.filter((s) => s.sets >= target.sets && s.minReps >= target.reps!).length
    if (met < floor) continue
    out.push({
      from, to, met, logged: sessions.length, target: from.reps,
      bestReps: Math.max(...sessions.map((s) => s.maxReps)),
    })
  }

  return out.sort((a, b) => (b.met - a.met) || (b.bestReps - a.bestReps) || a.from.name.localeCompare(b.from.name))
}
