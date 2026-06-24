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
    j.habits = [{ id: 'h1', name: 'Read', category: 'wellness', color: 'peach', startedOn: '2026-06-01', timeOfDay: 'morning', cue: 'after coffee', type: 'count', target: 8, floor: 3 }]
    j.settings = { ...j.settings, selfHostUrl: 'http://localhost:3000', selfHostToken: 'tok', fastTargetHours: 18, currencySymbol: '€' }
    // #123 cost/day + #316 commitment on the primary streak.
    j.nofap = { ...j.nofap, costPerDay: 12, commitment: { quitDate: '2026-06-01', reason: 'for my kids' }, addictions: [{ id: 'ad1', name: 'Sugar', startedOn: '2026-06-01', best: 5, relapses: [], costPerDay: 4 }] }
    // #95/#261 custom-goal deadline.
    j.customGoals = [{ id: 'cg1', label: 'Save', target: 500, value: 100, due: '2026-12-31', createdAt: '2026-06-01' }]
    // Typing-practice tracker.
    j.typingSessions = [{ id: 't1', date: '2026-06-11', durationMin: 30, wpm: 72, accuracy: 96, source: 'Monkeytype' }]
    j.settings = { ...j.settings, typingGoalMin: 45 }

    const r = importJSON(exportJSON(j))
    expect(r.fasts).toEqual(j.fasts)
    expect(r.habitTimes).toEqual(j.habitTimes)
    expect(r.habitNotes).toEqual(j.habitNotes)
    expect(r.metrics[0].energy).toBe(8)
    expect(r.habits[0].cue).toBe('after coffee')
    expect(r.habits[0].timeOfDay).toBe('morning')
    expect(r.habits[0].floor).toBe(3) // #280
    expect(r.settings.selfHostUrl).toBe('http://localhost:3000')
    expect(r.settings.fastTargetHours).toBe(18)
    expect(r.settings.currencySymbol).toBe('€') // #123
    expect(r.nofap.costPerDay).toBe(12) // #123
    expect(r.nofap.commitment).toEqual({ quitDate: '2026-06-01', reason: 'for my kids' }) // #316
    expect(r.nofap.addictions?.[0].costPerDay).toBe(4) // #123
    expect(r.customGoals?.[0].due).toBe('2026-12-31') // #95/#261
    expect(r.typingSessions?.[0]).toEqual(j.typingSessions![0]) // typing tracker
    expect(r.settings.typingGoalMin).toBe(45)
  })

  it('migrate loads old data lacking every new optional field (back-compat)', () => {
    // A pre-feature payload: habits/goals/nofap with none of the new fields.
    const old = {
      habits: [{ id: 'h1', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01', type: 'count', target: 8 }],
      customGoals: [{ id: 'cg1', label: 'Save', target: 500, value: 0, createdAt: '2026-01-01' }],
      nofap: { startedOn: '2026-01-01', best: 0, relapses: [] },
    }
    const m = migrate(old)
    expect(m.habits[0].floor).toBeUndefined()
    expect(m.customGoals?.[0].due).toBeUndefined()
    expect(m.nofap.costPerDay).toBeUndefined()
    expect(m.nofap.commitment).toBeUndefined()
    expect(m.settings.currencySymbol).toBeUndefined()
    // Typing tracker absent in old payloads → seeded empty, goal unset.
    expect(m.typingSessions).toEqual([])
    expect(m.settings.typingGoalMin).toBeUndefined()
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
