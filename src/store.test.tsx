import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider, useJournal } from './store'
import { CaptureBar } from './components/CaptureBar'

function Probe() {
  const { data } = useJournal()
  return <div data-testid="count">{data.entries.length}</div>
}

describe('CaptureBar + store integration', () => {
  it('adds a parsed entry that persists to state', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </JournalProvider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')

    await user.type(screen.getByLabelText('Smart capture'), 'e ecstatic dance')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('ignores empty submissions', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </JournalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })
})

function UndoProbe() {
  const { data, undo, redo, canUndo, canRedo } = useJournal()
  return (
    <div>
      <div data-testid="count">{data.entries.length}</div>
      <button onClick={undo} disabled={!canUndo}>undo</button>
      <button onClick={redo} disabled={!canRedo}>redo</button>
    </div>
  )
}

describe('undo / redo history', () => {
  it('undoes and redoes an entry add', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <CaptureBar date="2026-06-10" />
        <UndoProbe />
      </JournalProvider>,
    )
    await user.type(screen.getByLabelText('Smart capture'), 'water plants')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('count').textContent).toBe('1')

    await user.click(screen.getByRole('button', { name: 'undo' }))
    expect(screen.getByTestId('count').textContent).toBe('0')

    await user.click(screen.getByRole('button', { name: 'redo' }))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })
})
