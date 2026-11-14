import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitCards } from './HabitCards'
import { emptyJournal } from '../../lib/storage'
import { todayISO } from '../../lib/date'
import type { Habit } from '../../lib/types'

afterEach(cleanup)

const read: Habit = { id: 'h1', name: 'Read', category: 'custom', color: 'mauve', startedOn: '2020-01-01' }
const water: Habit = { id: 'h2', name: 'Water', category: 'custom', color: 'blue', startedOn: '2020-01-01', type: 'count', target: 8 }

describe('HabitCards, today on a phone', () => {
  it('is one card you tap anywhere for a yes/no habit, and − + for a counted one, with no bullet', async () => {
    const onToggle = vi.fn()
    const onSetValue = vi.fn()
    const today = todayISO()
    const { container } = render(<HabitCards habits={[read, water]} data={{ ...emptyJournal(), habits: [read, water] }} today={today} onToggle={onToggle} onSetValue={onSetValue} />)
    const card = screen.getByRole('button', { name: 'Read — mark done today' })
    expect(card.className).toContain('habit-card')
    await userEvent.click(card)
    expect(onToggle).toHaveBeenCalledWith(today, 'h1')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Water' }))
    expect(onSetValue).toHaveBeenCalledWith(today, 'h2', 1)
    expect(container.textContent).not.toContain('●')
  })

  // The failure: a week coming back onto the phone (owner, 2026-11-14: no
  // week or month on a phone), or a count drawn as "0/8".
  it('draws no week squares and says a count in words', () => {
    const { container } = render(<HabitCards habits={[read, water]} data={{ ...emptyJournal(), habits: [read, water] }} today={todayISO()} onToggle={() => {}} onSetValue={() => {}} />)
    expect(container.querySelector('[class*="rounded-[3px]"]')).toBeNull()
    expect(container.textContent).toContain('0 of 8')
    expect(container.textContent).not.toMatch(/\d\/\d/)
  })
})
