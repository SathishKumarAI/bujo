import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/cn"

/**
 * CHECKBOX · "this happened", as opposed to `Switch`, which is "this is on".
 *
 * The distinction is the whole reason this exists. A switch is a *setting* —
 * it says something about how the app should behave from now on, and it stays
 * where you left it. Ticking "Workout 1" for today is an **event**: it records
 * that a thing happened on a date, and tomorrow's answer starts blank again.
 * Challenges rendered its daily rules as switches, so a 75 Hard check-in read
 * as a preferences pane.
 *
 * The mark is the `✓` text glyph in the mono face, not an icon component —
 * the same rule `DisclosureRow` follows for its `▸`. The bullet-glyph column
 * is a typographic mark and is what makes this a bullet journal; spending an
 * SVG on it would make this checkbox look like every other checkbox.
 *
 * Radix rather than a bare `<input type="checkbox">` because the app's
 * `Switch` is Radix and the two need to focus, disable and announce
 * identically — and because a native checkbox cannot be restyled to the
 * app's radius and border tokens without `appearance: none` and a second
 * element anyway, which is this component with extra steps.
 *
 * `tone` exists because of **avoid habits**, and it is the reason adopting this
 * component elsewhere was not a rename. Ticking "Alcohol" does not record that
 * you did a good thing; it records that you slipped. The old hand-rolled box in
 * `TodayHabits` drew a green ✓ and struck the label through, which reads as
 * "well done, that is handled" — the opposite of what the tick means. `danger`
 * marks with `✕` on the red wash instead. It is not `indeterminate`: the box is
 * definitely checked, it is the *meaning* of checked that differs.
 */
/**
 * Every class here is a **literal**. Tailwind v4 scans source text, so a class
 * assembled at runtime (`on.replace(…)` to turn `data-[state=…]` into
 * `group-data-[state=…]/row`) emits no CSS at all — and emits it silently: the
 * build stays green and the element just inherits. Writing the two forms out is
 * four lines of duplication against a bug with no failure mode.
 *
 * Both washes are the calibrated 14% pair from `tokens.css`. Do not swap in a
 * hand-mixed 20% one: the accents clear 4.5:1 as text on a 13–14% wash of
 * themselves and go under it at 20.
 */
const TONE = {
  brand: {
    mark: '✓',
    on: 'data-[state=checked]:border-transparent data-[state=checked]:bg-brand-wash data-[state=checked]:text-brand-text',
    rowOn: 'group-data-[state=checked]/row:border-transparent group-data-[state=checked]/row:bg-brand-wash group-data-[state=checked]/row:text-brand-text',
    hover: 'hover:border-brand',
    rowHover: 'group-hover/row:border-brand',
  },
  danger: {
    mark: '✕',
    on: 'data-[state=checked]:border-transparent data-[state=checked]:bg-danger-wash data-[state=checked]:text-danger-text',
    rowOn: 'group-data-[state=checked]/row:border-transparent group-data-[state=checked]/row:bg-danger-wash group-data-[state=checked]/row:text-danger-text',
    hover: 'hover:border-danger-text',
    rowHover: 'group-hover/row:border-danger-text',
  },
} as const

/** The box itself, minus the Root — shared by `Checkbox` and `CheckRow`. */
const BOX =
  'inline-grid size-5 shrink-0 place-items-center rounded-control border border-line-strong bg-background text-fg-1 transition-colors'

function Checkbox({
  className,
  tone = 'brand',
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { tone?: keyof typeof TONE }) {
  const t = TONE[tone]
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer outline-none',
        BOX,
        t.hover,
        t.on,
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="num text-caption leading-none">
        {t.mark}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/**
 * CHECK ROW · a whole row that *is* the checkbox.
 *
 * A close-out list is walked once, top to bottom, so the target should be the
 * row and not a 20px box at the start of it. Today's evening list built that as
 * a `<button aria-pressed>` wrapping a presentational `<span>` — which works,
 * but announces "toggle button, pressed" rather than "checkbox, checked", and
 * put a second copy of the box's styling somewhere nothing would keep in step.
 *
 * The row is the Radix Root, so there is exactly one interactive element per
 * line. That matters more than it looks: a `<label>` cannot rescue the other
 * arrangement, because Radix's Root is a `<button>` and a `<button>` is not a
 * labelable element — `htmlFor` contributes to its name but does not forward
 * the click. One control per row is the arrangement that needs no rescuing.
 *
 * `children` is the label; `right` is whatever the row wants at its far end.
 */
function CheckRow({
  className,
  tone = 'brand',
  children,
  right,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  tone?: keyof typeof TONE
  right?: React.ReactNode
}) {
  const t = TONE[tone]
  return (
    <CheckboxPrimitive.Root
      data-slot="check-row"
      className={cn(
        // `min-h-11` is WCAG 2.5.5 on the row rather than on the box, which is
        // the point of the component.
        'group/row flex min-h-11 w-full items-center gap-3 py-2 text-left text-body outline-none',
        'transition-colors hover:bg-ink-2 focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        // The states are driven off the Root, so the box is a plain span and
        // cannot disagree with the control it belongs to.
        className={cn(BOX, t.rowHover, t.rowOn)}
      >
        <span className="num text-caption leading-none opacity-0 group-data-[state=checked]/row:opacity-100">{t.mark}</span>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {right}
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, CheckRow }
