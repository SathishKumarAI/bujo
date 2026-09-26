import { describe, expect, it } from 'vitest'
import type { CyclePoint } from './types'
import { addDays } from './date'
import {
  avgCycleLength, coverline, cycleDay, cycleHistory, daysUntilNextPeriod,
  flagPatternByDay, nextPeriodEstimate, periodStarts, phaseBands, phaseOf,
} from './cycleInsights'

const p = (date: string, flags: string[] = ['period']): CyclePoint => ({ date, flags })

describe('periodStarts finds the first day of each flagged run', () => {
  it('collapses consecutive flagged days into one start', () => {
    const starts = periodStarts([p('2026-08-01'), p('2026-08-02'), p('2026-08-03'), p('2026-08-29'), p('2026-08-30')])
    expect(starts).toEqual(['2026-08-01', '2026-08-29'])
  })

  it('ignores entries without the period flag', () => {
    expect(periodStarts([p('2026-08-01', ['cramps']), p('2026-08-02', ['spotting'])])).toEqual([])
  })
})

describe('cycleDay counts from the latest start on or before today', () => {
  it('is 1-based on the start day itself', () => {
    const d = cycleDay([p('2026-09-01')], '2026-09-01')
    expect(d).not.toBeNull()
    expect(d).toBe(1)
  })

  it('counts forward from the most recent start', () => {
    const d = cycleDay([p('2026-08-01'), p('2026-08-29')], '2026-09-03')
    expect(d).not.toBeNull()
    expect(d).toBe(6)
  })

  it('returns null with nothing logged — not a fake day zero', () => {
    expect(cycleDay([], '2026-09-03')).toBeNull()
  })
})

describe('avgCycleLength averages recent start-to-start gaps', () => {
  it('averages the gaps', () => {
    const len = avgCycleLength([p('2026-06-01'), p('2026-06-29'), p('2026-07-29')])
    expect(len).not.toBeNull()
    expect(len).toBe(29) // gaps 28 and 30
  })

  it('skips gaps outside 15–60 days as logging artifacts', () => {
    // 200-day gap = the user stopped logging, not a 200-day cycle.
    const len = avgCycleLength([p('2025-06-01'), p('2025-12-18'), p('2026-01-15')])
    expect(len).not.toBeNull()
    expect(len).toBe(28)
  })

  it('returns null below two usable starts', () => {
    expect(avgCycleLength([p('2026-09-01')])).toBeNull()
  })
})

describe('nextPeriodEstimate projects one personal average forward', () => {
  it('adds the average length to the latest start', () => {
    const next = nextPeriodEstimate([p('2026-07-01'), p('2026-07-29')], '2026-08-10')
    expect(next).not.toBeNull()
    expect(next).toBe('2026-08-26')
  })

  it('returns null without an average to project with', () => {
    expect(nextPeriodEstimate([p('2026-08-01')], '2026-08-10')).toBeNull()
  })
})

describe('phaseOf places the textbook phases around a personal length', () => {
  it('labels the first five days menstrual', () => {
    expect(phaseOf(1, 28).id).toBe('menstrual')
    expect(phaseOf(5, 28).id).toBe('menstrual')
  })

  it('puts the ovulation window ~14 days before the next period', () => {
    expect(phaseOf(14, 28).id).toBe('ovulation')
    expect(phaseOf(16, 30).id).toBe('ovulation')
  })

  it('is follicular before the window and luteal after', () => {
    expect(phaseOf(8, 28).id).toBe('follicular')
    expect(phaseOf(20, 28).id).toBe('luteal')
  })

  it('falls back to a 28-day textbook cycle when no personal length exists', () => {
    expect(phaseOf(14, null).id).toBe('ovulation')
  })
})

// ── The visualisation derivations ────────────────────────────────────────────

/** A cycle: `len` days from `start`, with `period` flagged days at the front. */
function cyc(start: string, len: number, period = 5): CyclePoint[] {
  const out: CyclePoint[] = []
  for (let d = 0; d < len; d++) {
    out.push({ date: addDays(start, d), flags: d < period ? ['period'] : [] })
  }
  return out
}

