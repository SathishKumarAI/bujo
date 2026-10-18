import type { ReactNode } from 'react'
import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { cn } from '../../lib/cn'

/**
 * TAP INSTEAD OF TYPE · the two controls a logging form actually wants.
 *
 * Every log form in this app asks for numbers with an empty `<input>`. On a
 * phone that is a numeric keyboard per field, and the values are not arbitrary
 * — rounds are 2/3/4/5, effort is easy/hard, a session is 10/20/30 minutes.
 * A free-text box for a value with four likely answers is the most expensive
 * control on the page and it is the default here.
 *
 * Both of these keep a typed escape hatch. The point is not to remove typing,
 * it is to stop *requiring* it for the common case — someone who logs the same
 * session every week should not re-key it every week.
 *
 * **A value of 0 is a real answer.** Both components carry `undefined` for "not
 * said" and pass `0` through untouched, because `Number(x) || 0` is how a
 * legitimate zero becomes a default elsewhere in this codebase.
 */

/** Selected-chip styling per tone. Tailwind needs whole class names, so these
 *  are spelled out rather than built from a template.
 *
 *  `green`/`yellow`/`red` exist for a RAMP — a row whose options are ordered by
 *  severity, where the colour is the ordering and not decoration (effort:
 *  easy → max). Measured as rendered, selected, at `?view=pullups`: see the
 *  table in `views/Pullups.tsx` `EFFORT`. Do not reach for one of these to make
 *  a single chip louder; a row where every chip is a different colour for no
 *  reason is the six-colour stats row DESIGN.md argues against. */
/*
  THE TEXT ON A WASH IS NEUTRAL, and `brand` is the only exception.

  `brand-wash`/`brand-text` is a solved PAIR — two tokens picked together per
  theme. No other accent has one (grep `--color-.*-\(wash\|text\)` in
  `index.css`: brand and nothing else), so `text-teal on bg-teal/15` is the
  accent-on-wash idiom applied without the calibration that makes it work. In
  a light theme the accents are solved to about 4.6 against the PAGE ground,
  and a 15% wash of the accent moves that ground toward the text, which spends
  the whole margin. Measured on the rendered chips, selected, composited over
  the first opaque ancestor:

  | theme | easy green | med yellow | hard peach | max red |
  |---|---|---|---|---|
  | latte  | 4.25 | 3.64 | 4.33 | 4.40 |
  | dawn   | 4.54 | 3.81 | 4.59 | 4.70 |
  | mocha  | 14.12 | 16.52 | 11.86 | 9.06 |

  Seven of the ten light-theme readings are under 4.5 and the worst is 3.64.
  Neither gate can see it: `check-contrast` reads token values and a token over
  a wash of itself is not a token, and axe needs a resolvable background, which
  a translucent fill over a translucent card is not. This is the fourth entry
  of this shape in CLAUDE.md — fix the GROUND or the foreground, never bleach
  the accent — and the cheap correct answer is to stop using the accent as
  text: the colour still carries the ramp through the border and the fill.

  This also fixes `teal` and `peach`, which shipped with accent text and the
  same arithmetic, at every call site they have.
*/
const ON_TONE = {
  brand: 'border-brand bg-brand-wash font-medium text-brand-text',
  teal: 'border-teal bg-teal/15 font-medium text-fg-1',
  peach: 'border-peach bg-peach/15 font-medium text-fg-1',
  green: 'border-green bg-green/15 font-medium text-fg-1',
  yellow: 'border-yellow bg-yellow/15 font-medium text-fg-1',
  red: 'border-red bg-red/15 font-medium text-fg-1',
  /* `mauve` and `maroon` are here for Cycle's flag row, where the hue is the
     flag's IDENTITY across four surfaces (the chips, the day-list dots, the
     symptom rows, the chart's period shading) rather than a decoration. The
     row was hand-rolled with inline `cat()` fills precisely because these two
     were missing — which is the "needing a variant later means the primitive
     under-abstracted" case, answered in the primitive. */
  mauve: 'border-mauve bg-mauve/15 font-medium text-fg-1',
  maroon: 'border-maroon bg-maroon/15 font-medium text-fg-1',
} as const
/*
  AT REST, a ramp option keeps its colour in the BORDER.

  A row whose colour only appears once something is selected is a row whose
  ordering you cannot see until you have already chosen — and effort is ordered
  (easy → max), which is the whole reason it has tones. Border rather than text
  or fill: a border is a non-text graphic, so it answers to the 3:1 floor
  instead of 4.5, and that is the one place a 15% accent can be spent in a
  light theme without the arithmetic in `ON_TONE` above. Measured against the
  chip's own `bg-ink-2`, unselected, across the five themes: see the probe
  table in the PR.

  ── AND THE UNTONED ONE IS THE DEFAULT, so it has to be visible ──────────

  `brand` is what a row with no per-option tone falls back to — which is most
  rows in the app — and it was `border-line-strong`, measured at **1.02–1.64**
  against the card across the five themes. The fill does not rescue it:
  `bg-ink-2` is **1.11–1.36** against the same ground. So the resting chip was
  a control with neither a visible edge nor a visible fill, carried entirely
  by its text — which is what the report *"these are looking quite bad… like a
  mere pair made by an undergrad"* was about, one card over from the flag row
  that passes tones per option and measures **2.61**.

  `fg-3/60` rather than another surface step, because a surface is by
  construction within a step or two of the fill — `line-strong` IS
  `surface2`, which is how it ended up at 1.02. The quietest *foreground*,
  held back to 60%, is the first neutral above that family. The target is not
  a floor but the row six inches away: a boundary answers to the 3:1 graphic
  floor rather than 4.5, and the toned chips that look right measure
  **2.61–3.11**. After: **2.51 (latte) · 2.77 (dawn) · 3.05 (neon) · 3.12
  (vscode) · 3.20 (mocha)** — the same band, which is the whole claim. 60%
  was the first value tried and it landed there; a sweep of the alternatives
  was not run.
*/
const REST_TONE = {
  brand: 'border-fg-3/60',
  teal: 'border-teal/50',
  peach: 'border-peach/50',
  green: 'border-green/50',
  yellow: 'border-yellow/50',
  red: 'border-red/50',
  mauve: 'border-mauve/50',
  maroon: 'border-maroon/50',
} as const

