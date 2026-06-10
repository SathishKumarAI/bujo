import { describe, expect, it } from 'vitest'
import { generateDemoData } from './demo'
import { currentStreak } from './stats'
import { insights } from './correlations'

describe('generateDemoData', () => {
  it('produces a rich, deterministic dataset', () => {
    const a = generateDemoData('2026-06-10')
    const b = generateDemoData('2026-06-10')
    expect(a.entries.length).toBe(b.entries.length) // deterministic
    expect(a.metrics).toHaveLength(30)
    expect(a.entries.length).toBeGreaterThan(20)
    expect(a.workouts.length).toBeGreaterThan(0)
    expect(a.birthdays.length).toBe(3)
    expect(a.recurrences.length).toBe(2)
    expect(a.collections.length).toBeGreaterThan(0)
  })

  it('yields an active logging streak and detectable correlations', () => {
    const d = generateDemoData('2026-06-10')
    expect(currentStreak(d, '2026-06-10')).toBeGreaterThanOrEqual(20)
    // Sleep was generated to anti-correlate with stress, so an insight should surface.
    expect(insights(d).length).toBeGreaterThan(0)
  })
})
