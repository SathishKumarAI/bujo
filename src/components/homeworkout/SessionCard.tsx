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
import { exerciseById, FAMILY_SHORT } from '../../lib/homeExercises'

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
  dur, onDur, notes, onNotes, onLog, onShut,
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
  /** Fold the whole act column away. The VIEW owns the state, because the page
   *  grid has to know: shut, the act column becomes a 40px rail and the review
   *  takes the width. A card cannot collapse a column it does not own. */
  onShut: () => void
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
      collapsible
      open
      onOpenChange={(o) => { if (!o) onShut() }}
      title={<span className="inline-flex items-center gap-2"><Icon as={Barbell} size="md" className="text-mauve" /> Today’s session</span>}
      /* The subtitle has to say what is inside while it is shut, or the fold
         hides the one number you would reopen it for. */
      subtitle={items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'} ready to log` : 'Start from a routine, or add from the library below'}
    >
      <div className="space-y-4">
        {/* `Full`, not `Full body · no kit`. Seven full names wrapped to four
            lines in a 424px act column; `name` keeps the full one as the
            accessible name and `hint` as the hover title, so nothing is lost by
            shortening what is drawn. Same rule as `FAMILY_SHORT`.

            **GEOMETRY, MEASURED — all seven on one line was asked for, and the
            margin is 3px.** On the built bundle at 1440 the row is **381px of
            chips in a 384px card**: `Full · Upper · Legs · Core · DB · Cardio ·
            New`, dense, with 4px gaps. Renaming any of them, or dropping
            `dense`, wraps it. The previous labels measured 590px.

            A phone is **2 lines** (381px in 324px) and that is the floor: seven
            chips cannot fit 324px without going under a 44px touch target, and
            this file is not the place to spend that. The comment above the
            pull-up Rounds row is what a stale version of this note looks like —
            re-measure it when you touch the card. */}
        <ChipPick
          label="Start from a routine"
          value={routine}
          onChange={loadRoutine}
          dense
          options={HOME_ROUTINES.map((r) => ({ value: r.id, label: r.short, name: r.name, hint: `${r.name} · ${r.focus} · needs ${r.needs.toLowerCase()}` }))}
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
            {items.map((i, n) => {
              const ex = exerciseById(i.id)
              return (
              <div key={i.id} className="flex items-center gap-2 rounded-card bg-ink-2 py-1.5 pl-3 pr-1.5">
                {/* The index, because a session is an ORDER and the list was
                    four identical rows with nothing saying which came first. */}
                <span className="num w-4 shrink-0 text-label text-fg-3">{n + 1}</span>
                <span className="min-w-0 flex-1 truncate text-body text-fg-1" title={i.name}>{i.name}</span>
                {/* The movement family, in the gap that was doing nothing.
                    Measured on the built bundle: the name column took **218px
                    of a 384px row** to hold a word like "Plank", so ~180px sat
                    empty between the name and its reps. What belongs there is
                    what the session is MADE of — "push and pull in the same
                    quantity" is one of this page's own principles, and until
                    now the builder gave you no way to see the balance you were
                    building. */}
                {ex && (
                  <span className="hidden shrink-0 rounded-pill bg-ink-1 px-2 py-0.5 text-micro text-fg-2 sm:inline-block" title={`${i.name} · ${FAMILY_SHORT[ex.family]}`}>
                    {FAMILY_SHORT[ex.family]}
                  </span>
                )}
                {/* The field TAKES the slack instead of sitting in a fixed
                    80px box beside it. `3×10 per side` is wider than 80px, so
                    it scrolled inside its own input — the value you came to
                    edit, unreadable, with ~180px of empty row next to it.
                    Measured across the library's twenty-one specs, the widest
                    (`3×30s per side`) needs **155px**, so the field is a fixed
                    **160px** and the NAME is what truncates — with a `title`,
                    and it is also in the field's own accessible name. The first
                    attempt let both flex and they competed: a long name left
                    the field at 88px for 122px of value, which is the same bug
                    one row over. Left-aligned, because a right-aligned overflow
                    hides the START of the value — the part that says how many
                    sets. The family tag drops below `sm`, where 324px cannot
                    hold name, tag, field and delete at once. */}
                <Input value={i.reps} onChange={(e) => onReps(i.id, e.target.value)} aria-label={`${i.name} sets and reps`} className="num w-40 shrink-0 py-1 text-left text-label" />
                <Button variant="ghost" size="icon-sm" onClick={() => onDrop(i.id)} aria-label={`Remove ${i.name}`} className="shrink-0 text-fg-2 hover:text-red">×</Button>
              </div>
              )
            })}
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
