import { describe, it, expect } from 'vitest'
import { moodImpactRanking, weeklyDigest, sleepDebt, periodTrend, weeklyHabitTrend, habitWeekdayPerformance, streakLeaderboard, habitConsistencyScore, habitMonthlyDeltas, bestWorstWeekday, weekdayWeekendSplit, metricVolatility, momentumIndicator } from './correlations'
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

describe('habitWeekdayPerformance', () => {
  // 2026-06-29 is a Monday; use a window that covers several of each weekday.
  it('picks the strongest and weakest weekday by success rate', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-06-01' })
    const today = '2026-06-30' // Tuesday
    // Always done on Mondays (1), never on Sundays (0).
    let day = '2026-06-01'
    while (day <= today) {
      const wd = new Date(day + 'T00:00:00').getDay()
      if (wd === 1) logHabit(d, 'h', day)
      day = addDays(day, 1)
    }
    const rep = habitWeekdayPerformance(d, 'h', today)
    expect(rep.best?.weekday).toBe(1) // Monday: rate 1
    expect(rep.best?.rate).toBe(1)
    // Several never-done weekdays tie at 0; worst is just one of them at rate 0.
    expect(rep.worst?.rate).toBe(0)
    expect(rep.rows).toHaveLength(7)
  })

  it('returns no best/worst when every weekday has the same rate', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-06-01' })
    const today = '2026-06-30'
    let day = '2026-06-01'
    while (day <= today) { logHabit(d, 'h', day); day = addDays(day, 1) } // done every day → all rates 1
    const rep = habitWeekdayPerformance(d, 'h', today)
    expect(rep.best).toBeNull()
    expect(rep.worst).toBeNull()
  })

  it('respects activeDays so off-days are never scheduled', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'h', name: 'Gym', category: 'movement', color: 'teal', startedOn: '2026-06-01', activeDays: [1, 3, 5] })
    const rep = habitWeekdayPerformance(d, 'h', '2026-06-30')
    expect(rep.rows[0].scheduled).toBe(0) // Sunday never scheduled
    expect(rep.rows[1].scheduled).toBeGreaterThan(0) // Monday is active
  })
})

describe('streakLeaderboard', () => {
  it('ranks habits by current streak then best, excluding avoid/archived and zero-streak', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.habits.push({ id: 'a', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })
    d.habits.push({ id: 'b', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    d.habits.push({ id: 'q', name: 'No booze', category: 'wellness', color: 'red', startedOn: '2026-01-01', avoid: true })
    d.habits.push({ id: 'z', name: 'Never', category: 'wellness', color: 'sky', startedOn: '2026-01-01' })
    for (let i = 0; i < 5; i++) logHabit(d, 'a', addDays(today, -i)) // current 5
    for (let i = 0; i < 2; i++) logHabit(d, 'b', addDays(today, -i)) // current 2
    const board = streakLeaderboard(d, today)
    expect(board.map((r) => r.habitId)).toEqual(['a', 'b'])
    expect(board[0].current).toBe(5)
    expect(board.find((r) => r.habitId === 'q')).toBeUndefined() // avoid excluded
    expect(board.find((r) => r.habitId === 'z')).toBeUndefined() // zero-streak dropped
  })

  it('reports an all-time best higher than the current streak', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.habits.push({ id: 'a', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })
    // A long past run (10 days), a gap, then a short current run (2 days).
    for (let i = 0; i < 10; i++) logHabit(d, 'a', addDays(today, -(20 + i)))
    for (let i = 0; i < 2; i++) logHabit(d, 'a', addDays(today, -i))
    const board = streakLeaderboard(d, today)
    expect(board[0].current).toBe(2)
    expect(board[0].best).toBe(10)
  })
})

