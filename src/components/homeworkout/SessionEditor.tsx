import { useState } from 'react'
import { Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { DayPick } from '../ui/quickpick'
import { EmptyFrame } from '../page'
import { addDays, todayISO } from '../../lib/date'
import { homeSetRows, splitSessionLine } from '../../lib/homeExercises'
import type { Workout } from '../../lib/types'

/**
 * Correcting a session you already logged.
 *
 * **Why this exists:** it did not, and that was the gap. A logged home session
 * offered exactly one affordance — a `×` that deleted it, with no confirmation
 * — so a mistyped rep count cost you the whole session: the date, the duration,
 * the notes and every other exercise in it, retyped. `useJournal` has carried
 * `updateWorkout(id, patch)` the entire time with **two call sites in the app**,
 * both on Fitness. The capability was there; the page never offered it.
 *
 * What it edits is what a session *is*: the day, how long, how it went, and the
 * reps against each movement. The movement NAMES are fixed here on purpose —
 * adding or swapping an exercise is building a session, which the builder above
 * already does, and a second place to do it is a second opinion about what a
 * session holds.
 *
 * Both stored shapes are rewritten on save, through the same helper the logger
 * uses: the `sets` strings a human reads, and the `setRows` every analytic in
 * `lib/fitness.ts` counts. Rewriting one and not the other is how a corrected
 * session would keep reporting its old numbers to the muscle charts.
 */
export function SessionEditor({ workout, onSave, onCancel }: {
  workout: Workout
  onSave: (patch: Partial<Workout>) => void
  onCancel: () => void
}) {
  const today = todayISO()
  const [date, setDate] = useState(workout.date)
  const [dur, setDur] = useState(workout.durationMin != null ? String(workout.durationMin) : '')
  const [notes, setNotes] = useState(workout.notes ?? '')
  const [lines, setLines] = useState(() => workout.sets.map(splitSessionLine))

  function save() {
    const kept = lines.filter((l) => l.name.trim())
    onSave({
      date,
      durationMin: dur ? Number(dur) : undefined,
      notes: notes.trim(),
      sets: kept.map((l) => (l.reps ? `${l.name} ${l.reps}` : l.name)),
      setRows: homeSetRows(kept),
    })
  }

  return (
    <div className="space-y-3">
      {lines.length === 0 ? (
        <EmptyFrame>Every exercise has been removed. Saving now stores an empty session.</EmptyFrame>
      ) : (
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="num w-4 shrink-0 text-label text-fg-3">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-body text-fg-1" title={l.name}>{l.name}</span>
              {/* Same shape as the builder's row, and for the same measured
                  reason: `3×10 per side` does not fit an 80px box, so the value
                  being edited scrolled out of sight. */}
              <Input
                value={l.reps}
                onChange={(e) => setLines((cur) => cur.map((x, n) => (n === i ? { ...x, reps: e.target.value } : x)))}
                aria-label={`${l.name} sets and reps`}
                className="num w-40 shrink-0 py-1 text-left text-label"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setLines((cur) => cur.filter((_, n) => n !== i))}
                aria-label={`Remove ${l.name} from this session`}
                className="shrink-0 text-fg-2 hover:text-red"
              >×</Button>
            </div>
          ))}
        </div>
      )}

      <DayPick value={date} onChange={setDate} today={today} yesterday={addDays(today, -1)} />
      <Input type="number" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="Minutes" aria-label="Duration in minutes" />
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" rows={2} />

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} className="press-3d flex-1">Save changes</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
