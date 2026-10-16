import { useState } from 'react'
import { useJournal } from '../../store'
import { Empty, Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'
import { ActivityForm, DefList, PanelCard, PanelGrid, Tag, draftOf, workoutOf, type ActivityDraft } from '../page'
import { fullLabelOf, modeOf } from '../../domain/activities'
import { prettyDay } from '../../lib/date'
import { pace } from '../../lib/fitness'
import { displayDistance } from '../../lib/units'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import { WORKOUT_KEY } from '../../lib/recordKeys'
import type { CappedList } from '../../lib/useCappedList'
import type { DistanceUnit, Workout } from '../../lib/types'

/**
 * THE RECORD · the last three sessions as cards, each correctable in place.
 *
 * WHAT THIS FILE OWNS: the session card, its inline editor, and the weekly
 * target under them.
 * WHAT IT DOES NOT OWN: which panel is on screen, the cap (`Review` holds the
 * `CappedList` because the `ShowMore` affordance lives in the panel header),
 * or any aggregate.
 *
 * **It was a list of one-line rows in a 15rem scroller.** Asked for directly:
 * *"could you make this into like a cards kind of history instead of just
 * showing like a line… show like the last three… and if they want, they can
 * view the full history as well"*. It is the shape Home Workout already landed
 * on one page earlier, and the argument there applies here unchanged — a
 * session is a named item with a figure beside the name and a short body,
 * which is what `PanelCard` is for. The row could only ever show the activity,
 * the day and two numbers; the card shows the pace, the effort, the calories
 * and what you wrote about it, without a click.
 *
 * **Edit is a named control, not a click target you have to discover.** The
 * row opened a modal when you clicked anywhere on it — undiscoverable, and a
 * dialog over a page you were reading. `USER-CONTROL.md` rule 1 is that `add`
 * without a visible `edit` is a bug; the Home Workout pass fixed exactly this
 * and the fix did not reach here because this page's editor already existed in
 * a drawer nobody could see. The editor is `ActivityForm` — the same form that
 * logs a session, so a corrected session cannot be a shape the logger would
 * never produce — opened in the card body, with the session's OWN mode: a push
 * day stays correctable to a pull day and never silently becomes a Run.
 *
 * **Delete asks first and names what it removes.** It deleted on the first
 * click with no confirmation, which is the Home Workout history defect
 * verbatim, inherited when this list was carried over.
 */
export function FitnessHistory({ list, unit }: {
  /** The mode's sessions, already filtered by any drill-down, capped at three. */
  list: CappedList<Workout>
  unit: DistanceUnit
}) {
  const { data, updateWorkout, removeWorkout, setSettings } = useJournal()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)
  const justCaptured = useJustCaptured()

  return (
    <>
      {list.total === 0 ? (
        <Empty>Log a session and it appears here, newest first.</Empty>
      ) : (
        <PanelGrid>
          {list.shown.map((w) => {
            const fresh = justCaptured.has(WORKOUT_KEY(w.id))
            const name = fullLabelOf(w.activity, w.subActivity)
            const speed = pace(w.distanceKm, w.durationMin, unit)
            return (
              <PanelCard
                key={w.id}
                title={name}
                right={
                  <span className="flex items-center gap-1.5" {...justCapturedProps(fresh)}>
                    {w.durationMin != null && <Tag>{w.durationMin}m</Tag>}
                    {w.distanceKm != null && <Tag>{displayDistance(w.distanceKm, unit)} {unit}</Tag>}
                    {/* Edit before delete, and both named. */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(editing === w.id ? null : w.id)}
                      aria-expanded={editing === w.id}
                      aria-label={`Edit ${name} on ${prettyDay(w.date)}`}
                      className="h-auto p-0 text-label text-fg-2 hover:text-fg-1"
                    >{editing === w.id ? 'Close' : 'Edit'}</Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        if (await confirm({
                          title: 'Delete this session?',
                          description: `${name} on ${prettyDay(w.date)} is removed from your history. This cannot be undone.`,
                          confirmLabel: 'Delete session',
                          destructive: true,
                        })) removeWorkout(w.id)
                      }}
                      aria-label={`Delete ${name} on ${prettyDay(w.date)}`}
                      className="text-fg-2 reveal hover:text-red"
                    >×</Button>
                  </span>
                }
              >
                {editing === w.id ? (
                  <SessionEdit
                    workout={w}
                    unit={unit}
                    onSave={(patch) => { updateWorkout(w.id, patch); setEditing(null) }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    {/* The facts a row could not hold. Pace only when both
                        halves of it were logged — `pace()` returns '' rather
                        than a made-up number, and a blank row is not a fact. */}
                    <DefList rows={[
                      ['When', prettyDay(w.date)],
                      ...(speed ? [['Pace', speed] as [string, string]] : []),
                      ...(w.rpe != null ? [['Effort', `RPE ${w.rpe}`] as [string, string]] : []),
                      ...(w.calories != null ? [['Burned', `${w.calories} kcal`] as [string, string]] : []),
                    ]} />
                    {w.notes && <p className="mt-2 border-t border-line pt-2 text-label italic text-fg-2">“{w.notes}”</p>}
                  </>
                )}
              </PanelCard>
            )
          })}
        </PanelGrid>
      )}

      {/* THE WEEKLY TARGET LIVES HERE, and until now it lived NOWHERE.
          `fitnessGoalMin` is read by this page's headline fact, by
          `lib/coach.ts` and by Goals, and no control for it existed anywhere in
          the app — a 150-minute default governing the one zone-1 fact with a
          denominator. Under the sessions it counts is where you are standing
          when you decide whether 150 was the right number. */}
      <label className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-label text-fg-2">
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
    </>
  )
}

/**
 * The inline editor: the logging form, in the card, for one session.
 *
 * `ActivityForm` rather than a second set of fields, for the reason
 * `SessionEditor` gives on Home Workout — an editor that writes a different
 * shape from the logger is how a corrected session keeps reporting its old
 * numbers. `workoutOf` rewrites every stored field, including the `distanceKm`
 * conversion, so a 5-mile run edited to 6 is 9.66km in the journal and not 6.
 */
function SessionEdit({ workout, unit, onSave, onCancel }: {
  workout: Workout
  unit: DistanceUnit
  onSave: (patch: Omit<Workout, 'id'>) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(() => draftOf(workout, unit))
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))
  return (
    <div className="mt-2 space-y-3 border-t border-line pt-3">
      <ActivityForm
        // The SESSION's mode, not the page's: a push day logged last year must
        // stay correctable as a push day rather than being reclassified by
        // whichever toggle happens to be selected.
        mode={modeOf(draft.activity)}
        heading="Edit this session"
        draft={draft}
        onChange={patch}
        onSubmit={() => onSave(workoutOf(draft, unit))}
        unit={unit}
        submitLabel="Save changes"
      />
      <Button variant="secondary" onClick={onCancel} className="w-full">Cancel</Button>
    </div>
  )
}
