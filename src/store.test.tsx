import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider, useJournal } from './store'
import { QuickAdd } from './components/QuickAdd'

function Probe() {
  const { data } = useJournal()
  return <div data-testid="count">{data.entries.length}</div>
}

describe('QuickAdd + store integration', () => {
  it('adds a parsed entry that persists to state', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <QuickAdd date="2026-06-10" />
        <Probe />
      </JournalProvider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')

    await user.type(screen.getByLabelText('Quick add entry'), 'e ecstatic dance')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('ignores empty submissions', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <QuickAdd date="2026-06-10" />
        <Probe />
      </JournalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })
})
