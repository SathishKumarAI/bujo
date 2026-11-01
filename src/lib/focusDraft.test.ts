import { describe, expect, it } from 'vitest'
import { draftFrom, focusMark, lastSession, shortMin, toSession, withChoice } from './focusDraft'
import type { DevSession } from './types'

const s = (p: Partial<DevSession>): DevSession => ({ id: 'x', date: '2026-10-30', durationMin: 45, focus: 8, stress: 2, ...p })

describe('focusDraft', () => {
  it('carries the last session\'s habits but not its date, notes or interruptions', () => {
    const last = s({ date: '2026-10-29', project: 'bujo', tags: ['go'], interruptions: 3, notes: 'tired' })
    const d = draftFrom(last, '2026-10-31')
    expect(d).toMatchObject({ date: '2026-10-31', durationMin: 45, project: 'bujo', tags: ['go'], focus: 8, stress: 2, interruptions: undefined, notes: '' })
  })

  it('picks the newest session, not the first row', () => {
    const rows = [s({ id: 'a', date: '2026-10-28' }), s({ id: 'b', date: '2026-10-30' }), s({ id: 'c', date: '2026-10-29' })]
    expect(lastSession(rows)?.id).toBe('b')
  })

  it('keeps a carried-over value on the bar, or it is selected and invisible', () => {
    expect(withChoice([25, 45, 60, 90, 120], 180, 5)).toEqual([25, 45, 60, 90, 180])
    expect(withChoice([25, 45, 60, 90, 120], 45, 5)).toEqual([25, 45, 60, 90, 120])
    expect(withChoice(['a', 'b', 'c', 'd'], 'd', 3)).toEqual(['a', 'b', 'd'])
    expect(withChoice(['a', 'b'], '', 3)).toEqual(['a', 'b'])
  })

  it('says a minute count in a segment\'s width', () => {
    expect([25, 60, 90, 110, 120].map(shortMin)).toEqual(['25m', '1h', '1½h', '110m', '2h'])
  })

  it('refuses a session with no minutes, and merges typed tags without duplicates', () => {
    const d = draftFrom(undefined, '2026-10-31')
    expect(toSession(d)).toBeNull()
    expect(toSession({ ...d, durationMin: 25, tags: ['go'], moreTags: 'Go, rust ,' })).toMatchObject({ durationMin: 25, tags: ['go', 'rust'], project: undefined })
  })
})

describe('focusMark', () => {
  it('sums a day across sessions and says nothing for an empty day', () => {
    const s = [{ id: 'a', date: '2026-10-30', durationMin: 25 }, { id: 'b', date: '2026-10-30', durationMin: 35 }] as never
    expect(focusMark(s, '2026-10-30')).toBe('1h')
    expect(focusMark(s, '2026-10-29')).toBeNull()
  })
})
