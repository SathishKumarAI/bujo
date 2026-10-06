import { describe, expect, it } from 'vitest'
import { mergeJournals } from './conflict'
import { emptyJournal } from './storage'
import type { JournalData } from './types'

/**
 * A challenge rule was a string and a tick: enough to say a day counted, and
 * nothing about what happened. 75 Hard asks for two 45-minute workouts, one
 * outdoor — you could mark both done and never record which two.
 *
 * The shape under test is the composite inner key, `challengeId → "date:index"
 * → note`, chosen over a third nested Record so a merge resolves at the
 * granularity of ONE note. That is the property worth a test: two devices
 * annotating different rules on the same date must both keep their work, and a
 * day-level map would silently drop one.
 */
const withNotes = (notes: JournalData['challengeNotes']): JournalData => ({ ...emptyJournal(), challengeNotes: notes })
const K = (ch: string, date: string, i: number) => `${ch}:${date}:${i}`

describe('a rule note survives a merge at note granularity', () => {
  it('keeps both devices’ notes for different rules on the same day', () => {
    const a = withNotes({ [K('ch1', '2026-10-06', 0)]: 'Push day · 50 min' })
    const b = withNotes({ [K('ch1', '2026-10-06', 1)]: 'Run · Easy · 45 min' })
    const merged = mergeJournals(a, b)
    expect(merged.challengeNotes?.[K('ch1', '2026-10-06', 0)]).toBe('Push day · 50 min')
    expect(merged.challengeNotes?.[K('ch1', '2026-10-06', 1)]).toBe('Run · Easy · 45 min')
  })

  it('the winner wins a genuine collision on the same rule', () => {
    const a = withNotes({ [K('ch1', '2026-10-06', 0)]: 'winner' })
    const b = withNotes({ [K('ch1', '2026-10-06', 0)]: 'loser' })
    expect(mergeJournals(a, b).challengeNotes?.[K('ch1', '2026-10-06', 0)]).toBe('winner')
  })

  it('does not invent a notes map on a journal that never had one', () => {
    // `fillMap` over two absent sides must not leave `challengeNotes: {}`
    // behind on every journal that has never used the feature.
    const merged = mergeJournals(emptyJournal(), emptyJournal())
    expect(merged.challengeNotes === undefined || Object.keys(merged.challengeNotes).length === 0).toBe(true)
  })

  it('keeps a note the other side has never seen', () => {
    const a = withNotes({ [K('ch1', '2026-10-06', 0)]: 'mine' })
    expect(mergeJournals(emptyJournal(), a).challengeNotes?.[K('ch1', '2026-10-06', 0)]).toBe('mine')
  })
})
