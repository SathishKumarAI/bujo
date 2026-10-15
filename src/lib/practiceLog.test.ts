import { describe, expect, it } from 'vitest'
import { practiceKey, practiceStat, practisedInRange, togglePractice } from './practiceLog'
import { mergeJournals } from './conflict'
import type { JournalData } from './types'

describe('practiceKey', () => {
  it('slugs the drill NAME and drops the instruction after the colon', () => {
    // The two call sites name the same drill differently: the library carries
    // "Return-and-rush" and a program week carries the whole instruction. They
    // must land on one key or a drill ticked in the week reads as never done
    // in the library.
    expect(practiceKey('drill', 'Return-and-rush: return, sprint to the line, split-step'))
      .toBe(practiceKey('drill', 'Return-and-rush'))
  })

  it('separates a shot from a drill of the same name', () => {
    // "Dink" is a technique in the manual AND the first word of three drills.
    expect(practiceKey('shot', 'Dink')).not.toBe(practiceKey('drill', 'Dink'))
  })

  it('is stable, lowercase and bounded', () => {
    expect(practiceKey('drill', 'Figure-8')).toBe('drill:figure-8')
    const key = practiceKey('drill', 'x'.repeat(200))
    expect(key.length).toBeLessThanOrEqual('drill:'.length + 60)
  })
})

describe('togglePractice', () => {
  it('adds the day, and pressing again removes it', () => {
    // The first thing anybody does with a new control is press it to see what
    // it does. A tick that cannot be untaken is a record you cannot correct.
    const once = togglePractice({}, 'drill:figure-8', '2026-10-15')
    expect(once['drill:figure-8']).toEqual(['2026-10-15'])
    expect(togglePractice(once, 'drill:figure-8', '2026-10-15')).toEqual({})
  })

  it('keeps the other days when one is removed', () => {
    const log = { 'drill:figure-8': ['2026-10-13', '2026-10-15'] }
    expect(togglePractice(log, 'drill:figure-8', '2026-10-15')).toEqual({ 'drill:figure-8': ['2026-10-13'] })
  })

  it('deletes the key rather than leaving an empty array', () => {
    // Same distinction a cleared week note makes: `[]` persists as "asked and
    // answered with nothing", and it would make every un-ticked drill
    // permanent storage.
    const log = togglePractice({ 'drill:x': ['2026-10-15'] }, 'drill:x', '2026-10-15')
    expect('drill:x' in log).toBe(false)
  })

  it('does not mutate the log it was given', () => {
    const log = { 'drill:x': ['2026-10-13'] }
    togglePractice(log, 'drill:x', '2026-10-15')
    expect(log['drill:x']).toEqual(['2026-10-13'])
  })
})

describe('practiceStat', () => {
  it('tells "never done" apart from "done, but not today"', () => {
    // These must not render the same — one is an absence and the other is a
    // measurement, which is the distinction the whole repo keeps.
    const never = practiceStat({}, 'drill:x', '2026-10-15')
    expect(never.onDate).toBe(false)
    expect(never.last).toBeUndefined()

    const lapsed = practiceStat({ 'drill:x': ['2026-10-07'] }, 'drill:x', '2026-10-15')
    expect(lapsed.onDate).toBe(false)
    expect(lapsed.last).toBe('2026-10-07')
    expect(lapsed.days).toHaveLength(1)
  })

  it('survives an undefined log', () => {
    expect(practiceStat(undefined, 'drill:x', '2026-10-15').days).toEqual([])
  })
})

describe('practisedInRange', () => {
  it('counts the keys touched inside the window, not the number of sessions', () => {
    const log = { 'drill:a': ['2026-10-12', '2026-10-13'], 'drill:b': ['2026-09-01'] }
    expect(practisedInRange(log, ['drill:a', 'drill:b'], '2026-10-12', '2026-10-18')).toBe(1)
  })
})

describe('the merge keeps practice logged on the other device', () => {
  const at = (iso: string, log: Record<string, string[]>): JournalData =>
    ({ updatedAt: iso, settings: { practiceLog: log } } as unknown as JournalData)

  it('unions the days under a key both sides have', () => {
    // THE CASE THAT MOTIVATED `unionListMap`. `fillMap` is a shallow merge, so
    // the winner's array would have replaced the loser's outright and the
    // phone's Tuesday would be gone — silently, which is how every other union
    // case in conflict.ts came to be written.
    const merged = mergeJournals(
      at('2026-10-15T10:00:00Z', { 'drill:figure-8': ['2026-10-15'] }),
      at('2026-10-14T10:00:00Z', { 'drill:figure-8': ['2026-10-13'] }),
    )
    expect(merged.settings.practiceLog?.['drill:figure-8']).toEqual(['2026-10-13', '2026-10-15'])
  })

  it('keeps a key only one side has, and does not invent the field', () => {
    const merged = mergeJournals(
      at('2026-10-15T10:00:00Z', { 'drill:a': ['2026-10-15'] }),
      at('2026-10-14T10:00:00Z', { 'drill:b': ['2026-10-13'] }),
    )
    expect(Object.keys(merged.settings.practiceLog ?? {}).sort()).toEqual(['drill:a', 'drill:b'])

    const neither = mergeJournals(
      { updatedAt: '2026-10-15T10:00:00Z', settings: {} } as unknown as JournalData,
      { updatedAt: '2026-10-14T10:00:00Z', settings: {} } as unknown as JournalData,
    )
    expect('practiceLog' in neither.settings).toBe(false)
  })
})
