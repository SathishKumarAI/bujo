import { useState } from 'react'
import { useJournal } from '../../store'
import { Empty, Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'
import { DefList, PanelCard, PanelGrid, Tag } from '../page'
import { prettyDay, todayISO } from '../../lib/date'
import { splitMeta } from '../../lib/fitness'
import { volumeOf } from '../../domain/sessions'
import { setLineOf } from './setRow'
import { groupSets } from './sessionLines'
import type { CappedList } from '../../lib/useCappedList'
import type { Workout, WorkoutSet } from '../../lib/types'

/**
 * THE SESSIONS YOU HAVE LOGGED · which this page did not show at all.
 *
 * WHAT THIS FILE OWNS: the session card, its inline set editor, and the delete.
 * WHAT IT DOES NOT OWN: the cap (`Review` holds it, because `ShowMore` lives in
 * the panel header), or any aggregate.
 *
 * **The gap, stated plainly: Strength had no history.** You logged a session,
 * a rollup card appeared until your next keystroke, and after that the session
 * existed only inside twelve analytics — a volume bar, a muscle count, a PR
 * row. There was no list, so there was nothing to correct: a set typed as
 * `120` instead of `12` was permanent, and `updateWorkout` has been in the
 * store the whole time. That is `USER-CONTROL.md`'s first rule failing on the
 * page with the most data entry in the app, and the same defect Home Workout
 * shipped (a `×` and nothing else) one cluster over.
 *
 * The card is `PanelCard` for the reason the other three pages give: a session
 * is a named item with a figure beside the name and a short body. Here the name
 * is the split, the figures are the volume and the set count, and the body is
 * what you actually lifted.
 *
 * **The editor rewrites BOTH stored shapes.** `setRows` is what every analytic
 * counts and `sets` is the human-readable line `parseSet` reads; `setLineOf` is
 * shared with the logger so the two cannot drift. Editing one and not the other
 * is how a corrected session keeps reporting its old numbers to the muscle
 * charts — measured on Home Workout, where `3×12` corrected to `9×99` moved the
 * stored rows from 12 to 18 and a string-only version would have looked
 * identical on screen.
 *
 * The exercise NAMES are fixed here: adding or swapping a lift is building a
 * session, which the logger in zone 2 already does, and a second place to do it
 * is a second opinion about what a session holds.
 */
export function GymHistory({ list, unit, onLoad }: {
  /** Lifting sessions, newest first, capped. */
  list: CappedList<Workout>
  unit: string
  /**
   * Put this session's exercises back in the logger.
   *
   * This is what replaced `LastSessionCard` in the act column — that card
   * showed the last session OF THE SELECTED SPLIT and offered one Load button.
   * Here every session has one, so "do what I did on Tuesday" works for
   * Tuesday rather than only for the most recent push day, and the act column
   * is ~250px shorter for it.
   */
  onLoad?: (exercises: string[], split: Workout['split']) => void
}) {
  const { updateWorkout, removeWorkout } = useJournal()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)

  if (list.total === 0) {
    return <Empty>Finish a session in the logger and it appears here, newest first.</Empty>
  }

  return (
    <PanelGrid>
      {list.shown.map((w) => {
        const rows = (w.setRows ?? []).filter((r) => r.exercise?.trim())
        const working = rows.filter((r) => r.kind !== 'warmup')
        const meta = splitMeta(w.split)
        const volume = volumeOf(w)
        const top = working.reduce<WorkoutSet | null>((a, r) => ((r.weight ?? 0) > (a?.weight ?? 0) ? r : a), null)
        return (
          <PanelCard
            key={w.id}
            title={`${meta.label} · ${prettyDay(w.date)}`}
            right={
              <span className="flex items-center gap-1.5">
                {volume > 0 && <Tag>{volume.toLocaleString()} {unit}</Tag>}
                <Tag>{working.length} {working.length === 1 ? 'set' : 'sets'}</Tag>
                {onLoad && rows.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoad([...new Set(rows.map((r) => r.exercise.trim()).filter(Boolean))], w.split)}
                    aria-label={`Load the ${meta.label} session from ${prettyDay(w.date)} into today's logger`}
                    className="h-auto p-0 text-label text-fg-2 hover:text-fg-1"
                  >Load</Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(editing === w.id ? null : w.id)}
                  aria-expanded={editing === w.id}
                  /* Follows the word on the button — see `fitness/History`. */
                  aria-label={editing === w.id ? `Close the editor for the ${meta.label} session on ${prettyDay(w.date)}` : `Edit the ${meta.label} session on ${prettyDay(w.date)}`}
                  className="h-auto p-0 text-label text-fg-2 hover:text-fg-1"
                >{editing === w.id ? 'Close' : 'Edit'}</Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    if (await confirm({
                      title: 'Delete this session?',
                      description: `The ${working.length} working ${working.length === 1 ? 'set' : 'sets'} logged on ${prettyDay(w.date)} are removed from your history, and from every chart that counts them. This cannot be undone.`,
                      confirmLabel: 'Delete session',
                      destructive: true,
                    })) removeWorkout(w.id)
                  }}
                  aria-label={`Delete the ${meta.label} session on ${prettyDay(w.date)}`}
                  className="text-fg-2 reveal hover:text-red"
                >×</Button>
              </span>
            }
          >
            {editing === w.id ? (
              <SetEditor
                workout={w}
                unit={unit}
                onSave={(patch) => { updateWorkout(w.id, patch); setEditing(null) }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                {/* What you lifted, not a count of it. A session card that says
                    "8 sets" and nothing else is the rollup card this page
                    already had — the thing worth reading back is the sets. */}
                {rows.length === 0 ? (
                  <p className="text-label text-fg-2">
                    {w.sets.length > 0 ? w.sets.join(' · ') : 'No sets recorded on this session.'}
                  </p>
                ) : (
                  /* GROUPED, because a real session is five identical sets.
                     Ungrouped, the first card measured **thirteen rows** of
                     which five read "Bench Press 65lb × 5" — a wall that says
                     one thing. `groupSets` collapses them to "Bench Press · 5 ×
                     65lb × 5", which is how a lifter says it out loud, and the
                     card went 13 rows to 4. */
                  <ul className="space-y-0.5 text-label text-fg-2">
                    {groupSets(rows, unit).map((g) => (
                      <li key={g.key} className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-fg-1">
                          {g.exercise}
                          {g.kind && g.kind !== 'working' && <span className="ml-1.5 text-micro text-fg-2">{g.kind}</span>}
                        </span>
                        <span className="num shrink-0">{g.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <DefList rows={[
                  ...(top ? [['Top', `${top.exercise} ${top.weight ? `${top.weight}${unit}` : 'bodyweight'} × ${top.reps ?? 0}`] as [string, string]] : []),
                  ...(w.durationMin != null ? [['Time', `${w.durationMin} min`] as [string, string]] : []),
                ]} />
                {w.notes && <p className="mt-2 border-t border-line pt-2 text-label italic text-fg-2">“{w.notes}”</p>}
              </>
            )}
          </PanelCard>
        )
      })}
    </PanelGrid>
  )
}

/** Correcting the sets of a session already logged. */
function SetEditor({ workout, unit, onSave, onCancel }: {
  workout: Workout
  unit: string
  onSave: (patch: Partial<Workout>) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(workout.date)
  const [notes, setNotes] = useState(workout.notes ?? '')
  const [rows, setRows] = useState(() => (workout.setRows ?? []).map((r) => ({
    exercise: r.exercise,
    weight: r.weight != null ? String(r.weight) : '',
    reps: r.reps != null ? String(r.reps) : '',
    kind: r.kind,
  })))
  const patch = (i: number, p: Partial<(typeof rows)[number]>) =>
    setRows((cur) => cur.map((r, n) => (n === i ? { ...r, ...p } : r)))

  function save() {
    const kept = rows.filter((r) => r.exercise.trim())
    onSave({
      date,
      notes: notes.trim(),
      // BOTH shapes, through the logger's own formatter.
      sets: kept.map((r) => setLineOf(r, unit)),
      setRows: kept.map((r) => ({
        exercise: r.exercise.trim(),
        weight: r.weight ? Number(r.weight) : undefined,
        reps: r.reps ? Number(r.reps) : undefined,
        kind: r.kind ?? 'working',
      })),
    })
  }

  return (
    <div className="mt-2 space-y-2 border-t border-line pt-3">
      {rows.length === 0 ? (
        <p className="text-label text-fg-2">This session has no structured sets to edit.</p>
      ) : rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-label text-fg-1" title={r.exercise}>{r.exercise}</span>
          <Input
            type="number"
            value={r.weight}
            onChange={(e) => patch(i, { weight: e.target.value })}
            aria-label={`${r.exercise} weight in ${unit}`}
            className="num w-20 shrink-0 py-1 text-right text-label"
          />
          <span aria-hidden className="text-label text-fg-2">×</span>
          <Input
            type="number"
            value={r.reps}
            onChange={(e) => patch(i, { reps: e.target.value })}
            aria-label={`${r.exercise} reps`}
            className="num w-16 shrink-0 py-1 text-right text-label"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRows((cur) => cur.filter((_, n) => n !== i))}
            aria-label={`Remove ${r.exercise} from this session`}
            className="shrink-0 text-fg-2 hover:text-red"
          >×</Button>
        </div>
      ))}
      <label className="block text-label text-fg-2">
        Date
        <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="mt-1 max-w-[11rem]" />
      </label>
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" aria-label="Session notes" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={save} className="press-3d flex-1">Save changes</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
