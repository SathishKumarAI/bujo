import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Mounts its children the first time they come within ~400px of the viewport,
 * and keeps them mounted after that. Until then it renders a skeleton at the
 * declared height, so the scrollbar and everything below hold still — a lazy
 * section that changes height when it loads is worse than an eager one.
 *
 * For content that is *open by default* but lives below the fold: a page like
 * Recovery stacks two thousand pixels of recharts that most visits never
 * scroll to, and every one of them mounts, measures and draws on page load.
 * Closed folds already have this for free (`QuietSection` mounts its body on
 * open); this is the same economics for sections that should not be folded.
 *
 * Deliberately mount-once, never unmount-on-exit: the point is skipping work
 * the visit never needs, not windowing. Unmounting on scroll-out would throw
 * away chart state and re-run every mount for a saving nobody measured.
 *
 * The data is computed by the caller either way — this defers *rendering*,
 * which for a recharts block is where the time goes.
 */
export function LazyMount({ minHeight, children }: { minHeight: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // No IntersectionObserver (old WebView, jsdom) → render immediately;
  // lazy is an optimisation, never a gate on content.
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (shown) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setShown(true) },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    // Gate hook: the a11y and clipped-text scripts dispatch this to mount
    // every lazy section at once. They used to scroll the page instead, which
    // fought the hide-on-scroll header and left it intercepting their clicks;
    // an explicit arm is deterministic. Unmounted content cannot be scanned —
    // the closed-fold trap in a new shape — so the gates must fire this.
    const arm = () => setShown(true)
    window.addEventListener('bujo:reveal-lazy', arm)
    return () => { io.disconnect(); window.removeEventListener('bujo:reveal-lazy', arm) }
  }, [shown])

  return (
    <div ref={ref}>
      {shown ? children : <div aria-hidden className="w-full animate-pulse rounded-card bg-ink-2" style={{ height: minHeight }} />}
    </div>
  )
}
