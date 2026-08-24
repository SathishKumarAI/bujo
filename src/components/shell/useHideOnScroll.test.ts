import { describe, expect, it, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useHideOnScroll } from './useHideOnScroll'

/**
 * The only part of the header fold vitest can reach.
 *
 * `src/test/setup.ts` stubs `ResizeObserver` as a no-op so page-contract views
 * render at all, which means the height side of the feature — `--header-h`
 * following the collapse, and the three sticky bars following it — never fires
 * here and is verified in a browser instead. This covers the decision itself:
 * when do the bars hide.
 *
 * Most cases pass `settleMs: 0`. The settle window is real-clock based, so a
 * zero window is how a test asks "ignore the anti-oscillation lock and check
 * the scroll rule"; the lock gets its own test at the bottom with the default.
 */
function scrollTo(y: number) {
  act(() => {
    window.scrollY = y
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('useHideOnScroll', () => {
  beforeEach(() => {
    window.scrollY = 0
  })

  it('shows at rest', () => {
    const { result } = renderHook(() => useHideOnScroll(64, 0))
    expect(result.current).toBe(false)
  })

  it('hides on a real scroll down past the threshold', () => {
    const { result } = renderHook(() => useHideOnScroll(64, 0))
    scrollTo(400)
    expect(result.current).toBe(true)
  })

  it('shows again on the first scroll up', () => {
    const { result } = renderHook(() => useHideOnScroll(64, 0))
    scrollTo(400)
    scrollTo(300)
    expect(result.current).toBe(false)
  })

  // Near the top there is barely a scroll to respond to, and chrome that
  // vanishes on the first flick reads as a glitch.
  it('stays visible while still inside the threshold', () => {
    const { result } = renderHook(() => useHideOnScroll(64, 0))
    scrollTo(50)
    expect(result.current).toBe(false)
  })

  it('honours a custom threshold', () => {
    const { result } = renderHook(() => useHideOnScroll(500, 0))
    scrollTo(400)
    expect(result.current).toBe(false)
    scrollTo(600)
    expect(result.current).toBe(true)
  })

  // Momentum scrolling and trackpad drift emit a stream of 1-2px events in both
  // directions. Without the dead zone the bars flicker; this is the guard.
  it('ignores sub-8px drift', () => {
    const { result } = renderHook(() => useHideOnScroll(64, 0))
    scrollTo(400)
    expect(result.current).toBe(true)
    scrollTo(396) // 4px up — drift, not a decision
    expect(result.current).toBe(true)
  })

  /**
   * The regression this hook exists to prevent.
   *
   * Folding the header shortens the flow above the reader, so Chrome's scroll
   * anchoring moves `scrollY` back up — which, unguarded, reads as "scrolled
   * up" and unfolds, which scrolls down, which folds. In the browser that
   * produced a rail oscillating 44 → 25 → 9 → 35 → 24 forever off ONE scroll.
   *
   * With the settle window, the compensation that immediately follows a flip
   * changes nothing.
   */
  it('ignores the scroll its own collapse causes', () => {
    const { result } = renderHook(() => useHideOnScroll()) // real 450ms window
    scrollTo(800)
    expect(result.current).toBe(true)
    scrollTo(770) // scroll anchoring compensating for the 44px the header lost
    expect(result.current).toBe(true) // must NOT flip back
    scrollTo(740) // and again, still inside the window
    expect(result.current).toBe(true)
  })

  it('stops listening once unmounted', () => {
    const { result, unmount } = renderHook(() => useHideOnScroll(64, 0))
    unmount()
    scrollTo(400)
    expect(result.current).toBe(false)
  })
})
