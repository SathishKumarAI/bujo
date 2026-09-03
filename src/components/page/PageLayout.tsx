import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * The three-zone page shell. Pages hand over content per zone and never lay
 * themselves out.
 *
 * 1. ORIENT — one horizontal bar, at most four facts, spans both columns.
 * 2. ACT     — the one thing the page exists to do. Sticky left column on wide.
 * 3. REVIEW  — what has been recorded. The signature visual and the list.
 *
 * There is no zone 4. Content that fits none of the three belongs on another
 * page — that is the rule that keeps streak badges and tips from accreting at
 * the bottom of every screen.
 *
 * The 820 tier stays single column at every width; its gutters are the point.
 * Only the 1180 tier splits, and it splits on a CONTAINER query (see
 * `styles/layout.css`) so collapsing the sidebar cannot flip the layout.
 */
export function PageLayout({
  tier = 1180,
  stacked = false,
  zone1,
  zone2,
  zone3,
  className = '',
}: {
  tier?: 820 | 1180
  /**
   * Keep the wide container but do **not** split it into columns.
   *
   * The 62/38 split assumes the act is a form — narrow, capped at 380px — and
   * the review is a list that reads happily in the remaining ~800px. A review
   * that is a 31-column grid does not: Trackers needs ~910px for a full month
   * and would gain a horizontal scrollbar in the 62% column, hiding the last
   * week of the very thing the page exists to show. Its act is a horizontal
   * chip strip anyway, which wants the full width and has no use for 380px.
   *
   * This is the variant the contract predicts — "needing a variant later means
   * Stage 2 under-abstracted" — so it lives in the primitive rather than as a
   * fork at the call site.
   */
  stacked?: boolean
  /** Orient. Omit on a page with nothing that changes the next thirty seconds. */
  zone1?: ReactNode
  /** Act. The page's single primary button lives in here. */
  zone2?: ReactNode
  /** Review. Summary, signature visual, list. */
  zone3?: ReactNode
  className?: string
}) {
  const act = useRef<HTMLDivElement>(null)
  const [sticky, setSticky] = useState(true)
  // Whether the container query has actually split the columns — the panel
  // affordance below is meaningless in the stacked single-column layout, and
  // a focusable region that does not scroll is a dead tab stop.
  const [split, setSplit] = useState(false)

  /**
   * Sticky only engages while the act column is shorter than the viewport.
   *
   * A sticky element taller than its scrollport pins its *top* and never
   * scrolls to its own bottom — the submit button at the end of a long form
   * becomes permanently unreachable. CSS cannot express "stick only if you
   * fit", so this measures, and falls back to static when it does not.
   */
  useEffect(() => {
    const el = act.current
    if (!el) return
    const measure = () => {
      // Slack for the header and the 1rem top offset the CSS adds. Read from
      // `--header-h` rather than the 64px literal that used to sit here: the
      // header is not a fixed height — it grows by the notch inset, wraps at
      // narrow widths, and folds its first row away on scroll. 64 happened to
      // be conservative against all of those, but only by luck, and it was the
      // second place in the app modelling the same number.
      //
      // This changes behaviour, and in the right direction. At 643px viewport
      // the real header is 99px, so a column may only be ~528px to stay
      // reachable — Plan's is 563px. Under the 64px guess it qualified as
      // sticky and its bottom 35px could never be scrolled to, which is the
      // precise failure the note above describes.
      //
      // Read at measure time, so it reflects the header expanded rather than
      // folded. That is the conservative end and the one to be on: costing a
      // little stickiness is cheaper than an unreachable submit button.
      //
      // The fallback matches `styles/tokens.css`, for the frame before
      // `useHeaderHeight` has published a measurement.
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56
      setSticky(el.scrollHeight < window.innerHeight - header - 16)
      // Mirrors layout.css's `@container (min-width: 900px)` — the shell is
      // the container, so its width is the same measurement the CSS makes.
      setSplit((el.closest('.page-shell')?.clientWidth ?? 0) >= 900)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const panel = tier === 1180 && !stacked && split && !sticky

  return (
    <div className={cn('page-shell page-enter mx-auto w-full', tier === 820 ? 'max-w-read' : 'max-w-wide', className)}>
      <div className={cn('page-zones', (tier === 820 || stacked) && 'page-zones-single')}>
        {zone1 && <div className="zone-orient">{zone1}</div>}
        {zone2 && (
          // When the act column FITS the viewport it is sticky, as before.
          // When it outgrows it, it used to drop to static — and then the two
          // columns scrolled as one, so reading a chart on the left dragged
          // the half-filled form on the right off screen. Now it becomes its
          // own scrollport instead (`data-panel`, styles in layout.css):
          // wheel over the right panel scrolls only the right panel,
          // `overscroll-behavior` stops it handing the leftover scroll to the
          // page. Focusable + labelled because a scroll region no keyboard
          // can reach is the axe `scrollable-region-focusable` failure this
          // repo has already shipped once (CalendarHeatmap).
          <div
            ref={act}
            className="zone-act min-w-0"
            data-sticky={sticky}
            data-panel={panel}
            tabIndex={panel ? 0 : undefined}
            role={panel ? 'region' : undefined}
            aria-label={panel ? 'Actions panel, scrollable' : undefined}
          >
            {zone2}
          </div>
        )}
        {zone3 && <div className="zone-review flex min-w-0 flex-col gap-4">{zone3}</div>}
      </div>
    </div>
  )
}
