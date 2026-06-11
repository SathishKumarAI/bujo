import { describe, expect, it } from 'vitest'
import { musclesForExercise, nextSplit, parseSet, personalRecords, PPL_PRESETS, splitMeta } from './fitness'
import { emptyJournal } from './storage'
import type { JournalData, Workout } from './types'

const workout = (p: Partial<Workout>): Workout => ({
  id: p.id ?? 'w1', date: p.date ?? '2026-06-10', activity: 'session',
  sets: p.sets ?? [], notes: '', ...p,
})

describe('parseSet', () => {
  it('parses exercise + weight from a set line', () => {
    expect(parseSet('Bench Press 5x5 @ 60kg')).toEqual({ exercise: 'Bench Press', weight: 60 })
  })
  it('tolerates the × glyph and decimals', () => {
    expect(parseSet('Squat 3×8 @ 82.5kg')).toEqual({ exercise: 'Squat', weight: 82.5 })
  })
  it('returns null for non-set text', () => {
    expect(parseSet('felt strong today')).toBeNull()
  })
})

describe('personalRecords', () => {
  it('keeps the heaviest weight per exercise', () => {
    const d: JournalData = {
      ...emptyJournal(),
      workouts: [
        workout({ id: 'a', date: '2026-06-01', sets: ['Bench 5x5 @ 50kg'] }),
        workout({ id: 'b', date: '2026-06-08', sets: ['Bench 5x5 @ 60kg', 'Squat 5x5 @ 80kg'] }),
      ],
    }
    const prs = personalRecords(d)
    expect(prs.find((p) => p.exercise === 'Bench')?.weight).toBe(60)
    expect(prs.find((p) => p.exercise === 'Squat')?.weight).toBe(80)
  })
})

describe('nextSplit', () => {
  it('defaults to push with no history', () => {
    expect(nextSplit(emptyJournal())).toBe('push')
  })
  it('rotates push → pull → legs → push', () => {
    const d = { ...emptyJournal(), workouts: [workout({ split: 'push', date: '2026-06-10' })] }
    expect(nextSplit(d)).toBe('pull')
  })
})

describe('musclesForExercise', () => {
  it('maps bench press to chest/shoulders/triceps (ids 4,2,5)', () => {
    expect(musclesForExercise('Barbell Bench Press').sort()).toEqual([2, 4, 5])
  })
  it('disambiguates leg curl from bicep curl', () => {
    expect(musclesForExercise('Leg Curl')).toEqual([11]) // hamstrings, not biceps
    expect(musclesForExercise('Bicep Curl').sort()).toEqual([1, 13])
  })
  it('returns empty for an unknown exercise', () => {
    expect(musclesForExercise('Meditation')).toEqual([])
  })
})

describe('presets & meta', () => {
  it('ships three PPL presets', () => {
    expect(PPL_PRESETS.map((p) => p.split)).toEqual(['push', 'pull', 'legs'])
  })
  it('maps a split to label + color', () => {
    expect(splitMeta('legs').label).toBe('Legs')
  })
})
