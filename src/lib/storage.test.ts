import { describe, expect, it } from 'vitest'
import { emptyJournal, exportJSON, exportMarkdown, importJSON, migrate, seedJournal } from './storage'

describe('migrate', () => {
  it('fills missing keys from an empty base', () => {
    const m = migrate({ entries: [{ id: 'x' }] })
    expect(m.version).toBeGreaterThan(0)
    expect(m.habits).toEqual([])
    expect(m.settings.theme).toBe('mocha')
    expect(m.nofap.relapses).toEqual([])
  })
  it('returns a clean base for garbage input', () => {
    expect(migrate(null).entries).toEqual([])
    expect(migrate('nope').entries).toEqual([])
  })
  it('preserves provided settings over defaults', () => {
    const m = migrate({ settings: { theme: 'latte' } })
    expect(m.settings.theme).toBe('latte')
    expect(m.settings.tempUnit).toBe('F') // default kept
  })
})

describe('seedJournal', () => {
  it('includes starter habits', () => {
    expect(seedJournal().habits.length).toBeGreaterThan(0)
  })
})

describe('export/import round-trip', () => {
  it('survives a JSON round-trip', () => {
    const j = seedJournal()
    const restored = importJSON(exportJSON(j))
    expect(restored.habits).toHaveLength(j.habits.length)
  })

  it('round-trips every new optional field (no backup data loss)', () => {
    const j = emptyJournal()
    j.fasts = [{ id: 'f1', start: '2026-06-10T20:00:00Z', end: '2026-06-11T12:00:00Z' }]
    j.habitTimes = { '2026-06-11': { h1: '2026-06-11T07:00:00Z' } }
    j.habitNotes = { '2026-06-11': { h1: 'felt great' } }
    j.metrics = [{ date: '2026-06-11', mood: 7, energy: 8 }]
    j.habits = [{ id: 'h1', name: 'Read', category: 'wellness', color: 'peach', startedOn: '2026-06-01', timeOfDay: 'morning', cue: 'after coffee' }]
    j.settings = { ...j.settings, selfHostUrl: 'http://localhost:3000', selfHostToken: 'tok', fastTargetHours: 18 }

    const r = importJSON(exportJSON(j))
    expect(r.fasts).toEqual(j.fasts)
    expect(r.habitTimes).toEqual(j.habitTimes)
    expect(r.habitNotes).toEqual(j.habitNotes)
    expect(r.metrics[0].energy).toBe(8)
    expect(r.habits[0].cue).toBe('after coffee')
    expect(r.habits[0].timeOfDay).toBe('morning')
    expect(r.settings.selfHostUrl).toBe('http://localhost:3000')
    expect(r.settings.fastTargetHours).toBe(18)
  })
})

describe('exportMarkdown', () => {
  it('renders entries grouped by day with checkboxes', () => {
    const j = emptyJournal()
    j.entries.push({
      id: 'a', date: '2026-06-10', type: 'task', text: 'do thing',
      status: 'done', important: false, memory: false, tags: [], createdAt: '2026-06-10',
    })
    const md = exportMarkdown(j)
    expect(md).toContain('## 2026-06-10')
    expect(md).toContain('- [x] do thing')
  })
})
