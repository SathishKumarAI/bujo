import { describe, it, expect } from 'vitest'
import { habitRowChips, MAX_ROW_CHIPS } from './habitRowChips'
import { emptyJournal } from './storage'
import type { Habit, JournalData } from './types'

const TODAY = '2026-06-18' // Thursday (getDay()=4)

function habit(p: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2000-01-01', ...p }
}

function withDone(h: Habit, days: string[]): JournalData {
  const d = emptyJournal()
  d.habits = [h]
  for (const day of days) d.habitLog[day] = [h.id]
  return d
}

function isoDays(today: string, n: number, from = 0): string[] {
  const out: string[] = []
  const base = new Date(today + 'T00:00')
  for (let i = from; i < from + n; i++) {
    const x = new Date(base)
    x.setDate(x.getDate() - i)
    out.push(x.toISOString().slice(0, 10))
  }
  return out
}

/**
 * The cap is the whole point of the module, so it is asserted against the
 * hardest input rather than a convenient one: a habit that qualifies for
 * *every* chip kind at once. Before this function existed the same habit
 * rendered seven marks, which is how the row became unreadable — no single
 * commit added more than one.
 */
describe('habitRowChips · the cap', () => {
  it('never exceeds MAX_ROW_CHIPS even when every mark qualifies', () => {
    const h = habit({ weeklyGoal: 5 })
    // A lapse, then a rebuild: qualifies for streak, weekly goal and comeback.
    const d = withDone(h, [...isoDays(TODAY, 6), ...isoDays(TODAY, 10, 8)])
    expect(habitRowChips(d, h, TODAY).length).toBeLessThanOrEqual(MAX_ROW_CHIPS)
  })

  it('never exceeds MAX_ROW_CHIPS for a quit habit either', () => {
    const h = habit({ avoid: true, weeklyGoal: 3 })
    expect(habitRowChips(withDone(h, []), h, TODAY).length).toBeLessThanOrEqual(MAX_ROW_CHIPS)
  })
})

describe('habitRowChips · priority', () => {
  it('leads with the streak for a build habit', () => {
    const h = habit()
    const chips = habitRowChips(withDone(h, isoDays(TODAY, 5)), h, TODAY)
    expect(chips[0]).toEqual({ kind: 'streak', days: 5 })
  })

  it('leads with the clean run for a quit habit', () => {
    const h = habit({ avoid: true })
    const chips = habitRowChips(withDone(h, []), h, TODAY)
    expect(chips[0]?.kind).toBe('clean')
  })

  it('a weekly goal the user set outranks a comeback this app inferred', () => {
    const h = habit({ weeklyGoal: 5 })
    // Done for six days after an eight-day gap — `habitComeback` reports
    // recovering, so both marks are eligible and only the goal may appear.
    const d = withDone(h, [...isoDays(TODAY, 6), ...isoDays(TODAY, 10, 14)])
    const kinds = habitRowChips(d, h, TODAY).map((c) => c.kind)
    expect(kinds).toContain('weekly')
    expect(kinds).not.toContain('comeback')
  })

  it('shows the comeback when there is no weekly goal to outrank it', () => {
    const h = habit()
    const d = withDone(h, [...isoDays(TODAY, 6), ...isoDays(TODAY, 10, 14)])
    const kinds = habitRowChips(d, h, TODAY).map((c) => c.kind)
    expect(kinds).toContain('comeback')
  })

  it('carries the weekly goal for a quit habit too, ahead of its milestone', () => {
    const h = habit({ avoid: true, weeklyGoal: 3 })
    const kinds = habitRowChips(withDone(h, []), h, TODAY).map((c) => c.kind)
    expect(kinds).toContain('weekly')
    expect(kinds).not.toContain('milestone')
  })
})

describe('habitRowChips · silence', () => {
  it('says nothing for a habit with no history', () => {
    const h = habit()
    expect(habitRowChips(withDone(h, []), h, TODAY)).toEqual([])
  })

  /**
   * Both halves matter. A single logged day is not a streak, and it is not a
   * comeback either — `habitComeback` reports `recovering` as soon as one day
   * follows a gap, so before the floor existed this rendered "↺ back 1d",
   * which says only "you did it today" while the cell beside it says the same.
   */
  it('a single logged day is neither a streak nor a comeback', () => {
    const h = habit()
    expect(habitRowChips(withDone(h, [TODAY]), h, TODAY)).toEqual([])
  })
})
