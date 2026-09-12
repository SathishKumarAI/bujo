import { describe, expect, it } from 'vitest'
import { pace } from './pace'
import { emptyJournal } from './storage'

const withDays = (days: string[]) => {
  const d = emptyJournal()
  d.metrics = days.map((date) => ({ date, mood: 7 }))
  return d
}

describe('pace', () => {
  it('counts today as still available, not as spent', () => {
    const p = pace(emptyJournal(), '2026-09-11')
    expect(p.month).toMatchObject({ total: 30, past: 10, left: 20 })
    expect(p.year).toMatchObject({ total: 365, past: 253, left: 112 })
  })

  it('is null, not zero, before a full day has passed', () => {
    const p = pace(withDays(['2026-09-01']), '2026-09-01')
    expect(p.month.past).toBe(0)
    expect(p.month.rate).toBeNull()
    expect(p.month.projected).toBeNull()
  })

  it('projects the month at the rate of the days that are over', () => {
    const p = pace(withDays(['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-07', '2026-09-09']), '2026-09-11')
    expect(p.month.logged).toBe(5)
    expect(p.month.rate).not.toBeNull()
    expect(p.month.rate).toBeCloseTo(0.5)
    expect(p.month.projected).toBe(15)
  })

  it('ignores days dated after today — scheduling is not logging', () => {
    const p = pace(withDays(['2026-09-05', '2026-09-30']), '2026-09-11')
    expect(p.month.logged).toBe(1)
    expect(p.year.logged).toBe(1)
  })

  it('never projects fewer days than are already logged', () => {
    const d = withDays(Array.from({ length: 11 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`))
    const p = pace(d, '2026-09-11')
    expect(p.month.logged).toBe(11)
    expect(p.month.projected).toBe(30)
  })

  it('knows leap years and keeps a week left in late December', () => {
    expect(pace(emptyJournal(), '2028-03-01').year.total).toBe(366)
    const dec = pace(emptyJournal(), '2026-12-31')
    expect(dec.week).toMatchObject({ index: 53, total: 53, left: 0 })
    expect(dec.month.left).toBe(1)
    const nye = pace(emptyJournal(), '2026-12-29')
    expect(nye.week.index).toBe(52)
    expect(nye.week.left).toBe(1)
  })

  it('week 1 is the first seven days of January', () => {
    expect(pace(emptyJournal(), '2026-01-07').week.index).toBe(1)
    expect(pace(emptyJournal(), '2026-01-08').week.index).toBe(2)
  })
})
