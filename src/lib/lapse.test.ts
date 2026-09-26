import { describe, it, expect } from 'vitest'
import {
  lapseDays, lapseTotal, lapseCountOn, hasLapseQuantity,
  lapseByWeekday, peakLapseWeekday, lapseTrend, bumpLapseDay,
} from './lapse'
import type { Relapse } from './types'

/** 2026-06-21 is a Sunday; 2026-06-22 a Monday. Weekdays are asserted, not assumed. */
const lapse = (date: string, count?: number): Relapse =>
  ({ id: date + ':' + (count ?? 1), date, trigger: '', note: '', ...(count == null ? {} : { count }) })

describe('bumpLapseDay', () => {
  let n = 0
  const id = () => `r${++n}`
  const streak = (startedOn: string, best: number, relapses: Relapse[] = []) => ({ startedOn, best, relapses })

  it('resets the streak once, not ten times, for ten taps on one day', () => {
    let s = streak('2026-06-01', 24)
    for (let i = 0; i < 10; i++) s = bumpLapseDay(s, '2026-06-21', 1, id)
    expect(s.relapses).toHaveLength(1)
    expect(s.relapses[0].count).toBe(10)
    expect(s.startedOn).toBe('2026-06-21')
  })

  it('banks the streak length as a new best on the first tap of the day', () => {
    const s = bumpLapseDay(streak('2026-06-01', 3), '2026-06-21', 1, id)
    expect(s.best).toBe(20)
  })

  it('does not let a second tap the same day overwrite a hard-won best', () => {
    const first = bumpLapseDay(streak('2026-06-01', 3), '2026-06-21', 1, id)
    const second = bumpLapseDay(first, '2026-06-21', 1, id)
    expect(second.best).toBe(20)
    expect(second.startedOn).toBe('2026-06-21')
  })

  it('increments the existing row and keeps its trigger and reflection', () => {
    const logged: Relapse = { id: 'r0', date: '2026-06-21', trigger: 'Stress', note: 'rough day' }
    const s = bumpLapseDay(streak('2026-06-21', 9, [logged]), '2026-06-21', 1, id)
    expect(s.relapses).toHaveLength(1)
    expect(s.relapses[0]).toMatchObject({ trigger: 'Stress', note: 'rough day', count: 2 })
  })

  it('walks an over-tap back down but floors at one — the day still happened', () => {
    let s = bumpLapseDay(streak('2026-06-01', 0), '2026-06-21', 1, id)
    s = bumpLapseDay(s, '2026-06-21', 1, id)
    s = bumpLapseDay(s, '2026-06-21', -1, id)
    expect(s.relapses[0].count).toBe(1)
    s = bumpLapseDay(s, '2026-06-21', -1, id)
    expect(s.relapses[0].count).toBe(1)
  })

  it('is a no-op on a clean day, so a minus tap cannot reset the streak', () => {
    const before = streak('2026-06-01', 5)
    expect(bumpLapseDay(before, '2026-06-21', -1, id)).toBe(before)
  })

  it('leaves the streak object it was handed untouched', () => {
    const before = streak('2026-06-01', 5)
    bumpLapseDay(before, '2026-06-21', 1, id)
    expect(before.relapses).toHaveLength(0)
    expect(before.startedOn).toBe('2026-06-01')
  })
})

describe('lapseDays', () => {
  it('reads a journal written before count existed as one occurrence a day', () => {
    const rs: Relapse[] = [lapse('2026-06-21'), lapse('2026-06-28')]
    expect(lapseDays(rs)).toEqual([
      { date: '2026-06-21', count: 1 },
      { date: '2026-06-28', count: 1 },
    ])
  })

  it('keeps ten cigarettes as one day of ten, not ten days', () => {
    expect(lapseDays([lapse('2026-06-21', 10)])).toEqual([{ date: '2026-06-21', count: 10 }])
  })

  it('sums two rows that share a date instead of dropping one', () => {
    // The one-row-per-day invariant is new; an older journal can hold two.
    expect(lapseDays([lapse('2026-06-21', 4), lapse('2026-06-21', 3)]))
      .toEqual([{ date: '2026-06-21', count: 7 }])
  })

  it('sorts oldest first whatever order the rows arrive in', () => {
    const rs = [lapse('2026-06-28'), lapse('2026-06-01'), lapse('2026-06-15')]
    expect(lapseDays(rs).map((d) => d.date)).toEqual(['2026-06-01', '2026-06-15', '2026-06-28'])
  })

  it('floors a zero or negative count at one — the row means the day happened', () => {
    expect(lapseDays([lapse('2026-06-21', 0)])).toEqual([{ date: '2026-06-21', count: 1 }])
  })

  it('skips a row with no date rather than throwing', () => {
    const rs = [{ id: 'x', date: '', trigger: '', note: '' }, lapse('2026-06-21', 2)]
    expect(lapseDays(rs)).toEqual([{ date: '2026-06-21', count: 2 }])
  })
})

