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
