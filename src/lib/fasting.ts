// Intermittent-fasting math. Pure + framework-free so it's trivially testable;
// the UI (FastingCard) and store own the data, these just compute over it.
import type { Fast } from './types'
import { todayISO } from './date'

export const DEFAULT_FAST_TARGET = 16

/** The LOCAL calendar day a timestamp falls on (not the UTC slice). */
const dayOf = (iso: string) => todayISO(new Date(iso))

/** Length of a completed fast, in hours. */
export function fastHours(f: { start: string; end: string }): number {
  return Math.max(0, (new Date(f.end).getTime() - new Date(f.start).getTime()) / 3_600_000)
}

/** Hours elapsed since an in-progress fast started (pass Date.now()). */
export function elapsedHours(startISO: string, nowMs: number): number {
  return Math.max(0, (nowMs - new Date(startISO).getTime()) / 3_600_000)
}

/** "16h", "16h 30m" — compact duration label. */
export function fmtDuration(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/** A fast counts toward the day it ENDED (the day you broke it). */
export function fastsOnDay(fasts: Fast[], day: string): Fast[] {
  return fasts.filter((f) => dayOf(f.end) === day)
}

/** Longest fast that ended on the given day (0 if none). */
export function dayFastHours(fasts: Fast[], day: string): number {
  return fastsOnDay(fasts, day).reduce((m, f) => Math.max(m, fastHours(f)), 0)
}

/**
 * Consecutive days up to `today` whose best fast met the target. Days with no
 * fast break the streak; an in-progress fast doesn't count until it's logged.
 */
export function fastingStreak(fasts: Fast[], targetHours: number, today: string): number {
  const byDay = new Set(
    fasts.filter((f) => fastHours(f) + 1e-9 >= targetHours).map((f) => dayOf(f.end)),
  )
  let streak = 0
  let cursor = today
  while (byDay.has(cursor)) {
    streak += 1
    const d = new Date(cursor + 'T00:00')
    d.setDate(d.getDate() - 1)
    cursor = todayISO(d)
  }
  return streak
}

/** Most recent completed fasts, newest first. */
export function recentFasts(fasts: Fast[], n = 7): Fast[] {
  return [...fasts].sort((a, b) => (a.end < b.end ? 1 : -1)).slice(0, n)
}
