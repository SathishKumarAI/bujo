import { describe, expect, it, vi } from 'vitest'
import { resolveIncoming, mergeJournals } from './conflict'
import { emptyJournal } from './storage'

const at = (iso?: string) => ({ ...emptyJournal(), updatedAt: iso })
const entry = (id: string, date = '2026-06-15', text = id) => ({
  id, date, type: 'note' as const, text, status: 'open' as const,
  important: false, memory: false, tags: [], createdAt: date,
})

describe('resolveIncoming', () => {
  it('adopts remote when it is newer (normal sync, no prompt)', () => {
    const ask = vi.fn(() => false)
    const local = at('2026-06-15T10:00:00.000Z')
    const remote = at('2026-06-15T12:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toMatchObject({ updatedAt: '2026-06-15T12:00:00.000Z' })
    expect(ask).not.toHaveBeenCalled()
  })

  it('adopts remote when neither side is stamped (legacy)', () => {
    const ask = vi.fn(() => false)
    expect(resolveIncoming(at(undefined), at(undefined), ask)).toMatchObject({ updatedAt: undefined })
    expect(ask).not.toHaveBeenCalled()
  })

  it('prompts when local is newer; keeps local on cancel', () => {
    const ask = vi.fn(() => false)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at('2026-06-15T10:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toBeNull()
    expect(ask).toHaveBeenCalledOnce()
  })

  it('prompts when local is newer; adopts cloud on confirm', () => {
    const ask = vi.fn(() => true)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at('2026-06-15T10:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toMatchObject({ updatedAt: '2026-06-15T10:00:00.000Z' })
  })

  it('prompts when local is stamped but remote is not (local has unsynced edits)', () => {
    const ask = vi.fn(() => true)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at(undefined)
    expect(resolveIncoming(local, remote, ask)).toMatchObject({ updatedAt: undefined })
    expect(ask).toHaveBeenCalledOnce()
  })

  it('keeps local-only entries when adopting a newer remote (no silent loss)', () => {
    const local = { ...at('2026-06-15T10:00:00.000Z'), entries: [entry('a'), entry('local-only')] }
    const remote = { ...at('2026-06-15T12:00:00.000Z'), entries: [entry('a'), entry('remote-only')] }
    const out = resolveIncoming(local, remote)!
    const ids = out.entries.map((e) => e.id).sort()
    expect(ids).toEqual(['a', 'local-only', 'remote-only'])
    expect(out.updatedAt).toBe('2026-06-15T12:00:00.000Z') // remote wins the stamp
  })
})

describe('mergeJournals', () => {
  it('winner version wins on id collision', () => {
    const winner = { ...emptyJournal(), entries: [entry('a', '2026-06-15', 'WIN')] }
    const loser = { ...emptyJournal(), entries: [entry('a', '2026-06-15', 'lose')] }
    const out = mergeJournals(winner, loser)
    expect(out.entries).toHaveLength(1)
    expect(out.entries[0].text).toBe('WIN')
  })

  it('unions date-keyed collections and fills map-only keys', () => {
    const winner = { ...emptyJournal(), metrics: [{ date: '2026-06-15', mood: 8 }], habitLog: { '2026-06-15': ['h1'] } }
    const loser = { ...emptyJournal(), metrics: [{ date: '2026-06-14', mood: 5 }], habitLog: { '2026-06-14': ['h2'] } }
    const out = mergeJournals(winner, loser)
    expect(out.metrics.map((m) => m.date).sort()).toEqual(['2026-06-14', '2026-06-15'])
    expect(out.habitLog).toEqual({ '2026-06-14': ['h2'], '2026-06-15': ['h1'] })
  })

  it('unions nofap dated logs but keeps winner scalars', () => {
    const rel = (id: string, date: string) => ({ id, date, trigger: '', note: '' })
    const winner = { ...emptyJournal(), nofap: { startedOn: '2026-06-10', best: 30, relapses: [rel('r1', '2026-06-09')], urgeLog: [], plans: [] } }
    const loser = { ...emptyJournal(), nofap: { startedOn: '2026-06-01', best: 5, relapses: [rel('r2', '2026-05-20')], urgeLog: [], plans: [] } }
    const out = mergeJournals(winner, loser)
    expect(out.nofap.startedOn).toBe('2026-06-10') // winner scalar
    expect(out.nofap.best).toBe(30)
    expect(out.nofap.relapses.map((r) => r.id).sort()).toEqual(['r1', 'r2']) // union
  })
})

describe('mergeJournals · no collection is left behind', () => {
  /**
   * The regression guard for the bug this was written after: `ID_ARRAYS` is a
   * hand-maintained list, `JournalData` grows feature by feature, and a
   * collection missing from the list is not merged — it falls through to the
   * winner and the loser's rows vanish with no error. `typingSessions`,
   * `customGoals` and `mindsetFocus` were all missing at once.
   *
   * Derived from `emptyJournal()` rather than a hand-written fixture, so a
   * collection added tomorrow is covered without anyone remembering to.
   */
  it('keeps a loser-only item in EVERY array collection of an empty journal', () => {
    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z' }
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z' } as Record<string, unknown>

    // One synthetic row per array collection, carrying every key the merge might
    // join on (`id`, `date`, `ym`) so it is unique whichever rule applies.
    const arrayKeys = Object.entries(loser)
      .filter(([, v]) => Array.isArray(v))
      .map(([k]) => k)
    expect(arrayKeys.length).toBeGreaterThan(15) // sanity: we found the collections

    for (const k of arrayKeys) {
      loser[k] = [{ id: `only-${k}`, date: '2026-01-01', ym: '2026-01', flags: [] }]
    }

    const out = mergeJournals(winner, loser as never) as unknown as Record<string, unknown[]>

    const dropped = arrayKeys.filter((k) => (out[k] ?? []).length === 0)
    expect(dropped, `mergeJournals dropped loser-only rows from: ${dropped.join(', ')}. Add them to ID_ARRAYS or KEYED_ARRAYS in conflict.ts`).toEqual([])
  })

  it('unions the data logs hidden inside settings', () => {
    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z' }
    winner.settings = { ...winner.settings, duprLog: [{ date: '2026-06-15', rating: 4.0 }], programDone: ['w1d1'] }
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z' }
    loser.settings = { ...loser.settings, duprLog: [{ date: '2026-06-14', rating: 3.75 }], programDone: ['w1d2'] }

    const out = mergeJournals(winner, loser)
    expect(out.settings.duprLog?.map((d) => d.date).sort()).toEqual(['2026-06-14', '2026-06-15'])
    expect(out.settings.programDone?.sort()).toEqual(['w1d1', 'w1d2'])
  })

  it('does not invent settings log keys on journals that never had them', () => {
    const out = mergeJournals(emptyJournal(), emptyJournal())
    expect(out.settings.duprLog).toBeUndefined()
    expect(out.settings.programDone).toBeUndefined()
    expect(out.settings.programActuals).toBeUndefined()
  })
})
