import { describe, it, expect } from 'vitest'
import {
  techniqueRanking, matchPlanForTrigger, streakVsBest, comebackStatus,
  urgeHourHistogram, peakUrgeHour, hourLabel,
  relapseWeekdayPattern, peakRelapseWeekday,
  urgeConversion, paceToRecord,
  urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup,
} from './urge'
import type { UrgeWin, TriggerPlan, Relapse } from './types'

const urge = (id: string, technique?: UrgeWin['technique']): UrgeWin => ({
  id, date: '2026-06-22', technique,
})

describe('techniqueRanking', () => {
  it('counts techniques, most-used first', () => {
    const log: UrgeWin[] = [
      urge('1', 'surf'), urge('2', 'surf'), urge('3', 'delay'),
      urge('4', 'surf'), urge('5', 'delay'),
    ]
    const r = techniqueRanking(log)
    expect(r).toEqual([
      { technique: 'surf', count: 3 },
      { technique: 'delay', count: 2 },
    ])
  })

  it('ignores logs missing the technique field', () => {
    const log: UrgeWin[] = [urge('1', 'halt'), urge('2'), urge('3', 'halt')]
    expect(techniqueRanking(log)).toEqual([{ technique: 'halt', count: 1 + 1 }])
  })

  it('returns [] for empty / all-untagged logs', () => {
    expect(techniqueRanking([])).toEqual([])
    expect(techniqueRanking()).toEqual([])
    expect(techniqueRanking([urge('1'), urge('2')])).toEqual([])
  })
})

describe('matchPlanForTrigger', () => {
  const plans: TriggerPlan[] = [
    { id: 'a', addiction: 'Smoking', trigger: 'after meals', coping: 'chew gum' },
    { id: 'b', addiction: 'Scrolling', trigger: 'stress at work', coping: '10-min walk' },
  ]

  it('exact match (case-insensitive)', () => {
    expect(matchPlanForTrigger(plans, 'After Meals')?.id).toBe('a')
  })

  it('partial / keyword match', () => {
    expect(matchPlanForTrigger(plans, 'stress')?.id).toBe('b')
    expect(matchPlanForTrigger(plans, 'work stress hitting')?.id).toBe('b')
  })

  it('no match returns undefined', () => {
    expect(matchPlanForTrigger(plans, 'boredom')).toBeUndefined()
    expect(matchPlanForTrigger(plans, '   ')).toBeUndefined()
    expect(matchPlanForTrigger([], 'after meals')).toBeUndefined()
  })
})

describe('streakVsBest', () => {
  it('fills proportionally toward the best', () => {
    expect(streakVsBest(5, 10)).toEqual({ current: 5, best: 10, pct: 50, daysToBeat: 5, isRecord: false })
  })

  it('marks a record when current matches or beats best', () => {
    expect(streakVsBest(10, 10)).toMatchObject({ pct: 100, daysToBeat: 0, isRecord: true })
    expect(streakVsBest(12, 10)).toMatchObject({ pct: 100, daysToBeat: 0, isRecord: true })
  })

  it('treats a zero best as already a record (nothing to beat)', () => {
    expect(streakVsBest(0, 0)).toMatchObject({ pct: 100, daysToBeat: 0, isRecord: true })
    expect(streakVsBest(3, 0)).toMatchObject({ pct: 100, isRecord: true })
  })

  it('clamps negatives', () => {
    expect(streakVsBest(-4, -2)).toMatchObject({ current: 0, best: 0, isRecord: true })
  })
})

describe('comebackStatus', () => {
  const rel = (date: string): Relapse => ({ id: date, date, trigger: '', note: '' })
  const today = '2026-06-22'

  it('fires when the current run beats the previous streak', () => {
    // prev streak: 2026-06-01 → 2026-06-06 = 5 days; current since 06-06 to 06-22 = 16 days
    const r = comebackStatus([rel('2026-06-01'), rel('2026-06-06')], '2026-06-06', today)
    expect(r).toEqual({ isComeback: true, prevStreak: 5, by: 11 })
  })

  it('does not fire while the current run is still shorter than the previous', () => {
    // prev streak 06-01→06-20 = 19 days; current since 06-20 = 2 days
    const r = comebackStatus([rel('2026-06-01'), rel('2026-06-20')], '2026-06-20', today)
    expect(r.isComeback).toBe(false)
    expect(r.prevStreak).toBe(19)
    expect(r.by).toBe(0)
  })

  it('uses a zero previous streak after a single same-day reset (nothing to beat)', () => {
    const r = comebackStatus([rel('2026-06-20')], '2026-06-20', today)
    expect(r).toEqual({ isComeback: false, prevStreak: 0, by: 0 })
  })

  it('returns no comeback when there are no relapses', () => {
    expect(comebackStatus([], '2026-06-01', today)).toEqual({ isComeback: false, prevStreak: 0, by: 0 })
  })

  it('dedupes and orders out-of-sequence relapse dates', () => {
    const r = comebackStatus([rel('2026-06-06'), rel('2026-06-01'), rel('2026-06-06')], '2026-06-06', today)
    expect(r).toEqual({ isComeback: true, prevStreak: 5, by: 11 })
  })
})

