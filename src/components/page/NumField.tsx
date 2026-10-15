import { Input } from '../ui'

/**
 * A number with its unit, typed rather than nudged.
 *
 * This replaced a `Stepper` (`− [input] +`) on duration, distance and calories.
 * A stepper is the right control for a small bounded count you adjust by one;
 * it is the wrong one for "42 minutes", where the ± buttons are two extra
 * targets around the field you were always going to type into, and reaching 42
 * from 0 in steps of 5 is nine taps. The unit lives inside the field so the
 * label does not have to say it twice.
 *
 * ── A field is as wide as what you type in it ───────────────────────
 *
 * These carried `control-max`, the 380px cap. That number exists so a *text*
 * input stops advertising more room than you need — a 700px text box is a
 * stranded caret. Applied to a field holding `5`, it is the same mistake an
 * order of magnitude worse: a 380px box for one digit says "write me an
 * essay" about your distance.
 *
 * Reported exactly that way: *"why taking that much width for 5 miles?"*
 *
 * `--field-num` is 9rem — wide enough for `1234.5` plus the unit suffix at
 * this type size, which covers every value these fields take (minutes in a
 * day, kilometres in an ultra, calories in a day). `wide` is the escape hatch
 * for a number that genuinely runs long, and nothing uses it yet; if a field
 * needs it, that is a signal the value is not really a number.
 *
 * The cap is `max-width`, not `width`, so on a phone the field still shrinks
 * to the column rather than overflowing it.
 */
export function NumField({
  label, value, onChange, suffix, step, placeholder, wide = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix: string
  step?: string
  placeholder?: string
  /** Opt out of the numeric width for a value that genuinely runs long. */
  wide?: boolean
}) {
  return (
    <label className="block min-w-0 text-body text-fg-1">
      {label}
      {/* The cap goes on the wrapper as well as the input: the suffix is
          positioned against this box, so without the same width it would sit
          at the far right of the column while the field ended 9rem in. */}
      <span
        className={`relative mt-1 block w-full ${wide ? 'control-max' : ''}`}
        style={wide ? undefined : { maxWidth: '9rem' }}
      >
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="num pr-12"
        />
        {/* `aria-hidden` — the accessible name already carries the unit via the
            label text, and a screen reader announcing "min" twice is noise. */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-label text-fg-2">
          {suffix}
        </span>
      </span>
    </label>
  )
}
