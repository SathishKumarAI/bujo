import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useStickyState } from './useStickyState'

const TABS = ['cardio', 'strength'] as const

function Tabs() {
  const [tab, setTab] = useStickyState<'cardio' | 'strength'>('test.tab', 'cardio', TABS)
  return (
    <div>
      <span data-testid="tab">{tab}</span>
      <button onClick={() => setTab('strength')}>strength</button>
    </div>
  )
}

describe('useStickyState', () => {
  afterEach(() => localStorage.clear())

  it('starts on the fallback when nothing is stored', () => {
    render(<Tabs />)
    expect(screen.getByTestId('tab').textContent).toBe('cardio')
  })

  it('persists the choice under a bujo.ui.* key', async () => {
    const user = userEvent.setup()
    render(<Tabs />)
    await user.click(screen.getByText('strength'))
    expect(screen.getByTestId('tab').textContent).toBe('strength')
    expect(localStorage.getItem('bujo.ui.test.tab')).toBe('strength')
  })

  it('restores the stored choice on the next mount', () => {
    localStorage.setItem('bujo.ui.test.tab', 'strength')
    render(<Tabs />)
    expect(screen.getByTestId('tab').textContent).toBe('strength')
  })

  it('ignores a stored value the component no longer understands', () => {
    localStorage.setItem('bujo.ui.test.tab', 'yoga') // a tab that was renamed away
    render(<Tabs />)
    expect(screen.getByTestId('tab').textContent).toBe('cardio')
  })

  it('round-trips numbers, which storage flattens to strings', async () => {
    const user = userEvent.setup()
    function Weeks() {
      const [weeks, setWeeks] = useStickyState<number>('test.weeks', 26, [13, 26, 52])
      return <button onClick={() => setWeeks(52)}>{weeks}</button>
    }
    const { unmount } = render(<Weeks />)
    await user.click(screen.getByText('26'))
    expect(localStorage.getItem('bujo.ui.test.weeks')).toBe('52')
    unmount()
    render(<Weeks />)
    expect(screen.getByText('52')).toBeTruthy()
  })
})
