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
  if (c.rules.length === 0) return false
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
 * The day the user is currently *on* (1-based, whole number, never fractional).
 * - Strict (75 Hard): missing a day resets — you're on `streak + 1`.
 * - Lenient: simply the calendar day elapsed.
 */
export function progressDay(data: JournalData, c: Challenge, today: string): number {
  if (elapsedDay(c, today) === 0) return 0
  const day = c.strict ? streakBeforeToday(data, c, today) + 1 : elapsedDay(c, today)
  return Math.min(day, c.durationDays)
}

/** Whole-number percent complete (0–100), never a fraction. */
export function percentComplete(data: JournalData, c: Challenge, today: string): number {
  const day = c.strict ? streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0) : completedDays(data, c, today)
  return Math.round((day / c.durationDays) * 100)
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
