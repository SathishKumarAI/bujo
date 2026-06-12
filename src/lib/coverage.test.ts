import { describe, expect, it } from 'vitest'
import { dayCoverage, weekCoverage } from './coverage'
import { emptyJournal } from './storage'
import type { Habit } from './types'

const habit = (id: string): Habit => ({ id, name: id, category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })

describe('coverage', () => {
  it('flags missed habits and unmet journaling/mood', () => {
    const d = emptyJournal()
    d.habits = [habit('water'), habit('read')]
    d.habitLog = { '2026-06-11': ['water'] } // read missed
    const c = dayCoverage(d, '2026-06-11')
    expect(c.habits).toMatchObject({ done: 1, total: 2 })
    expect(c.habits.missed).toEqual(['read'])
    expect(c.journaled).toBe(false)
    expect(c.moodLogged).toBe(false)
    expect(c.score).toBeLessThan(1)
  })

  it('a fully covered day scores 1', () => {
    const d = emptyJournal()
    d.habits = [habit('water')]
    d.habitLog = { '2026-06-11': ['water'] }
    d.metrics = [{ date: '2026-06-11', mood: 8 }]
    d.gratitude = [{ date: '2026-06-11', text: 'sun' }]
    expect(dayCoverage(d, '2026-06-11').score).toBe(1)
  })

  it('weekCoverage returns 7 days oldest-first', () => {
    const w = weekCoverage(emptyJournal(), '2026-06-12', 7)
    expect(w).toHaveLength(7)
    expect(w[0].date).toBe('2026-06-06')
    expect(w[6].date).toBe('2026-06-12')
  })
})
