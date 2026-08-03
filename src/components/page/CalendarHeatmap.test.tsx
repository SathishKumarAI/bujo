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