// A local-time ISO timestamp at a given hour (so getHours() round-trips).
const atHour = (h: number): string => new Date(2026, 5, 22, h, 30).toISOString()

describe('urgeHourHistogram', () => {
  it('buckets timestamped urges into a full 24-slot array', () => {
    const log: UrgeWin[] = [
      { id: '1', date: '2026-06-22', at: atHour(22) },
      { id: '2', date: '2026-06-22', at: atHour(22) },
      { id: '3', date: '2026-06-22', at: atHour(9) },
    ]
    const h = urgeHourHistogram(log)
    expect(h).toHaveLength(24)
    expect(h[22]).toEqual({ hour: 22, count: 2, heat: 1 })
    expect(h[9]).toEqual({ hour: 9, count: 1, heat: 0.5 })
    expect(h[0]).toEqual({ hour: 0, count: 0, heat: 0 })
  })

  it('skips logs without (or with an invalid) at timestamp', () => {
    const log: UrgeWin[] = [
      { id: '1', date: '2026-06-22' },
      { id: '2', date: '2026-06-22', at: 'not-a-date' },
      { id: '3', date: '2026-06-22', at: atHour(14) },
    ]
    const h = urgeHourHistogram(log)
    expect(h[14].count).toBe(1)
    expect(h.reduce((n, x) => n + x.count, 0)).toBe(1)
  })

  it('returns all-zero heat for empty / undefined input', () => {
    const h = urgeHourHistogram()
    expect(h).toHaveLength(24)
    expect(h.every((x) => x.count === 0 && x.heat === 0)).toBe(true)
  })
})

describe('peakUrgeHour', () => {
  it('returns the busiest hour with a 12-hour label', () => {
    const log: UrgeWin[] = [
      { id: '1', date: '2026-06-22', at: atHour(23) },
      { id: '2', date: '2026-06-22', at: atHour(23) },
      { id: '3', date: '2026-06-22', at: atHour(8) },
    ]
    expect(peakUrgeHour(log)).toEqual({ hour: 23, count: 2, label: '11 PM' })
  })

  it('returns undefined when nothing is timestamped', () => {
    expect(peakUrgeHour([{ id: '1', date: '2026-06-22' }])).toBeUndefined()
    expect(peakUrgeHour()).toBeUndefined()
  })
})

describe('hourLabel', () => {
  it('formats midnight, noon and PM hours', () => {
    expect(hourLabel(0)).toBe('12 AM')
    expect(hourLabel(12)).toBe('12 PM')
    expect(hourLabel(9)).toBe('9 AM')
    expect(hourLabel(21)).toBe('9 PM')
  })
})

describe('relapseWeekdayPattern', () => {
  const rel = (date: string): Relapse => ({ id: date, date, trigger: '', note: '' })

  it('counts relapses by weekday into a 7-slot array', () => {
    // 2026-06-21 is a Sunday(0); 2026-06-22 Monday(1); 2026-06-20 Saturday(6)
    const p = relapseWeekdayPattern([rel('2026-06-21'), rel('2026-06-20'), rel('2026-06-22')])
    expect(p).toHaveLength(7)
    expect(p[0]).toEqual({ day: 0, label: 'Sun', count: 1 })
    expect(p[1]).toEqual({ day: 1, label: 'Mon', count: 1 })
    expect(p[6]).toEqual({ day: 6, label: 'Sat', count: 1 })
    expect(p[3].count).toBe(0)
  })

  it('counts a duplicate date only once', () => {
    const p = relapseWeekdayPattern([rel('2026-06-20'), rel('2026-06-20')])
    expect(p[6].count).toBe(1)
  })

  it('returns all-zero for empty input', () => {
    expect(relapseWeekdayPattern().every((w) => w.count === 0)).toBe(true)
  })
})

