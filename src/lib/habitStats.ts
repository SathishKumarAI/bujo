import type { Habit, JournalData } from './types'
import { addDays, fromISODay, todayISO } from './date'
import { habitDoneOn, habitTarget, habitValueOn } from './stats'

/**
 * Per-habit completion analytics that respect a habit's scheduling. A habit is
 * "scheduled" on a day when that day is on/after its startedOn AND the day's
 * weekday is in its activeDays (empty/undefined activeDays = every day). Pure +
 * unit-tested; the positive counterpart of the streak/clean-streak helpers.
 */

/** Is the habit scheduled on this ISO day (started + active weekday)? */
export function isScheduledOn(h: Habit, day: string): boolean {
  if (day < h.startedOn) return false
  return !h.activeDays?.length || h.activeDays.includes(fromISODay(day).getDay())
}

export interface CompletionRate {
  /** Days the habit was scheduled in the window. */
  scheduled: number
  /** Of those scheduled days, how many were actually done. */
  done: number
  /** 0–100, rounded; 0 when nothing was scheduled (avoids divide-by-zero). */
  pct: number
}

/**
 * Completion rate over the last `window` days (30 by default), counting only
 * days the habit was actually scheduled. Days before startedOn and off-schedule
 * weekdays are excluded from the denominator, so a Mon/Wed/Fri habit isn't
 * penalised for the days it was never due. Returns pct=0 when nothing was
 * scheduled in the window (a brand-new or never-due habit), never NaN.
 */
export function completionRate30(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  window = 30,
): CompletionRate {
  let scheduled = 0
  let done = 0
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (!isScheduledOn(habit, day)) continue
    scheduled += 1
    if (habitDoneOn(data, habit, day)) done += 1
  }
  return { scheduled, done, pct: scheduled ? Math.round((done / scheduled) * 100) : 0 }
}

/**
 * How "full" a habit's day is, for the grid's met-vs-partial distinction:
 *   - 'empty'   — nothing logged
 *   - 'partial' — some progress toward a numeric target but not there yet
 *   - 'met'     — target reached (check/rating: any value; count/timer: ≥ target)
 * `ratio` is the 0–1 fraction of the target (clamped to 1) for sizing a fill.
 * Pure; lets the grid render a solid dot when met vs a ring/half-fill when
 * partial, instead of a single opacity ramp that blurs the "did I hit it?" line.
 */
export interface CellFill {
  state: 'empty' | 'partial' | 'met'
  ratio: number
}

export function habitCellFill(data: JournalData, habit: Habit, day: string): CellFill {
  const value = habitValueOn(data, habit, day)
  if (value <= 0) return { state: 'empty', ratio: 0 }
  if (habitDoneOn(data, habit, day)) return { state: 'met', ratio: 1 }
  const target = habitTarget(habit)
  const ratio = Math.min(1, target > 0 ? value / target : 1)
  return { state: 'partial', ratio }
}

/**
 * Recency-weighted consistency score 0–100 over the last `window` scheduled days
 * (BUJO #395). Unlike the flat completion rate, recent scheduled days count more
 * than old ones via a linear weight ramp (today's scheduled day weighs `window`,
 * the oldest weighs 1), so a habit you've nailed *lately* scores higher than one
 * you only did well a month ago — it captures momentum, not just an average.
 * Pure; returns 0 when nothing was scheduled in the window (never NaN). Each
 * scheduled day contributes its done-ness (1 for done, 0 for missed) weighted by
 * recency; the score is the weighted-done fraction of the weighted-scheduled
 * total, ×100, rounded.
 */
export function consistencyScore(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  window = 30,
): number {
  let weightedDone = 0
  let weightedTotal = 0
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (!isScheduledOn(habit, day)) continue
    const weight = window - i // today = window, oldest in window = 1
    weightedTotal += weight
    if (habitDoneOn(data, habit, day)) weightedDone += weight
  }
  return weightedTotal ? Math.round((weightedDone / weightedTotal) * 100) : 0
}

export interface WeekdayBreakdown {
  /** Per-weekday (0=Sun…6=Sat) success rate 0–1 over the window. null = the
   *  weekday was never scheduled in the window (no bar to draw). */
  rates: (number | null)[]
  /** Weekday index with the highest rate, or null when no day was scheduled. */
  best: number | null
  /** Weekday index with the lowest rate among scheduled days, or null. */
  worst: number | null
}

/**
 * Best/worst weekday analysis for a habit (BUJO #85). For each weekday it
 * computes the success rate = done scheduled occurrences / total scheduled
 * occurrences over the last `window` days, then picks the highest- and
 * lowest-rate weekday (only among weekdays that were actually scheduled, so a
 * Mon/Wed/Fri habit never reports "worst day: Sunday"). `best === worst` is
 * possible when only one weekday is ever scheduled. Pure; powers a
 * "strongest on Tue · weakest on Sun" insight to inform rescheduling.
 */
export function bestWeekday(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  window = 90,
): WeekdayBreakdown {
  const done = Array(7).fill(0) as number[]
  const total = Array(7).fill(0) as number[]
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (!isScheduledOn(habit, day)) continue
    const dow = fromISODay(day).getDay()
    total[dow] += 1
    if (habitDoneOn(data, habit, day)) done[dow] += 1
  }
  const rates = total.map((t, i) => (t > 0 ? done[i] / t : null))
  let best: number | null = null
  let worst: number | null = null
  for (let i = 0; i < 7; i++) {
    const r = rates[i]
    if (r == null) continue
    if (best == null || r > (rates[best] as number)) best = i
    if (worst == null || r < (rates[worst] as number)) worst = i
  }
  return { rates, best, worst }
}
