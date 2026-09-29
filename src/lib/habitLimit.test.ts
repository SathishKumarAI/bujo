/**
 * LIMIT HABITS — the type whose target is a ceiling.
 *
 * Named for the failures they catch, not for the functions they call. The one
 * that matters is `an unrecorded day is not a win`: `habitValueOn` returns 0
 * for a day nobody touched, and 0 is under every limit, so the obvious
 * `v <= target` silently awards a streak for the entire past.
 */
import { describe, expect, it } from 'vitest'
import { habitDoneOn, habitRecordedOn, habitStreak, limitStatus, nextHabitValue } from './stats'
import { atRiskHabits } from './streak'
import { emptyJournal } from './storage'
import type { Habit, JournalData } from './types'

const caffeine: Habit = {
  id: 'caf', name: 'Caffeine', category: 'stimulant', color: 'peach',
  startedOn: '2026-09-01', type: 'limit', target: 2, unit: 'cups',
}

/** A journal with `caffeine` and the given day -> cups recorded. */
function withCups(cups: Record<string, number>): JournalData {
  const habitValues: Record<string, Record<string, number>> = {}
  for (const [day, n] of Object.entries(cups)) habitValues[day] = { caf: n }
  return { ...emptyJournal(), habits: [caffeine], habitValues }
}

describe('a limit day is under, over, or not logged', () => {
  it('counts a day at the limit as under, not over', () => {
    const d = withCups({ '2026-09-29': 2 })
    expect(limitStatus(d, caffeine, '2026-09-29')).toBe('under')
    expect(habitDoneOn(d, caffeine, '2026-09-29')).toBe(true)
  })

  it('counts one past the limit as over', () => {
    const d = withCups({ '2026-09-29': 3 })
    expect(limitStatus(d, caffeine, '2026-09-29')).toBe('over')
    expect(habitDoneOn(d, caffeine, '2026-09-29')).toBe(false)
  })

  it('counts a recorded zero as a win, because it was recorded', () => {
    const d = withCups({ '2026-09-29': 0 })
    expect(habitRecordedOn(d, caffeine, '2026-09-29')).toBe(true)
    expect(limitStatus(d, caffeine, '2026-09-29')).toBe('under')
  })

  it('does NOT treat an unrecorded day as staying under the limit', () => {
    const d = withCups({})
    expect(habitRecordedOn(d, caffeine, '2026-09-29')).toBe(false)
    expect(limitStatus(d, caffeine, '2026-09-29')).toBe('unlogged')
    expect(habitDoneOn(d, caffeine, '2026-09-29')).toBe(false)
  })

  it('returns null rather than a status for a habit that is not a limit', () => {
    const water: Habit = { ...caffeine, id: 'w', type: 'count', target: 8 }
    const d: JournalData = { ...emptyJournal(), habits: [water] }
    expect(limitStatus(d, water, '2026-09-29')).toBeNull()
  })
})

describe('limit streaks count only logged days under the limit', () => {
  it('breaks the streak on the day the limit was exceeded', () => {
    const d = withCups({ '2026-09-29': 1, '2026-09-28': 2, '2026-09-27': 5, '2026-09-26': 0 })
    expect(habitStreak(d, 'caf', '2026-09-29')).toBe(2)
  })

  it('does not award a streak for a journal with no records at all', () => {
    expect(habitStreak(withCups({}), 'caf', '2026-09-29')).toBe(0)
  })

  it('flags an unlogged day as at risk once the streak is alive', () => {
    const d = withCups({ '2026-09-28': 1, '2026-09-27': 2 })
    const risk = atRiskHabits(d, '2026-09-29')
    expect(risk.map((r) => r.habit.id)).toContain('caf')
    expect(risk[0].streak).toBe(2)
  })

  it('stops flagging it once today is recorded under the limit', () => {
    const d = withCups({ '2026-09-29': 1, '2026-09-28': 1, '2026-09-27': 2 })
    expect(atRiskHabits(d, '2026-09-29')).toHaveLength(0)
  })
})

describe('stepping a limit habit can exceed it', () => {
  it('steps past the ceiling so the slip can be recorded, then resets', () => {
    expect(nextHabitValue('limit', 2, 0)).toBe(1)
    expect(nextHabitValue('limit', 2, 1)).toBe(2)
    expect(nextHabitValue('limit', 2, 2)).toBe(3) // over — a count habit would clamp here
    expect(nextHabitValue('limit', 2, 3)).toBe(0)
  })

  it('leaves the count/timer clamp alone', () => {
    expect(nextHabitValue('count', 8, 7)).toBe(8)
    expect(nextHabitValue('count', 8, 8)).toBe(0)
    expect(nextHabitValue('timer', 30, 0)).toBe(5)
  })
})
