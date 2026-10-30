import { describe, expect, it } from 'vitest'
import { frequentUrges } from './frequentUrges'
import { emptyJournal } from './storage'
import { URGE_PRESETS } from './streak'
import type { JournalData, UrgeWin } from './types'

const T = '2026-10-30'
const urge = (trigger: string, date = T, outcome?: 'followed', addictionId?: string): UrgeWin => ({ id: trigger + date + Math.random(), date, trigger, outcome, addictionId })
const journal = (urgeLog: UrgeWin[], addictions: { id: string; name: string }[] = []): JournalData => {
  const j = emptyJournal()
  return { ...j, nofap: { ...j.nofap, urgeLog, addictions: addictions.map((a) => ({ ...a, startedOn: '2026-01-01', best: 0, relapses: [] })) } } as JournalData
}
const names = (j: JournalData) => frequentUrges(j, { today: T }).map((u) => u.name)

describe('frequentUrges', () => {
  it('fills a new journal with the presets', () => {
    expect(names(journal([]))).toEqual(URGE_PRESETS.slice(0, 6))
  })

  it('puts what you track first, the most-logged of them on top', () => {
    const j = journal([urge('x', T, undefined, 'b'), urge('x', T, undefined, 'b')], [{ id: 'a', name: 'Nicotine' }, { id: 'b', name: 'Porn' }])
    expect(names(j).slice(0, 2)).toEqual(['Porn', 'Nicotine'])
    expect(frequentUrges(j, { today: T })[0]).toMatchObject({ addictionId: 'b', held: 2 })
  })

  it('ranks the rest by how often you logged them, case-blind, and counts both endings', () => {
    const j = journal([urge('Gaming'), urge('gaming', T, 'followed'), urge('Sugar')])
    expect(names(j).slice(0, 2)).toEqual(['Gaming', 'Sugar'])
    expect(frequentUrges(j, { today: T })[0]).toMatchObject({ held: 1, gaveIn: 1 })
  })

  it('forgets urges older than the window', () => {
    expect(names(journal([urge('Gaming', '2026-08-01')]))[0]).not.toBe('Gaming')
  })
})
