import { parseSet } from '../../../lib/fitness'
import { restFor } from '../../../lib/rest'
import type { Settings, Workout, WorkoutSet } from '../../../lib/types'
import { newSetRow, setLineOf, type SetRow } from '../setRow'

/*
 * The Strength phone page's translations (COD-460) — out of the component
 * files because fast refresh needs those to export components only.
 */

/**
 * Form rows → what a workout stores. The SAME mapping as `Gym.tsx`'s
 * `finish()`: structured `setRows` plus the legacy `sets` lines every older
 * reader parses, and the rest each set implies.
 */
export function storedSets(rows: SetRow[], unit: string, settings: Pick<Settings, 'restByExercise'>): { setRows: WorkoutSet[]; sets: string[] } {
  const valid = rows.filter((r) => r.exercise.trim())
  return {
    sets: valid.map((r) => setLineOf(r, unit)),
    setRows: valid.map((r) => ({
      exercise: r.exercise.trim(),
      weight: r.weight ? Number(r.weight) : undefined,
      reps: r.reps ? Number(r.reps) : undefined,
      rpe: r.rpe ? Number(r.rpe) : undefined,
      kind: r.kind ?? 'working',
      restSec: restFor({ exercise: r.exercise, reps: r.reps, kind: r.kind }, settings),
    })),
  }
}

/**
 * A stored workout → editable rows. Structured `setRows` when it has them;
 * otherwise the legacy "Bench 3x8 @ 60kg" lines, one row per set — a session
 * logged before structured sets existed is still editable, not read-only.
 */
export function rowsOf(w: Workout): SetRow[] {
  if (w.setRows?.length) {
    return w.setRows.map((s) => newSetRow({ exercise: s.exercise, weight: s.weight != null ? String(s.weight) : '', reps: s.reps != null ? String(s.reps) : '', rpe: s.rpe != null ? String(s.rpe) : undefined, kind: s.kind }))
  }
  return w.sets.flatMap((line) => {
    const p = parseSet(line)
    if (!p) return []
    return Array.from({ length: Math.max(1, p.sets) }, () => newSetRow({ exercise: p.exercise, weight: String(p.weight), reps: String(p.reps) }))
  })
}
