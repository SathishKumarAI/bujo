import { useState } from 'react'
import { Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Empty, Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { ActivityForm, draftOf, workoutOf, type ActivityDraft } from '../page'
import { fullLabelOf, modeOf } from '../../domain/activities'
import { prettyDay } from '../../lib/date'
import { displayDistance } from '../../lib/units'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import { WORKOUT_KEY } from '../../lib/recordKeys'
import type { DistanceUnit, Workout } from '../../lib/types'

/**
 * THE RECORD · every session in this mode, newest first, and a way to fix one.
 *
 * WHAT THIS FILE OWNS: the list, the filter chip, the edit dialog and the
 * weekly-minutes field under them.
 * WHAT IT DOES NOT OWN: which panel is on screen, or any aggregate.
 *
 * FIVE ROWS AND THE REST SCROLLS, rather than `ShowMore`'s eight-then-all. The
 * card was either 162px or the height of your whole history, and a list you
 * occasionally dig through should not change the height of the page to be
 * read — the same measurement that put Pickleball's history in a `max-h` box.
 * `tabIndex` and a name because it scrolls: a scroll region no keyboard can
 * reach is the `scrollable-region-focusable` violation this repo has shipped
 * twice.
 *
 * THE WEEKLY TARGET LIVES HERE, and until now it lived NOWHERE. `fitnessGoalMin`
 * is read by this page's headline fact, by `lib/coach.ts` and by Goals, and
 * there was no control for it anywhere in the app — a 150-minute default
 * governing the one fact in zone 1 that has a denominator. `USER-CONTROL.md`'s
 * first rule is that anything a person's numbers are measured against has to be
 * theirs to set. Under the sessions it is counting is where you are standing
 * when you decide whether 150 was the right number.
 */
export function FitnessHistory({ sessions, unit, total, filterLabel, onClearFilter }: {
  /** Already filtered — by mode, and by the figure the reader clicked. */
  sessions: Workout[]
  unit: DistanceUnit
  /** How many sessions exist in this mode, for the filter chip's "3 of 17". */
  total: number
  /** Set while a figure is driving the list. Names what is being shown. */
  filterLabel?: string | null
  onClearFilter?: () => void
}) {
  const { data, removeWorkout, setSettings } = useJournal()
  const [editing, setEditing] = useState<Workout | null>(null)
  const justCaptured = useJustCaptured()

  return (
    <Card
      band
      title="History"
      subtitle="Tap a row to correct it, × to remove"
      collapsible
      right={filterLabel ? (
        /* THE FILTER STATES ITSELF AND COMES OFF IN ONE TAP. A list that is
           quietly short reads as broken rather than as filtered. */
        <button
          type="button"
          onClick={onClearFilter}
          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ink-2 px-2.5 py-0.5 text-label text-fg-1 transition-colors hover:border-line-strong"
        >
          {filterLabel} · {sessions.length} of {total}
          <span aria-hidden>×</span>
          <span className="sr-only">Clear this filter</span>
        </button>
      ) : undefined}
    >
      {sessions.length === 0 ? (
        <Empty>{filterLabel ? `No sessions match ${filterLabel}.` : 'Log a session and it appears here.'}</Empty>
      ) : (
        <div
          className={sessions.length > 5 ? 'max-h-[15rem] overflow-y-auto pr-1' : undefined}
          tabIndex={sessions.length > 5 ? 0 : undefined}
          role={sessions.length > 5 ? 'group' : undefined}
          aria-label={sessions.length > 5 ? `All ${sessions.length} sessions, scrollable` : undefined}
        >
          <ul className="divide-y divide-surface0">
            {/* Every row, inside the scrollport — never a slice. A list cut
                at N with no way to reach N+1 is COD-303, which shipped on four
                history lists at four different numbers. */}
            {sessions.map((w) => {
              const fresh = justCaptured.has(WORKOUT_KEY(w.id))
              return (
                <li
                  key={w.id}
                  {...justCapturedProps(fresh)}
                  className={`group flex items-center justify-between gap-2 py-2 ${fresh ? 'just-captured' : ''}`}
                >
                  <button onClick={() => setEditing(w)} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
                    <span className="truncate font-medium text-fg-1">{fullLabelOf(w.activity, w.subActivity)}</span>
                    <span className="shrink-0 text-label text-fg-2">{prettyDay(w.date)}</span>
                  </button>
                  <div className="num flex shrink-0 items-center gap-2 text-label text-fg-2">
                    {w.durationMin != null && <span>{w.durationMin}m</span>}
                    {w.distanceKm != null && <span>{displayDistance(w.distanceKm, unit)}{unit}</span>}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeWorkout(w.id)}
                      aria-label={`Delete ${fullLabelOf(w.activity, w.subActivity)} on ${prettyDay(w.date)}`}
                      className="text-fg-2 reveal hover:text-red"
                    >×</Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {sessions.length > 5 && (
        <p className="mt-2 text-label text-fg-2">Showing 5 of {sessions.length} · scroll for the rest</p>
      )}

      <label className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-label text-fg-2">
        Weekly target
        <Input
          type="number"
          value={data.settings.fitnessGoalMin ?? ''}
          onChange={(e) => setSettings({ fitnessGoalMin: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="150"
          className="w-16 py-0.5 text-right"
        />
        active minutes a week
      </label>

      <EditDialog workout={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

/** In-place edit for a logged session, so correcting one costs no scrolling. */
function EditDialog({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const { updateWorkout, removeWorkout } = useJournal()
  return (
    <Dialog open={!!workout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit session</DialogTitle></DialogHeader>
        {workout && (
          <EditFields
            workout={workout}
            onSave={(p) => { updateWorkout(workout.id, p); onClose() }}
            onDelete={() => { removeWorkout(workout.id); onClose() }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditFields({ workout, onSave, onDelete }: {
  workout: Workout
  onSave: (p: Omit<Workout, 'id'>) => void
  onDelete: () => void
}) {
  const confirm = useConfirm()
  const { data } = useJournal()
  const unit = data.settings.distanceUnit
  const [draft, setDraft] = useState(() => draftOf(workout, unit))
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))
  // The session's own mode, not the page's: editing a push day should let you
  // correct it to a pull day, never silently reclassify it as a Run.
  return (
    <div className="space-y-3">
      <ActivityForm
        mode={modeOf(draft.activity)}
        draft={draft}
        onChange={patch}
        onSubmit={() => onSave(workoutOf(draft, unit))}
        unit={unit}
        submitLabel="Save session"
      />
      <Button
        variant="ghost"
        onClick={async () => {
          if (await confirm({
            title: 'Delete this session?',
            description: 'The session and its sets are removed from your history. This cannot be undone.',
            confirmLabel: 'Delete session',
            destructive: true,
          })) onDelete()
        }}
        className="inline-flex items-center gap-1.5 text-red hover:text-red"
      ><Icon as={Trash} size="sm" /> Delete</Button>
    </div>
  )
}
