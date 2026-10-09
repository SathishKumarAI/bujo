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
    expect(overscrollHide(100, 50, false)).toEqual({ acc: 0, hide: false })
  })

  it('does not hide on the first notch at the end', () => {
    expect(overscrollHide(0, 40, true)).toEqual({ acc: 40, hide: false })
  })

  it('hides once the travel past the end reaches the threshold', () => {
    expect(overscrollHide(OVERSCROLL_PX - 10, 10, true)).toEqual({ acc: 0, hide: true })
  })

  it('resets on an upward wheel, so the shove must be continuous', () => {
    expect(overscrollHide(119, -10, true)).toEqual({ acc: 0, hide: false })
  })
})
