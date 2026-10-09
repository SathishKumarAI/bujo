/**
 * The two "get out of the way" gestures on `SideRail`, as arithmetic.
 *
 * They live here rather than inline in the JSX because both are *decisions*
 * with an edge each — a click that only counts below the last row, a wheel that
 * only counts after the scroller has stopped — and neither edge is testable
 * through a mounted rail: jsdom gives every element a zero-size rect, so the
 * geometry that makes `deadSpaceClick` correct is exactly the thing a render
 * test cannot see. Numbers in, boolean out, asserted in `railGestures.test.ts`.
 *
 * This file owns *when* the rail should hide, not what hiding does — that is
 * `AppShell`'s `railHidden` and the `RailToggle` beside Search.
 */

/**
 * Did a click land on the rail's empty column?
 *
 * Two conditions, and the second is the one that matters. `hitSelf` (the
 * handler's `e.target === e.currentTarget`) rules out every row, because each
 * is an `<a>` or a `<button>` — but it does *not* rule out the 4px `gap-1`
 * between two rows, which belongs to the container. Missing a nav row by four
 * pixels and losing the whole sidebar is the accident this exists to prevent,
 * so the click must also be **below the last row's bottom edge**.
 *
 * @param hitSelf    the click reached the scroll container itself
 * @param clientY    the click's viewport y
 * @param lastBottom the last row's `getBoundingClientRect().bottom`, or null
 *                   when the list is empty (then any self-hit is dead space)
 */
export function deadSpaceClick(hitSelf: boolean, clientY: number, lastBottom: number | null): boolean {
  if (!hitSelf) return false
  return lastBottom == null || clientY >= lastBottom
}

/** How much wheel travel past the end counts as a deliberate shove, in px. */
export const OVERSCROLL_PX = 120

/**
 * Fold one wheel event into the overscroll accumulator.
 *
 * The threshold is the whole point: a trackpad's deceleration tail arrives
 * *after* the list has hit its bottom, so hiding on the first blocked notch
 * would collapse the rail every time someone scrolled to the end of the Body
 * tabs. 120px is one more push, not a tail. Any upward wheel — or any wheel
 * while the list still has somewhere to go — resets to zero, so the travel has
 * to be one continuous downward gesture.
 *
 * **`canScroll` is the guard this shipped without, and it was the whole bug.**
 * A list with nothing to scroll has `scrollTop + clientHeight === scrollHeight`
 * — it is at its end because it is also at its start — so "at the end" was
 * permanently true, and that is the NORMAL state of this rail: measured at
 * 1503×849 on the Body section, eleven tabs and five sections come to
 * **scrollHeight 699 against clientHeight 699**. Scrolling the page with the
 * pointer anywhere over the sidebar therefore hid the sidebar. Reported as
 * "I can hover it but I can't click it" — correctly: the row you were aiming
 * at was gone before the click landed.
 *
 * Over-scrolling only means something where scrolling means something, so a
 * list that cannot scroll never accumulates.
 *
 * @returns the new accumulator, and whether to hide (which resets it)
 */
export function overscrollHide(
  acc: number,
  deltaY: number,
  atEnd: boolean,
  canScroll: boolean,
): { acc: number; hide: boolean } {
  if (deltaY <= 0 || !atEnd || !canScroll) return { acc: 0, hide: false }
  const next = acc + deltaY
  return next >= OVERSCROLL_PX ? { acc: 0, hide: true } : { acc: next, hide: false }
}
