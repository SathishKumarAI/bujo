/**
 * REST BETWEEN SETS · how long, per exercise, and what a session therefore costs.
 *
 * WHAT THIS FILE OWNS: the rest a set should get, and the arithmetic that turns
 * a list of sets into minutes.
 * WHAT IT DOES NOT OWN: the countdown (`components/program/RestTimer.tsx`), the
 * logger, or where the preference is stored.
 *
 * Asked for as: *"track the rest time in between exercises that I keep… some
 * exercise needs 3 minutes, some needs 2, and the user can set them based upon
 * them, from set to set they can change this. So let's say for 1 hour, I want
 * to do this exercise and I calculated them — I wanted to calculate the
 * exercise and the timings as well as the rest time."*
 *
 * Three things in that, and they are separable:
 *
 * 1. **A rest per exercise**, remembered. `settings.restByExercise` is keyed by
 *    the exercise name, so Deadlift can be three minutes while a curl is sixty
 *    seconds, and the next Deadlift set inherits it.
 * 2. **Changeable set to set.** The timer's `+30s` writes back to that
 *    exercise's preference, so the change happens where you feel it — during
 *    the rest — rather than in a settings field you would have to go and find.
 *    Nothing in the row needs a second control for it.
 * 3. **"Will this fit in an hour?"** `sessionMinutes` answers it from the sets
 *    that are in the logger, so the estimate moves as you build the session.
 *
 * **The default comes from the reps, not from a constant.** The app already
 * states this rule in `lib/programs.ts` (`restSeconds`): twelve or more reps
 * rest thirty seconds, eight to eleven rest two minutes, under eight rest
 * three. That is the hypertrophy block's own prescription, and a second
 * opinion about the same question — one number in the Program tab and another
 * in the logger — is the shape this repo keeps paying for. The thresholds live
 * in one place and are cited from the other.
 */
import type { Settings } from './types'

/** Seconds of work a rep takes under load — the other half of a session's cost. */
export const SECONDS_PER_REP = 3

/** A warm-up is not a working set and does not need a working set's rest. */
export const WARMUP_REST = 45

/** The fallback when there are no reps to reason from yet. */
export const DEFAULT_REST = 90

/**
 * The rest a rep count implies, by the same thresholds `lib/programs.ts`
 * applies to the hypertrophy block: `>= 12 → 30s`, `>= 8 → 120s`, else `180s`.
 */
export function restFromReps(reps: number): number {
  if (!(reps > 0)) return DEFAULT_REST
  return reps >= 12 ? 30 : reps >= 8 ? 120 : 180
}

/**
 * How long this set should rest: the exercise's remembered preference, then
 * the rep-count rule, then the default — and a warm-up short-circuits all of
 * it.
 */
export function restFor(
  row: { exercise: string; reps?: string | number; kind?: 'warmup' | 'working' | 'drop' },
  settings?: Pick<Settings, 'restByExercise'>,
): number {
  if (row.kind === 'warmup') return WARMUP_REST
  const saved = settings?.restByExercise?.[row.exercise.trim().toLowerCase()]
  if (saved && saved > 0) return saved
  return restFromReps(Number(row.reps) || 0)
}

/**
 * The session's cost in minutes: work plus rest, over the sets that have reps.
 *
 * Rounded to the minute, because the number is for answering "does this fit in
 * the hour I have" and a figure like `47.3 min` claims a precision that three
 * seconds a rep does not have. The LAST set's rest is excluded — you are not
 * resting after you leave.
 */
export function sessionMinutes(
  rows: { exercise: string; reps?: string | number; kind?: 'warmup' | 'working' | 'drop' }[],
  settings?: Pick<Settings, 'restByExercise'>,
): { minutes: number; sets: number; restMin: number; workMin: number } {
  const real = rows.filter((r) => r.exercise.trim() && Number(r.reps) > 0)
  if (real.length === 0) return { minutes: 0, sets: 0, restMin: 0, workMin: 0 }
  const workSec = real.reduce((a, r) => a + Number(r.reps) * SECONDS_PER_REP, 0)
  const restSec = real.slice(0, -1).reduce((a, r) => a + restFor(r, settings), 0)
  return {
    minutes: Math.round((workSec + restSec) / 60),
    sets: real.length,
    restMin: Math.round(restSec / 60),
    workMin: Math.round(workSec / 60),
  }
}

/** `90s`, `2m`, `2m 30s` — the way a lifter says it. */
export function restLabel(sec: number): string {
  if (sec < 120) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}
