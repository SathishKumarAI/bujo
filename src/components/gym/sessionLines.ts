import type { WorkoutSet } from '../../lib/types'

/**
 * HOW A LOGGED SESSION READS BACK · grouped the way a lifter says it.
 *
 * WHAT THIS FILE OWNS: turning stored `setRows` into the lines a history card
 * prints.
 * WHAT IT DOES NOT OWN: the card, the editor, or what a set means to an
 * analytic.
 *
 * A real session is the same lift five times. Printed one row per stored set,
 * the first demo card measured **thirteen rows**, five of them the identical
 * string "Bench Press 65lb × 5" — a wall of text that says one thing and
 * costs a card four times its height. Grouped it is four rows:
 *
 * ```
 * Bench Press      5 × 65lb × 5
 * Overhead Press   5 × 37.5lb × 5
 * Dip              3 × BW × 8
 * ```
 *
 * **Bodyweight is `BW`, not `0lb`.** A dip stored with no weight rendered as
 * `0lb × 8`, which reads as a logging bug rather than as a pull-up — and it is
 * the same "a zero and an absence must not look alike" rule as
 * `count ? sum / count : 0`.
 *
 * Grouping is by exercise AND by the (weight, reps, kind) triple, not by
 * exercise alone: a drop set or a last set that broke is the interesting part
 * of a session, and collapsing `5,5,5,5,4` into "5 × 5" would delete the fact
 * that the fifth set broke. So that session prints two lines, which is what
 * happened.
 */
export interface SetGroup {
  key: string
  exercise: string
  kind?: WorkoutSet['kind']
  /** `5 × 65lb × 5`, or `65lb × 5` for a single set. */
  text: string
}

export function groupSets(rows: WorkoutSet[], unit: string): SetGroup[] {
  const out: SetGroup[] = []
  let run: { r: WorkoutSet; n: number } | null = null

  const flush = () => {
    if (!run) return
    const { r, n } = run
    const load = r.weight ? `${r.weight}${unit}` : 'BW'
    const one = `${load} × ${r.reps ?? 0}`
    out.push({
      key: `${out.length}-${r.exercise}`,
      exercise: r.exercise,
      kind: r.kind,
      text: n > 1 ? `${n} × ${one}` : one,
    })
    run = null
  }

  for (const r of rows) {
    const same = run
      && run.r.exercise === r.exercise
      && run.r.weight === r.weight
      && run.r.reps === r.reps
      && run.r.kind === r.kind
    if (same && run) run.n += 1
    else { flush(); run = { r, n: 1 } }
  }
  flush()
  return out
}
