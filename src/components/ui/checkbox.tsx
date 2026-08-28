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
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-grid size-5 shrink-0 place-items-center rounded-control border border-line-strong bg-background text-fg-1 transition-colors outline-none",
        "hover:border-brand focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-brand-wash data-[state=checked]:text-brand-text",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="num text-caption leading-none">
        ✓
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
