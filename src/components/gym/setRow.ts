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
