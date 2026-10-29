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

/**
 * An edit to one set carries to the sets after it that still held the old
 * value — type 50 on set 1 and sets 2 and 3 follow, the way the next set is
 * usually the same weight. A set you already changed by hand keeps its value.
 */
export function followOn(old: SetRow[], edited: SetRow[]): SetRow[] {
  if (old.length !== edited.length) return edited
  const out = edited.map((r) => ({ ...r }))
  out.forEach((r, i) => {
    for (const f of ['weight', 'reps'] as const) {
      if (r[f] === old[i][f]) continue
      for (let k = i + 1; k < out.length; k++) {
        if (out[k][f] === old[i][f]) out[k] = { ...out[k], [f]: r[f] }
      }
    }
  })
  return out
}
