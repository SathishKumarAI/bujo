import { activitiesForMode, asks, labelOf, MODE_COPY, type ActivityKey, type Mode } from '../../domain/activities'
import { Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { Stepper } from '../fields/Stepper'
import { DisclosureRow } from './DisclosureRow'
import type { ActivityDraft } from './draft'
import type { DistanceUnit } from '../../lib/types'

const num = (s: string) => (s ? Number(s) : undefined)
const str = (v: number | undefined) => (v != null ? String(v) : '')

/**
 * Zone 2. The form derives every visible field from the activity registry.
 *
 * Which fields exist is `ACTIVITIES[activity].required`; there is no
 * conditional here on a mode literal, and that is the point. The class of bug
 * where Cardio rendered a strength "sets" box was not a missed `if` — it was
 * the absence of anywhere to put the right one. Changing the activity within a
 * mode re-renders the fields, so Pickleball drops distance and Run keeps it,
 * without this component knowing what either of them is.
 *
 * Optional fields — calories, RPE, notes — go behind the page's single
 * disclosure, at the bottom, never above the fold.
 *
 * The heading follows the mode: "Log a cardio session", not "Log a workout".
 * A form that will not tell you what it is about makes you read the fields to
 * find out.
 */
export function ActivityForm({
  mode,
  draft,
  onChange,
  onSubmit,
  unit,
  submitLabel = 'Log session',
  right,
}: {
  mode: Mode
  draft: ActivityDraft
  onChange: (patch: Partial<ActivityDraft>) => void
  onSubmit: () => void
  unit: DistanceUnit
  submitLabel?: string
  /** e.g. a "Repeat last" affordance beside the heading. */
  right?: React.ReactNode
}) {
  const { activity } = draft
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-heading font-medium text-fg-1">
          {MODE_COPY[mode].formHeading}
        </h2>
        {right}
      </div>

      <label className="block text-body text-fg-1">
        Activity
        <select
          value={activity}
          onChange={(e) => onChange({ activity: e.target.value as ActivityKey })}
          className="mt-1 w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1"
        >
          {activitiesForMode(mode).map(([key, a]) => (
            <option key={key} value={key}>{a.label}</option>
          ))}
        </select>
      </label>

      <label className="block text-body text-fg-1">
        Date
        <Input type="date" value={draft.date} onChange={(e) => onChange({ date: e.target.value })} className="mt-1" />
      </label>

      {asks(activity, 'durationMin') && (
        <Stepper
          label="Duration" suffix="min" step={5} min={0}
          value={num(draft.duration)} onChange={(v) => onChange({ duration: str(v) })}
          aria-label="Duration minutes"
        />
      )}

      {asks(activity, 'distanceKm') && (
        <Stepper
          label="Distance" suffix={unit} step={0.5} min={0}
          value={num(draft.distance)} onChange={(v) => onChange({ distance: str(v) })}
          aria-label={`Distance in ${unit}`}
        />
      )}

      {asks(activity, 'sets') && (
        <label className="block text-body text-fg-1">
          Sets
          {/* A real example value, not an instruction. "Enter your sets" tells
              you nothing about the format the field expects. */}
          <Textarea
            value={draft.sets}
            onChange={(e) => onChange({ sets: e.target.value })}
            placeholder={'Bench press 5x5 @ 60kg\nDip 3x8'}
            rows={3}
            className="mt-1"
          />
        </label>
      )}

      <DisclosureRow label="More">
        <Stepper
          label="Calories" suffix="kcal" step={50} min={0}
          value={num(draft.calories)} onChange={(v) => onChange({ calories: str(v) })}
          aria-label="Calories"
        />
        <Stepper
          label="RPE" step={1} min={1} max={10}
          value={num(draft.rpe)} onChange={(v) => onChange({ rpe: str(v) })}
          aria-label="Perceived exertion, 1 to 10"
        />
        <label className="block text-body text-fg-1">
          Notes
          <Textarea
            value={draft.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Legs felt heavy for the first mile"
            rows={2}
            className="mt-1"
          />
        </label>
      </DisclosureRow>

      {/* The page's one accent-filled control. */}
      <Button variant="secondary" onClick={onSubmit} className="press-3d w-full">
        {submitLabel}
      </Button>
      <p className="sr-only">Logging {labelOf(activity)}</p>
    </section>
  )
}
