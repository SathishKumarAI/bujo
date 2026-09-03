import { describe, expect, it } from 'vitest'
import type { CyclePoint } from './types'
import { avgCycleLength, cycleDay, nextPeriodEstimate, periodStarts, phaseOf } from './cycleInsights'

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