describe('peakRelapseWeekday', () => {
  const rel = (date: string): Relapse => ({ id: date, date, trigger: '', note: '' })
  it('finds the riskiest weekday', () => {
    // two Saturdays (06-20, 06-13) vs one Monday
    const p = peakRelapseWeekday([rel('2026-06-20'), rel('2026-06-13'), rel('2026-06-22')])
    expect(p).toEqual({ day: 6, label: 'Sat', count: 2 })
  })
  it('returns undefined with no relapses', () => {
    expect(peakRelapseWeekday([])).toBeUndefined()
  })
})

describe('urgeConversion', () => {
  const urge = (id: string): UrgeWin => ({ id, date: '2026-06-22' })
  const rel = (date: string): Relapse => ({ id: date, date, trigger: '', note: '' })

  it('computes the resisted share of all urge events', () => {
    const c = urgeConversion([urge('1'), urge('2'), urge('3')], [rel('2026-06-01')])
    expect(c).toEqual({ resisted: 3, relapses: 1, total: 4, resistRate: 75 })
  })

  it('folds in pre-dated resisted wins', () => {
    const c = urgeConversion([urge('1')], [rel('2026-06-01')], 4)
    expect(c).toEqual({ resisted: 5, relapses: 1, total: 6, resistRate: 83 })
  })

  it('is 100% with wins and no resets', () => {
    expect(urgeConversion([urge('1'), urge('2')], [])).toMatchObject({ resistRate: 100 })
  })

  it('is 0% with no data at all', () => {
    expect(urgeConversion([], [])).toEqual({ resisted: 0, relapses: 0, total: 0, resistRate: 0 })
  })
})

describe('paceToRecord', () => {
  const today = '2026-06-22'

  it('projects match + beat dates while below the best', () => {
    const p = paceToRecord(10, 15, today)
    expect(p).toEqual({
      alreadyRecord: false,
      daysToMatch: 5,
      matchDate: '2026-06-27',
      beatDate: '2026-06-28',
    })
  })

  it('reports already-a-record when current >= best', () => {
    expect(paceToRecord(15, 15, today)).toEqual({ alreadyRecord: true, daysToMatch: 0 })
    expect(paceToRecord(20, 15, today)).toEqual({ alreadyRecord: true, daysToMatch: 0 })
  })

  it('clamps negative inputs', () => {
    expect(paceToRecord(-3, -1, today)).toMatchObject({ alreadyRecord: true })
  })
})

describe('urgeFrequencyTrend', () => {
  const today = '2026-06-22' // a Monday
  const day = (d: string): UrgeWin => ({ id: d, date: d })

  it('buckets urges into consecutive 7-day windows, oldest first', () => {
    // window of 2 weeks ends 06-22 → starts 06-09. Bucket0=[06-09..06-15], Bucket1=[06-16..06-22]
    const log: UrgeWin[] = [day('2026-06-10'), day('2026-06-12'), day('2026-06-20')]
    const t = urgeFrequencyTrend(log, 2, today)
    expect(t.weeks).toHaveLength(2)
    expect(t.weeks[0]).toEqual({ weekStart: '2026-06-09', count: 2 })
    expect(t.weeks[1]).toEqual({ weekStart: '2026-06-16', count: 1 })
    expect(t.total).toBe(3)
    expect(t.avgPerWeek).toBe(1.5)
    expect(t.delta).toBe(-1) // last(1) − first(2)
  })

  it('ignores urges outside the window and prefers the at timestamp', () => {
    const log: UrgeWin[] = [
      { id: 'a', date: '2026-01-01' }, // way before window
      { id: 'b', date: '2026-06-30' }, // after today
      { id: 'c', date: '2026-06-01', at: '2026-06-20T10:00:00.000Z' }, // at wins → in window
    ]
    const t = urgeFrequencyTrend(log, 2, today)
    expect(t.total).toBe(1)
    expect(t.weeks[1].count).toBe(1)
  })

  it('reports a downward direction when later weeks ease off', () => {
    const log: UrgeWin[] = [
      day('2026-06-02'), day('2026-06-03'), day('2026-06-04'), // earliest week heavy
      day('2026-06-20'), // recent week light
    ]
    const t = urgeFrequencyTrend(log, 3, today)
    expect(t.direction).toBe('down')
  })

  it('is flat / empty for no logs', () => {
    const t = urgeFrequencyTrend([], 4, today)
    expect(t.total).toBe(0)
    expect(t.direction).toBe('flat')
    expect(t.weeks).toHaveLength(4)
  })
})

