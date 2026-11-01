import { asks, kindsFor, labelOf, MODE_COPY, optionsFor, type ActivityKey, type Mode } from '../../domain/activities'
import { Input, Textarea } from '../ui'
import { NumField } from './NumField'
import { Button } from '../ui/button'
import { ChipPick } from '../ui/quickpick'
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
  heading,
  right,
  day,
}: {
  mode: Mode
  draft: ActivityDraft
  onChange: (patch: Partial<ActivityDraft>) => void
  onSubmit: () => void
  unit: DistanceUnit
  submitLabel?: string
  /**
   * Overrides the mode's own heading.
   *
   * The default is `MODE_COPY[mode].formHeading` — "Log a cardio session" —
   * which is right for the act column and wrong everywhere this same form is
   * used to CORRECT a session that already exists. The history card's inline
   * editor passes "Edit this session"; nothing else passes anything, so the
   * mode copy stays the single source for the logging case.
   */
  heading?: React.ReactNode
  /** e.g. a "Repeat last" affordance beside the heading. */
  right?: React.ReactNode
  /**
   * The page's `DayStrip`, drawn under the heading IN PLACE OF the Date field
   * — one day, one picker. Fitness's log passes it; the history editor does
   * not, so moving a logged session to another day stays possible there.
   */
  day?: React.ReactNode
}) {
  const { activity } = draft
  const kinds = kindsFor(activity)
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-heading font-medium text-fg-1">
          {heading ?? MODE_COPY[mode].formHeading}
        </h2>
        {right}
      </div>
      {day}

      <label className="block text-body text-fg-1">
        Activity
        <select
          value={activity}
          // Changing the activity CLEARS the sub-activity, in the one place the
          // activity can change. Without it, picking Run · Intervals and then
          // switching to Yoga stores a yoga session whose sub-activity is
          // "Intervals" — a value the new activity does not offer, that the chip
          // row below cannot show as selected, and that nothing would ever
          // correct. The mode switch and the deep link both go through
          // `emptyDraft`, which starts at '', so this is the remaining door.
          onChange={(e) => onChange({ activity: e.target.value as ActivityKey, subActivity: '' })}
          className="mt-1 w-full rounded-control border border-ctl-ring bg-ink-2 px-3 py-2 text-body text-fg-1"
        >
          {/* `optionsFor`, not `activitiesForMode`: Pickleball, Pull-ups and
              Home workout each have a logger of their own and are not offered
              here (`OWN_PAGE`) — but one already logged stays editable, so the
              selected activity is always in the list. A controlled select whose
              value is absent renders as the first option, silently. */}
          {optionsFor(mode, activity).map(([key, a]) => (
            <option key={key} value={key}>{a.label}</option>
          ))}
        </select>
      </label>

      {/* The sub-activity. "Yoga, 45 min" described a restorative session and a
          power class identically; this is the field that tells them apart.
          Rendered only when the registry names kinds for this activity, so
          there is no condition here on an activity literal — same rule as the
          duration/distance/sets fields below.

          Pressing the selected chip clears it, like `RpeScale` above: a kind is
          optional, and a control you cannot un-answer turns a stray tap into a
          permanent wrong answer. */}
      {kinds.length > 0 && (
        <ChipPick
          // `${label} type`, not "What kind of {label}?" — which is what this
          // said until the rendered page was read back. `.toLowerCase()` turned
          // HIIT into "What kind of hiit?", and no casing rule saves the
          // sentence from "What kind of other?", because `other` is a label
          // that cannot be a noun in that frame. Appending a word needs neither
          // the activity's case changed nor the activity to read as a noun:
          // "Run type", "HIIT type", "Other type", "Home workout type".
          label={`${labelOf(activity)} type`}
          value={draft.subActivity}
          onChange={(k) => onChange({ subActivity: k === draft.subActivity ? '' : k })}
          options={kinds.map((k) => ({ value: k, label: k }))}
          hint="Optional. Tap again to clear."
        />
      )}

      {/* ── The three short facts, on one line ───────────────────────────
          "October 15th, 45 minutes, 5 miles" is a single statement about the
          session, and each half of it was getting a full row with a 380px box
          around a value you can read at a glance. That 380px cap exists so a
          TEXT input stops advertising more room than you need; applied to a
          date or to `5` it is the same mistake an order of magnitude worse.

          `flex-wrap` on the row rather than widths on the children, so a phone
          drops them back to a stack with no breakpoint deciding it — and
          because `Card` cannot wrap a cluster whose markup it does not own
          (CLAUDE.md's clipped-control trap). Each field keeps `min-w-0` so the
          row shrinks rather than overflowing.

          Date is asked unless the page's `DayStrip` (`day`) already did;
          duration and distance are per-activity. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {!day && <label className="block min-w-0 text-body text-fg-1">
          Date
          {/* A date is a fixed-width value — `dd/mm/yyyy` plus the picker glyph
              and nothing else will ever be typed here. 11rem fits it with the
              native control's own padding at every browser we render in. */}
          <Input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="mt-1 max-w-[11rem]"
          />
        </label>}

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
      </div>

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
