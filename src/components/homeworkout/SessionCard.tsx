import { useState } from 'react'
import { Barbell } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { ChipPick, DayPick } from '../ui/quickpick'
import { EmptyFrame } from '../page'
import { addDays } from '../../lib/date'
import { onRaised } from '../../lib/colors'
import { HOME_ROUTINES } from '../../lib/homeProgramming'
import { exerciseById } from '../../lib/homeExercises'

export interface SessionItem { id: string; name: string; reps: string }

/**
 * ZONE 2 · build today's session and log it.
 *
 * Lifted out of `views/HomeWorkout.tsx` when the page went onto the three-zone
 * contract, for the reason the workspace rule gives — the view was one file
 * holding the act, the library and the history, and changing the form meant
 * reading all of it.
 *
 * The state stays in the view: the library's Add button writes into the same
 * list this card renders, and two components owning one array is how they come
 * to disagree about what is in it.
 *
 * A routine fills the list in one tap. The ids come from `lib/homeProgramming.ts`
 * and the reps come from the library, so a routine cannot carry its own private
 * opinion of what a push-up set is — that is the shape of the bug the pull-up
 * page shipped when a view retyped the data module it should have read.
 */
export function SessionCard({
  items, onReps, onDrop, onLoadRoutine,
  date, onDate, today,
  dur, onDur, notes, onNotes, onLog,
}: {
  items: SessionItem[]
  onReps: (id: string, reps: string) => void
  onDrop: (id: string) => void
  onLoadRoutine: (items: SessionItem[]) => void
  date: string
  onDate: (d: string) => void
  today: string
  dur: string
  onDur: (v: string) => void
  notes: string
  onNotes: (v: string) => void
  onLog: () => void
}) {
  const [routine, setRoutine] = useState<string | null>(null)
  const loaded = HOME_ROUTINES.find((x) => x.id === routine)

  function loadRoutine(id: string) {
    const r = HOME_ROUTINES.find((x) => x.id === id)
    if (!r) return
    setRoutine(id)
    onLoadRoutine(r.items.flatMap((exId) => {
      const ex = exerciseById(exId)
      return ex ? [{ id: ex.id, name: ex.name, reps: ex.reps }] : []
    }))
  }

  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Barbell} size="md" className="text-mauve" /> Today’s session</span>}
      subtitle={items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'}` : 'Start from a routine, or add from the library below'}
    >
      <div className="space-y-4">
        {/* `Full body`, not `Full body · no kit`. Seven full names wrapped to
            four lines in a 424px act column; `name` keeps the full one as the
            accessible name and `hint` as the hover title, so nothing is lost by
            shortening what is drawn. Same rule as `FAMILY_SHORT`. */}
        <ChipPick
          label="Start from a routine"
          value={routine}
          onChange={loadRoutine}
          dense
          options={HOME_ROUTINES.map((r) => ({ value: r.id, label: r.short, name: r.name, hint: `${r.focus} · needs ${r.needs.toLowerCase()}` }))}
          hint="Replaces whatever is in the list. Every exercise stays editable."
        />

        {/* `needs` and `how` had no call site at all — the routine told you how
            to run it and what to have in the room, and the page rendered
            neither. A routine you have just loaded is exactly when both are the
            next thing you want. */}
        {loaded && (
          <div className="rounded-card border border-line bg-ink-1 p-3">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-body font-medium text-fg-1">{loaded.name}</h3>
              <span className="rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-2">{loaded.needs}</span>
            </div>
            <p className="text-label text-fg-2">{loaded.how}</p>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyFrame>Pick a routine above, or tap “Add” on an exercise in the library.</EmptyFrame>
        ) : (
          <div className="space-y-2">
            {items.map((i, n) => (
              <div key={i.id} className="flex items-center gap-2 rounded-card bg-ink-2 py-1.5 pl-3 pr-1.5">
                {/* The index, because a session is an ORDER and the list was
                    four identical rows with nothing saying which came first. */}
                <span className="num w-4 shrink-0 text-label text-fg-3">{n + 1}</span>
                <span className="min-w-0 flex-1 truncate text-body text-fg-1">{i.name}</span>
                <Input value={i.reps} onChange={(e) => onReps(i.id, e.target.value)} aria-label={`${i.name} sets/reps`} className="num w-20 py-1 text-right text-label" />
                <Button variant="ghost" size="icon-sm" onClick={() => onDrop(i.id)} aria-label={`Remove ${i.name}`} className="shrink-0 text-fg-2 hover:text-red">×</Button>
              </div>
            ))}
            {/* There was no date field at all — `logSession` hardcoded today,
                so a session you did this morning and logged tonight was fine,
                and one you forgot until tomorrow was unloggable. */}
            <DayPick value={date} onChange={onDate} today={today} yesterday={addDays(today, -1)} />
            <Input type="number" value={dur} onChange={(e) => onDur(e.target.value)} placeholder="Minutes" aria-label="Duration in minutes" />
            <Textarea value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="How did it go?" rows={2} />
            <Button onClick={onLog} className="press-3d w-full">Log workout</Button>
            <p className="text-center text-label" style={{ color: onRaised('green') }}>
              {items.length} exercise{items.length === 1 ? '' : 's'} will be written to your journal
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
