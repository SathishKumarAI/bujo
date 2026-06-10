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