describe('habitConsistencyScore', () => {
  it('weights recent days more heavily than old ones', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-06-01' })
    // Done the last 5 days, nothing before → high (recency-weighted) score.
    for (let i = 0; i < 5; i++) logHabit(d, 'h', addDays(today, -i))
    const recentStrong = habitConsistencyScore(d, 'h', 10, today)!

    const d2 = emptyJournal()
    d2.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-06-01' })
    // Same count of done days but they're the OLDEST 5 in the window → lower.
    for (let i = 5; i < 10; i++) logHabit(d2, 'h', addDays(today, -i))
    const oldStrong = habitConsistencyScore(d2, 'h', 10, today)!

    expect(recentStrong).toBeGreaterThan(oldStrong)
    expect(recentStrong).toBeLessThanOrEqual(100)
  })

  it('returns null when nothing was scheduled in the window', () => {
    const d = emptyJournal()
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2030-01-01' })
    expect(habitConsistencyScore(d, 'h', 30, '2026-06-30')).toBeNull()
  })
})

describe('habitMonthlyDeltas', () => {
  it('counts completions per month with deltas vs the prior month, oldest first', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    d.habits.push({ id: 'h', name: 'Walk', category: 'movement', color: 'green', startedOn: '2026-01-01' })
    logHabit(d, 'h', '2026-05-10')
    logHabit(d, 'h', '2026-05-20')
    logHabit(d, 'h', '2026-06-01')
    logHabit(d, 'h', '2026-06-05')
    logHabit(d, 'h', '2026-06-10')
    const pts = habitMonthlyDeltas(d, 'h', 3, today)
    expect(pts.map((p) => p.ym)).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(pts[0]).toMatchObject({ done: 0, delta: 0 })
    expect(pts[1]).toMatchObject({ done: 2, delta: 2 })
    expect(pts[2]).toMatchObject({ done: 3, delta: 1 })
  })
})

describe('bestWorstWeekday', () => {
  it('finds the brightest and dimmest weekday by average mood', () => {
    const d = emptyJournal()
    // Mondays high, Sundays low.
    d.metrics.push({ date: '2026-06-01', mood: 9 }) // Mon
    d.metrics.push({ date: '2026-06-08', mood: 8 }) // Mon
    d.metrics.push({ date: '2026-06-07', mood: 2 }) // Sun
    d.metrics.push({ date: '2026-06-14', mood: 3 }) // Sun
    const r = bestWorstWeekday(d, 'mood')
    expect(r.best?.label).toBe('Mon')
    expect(r.best?.avg).toBe(8.5)
    expect(r.best?.days).toBe(2)
    expect(r.worst?.label).toBe('Sun')
    expect(r.worst?.avg).toBe(2.5)
  })

  it('returns null best/worst when there is only one rated weekday', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-01', mood: 7 })
    d.metrics.push({ date: '2026-06-08', mood: 6 })
    const r = bestWorstWeekday(d, 'mood')
    expect(r.best).toBeNull()
    expect(r.worst).toBeNull()
  })

  it('works on other metric keys', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-06', sleep: 9 }) // Sat
    d.metrics.push({ date: '2026-06-01', sleep: 5 }) // Mon
    const r = bestWorstWeekday(d, 'sleep')
    expect(r.best?.label).toBe('Sat')
    expect(r.worst?.label).toBe('Mon')
  })
})

describe('weekdayWeekendSplit', () => {
  it('splits habit completion and mood by weekday vs weekend', () => {
    const d = emptyJournal()
    const today = '2026-06-14' // Sun
    d.habits.push({ id: 'h', name: 'Read', category: 'wellness', color: 'sky', startedOn: '2026-06-08' })
    // Window 2026-06-08 (Mon) .. 2026-06-14 (Sun): 5 weekdays, 2 weekend days.
    // Do it every weekday, skip every weekend.
    logHabit(d, 'h', '2026-06-08')
    logHabit(d, 'h', '2026-06-09')
    logHabit(d, 'h', '2026-06-10')
    logHabit(d, 'h', '2026-06-11')
    logHabit(d, 'h', '2026-06-12')
    // Mood: weekdays bright, weekends low.
    d.metrics.push({ date: '2026-06-08', mood: 8 })
    d.metrics.push({ date: '2026-06-13', mood: 4 }) // Sat
    d.metrics.push({ date: '2026-06-14', mood: 2 }) // Sun
    const r = weekdayWeekendSplit(d, today)
    expect(r.habitWeekday).toBe(1) // 5/5
    expect(r.habitWeekend).toBe(0) // 0/2
    expect(r.weekdayDays).toBe(5)
    expect(r.weekendDays).toBe(2)
    expect(r.moodWeekday).toBe(8)
    expect(r.moodWeekend).toBe(3) // (4+2)/2
  })

  it('returns null rates when nothing is scheduled or logged on a side', () => {
    const d = emptyJournal()
    const r = weekdayWeekendSplit(d, '2026-06-14')
    expect(r.habitWeekday).toBeNull()
    expect(r.habitWeekend).toBeNull()
    expect(r.moodWeekday).toBeNull()
    expect(r.moodWeekend).toBeNull()
  })
})

