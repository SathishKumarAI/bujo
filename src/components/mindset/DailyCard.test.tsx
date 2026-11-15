import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DailyCard } from './DailyCard'
import { DAILY_CARDS } from '../../lib/mindsetDaily'

afterEach(cleanup)
const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('DailyCard', () => {
  // The failure it was written for: 365 cards in the data and one reachable.
  it('reaches every card: All 365 lists them and picking one shows it', () => {
    render(<DailyCard n={318} />)
    expect(screen.getByText(DAILY_CARDS[317].quote)).toBeTruthy()
    tap('All 365')
    const list = within(screen.getByRole('dialog')).getAllByRole('listitem')
    expect(list).toHaveLength(365)
    fireEvent.click(within(list[9]).getByRole('button'))
    expect(screen.getByText(DAILY_CARDS[9].quote)).toBeTruthy()
    tap("Today's card")
    expect(screen.getByText(DAILY_CARDS[317].quote)).toBeTruthy()
  })

  it('steps one card and wraps at both ends of the year', () => {
    render(<DailyCard n={365} />)
    tap('Next card')
    expect(screen.getByText(DAILY_CARDS[0].quote)).toBeTruthy()
    tap('Previous card')
    expect(screen.getByText(DAILY_CARDS[364].quote)).toBeTruthy()
  })
})
