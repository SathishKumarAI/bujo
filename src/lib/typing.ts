import type { JournalData, TypingSession } from './types'
import { addDays, dayDiff, fromISODay, todayISO } from './date'

const sessions = (data: JournalData) => data.typingSessions ?? []

/** Default daily typing goal (minutes) when Settings.typingGoalMin is unset. */
export const DEFAULT_TYPING_GOAL_MIN = 60

/** Is the ISO day a weekday (Mon–Fri)? The streak only schedules weekdays. */
export function isWeekday(dateISO: string): boolean {
  const wd = fromISODay(dateISO).getDay() // 0 = Sun … 6 = Sat
  return wd >= 1 && wd <= 5
}

/** Total typing-practice minutes logged today. */
export function typingTodayMinutes(data: JournalData, today = todayISO()): number {
  return sessions(data)
    .filter((s) => s.date === today)
    .reduce((acc, s) => acc + (s.durationMin || 0), 0)
}

/** Total typing-practice minutes in the last `days` (rolling week by default). */
export function typingWeekMinutes(data: JournalData, today = todayISO(), days = 7): number {
  return sessions(data)
    .filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < days })
    .reduce((acc, s) => acc + (s.durationMin || 0), 0)
}

/**
 * Progress toward the daily (1-hour) practice goal. `pct` is clamped 0–100,
 * `met` is true once minutes reach the goal.
 */
export function typingGoalProgress(
  data: JournalData,
  today = todayISO(),
  goalMin = DEFAULT_TYPING_GOAL_MIN,
): { minutes: number; goalMin: number; pct: number; met: boolean } {
  const minutes = typingTodayMinutes(data, today)
  const safeGoal = goalMin > 0 ? goalMin : DEFAULT_TYPING_GOAL_MIN
  const pct = Math.min(100, Math.round((minutes / safeGoal) * 100))
  return { minutes, goalMin: safeGoal, pct, met: minutes >= safeGoal }
}

/** Best (max) WPM across all sessions that recorded one. 0 when none. */
export function bestWpm(data: JournalData): number {
  const wpms = sessions(data).map((s) => s.wpm).filter((w): w is number => w != null)
  return wpms.length ? Math.max(...wpms) : 0
}

/**
 * Average WPM (whole number) across sessions that recorded a WPM. When `days`
 * is given, only sessions within the last `days` count. 0 when none qualify.
 */
export function avgWpm(data: JournalData, days?: number, today = todayISO()): number {
  let ss = sessions(data).filter((s) => s.wpm != null)
  if (days != null) ss = ss.filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < days })
  if (!ss.length) return 0
  return Math.round(ss.reduce((a, s) => a + (s.wpm || 0), 0) / ss.length)
}

/**
 * Daily best-WPM series for the last `days`, oldest→newest, for a sparkline /
 * line chart. Days with no WPM session report wpm 0 and has=false so the view
 * can skip/dim them.
 */
export function wpmTrend(
  data: JournalData,
  days = 14,
  today = todayISO(),
): { date: string; wpm: number; has: boolean }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i))
    const day = sessions(data).filter((s) => s.date === date && s.wpm != null)
    if (!day.length) return { date, wpm: 0, has: false }
    return { date, wpm: Math.max(...day.map((s) => s.wpm || 0)), has: true }
  })
}

/**
 * Consecutive scheduled days practiced, ending today/yesterday.
 *
 * Only WEEKDAYS (Mon–Fri) are scheduled: a weekday with no practice breaks the
 * streak, while weekends are NEUTRAL — they never break the streak and never
 * extend it. So practicing Fri then again Mon (skipping Sat/Sun) keeps a 2-day
 * streak alive. Counts only weekdays that were actually practiced.
 */
export function typingStreak(data: JournalData, today = todayISO()): number {
  const has = (d: string) => sessions(data).some((s) => s.date === d)
  // Start from today if practiced, else yesterday (so an as-yet-unlogged today
  // doesn't zero a real streak). Mirror focusStreak's lenient start.
  let cursor = has(today) ? today : addDays(today, -1)
  let n = 0
  while (true) {
    if (!isWeekday(cursor)) { cursor = addDays(cursor, -1); continue } // weekend = neutral
    if (has(cursor)) { n += 1; cursor = addDays(cursor, -1) } else break
  }
  return n
}

export type { TypingSession }
