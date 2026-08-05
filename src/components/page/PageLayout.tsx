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
  zone1,
  zone2,
  zone3,
  className = '',
}: {
  tier?: 820 | 1180
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
      // 64px of slack for the header and the top offset; being conservative
      // costs a little stickiness, being wrong costs a usable form.
      setSticky(el.scrollHeight < window.innerHeight - 64)
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

  return (
    <div className={cn('page-shell page-enter mx-auto w-full', tier === 820 ? 'max-w-read' : 'max-w-wide', className)}>
      <div className={cn('page-zones', tier === 820 && 'page-zones-single')}>
        {zone1 && <div className="zone-orient">{zone1}</div>}
        {zone2 && (
          <div ref={act} className="zone-act min-w-0" data-sticky={sticky}>
            {zone2}
          </div>
        )}
        {zone3 && <div className="zone-review flex min-w-0 flex-col gap-4">{zone3}</div>}
      </div>
    </div>
  )
}
