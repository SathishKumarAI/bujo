import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { JournalProvider, useJournal } from './store'

// Capture what the store hands sonner, without mounting a Toaster.
const toasts: { message: string; action?: { label: string; onClick: () => void } }[] = []
vi.mock('sonner', () => ({
  toast: Object.assign(
    (message: string, opts?: { action?: { label: string; onClick: () => void } }) => {
      toasts.push({ message, action: opts?.action })
      return 1
    },
    { success: () => 1, error: () => 1, promise: () => 1 },
  ),
}))

/**
 * Deleting is recoverable: the store keeps an undo stack, but for months only
 * `EntryRow` surfaced it — the other twenty-four `remove*` actions deleted in
 * silence and left ⌘Z as the only way back. `removeWithUndo` is the one place
 * that raises the toast, so this pins the behaviour at the store rather than at
 * twenty-five call sites.
 */
function Probe() {
  const { data, addHabit, removeHabit, addBook, removeBook } = useJournal()
  return (
    <div>
      <div data-testid="habits">{data.habits.length}</div>
      <div data-testid="books">{(data.books ?? []).length}</div>
      <button onClick={() => addHabit({ name: 'Read', emoji: '📖', color: 'blue', type: 'check', category: 'wellness' })}>add habit</button>
      <button onClick={() => removeHabit(data.habits[0]?.id)}>remove habit</button>
      <button onClick={() => addBook({ title: 'Dune', author: 'Herbert', status: 'reading' })}>add book</button>
      <button onClick={() => removeBook((data.books ?? [])[0]?.id)}>remove book</button>
    </div>
  )
}

const click = (name: string) => act(() => { screen.getByText(name).click() })

describe('delete raises an undo toast', () => {
  beforeEach(() => { toasts.length = 0; localStorage.clear() })

  it('toasts with a working Undo when a habit is removed', () => {
    render(<JournalProvider><Probe /></JournalProvider>)
    // A fresh journal ships with starter habits, so count relatively.
    const habits = () => Number(screen.getByTestId('habits').textContent)
    const before = habits()

    click('remove habit')
    expect(habits()).toBe(before - 1)
    expect(toasts.at(-1)?.message).toBe('Habit deleted')
    expect(toasts.at(-1)?.action?.label).toBe('Undo')

    act(() => toasts.at(-1)!.action!.onClick())
    expect(habits()).toBe(before)
  })

  it('names the thing deleted, not a generic "Item"', () => {
    render(<JournalProvider><Probe /></JournalProvider>)
    click('add book')
    click('remove book')
    expect(toasts.at(-1)?.message).toBe('Book deleted')
  })

  it('does not toast on a non-destructive edit', () => {
    render(<JournalProvider><Probe /></JournalProvider>)
    click('add habit')
    expect(toasts).toEqual([])
  })
})
