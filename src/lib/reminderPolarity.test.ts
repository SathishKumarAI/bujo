import { describe, expect, it } from 'vitest'
import { reminderMessage } from './stats'
import { recommendations } from './recommend'
import { emptyJournal, migrate, seedJournal } from './storage'
import type { Habit } from './types'

const quit = (id: string, name: string): Habit => ({
  id, name, category: 'wellness', color: 'red', startedOn: '2026-01-01', avoid: true,
})

/**
 * Quit habits invert `habitLog`: a tick means you gave in. Both of these
 * surfaces read the build-habit meaning and so addressed the user as though a
 * run of relapses were an achievement worth protecting.
 */
describe('nudges never tell you to keep a bad habit going', () => {
  it('reminderMessage does not ask you to log a quit habit', () => {
    const d = emptyJournal()
    d.habits = [quit('q', 'Alcohol')]
    // Four straight days of giving in. `habitStreak` counts those as a streak.
    d.habitLog = {
      '2026-06-07': ['q'], '2026-06-08': ['q'], '2026-06-09': ['q'], '2026-06-10': ['q'],
    }
    const r = reminderMessage(d, '2026-06-11')
    // It used to return "🔥 4-day Alcohol streak at risk" / "Log Alcohol today
    // to keep your 4-day streak alive."
    expect(r?.body ?? '').not.toMatch(/Log Alcohol/i)
    expect(r?.title ?? '').not.toMatch(/Alcohol/i)
  })

  it('reminderMessage still fires for a genuine build-habit streak', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'w', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01' }]
    d.habitLog = { '2026-06-08': ['w'], '2026-06-09': ['w'], '2026-06-10': ['w'] }
    expect(reminderMessage(d, '2026-06-11')?.title).toMatch(/Water/)
  })

  it('recommendations do not celebrate a run of relapses', () => {
    const d = emptyJournal()
    d.habits = [quit('q', 'Alcohol')]
    const log: Record<string, string[]> = {}
    for (let i = 1; i <= 20; i++) log[`2026-06-${String(i).padStart(2, '0')}`] = ['q']
    d.habitLog = log
    const texts = recommendations(d, '2026-06-20').map((r) => r.text)
    // It used to produce "Alcohol is on a 20-day streak — turn it into a
    // challenge" and "Set a weekly goal for Alcohol", which for a quit habit
    // would mean a target number of times per week to drink.
    expect(texts.filter((t) => /Alcohol/.test(t))).toEqual([])
  })
})

describe('the starter journal labels its quit habits', () => {
  it('seeds Sugar and Alcohol as avoid habits', () => {
    const j = seedJournal()
    const byName = (n: string) => j.habits.find((h) => h.name === n)
    // Without this, a new user's journal treats drinking as a goal: the tick
    // scores a perfect day and staying sober reads as "Missed Alcohol".
    expect(byName('Alcohol')?.avoid).toBe(true)
    expect(byName('Sugar')?.avoid).toBe(true)
    // Caffeine is seeded with the cue "With breakfast" — intended, not quit.
    expect(byName('Caffeine')?.avoid).toBeUndefined()
  })
})

describe('migrating a journal seeded before avoid existed', () => {
  const seeded = (name: string, extra: Partial<Habit> = {}): Habit => ({
    id: name, name, category: 'stimulant', color: 'red', startedOn: '2026-01-01', ...extra,
  })

  it('flips the starter Sugar and Alcohol to avoid habits', () => {
    const m = migrate({ habits: [seeded('Sugar'), seeded('Alcohol'), seeded('Caffeine')] })
    expect(m.habits.find((h) => h.name === 'Sugar')?.avoid).toBe(true)
    expect(m.habits.find((h) => h.name === 'Alcohol')?.avoid).toBe(true)
    // Caffeine is seeded as something you intend to have, so it is not touched.
    expect(m.habits.find((h) => h.name === 'Caffeine')?.avoid).toBeUndefined()
  })

  it('leaves a habit the user already gave a polarity', () => {
    const m = migrate({ habits: [seeded('Alcohol', { avoid: false })] })
    expect(m.habits[0].avoid).toBe(false)
  })

  it('leaves a same-named habit the user recategorised', () => {
    const m = migrate({ habits: [seeded('Sugar', { category: 'food' })] })
    expect(m.habits[0].avoid).toBeUndefined()
  })

  it('is idempotent — migrate() runs on every load', () => {
    const once = migrate({ habits: [seeded('Alcohol')] })
    const twice = migrate(once)
    expect(twice.habits).toEqual(once.habits)
  })

  it('does not touch habitLog — the ticks already say what happened', () => {
    const log = { '2026-06-11': ['Alcohol'] }
    const m = migrate({ habits: [seeded('Alcohol')], habitLog: log })
    expect(m.habitLog).toEqual(log)
  })
})
