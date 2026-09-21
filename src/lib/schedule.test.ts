import { describe, it, expect } from 'vitest'
import { habitsDueOn, isScheduledOn } from './schedule'
import { trackerSummary } from './habitStats'
import { missesFor } from './penalties'
import type { Habit, JournalData } from './types'

/**
 * COD-199 · the surfaces that ask "what is due today" must give one answer.
 *
 * Seven call sites re-typed the weekday half of `isScheduledOn` inline and
 * dropped the `startedOn` half. Nothing failed, because two hand-written
 * filters that agree with each other look correct in review — so these are the
 * assertions that fail when they drift again. Each test is named for the
 * symptom a user would have seen, not for the function.
 */

const base: Habit = {
  id: 'h1',
  name: 'Read',
  category: 'wellness',
  color: 'peach',
  startedOn: '2026-06-10',
} as Habit

function journal(habits: Habit[], log: Record<string, string[]> = {}): JournalData {
  return {
    habits,
    habitLog: log,
    habitValues: {},
    habitSkips: {},
    habitNotes: {},
    entries: [],
    metrics: [],
    workouts: [],
    memories: [],
    gratitude: [],
    collections: [],
    challenges: [],
    settings: {},
  } as unknown as JournalData
}

describe('a habit that has not started yet', () => {
  const future: Habit = { ...base, id: 'later', name: 'Marathon plan', startedOn: '2026-07-01' }

  it('is not offered to tick', () => {
    expect(isScheduledOn(future, '2026-06-20')).toBe(false)
    expect(habitsDueOn(journal([future]), '2026-06-20')).toEqual([])
  })

  it('is not counted as missed, so it earns no make-up work', () => {
    // The bug: `missesFor` tested the weekday only, so a habit due to begin in
    // July was reported as missed every day of June and set a penalty tier.
    const report = missesFor(journal([future]), '2026-06-20')
    expect(report.items.some((i) => i.includes('Marathon plan'))).toBe(false)
  })

  it('appears the day it starts, inclusive', () => {
    expect(isScheduledOn(future, '2026-07-01')).toBe(true)
    expect(habitsDueOn(journal([future]), '2026-07-01')).toHaveLength(1)
  })
})

describe('slipping on an avoid habit', () => {
  // `habitDoneOn` is true for an avoid habit when you LOGGED it — which means
  // you slipped. Trackers' header counted that toward "done", so failing made
  // the number go up. `buildOnly` is what keeps a ratio honest.
  const build: Habit = { ...base, id: 'read' }
  const avoid: Habit = { ...base, id: 'sugar', name: 'No sugar', avoid: true } as Habit
  const data = journal([build, avoid], { '2026-06-20': ['sugar'] })

  it('is excluded from the denominator a completion ratio uses', () => {
    const due = habitsDueOn(data, '2026-06-20', { buildOnly: true })
    expect(due.map((h) => h.id)).toEqual(['read'])
  })

  it('still appears on a surface that renders it as a chip to tap', () => {
    const due = habitsDueOn(data, '2026-06-20')
    expect(due.map((h) => h.id)).toEqual(['read', 'sugar'])
  })

  it('does not push the day above 0% when the build habit was missed', () => {
    // The whole point: one slip, one untouched build habit, 0% done.
    expect(trackerSummary(data, () => 0, '2026-06-20').todayPct).toBe(0)
  })
})

describe("Trackers' header count and its own stat bar", () => {
  // They sit 60px apart on the same page and used to come from two different
  // filters — `trackerSummary` via `isScheduledOn` over build habits, the card
  // header via a weekday-only test over every habit including avoid ones.
  const habits: Habit[] = [
    { ...base, id: 'a', name: 'Read' },
    { ...base, id: 'b', name: 'Water' },
    { ...base, id: 'c', name: 'No sugar', avoid: true } as Habit,
    { ...base, id: 'd', name: 'Not yet', startedOn: '2026-09-01' },
    { ...base, id: 'e', name: 'Sundays only', activeDays: [0] } as Habit,
  ]
  const data = journal(habits, { '2026-06-20': ['a', 'c'] }) // Sat; 'a' done, 'c' slipped

  it('agree on how many habits the day asked for', () => {
    const header = habitsDueOn(data, '2026-06-20', { buildOnly: true })
    const summary = trackerSummary(data, () => 0, '2026-06-20')
    const headerPct = header.length
      ? Math.round((header.filter((h) => (data.habitLog['2026-06-20'] ?? []).includes(h.id)).length / header.length) * 100)
      : 0
    expect(header.map((h) => h.id)).toEqual(['a', 'b'])
    expect(headerPct).toBe(summary.todayPct)
  })
})

describe('archived habits', () => {
  const live: Habit = { ...base, id: 'live' }
  const gone: Habit = { ...base, id: 'gone', archived: true } as Habit
  const data = journal([live, gone])

  it('are out by default', () => {
    expect(habitsDueOn(data, '2026-06-20').map((h) => h.id)).toEqual(['live'])
  })

  it("come back for Trackers' show-archived setting", () => {
    expect(habitsDueOn(data, '2026-06-20', { includeArchived: true }).map((h) => h.id)).toEqual(['live', 'gone'])
  })
})

describe('checkOnly', () => {
  // Evening's close-out renders a checkbox and has no stepper, so a count habit
  // there would be a control that cannot express its own value. That exclusion
  // is a per-surface shape, not an accident, and it is spelled out rather than
  // re-derived at the call site.
  const check: Habit = { ...base, id: 'read' }
  const count: Habit = { ...base, id: 'water', type: 'count', target: 8 } as Habit
  const data = journal([check, count])

  it('drops count, timer and rating habits', () => {
    expect(habitsDueOn(data, '2026-06-20', { checkOnly: true }).map((h) => h.id)).toEqual(['read'])
  })

  it('keeps them for a surface that can render a stepper', () => {
    expect(habitsDueOn(data, '2026-06-20').map((h) => h.id)).toEqual(['read', 'water'])
  })
})
