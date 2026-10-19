import type { ReactNode } from 'react'
import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { cn } from '../../lib/cn'
import { cat, onAccent } from '../../lib/colors'

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
/*
  SELECTED IS A FILL NOW, not a 15% wash of the accent.

  The wash was the idiom and it never worked outside a dark theme: measured on
  these very chips, composited over the first opaque ancestor, **seven of ten
  light-theme readings sat under 4.5 and the worst was 3.64**. The fix at the
  time moved the TEXT to `fg-1` and left the colour in the border and the wash
  — correct, and it left a selected chip reading as a slightly tinted
  unselected one. On a phone, in the dark, at arm's length, that is not a
  state; it is a rumour.

  A fill is unambiguous, and it is the only version where the hue the flag
  carries everywhere else (the calendar cell, the chart shading, the symptom
  row) is actually present at strength in the control.

  The TEXT on that fill is computed, not classed. `onAccent()` parses the
  accent and picks whichever of the theme's two neutrals clears 4.6 against
  it — there is no `--color-on-teal` to write, and hand-solving 7 accents × 5
  themes is 35 values nobody will keep in step. `brand` is the exception
  because it already HAS a solved pair (`--color-brand-ink` is the theme's
  crust, which is near-white on latte's purple and near-black on mocha's
  mauve) and a solved pair beats a computed one.
*/
const ON_TONE = {
  brand: 'border-transparent bg-brand font-semibold text-brand-ink',
  teal: 'border-transparent bg-teal font-semibold',
  peach: 'border-transparent bg-peach font-semibold',
  green: 'border-transparent bg-green font-semibold',
  yellow: 'border-transparent bg-yellow font-semibold',
  red: 'border-transparent bg-red font-semibold',
  /* `mauve` and `maroon` are here for Cycle's flag row, where the hue is the
     flag's IDENTITY across four surfaces (the chips, the day-list dots, the
     symptom rows, the chart's period shading) rather than a decoration. The
     row was hand-rolled with inline `cat()` fills precisely because these two
     were missing — which is the "needing a variant later means the primitive
     under-abstracted" case, answered in the primitive. */
  mauve: 'border-transparent bg-mauve font-semibold',
  maroon: 'border-transparent bg-maroon font-semibold',
} as const

/** The palette key a tone paints with. `brand` is a CSS token rather than a
 *  palette entry, so it resolves to the accent it is built from — `cat()`
 *  would otherwise fall back to mauve silently and by luck be right. */
const railTone = (t: ChipTone): string => (t === 'brand' ? 'mauve' : t)

/** The neutral that clears 4.6 on a tone's fill, per theme. `brand` carries
 *  its own solved pair in CSS and takes no inline colour. */
