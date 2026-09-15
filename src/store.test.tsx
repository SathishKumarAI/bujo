import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider, useJournal } from './store'
import { CaptureBar } from './components/CaptureBar'
import { EntryRow } from './components/EntryRow'
import { NavProvider } from './components/shell/nav'
import { CaptureReceipt, CaptureReceiptProvider } from './components/CaptureReceipt'
import type { ViewId } from './components/shell/viewChrome'

function Probe() {
  const { data } = useJournal()
  return <div data-testid="count">{data.entries.length}</div>
}

/**
 * `CaptureBar` writes AND moves — since it started routing a capture to the
 * page that now holds it, it needs the nav and the receipt above it. The spy is
 * the point rather than a prop: "saved but did not move" is the failure this
 * whole feature exists to prevent, and it is invisible in a diff.
 */
function Shell({ children, navigate = () => {} }: { children: ReactNode; navigate?: (id: ViewId) => void }) {
  return (
    <JournalProvider>
      <NavProvider navigate={navigate}>
        <CaptureReceiptProvider>
          <CaptureReceipt />
          {children}
        </CaptureReceiptProvider>
      </NavProvider>
    </JournalProvider>
  )
}

describe('CaptureBar + store integration', () => {
  it('adds a parsed entry that persists to state', async () => {
    const user = userEvent.setup()
    render(
      <Shell>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </Shell>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')

    await user.type(screen.getByLabelText('Smart capture'), 'e ecstatic dance')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('ignores empty submissions', async () => {
    const user = userEvent.setup()
    render(
      <Shell>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </Shell>,
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
      <Shell>
        <CaptureBar date="2026-06-10" />
        <UndoProbe />
      </Shell>,
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

/**
 * The capture is only half of it. A sentence typed on Today can write a workout
 * onto Strength, and a save that does not move leaves the user reading a page
 * where nothing changed — which is indistinguishable from a save that failed.
 */
/** The list a capture lands in, so the row it wrote can be looked for. */
function Entries() {
  const { data } = useJournal()
  return <ul>{data.entries.map((e) => <EntryRow key={e.id} entry={e} />)}</ul>
}

describe('a capture marks the row it just wrote', () => {
  it('rings the new entry, and only the new one', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Shell>
        <CaptureBar date="2026-06-10" />
        <Entries />
      </Shell>,
    )

    await user.type(screen.getByLabelText('Smart capture'), 'first note')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.type(screen.getByLabelText('Smart capture'), 'second note')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    const marked = container.querySelectorAll('[data-just-captured]')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('second note')
  })
})

describe('a capture moves the app to the page that now holds it', () => {
  it('sends a parsed lift to Strength and a plain note to Today', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    render(
      <Shell navigate={navigate}>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </Shell>,
    )

    await user.type(screen.getByLabelText('Smart capture'), 'bench 80x5')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(navigate).toHaveBeenLastCalledWith('gym')

    await user.type(screen.getByLabelText('Smart capture'), 'called mum')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(navigate).toHaveBeenLastCalledWith('today')
  })

  it('names what was written, and undoes it', async () => {
    const user = userEvent.setup()
    render(
      <Shell>
        <CaptureBar date="2026-06-10" />
        <Probe />
      </Shell>,
    )

    await user.type(screen.getByLabelText('Smart capture'), 'called mum')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByRole('status')).toHaveTextContent('Saved to Today')
    expect(screen.getByRole('status')).toHaveTextContent('called mum')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.queryByRole('status')).toBeNull()
  })
})
