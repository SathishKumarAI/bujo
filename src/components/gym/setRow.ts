/**
 * A logged set, and the only way to make one.
 *
 * Its own module rather than an export from `SessionLogger.tsx`, because a
 * component file that also exports a helper breaks fast refresh — eslint's
 * `react-refresh/only-export-components` said so, and it is the same "one
 * concern per file" rule the repo's CLAUDE.md states.
 */

export interface SetRow {
  /**
   * Identity, so React can key on the ROW rather than on its position.
   *
   * The list was `rows.map((row, i) => <div key={i}>)` while rows are deleted
   * from the middle (the × button) and **inserted into the middle** — tapping
   * a warm-up rung splices a row in at `i`. With a positional key React reuses
   * the DOM node at each index, so every row below the insertion point keeps
   * the previous row's `ExercisePicker` open/query state, its focus and the
   * caret in a half-typed field. Mid-workout, one-handed, that reads as the
   * app scrambling the sets you just entered.
   */
  id: string
  exercise: string
  weight: string
  reps: string
  rpe?: string
  kind?: 'warmup' | 'working' | 'drop'
}

/** A blank row with its own identity. Never build a `SetRow` by hand. */
export const newSetRow = (patch: Partial<SetRow> = {}): SetRow => ({
  id: `sr_${Math.random().toString(36).slice(2, 10)}`,
  exercise: '',
  weight: '',
  reps: '',
  ...patch,
})

/**
 * The stored human-readable line for one set — the OTHER shape a session is
 * kept in.
 *
 * A `Workout` carries both `setRows` (what every analytic counts) and `sets`
 * (strings, which is what legacy journals hold and what `parseSet` reads). The
 * format was written inline inside `Gym`'s `finish()`, so the history editor
 * would have been a second opinion about it — and `REUSABLE-PATTERNS.md` §4 is
 * explicit that an edit must rewrite EVERY stored shape, not the one the list
 * renders. One source, two callers.
 *
 * `1x`, not `Nx`: one row is one set, so the count is 1 and the number after
 * the `x` is the reps. It held the loop index once, which left `parseSet`
 * reading the rep slot as a set count.
 */
export const setLineOf = (r: { exercise: string; weight: string; reps: string }, unit: string): string =>
  `${r.exercise.trim()} 1x${r.reps || '?'} @ ${r.weight || '0'}${unit}`
