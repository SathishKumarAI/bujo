import { describe, expect, it } from 'vitest'
import { currentStreak, longestStreak, onThisDay, search, taskCompletion } from './stats'
import { emptyJournal } from './storage'
import type { Entry, JournalData } from './types'

function entry(p: Partial<Entry>): Entry {
  return {
    id: p.id ?? 'e1', date: p.date ?? '2026-06-10', type: p.type ?? 'task',
    text: p.text ?? 'thing', status: p.status ?? 'open', important: false,
    memory: false, tags: [], createdAt: '2026-06-10', ...p,
  }
}

function withEntries(entries: Entry[]): JournalData {
  return { ...emptyJournal(), entries }
}

describe('streaks', () => {
  it('counts consecutive days up to today', () => {
    const d = withEntries([
      entry({ id: 'a', date: '2026-06-10' }),
      entry({ id: 'b', date: '2026-06-09' }),
      entry({ id: 'c', date: '2026-06-08' }),
    ])
    expect(currentStreak(d, '2026-06-10')).toBe(3)
  })
  it('still counts when today is empty but yesterday logged', () => {
    const d = withEntries([entry({ id: 'a', date: '2026-06-09' })])
    expect(currentStreak(d, '2026-06-10')).toBe(1)
  })
  it('breaks on a gap', () => {
    const d = withEntries([
      entry({ id: 'a', date: '2026-06-10' }),
      entry({ id: 'b', date: '2026-06-07' }),
    ])
    expect(currentStreak(d, '2026-06-10')).toBe(1)
  })
  it('finds the longest historical streak', () => {
    const d = withEntries([
      entry({ id: 'a', date: '2026-01-01' }),
      entry({ id: 'b', date: '2026-01-02' }),
      entry({ id: 'c', date: '2026-01-03' }),
      entry({ id: 'd', date: '2026-03-01' }),
    ])
    expect(longestStreak(d)).toBe(3)
  })
})

describe('taskCompletion', () => {
  it('computes done / non-dropped ratio', () => {
    const d = withEntries([
      entry({ id: 'a', status: 'done' }),
      entry({ id: 'b', status: 'open' }),
      entry({ id: 'c', status: 'dropped' }), // excluded
      entry({ id: 'd', type: 'note' }), // excluded
    ])
    const r = taskCompletion(d)
    expect(r).toEqual({ done: 1, total: 2, pct: 50 })
  })
})

describe('onThisDay', () => {
  it('surfaces same month-day from prior years', () => {
    const d = withEntries([
      entry({ id: 'a', date: '2025-06-10', text: 'last year' }),
      entry({ id: 'b', date: '2026-06-10', text: 'today' }),
    ])
    const r = onThisDay(d, '2026-06-10')
    expect(r.entries.map((e) => e.text)).toEqual(['last year'])
  })
})

describe('search', () => {
  it('matches entries case-insensitively', () => {
    const d = withEntries([entry({ id: 'a', text: 'Buy LAMB food' })])
    expect(search(d, 'lamb')).toHaveLength(1)
  })
  it('returns nothing for blank query', () => {
    expect(search(withEntries([entry({})]), '   ')).toEqual([])
  })
})

import { habitStreak, weeklyHabitCount, habitDayOfWeekBreakdown } from './stats'

describe('habit helpers (v2)', () => {
  function withLog(log: Record<string, string[]>, skips?: Record<string, string[]>): JournalData {
    const d = emptyJournal()
    d.habitLog = log
    if (skips) d.habitSkips = skips
    return d
  }

  it('weeklyHabitCount counts completions in the rolling 7 days', () => {
    const d = withLog({ '2026-06-11': ['h'], '2026-06-09': ['h'], '2026-06-03': ['h'] })
    expect(weeklyHabitCount(d, 'h', '2026-06-11')).toBe(2) // 06-03 is outside 7d window
  })

  it('habitStreak bridges planned skip days', () => {
    // done 11 & 09, 10 is a planned skip → streak counts 11 + 09 = 2, not broken by 10
    const d = withLog({ '2026-06-11': ['h'], '2026-06-09': ['h'] }, { h: ['2026-06-10'] })
    expect(habitStreak(d, 'h', '2026-06-11')).toBe(2)
  })

  it('habitStreak breaks on a real miss', () => {
    const d = withLog({ '2026-06-11': ['h'], '2026-06-09': ['h'] })
    expect(habitStreak(d, 'h', '2026-06-11')).toBe(1) // 10 missed
  })

  it('habitDayOfWeekBreakdown tallies by weekday', () => {
    const d = withLog({ '2026-06-11': ['h'] }) // 2026-06-11 is a Thursday (idx 4)
    expect(habitDayOfWeekBreakdown(d, 'h')[4]).toBe(1)
  })
})

import { reminderMessage } from './stats'
import type { Habit } from './types'

describe('reminderMessage (R2-8 smarter notifications)', () => {
  const habit = (id: string): Habit => ({
    id, name: id, category: 'wellness', color: 'mauve', startedOn: '2026-01-01',
  })

  it('returns null when nothing is at risk', () => {
    expect(reminderMessage(emptyJournal(), '2026-06-11')).toBeNull()
  })

  it('warns when a ≥3-day habit streak would break today', () => {
    const d = emptyJournal()
    d.habits = [habit('h')]
    // done 08,09,10 → 3-day streak; not done 11 → at risk
    d.habitLog = { '2026-06-08': ['h'], '2026-06-09': ['h'], '2026-06-10': ['h'] }
    const m = reminderMessage(d, '2026-06-11')
    expect(m?.title).toContain('3-day')
  })

  it('does not warn once the habit is logged today', () => {
    const d = emptyJournal()
    d.habits = [habit('h')]
    d.habitLog = { '2026-06-08': ['h'], '2026-06-09': ['h'], '2026-06-10': ['h'], '2026-06-11': ['h'] }
    expect(reminderMessage(d, '2026-06-11')).toBeNull()
  })

  it('nudges an unfinished active challenge day', () => {
    const d = emptyJournal()
    d.challenges = [{ id: 'c', name: '75 Hard', durationDays: 75, startDate: '2026-06-10', rules: ['a', 'b'], strict: true }]
    const m = reminderMessage(d, '2026-06-11')
    expect(m?.title).toContain('Day 2')
    expect(m?.body).toContain('2 of 2')
  })
})
