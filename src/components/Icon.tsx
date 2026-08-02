import type { Icon as PhosphorGlyph } from './icons'

/**
 * ICON · the only place in the app that decides how an icon is drawn.
 *
 * Three rules, and they are the whole system:
 *
 * 1. **Three sizes.** `sm` inside buttons and inline with text, `md` for the
 *    sidebar and toolbars, `lg` for empty states and card headers. The app had
 *    sixteen icon sizes before this (9px through 48px, `size={14}` alone at 112
 *    call sites), which is not a scale — it is sixteen separate judgements that
 *    happen to look similar.
 * 2. **In rem, never px.** The global text-size setting scales the rem root, so
 *    a px icon stays put while its own label grows around it. Charts opt out of
 *    that scaling deliberately via `.fig-fixed`; icons in the chrome do not.
 * 3. **Weight, not colour, signals state.** `regular` at rest, `duotone` when
 *    active or selected. This is what lets the accent stop competing with
 *    itself: an active nav row no longer needs to be purple *and* bold *and*
 *    railed. `bold` and `fill` are not used in this app at all.
 *
 * Colour comes from `currentColor`, so an icon is whatever its container is —
 * `--color-fg-2` by default, `--color-fg-1` on hover, and accent **only** when
 * it already sits inside an accented surface (a tonal button, an active nav
 * row). An icon is never accent-coloured on its own.
 *
 * The bullet glyph column (`· × — ›`) is deliberately NOT routed through here.
 * Those are typographic marks in the mono face — the app's signature — and
 * turning them into icon components would flatten the one thing that makes
 * this a bullet journal rather than a tracker with a list view.
 *
 * ```tsx
 * <Icon as={Sun} />                      // md, regular
 * <Icon as={Barbell} size="sm" active /> // sm, duotone
 * <Icon as={Trash} label="Delete" />     // announced, not aria-hidden
 * ```
 */
export function Icon({
  as: Glyph,
  size = 'md',
  active = false,
  className,
  label,
  style,
  title,
}: {
  as: PhosphorGlyph
  size?: 'sm' | 'md' | 'lg'
  /** Selected / current / on. Renders duotone instead of regular. */
  active?: boolean
  className?: string
  /** Give this only when the icon carries meaning no nearby text repeats.
   *  Without it the icon is hidden from assistive tech, which is correct for
   *  the overwhelming majority — an icon beside its own label is decoration. */
  label?: string
  /** Colour only, in practice: the charts and habit grids colour their icons
   *  from a per-theme JS palette (`cat()`), which cannot be a class. Size is
   *  deliberately NOT reachable from here — that is the whole point. */
  style?: React.CSSProperties
  /** Native tooltip. Not a substitute for `label`: `title` is not reliably
   *  announced, so an icon-only control still needs an accessible name. */
  title?: string
}) {
  const px = { sm: '1rem', md: '1.125rem', lg: '1.25rem' }[size]
  return (
    <Glyph
      size={px}
      weight={active ? 'duotone' : 'regular'}
      className={className}
      style={style}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {title ? <title>{title}</title> : null}
    </Glyph>
  )
}
