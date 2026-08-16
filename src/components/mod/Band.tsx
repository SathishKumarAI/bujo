import type { ReactNode } from 'react'
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
export function Band({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('border-b-2 border-line', className)}>{children}</section>
}

/**
 * A row of cells inside a band.
 *
 * Wraps by default — every cell carries its own `flex-basis` + `min-width`, so
 * the row degrades to a single column on narrow widths with no breakpoint.
 * Pass `wrap={false}` for a row that must stay one line at every width (the
 * focus slots: an early build let them wrap and left a dead half-row).
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
  return <div className={cn('flex', wrap ? 'flex-wrap' : 'flex-nowrap', className)}>{children}</div>
}

/**
 * One cell of a band row, split from its neighbour by a 1px rule.
 *
 * The first cell is flush left — no leading padding — because flush-left
 * alignment down the whole page is what makes the grid legible. The last cell
 * drops its rule, so a band never draws a line against the page edge.
 */
export function BandCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 flex-1 border-line py-6 pr-6 pl-6 first:pl-0 last:border-r-0 last:pr-0 [&:not(:last-child)]:border-r', className)}>
      {children}
    </div>
  )
}
