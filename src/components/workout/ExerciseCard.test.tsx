import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseCard, WorkoutHint } from './ExerciseCard'
import { JournalProvider, useJournal } from '../../store'

afterEach(() => { cleanup(); localStorage.clear() })

describe('ExerciseCard', () => {
  // The failure: the plan, last time, a Try chip and a weight stepper on the
  // card, so what to do today was one line among five (owner, 2026-11-14).
  it('is the counter, the name, and one row of actions where the plan is Edit', async () => {
    const onTap = vi.fn(), onEdit = vi.fn(), onRemove = vi.fn(), onTimer = vi.fn()
    render(<ul><ExerciseCard name="Push-ups" n={1} total={3} onTap={onTap} plan="3 sets of 12" onEdit={onEdit} onTimer={onTimer} onRemove={onRemove} /></ul>)
    await userEvent.click(screen.getByRole('button', { name: 'Push-ups: 1/3 sets done, tap after set 2' }))
    await userEvent.click(screen.getByRole('button', { name: /^3 sets of 12, edit Push-ups$/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Timer for Push-ups' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove Push-ups from the session' }))
    expect([onTap, onEdit, onTimer, onRemove].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1])
    expect(screen.getByRole('heading', { name: 'Push-ups' }).className).toContain('truncate')
  })

  it('draws no remove button when the page has nothing to remove', () => {
    render(<ul><ExerciseCard name="Dead hang" n={0} total={1} onTap={() => {}} plan="1 set" /></ul>)
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
  })

  it('hides the how-to note for good after Got it', async () => {
    const { unmount } = render(<WorkoutHint />)
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }))
    unmount()
    render(<WorkoutHint />)
    expect(screen.queryByRole('complementary', { name: 'How this page works' })).toBeNull()
  })
})

describe('Settings, Hand', () => {
  // The failure: a left-handed person's counter stuck under the right thumb.
  it('puts the hand on <html> for the mirror rule', () => {
    let set: ReturnType<typeof useJournal>['setSettings'] = () => {}
    const Grab = () => { set = useJournal().setSettings; return null }
    render(<JournalProvider><Grab /></JournalProvider>)
    expect(document.documentElement.dataset.hand).toBe('right')
    act(() => set({ hand: 'left' }))
    expect(document.documentElement.dataset.hand).toBe('left')
  })
})
