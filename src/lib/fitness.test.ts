import { describe, expect, it } from 'vitest'
import { epley1RM, musclesForExercise, nextSplit, parseSet, personalRecords, PPL_PRESETS, splitMeta, pace, weeklyActiveMinutes, activeDayStreak, cardioPBs, platesPerSide, barExceedsTarget, lastSetFor, sessionVolume, sessionSummary, warmupRamp, exerciseProgression, isNewPR, bodyweightSeries, weeklySetsPerMuscle, e1rmProgression, trainingHeatmap, cardioBadges } from './fitness'
import { plateColor } from '../components/PlateStack'
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

describe('lastSetFor — ghost prefill (F1)', () => {
  const d = (): JournalData => {
    const j = emptyJournal()
    j.workouts = [
      { id: '1', date: '2026-06-01', activity: 'Push', sets: [], setRows: [{ exercise: 'Bench Press', weight: 60, reps: 5, kind: 'working' }], notes: '' },
      { id: '2', date: '2026-06-08', activity: 'Push', sets: [], setRows: [{ exercise: 'Bench Press', weight: 65, reps: 5, kind: 'working' }], notes: '' },
    ]
    return j
  }
  it('returns the most recent working set before a date', () => {
    // Before 2026-06-08 the latest is the 2026-06-01 session (60kg).
    expect(lastSetFor(d(), 'Bench Press', '2026-06-08')).toEqual({ weight: 60, reps: 5, date: '2026-06-01' })
  })
  it('returns null when nothing precedes the date', () => {
    expect(lastSetFor(d(), 'Bench Press', '2026-06-01')).toBeNull()
  })
  it('returns null for an exercise never logged', () => {
    expect(lastSetFor(d(), 'Deadlift')).toBeNull()
    expect(lastSetFor(emptyJournal(), 'Bench Press')).toBeNull()
  })
})

describe('isNewPR (F2)', () => {
  const withBench = (weight: number, reps: number): JournalData => {
    const j = emptyJournal()
    // personalRecords() reads legacy `sets` strings, so seed the record that way.
    j.workouts = [{ id: '1', date: '2026-06-01', activity: 'Push', sets: [`Bench Press 1x${reps} @ ${weight}kg`], notes: '' }]
    return j
  }
  it('counts the first-ever set for an exercise as a PR', () => {
    expect(isNewPR(emptyJournal(), 'Bench Press', 60, 5)).toBe(true)
  })
  it('flags a heavier weight', () => {
    expect(isNewPR(withBench(60, 5), 'Bench Press', 65, 5)).toBe(true)
  })
  it('does NOT flag a tie (must beat, not match)', () => {
    expect(isNewPR(withBench(60, 5), 'Bench Press', 60, 5)).toBe(false)
  })
  it('does NOT flag a lower weight at the same reps', () => {
    expect(isNewPR(withBench(60, 5), 'Bench Press', 55, 5)).toBe(false)
  })
  it('flags a rep PR at lighter weight via estimated 1RM', () => {
    // 60kg×5 1RM ≈ 70; 55kg×10 1RM ≈ 73.5 → higher, so it is a PR.
    expect(isNewPR(withBench(60, 5), 'Bench Press', 55, 10)).toBe(true)
  })
  it('rejects empty / non-positive input', () => {
    expect(isNewPR(withBench(60, 5), '', 80, 5)).toBe(false)
    expect(isNewPR(withBench(60, 5), 'Bench Press', 0, 5)).toBe(false)
    expect(isNewPR(withBench(60, 5), 'Bench Press', 80, 0)).toBe(false)
  })
})

describe('platesPerSide is deterministic (F3)', () => {
  it('returns the same descending plate stack on repeated calls', () => {
    const a = platesPerSide(100, 20)
    const b = platesPerSide(100, 20)
    expect(a).toEqual(b)
    expect(a).toEqual([25, 15])
    // sorted descending (visualiser stacks heaviest at the centre)
    expect([...a].sort((x, y) => y - x)).toEqual(a)
  })
})

