import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, StatTile } from '../ui'
import { Stat } from './Stat'
import { FlatCards } from './flatCards'
import { CARDS } from '../../lib/recoveryCards'

describe('FlatCards', () => {
  it('a collapsible card under FlatCards opens nothing in place and draws its subtitle in words', () => {
    const { container } = render(
      <FlatCards.Provider value>
        <Card collapsible defaultCollapsed title="Urges" subtitle="15 logged · what helped">body</Card>
      </FlatCards.Provider>,
    )
    expect(container.querySelector('[aria-expanded]')).toBeNull()
    expect(screen.queryByRole('button', { name: /What is/ })).toBeNull()
    expect(screen.getByText('body')).toBeTruthy()
    expect(screen.getByText('15 logged, what helped')).toBeTruthy()
  })

  it('the same card outside it still folds (Help keeps its phone folds)', () => {
    const { container } = render(<Card collapsible title="Urges" subtitle="15 logged · what helped">body</Card>)
    expect(container.querySelector('[aria-expanded="true"]')).not.toBeNull()
  })

  it('Recovery flags its chart panels, so the phone select cannot offer one', () => {
    const charts = CARDS.filter((c) => c.chart).map((c) => c.id).sort()
    expect(charts).toEqual(['addictionbreakdown', 'intensity', 'lapsecounts', 'riskdays', 'riskhours', 'urgemix', 'urgetrend'])
  })

  it('a figure under FlatCards says "of" and "up" instead of a slash and an arrow', () => {
    const { container } = render(
      <FlatCards.Provider value>
        <Stat label="Mood" value={5} of={10} />
        <Stat label="Sleep" value={7} delta={0.4} />
        <StatTile label="Clean weeks" value="6/9" />
      </FlatCards.Provider>,
    )
    expect(container.textContent).not.toMatch(/[↑↓]|\d\/\d/)
    expect(container.textContent).toMatch(/of 10/)
    expect(container.textContent).toMatch(/up 0/)
    expect(container.textContent).toMatch(/6 of 9/)
  })
})
