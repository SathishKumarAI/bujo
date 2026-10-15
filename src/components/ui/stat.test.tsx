import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stat, Track, Spark, Ramp } from './Stat'

/**
 * The properties that make `Stat` worth having, rather than its markup.
 *
 * Every one of these is a bug this repo has actually shipped, in this app or
 * in a close relative, and the component exists to make them unrepresentable.
 */

const shapes = (c: HTMLElement) => c.querySelectorAll('[aria-hidden="true"]').length

describe('a number gets a shape only when it has something to compare against', () => {
  it('draws nothing for a bare figure', () => {
    // The honest case. Decoration on a number with no range implies a scale
    // that does not exist, which is worse than plain text — it invents a
    // comparison the reader then tries to read.
    const { container } = render(<Stat label="entries" value={41} />)
    expect(shapes(container)).toBe(0)
    expect(screen.getByText('41')).toBeTruthy()
  })

  it('draws a track once there is a target', () => {
    const { container } = render(<Stat label="tasks done" value={13} of={41} />)
    expect(shapes(container)).toBe(1)
  })

  it('draws a sparkline for a series', () => {
    const { container } = render(<Stat label="mood" value={5} history={[4, 5, 3, 6, 5]} />)
    expect(shapes(container)).toBe(1)
  })

  it('prefers the target over the series when given both', () => {
    // A target says where you stand; a trend says where you are going. Asked
    // "how am I doing", the first answers and the second elaborates.
    const { container } = render(
      <Stat label="minutes" value={377} of={150} history={[10, 40, 90]} />,
    )
    expect(shapes(container)).toBe(1)
    expect(screen.getByText(/of/)).toBeTruthy()
  })

  it('needs more than one point to call something a series', () => {
    // One observation is not a trend, and a single bar reads as a full one.
    const { container } = render(<Stat label="weight" value={80} history={[80]} />)
    expect(shapes(container)).toBe(0)
  })
})

describe('no data is not zero', () => {
  /**
   * CLAUDE.md records the cost of the other choice: `count ? sum / count : 0`
   * made "no data" and "you scored zero" the same pixel, and a monthly trend
   * opened with `0% · 0%` for two months that had not happened yet — a total
   * failure that never occurred, in the leftmost position where a trend is
   * read from.
   */
  it('renders an em dash for null, never a zero', () => {
    render(<Stat label="mood" value={null} />)
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('still renders zero when zero is the measurement', () => {
    // The other half, and the reason the first test is not just "falsy".
    render(<Stat label="lapses" value={0} />)
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('draws no shape for a null value even with a target', () => {
    const { container } = render(<Stat label="minutes" value={null} of={150} />)
    expect(shapes(container)).toBe(0)
  })
})

describe('a track can overflow, because beating a target is information', () => {
  /**
   * The case a naive `width: pct%` gets wrong. Clamped at 100%, a bar says the
   * same thing for 150 of 150 and for 377 of 150 — which is precisely the fact
   * the user wanted. Fitness printed exactly that: `377 / 150 min`.
   */
  const widths = (c: HTMLElement) =>
    [...(c.querySelector('[aria-hidden="true"]')?.children ?? [])].map(
      (el) => (el as HTMLElement).style.width,
    )

  it('fills exactly once at the target', () => {
    const { container } = render(<Track value={150} max={150} />)
    expect(widths(container)).toEqual(['100%'])
  })

  it('shows a second segment past the target', () => {
    const { container } = render(<Track value={377} max={150} />)
    const w = widths(container)
    expect(w.length).toBe(2)
    expect(w[0]).toBe('100%')
    // 377/150 is 2.51x, so the overflow segment is capped rather than 151%.
    expect(w[1]).toBe('100%')
  })

  it('distinguishes met from doubled', () => {
    const met = render(<Track value={150} max={150} />)
    const doubled = render(<Track value={300} max={150} />)
    expect(widths(met.container)).not.toEqual(widths(doubled.container))
  })

  it('survives a zero or negative max without dividing by it', () => {
    expect(() => render(<Track value={5} max={0} />)).not.toThrow()
    expect(() => render(<Track value={5} max={-3} />)).not.toThrow()
  })
})

describe('a gap in a series is a gap, not a zero', () => {
  it('renders a null point as a floor mark, not a full-height bar', () => {
    // Same family as the em dash above: a day you did not log is not a day you
    // scored nothing, and a sparkline that cannot tell them apart invents a
    // crash that never happened.
    const { container } = render(<Spark values={[5, null, 5]} />)
    const bars = [...(container.querySelector('[aria-hidden="true"]')?.children ?? [])]
    expect(bars.length).toBe(3)
    expect((bars[1] as HTMLElement).style.height).toBe('2px')
    expect((bars[0] as HTMLElement).style.height).not.toBe('2px')
  })

  it('renders nothing at all when every point is missing', () => {
    const { container } = render(<Spark values={[null, null]} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not divide by zero on a flat series', () => {
    // hi === lo. The span guard is what stops every bar becoming NaN%.
    const { container } = render(<Spark values={[7, 7, 7]} />)
    const bars = [...(container.querySelector('[aria-hidden="true"]')?.children ?? [])]
    expect(bars.every((b) => (b as HTMLElement).style.height.endsWith('%'))).toBe(true)
  })
})

describe('a ramp shows a run, and shows where it broke', () => {
  it('gives a missed day a different treatment from a kept one', () => {
    const { container } = render(<Ramp days={[true, false, true]} />)
    const cells = [...(container.querySelector('[aria-hidden="true"]')?.children ?? [])]
    expect(cells.length).toBe(3)
    expect((cells[0] as HTMLElement).style.background).not.toBe((cells[1] as HTMLElement).style.background)
  })

  it('does not divide by zero on an empty run', () => {
    expect(() => render(<Ramp days={[]} />)).not.toThrow()
  })
})

describe('the shapes are decorative and the text carries the meaning', () => {
  /**
   * A screen reader must get the fact, not a description of a rectangle. The
   * figure, the label and the range are all real text; every drawn thing is
   * `aria-hidden`. This is the inverse of the usual chart mistake, where the
   * picture is labelled and the number is absent.
   */
  it('states the value and the range as text', () => {
    render(<Stat label="tasks done" value={13} of={41} note="32% this month" />)
    expect(screen.getByText('13')).toBeTruthy()
    expect(screen.getByText(/41/)).toBeTruthy()
    expect(screen.getByText('tasks done')).toBeTruthy()
    expect(screen.getByText('32% this month')).toBeTruthy()
  })

  it('hides every drawn element from the accessibility tree', () => {
    const { container } = render(<Stat label="mood" value={5} history={[4, 5, 6]} />)
    const drawn = container.querySelectorAll('[aria-hidden="true"]')
    expect(drawn.length).toBeGreaterThan(0)
    for (const el of drawn) expect(el.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('a delta knows which direction is good', () => {
  it('reads an increase as good by default', () => {
    render(<Stat label="mood" value={5} delta={0.4} decimals={1} />)
    expect(screen.getByText(/↑/)).toBeTruthy()
  })

  it('reads a decrease as good when down is good', () => {
    // Stress, lapses, urge count. The arrow follows the number; the colour
    // follows the meaning, and conflating them is how a good week turns red.
    render(<Stat label="lapses" value={2} delta={-3} deltaGood="down" />)
    expect(screen.getByText(/↓/)).toBeTruthy()
  })

  it('shows no delta at all for zero change', () => {
    // "No change" is not an event. An arrow pointing nowhere is noise.
    render(<Stat label="weight" value={80} delta={0} />)
    expect(screen.queryByText(/[↑↓]/)).toBeNull()
  })
})
