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
