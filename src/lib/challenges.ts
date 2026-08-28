import type { Challenge, JournalData } from './types'
import { addDays, dayDiff, todayISO } from './date'

/** Built-in challenge presets. `rules` are the daily required tasks. */
export interface ChallengePreset {
  name: string
  durationDays: number
  strict: boolean
  rules: string[]
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    name: '75 Hard',
    durationDays: 75,
    strict: true,
    rules: [
      'Two 45-min workouts (1 outdoor)',
      'Follow a diet — no cheat meals',
      'Drink 1 gallon of water',
      'Read 10 pages of nonfiction',
      'Take a progress photo',
      'No alcohol',
    ],
  },
  {
    name: '75 Soft',
    durationDays: 75,
    strict: false,
    rules: ['One 45-min workout', 'Eat well (one cheat meal/week ok)', 'Drink 3L water', 'Read 10 pages'],
  },
  {
    name: '90-day',
    durationDays: 90,
    strict: false,
    rules: ['Move your body', 'Eat clean', 'Sleep 7+ hours', 'One deliberate habit'],
  },
  {
    name: '30-day',
    durationDays: 30,
    strict: false,
    rules: ['Your daily habit'],
  },
  {
    name: 'Custom',
    durationDays: 30,
    strict: false,
    rules: [],
  },
]

/** Rule indices marked done for a challenge on a given ISO day. */
export function rulesDoneOn(data: JournalData, challengeId: string, day: string): number[] {
  return data.challengeLog?.[challengeId]?.[day] ?? []
}

/** A day is complete when every rule is checked. */
export function isDayComplete(data: JournalData, c: Challenge, day: string): boolean {
  // A zero-rule challenge (e.g. a freshly-created Custom one with no rules yet)
  // has nothing to check off, so every elapsed day is trivially complete. Without
  // this guard such a challenge can never advance and is stuck at 0% forever.
  if (c.rules.length === 0) return true
  return rulesDoneOn(data, c.id, day).length >= c.rules.length
}

/** Calendar day number within the challenge (1-based), clamped to [0, duration]. */
export function elapsedDay(c: Challenge, today: string): number {
  const diff = dayDiff(c.startDate, today) // 0 on the start day
  if (diff < 0) return 0
  return Math.min(diff + 1, c.durationDays)
}

/** Count of fully-complete days within the challenge window. */
export function completedDays(data: JournalData, c: Challenge, today: string): number {
  const upto = elapsedDay(c, today)
  let n = 0
  for (let i = 0; i < upto; i++) {
    if (isDayComplete(data, c, addDays(c.startDate, i))) n += 1
  }
  return n
}

/** Consecutive complete days ending the day before `today` (whole number). */
export function streakBeforeToday(data: JournalData, c: Challenge, today: string): number {
  let n = 0
  let d = addDays(today, -1)
  while (dayDiff(c.startDate, d) >= 0) {
    if (isDayComplete(data, c, d)) {
      n += 1
      d = addDays(d, -1)
    } else break
  }
  return n
}

/**
 * Whole-number percent complete (0–100), never a fraction.
 *
 * Single source of truth = `completedDays`, the same count the review strip
 * shows. `progressDay` used to live here — the day you are "on", which for a
 * strict challenge was `streakBeforeToday + 1`. The view printed it beside the
 * streak and beside `elapsedDay`, so the page showed day 4, day 5 done and day
 * 9 elapsed at once and read as three contradictory counts. It had no other
 * caller, so it is gone rather than merely unused; the strict reset is told by
 * the streak, which is the same number said once.
 */
export function percentComplete(data: JournalData, c: Challenge, today: string): number {
  if (!c.durationDays) return 0 // guard 0-duration (imported/legacy) → avoid NaN in the ProgressRing
  return Math.round((completedDays(data, c, today) / c.durationDays) * 100)
}

/**
 * Days already gone by without every rule ticked.
 *
 * Today is deliberately NOT counted while it is still open — you have not
 * missed a day you are still living. That makes the three review numbers a
 * partition of the elapsed window rather than three unrelated counts:
 *
 *     completedDays + missedDays + (1 if today is still open) === elapsedDay
 *
 * The page used to print `duration - completedDays` as "days left" beside
 * `elapsedDay`, which counts from a different origin, so the numbers could not
 * be reconciled by anyone adding them up. `challenges.test.ts` asserts the
 * identity above; it is the whole reason this function exists rather than
 * being inlined in the view.
 */
export function missedDays(data: JournalData, c: Challenge, today: string): number {
  const elapsed = elapsedDay(c, today)
  if (elapsed === 0) return 0
  const open = isDayComplete(data, c, today) ? 0 : 1
  return Math.max(0, elapsed - completedDays(data, c, today) - open)
}

/** Longest run of consecutive complete days so far (best streak). */
export function longestStreak(data: JournalData, c: Challenge, today = todayISO()): number {
  const upto = elapsedDay(c, today)
  let best = 0
  let run = 0
  for (let i = 0; i < upto; i++) {
    if (isDayComplete(data, c, addDays(c.startDate, i))) { run += 1; best = Math.max(best, run) } else run = 0
  }
  return best
}

/** True once the whole challenge has been completed. */
export function isFinished(data: JournalData, c: Challenge, today: string): boolean {
  if (c.strict) return streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0) >= c.durationDays
  return completedDays(data, c, today) >= c.durationDays
}