describe('streaksSaved', () => {
  const today = '2026-06-22'
  it('counts the log plus pre-dated wins, and today separately', () => {
    const log: UrgeWin[] = [
      { id: '1', date: '2026-06-22' },
      { id: '2', date: '2026-06-22', at: '2026-06-22T09:00:00.000Z' },
      { id: '3', date: '2026-06-10' },
    ]
    expect(streaksSaved(log, 4, today)).toEqual({ saved: 7, savedToday: 2 })
  })

  it('handles empty input', () => {
    expect(streaksSaved([], 0, today)).toEqual({ saved: 0, savedToday: 0 })
    expect(streaksSaved(undefined, -3, today)).toEqual({ saved: 0, savedToday: 0 })
  })
})

describe('intensityStats', () => {
  const u = (id: string, intensity?: UrgeWin['intensity']): UrgeWin => ({ id, date: '2026-06-22', intensity })

  it('buckets, averages and finds the mode', () => {
    const log: UrgeWin[] = [u('1', 5), u('2', 3), u('3', 5), u('4', 1)]
    const s = intensityStats(log)
    expect(s.rated).toBe(4)
    expect(s.buckets).toEqual([1, 0, 1, 0, 2]) // levels 1,3,5,5
    expect(s.avg).toBe(3.5)
    expect(s.mode).toBe(5)
  })

  it('reports a negative trend when recent urges are milder', () => {
    // earlier half strong (5,5), recent half weak (1,1)
    const log: UrgeWin[] = [u('1', 5), u('2', 5), u('3', 1), u('4', 1)]
    expect(intensityStats(log).trend).toBe(-4)
  })

  it('ignores unrated / out-of-range entries', () => {
    const log: UrgeWin[] = [u('1'), u('2', 4), { id: '3', date: '2026-06-22', intensity: 9 as unknown as UrgeWin['intensity'] }]
    const s = intensityStats(log)
    expect(s.rated).toBe(1)
    expect(s.avg).toBe(4)
  })

  it('returns zeros with no rated urges', () => {
    expect(intensityStats([])).toEqual({ buckets: [0, 0, 0, 0, 0], rated: 0, avg: 0, mode: undefined, trend: 0 })
  })
})

describe('cleanRollup', () => {
  const today = '2026-06-22' // Monday
  const rel = (date: string): Relapse => ({ id: date, date, trigger: '', note: '' })

  it('counts fully reset-free weeks and months in the span', () => {
    // Journey from 2026-05-01 to 2026-06-22, one reset on 2026-05-15.
    const r = cleanRollup([rel('2026-05-15')], '2026-05-01', today)
    // May + June = 2 months; May dirtied → 1 clean month.
    expect(r.totalMonths).toBe(2)
    expect(r.cleanMonths).toBe(1)
    // One reset dirties exactly one week; the rest of the spanned weeks are clean.
    expect(r.cleanWeeks).toBe(r.totalWeeks - 1)
    expect(r.totalWeeks).toBeGreaterThan(1)
  })

  it('treats the whole span as clean when there are no resets', () => {
    const r = cleanRollup([], '2026-06-01', today)
    expect(r.cleanWeeks).toBe(r.totalWeeks)
    expect(r.cleanMonths).toBe(r.totalMonths)
    expect(r.totalMonths).toBe(1) // all June
  })

  it('extends the span back to a relapse earlier than startedOn', () => {
    // startedOn after a reset that lives in an earlier month.
    const r = cleanRollup([rel('2026-04-10')], '2026-06-20', today)
    expect(r.totalMonths).toBe(3) // Apr, May, Jun
    expect(r.cleanMonths).toBe(2) // Apr dirtied
  })

  it('collapses duplicate reset dates', () => {
    const r = cleanRollup([rel('2026-06-10'), rel('2026-06-10')], '2026-06-01', today)
    expect(r.cleanWeeks).toBe(r.totalWeeks - 1)
  })

  it('handles a future startedOn defensively', () => {
    expect(cleanRollup([], '2026-12-01', today)).toEqual({ cleanWeeks: 0, cleanMonths: 0, totalWeeks: 0, totalMonths: 0 })
  })
})
