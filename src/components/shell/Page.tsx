import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Page layout. `aside` (optional) sits in a right rail at xl and wraps under
 * `main` at narrower widths — no dead void.
 *
 * Width is a two-tier system, not one number:
 *
 * - `read` (820px) — reading and capture. A short measure is easier to read,
 *   so the journal, plan, logging and prose views default here.
 * - `wide` (1180px) — data surfaces. Heatmaps, calendars, multi-series charts
 *   and dense tables get *worse* when squeezed, not more premium.
 *
 * A single 820px column was the redesign brief's original instruction; it was
 * right for half the app and wrong for the other half. Same rhythm, same
 * tokens, two maxima — a deliberate tier, not an inconsistency.
 *
 * The `aside` variant always uses the wide tier: the rail alone is 22rem, so a
 * 820px cap would leave main with ~470px and defeat the point of the split.
 */
export function Page({
  children,
  aside,
  asideFirst = false,
  width = 'read',
  className = '',
}: {
  children: ReactNode
  aside?: ReactNode
  /** On phones/tablets (< xl), render the aside ABOVE main — keeps data-entry
   *  forms (which live in the rail) above charts on mobile. Desktop unchanged. */
  asideFirst?: boolean
  /** Container tier. `wide` for data-dense views (charts, calendars, grids). */
  width?: 'read' | 'wide'
  className?: string
}) {
  if (!aside) {
    return (
      <div
        className={cn(
          'page-enter mx-auto flex w-full flex-col gap-4 sm:gap-5',
          // The `wide` tier grows past 1536px for the same reason the aside
          // variant does: at 1,180px a three-column CardGrid gives 380px per
          // column, which is under what a chart axis needs. At 1,344px it is
          // ~435px. `read` never grows — a longer measure does not help prose,
          // which is the whole distinction the two tiers exist to draw.
          //
          // `shell-fluid` keeps going past 1344 rather than stopping there: the
          // 1344 cap left 576px of a 1920 screen and 2,496px of a 4K one unused
          // on Today and Settings. It is a floor from `2xl` up and the growth is
          // continuous at 1440 — see `styles/layout.css`.
          width === 'wide' ? 'shell-fluid 2xl:[--shell-floor:84rem]' : 'max-w-read',
          className,
        )}
      >
        {children}
      </div>
    )
  }
  return (
    // At 1920 the 1180px cap left ~245px of dead gutter on *each* side while the
    // rail was only 352px wide and half-empty. Past 1536px the container grows
    // to 1344px and the rail to 26rem: the extra width goes to the rail, not to
    // the reading column, which stays near its comfortable measure.
    //
    // Past 1604 it keeps going (`shell-fluid`), and here the rail is fixed so
    // every pixel lands in the left column — at the 2000px ceiling that is
    // 1,564px. Grown anyway, and deliberately: this variant and the single-column
    // one above are the same page on different days (Today renders the rail only
    // on today), and a page that is 1,344px wide on Thursday and 1,926px wide on
    // Friday is worse than either. The left column holds cards, not paragraphs —
    // `max-w-read` is what caps a measure, and this variant has never used it.
    <div
      className={cn(
        'mx-auto grid w-full items-start gap-4 shell-fluid sm:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:[--shell-floor:84rem]',
        className,
      )}
    >
      <div className={cn('page-enter flex min-w-0 flex-col gap-4 sm:gap-5', asideFirst && 'order-last xl:order-none')}>{children}</div>
      <aside className={cn('flex flex-col gap-4 sm:gap-5', asideFirst && 'order-first xl:order-none')}>{aside}</aside>
    </div>
  )
}

// Re-export so views can grab the cursor from one shell entrypoint.
// eslint-disable-next-line react-refresh/only-export-components -- shell re-export by design
export { useCursor } from './cursor'
