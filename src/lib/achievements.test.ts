import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, earnedAchievements } from './achievements'
import { emptyJournal } from './storage'
import type { Entry, Workout, Fast } from './types'

const entry = (i: number): Entry => ({
  id: `e${i}`, date: '2026-06-10', type: 'note', text: `t${i}`, status: 'open',
  important: false, memory: false, tags: [], createdAt: '2026-06-10',
})
const workout = (i: number, activity = 'Strength'): Workout => ({
  id: `w${i}`, date: '2026-06-10', activity, sets: [], notes: '',
})

describe('achievements', () => {
  it('a fresh journal has earned nothing', () => {
    expect(earnedAchievements(emptyJournal())).toEqual([])
  })

  it('first entry unlocks "First words"', () => {
    const d = { ...emptyJournal(), entries: [entry(1)] }
    expect(earnedAchievements(d).map((a) => a.id)).toContain('first-entry')
  })

  it('first workout unlocks "Day one"', () => {
    const d = { ...emptyJournal(), workouts: [workout(1)] }
    const ids = earnedAchievements(d).map((a) => a.id)
    expect(ids).toContain('first-workout')
    expect(ids).not.toContain('workouts-50')
  })

  it('a 16h fast unlocks the fasting badges', () => {
    const f: Fast = { id: 'f1', start: '2026-06-10T20:00:00Z', end: '2026-06-11T12:00:00Z' }
    const ids = earnedAchievements({ ...emptyJournal(), fasts: [f] }).map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['first-fast', 'fast-16']))
  })

  it('every achievement has a unique id and a predicate', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of ACHIEVEMENTS) expect(typeof a.earned).toBe('function')
  })
})
