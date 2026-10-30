import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitRows } from './HabitRows'
import { emptyJournal } from '../../lib/storage'
import { addDays, todayISO } from '../../lib/date'
import type { Habit } from '../../lib/types'

afterEach(cleanup)

const habit: Habit = { id: 'h1', name: 'Read', category: 'custom', color: 'mauve', startedOn: '2020-01-01' }

describe('HabitRows', () => {
  // The bug: Today's date cursor moved every card but this one, so a tap on
  // yesterday's page ticked today. The row writes to the day it is given and
  // says which day that is.
  it('ticks the day it is given, and names it when it is not today', async () => {
    const yesterday = addDays(todayISO(), -1)
    const onToggle = vi.fn()
    render(<HabitRows habits={[habit]} data={{ ...emptyJournal(), habits: [habit] }} today={yesterday} onToggle={onToggle} onSetValue={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /^Read — mark done on / }))
    expect(onToggle).toHaveBeenCalledWith(yesterday, 'h1')
  })

  it('says today on today', () => {
    render(<HabitRows habits={[habit]} data={{ ...emptyJournal(), habits: [habit] }} today={todayISO()} onToggle={() => {}} onSetValue={() => {}} />)
    expect(screen.getByRole('button', { name: 'Read — mark done today' })).toBeTruthy()
  })
})
