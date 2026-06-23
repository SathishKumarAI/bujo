import { describe, expect, it } from 'vitest'
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv, parseMetricsCsv, stripSyncSecrets, daysSinceBackup } from './csv'
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

  it('parseMetricsCsv round-trips an exported metrics CSV', () => {
    const d = emptyJournal()
    d.metrics = [{ date: '2026-06-11', mood: 7, sleep: 8 }]
    const rows = parseMetricsCsv(metricsCsv(d))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ date: '2026-06-11', patch: { mood: 7, sleep: 8 } })
  })

  it('parseMetricsCsv skips malformed dates and empty cells', () => {
    const rows = parseMetricsCsv('date,mood\nnot-a-date,5\n2026-06-12,\n2026-06-13,9')
    expect(rows).toEqual([{ date: '2026-06-13', patch: { mood: 9 } }])
  })
})

describe('stripSyncSecrets', () => {
  it('removes sync tokens but keeps other settings', () => {
    const d = emptyJournal()
    d.settings.selfHostToken = 'jwt'
    d.settings.selfHostUrl = 'https://x'
    d.settings.githubToken = 'pat'
    d.settings.githubGistId = 'gist'
    d.settings.googleClientId = 'cid'
    d.settings.googleEmail = 'a@b.c'
    d.settings.lastBackup = '2026-06-10'
    const out = stripSyncSecrets(d)
    expect(out.settings.selfHostToken).toBeUndefined()
    expect(out.settings.selfHostUrl).toBeUndefined()
    expect(out.settings.githubToken).toBeUndefined()
    expect(out.settings.githubGistId).toBeUndefined()
    expect(out.settings.googleClientId).toBeUndefined()
    expect(out.settings.googleEmail).toBeUndefined()
    // Non-secret settings survive.
    expect(out.settings.lastBackup).toBe('2026-06-10')
    expect(out.settings.theme).toBe(d.settings.theme)
  })

  it('does not mutate the input', () => {
    const d = emptyJournal()
    d.settings.selfHostToken = 'jwt'
    stripSyncSecrets(d)
    expect(d.settings.selfHostToken).toBe('jwt')
  })
})

describe('daysSinceBackup', () => {
  it('counts whole days between dates', () => {
    expect(daysSinceBackup('2026-06-10', '2026-06-17')).toBe(7)
    expect(daysSinceBackup('2026-06-17', '2026-06-17')).toBe(0)
  })

  it('returns null when no/invalid backup date', () => {
    expect(daysSinceBackup(undefined, '2026-06-17')).toBeNull()
    expect(daysSinceBackup('not-a-date', '2026-06-17')).toBeNull()
  })

  it('never returns negative for a future backup date', () => {
    expect(daysSinceBackup('2026-06-20', '2026-06-17')).toBe(0)
  })
})
