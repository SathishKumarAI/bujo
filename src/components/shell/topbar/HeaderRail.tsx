import type { ReactNode } from 'react'

/**
 * The header's first row, and the fold that takes it away while you read.
 *
 * **It collapses by real height, never by `transform`, and that is the whole
 * design.** `useHeaderHeight` republishes `.app-header`'s measured
 * `getBoundingClientRect().height` as `--header-h`, and three sticky elements
 * park against it — the page contract's act column (`styles/layout.css`),
 * Mindset's `LibraryBar`, and Today's mobile `CaptureBar`. A transform would
 * leave the measured height at its full value while only part of the header was
 * on screen, so all three would sit ~46px too low with page content scrolling
 * through the gap. Shrinking the real box makes the `ResizeObserver` fire
 * through the transition and drags all three up in step, with no new variable
 * and no consumer changed.
 *
 * The `1fr → 0fr` grid track rather than a `height`, because this row's height
 * is content-derived — it grows with the notch inset and wraps at narrow widths
 * — and `auto` does not transition.
 *
 * Motion, the reduced-motion guard and the focus-within reopen all live in
 * `.header-rail` (`src/index.css`), so this component is only the markup that
 * gives the transition something to animate.
 */
export function HeaderRail({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <div className="header-rail" data-collapsed={collapsed}>
      {/* The inner element is not optional: a grid track can only animate to
          `0fr` if its item is allowed to be clipped, so this is what carries
          `overflow: hidden`. */}
      <div>{children}</div>
    </div>
  )
}
