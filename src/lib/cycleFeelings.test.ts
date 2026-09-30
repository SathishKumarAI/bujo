/**
 * FEELINGS BY PHASE.
 *
 * The failures here are all the same kind and all serious: a sentence about
 * someone's desire or mood that the data does not support. Someone may repeat
 * one of these to a clinician, or to a partner.
 */
import { describe, expect, it } from 'vitest'
import { feelingNotes, feelingsByPhase, MEANINGFUL_DELTA, MIN_DAYS } from './cycleFeelings'
import type { CyclePoint } from './types'

const PHASES = ['Menstrual', 'Follicular', 'Ovulation window', 'Luteal']

/** Days 1-5 menstrual, 6-13 follicular, 14-16 ovulation, 17+ luteal. */
const phaseOfDay = (day: number) =>
  day <= 5 ? 'Menstrual' : day <= 13 ? 'Follicular' : day <= 16 ? 'Ovulation window' : 'Luteal'

/** `days` is 1-based; the date encodes it so the phase fn can read it back. */
function log(days: Record<number, Partial<CyclePoint>>): {
  entries: CyclePoint[]
  phaseOfDate: (d: string) => string | null
} {
  const entries = Object.entries(days).map(([d, extra]) => ({
    date: `2026-01-${String(Number(d)).padStart(2, '0')}`,
    flags: [],
    ...extra,
  }))
  return { entries, phaseOfDate: (date) => phaseOfDay(Number(date.slice(8))) }
}

/** n rated days in one phase, all the same value. */
function flat(startDay: number, n: number, field: 'drive' | 'mood' | 'energy', value: number) {
  const out: Record<number, Partial<CyclePoint>> = {}
  for (let i = 0; i < n; i++) out[startDay + i] = { [field]: value }
  return out
}

describe('a phase needs enough rated days before it says anything', () => {
  it(`reports null below ${MIN_DAYS} rated days`, () => {
    const { entries, phaseOfDate } = log(flat(1, MIN_DAYS - 1, 'drive', 5))
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    expect(drive.phases.find((p) => p.phase === 'Menstrual')!.value).toBeNull()
  })

  it(`reports an average at ${MIN_DAYS}`, () => {
    const { entries, phaseOfDate } = log(flat(1, MIN_DAYS, 'drive', 5))
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    expect(drive.phases.find((p) => p.phase === 'Menstrual')!.value).toBe(5)
  })

  it('counts days observed separately from days rated', () => {
    const { entries, phaseOfDate } = log({ 1: { drive: 4 }, 2: {}, 3: {}, 4: { drive: 4 }, 5: { drive: 4 } })
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    const m = drive.phases.find((p) => p.phase === 'Menstrual')!
    expect(m.n).toBe(3)
    expect(m.days).toBe(5)
  })
})

describe('absent is not zero, here as everywhere', () => {
  it('never lets unrated days drag an average down', () => {
    const { entries, phaseOfDate } = log({ 1: { drive: 4 }, 2: {}, 3: {}, 4: { drive: 4 }, 5: { drive: 4 } })
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    // Two unrated days must not pull 4 toward 2.4.
    expect(drive.phases.find((p) => p.phase === 'Menstrual')!.value).toBe(4)
  })

  it('leaves a phase with no ratings blank rather than at the floor', () => {
    const { entries, phaseOfDate } = log(flat(1, 3, 'drive', 3))
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    expect(drive.phases.find((p) => p.phase === 'Luteal')!.value).toBeNull()
  })
})

describe('a peak has to be big enough to be worth naming', () => {
  it(`says nothing about a gap under ${MEANINGFUL_DELTA}`, () => {
    // 3.0 everywhere but 3.2 at ovulation — inside the noise of self-rating.
    const { entries, phaseOfDate } = log({
      ...flat(1, 3, 'drive', 3), ...flat(6, 3, 'drive', 3),
      ...flat(14, 3, 'drive', 3.2), ...flat(17, 3, 'drive', 3),
    })
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    expect(drive.peak).toBeNull()
    expect(feelingNotes([drive])).toEqual([])
  })

  it('names a real one, against the reader’s own average', () => {
    const { entries, phaseOfDate } = log({
      ...flat(1, 3, 'drive', 2), ...flat(6, 3, 'drive', 3),
      ...flat(14, 3, 'drive', 5), ...flat(17, 3, 'drive', 3),
    })
    const drive = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'drive')!
    expect(drive.peak?.phase).toBe('Ovulation window')
    const [note] = feelingNotes([drive])
    expect(note.text).toMatch(/sex drive runs/)
    expect(note.text).toMatch(/in your ovulation window/)
    // Against the log's own baseline, never a population claim.
    expect(note.text).toMatch(/your own average/)
  })

  it('reads "in your ovulation window", not "the ovulation window phase"', () => {
    const { entries, phaseOfDate } = log({
      ...flat(1, 3, 'mood', 2), ...flat(14, 3, 'mood', 5),
    })
    const mood = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'mood')!
    expect(feelingNotes([mood])[0]?.text).not.toMatch(/window phase/)
  })

  it('reports a dip as well as a rise', () => {
    const { entries, phaseOfDate } = log({
      ...flat(1, 3, 'energy', 1), ...flat(6, 3, 'energy', 4),
      ...flat(14, 3, 'energy', 4), ...flat(17, 3, 'energy', 4),
    })
    const energy = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'energy')!
    expect(energy.peak!.delta).toBeLessThan(0)
    expect(feelingNotes([energy])[0].text).toMatch(/lower/)
  })
})

describe('cravings are a share of days, not an average of tag counts', () => {
  it('counts a day with three cravings the same as a day with one', () => {
    const { entries, phaseOfDate } = log({
      17: { cravings: ['sweet', 'salty', 'carbs'] },
      18: { cravings: ['sweet'] },
      19: {},
      20: {},
    })
    const c = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'cravings')!
    // 2 of 4 luteal days had any craving.
    expect(c.phases.find((p) => p.phase === 'Luteal')!.value).toBe(0.5)
  })

  it('phrases the note as a percentage of days', () => {
    const { entries, phaseOfDate } = log({
      1: {}, 2: {}, 3: {}, 4: {}, 5: {},
      17: { cravings: ['sweet'] }, 18: { cravings: ['sweet'] }, 19: { cravings: ['sweet'] }, 20: { cravings: ['sweet'] },
    })
    const c = feelingsByPhase(entries, phaseOfDate, PHASES).find((s) => s.key === 'cravings')!
    const note = feelingNotes([c])[0]
    expect(note?.text).toMatch(/You log a craving on 100% of luteal days/)
    expect(note?.text).toMatch(/across the month/)
  })
})