describe('cycleHistory', () => {
  it('is empty with nothing logged', () => {
    expect(cycleHistory([], '2026-06-01')).toEqual([])
  })

  it('measures each finished cycle to the next start, oldest first', () => {
    const e = [...cyc('2026-01-01', 29), ...cyc('2026-01-30', 27)]
    const h = cycleHistory(e, '2026-02-26')
    expect(h.map((c) => c.start)).toEqual(['2026-01-01', '2026-01-30'])
    expect(h[0]).toMatchObject({ length: 29, periodDays: 5, current: false })
  })

  it('marks the running cycle rather than mixing its partial length in', () => {
    // Day 12 of the second cycle. Reporting 12 as a cycle length would draw a
    // collapsed cycle beside a normal one on any history chart.
    const e = [...cyc('2026-01-01', 29), ...cyc('2026-01-30', 5)]
    const h = cycleHistory(e, '2026-02-10')
    expect(h[1].current).toBe(true)
    expect(h[0].current).toBe(false)
    expect(h.filter((c) => !c.current).map((c) => c.length)).toEqual([29])
  })
})

describe('daysUntilNextPeriod', () => {
  it('is null until two starts anchor an average', () => {
    expect(daysUntilNextPeriod(cyc('2026-01-01', 29), '2026-01-10')).toBeNull()
  })

  it('counts forward, and goes negative when overdue', () => {
    const e = [...cyc('2026-01-01', 28), ...cyc('2026-01-29', 5)]
    // Average 28, latest start Jan 29 → next ~Feb 26.
    expect(daysUntilNextPeriod(e, '2026-02-20')).toBe(6)
    expect(daysUntilNextPeriod(e, '2026-03-01')).toBe(-3)
  })
})

describe('phaseBands', () => {
  it('covers every day of the cycle exactly once, in order', () => {
    const bands = phaseBands(30)
    expect(bands[0].from).toBe(1)
    expect(bands[bands.length - 1].to).toBe(30)
    for (let i = 1; i < bands.length; i++) expect(bands[i].from).toBe(bands[i - 1].to + 1)
  })

  it('agrees with phaseOf on every day — the two must not re-derive it apart', () => {
    for (const len of [26, 28, 31]) {
      for (const b of phaseBands(len)) {
        for (let d = b.from; d <= b.to; d++) expect(phaseOf(d, len).id).toBe(b.id)
      }
    }
  })
})

describe('flagPatternByDay', () => {
  it('returns nothing on a single cycle — one cycle is not a pattern', () => {
    expect(flagPatternByDay(cyc('2026-01-01', 29), '2026-01-29')).toEqual([])
  })

  it('counts a flag per cycle day across completed cycles only', () => {
    const e: CyclePoint[] = [
      ...cyc('2026-01-01', 28),
      ...cyc('2026-01-29', 28),
      ...cyc('2026-02-26', 3),
    ]
    // A cramp on day 2 of both completed cycles, and of the running one.
    for (const d of ['2026-01-02', '2026-01-30', '2026-02-27']) {
      e.find((x) => x.date === d)!.flags.push('cramps')
    }
    const pat = flagPatternByDay(e, '2026-02-28')
    const cramps = pat.find((p) => p.flag === 'cramps')!
    expect(cramps.cycles).toBe(2)
    expect(cramps.days.find((d) => d.day === 2)!.count).toBe(2)
  })
})

describe('coverline', () => {
  it('is null without enough readings to establish one', () => {
    expect(coverline([{ day: 1, temp: 97.3 }, { day: 2, temp: 97.4 }])).toBeNull()
  })

  it('is null on a flat chart — no shift, no line', () => {
    const flat = Array.from({ length: 20 }, (_, i) => ({ day: i + 1, temp: 97.3 }))
    expect(coverline(flat)).toBeNull()
  })

  it('takes the highest pre-shift reading once three days clear it', () => {
    const t = [
      97.2, 97.3, 97.1, 97.4, 97.2, 97.3, // six low, highest 97.4
      97.9, 98.0, 97.95,                   // three clear days
      97.9, 98.0,
    ].map((temp, i) => ({ day: i + 1, temp }))
    expect(coverline(t)).toBe(97.4)
  })

  it('ignores gaps rather than treating a missed morning as a low reading', () => {
    const t = [
      { day: 1, temp: 97.2 }, { day: 2, temp: 97.3 }, { day: 3 }, { day: 4, temp: 97.1 },
      { day: 5, temp: 97.4 }, { day: 6, temp: 97.2 }, { day: 7, temp: 97.3 },
      { day: 8, temp: 97.9 }, { day: 9 }, { day: 10, temp: 98.0 }, { day: 11, temp: 97.95 },
    ]
    expect(coverline(t)).toBe(97.4)
  })
})
