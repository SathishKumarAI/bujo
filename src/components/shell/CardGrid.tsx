import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * CARD GRID · three across, and everything flows into it.
 *
 * Most views in this app are a single vertical stack of cards, which is why
 * the tall ones got so tall — Pickleball reached 4.2 screens across twelve
 * blocks, of which only two needed the full width. A card that holds four stat
 * tiles does not need 1,344px; three of them side by side read better and cost
 * a third of the scroll.
 *
 * The steps are deliberate rather than a smooth ramp:
 *
 * | Width           | Columns | Why |
 * |-----------------|---------|-----|
 * | < 768px         | 1       | Phone. A card per row, nothing to argue about |
 * | 768–1535px      | 2       | At `wide` (1,180px) three columns would be ~380px each, too narrow for a chart axis |
 * | ≥ 1536px        | 3       | Container is 1,344px here, so each column is ~435px — enough for a chart |
 *
 * Anything that genuinely needs the room opts out per breakpoint with the two
 * exported helpers, rather than the grid trying to guess:
 *
 * ```tsx
 * <CardGrid>
 *   <Card title="Sessions">…</Card>
 *   <Card title="History" className={SPAN_2}>…</Card>   // a table
 *   <Card title="Heatmap" className={SPAN_ALL}>…</Card> // full bleed
 * </CardGrid>
 * ```
 *
 * `items-start`, not stretch: a short card next to a tall one should stay
 * short rather than grow a pocket of empty space to match its neighbour.
 */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid items-start gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3', className)}>
      {children}
    </div>
  )
}

/** Two of the three columns — tables, wide charts, anything with an x-axis. */
export const SPAN_2 = 'md:col-span-2 2xl:col-span-2'

/** The full row at every step — heatmaps, calendars, the widest tables. */
export const SPAN_ALL = 'md:col-span-2 2xl:col-span-3'
