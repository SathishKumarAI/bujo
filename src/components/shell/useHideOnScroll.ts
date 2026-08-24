import { useEffect, useState } from 'react'

/** Matches `--dur-base` (0.28s) plus slack for the reflow that follows it. */
const SETTLE_MS = 450

/**
 * "The user is reading, not navigating" — true while scrolling down, false
 * again on the first scroll up.
 *
 * One rule, two bars: `BottomNav` slides off the bottom edge and the top bar
 * folds its first row away. They used to be one rule and one bar, with this
 * function unexported inside `BottomNav.tsx`; a second caller made it worth its
 * own file rather than a copy.
 *
 * Three numbers, all of them load-bearing:
 *
 * - **8px dead zone.** Momentum scrolling and trackpad drift emit a stream of
 *   1–2px events in both directions. Without a floor the bars flicker.
 * - **`threshold` (64px default)** — never hide while still near the top of the
 *   page. Hiding chrome the moment a scroll starts, when there is barely a
 *   scroll to speak of, reads as a glitch rather than a response.
 * - **`settleMs` (450 default) — the one that stops an infinite loop.**
 *
 * ## Why the settle window exists
 *
 * The top bar collapses by shrinking its real height (see `topbar/HeaderRail`),
 * and it sits in flow, so folding it makes the content above the reader ~44px
 * shorter. Chrome's scroll anchoring then compensates by moving `scrollY` to
 * keep the view stable — and a scroll listener cannot tell that compensation
 * apart from a person scrolling up. So: fold → browser scrolls up ~30px → hook
 * reads "scrolled up" → unfold → browser scrolls down → fold. Measured before
 * this guard existed, one single programmatic scroll produced a rail that never
 * settled:
 *
 * ```
 * railH  44 → 39 → 25 → 24 → 15 → 9 → 20 → 35 → 24 …
 * ```
 *
 * For `settleMs` after a flip, scroll events only re-baseline and decide
 * nothing, which absorbs the compensation and leaves the next real scroll in
 * charge. Turning scroll anchoring off app-wide would also break the loop, but
 * at a much worse price: this app lazy-loads charts on nearly every page, and
 * anchoring is what stops them shoving content under the reader.
 */
export function useHideOnScroll(threshold = 64, settleMs = SETTLE_MS): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    // Mirrors the state inside the closure. Reading it from `hidden` would need
    // the effect to re-run on every flip, which would reset `last` with it.
    let current = false
    let lockedUntil = 0
    const onScroll = () => {
      const y = window.scrollY
      const now = performance.now()
      // Mid-flip: the bar's own layout change is moving the page under us.
      // Follow the position, but do not read a decision into it.
      if (now < lockedUntil) {
        last = y
        return
      }
      if (Math.abs(y - last) < 8) return
      const next = y > last && y > threshold // down & past the top → hide
      last = y
      if (next === current) return
      current = next
      lockedUntil = now + settleMs
      setHidden(next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, settleMs])
  return hidden
}
