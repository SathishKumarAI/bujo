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
 */
export function NumField({
  label, value, onChange, suffix, step, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix: string
  step?: string
  placeholder?: string
}) {
  return (
    <label className="block text-body text-fg-1">
      {label}
      {/* `control-max` on the wrapper as well as the input: the suffix is
          positioned against this box, so without the same cap it would sit at
          the far right of the column while the field ended 380px in. */}
      <span className="control-max relative mt-1 block w-full">
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
