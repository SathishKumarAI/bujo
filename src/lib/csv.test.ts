import { describe, expect, it } from 'vitest'
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv } from './csv'
import { emptyJournal } from './storage'

describe('csv export', () => {
  it('escapes commas/quotes and includes headers', () => {
    const d = emptyJournal()
    d.entries = [{ id: '1', date: '2026-06-11', type: 'task', text: 'buy milk, eggs', status: 'open', important: true, memory: false, tags: ['shop'], createdAt: '2026-06-11' }]
    const csv = entriesCsv(d)
    expect(csv.split('\n')[0]).toBe('date,type,status,important,text,tags')
    expect(csv).toContain('"buy milk, eggs"')
    expect(csv).toContain('yes')
  })

  it('habits export is long-format (one row per completion)', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'h', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01' }]
    d.habitLog = { '2026-06-11': ['h'] }
    expect(habitsCsv(d)).toContain('2026-06-11,Water,food')
  })

  it('metrics and workouts export with headers on an empty journal', () => {
    expect(metricsCsv(emptyJournal()).startsWith('date,mood,stress,sleep')).toBe(true)
    expect(workoutsCsv(emptyJournal()).startsWith('date,activity,split')).toBe(true)
  })
})
