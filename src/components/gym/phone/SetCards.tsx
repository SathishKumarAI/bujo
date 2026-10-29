import { Plus, Timer, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import type { JournalData } from '../../../lib/types'
import { lastSetFor } from '../../../lib/fitness'
import { newSetRow, type SetRow } from '../setRow'

/**
 * THE PHONE'S SET LOGGER — one card per exercise, its sets as rows (COD-460).
 *
 * OWNS: grouping a flat `SetRow[]` into exercise cards, and the row anatomy
 * lifting apps converged on: set number (tap: warm-up ↔ working) · last time ·
 * weight · reps · rest. Used by the log screen AND the edit sheet, so editing
 * a past session works the way logging one does.
 * DOES NOT OWN: saving, PR detection, the rest timer — the view's.
 *
 * The rows stay ONE flat list in the order they were entered; a card is a
 * view over consecutive rows of the same exercise, so an exercise done twice
 * in a session (supersets, coming back to it) draws twice rather than being
 * silently merged — merging would reorder sets the lifter did in that order.
 */
export function SetCards({ rows, onChange, unit, data, onRest, done, bare }: {
  rows: SetRow[]
  onChange: (rows: SetRow[]) => void
  unit: string
  data: JournalData
  /** Start the rest timer after a set. Omitted in the edit sheet. */
  onRest?: (row: SetRow) => void
  /** Ids of sets already rested this session (drawn ticked). */
  done?: ReadonlySet<string>
  /** No card frame and no name row — the caller's own row already shows both
   *  (Program's lift row opening in place). */
  bare?: boolean
}) {
  const groups: { exercise: string; start: number; rows: SetRow[] }[] = []
  rows.forEach((r, i) => {
    const g = groups[groups.length - 1]
    if (g && g.exercise === r.exercise) g.rows.push(r)
    else groups.push({ exercise: r.exercise, start: i, rows: [r] })
  })
  const patch = (id: string, p: Partial<SetRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id))
  function addSet(g: (typeof groups)[number]) {
    const last = g.rows[g.rows.length - 1]
    // A new set copies the last one's numbers — the next set is usually the
    // same weight for the same reps, so it is one tap, not two fields.
    const next = newSetRow({ exercise: g.exercise, weight: last.weight, reps: last.reps, kind: last.kind === 'warmup' ? 'working' : last.kind })
    const at = g.start + g.rows.length
    onChange([...rows.slice(0, at), next, ...rows.slice(at)])
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.filter((g) => g.exercise.trim()).map((g) => {
        const prev = lastSetFor(data, g.exercise)
        // Working sets are numbered 1, 2, 3 — warm-ups draw "W" and do not count.
        const numbers = g.rows.reduce<number[]>((acc, r) => [...acc, r.kind === 'warmup' ? 0 : (acc.filter(Boolean).length + 1)], [])
        return (
          <section key={g.rows[0].id} aria-label={g.exercise} className={bare ? undefined : 'cells'}>
            <div className={bare ? 'sr-only' : 'flex items-baseline justify-between gap-2 px-4 pt-3 pb-1'}>
              <h3 className="min-w-0 truncate text-heading font-semibold text-fg-1">{g.exercise}</h3>
              <span className="shrink-0 text-label text-fg-2">{prev ? `Last ${prev.weight > 0 ? `${prev.weight}${unit}` : 'bodyweight'} × ${prev.reps}` : 'First time'}</span>
            </div>
            <div className="set-head" aria-hidden>
              <span>Set</span><span>{unit}</span><span>Reps</span><span />
            </div>
            {g.rows.map((r, k) => {
              const warm = r.kind === 'warmup'
              const working = numbers[k]
              const ticked = done?.has(r.id)
              return (
                <div key={r.id} className="set-row" data-done={ticked || undefined}>
                  <button
                    type="button"
                    className="set-badge"
                    data-warm={warm || undefined}
                    onClick={() => patch(r.id, { kind: warm ? 'working' : 'warmup' })}
                    aria-label={warm ? 'Warm-up set — make it a working set' : `Set ${working} — make it a warm-up`}
                  >
                    {warm ? 'W' : working}
                  </button>
                  <input className="set-input" inputMode="decimal" value={r.weight} placeholder={prev ? String(prev.weight) : '0'} aria-label={`${g.exercise} ${warm ? 'warm-up' : `set ${working}`} weight in ${unit}`} onChange={(e) => patch(r.id, { weight: e.target.value.replace(/[^0-9.]/g, '') })} />
                  <input className="set-input" inputMode="numeric" value={r.reps} placeholder={prev ? String(prev.reps) : '0'} aria-label={`${g.exercise} ${warm ? 'warm-up' : `set ${working}`} reps`} onChange={(e) => patch(r.id, { reps: e.target.value.replace(/[^0-9]/g, '') })} />
                  {onRest ? (
                    <button type="button" className="check-circle" aria-pressed={!!ticked} aria-label={`${g.exercise} ${warm ? 'warm-up' : `set ${working}`} done — start rest`} onClick={() => onRest(r)}>
                      <span aria-hidden><Icon as={Timer} size="sm" /></span>
                    </button>
                  ) : (
                    <button type="button" className="round-btn" aria-label={`Remove ${g.exercise} ${warm ? 'warm-up' : `set ${working}`}`} onClick={() => remove(r.id)}>
                      <Icon as={X} size="sm" />
                    </button>
                  )}
                </div>
              )
            })}
            <div className="flex gap-2 px-4 pt-1 pb-3">
              <button type="button" className="suggest inline-flex flex-1 items-center justify-center gap-1.5" onClick={() => addSet(g)}>
                <Icon as={Plus} size="sm" /> Add set
              </button>
              {onRest && g.rows.length > 0 && (
                <button type="button" className="suggest" aria-label={`Remove last ${g.exercise} set`} onClick={() => remove(g.rows[g.rows.length - 1].id)}>
                  <Icon as={X} size="sm" />
                </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
