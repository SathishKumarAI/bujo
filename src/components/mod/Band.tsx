import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Band — a horizontal section of a Modernist page, closed by a 2px rule.
 *
 * Owns: the structural rules of the Modernist redesign (2px between sections,
 * 1px between cells, zero radius, no surface fill, flush-left first cell).
 * Does not own: colour, type, or what goes inside a cell.
 *
 * Why a band and not a `Card`: a card is a floating surface with a radius, a
 * border on four sides and its own padding — three cards stacked read as three
 * objects on a page. A band is the page. The redesign's identity is the grid
 * showing through, so sections are separated by rules rather than boxed, and
 * the only structure the eye gets is the rule and the alignment.
 *
 * Colour comes from the app's own tokens (`border-line`, `text-fg-*`), not the
 * handoff's raw palette: this app carries five themes and a theme-following
 * chart palette, and one pinned ink value would break all five. The rules are
 * the identity, which is what the handoff itself says.
 */
/**
 * Set by `BandRow` so a `Band` nested inside one knows to render as a CELL
 * rather than as another full-width section.
 *
 * This exists so pairing two sections side by side costs nothing at the call
 * sites. Reading and Collections are each five or six components that own
 * their own `<Band>`, and the alternative was threading a `cell` prop through
 * all eleven — eleven signatures changed, eleven chances to forget one, for a
 * decision that belongs to the page and not to the component. A section does
 * not know whether it is sharing a row; the row does.
 */
const InBandRow = createContext(false)

export function Band({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  // `id` so a jump link can target a band directly — the Index on Collections
  // scrolls to one. A wrapper span with the id would work and is what the old
  // page did; the band already exists, so it can carry its own name.
  const inRow = useContext(InBandRow)

  // Inside a row this is a cell: the row owns the 2px closing rule, and the
  // cell carries the 1px divider and the flush-left alignment. The incoming
  // `className` is still applied so a caller’s `py-6` keeps working either
  // way — what changes is the structure, not the spacing it asked for.
  // `id` FORWARDED, and its absence was a real regression. A band may carry
  // a jump-link target — Collections’ Index scrolls to `bujo-tags` and
  // `bujo-collections` — and the first version of this branch dropped it, so
  // pairing two bands silently broke the links that pointed at them. Nothing
  // failed: the element still rendered, `scrollIntoView` just had nothing to
  // find. Same family as every other "renders fine, does nothing" entry in
  // CLAUDE.md.
  // `basis-[22rem]` IS LOAD-BEARING, and leaving it out is a clipping bug.
  //
  // `BandCell` is `flex-1`, i.e. `flex: 1 1 0%` — a basis of ZERO. A flex row
  // only wraps when its items’ base sizes exceed the container, so cells with
  // no basis never overflow and therefore NEVER WRAP: on a 390px phone two of
  // them split the screen in half instead of stacking. `npm run clipped`
  // caught it as "The third-shot drop, explained — 66px shown, 181px needed".
  //
  // Every hand-written `<BandCell>` in the app already passes a basis for
  // exactly this reason (20–26rem at each site). This path had no call site to
  // pass one, so it carries the default. 22rem pairs with the 44rem container
  // query in the cell below — two cells need 44rem to sit side by side, which
  // is the same threshold that drops their column styling.
  //
  // A caller’s own basis still wins: `className` is merged after.
  if (inRow) return <BandCell id={id} className={cn('basis-[22rem]', className)}>{children}</BandCell>

  return <section id={id} className={cn('border-b-2 border-line', className)}>{children}</section>
}

/**
 * A row of cells inside a band.
 *
 * Wraps by default — every cell carries its own `flex-basis` + `min-width`, so
 * the row degrades to a single column on narrow widths with no breakpoint.
 * Pass `wrap={false}` for a row that must stay one line at every width (the
 * focus slots: an early build let them wrap and left a dead half-row).
 *
 * It is a **named container** so `BandCell` can drop its column styling once
 * the row is too narrow to hold its cells side by side. CSS cannot ask "did I
 * wrap?", so the width is the proxy — see the cell below.
 */
export function BandRow({
  children,
  wrap = true,
  className,
}: {
  children: ReactNode
  wrap?: boolean
  className?: string
}) {
  return (
    <InBandRow.Provider value={true}>
      <div className={cn('@container/band flex', wrap ? 'flex-wrap' : 'flex-nowrap', className)}>{children}</div>
    </InBandRow.Provider>
  )
}

/**
 * One cell of a band row, split from its neighbour by a 1px rule.
 *
 * The first cell is flush left — no leading padding — because flush-left
 * alignment down the whole page is what makes the grid legible. The last cell
 * drops its rule, so a band never draws a line against the page edge.
 *
 * **And that alignment broke the moment the row wrapped.** `first:pl-0` is
 * DOM order, not visual order: once the cells stack, the second one is visually
 * first in its row and still carries `pl-6`, so its text sat 24px right of the
 * eyebrow above it. The first cell meanwhile kept `border-r`, drawing a 1px
 * rule down the right edge of a full-width block with nothing on the other
 * side of it. Measured at 390px: 6 mis-styled cells on Reading, 6 on
 * Collections, 10 on Focus — every stacked two-cell band in the app, for as
 * long as the component has existed, and invisible to every gate because
 * nothing is clipped, unreachable or unlabelled.
 *
 * ponytail: CSS cannot ask a flex item whether it wrapped, so the container
 * width is the proxy. **44rem is a heuristic**, not a derived number — cells
 * are typically 20–26rem, so a row narrower than 44rem has almost certainly
 * stacked. A band with three wide cells could still stack above it and keep
 * the column styling. If that turns up, give `BandRow` an explicit
 * `stackBelow` prop rather than nudging this number.
 *
 * The border override repeats `[&:not(:last-child)]` on purpose. Without it the
 * rule is a bare class (specificity 0-1-0) losing to the divider's
 * `[&:not(:last-child)]:border-r` (0-2-0), and the padding half of this fix
 * lands while the stray rule silently stays — which is exactly what the first
 * attempt did. Same family as the `.zone-act :is(input…)` trap in CLAUDE.md.
 */
export function BandCell({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn('min-w-0 flex-1 border-line py-6 pr-6 pl-6 first:pl-0 last:border-r-0 last:pr-0 [&:not(:last-child)]:border-r @max-[44rem]/band:px-0 @max-[44rem]/band:[&:not(:last-child)]:border-r-0', className)}>
      {children}
    </div>
  )
}
