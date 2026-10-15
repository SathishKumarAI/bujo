import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarHeatmap } from './CalendarHeatmap'

const TODAY = '2026-06-30'

describe('CalendarHeatmap', () => {
  it('renders its frame at zero data — the empty grid is the point', () => {
    // The cards this replaces returned null when nothing was logged, so a new
    // user could not see the feature existed until it was already populated.
    const { container } = render(<CalendarHeatmap weeks={4} data={[]} today={TODAY} />)
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(7)
  })

  it('is a table with row and column headers, not an image', () => {
    render(<CalendarHeatmap weeks={2} data={[{ date: TODAY, value: 30 }]} today={TODAY} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('rowheader').length).toBe(7)
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0)
  })

  it('carries the actual value in each cell, so colour is never the only channel', () => {
    render(<CalendarHeatmap weeks={2} data={[{ date: TODAY, value: 42 }]} today={TODAY} unit="min" />)
    expect(screen.getByText(/42 min/)).toBeInTheDocument()
  })

  it('names a day with no data as a rest day rather than leaving it silent', () => {
    render(<CalendarHeatmap weeks={1} data={[]} today={TODAY} />)
    expect(screen.getAllByText(/rest day/).length).toBeGreaterThan(0)
  })

  it('sums several entries landing on the same day', () => {
    render(
      <CalendarHeatmap
        weeks={2}
        today={TODAY}
        unit="min"
        data={[{ date: TODAY, value: 20 }, { date: TODAY, value: 25 }]}
      />,
    )
    expect(screen.getByText(/45 min/)).toBeInTheDocument()
  })
})

describe('a month is the whole month', () => {
  /**
   * `ranges` + `month` is a CALENDAR, and a calendar shows every day it has.
   *
   * It used to stop at `today`, because every range shared one trailing-window
   * loop (`if (date > today) break`). On the 15th that drew Oct 1-15 and
   * stopped: half a grid, reported as *"why are you considering month has only
   * 15 days? It has so many days, like 28, 30, 31."*
   *
   * The days still to come are drawn and dated but never filled, and they are
   * NOT rest days — naming them that is a claim about days that have not
   * happened, the same family as the Insights lapse bug one directory over.
   * They are also kept out of the intensity quartiles, or sixteen future
   * zeroes would drag the thresholds down and repaint a quiet month as a
   * strong one.
   */
  const MID = '2026-06-15'   // mid-month, so there IS a future half
  const monthProps = { ranges: true as const, today: MID, unit: 'min' }

  it('draws every day of the month, not just the ones that have happened', () => {
    render(<CalendarHeatmap {...monthProps} storageKey="test-month-len" data={[]} />)
    // June has 30 days. Before the fix this rendered 15.
    for (const day of [1, 15, 16, 30]) {
      expect(screen.getByText(String(day)), `June ${day} must be on a June calendar`).toBeInTheDocument()
    }
    expect(screen.queryByText('31'), 'June has no 31st').toBeNull()
  })

  it('does not call a day that has not happened a rest day', () => {
    render(<CalendarHeatmap {...monthProps} storageKey="test-month-future" data={[]} />)
    // 15 elapsed days with nothing logged are rest days; the 15 to come are not.
    expect(screen.getAllByText(/rest day/).length).toBe(15)
    expect(screen.getAllByText(/still to come/).length).toBe(15)
  })

  // A third test here asserted that future days stay out of the intensity
  // quartiles. It passed on the OLD code too, so it was evidence of nothing
  // and has been removed rather than kept as reassurance — the exclusion is
  // in `CalendarHeatmap`'s `dates.filter((d) => d <= today)` with the reason
  // written beside it. Worth a real test only once a case exists that can
  // distinguish the two, which needs a month whose future zeroes would move a
  // quartile boundary.
})