describe('plateColor map (F3)', () => {
  it('maps a known plate to a stable Catppuccin token color', () => {
    expect(plateColor(25)).toBe(plateColor(25)) // stable
    expect(plateColor(25)).not.toBe(plateColor(20)) // distinct per denomination
  })
  it('falls back for an unknown denomination', () => {
    expect(typeof plateColor(99)).toBe('string')
    expect(plateColor(99).startsWith('#')).toBe(true)
  })
})

describe('sessionSummary (post-finish rollup)', () => {
  it('sums working volume, counts working sets, and finds the top set', () => {
    const rows: import('./types').WorkoutSet[] = [
      { exercise: 'Bench Press', weight: 40, reps: 10, kind: 'warmup' }, // excluded
      { exercise: 'Bench Press', weight: 80, reps: 5, kind: 'working' },
      { exercise: 'Bench Press', weight: 70, reps: 8, kind: 'working' },
    ]
    expect(sessionSummary(rows)).toEqual({
      volume: 80 * 5 + 70 * 8, // 960
      sets: 2,
      topSet: { exercise: 'Bench Press', weight: 80, reps: 5 },
    })
  })
  it('breaks a top-set weight tie by reps', () => {
    const rows: import('./types').WorkoutSet[] = [
      { exercise: 'Squat', weight: 100, reps: 3 },
      { exercise: 'Squat', weight: 100, reps: 5 },
    ]
    expect(sessionSummary(rows).topSet).toEqual({ exercise: 'Squat', weight: 100, reps: 5 })
  })
  it('ignores rows missing weight or reps and returns a null top set when empty', () => {
    expect(sessionSummary([{ exercise: 'Plank', reps: 60 }])).toEqual({ volume: 0, sets: 0, topSet: null })
    expect(sessionSummary([])).toEqual({ volume: 0, sets: 0, topSet: null })
  })
})

describe('warmupRamp (auto warm-up generator)', () => {
  it('produces a bar + 40/60/80% ramp under the working weight', () => {
    // 100kg @ 20kg bar → bar(20), 40(40), 60(60), 80(80→ equals? 80<100 keep)
    expect(warmupRamp(100, 20)).toEqual([
      { pct: 0, weight: 20 },
      { pct: 40, weight: 40 },
      { pct: 60, weight: 60 },
      { pct: 80, weight: 80 },
    ])
  })
  it('rounds rungs to the nearest loadable step (2.5kg)', () => {
    // 70kg: 40%→28→27.5, 60%→42→42.5, 80%→56→55
    expect(warmupRamp(70, 20)).toEqual([
      { pct: 0, weight: 20 },
      { pct: 40, weight: 27.5 },
      { pct: 60, weight: 42.5 },
      { pct: 80, weight: 55 },
    ])
  })
  it('is strictly ascending and never meets or exceeds the work weight', () => {
    const ramp = warmupRamp(70, 20)
    for (let i = 1; i < ramp.length; i++) expect(ramp[i].weight).toBeGreaterThan(ramp[i - 1].weight)
    expect(ramp.every((r) => r.weight < 70)).toBe(true)
  })
  it('collapses rungs that round to the same load (light working weight)', () => {
    // 30kg @ 20kg bar: bar 20, 40%→12→20(=bar dup, dropped), 60%→18→20(dup), 80%→24>... 24<30 keep
    const ramp = warmupRamp(30, 20)
    const weights = ramp.map((r) => r.weight)
    expect(new Set(weights).size).toBe(weights.length) // no duplicate loads
    expect(weights[0]).toBe(20)
  })
  it('returns [] when the target is not above the bar', () => {
    expect(warmupRamp(20, 20)).toEqual([])
    expect(warmupRamp(15, 20)).toEqual([])
  })
  it('honours a custom bar and step (lb)', () => {
    const ramp = warmupRamp(225, 45, 5)
    expect(ramp[0]).toEqual({ pct: 0, weight: 45 })
    expect(ramp.every((r) => r.weight < 225)).toBe(true)
    expect(ramp.every((r) => r.weight % 5 === 0 || r.weight === 45)).toBe(true)
  })
})

