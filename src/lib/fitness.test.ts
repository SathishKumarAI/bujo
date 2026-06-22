import { describe, expect, it } from 'vitest'
import { epley1RM, musclesForExercise, nextSplit, parseSet, personalRecords, PPL_PRESETS, splitMeta, pace, weeklyActiveMinutes, activeDayStreak, cardioPBs, platesPerSide, barExceedsTarget, lastSetFor, sessionVolume, exerciseProgression } from './fitness'
import { emptyJournal } from './storage'
import type { JournalData, Workout } from './types'

const workout = (p: Partial<Workout>): Workout => ({
  id: p.id ?? 'w1', date: p.date ?? '2026-06-10', activity: 'session',
  sets: p.sets ?? [], notes: '', ...p,
})

describe('parseSet', () => {
  it('parses exercise + reps + weight from a set line', () => {
    expect(parseSet('Bench Press 5x5 @ 60kg')).toEqual({ exercise: 'Bench Press', reps: 5, weight: 60 })
  })
  it('tolerates the × glyph and decimals', () => {
    expect(parseSet('Squat 3×8 @ 82.5kg')).toEqual({ exercise: 'Squat', reps: 8, weight: 82.5 })
  })
  it('returns null for non-set text', () => {
    expect(parseSet('felt strong today')).toBeNull()
  })
})

describe('epley1RM', () => {
  it('returns the weight for a single rep', () => {
    expect(epley1RM(100, 1)).toBe(100)
  })
  it('estimates a higher 1RM for multi-rep sets', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.5, 1) // 100*(1+5/30)=116.67 → 116.5
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

describe('fitness v2 helpers', () => {
  it('computes pace per km', () => {
    expect(pace(10, 50, 'km')).toBe('5:00 /km')
    expect(pace(0, 50)).toBe('')
  })
  it('sums weekly active minutes within the window', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-11', activity: 'Run', durationMin: 30, sets: [], notes: '' },
      { id: '2', date: '2026-06-09', activity: 'Run', durationMin: 20, sets: [], notes: '' },
      { id: '3', date: '2026-06-01', activity: 'Run', durationMin: 99, sets: [], notes: '' },
    ]
    expect(weeklyActiveMinutes(d, '2026-06-11')).toBe(50)
  })
  it('counts active-day streak and all-time PBs', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-11', activity: 'Run', durationMin: 30, distanceKm: 8, calories: 400, sets: [], notes: '' },
      { id: '2', date: '2026-06-10', activity: 'Run', durationMin: 20, distanceKm: 5, calories: 250, sets: [], notes: '' },
    ]
    expect(activeDayStreak(d, '2026-06-11')).toBe(2)
    expect(cardioPBs(d)).toEqual({ longestKm: 8, mostCalories: 400, mostMinutes: 30 })
  })
  it('computes plates per side', () => {
    expect(platesPerSide(100, 20)).toEqual([25, 15]) // (100-20)/2 = 40 = 25+15
    expect(platesPerSide(20, 20)).toEqual([]) // just the bar
  })
  it('flags when the bar alone exceeds the target (BUJO-211)', () => {
    expect(barExceedsTarget(15, 20)).toBe(true) // 20kg bar > 15kg target → warn
    expect(barExceedsTarget(20, 20)).toBe(false) // bar == target, loads exactly
    expect(barExceedsTarget(100, 20)).toBe(false) // room for plates
  })
  it('finds the last set + computes volume + progression', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-01', activity: 'Push day', sets: [], setRows: [{ exercise: 'Bench Press', weight: 60, reps: 5, kind: 'working' }], notes: '' },
      { id: '2', date: '2026-06-08', activity: 'Push day', sets: [], setRows: [{ exercise: 'Bench Press', weight: 65, reps: 5 }, { exercise: 'Bench Press', weight: 40, reps: 10, kind: 'warmup' }], notes: '' },
    ]
    expect(lastSetFor(d, 'bench press')).toEqual({ weight: 65, reps: 5, date: '2026-06-08' })
    expect(sessionVolume(d.workouts[1].setRows!)).toBe(325) // 65*5; warmup excluded
    expect(exerciseProgression(d, 'Bench Press')).toEqual([{ date: '06-01', weight: 60 }, { date: '06-08', weight: 65 }])
  })
  it('lastSetFor returns the latest set, not the heaviest (BUJO-211)', () => {
    const d = emptyJournal()
    // Same day: heaviest is the FIRST working set (80), but the last logged
    // working set is the back-off at 70. "Repeat last" must return 70, not 80.
    d.workouts = [
      { id: '1', date: '2026-06-08', activity: 'Push day', sets: [], setRows: [
        { exercise: 'Bench Press', weight: 80, reps: 3, kind: 'working' },
        { exercise: 'Bench Press', weight: 70, reps: 8, kind: 'working' },
      ], notes: '' },
    ]
    expect(lastSetFor(d, 'bench press')).toEqual({ weight: 70, reps: 8, date: '2026-06-08' })
  })
  it('lastSetFor falls back to the last matching legacy string (BUJO-211)', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-08', activity: 'Push day', sets: [
        'Bench Press 1x5 @ 80kg', 'Bench Press 1x8 @ 70kg',
      ], notes: '' },
    ]
    // Last legacy line wins → 70, parseSet reads reps from the post-`x` number.
    expect(lastSetFor(d, 'bench press')).toEqual({ weight: 70, reps: 8, date: '2026-06-08' })
  })
})
