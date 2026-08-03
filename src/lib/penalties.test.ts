import { describe, expect, it } from 'vitest'
import { PENALTIES, missesFor, penaltyFor, scaleTask } from './penalties'
import { emptyJournal } from './storage'
import type { Habit } from './types'

describe('penalties', () => {
  it('catalogue has exactly 300 entries with unique ids', () => {
    expect(PENALTIES).toHaveLength(300)
    expect(new Set(PENALTIES.map((p) => p.id)).size).toBe(300)
  })

  it('every tier has at least one drill', () => {
    for (const tier of ['light', 'medium', 'heavy', 'legendary'] as const) {
      expect(PENALTIES.some((p) => p.tier === tier)).toBe(true)
    }
  })

  it('no misses on an empty journal', () => {
    expect(missesFor(emptyJournal(), '2026-06-12').tier).toBeNull()
  })

  it('a broken ≥3-day streak yields a heavy penalty', () => {
    const d = emptyJournal()
    const h: Habit = { id: 'h', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01' }
    d.habits = [h]
    // done 08,09,10 (3-day streak) then missed 11 → checking on the 12th
    d.habitLog = { '2026-06-08': ['h'], '2026-06-09': ['h'], '2026-06-10': ['h'] }
    const r = missesFor(d, '2026-06-12')
    expect(r.items.some((i) => i.includes('streak'))).toBe(true)
    expect(r.tier).toBe('heavy')
  })

  it('a clean day on a quit habit is not a miss', () => {
    const d = emptyJournal()
    // An avoid habit not in habitLog means you stayed CLEAN — the success
    // state. `missesFor` used to read the same `!done` it uses for build
    // habits and report "Missed Alcohol", penalising the win.
    d.habits = [{ id: 'q', name: 'Alcohol', category: 'wellness', color: 'red', startedOn: '2026-01-01', avoid: true }]
    d.habitLog = {}
    expect(missesFor(d, '2026-06-12').items).toEqual([])
    expect(missesFor(d, '2026-06-12').tier).toBeNull()
  })

  it('a run of slips on a quit habit is never reported as a broken streak', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'q', name: 'Alcohol', category: 'wellness', color: 'red', startedOn: '2026-01-01', avoid: true }]
    // Slipped four days running, then stopped. `habitStreak` resolves through
    // `habitDoneOn`, which for an avoid habit counts SLIPS — so this used to
    // read as "Missed Alcohol (broke a 4-day streak)", i.e. a heavy penalty
    // for ending a four-day bender.
    d.habitLog = {
      '2026-06-07': ['q'], '2026-06-08': ['q'], '2026-06-09': ['q'], '2026-06-10': ['q'],
    }
    expect(missesFor(d, '2026-06-12').items).toEqual([])
  })

  it('quit habits do not inflate the tier of a real miss', () => {
    const d = emptyJournal()
    const build: Habit = { id: 'h', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01' }
    d.habits = [
      build,
      { id: 'q1', name: 'Sugar', category: 'food', color: 'pink', startedOn: '2026-01-01', avoid: true },
      { id: 'q2', name: 'Alcohol', category: 'wellness', color: 'red', startedOn: '2026-01-01', avoid: true },
    ]
    d.habitLog = {} // build habit genuinely missed; both quit habits clean
    const r = missesFor(d, '2026-06-12')
    expect(r.items).toEqual(['Missed Water'])
    // One miss, no streak → medium. With the quit habits counted it was three
    // items, which trips the `items.length >= 3` bump, so a clean day used to
    // make the penalty worse.
    expect(r.tier).toBe('medium')
  })

  it('scaleTask reduces the leading count for easier levels', () => {
    expect(scaleTask('30 burpees', 'hard')).toBe('30 burpees')
    expect(scaleTask('30 burpees', 'beginner')).toBe('12 burpees')
    expect(scaleTask('45-second plank hold', 'beginner')).toBe('18-second plank hold')
    expect(scaleTask('1 km run', 'beginner')).toBe('1 km run') // never below 1
  })

  it('penaltyFor returns a stable entry of the asked tier', () => {
    const a = penaltyFor('heavy', '2026-06-12')
    const b = penaltyFor('heavy', '2026-06-12')
    expect(a).toEqual(b)
    expect(a.tier).toBe('heavy')
  })
})
