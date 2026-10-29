import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { JournalProvider } from '../../../store'
import { emptyJournal } from '../../../lib/storage'
import { newSetRow } from '../setRow'
import { GymPhone } from './GymPhone'

/**
 * The failure: a full-width "Finish workout" on an empty session, which could
 * only answer "No sets to finish". Measured on the phone page 2026-10-29.
 */
const mount = (rows = [newSetRow()]) =>
  render(
    <JournalProvider>
      <GymPhone
        data={emptyJournal()} split="pull" setSplit={() => {}} suggested="pull"
        rows={rows} setRows={() => {}} date="2026-10-29" setDate={() => {}} onFinish={vi.fn()}
        unit="lb" recentExercises={[]} onRest={() => {}} onLoadRoutine={() => {}}
        setsThisWeek={0} rest={null}
      />
    </JournalProvider>,
  )

afterEach(cleanup)

describe('Strength on a phone', () => {
  it('offers no Finish until there is an exercise', () => {
    mount()
    expect(screen.queryByRole('button', { name: /Finish workout/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Add an exercise/ })).toBeTruthy()
  })

  it('offers Finish once an exercise is in', () => {
    mount([newSetRow({ exercise: 'Deadlift', weight: '225', reps: '5' })])
    expect(screen.getByRole('button', { name: /Finish workout · 1 set/ })).toBeTruthy()
  })
})
