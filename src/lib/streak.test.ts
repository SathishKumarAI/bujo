import { describe, it, expect } from 'vitest'
import { streakStats, addictionStats, unlockedBenefits, nextHabitMilestone, STREAK_MILESTONES } from './streak'
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

  it('best reflects a long PAST streak that beats the stored best', () => {
    const d = emptyJournal()
    // a 40-day gap between the first two relapses dwarfs stored best (5) and the
    // current live run (5 days since the last reset on 2026-06-13).
    d.nofap = { startedOn: '2026-06-13', best: 5, relapses: [rel('2026-04-04'), rel('2026-05-14'), rel('2026-06-13')] }
    const s = streakStats(d, '2026-06-18')
    expect(s.best).toBe(40) // longest historical gap, not the stored best
  })

  it('avgGap sorts, dedupes, and ignores out-of-range relapse dates', () => {
    const d = emptyJournal()
    // unsorted + a duplicate ('2026-06-03' twice) + one stray date AFTER the
    // current start day ('2026-09-01' can't be a real past relapse → dropped).
    d.nofap = {
      startedOn: '2026-06-13', best: 0,
      relapses: [rel('2026-06-03'), rel('2026-05-24'), rel('2026-06-13'), rel('2026-06-03'), rel('2026-09-01')],
    }
    const s = streakStats(d, '2026-06-18')
    // kept (sorted/deduped): 5-24, 6-03, 6-13. gaps: 10 + 10 = 20 over 2 → avg 10.
    expect(s.avgGap).toBe(10)
    expect(s.relapseCount).toBe(5) // raw count untouched; only gap maths normalised
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

  it('nextHabitMilestone finds the next celebratory rung (clean-day badge)', () => {
    expect(nextHabitMilestone(0)).toEqual({ day: 3, daysToGo: 3 })
    expect(nextHabitMilestone(3)).toEqual({ day: 7, daysToGo: 4 }) // already at 3 → next is 7
    expect(nextHabitMilestone(10)).toEqual({ day: 14, daysToGo: 4 })
    expect(nextHabitMilestone(364)).toEqual({ day: 365, daysToGo: 1 })
    expect(nextHabitMilestone(365)).toBeNull() // past the last rung
    expect(nextHabitMilestone(9999)).toBeNull()
  })

  it('addictionStats computes an independent per-addiction streak (BUJO-199)', () => {
    const a = { id: 'a1', name: 'Sugar', startedOn: '2026-06-10', best: 4, relapses: [rel('2026-06-10'), rel('2026-06-05')] }
    const s = addictionStats(a, '2026-06-18')
    expect(s.current).toBe(8) // days since startedOn
    expect(s.best).toBe(8) // live run beats stored best 4
    expect(s.relapseCount).toBe(2)
    expect(s.urges).toBe(0) // per-addiction streaks share the global urge log
  })
})