describe('bodyweightSeries (F10)', () => {
  const j = (): JournalData => {
    const d = emptyJournal()
    d.bodyMetrics = [
      { date: '2026-06-03', weight: 82, measurements: {} },
      { date: '2026-06-01', weight: 80, measurements: {} },
      { date: '2026-06-02', measurements: {} }, // gap: no weight → skipped
      { date: '2026-06-04', weight: 84, measurements: {} },
    ]
    return d
  }
  it('orders points ascending by date and skips weightless gaps', () => {
    const s = bodyweightSeries(j())
    expect(s.map((p) => p.date)).toEqual(['06-01', '06-03', '06-04'])
    expect(s.map((p) => p.weight)).toEqual([80, 82, 84])
  })
  it('computes a trailing 7-day moving average', () => {
    const s = bodyweightSeries(j())
    expect(s[0].avg).toBe(80) // first point
    expect(s[1].avg).toBe(81) // (80+82)/2
    expect(s[2].avg).toBe(82) // (80+82+84)/3
  })
  it('carries a goal value on each point only when supplied', () => {
    expect(bodyweightSeries(j())[0].goal).toBeUndefined()
    expect(bodyweightSeries(j(), 78).every((p) => p.goal === 78)).toBe(true)
  })
  it('returns [] when no body weight is logged', () => {
    expect(bodyweightSeries(emptyJournal())).toEqual([])
  })
})

describe('weeklySetsPerMuscle (#158 muscle volume balance)', () => {
  it('counts a working set toward every muscle its exercise trains', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-11', activity: 'Push', sets: [], setRows: [
        { exercise: 'Bench Press', weight: 60, reps: 5, kind: 'working' }, // 4,2,5
        { exercise: 'Bench Press', weight: 60, reps: 5, kind: 'working' },
        { exercise: 'Bench Press', weight: 40, reps: 10, kind: 'warmup' }, // excluded
      ], notes: '' },
    ]
    const counts = weeklySetsPerMuscle(d, '2026-06-11')
    // chest(4)/shoulders(2)/triceps(5) each get 2 working sets; warm-up ignored.
    expect(counts.find((c) => c.muscle === 4)?.sets).toBe(2)
    expect(counts.find((c) => c.muscle === 2)?.sets).toBe(2)
    expect(counts.find((c) => c.muscle === 5)?.sets).toBe(2)
  })
  it('only counts sets inside the window and sorts by count desc', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-11', activity: 'Pull', sets: [], setRows: [
        { exercise: 'Bicep Curl', weight: 15, reps: 10 }, // 1,13
        { exercise: 'Bicep Curl', weight: 15, reps: 10 },
        { exercise: 'Pull-up', weight: 0, reps: 8 }, // 12,1,9
      ], notes: '' },
      { id: '2', date: '2026-06-01', activity: 'old', sets: [], setRows: [
        { exercise: 'Squat', weight: 100, reps: 5 }, // outside 7-day window
      ], notes: '' },
    ]
    const counts = weeklySetsPerMuscle(d, '2026-06-11')
    // Biceps(1) hit by both curls + the pull-up = 3 → ranks first.
    expect(counts[0]).toEqual({ muscle: 1, sets: 3 })
    // The out-of-window squat (quads=10) must not appear.
    expect(counts.find((c) => c.muscle === 10)).toBeUndefined()
  })
  it('falls back to legacy set strings when there are no structured rows', () => {
    const d = emptyJournal()
    d.workouts = [{ id: '1', date: '2026-06-11', activity: 'Push', sets: ['Bench Press 5x5 @ 60kg'], notes: '' }]
    const counts = weeklySetsPerMuscle(d, '2026-06-11')
    expect(counts.find((c) => c.muscle === 4)?.sets).toBe(1)
  })
})

