import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TARGETS, averages, daysSinceLogged, inTargetStreak, loggedDays, nextStep,
  targetsOf, topFoods, trainingBalance, weekdayIntake,
} from './nutritionReview'
import { emptyJournal } from './storage'
import { addDays } from './date'
import type { JournalData } from './types'

const TODAY = '2026-10-16'

const journal = (metrics: JournalData['metrics']): JournalData => ({ ...emptyJournal(), metrics })
const food = (id: string, name: string, kcal: number) => ({ id, name, kcal, protein: 0, carbs: 0, fat: 0 })
const day = (date: string, calories: number, protein = 0, foodLog?: ReturnType<typeof food>[]) =>
  ({ date, calories, protein, ...(foodLog ? { foodLog } : {}) })

/**
 * Every assertion here is a floor rather than arithmetic: a mean that reports 0
 * where it means "nothing logged", a day that has not happened being counted as
 * a fast, and a streak that a blank today must not break.
 */
describe('targetsOf', () => {
  it('falls back per field, so setting one target does not zero the others', () => {
    expect(targetsOf({ nutritionTargets: { calories: 1800 } })).toEqual({ ...DEFAULT_TARGETS, calories: 1800 })
    expect(targetsOf(undefined)).toEqual({ ...DEFAULT_TARGETS })
    // A zero is not a target anyone means.
    expect(targetsOf({ nutritionTargets: { protein: 0 } }).protein).toBe(DEFAULT_TARGETS.protein)
  })
})

describe('loggedDays and averages', () => {
  const d = journal([day(TODAY, 2100, 130), day(addDays(TODAY, -1), 1800, 90), day(addDays(TODAY, -2), 0, 0)])

  it('counts only the days with something on them', () => {
    const rows = loggedDays(d, 14, TODAY)
    expect(rows.map((r) => r.kcal)).toEqual([2100, 1800])
  })

  it('returns null means rather than zeroes when nothing is logged', () => {
    const a = averages([])
    expect(a.kcal).toBeNull()
    expect(a.protein).toBeNull()
    expect(a.days).toBe(0)
  })

  it('treats the 5% slack as on target', () => {
    // 2100 of 2000 is 5% over exactly, which is not "over".
    expect(loggedDays(d, 14, TODAY).find((r) => r.kcal === 2100)!.over).toBe(false)
    expect(loggedDays(journal([day(TODAY, 2200)]), 14, TODAY)[0].over).toBe(true)
  })
})

describe('weekdayIntake', () => {
  it('is seven rows, and a weekday with nothing logged averages null', () => {
    const rows = weekdayIntake(loggedDays(journal([day(TODAY, 2000)]), 14, TODAY))
    expect(rows).toHaveLength(7)
    // 2026-10-16 is a Friday.
    expect(rows.find((r) => r.day === 'Fri')!.avgKcal).toBe(2000)
    expect(rows.find((r) => r.day === 'Mon')!.avgKcal).toBeNull()
  })
})

describe('topFoods', () => {
  it('ranks by the calories a food contributed, not by how often it appears', () => {
    const d = journal([day(TODAY, 1500, 50, [
      food('a', 'Coffee', 50), food('b', 'coffee', 50), food('c', 'Coffee', 50), food('d', 'Biryani', 900),
    ])])
    const rows = topFoods(d, 14, TODAY)
    expect(rows[0].name).toBe('Biryani')
    // Case-insensitive, so one food is one row with its real count.
    expect(rows[1]).toMatchObject({ name: 'Coffee', times: 3, kcal: 150 })
    expect(rows[0].share).toBe(86)
  })

  it('is empty rather than a zero row when nothing carries a food log', () => {
    expect(topFoods(journal([day(TODAY, 2000)]), 14, TODAY)).toEqual([])
  })
})

describe('inTargetStreak', () => {
  it('does not let an unlogged today break a streak', () => {
    // Today blank, the three days before it inside target.
    const d = journal([1, 2, 3].map((i) => day(addDays(TODAY, -i), 1900)))
    expect(inTargetStreak(d, DEFAULT_TARGETS, TODAY)).toBe(3)
  })

  it('stops at the first day over target', () => {
    const d = journal([day(TODAY, 1900), day(addDays(TODAY, -1), 2600), day(addDays(TODAY, -2), 1900)])
    expect(inTargetStreak(d, DEFAULT_TARGETS, TODAY)).toBe(1)
  })
})

describe('nextStep', () => {
  const opts = { date: TODAY, targets: DEFAULT_TARGETS, today: TODAY }

  it('is total — an empty record still gets a sentence', () => {
    const step = nextStep(emptyJournal(), opts)
    expect(step.id).toBe('first')
    expect(step.text.length).toBeGreaterThan(20)
  })

  it('asks for the record before judging the day', () => {
    // Other days logged, today blank: the page must not say "0 kcal, well under".
    const d = journal([day(addDays(TODAY, -1), 2000)])
    expect(nextStep(d, opts).id).toBe('untracked')
  })

  it('names the protein gap while there is room for it', () => {
    const d = journal([day(TODAY, 1500, 40)])
    const step = nextStep(d, opts)
    expect(step.id).toBe('protein')
    expect(step.text).toContain('80 g of protein short')
  })

  it('says over without scolding, and points at the fortnight', () => {
    const step = nextStep(journal([day(TODAY, 2600, 130)]), opts)
    expect(step.id).toBe('over')
    expect(step.group).toBe('trend')
  })
})

describe('daysSinceLogged', () => {
  it('is null with nothing logged, which is not the same as zero', () => {
    expect(daysSinceLogged(emptyJournal(), TODAY)).toBeNull()
    expect(daysSinceLogged(journal([day(addDays(TODAY, -3), 2000)]), TODAY)).toBe(3)
  })
})

/**
 * The cross-page claim, and the only thing worth asserting about it: it must
 * refuse to compare a Tuesday with a fortnight. The momentum-indicator bug in
 * CLAUDE.md is exactly this shape — a two-day sample against a seven-day one,
 * reporting a lapse as an improvement.
 */
describe('trainingBalance', () => {
  const withWorkouts = (metrics: JournalData['metrics'], dates: string[]): JournalData => ({
    ...emptyJournal(),
    metrics,
    workouts: dates.map((date, i) => ({ id: `w${i}`, date, activity: 'run' as const, sets: [], notes: '' })),
  })

  it('says nothing until there are three logged days on each side', () => {
    const d = withWorkouts([day(TODAY, 2000, 150), day(addDays(TODAY, -1), 2000, 80)], [TODAY])
    const b = trainingBalance(d, DEFAULT_TARGETS, 14, TODAY)
    expect(b.onTraining).toBeNull()
    expect(b.onRest).toBeNull()
    expect(b.trainingDays).toBe(1)
  })

  it('compares the two means once both sides clear the floor', () => {
    const trainingDates = [0, 1, 2].map((i) => addDays(TODAY, -i))
    const metrics = [
      ...trainingDates.map((date) => day(date, 2000, 150)),
      ...[3, 4, 5].map((i) => day(addDays(TODAY, -i), 2000, 60)),
    ]
    const b = trainingBalance(withWorkouts(metrics, trainingDates), DEFAULT_TARGETS, 14, TODAY)
    expect(b.onTraining).toBe(150)
    expect(b.onRest).toBe(60)
    expect(b.bothDays).toBe(3)
    expect(b.floor).toBe(DEFAULT_TARGETS.protein)
  })
})
