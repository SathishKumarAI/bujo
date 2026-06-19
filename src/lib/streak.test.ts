import { describe, it, expect } from 'vitest'
import { streakStats, unlockedBenefits, STREAK_MILESTONES } from './streak'
import { emptyJournal } from './storage'
import type { Relapse } from './types'

const rel = (date: string, trigger = ''): Relapse => ({ id: date, date, trigger, note: '' })

describe('streak', () => {
  it('current = days since start; best honours the live run', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-08', best: 3, relapses: [] }
    const s = streakStats(d, '2026-06-18')
    expect(s.current).toBe(10)
    expect(s.best).toBe(10) // live run beat the stored best
  })

  it('totalClean sums completed streaks + the current run', () => {
    const d = emptyJournal()
    // relapses 10 days apart, last reset 5 days ago
    d.nofap = { startedOn: '2026-06-13', best: 0, relapses: [rel('2026-05-24'), rel('2026-06-03'), rel('2026-06-13')] }
    const s = streakStats(d, '2026-06-18')
    // completed: (5-24→6-03)=10 + (6-03→6-13)=10 = 20; current = 5
    expect(s.totalClean).toBe(25)
    expect(s.avgGap).toBe(10)
    expect(s.relapseCount).toBe(3)
  })

  it('milestone progress points at the next rung', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-08', best: 0, relapses: [] } // current 10 → next is 14
    const s = streakStats(d, '2026-06-18')
    expect(s.next?.day).toBe(14)
    expect(s.prevDay).toBe(7)
    expect(s.daysToNext).toBe(4)
    expect(s.progressPct).toBe(Math.round(((10 - 7) / (14 - 7)) * 100))
  })

  it('topTriggers ranks reasons by frequency', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-18', best: 0, relapses: [rel('2026-06-01', 'stress'), rel('2026-06-05', 'Stress'), rel('2026-06-10', 'boredom')] }
    const s = streakStats(d, '2026-06-18')
    expect(s.topTriggers[0]).toEqual({ trigger: 'stress', count: 2 })
  })

  it('unlockedBenefits returns reached milestones', () => {
    expect(unlockedBenefits(0)).toHaveLength(0)
    expect(unlockedBenefits(7).at(-1)?.day).toBe(7)
    expect(unlockedBenefits(999)).toHaveLength(STREAK_MILESTONES.length)
  })
})
