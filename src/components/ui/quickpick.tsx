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
 *  are spelled out rather than built from a template. */
const ON_TONE = {
  brand: 'border-brand bg-brand-wash font-medium text-brand-text',
  teal: 'border-teal bg-teal/15 font-medium text-teal',
  peach: 'border-peach bg-peach/15 font-medium text-peach',
} as const
const HOVER_TONE = { brand: 'hover:border-brand/60', teal: 'hover:border-teal/60', peach: 'hover:border-peach/60' } as const

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
  multi = false,
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
  /** A non-brand accent, for groups that are not the page's primary choice. */
  tone?: 'brand' | 'teal' | 'peach'
  options: { value: T; label: ReactNode; hint?: string }[]
  /** One line under the row — what the choice means, not what to do. */
  hint?: ReactNode
  /** A typed escape hatch, or anything else, on the end of the row. */
  after?: ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 text-body text-fg-1">{label}</legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const on = multi ? (Array.isArray(value) && (value as readonly T[]).includes(o.value)) : value === o.value
          return (
            <button
              // `type="button"` is load-bearing: a bare <button> inside a form
              // is a submit button, and these sit inside logging forms.
              type="button"
              key={String(o.value)}
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              title={o.hint}
              className={cn(
                'rounded-pill border px-3 py-1.5 text-label transition-all duration-150',
                // The press is the feedback. `active:scale-95` reads as the
                // control accepting the tap on a touch screen, where there is
                // no hover to tell you anything.
                'active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
                on ? ON_TONE[tone] : `border-line-strong bg-ink-2 text-fg-2 hover:text-fg-1 ${HOVER_TONE[tone]}`,
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
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-label text-fg-3">{suffix}</span>
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
