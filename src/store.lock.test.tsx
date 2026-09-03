import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider, useJournal } from './store'
import { emptyJournal, STORAGE_KEY, STORAGE_ENC_KEY } from './lib/storage'
import { encryptString } from './lib/crypto'

function Probe() {
  const { data } = useJournal()
  return <div data-testid="count">{data.entries.length}</div>
}

function journalWithOneEntry() {
  return { ...emptyJournal(), entries: [{ id: 'e1', date: '2026-01-01', type: 'note', text: 'sealed' }] }
}

// The lock path guards everything the passcode seals; it shipped untested
// (COD-138). The no-blob branch is the data-loss preventer: unlocking onto the
// empty mount journal would persist blank over real data on the next save.

describe('locked journal', () => {
  afterEach(() => localStorage.clear())

  it('the right passcode unlocks and hydrates the sealed journal', async () => {
    const blob = await encryptString(JSON.stringify(journalWithOneEntry()), 'pc-123')
    localStorage.setItem(STORAGE_ENC_KEY, JSON.stringify(blob))
    const user = userEvent.setup()
    render(<JournalProvider><Probe /></JournalProvider>)
    expect(screen.queryByTestId('count')).toBeNull() // gate is up

    await user.type(screen.getByLabelText('Passcode'), 'pc-123')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'))
  })

  it('a wrong passcode shows the error and keeps the gate up', async () => {
    const blob = await encryptString(JSON.stringify(journalWithOneEntry()), 'pc-123')
    localStorage.setItem(STORAGE_ENC_KEY, JSON.stringify(blob))
    const user = userEvent.setup()
    render(<JournalProvider><Probe /></JournalProvider>)

    await user.type(screen.getByLabelText('Passcode'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await waitFor(() => expect(screen.getByText('Wrong passcode. Try again.')).toBeTruthy())
    expect(screen.queryByTestId('count')).toBeNull()
  })

  it('locked start with a corrupt blob recovers the plaintext journal instead of blanking it', async () => {
    // hasEncrypted() is true (key present) so the mount is locked, but the
    // blob is unreadable — unlock must fall back to the plaintext copy.
    localStorage.setItem(STORAGE_ENC_KEY, 'not-json{')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journalWithOneEntry()))
    const user = userEvent.setup()
    render(<JournalProvider><Probe /></JournalProvider>)

    await user.type(screen.getByLabelText('Passcode'), 'anything')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'))
  })
})
