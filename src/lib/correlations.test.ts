import { describe, it, expect } from 'vitest'
import { moodImpactRanking } from './correlations'
import { emptyJournal } from './storage'
import type { JournalData } from './types'

function logHabit(d: JournalData, habitId: string, day: string) {
  d.habitLog[day] = [...(d.habitLog[day] ?? []), habitId]
}

describe('moodImpactRanking', () => {
  it('ranks a clear-lift habit first and excludes sparse-data habits', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'gym', name: 'Gym', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    d.habits.push({ id: 'flat', name: 'Floss', category: 'wellness', color: 'teal', startedOn: '2026-01-01' })
    d.habits.push({ id: 'rare', name: 'Sauna', category: 'wellness', color: 'peach', startedOn: '2026-01-01' })

    // 5 done days for gym at high mood, 5 skipped days at low mood → big lift.
    const moods: [string, number, boolean][] = [
      ['2026-06-01', 9, true],
      ['2026-06-02', 8, true],
      ['2026-06-03', 9, true],
      ['2026-06-04', 8, true],
      ['2026-06-05', 9, true],
      ['2026-06-06', 3, false],
      ['2026-06-07', 2, false],
      ['2026-06-08', 3, false],
      ['2026-06-09', 2, false],
      ['2026-06-10', 3, false],
    ]
    for (const [day, mood, didGym] of moods) {
      d.metrics.push({ date: day, mood })
      if (didGym) logHabit(d, 'gym', day)
      // 'flat' done every day → no lift signal but plenty of paired days.
      logHabit(d, 'flat', day)
    }
    // 'rare' has only 1 done day → too sparse, excluded.
    logHabit(d, 'rare', '2026-06-01')

    const ranking = moodImpactRanking(d)
    expect(ranking[0].habitId).toBe('gym')
    expect(ranking[0].lift).toBeGreaterThan(0)
    // Sparse habit (only one side has >= minDays) is excluded.
    expect(ranking.find((r) => r.habitId === 'rare')).toBeUndefined()
  })

  it('returns nothing when no mood is logged', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'gym', name: 'Gym', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    logHabit(d, 'gym', '2026-06-01')
    expect(moodImpactRanking(d)).toEqual([])
  })
})
