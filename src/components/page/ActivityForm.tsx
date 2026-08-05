import { activitiesForMode, asks, labelOf, MODE_COPY, type ActivityKey, type Mode } from '../../domain/activities'
import { Input, Textarea } from '../ui'
import { NumField } from './NumField'
import { Button } from '../ui/button'
import { DisclosureRow } from './DisclosureRow'
import type { ActivityDraft } from './draft'
import type { DistanceUnit } from '../../lib/types'

const RPE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * RPE · a bounded 1–10 scale, so it renders as the ten values it actually has.
 *
 * A stepper made you press + eight times to say "8", and told you nothing about
 * where 8 sits on the scale. Pressing the selected value clears it: RPE is
 * optional, and a control you cannot un-answer turns a stray tap into a
 * permanent wrong number.
 */
function RpeScale({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="text-body text-fg-1">
        Effort <span className="text-label text-fg-2">· RPE 1–10</span>
      </legend>
      {/* `min-h-11` is the fix: these were 30px tall against a 44px floor.
          Measured after the change: **38 × 44**, not 44 × 44. The `max-w` here
          is not what binds — the act column is itself ~380px, so ten segments
          plus gaps cannot reach 44px wide inside it whatever this row asks for.
          Getting the width there too means widening the column or dropping to
          fewer, larger segments, which is a layout decision rather than a class.
          38 × 44 clears WCAG 2.5.8 (24px) comfortably and is the honest state:
          the height floor is met, the width floor is not.

          Not `control-max`: that 380px cap exists so a *text input* stops
          advertising more room than you need. A bounded ten-value scale is not
          a stranded caret, so it is capped separately and more loosely. */}
      <div className="mt-1 flex w-full max-w-[27.5rem] gap-0.5">
        {RPE.map((n) => {
          const on = value === String(n)
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`Effort ${n} of 10`}
              onClick={() => onChange(on ? '' : String(n))}
              className={`num min-h-11 min-w-0 flex-1 rounded-control border py-1.5 text-label transition-colors ${
                on ? 'border-mauve bg-secondary font-medium text-fg-1' : 'border-input text-fg-2 hover:text-fg-1'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

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
 * Effort and notes are fields; calories are what is left behind the page's
 * single disclosure, at the bottom, never above the fold. All three used to be
 * hidden together, which was one rule ("optional goes behind the fold")
 * applied to two different situations: nobody types their calorie burn, and
 * everybody remembers how the session felt for about an hour.
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
        <NumField
          label="Duration" suffix="min" step="1" placeholder="45"
          value={draft.duration} onChange={(duration) => onChange({ duration })}
        />
      )}

      {asks(activity, 'distanceKm') && (
        <NumField
          label="Distance" suffix={unit} step="0.1" placeholder="5"
          value={draft.distance} onChange={(distance) => onChange({ distance })}
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

      {/* Effort and how it felt are the two things you remember on the walk
          home and forget by tomorrow, so they are fields, not a fold. Calories
          are usually derived from a watch rather than typed, and stay behind
          the disclosure with whatever else earns its way in there. */}
      <RpeScale value={draft.rpe} onChange={(rpe) => onChange({ rpe })} />

      <label className="block text-body text-fg-1">
        How did it feel?
        <Textarea
          value={draft.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={MODE_COPY[mode].notesPlaceholder}
          rows={2}
          className="mt-1"
        />
      </label>

      <DisclosureRow label="More details">
        <NumField
          label="Calories" suffix="kcal" step="10" placeholder="450"
          value={draft.calories} onChange={(calories) => onChange({ calories })}
        />
      </DisclosureRow>

      {/* The page's one accent-filled control. */}
      <Button variant="secondary" onClick={onSubmit} className="press-3d w-full">
        {submitLabel}
      </Button>
      <p className="sr-only">Logging {labelOf(activity)}</p>
    </section>
  )
}
