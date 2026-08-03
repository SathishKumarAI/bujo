import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/cn"
import { registerPrimary } from "@/lib/onePrimary"

/**
 * BUTTON · four variants, three heights, no solid accent fill anywhere.
 *
 * The fill is gone on purpose. This app had 37 solid-accent buttons, an accent
 * nav rail, accent icons and accent pills all on screen at once — the accent
 * was competing with itself, so nothing read as *the* action. The one loud
 * button on a screen is **tonal**: accent wash background, accent-as-text
 * label, no border. It is unmistakably the primary action without adding
 * another saturated surface.
 *
 * | Variant | Use |
 * |---|---|
 * | `primary`   | Exactly one per screen — the thing the user came to do |
 * | `secondary` | Everything else that needs a boundary |
 * | `ghost`     | Toolbars, icon-only, inline actions |
 * | `danger`    | Destructive, in menus and confirmations |
 *
 * Heights are the three control tokens (28 / 36 / 44) in rem, so they track the
 * global text-size setting; `lg` is reserved for a single empty-state call to
 * action. Radius is `--radius-control`. No shadows: the wash and the press
 * scale carry the whole interaction.
 *
 * The label reads verb-first, sentence case, one to three words — "Start fast",
 * "Log entry", "Add habit" — and matches the verb in its resulting toast.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap",
    // No `text-body` here: the body element already sets it, and stating it
    // would be one more class in the font-size group for the size variants to
    // fight with.
    "rounded-control font-medium",
    "transition-[background-color,border-color,transform] duration-[130ms]",
    "active:scale-[0.97]",
    // Never removed. The global :focus-visible rule covers hand-rolled
    // controls; this keeps the ring identical on the button system itself.
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    // Disabled is a last resort — prefer keeping a button enabled and
    // explaining on click. When it is used, it must not swallow pointer events
    // silently in a way that looks broken.
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-brand-wash text-brand-text hover:bg-brand-wash-hover",
        secondary: "border border-line-strong bg-transparent text-fg-1 hover:border-brand hover:text-fg-1",
        ghost: "bg-transparent text-fg-2 hover:bg-ink-2 hover:text-fg-1",
        danger: "bg-transparent text-danger-text hover:bg-danger-wash",
      },
      size: {
        // `text-[length:…]` rather than `text-label`: `cn` runs tailwind-merge,
        // which cannot tell a custom `text-label` (a size) from a custom
        // `text-brand-text` (a colour), so the size class silently won and a
        // small primary button rendered in the foreground colour instead of the
        // accent. Stating it as an explicit length puts it in the font-size
        // group, where it belongs, and the variant's colour survives.
        // `max-md:min-h-[44px]` on every size: 44px is the floor for a finger, and
        // the small sizes render at 28-36px. The height stays whatever the
        // control system says on desktop, where the pointer is precise — this
        // only grows the *hit* area on phones, and `min-h` rather than `h` so
        // the visual weight of a small button does not change with it.
        sm: "h-[var(--h-control-sm)] max-md:min-h-[44px] px-2.5 text-[length:var(--text-label)]",
        md: "h-[var(--h-control)] max-md:min-h-[44px] px-3.5",
        lg: "h-[var(--h-control-lg)] px-5",
        icon: "h-[var(--h-control)] w-[var(--h-control)] max-md:min-h-[44px] max-md:min-w-[44px] px-0",
        "icon-sm": "h-[var(--h-control-sm)] w-[var(--h-control-sm)] max-md:min-h-[44px] max-md:min-w-[44px] px-0",
        "icon-lg": "h-[var(--h-control-lg)] w-[var(--h-control-lg)] px-0",
      },
    },
    defaultVariants: {
      // Deliberately NOT `primary`. A bare <Button> used to be a solid accent
      // fill, which is how this app ended up with 31 of them; the safe default
      // is the quiet one, and a primary has to be asked for.
      variant: "secondary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "secondary",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // Dev-only: count mounted primaries per view and warn when a screen has two.
  // No-op (and tree-shaken) in production.
  React.useEffect(() => {
    if (variant !== "primary") return
    return registerPrimary()
  }, [variant])

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- vendored shadcn file; `shadcn add` regenerates it, so keep the upstream export shape
export { Button, buttonVariants }