describe('metricVolatility', () => {
  it('scores a steady series high and a swingy series low', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    // Flat mood = zero SD = max stability.
    for (let i = 0; i < 6; i++) d.metrics.push({ date: addDays(today, -i), mood: 7 })
    const steady = metricVolatility(d, 'mood', 30, today)
    expect(steady.sd).toBe(0)
    expect(steady.stability).toBe(100)
    expect(steady.band).toBe('steady')

    const d2 = emptyJournal()
    // Big swings between 1 and 9.
    const vals = [1, 9, 2, 8, 1, 9]
    vals.forEach((v, i) => d2.metrics.push({ date: addDays(today, -i), mood: v }))
    const volatile = metricVolatility(d2, 'mood', 30, today)
    expect(volatile.sd).toBeGreaterThan(3)
    expect(volatile.stability).toBe(0)
    expect(volatile.band).toBe('volatile')
  })

  it('returns nulls when fewer than 3 days are logged', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    d.metrics.push({ date: today, mood: 5 })
    d.metrics.push({ date: addDays(today, -1), mood: 6 })
    const r = metricVolatility(d, 'mood', 30, today)
    expect(r.sd).toBeNull()
    expect(r.stability).toBeNull()
    expect(r.band).toBeNull()
    expect(r.days).toBe(2)
  })

  it('only counts days inside the window', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    d.metrics.push({ date: today, mood: 5 })
    d.metrics.push({ date: addDays(today, -1), mood: 5 })
    d.metrics.push({ date: addDays(today, -2), mood: 5 })
    d.metrics.push({ date: addDays(today, -40), mood: 1 }) // outside 30d window
    const r = metricVolatility(d, 'mood', 30, today)
    expect(r.days).toBe(3)
    expect(r.sd).toBe(0)
  })
})

describe('momentumIndicator', () => {
  it('flags rising and falling metrics with signed deltas', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    // Recent week (0..-6) mood ~8, prior week (-7..-13) mood ~4 → up.
    for (let i = 0; i < 7; i++) d.metrics.push({ date: addDays(today, -i), mood: 8, sleep: 6 })
    for (let i = 7; i < 14; i++) d.metrics.push({ date: addDays(today, -i), mood: 4, sleep: 6 })
    const m = momentumIndicator(d, 7, today)
    const mood = m.find((x) => x.key === 'mood')!
    expect(mood.dir).toBe('up')
    expect(mood.delta).toBe(4)
    expect(mood.recent).toBe(8)
    expect(mood.recentDays).toBe(7)
    // Sleep flat → present but flat.
    const sleep = m.find((x) => x.key === 'sleep')!
    expect(sleep.dir).toBe('flat')
    expect(sleep.delta).toBe(0)
    // Strongest move (mood) sorts first.
    expect(m[0].key).toBe('mood')
  })

  it('omits metrics without enough data on both windows', () => {
    const d = emptyJournal()
    const today = '2026-06-15'
    // Only recent-window mood, nothing prior → excluded.
    for (let i = 0; i < 3; i++) d.metrics.push({ date: addDays(today, -i), mood: 7 })
    const m = momentumIndicator(d, 7, today)
    expect(m.find((x) => x.key === 'mood')).toBeUndefined()
  })
})
