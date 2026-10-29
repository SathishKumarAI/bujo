import { lastSetFor, SPLITS } from '../../../lib/fitness'
import type { ProgramDay } from '../../../lib/programs'
import type { JournalData, Split } from '../../../lib/types'
import { newSetRow, type SetRow } from '../../gym/setRow'

/*
 * Program → Strength translations for logging a program day ON the Program
 * page (phone). Out of the component file for fast refresh.
 */

/**
 * The day's prescription as set rows ready to tick: one row per prescribed
 * set, reps from a "12 reps" target, weight from the last time you did the
 * lift. A target that is not reps ("30 s", "Max effort") leaves reps empty.
 */
export function planRows(day: ProgramDay, data: JournalData): SetRow[] {
  return day.exercises.flatMap((e) => {
    const n = Math.max(1, Number.parseInt(e.sets, 10) || 1)
    const reps = /rep/i.test(e.qty) ? (/^(\d+)/.exec(e.qty.trim())?.[1] ?? '') : ''
    const prev = lastSetFor(data, e.name)
    const weight = prev && prev.weight > 0 ? String(prev.weight) : ''
    return Array.from({ length: n }, () => newSetRow({ exercise: e.name, weight, reps, kind: 'working' }))
  })
}

/** "Legs (quad)" → legs, "Full body" → full; anything unnamed is `other`. */
export function splitForFocus(focus: string): Split {
  const f = focus.toLowerCase()
  return SPLITS.find((s) => s.id !== 'other' && f.includes(s.label.toLowerCase()))?.id ?? 'other'
}

/** What was done, for the program's "actual" field: "60×8, 60×8" or "8, 8". */
export function actualOf(rows: SetRow[], unit: string): string {
  return rows
    .filter((r) => r.reps || r.weight)
    .map((r) => (r.weight ? `${r.weight}${unit}×${r.reps || '?'}` : r.reps))
    .join(', ')
}