const onFill = (t: ChipTone) => (t === 'brand' ? undefined : { color: onAccent(cat(t)) })
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
  brand: 'border-edge',
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
  info,
  tone = 'brand',
  dense = false,
  multi = false,
  action = false,
  scale,
}: {
  /** Rendered as a real `<legend>`, so the group is named for a screen reader. */
  label: string
  /**
   * A marker beside the label — in practice an `InfoTip`.
   *
   * It is a slot rather than a `help` string because this primitive has no
   * business knowing about a glossary: Cycle's tips come from
   * `lib/cycleHelp.ts` and another page's would not. The caller passes the
   * node; the legend just makes room for it.
   */
  info?: ReactNode
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
          <span>{label}{info}</span>
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
          A RAIL, not five boxed cells.

          It was a bordered track divided into five filled segments — one
          control, correctly, but a control that looks the same whether the
          scale runs 1→5 or dry→egg-white, and the same whether you have
          answered it or not. Three things change:

          **The rail shows the scale.** A thin notched bar with the choice
          sitting ON it reads as a position along a run. That matters most
          where the run is the data: cervical mucus goes dry → egg-white and
          the progression IS the fertile ramp, which five identical cells hid
          completely.

          **Nothing chosen draws an EMPTY rail.** Five filled cells with none
          lit reads as a control waiting to be found; an empty rail reads as a
          question you have not answered — and this app has to keep "not
          answered" and "answered 1" apart, because a 1 and a skipped day must
          never average together (`lib/cycleInsights.ts` returns `null` rather
          than a fake zero for the same reason).

          **The stops are the labels.** A named scale puts its words under
          its own notches instead of needing a separate row for the ends, so
          `flow`, `mucus` and `lh` can stop being chip rows.

          The 44px target floor is kept on the STOPS (`min-h-11`), which are
          the thing you press — the rail itself is 6px and is a drawing.
        */}
        <div className="relative h-1.5 overflow-hidden rounded-pill border border-line bg-ink-2">
          {/* The notches, so the number of steps is visible before you answer. */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
            {options.map((o, i) => (
              <span key={String(o.value)} className={i < options.length - 1 ? 'border-r border-line' : ''} />
            ))}
          </div>
          {picked >= 0 && (
            <span
              className="absolute inset-y-0 rounded-pill"
              style={{
                width: `calc(100% / ${options.length})`,
                left: `calc(100% / ${options.length} * ${picked})`,
                /* `railTone` and not an inline ternary. `a ?? b ? c : d` parses
                   as `(a ?? b) ? c : d`, so the obvious one-liner
                   (`o.tone ?? tone === 'brand' ? 'mauve' : tone`) resolves
                   every TONED rail to mauve — a precedence bug that paints a
                   plausible colour and so cannot be caught by a type or a
                   gate, which is the family CLAUDE.md records as `cat()`
                   returning mauve for a name it does not know. */
                background: cat(railTone(options[picked].tone ?? tone)),
              }}
            />
          )}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
          {options.map((o) => {
            const on = value === o.value
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
                  /* `hyphens-none` and a non-breaking space are not enough:
                     `egg-white` breaks at its own hyphen and takes two lines,
                     which makes one stop taller than its four neighbours and
                     tilts the whole row. `whitespace-nowrap` with the stop
                     allowed to overflow its track is the honest trade — the
                     word stays one word, and the grid stays level. */
                  'min-h-11 whitespace-nowrap px-0.5 pt-1 text-center text-micro leading-tight duration-150',
                  'transition-colors motion-reduce:transition-none',
                  // `num` only for a numeric stop: a word stop in a mono face
                  // is a word pretending to be a figure.
                  typeof o.value === 'number' && 'num text-label',
                  on ? 'font-semibold text-fg-1' : 'text-fg-2 hover:text-fg-1',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {/* THE ENDS ARE NAMED, under the track they describe — but only for a
            NUMERIC scale. A named one (dry → egg-white) has its words on its
            own stops already, and repeating the first and last underneath is
            the same fact twice. */}
        {typeof options[0]?.value === 'number' && (
          /* `fg-2`, NOT `fg-3`. These are words a reader reads, so they
             answer to 4.5 — and `fg-3` at 10px measured **3.78 (neon) · 3.81
             (vscode) · 3.88 (mocha) · 4.49 (latte)** on the card, caught by
             `npm run a11y` as six serious violations. `fg-3` is the tier for
             chrome, and an endpoint label is not chrome: it is the half that
             tells you which end of the scale is which. Reaching for the
             quietest step by default is a trap this repo already has an entry
             for; this is it, one step down. */
          <div className="mt-0.5 flex justify-between text-micro text-fg-2">
            <span>{scale.low}</span>
            <span>{scale.high}</span>
          </div>
        )}
        {hint && <p className="mt-1.5 text-label text-fg-2">{hint}</p>}
        {after}
      </fieldset>
    )
  }

  return (
    <fieldset className={cn('min-w-0', className)}>
      {/* A caption, not a heading — see the scale variant's legend above. */}
      <legend className="mb-1.5 text-label font-medium text-fg-1">{label}{info}</legend>
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
              style={on ? onFill(t) : undefined}
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
                'rounded-control border text-label duration-150',
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

/**
 * ONE THING THAT IS EITHER TRUE OR NOT.
 *
 * WHAT THIS OWNS: the only control in the app whose answer is a boolean and
 * whose meaning is a *setting* rather than a record of the day.
 * WHAT IT DOES NOT OWN: anything with three states. A tri-state question is a
 * `ChipPick`, because "not said" has to be reachable and a switch cannot hold
 * it — a switch that is off is off, not unanswered.
 *
 * It exists because `tempDisturbed` shipped as a bare `<input type="checkbox">`
 * at the bottom of eleven chip groups — the one control on Cycle's day panel
 * that changes a *calculation* (the reading is dropped from ovulation
 * detection), drawn as the smallest and least considered thing on the card.
 * A switch is the one shape in this vocabulary that reads as "this changes how
 * the app behaves", which is exactly what it does.
 *
 * The native input stays, visually hidden, so the label, the keyboard and the
 * accessibility tree are the platform's rather than re-implemented here.
 */
export function Switch({ checked, onChange, label, hint, tone = 'peach' }: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  /** One line under the label — what turning it on *does*. */
  hint?: ReactNode
  tone?: ChipTone
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      {/* `peer-focus-visible` and not a focus ring on the label: the input is
          what takes focus, and a sighted keyboard user has to see WHICH
          control they are on, not that the row contains one. */}
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-pill border p-0.5 duration-150',
          'transition-[background-color,border-color] motion-reduce:transition-none',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
          checked ? 'border-transparent justify-end' : 'border-edge bg-ink-2 justify-start',
        )}
        style={checked ? { background: cat(railTone(tone)) } : undefined}
      >
        <span
          className="block size-3.5 rounded-pill duration-150 transition-colors motion-reduce:transition-none"
          style={{ background: checked ? onAccent(cat(railTone(tone))) : cat('overlay1') }}
        />
      </span>
      <span className="text-label text-fg-2">
        <span className="font-medium text-fg-1">{label}</span>
        {hint && <> — {hint}</>}
      </span>
    </label>
  )
}
