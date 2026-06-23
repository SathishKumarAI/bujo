import { describe, it, expect } from 'vitest'
import { techniqueRanking, matchPlanForTrigger } from './urge'
import type { UrgeWin, TriggerPlan } from './types'

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