describe('lapseTotal / lapseCountOn / hasLapseQuantity', () => {
  it('totals occurrences, not days', () => {
    expect(lapseTotal([lapse('2026-06-21', 10), lapse('2026-06-22', 4)])).toBe(14)
  })

  it('reads zero for a clean day, which is not the same as an unlogged one', () => {
    const rs = [lapse('2026-06-21', 10)]
    expect(lapseCountOn(rs, '2026-06-21')).toBe(10)
    expect(lapseCountOn(rs, '2026-06-22')).toBe(0)
  })

  it('reports no quantity when every lapse day is a bare once', () => {
    expect(hasLapseQuantity([lapse('2026-06-21'), lapse('2026-06-22')])).toBe(false)
  })

  it('reports a quantity as soon as one day holds more than one', () => {
    expect(hasLapseQuantity([lapse('2026-06-21'), lapse('2026-06-22', 2)])).toBe(true)
  })
})

describe('lapseByWeekday', () => {
  it('returns a null average for a weekday with no lapse day, never zero', () => {
    const w = lapseByWeekday([lapse('2026-06-21', 10)]) // Sunday
    expect(w).toHaveLength(7)
    const sun = w[0]
    expect(sun.label).toBe('Sun')
    expect(sun.avg).not.toBeNull()
    expect(sun.avg).toBe(10)
    // Monday had no lapse at all — a 0 here would read as "you scored zero".
    expect(w[1].days).toBe(0)
    expect(w[1].avg).toBeNull()
  })

  it('averages per lapse day, so a clean Sunday does not dilute the figure', () => {
    // Two Sundays smoked (10 and 8), three clean Sundays in between.
    const rs = [lapse('2026-06-07', 10), lapse('2026-06-28', 8)]
    const sun = lapseByWeekday(rs)[0]
    expect(sun.days).toBe(2)
    expect(sun.total).toBe(18)
    expect(sun.avg).toBe(9)
  })

  it('puts a Monday lapse on Monday and not on Sunday', () => {
    const w = lapseByWeekday([lapse('2026-06-22', 3)])
    expect(w[0].avg).toBeNull()
    expect(w[1].label).toBe('Mon')
    expect(w[1].avg).toBe(3)
  })
})

describe('peakLapseWeekday', () => {
  it('picks the highest average, not the most lapse days', () => {
    // Mondays: three days of 1 (avg 1). Sunday: one day of 10 (avg 10).
    const rs = [
      lapse('2026-06-01'), lapse('2026-06-08'), lapse('2026-06-15'),
      lapse('2026-06-21', 10),
    ]
    expect(peakLapseWeekday(rs)?.label).toBe('Sun')
  })

  it('is undefined for a streak with no lapse at all', () => {
    expect(peakLapseWeekday([])).toBeUndefined()
  })
})

describe('lapseTrend', () => {
  it('buckets occurrences by week and sums counts rather than counting days', () => {
    const today = '2026-06-28'
    // 2 weeks: [06-15..06-21] and [06-22..06-28].
    const t = lapseTrend([lapse('2026-06-21', 10), lapse('2026-06-28', 4)], 2, today)
    expect(t.weeks).toEqual([
      { weekStart: '2026-06-15', count: 10 },
      { weekStart: '2026-06-22', count: 4 },
    ])
    expect(t.total).toBe(14)
    expect(t.avgPerWeek).toBe(7)
  })

  it('ignores a lapse older than the window instead of folding it into week one', () => {
    const t = lapseTrend([lapse('2026-01-01', 50), lapse('2026-06-28', 2)], 2, '2026-06-28')
    expect(t.total).toBe(2)
  })

  it('calls a halved second half down, and the reverse up', () => {
    const rs = [lapse('2026-06-07', 10), lapse('2026-06-21', 2)]
    expect(lapseTrend(rs, 4, '2026-06-28').direction).toBe('down')
    const up = [lapse('2026-06-07', 2), lapse('2026-06-21', 10)]
    expect(lapseTrend(up, 4, '2026-06-28').direction).toBe('up')
  })

  it('calls a steady rate flat rather than up, so one week cannot flip it', () => {
    const rs = [lapse('2026-06-07', 5), lapse('2026-06-14', 5), lapse('2026-06-21', 5), lapse('2026-06-28', 5)]
    expect(lapseTrend(rs, 4, '2026-06-28').direction).toBe('flat')
  })

  it('returns an empty-but-drawable window for a streak with no lapses', () => {
    const t = lapseTrend([], 4, '2026-06-28')
    expect(t.weeks).toHaveLength(4)
    expect(t.total).toBe(0)
    expect(t.direction).toBe('flat')
  })
})
