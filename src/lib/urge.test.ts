import { describe, it, expect } from 'vitest'
import { techniqueRanking, matchPlanForTrigger, streakVsBest, comebackStatus } from './urge'
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
