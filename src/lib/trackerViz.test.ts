import { describe, expect, it } from 'vitest'
import { dayCompletion, weekdayConsistency, monthlyCompletion } from './stats'
import { emptyJournal } from './storage'
import type { Habit } from './types'

const habit = (id: string): Habit => ({ id, name: id, category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })

describe('tracker visualisations', () => {
  it('dayCompletion is null when nothing is scheduled', () => {
    expect(dayCompletion(emptyJournal(), '2026-06-10').ratio).toBeNull()
  })

  it('dayCompletion ratio reflects done/scheduled', () => {
    const d = emptyJournal()
    d.habits = [habit('a'), habit('b')]
    d.habitLog = { '2026-06-10': ['a'] }
    const c = dayCompletion(d, '2026-06-10')
    expect(c).toMatchObject({ done: 1, total: 2 })
    expect(c.ratio).toBeCloseTo(0.5)
  })

  it('weekdayConsistency returns 7 values in 0..1', () => {
    const d = emptyJournal()
    d.habits = [habit('a')]
    d.habitLog = { '2026-06-11': ['a'] }
    const wd = weekdayConsistency(d, 30, '2026-06-12')
    expect(wd).toHaveLength(7)
    wd.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1) })
  })

  it('monthlyCompletion returns the requested number of months, oldest first', () => {
    const m = monthlyCompletion(emptyJournal(), 6, '2026-06-12')
    expect(m).toHaveLength(6)
    expect(m[0].ym < m[5].ym).toBe(true)
  })
})
