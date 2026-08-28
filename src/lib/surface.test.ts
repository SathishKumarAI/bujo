import { describe, expect, it } from 'vitest'
import { surfaceForHour, surfaceUntouched } from './surface'
import type { Entry, JournalData } from './types'
import { addDays, todayISO } from './date'

const DAY = '2026-08-20'

/** Only the four collections `surfaceUntouched` reads; the rest is not its business. */
function journal(over: Partial<JournalData> = {}): JournalData {
  return { entries: [], metrics: [], gratitude: [], memories: [], ...over } as unknown as JournalData
}

function entry(over: Partial<Entry> = {}): Entry {
  return {
    id: 'e1', date: DAY, type: 'note', text: 'x', status: 'open',
    important: false, memory: false, tags: [], createdAt: `${DAY}T09:00:00.000Z`,
    ...over,
  }
}

describe('surfaceForHour', () => {
  it('splits the day at 11:00 and 18:00', () => {
    expect(surfaceForHour(0)).toBe('morning')
    expect(surfaceForHour(10)).toBe('morning')
    expect(surfaceForHour(11)).toBe('day')
    expect(surfaceForHour(17)).toBe('day')
    expect(surfaceForHour(18)).toBe('evening')
    expect(surfaceForHour(23)).toBe('evening')
  })
})

describe('surfaceUntouched', () => {
  it('marks all three on a day with nothing on it', () => {
    expect(surfaceUntouched(journal(), DAY)).toEqual({ morning: true, day: true, evening: true })
  })

  it('clears morning on any one rating, sleep included', () => {
    expect(surfaceUntouched(journal({ metrics: [{ date: DAY, mood: 7 }] }), DAY).morning).toBe(false)
    expect(surfaceUntouched(journal({ metrics: [{ date: DAY, sleep: 0 }] }), DAY).morning).toBe(false)
  })

  it('does not read a rating of zero as unanswered', () => {
    // `0` is a real answer on every one of these scales — "0 calm", "0 drained".
    // A falsy check here would have marked a fully-answered morning as empty.
    expect(surfaceUntouched(journal({ metrics: [{ date: DAY, stress: 0 }] }), DAY).morning).toBe(false)
  })

  it('does not clear morning on weather alone', () => {
    // Weather is auto-logged, so a metric record can exist without the user
    // having answered anything. The marker is about what *you* recorded.
    const weather = { tempC: 21, code: 1, label: 'Mainly clear', icon: '🌤' }
    expect(surfaceUntouched(journal({ metrics: [{ date: DAY, weather }] }), DAY).morning).toBe(true)
  })

  it('clears day on an entry, and ignores one filed in a collection', () => {
    expect(surfaceUntouched(journal({ entries: [entry()] }), DAY).day).toBe(false)
    expect(surfaceUntouched(journal({ entries: [entry({ collection: 'books' })] }), DAY).day).toBe(true)
  })

  it('clears evening on gratitude or a memory, but not on whitespace', () => {
    expect(surfaceUntouched(journal({ gratitude: [{ date: DAY, text: 'coffee' }] }), DAY).evening).toBe(false)
    expect(surfaceUntouched(journal({ memories: [{ date: DAY, text: 'rain' }] }), DAY).evening).toBe(false)
    expect(surfaceUntouched(journal({ memories: [{ date: DAY, text: '  ' }] }), DAY).evening).toBe(true)
  })

  it('reads only the day it was asked about', () => {
    const other = addDays(DAY, -1)
    const data = journal({ metrics: [{ date: other, mood: 7 }], entries: [entry({ date: other })] })
    expect(surfaceUntouched(data, DAY)).toEqual({ morning: true, day: true, evening: true })
  })

  it('marks nothing on a future day', () => {
    // An unwritten tomorrow is not a gap, and three dots on it would be the
    // page telling you off for not having lived it yet.
    expect(surfaceUntouched(journal(), addDays(todayISO(), 1))).toEqual({
      morning: false,
      day: false,
      evening: false,
    })
  })
})
