import { describe, it, expect } from 'vitest'
import { moodImpactRanking, weeklyDigest, sleepDebt, periodTrend, weeklyHabitTrend } from './correlations'
import { emptyJournal } from './storage'
import type { JournalData } from './types'

function logHabit(d: JournalData, habitId: string, day: string) {
  d.habitLog[day] = [...(d.habitLog[day] ?? []), habitId]
}

function addDays(iso: string, delta: number) {
  const dt = new Date(iso + 'T00:00:00')
  dt.setDate(dt.getDate() + delta)
  return dt.toISOString().slice(0, 10)
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

describe('weeklyDigest', () => {
  const today = '2026-06-30'

  it('reports streak, tasks and a rising mood trend vs the prior week', () => {
    const d = emptyJournal()
    // Recent week mood high, prior week mood low → trend up.
    for (let i = 0; i < 7; i++) d.metrics.push({ date: addDays(today, -i), mood: 8 })
    for (let i = 7; i < 14; i++) d.metrics.push({ date: addDays(today, -i), mood: 4 })
    const dig = weeklyDigest(d, today)
    expect(dig.from).toBe(addDays(today, -6))
    expect(dig.to).toBe(today)
    expect(dig.moodTrend).toBe('up')
    expect(dig.lines.find((l) => l.label === 'Logging streak')).toBeTruthy()
    expect(dig.lines.find((l) => l.label === 'Tasks done')).toBeTruthy()
  })

  it('flags the biggest win and a habit that slipped vs last week', () => {
    const d = emptyJournal()
    d.metrics.push({ date: today, mood: 7 })
    d.habits.push({ id: 'gym', name: 'Gym', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    d.habits.push({ id: 'read', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })
    // Gym done all 7 recent days → biggest win.
    for (let i = 0; i < 7; i++) logHabit(d, 'gym', addDays(today, -i))
    // Read done 5x last week, 1x this week → slip.
    for (let i = 7; i < 12; i++) logHabit(d, 'read', addDays(today, -i))
    logHabit(d, 'read', addDays(today, -1))
    const dig = weeklyDigest(d, today)
    expect(dig.win).toContain('Gym')
    expect(dig.slip).toContain('Read')
  })

  it('has a flat trend with no prior-week mood data', () => {
    const d = emptyJournal()
    for (let i = 0; i < 7; i++) d.metrics.push({ date: addDays(today, -i), mood: 6 })
    expect(weeklyDigest(d, today).moodTrend).toBe('flat')
  })
})

describe('sleepDebt', () => {
  const today = '2026-06-30'

  it('accrues a running deficit below target and pays it back above target', () => {
    const d = emptyJournal()
    // Two short nights then one long night.
    d.metrics.push({ date: addDays(today, -2), sleep: 6 }) // -2 → debt 2
    d.metrics.push({ date: addDays(today, -1), sleep: 6 }) // -2 → debt 4
    d.metrics.push({ date: today, sleep: 10 }) // +2 → debt 2
    const series = sleepDebt(d, 8, 3, today)
    expect(series).toHaveLength(3)
    expect(series[0].debt).toBe(2)
    expect(series[1].debt).toBe(4)
    expect(series[2].debt).toBe(2)
  })

  it('clamps debt at zero and ignores unlogged nights', () => {
    const d = emptyJournal()
    d.metrics.push({ date: today, sleep: 12 }) // way over → clamps to 0
    const series = sleepDebt(d, 8, 2, today)
    expect(series[0].sleep).toBeNull()
    expect(series[0].debt).toBe(0)
    expect(series[1].debt).toBe(0)
  })
})

describe('periodTrend / weeklyHabitTrend', () => {
  it('computes signed percentage change and direction', () => {
    expect(periodTrend(12, 10)).toEqual({ pct: 20, dir: 'up' })
    expect(periodTrend(8, 10)).toEqual({ pct: -20, dir: 'down' })
    expect(periodTrend(10, 10)).toEqual({ pct: 0, dir: 'flat' })
    expect(periodTrend(5, 0)).toEqual({ pct: 100, dir: 'up' })
    expect(periodTrend(0, 0)).toEqual({ pct: 0, dir: 'flat' })
  })

  it('reads habit completions this week vs last week as a trend', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    for (let i = 0; i < 6; i++) logHabit(d, 'h', addDays(today, -i)) // 6 this week
    for (let i = 7; i < 10; i++) logHabit(d, 'h', addDays(today, -i)) // 3 last week
    expect(weeklyHabitTrend(d, today).dir).toBe('up')
  })
})
