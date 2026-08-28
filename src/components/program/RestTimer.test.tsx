import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { RestTimer } from './RestTimer'

/**
 * The timer counts against a deadline rather than decrementing per tick, and
 * these are the two failures that distinguishes.
 */
describe('RestTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const advance = async (ms: number) => {
    await act(async () => {
      vi.advanceTimersByTime(ms)
    })
  }

  it('shows the prescribed rest and counts it down', async () => {
    render(<RestTimer seconds={120} exercise="Barbell rows" onDismiss={() => {}} />)
    expect(screen.getByRole('timer')).toHaveTextContent('2:00')
    await advance(65_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:55')
  })

  /**
   * The reason for the deadline. A background tab throttles `setInterval` to
   * roughly once a minute, so a decrement-per-tick timer that missed 118 ticks
   * would come back reading 1:58 — here the clock moved, so the timer did.
   */
  it('is right after its interval has been throttled away', async () => {
    render(<RestTimer seconds={120} exercise="Leg press" onDismiss={() => {}} />)
    await act(async () => {
      // The clock moves 110 seconds and NOT ONE interval fires — the tab was
      // in the background. A timer that subtracts a second per tick would
      // still read 2:00 here.
      vi.setSystemTime(Date.now() + 110_000)
      vi.advanceTimersByTime(250) // the first tick after waking up
    })
    expect(screen.getByRole('timer')).toHaveTextContent('0:09')
  })

  it('holds where it is while paused, and does not resume the lost time', async () => {
    const user = { click: (el: HTMLElement) => act(() => void el.click()) }
    render(<RestTimer seconds={60} exercise="Leg press" onDismiss={() => {}} />)
    await advance(10_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:50')

    user.click(screen.getByRole('button', { name: 'Pause' }))
    await advance(30_000)
    // Wall-clock moved thirty seconds; a paused timer did not.
    expect(screen.getByRole('timer')).toHaveTextContent('0:50')

    user.click(screen.getByRole('button', { name: 'Resume' }))
    await advance(5_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:45')
  })

  it('stops at zero and says so, and +30s restarts from there', async () => {
    render(<RestTimer seconds={30} exercise="Lateral raises" onDismiss={() => {}} />)
    await advance(45_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
    expect(screen.getByText('Rest over')).toBeInTheDocument()

    // Not "thirty seconds minus the fifteen it sat at zero".
    await act(async () => void screen.getByRole('button', { name: '+30s' }).click())
    expect(screen.getByRole('timer')).toHaveTextContent('0:30')
  })
})
