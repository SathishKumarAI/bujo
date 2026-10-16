import { describe, expect, it } from 'vitest'
import {
  CADENCE_FLOOR, activityMix, bestsByActivity, cadence, fitnessMilestones, nextStep, weekdayLoad, weeklyLoad,
} from './fitnessReview'
import { addDays } from './date'
import type { Workout } from './types'

/**
 * These assertions are the floors, not the arithmetic.
 *
 * Every one of them is a bug CLAUDE.md already records happening on another
 * page: a mean that reports 0 where it means "nothing logged", a window
 * comparison with no coverage floor that inverts a lapse into progress, a
 * weekday series that drops the days you rested, and `expect(null)
 * .toBeGreaterThanOrEqual(0)` passing by coercion — which is why `avgMin` is
 * asserted `toBeNull()` and not "falsy".
 */
const TODAY = '2026-10-15'

const w = (date: string, p: Partial<Workout> = {}): Workout => ({
  id: `w-${date}-${p.activity ?? 'run'}`, date, activity: 'run', sets: [], notes: '', ...p,
} as Workout)

describe('weekdayLoad', () => {
  it('returns all seven days, and a day never trained averages null rather than 0', () => {
    // 2026-10-15 is a Thursday.
    const rows = weekdayLoad([w(TODAY, { durationMin: 30 }), w(TODAY, { durationMin: 50 })])
    expect(rows).toHaveLength(7)
    expect(rows.map((r) => r.day)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

    const thu = rows.find((r) => r.day === 'Thu')!
    expect(thu.sessions).toBe(2)
    expect(thu.minutes).toBe(80)
    expect(thu.avgMin).toBe(40)

    const mon = rows.find((r) => r.day === 'Mon')!
    expect(mon.sessions).toBe(0)
    // `toBeNull`, because `expect(null).toBeGreaterThanOrEqual(0)` coerces and
    // passes — the exact way `weekdayConsistency` hid this for months.
    expect(mon.avgMin).toBeNull()
  })
})

describe('activityMix', () => {
  it('is one row per activity, most-used first, with shares that account for every session', () => {
    const rows = activityMix([
      w(TODAY, { activity: 'walk', durationMin: 20, distanceKm: 2 }),
      w(addDays(TODAY, -1), { activity: 'run', durationMin: 40, distanceKm: 8 }),
      w(addDays(TODAY, -2), { activity: 'run', durationMin: 30, distanceKm: 6 }),
      w(addDays(TODAY, -3), { activity: 'run' }),
    ])
    expect(rows.map((r) => r.activity)).toEqual(['run', 'walk'])
    expect(rows[0]).toMatchObject({ label: 'Run', sessions: 3, minutes: 70, distanceKm: 14, share: 75 })
    expect(rows[1].share).toBe(25)
  })

  it('is empty rather than a zero row when nothing is logged', () => {
    expect(activityMix([])).toEqual([])
  })
})

describe('weeklyLoad', () => {
  it('is complete seven-day blocks, oldest first, the last one ending today', () => {
    const rows = weeklyLoad([
      w(TODAY, { durationMin: 30 }),
      w(addDays(TODAY, -8), { durationMin: 45 }),
      // Outside the window entirely — 8 blocks is 56 days.
      w(addDays(TODAY, -60), { durationMin: 90 }),
    ], 8, TODAY)
    expect(rows).toHaveLength(8)
    expect(rows[7].start).toBe(addDays(TODAY, -6))
    expect(rows[7]).toMatchObject({ minutes: 30, sessions: 1 })
    expect(rows[6]).toMatchObject({ minutes: 45, sessions: 1 })
    expect(rows.reduce((a, r) => a + r.minutes, 0)).toBe(75)
  })
})

describe('cadence', () => {
  it('refuses to state a cadence under the coverage floor', () => {
    const thin = cadence([w(TODAY), w(addDays(TODAY, -4))], 8, TODAY)
    expect(thin.daysTrained).toBeLessThan(CADENCE_FLOOR)
    // One gap is not a cadence. Both must be null — reporting `avgGap: 4` from
    // a single gap is the momentum-indicator inversion.
    expect(thin.avgGap).toBeNull()
    expect(thin.longestGap).toBeNull()
    expect(thin.daysSinceLast).toBe(0)
  })

  it('states one once there are four training days, and counts the week streak back from today', () => {
    const days = [0, 3, 6, 9].map((n) => w(addDays(TODAY, -n)))
    const c = cadence(days, 8, TODAY)
    expect(c.daysTrained).toBe(4)
    expect(c.avgGap).toBe(3)
    expect(c.longestGap).toBe(3)
    expect(c.weekStreak).toBe(2)
    expect(c.activeWeeks).toBe(2)
  })

  it('reports null, not 0, when nothing has been logged', () => {
    const c = cadence([], 8, TODAY)
    expect(c.daysSinceLast).toBeNull()
    expect(c.weekStreak).toBe(0)
  })
})

describe('bestsByActivity', () => {
  it('asks the registry which stat heads each activity, per activity', () => {
    const rows = bestsByActivity([
      w(TODAY, { activity: 'run', durationMin: 30, distanceKm: 5 }),
      w(addDays(TODAY, -1), { activity: 'yoga', durationMin: 60 }),
      w(addDays(TODAY, -2), { activity: 'yoga', durationMin: 45 }),
    ], 'km')
    const yoga = rows.find((r) => r.activity === 'yoga')!
    expect(yoga.stat).toBe('Longest')
    expect(yoga.value).toBe('60 min')
    const run = rows.find((r) => r.activity === 'run')!
    // A run is judged on pace, which needs both numbers — 30 min over 5 km.
    expect(run.stat).toBe('Best pace')
    expect(run.value).toBe('6:00 /km')
  })

  it('drops an activity whose best cannot be computed instead of printing a dash', () => {
    // A run with no distance has no pace, so there is nothing to headline.
    expect(bestsByActivity([w(TODAY, { activity: 'run', durationMin: 30 })], 'km')).toEqual([])
  })
})

describe('fitnessMilestones', () => {
  it('always offers at least two rungs, and only offers distance when some was covered', () => {
    const none = fitnessMilestones([], 'mi')
    expect(none).toHaveLength(2)
    expect(none[0]).toMatchObject({ current: 0, next: 10 })

    const withDistance = fitnessMilestones([w(TODAY, { durationMin: 60, distanceKm: 100 })], 'mi')
    expect(withDistance.map((m) => m.label)).toContain('Distance covered')
  })

  it('moves to the next rung rather than restating one already passed', () => {
    const many = Array.from({ length: 26 }, (_, i) => w(addDays(TODAY, -i)))
    expect(fitnessMilestones(many, 'km')[0].next).toBe(50)
  })
})

describe('nextStep', () => {
  const opts = { mode: 'cardio' as const, goalMin: 150, weekMinutes: 0, today: TODAY }

  it('is total — an empty record still gets a sentence', () => {
    const step = nextStep([], opts)
    expect(step.id).toBe('first')
    expect(step.text.length).toBeGreaterThan(20)
    expect(step.group).toBe('sessions')
  })

  it('puts a lapse above a goal, and states the sample behind it', () => {
    // Four training days every 3 days, then eleven days of silence: the goal
    // rule would also fire, and the week it is about is already gone.
    const days = [11, 14, 17, 20].map((n) => w(addDays(TODAY, -n)))
    const step = nextStep(days, opts)
    expect(step.id).toBe('lapse')
    expect(step.text).toContain('11 days since')
    expect(step.text).toContain('4 training days')
    expect(step.group).toBe('volume')
  })

  it('will not call a lapse without the coverage floor behind it', () => {
    const step = nextStep([w(addDays(TODAY, -30)), w(addDays(TODAY, -33))], opts)
    expect(step.id).not.toBe('lapse')
  })

  it('offers the minutes target to cardio and never to sport', () => {
    const recent = [0, 3, 6, 9].map((n) => w(addDays(TODAY, -n)))
    expect(nextStep(recent, { ...opts, weekMinutes: 110 }).id).toBe('goal')
    // A game has no minutes denominator, so the sentence falls through to a
    // fact about today rather than inventing a target.
    expect(nextStep(recent, { ...opts, mode: 'sport', weekMinutes: 110 }).id).not.toBe('goal')
  })

  it('falls through to a milestone when the target is met and today is quiet', () => {
    const recent = [2, 5, 8, 11].map((n) => w(addDays(TODAY, -n), { durationMin: 60 }))
    const step = nextStep(recent, { ...opts, weekMinutes: 200 })
    expect(step.id).toBe('milestone')
    expect(step.text).toContain('10 logged')
  })
})