describe('e1rmProgression (#101 estimated-1RM trend)', () => {
  it('plots the best estimated 1RM per day, ascending, crediting rep PRs', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-08', activity: 'Push', sets: [], setRows: [
        { exercise: 'Bench Press', weight: 60, reps: 5, kind: 'working' }, // e1RM 70
        { exercise: 'Bench Press', weight: 70, reps: 1, kind: 'working' }, // e1RM 70 (tie)
      ], notes: '' },
      { id: '2', date: '2026-06-01', activity: 'Push', sets: [], setRows: [
        { exercise: 'Bench Press', weight: 65, reps: 5, kind: 'working' }, // e1RM 75.5
        { exercise: 'Bench Press', weight: 50, reps: 5, kind: 'warmup' }, // excluded
      ], notes: '' },
    ]
    expect(e1rmProgression(d, 'Bench Press')).toEqual([
      { date: '06-01', e1rm: epley1RM(65, 5) }, // 75.5
      { date: '06-08', e1rm: 70 },
    ])
  })
  it('returns [] for a never-logged exercise or empty name', () => {
    expect(e1rmProgression(emptyJournal(), 'Deadlift')).toEqual([])
    expect(e1rmProgression(emptyJournal(), '')).toEqual([])
  })
})

describe('trainingHeatmap (#162 workout calendar)', () => {
  it('emits one contiguous cell per day, today last, with relative intensity levels', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-11', activity: 'Push', sets: [], setRows: [{ exercise: 'Bench', weight: 100, reps: 5 }], notes: '' }, // vol 500 (peak)
      { id: '2', date: '2026-06-09', activity: 'Push', sets: [], setRows: [{ exercise: 'Bench', weight: 25, reps: 5 }], notes: '' }, // vol 125
    ]
    const cells = trainingHeatmap(d, '2026-06-11', 5)
    expect(cells).toHaveLength(5)
    expect(cells[cells.length - 1].date).toBe('2026-06-11') // today is last
    expect(cells[0].date).toBe('2026-06-07') // oldest first
    const peak = cells.find((c) => c.date === '2026-06-11')!
    const light = cells.find((c) => c.date === '2026-06-09')!
    const rest = cells.find((c) => c.date === '2026-06-10')!
    expect(peak).toMatchObject({ volume: 500, level: 4 })
    expect(rest).toMatchObject({ volume: 0, level: 0 }) // untrained day
    expect(light.level).toBeGreaterThanOrEqual(1) // any trained day is ≥1
    expect(light.level).toBeLessThan(4)
  })
  it('marks all days level 0 when nothing is trained', () => {
    const cells = trainingHeatmap(emptyJournal(), '2026-06-11', 3)
    expect(cells.every((c) => c.level === 0 && c.volume === 0)).toBe(true)
  })
})

describe('cardioBadges (#251 PB badges with date earned)', () => {
  it('pairs each cardio best with the earliest date it was reached', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: '1', date: '2026-06-01', activity: 'Run', distanceKm: 10, durationMin: 50, calories: 400, sets: [], notes: '' },
      { id: '2', date: '2026-06-08', activity: 'Run', distanceKm: 10, durationMin: 60, calories: 300, sets: [], notes: '' }, // ties distance later, beats minutes
    ]
    const badges = cardioBadges(d)
    const dist = badges.find((b) => b.key === 'longestKm')!
    const mins = badges.find((b) => b.key === 'mostMinutes')!
    expect(dist).toEqual({ key: 'longestKm', label: 'Longest distance', value: 10, date: '2026-06-01' }) // earliest tie wins
    expect(mins).toEqual({ key: 'mostMinutes', label: 'Longest session', value: 60, date: '2026-06-08' })
  })
  it('carries a null date for bests that were never logged', () => {
    const badges = cardioBadges(emptyJournal())
    expect(badges.every((b) => b.value === 0 && b.date === null)).toBe(true)
  })
})
