import { describe, expect, it } from 'vitest'
import { emptyJournal } from './storage'
import { changedKeys, fingerprint, ENTRY_KEY, HABIT_KEY, METRIC_KEY, WORKOUT_KEY } from './recordKeys'
import type { JournalData } from './types'

const D = '2026-09-15'
const base = (): JournalData => emptyJournal()

describe('fingerprint', () => {
  it('keys the four kinds a list can point at', () => {
    const d = base()
    d.entries.push({ id: 'e1', date: D, text: 'called mum', type: 'note', status: 'open' } as JournalData['entries'][number])
    d.workouts.push({ id: 'w1', date: D, activity: 'run', sets: [] } as unknown as JournalData['workouts'][number])
    d.metrics.push({ date: D, mood: 7 })
    d.habitLog[D] = ['h1']

    const f = fingerprint(d)
    expect(f.has(ENTRY_KEY('e1'))).toBe(true)
    expect(f.has(WORKOUT_KEY('w1'))).toBe(true)
    expect(f.has(METRIC_KEY(D))).toBe(true)
    expect(f.has(HABIT_KEY(D, 'h1'))).toBe(true)
  })

  it('folds a counted habit and a ticked one onto the same key', () => {
    const d = base()
    d.habitValues = { [D]: { water: 6 } }
    expect(fingerprint(d).get(HABIT_KEY(D, 'water'))).toBe('6')
  })
})

describe('changedKeys', () => {
  it('reports a record that was added', () => {
    const before = fingerprint(base())
    const d = base()
    d.entries.push({ id: 'e1', date: D, text: 'called mum', type: 'note', status: 'open' } as JournalData['entries'][number])
    expect([...changedKeys(before, fingerprint(d))]).toEqual([ENTRY_KEY('e1')])
  })

  /**
   * The reason this is a fingerprint and not a set of keys. "mood 7" on a day
   * that already carries a sleep figure UPDATES `metrics[date]` — a set
   * difference finds nothing new and would highlight nothing, on the commonest
   * capture in the app.
   */
  it('reports a record that already existed and changed', () => {
    const a = base(); a.metrics.push({ date: D, sleep: 8 })
    const b = base(); b.metrics.push({ date: D, sleep: 8, mood: 7 })
    expect([...changedKeys(fingerprint(a), fingerprint(b))]).toEqual([METRIC_KEY(D)])
  })

  it('says nothing changed when nothing changed', () => {
    const d = base(); d.entries.push({ id: 'e1', date: D, text: 'x', type: 'note', status: 'open' } as JournalData['entries'][number])
    expect(changedKeys(fingerprint(d), fingerprint(d)).size).toBe(0)
  })

  // A delete leaves nothing on the page to point at, and no capture deletes.
  it('ignores a record that was removed', () => {
    const a = base(); a.entries.push({ id: 'e1', date: D, text: 'x', type: 'note', status: 'open' } as JournalData['entries'][number])
    expect(changedKeys(fingerprint(a), fingerprint(base())).size).toBe(0)
  })
})
