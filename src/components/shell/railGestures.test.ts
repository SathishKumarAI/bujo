import { describe, expect, it } from 'vitest'
import { deadSpaceClick, overscrollHide, OVERSCROLL_PX } from './railGestures'

describe('deadSpaceClick', () => {
  it('ignores a click that hit a row', () => {
    expect(deadSpaceClick(false, 500, 200)).toBe(false)
  })

  it('ignores a click in the gap between two rows', () => {
    // The 4px `gap-1` belongs to the container, so this is a self-hit at a y
    // above the last row — a near-miss on a nav link, not a request to hide.
    expect(deadSpaceClick(true, 120, 300)).toBe(false)
  })

  it('hides on a click below the last row', () => {
    expect(deadSpaceClick(true, 301, 300)).toBe(true)
  })
})

describe('overscrollHide', () => {
  it('does not count travel while the list can still scroll', () => {
    expect(overscrollHide(100, 50, false, true)).toEqual({ acc: 0, hide: false })
  })

  it('does not hide on the first notch at the end', () => {
    expect(overscrollHide(0, 40, true, true)).toEqual({ acc: 40, hide: false })
  })

  it('hides once the travel past the end reaches the threshold', () => {
    expect(overscrollHide(OVERSCROLL_PX - 10, 10, true, true)).toEqual({ acc: 0, hide: true })
  })

  it('resets on an upward wheel, so the shove must be continuous', () => {
    expect(overscrollHide(119, -10, true, false)).toEqual({ acc: 0, hide: false })
  })

  // THE REGRESSION. A list with nothing to scroll reports itself at its end,
  // because it is also at its start — and that is this rail's normal state
  // (measured 1503x849 on Body: scrollHeight 699, clientHeight 699). Without
  // the `canScroll` guard, one page scroll with the pointer over the sidebar
  // hid the sidebar, which is what "I can hover it but I can't click it" was.
  it('never hides a list that cannot scroll, however far the wheel travels', () => {
    let acc = 0
    for (let i = 0; i < 20; i++) {
      const out = overscrollHide(acc, 100, true, false)
      expect(out.hide).toBe(false)
      acc = out.acc
    }
    expect(acc).toBe(0)
  })
})