const HOVER_TONE = {
  brand: 'hover:border-brand/60',
  teal: 'hover:border-teal/60',
  peach: 'hover:border-peach/60',
  green: 'hover:border-green/60',
  yellow: 'hover:border-yellow/60',
  red: 'hover:border-red/60',
  mauve: 'hover:border-mauve/60',
  maroon: 'hover:border-maroon/60',
} as const

export type ChipTone = keyof typeof ON_TONE

/**
 * A row of preset values, plus whatever else the caller wants on the end.
 *
 * `value` is compared with `===`, so pass the same type the options carry.
 * `null` as a value means "nothing chosen" and lights nothing.
 */
export function ChipPick<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
  after,
  className,
  tone = 'brand',
  dense = false,
  multi = false,
  action = false,
  scale,
}: {
  /** Rendered as a real `<legend>`, so the group is named for a screen reader. */
  label: string
  /** One value, or the selected set when `multi`. */
  value: T | null | undefined | readonly T[]
  onChange: (v: T) => void
  /**
   * Several answers can be true at once — a HALT check is hungry AND tired,
   * not one of them. `aria-pressed` already says "toggle", so the only thing
   * that changes is which chips read as on.
   */
  multi?: boolean
  /**
   * The row performs an action per chip instead of holding a selection — no
   * `aria-pressed`, and `value` is ignored. Pass `null` as the value.
   */
  action?: boolean
  /** A non-brand accent, for groups that are not the page's primary choice. */
  tone?: ChipTone
  /**
   * Tighter padding, for a row that has to fit a narrow column on one line.
   *
   * Exists because the alternative is a call site passing `className` and
   * re-deciding the chip's geometry, which is how two rows of the same control
   * come to disagree. Measured on the pull-up log form, whose Effort and
   * Duration rows share a 424px act column split in two: at the default
   * `px-3` the four effort chips are 227px against a 204px half and wrap;
   * dense they are 193px and do not.
   */
  dense?: boolean
  /**
   * `tone` per option overrides the group's, for a row whose colour IS the
   * ordering — effort easy → max. Unset everywhere else, which is the common
   * case and stays one accent.
   */
  options: { value: T; label: ReactNode; hint?: string; tone?: ChipTone; name?: string }[]
  /**
   * RENDER AN ORDERED RATING AS A SEGMENTED TRACK, with these endpoint words.
   *
   * A 1–5 rating drawn as five separate pills is five peers, and five peers
   * is what a TAG row looks like — on Cycle's field panel, `Mood` sat four
   * pixels above `Mood tags` and the numbers 1–5 had exactly the weight and
   * shape of `calm` / `happy` / `energetic`. One of those is an ordered scale
   * and the other is a set, and nothing on screen said so.
   *
   * A segment track says it three ways at once: the options are joined rather
   * than spaced, they divide the width equally rather than sizing to their
   * labels, and the ends are named. Reported as the field panel looking like
   * "a just created website"; this is the half of that which was a control
   * doing an impression of a different control.
   *
   * Presence is the switch, because an endpoint pair is the one thing a scale
   * has that a chip row does not — there is no way to turn this on and have
   * nothing sensible to put in it.
   *
   * NOT for `multi` (a set has no ends) and not for `action` (there is
   * nothing to be at the end of). Both are ignored here rather than silently
   * producing a control that lies about itself.
   *
   * `words` names what the CHOSEN value means, beside the group's label —
   * "Mood 3 · steady". Asked for as *"if I scroll to three, you should say
   * you're energetic"*: a number on a 1–5 scale is a rank with no meaning
   * until something says what the rank is, and the endpoints only define the
   * two ends. One word per option, in option order, or omit it.
   *
   * It names only the SELECTED value, not all five at once — five words
   * across a 384px track is the wrapped, unreadable row the track replaced.
   */
  scale?: { low: string; high: string; words?: string[] }
  /** One line under the row — what the choice means, not what to do. */
  hint?: ReactNode
  /** A typed escape hatch, or anything else, on the end of the row. */
  after?: ReactNode
  className?: string
}) {
  if (scale && !multi && !action) {
    const picked = options.findIndex((o) => o.value === value)
    const chosenWord = picked >= 0 ? scale.words?.[picked] : undefined
    return (
      <fieldset className={cn('min-w-0', className)}>
        {/* THE LABEL IS A CAPTION, NOT A HEADING.
            It was `text-body text-fg-1` — **15px at full strength over chips
            that are 13px at `fg-2`** — so in every logging form in the app the
            question outweighed the controls that answer it. Stacked ten deep
            in Cycle's optional panel that is a column of headings with
            something quiet underneath each, which is what reads as a form from
            fifteen years ago. `text-label font-medium` keeps it unmistakably a
            label and stops it being the loudest thing in its own group: in a
            form the CONTROL is the content. */}
        <legend className="mb-1.5 flex w-full items-baseline gap-2 text-label font-medium text-fg-1">
          <span>{label}</span>
          {/* THE WORD FOR THE VALUE YOU PICKED. A rank means nothing on its
              own, and the endpoints define only the ends — "3" on a 1–5 is
              the value a reader is least able to name. Absent until something
              is chosen, because a scale with no answer has nothing to say. */}
          {chosenWord && (
            <span className="ml-auto text-label text-fg-2">
              <span className="num text-fg-1">{String(value)}</span> · {chosenWord}
            </span>
          )}
        </legend>
        {/*
          ONE TRACK, not five pills.

          `divide-x` rather than a gap, so the segments read as one control
          that has been divided — which is what an ordered scale is. `flex-1`
          on every segment, so the width is split evenly and the track is as
          wide as the column: a scale that sizes to its labels implies the
          labels differ in weight, and 1–5 do not.

          The press target stays at the 44px floor through `py-2` plus the
          text line, which is what the hand-rolled drive row was using
          `min-w-11` to guarantee before it came here.
        */}
        <div className="flex w-full overflow-hidden rounded-control border border-line-strong divide-x divide-line">
          {options.map((o) => {
            const on = value === o.value
            const t = o.tone ?? tone
            const drawn = typeof o.label === 'string' ? o.label : ''
            const spoken = o.name && drawn && !o.name.toLowerCase().includes(drawn.toLowerCase())
              ? `${drawn} — ${o.name}`
              : o.name
            return (
              <button
                type="button"
                key={String(o.value)}
                onClick={() => onChange(o.value)}
                aria-pressed={on}
                title={o.hint}
                aria-label={spoken}
                className={cn(
                  /* `min-h-11` is the 44px target floor COD-96 is open
                     about, and the hand-rolled drive row this replaces used
                     `min-w-11` to hit it one dimension at a time. A segment
                     is as wide as a fifth of the column, so height is the one
                     that needs saying. */
                  'num min-h-11 flex-1 py-2 text-center text-label duration-150',
                  'transition-[color,background-color,box-shadow]',
                  // No `active:scale-95` here: a segment is part of a track,
                  // and shrinking one of five joined cells tears the row. The
                  // fill arriving IS the feedback.
                  'motion-reduce:transition-none',
                  on ? ON_TONE[t] : 'bg-ink-2 text-fg-2 hover:bg-ink-3 hover:text-fg-1',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {/* THE ENDS ARE NAMED, under the track they describe. They used to
            live inside the legend — "Mood · 1 low … 5 great" — where they
            made the group's name a sentence and still did not say which end
            was which. */}
        <div className="mt-1 flex justify-between text-micro text-fg-2">
          <span>{scale.low}</span>
          <span>{scale.high}</span>
        </div>
        {hint && <p className="mt-1.5 text-label text-fg-2">{hint}</p>}
        {after}
      </fieldset>
    )
  }

  return (
    <fieldset className={cn('min-w-0', className)}>
      {/* A caption, not a heading — see the scale variant's legend above. */}
      <legend className="mb-1.5 text-label font-medium text-fg-1">{label}</legend>
      <div className={cn('flex flex-wrap items-center', dense ? 'gap-1' : 'gap-1.5')}>
        {options.map((o) => {
          const on = multi ? (Array.isArray(value) && (value as readonly T[]).includes(o.value)) : value === o.value
          const t = o.tone ?? tone
          /*
            DRAW SHORT, ANNOUNCE LONG — but the long one has to CONTAIN the
            short one.

            `label-content-name-mismatch` (WCAG 2.5.3) compares the accessible
            name against the painted text: a chip drawing `Mod` and named
            `Moderate` fails it, because a speech-input user says "click Mod"
            and nothing answers. Announcing MORE is fine; announcing something
            ELSE is not. So when a `name` does not already contain the drawn
            label, the label is prefixed rather than replaced — which keeps the
            whole point of the prop (a bare `20` is meaningless read aloud) and
            makes the chip reachable by what it shows.

            Only a string label can be checked. A `ReactNode` label (the food
            chips draw bars, a name and a number) names itself from its own
            content, including the `sr-only` text inside it.
          */
          const drawn = typeof o.label === 'string' ? o.label : ''
          const spoken = o.name && drawn && !o.name.toLowerCase().includes(drawn.toLowerCase())
            ? `${drawn} — ${o.name}`
            : o.name
          return (
            <button
              // `type="button"` is load-bearing: a bare <button> inside a form
              // is a submit button, and these sit inside logging forms.
              type="button"
              key={String(o.value)}
              onClick={() => onChange(o.value)}
              // `aria-pressed` is a LIE on an action row. Nutrition's food
              // chips each add a serving to the day and then leave nothing
              // selected behind — a screen reader told "not pressed" about a
              // button that has no pressed state is being told about a toggle
              // that does not exist. `action` drops the attribute rather than
              // reporting a state the row does not have.
              aria-pressed={action ? undefined : on}
              title={o.hint}
              /* A shortened label is a shortened *name* unless it is said
                 somewhere. `Med` and a bare `20` are legible on screen beside
                 their legend and meaningless read aloud on their own. */
              aria-label={spoken}
              className={cn(
                /*
                  `transition-all` ANIMATED THE LAYOUT, not just the colours.

                  Reported as "the animations are not looking good", on the
                  food picker — where a search re-renders the row on every
                  keystroke, so each chip animated its own width and padding
                  toward the next set of labels. That reads as wobbling, and it
                  is the kind of motion nobody can name but everybody notices.

                  The properties that SHOULD move are the colours and the press
                  (`active:scale-95` below needs `transform`). Width is not one
                  of them: a chip is as wide as its label and should arrive that
                  way. Measured on the rendered page — `transitionProperty` read
                  `all` on every chip in the app.
                */
                'rounded-pill border text-label duration-150',
                'transition-[color,background-color,border-color,box-shadow,transform]',
                dense ? 'px-2 py-1' : 'px-3 py-1.5',
                // The press is the feedback. `active:scale-95` reads as the
                // control accepting the tap on a touch screen, where there is
                // no hover to tell you anything.
                'active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
                on
                  ? ON_TONE[t]
                  // The rest border is the OPTION's tone only — a group tone
                  // colours the selection, not every chip in the row.
                  //
                  // `REST_TONE[o.tone ?? 'brand']`, not a literal beside the
                  // map. It WAS `o.tone ? REST_TONE[o.tone] : 'border-line-strong'`
                  // — so `REST_TONE.brand` sat in the table, read by nothing,
                  // holding the same string the ternary hardcoded. Editing the
                  // map to fix the untoned chip's invisible boundary therefore
                  // changed the emitted CSS and not one pixel on screen, which
                  // is the quietest possible version of a dead field: the
                  // value is right there, one line above its own duplicate.
                  : `${REST_TONE[o.tone ?? 'brand']} bg-ink-2 text-fg-2 hover:text-fg-1 ${HOVER_TONE[t]}`,
              )}
            >
              {o.label}
            </button>
          )
        })}
        {after}
      </div>
      {hint && <p className="mt-1.5 text-label text-fg-2">{hint}</p>}
    </fieldset>
  )
}

/**
 * − N + · for a number you nudge rather than pick from a list.
 *
 * The readout is the input, so a big jump is still one tap away — typing 47 is
 * not forty-two presses. `min`/`max` clamp both the buttons and the typed
 * value, and the buttons disable at the ends rather than silently doing
 * nothing, which is the difference between "I have reached the limit" and "the
 * app is broken".
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  hint,
  placeholder,
  className,
}: {
  label: string
  /** `undefined` is "not said" — it is not 0. */
  value: number | undefined
  onChange: (v: number | undefined) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  hint?: ReactNode
  /** Shown when the value is `undefined` — usually the figure that will be
   *  used if the field is left alone. */
  placeholder?: string
  className?: string
}) {
  const id = `step-${label.replace(/\W+/g, '-').toLowerCase()}`
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  // NOT `value ?? Number(placeholder) ?? min`. `Number(undefined)` is **NaN**,
  // which is not nullish — so the `?? min` never ran, and a Stepper with no
  // placeholder started at NaN: both buttons would write NaN and the field
  // would go blank on the first tap. eslint's `no-constant-binary-expression`
  // caught it before it shipped.
  const fromPlaceholder = placeholder ? Number(placeholder) : NaN
  const current = value ?? (Number.isFinite(fromPlaceholder) ? fromPlaceholder : min)
  const atMin = value !== undefined && value <= min
  const atMax = value !== undefined && value >= max

  const nudge = (by: number) => onChange(clamp(Math.round((current + by) * 100) / 100))

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-body text-fg-1">{label}</label>
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={() => nudge(-step)}
          disabled={atMin}
          aria-label={`Decrease ${label}`}
          className="grid w-10 shrink-0 place-items-center rounded-control border border-line-strong bg-ink-2 text-fg-1 transition-colors hover:border-brand/60 hover:text-brand-text disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:text-fg-1"
        >
          <Icon as={Minus} size="sm" />
        </button>
        <span className="relative min-w-0 flex-1">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => {
              const raw = e.target.value
              // An empty box is "not said", not zero. Typing "0" keeps 0.
              if (raw === '') return onChange(undefined)
              const n = Number(raw)
              onChange(Number.isFinite(n) ? clamp(n) : undefined)
            }}
            className="w-full rounded-control border border-ctl-ring bg-ink-2 px-2 py-2 text-center text-body tabular-nums text-fg-1 placeholder:text-fg-3 focus-visible:border-ring focus-visible:outline-none"
          />
          {suffix && (
            /* `text-fg-2`, not `fg-3`. On `bg-ink-2` the quieter step measured
               **4.18:1 on mocha and 4.49 on latte** at 13px — under the floor
               in four of the five themes, and `aria-hidden` does not excuse it
               because it is still read by eyes. Caught by `npm run a11y`,
               which is exactly the class of bug the two rendering gates
               cannot see. */
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-label text-fg-2">{suffix}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => nudge(step)}
          disabled={atMax}
          aria-label={`Increase ${label}`}
          className="grid w-10 shrink-0 place-items-center rounded-control border border-line-strong bg-ink-2 text-fg-1 transition-colors hover:border-brand/60 hover:text-brand-text disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:text-fg-1"
        >
          <Icon as={Plus} size="sm" />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-label text-fg-2">{hint}</p>}
    </div>
  )
}

/**
 * Today / Yesterday / pick one — for a date that is almost always today.
 *
 * A `<input type="date">` is three interactions (open, navigate, choose) for a
 * value that is "today" the overwhelming majority of the time, and "yesterday"
 * most of the rest. The picker stays for the real cases, one tap behind.
 */
export function DayPick({
  value,
  onChange,
  today,
  yesterday,
}: {
  value: string
  onChange: (d: string) => void
  today: string
  yesterday: string
}) {
  const known = value === today || value === yesterday
  return (
    <ChipPick
      label="Date"
      value={known ? value : null}
      onChange={onChange}
      options={[
        { value: today, label: 'Today' },
        { value: yesterday, label: 'Yesterday' },
      ]}
      after={
        <input
          type="date"
          value={value}
          aria-label="Another date"
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className={cn(
            'rounded-pill border px-3 py-1.5 text-label transition-colors',
            known
              ? 'border-line-strong bg-ink-2 text-fg-2 hover:border-brand/60 hover:text-fg-1'
              : 'border-brand bg-brand-wash text-brand-text',
          )}
        />
      }
    />
  )
}
