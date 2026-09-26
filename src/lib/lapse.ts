import type { Relapse } from './types'
import { WEEKDAYS, addDays, dayDiff, fromISODay, todayISO } from './date'

/**
 * Quantified lapse days — "how many, on which day", for a streak whose lapses
 * come with a number on them (10 cigarettes, 3 drinks).
 *
 * This file owns reading `Relapse.count` back: per-weekday averages and the
 * week-by-week trend. It does NOT own writing it (`store.logLapseDay`) nor the
 * unquantified reset analytics — `urge.ts` already has `relapseWeekdayPattern`
 * (lapse *days* per weekday) and `urgeFrequencyTrend` (resisted urges per
 * week), and those answer "how often", not "how much". Separate module rather
 * than more of `urge.ts`, which is already 670 lines against a 500 ceiling.
 *
 * The rule throughout: a weekday with no lapse day has `avg: null`, never 0.
 * `count ? sum / count : 0` makes "nothing recorded" indistinguishable from
 * "you scored zero", and this page's whole job is telling those apart.
 */

/**
 * Anything with a streak's three load-bearing fields: the primary `Streak` and
 * each `AddictionStreak`. They have always been the same shape here, and the
 * one-tap day log is the first thing that needed to say so.
 */
export interface StreakLike {
  startedOn: string
  best: number
  relapses: Relapse[]
}

/**
 * The one-tap "it happened today" reducer, for `store.logLapseDay`.
 *
 * **The whole point is that it is idempotent in `startedOn`.** The first tap of
 * the day pushes the row and resets the streak; every tap after it increments
 * `count` on that same row. Pushing a row per tap would restart the streak ten
 * times and put ten entries in the reset history for one bad Sunday — which is
 * exactly the reading `Relapse.count` exists to avoid.
 *
 * `step` may be negative to walk back an over-tap. It floors the count at 1
 * rather than deleting the row, and a negative step on a clean day is a no-op:
 * removing the row would have to restore the `startedOn` that the reset
 * overwrote, and that value is not recoverable from the row. The store's global
 * ⌘Z does that instead, one tap per step.
 *
 * Pure, and `newId` is injected so the caller keeps its own id scheme.
 */
export function bumpLapseDay<T extends StreakLike>(
  streak: T,
  date: string,
  step: number,
  newId: () => string,
): T {
  const i = streak.relapses.findIndex((r) => r?.date === date)
  if (i >= 0) {
    const relapses = streak.relapses.slice()
    relapses[i] = { ...relapses[i], count: Math.max(1, (relapses[i].count ?? 1) + step) }
    return { ...streak, relapses }
  }
  if (step < 0) return streak
  return {
    ...streak,
    startedOn: date,
    // The streak's length just before the reset becomes a candidate for "best",
    // the same rule `logRelapse` uses — a one-tap log must not cost a record.
    best: Math.max(streak.best, Math.max(0, dayDiff(streak.startedOn, date))),
    relapses: [...streak.relapses, { id: newId(), date, trigger: '', note: '', count: 1 }],
  }
}

/** Occurrences on one day. `count` is always ≥ 1 here — the row is the day. */
export interface LapseDay {
  date: string
  count: number
}

/**
 * One row per lapse day, oldest first, with `count` defaulted to 1.
 *
 * De-duplicates by date and SUMS, rather than taking the first row: one row
 * per streak per day is the invariant `logLapseDay` maintains, but a journal
 * written before it existed can hold two rows for one date (the reset form has
 * never stopped anyone logging twice), and dropping one would silently lose a
 * lapse.
 */
export function lapseDays(relapses: Relapse[] = []): LapseDay[] {
  const byDate = new Map<string, number>()
  for (const r of relapses) {
    if (!r?.date) continue
    const n = Math.max(1, Math.round(r.count ?? 1))
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + n)
  }
  return [...byDate.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Total occurrences across every lapse day (10 + 4 = 14, not "2 days"). */
export function lapseTotal(relapses: Relapse[] = []): number {
  return lapseDays(relapses).reduce((s, d) => s + d.count, 0)
}

/** Occurrences logged for `date` — 0 when that day is clean. */
export function lapseCountOn(relapses: Relapse[] = [], date = todayISO()): number {
  return lapseDays(relapses).find((d) => d.date === date)?.count ?? 0
}

/**
 * Whether a quantity was ever actually recorded for this streak, i.e. whether
 * any single day holds more than one occurrence.
 *
 * The gate for showing the quantity card at all: a streak whose every lapse
 * day is "once" has a `count` chart of seven 1s, which is a picture of the
 * default value rather than of anything the user did.
 */
export function hasLapseQuantity(relapses: Relapse[] = []): boolean {
  return lapseDays(relapses).some((d) => d.count > 1)
}

export interface LapseWeekday {
  /** 0 = Sunday, matching `Date.getDay()` and `WEEKDAYS`. */
  day: number
  label: string
  /** Lapse days that fell on this weekday. */
  days: number
  /** Occurrences summed over those days. */
  total: number
  /** Mean occurrences per lapse day, 1dp — **null when `days` is 0.** */
  avg: number | null
}

/**
 * "Sundays average 10." Mean occurrences per *lapse day* by weekday — not per
 * calendar Sunday, because a clean Sunday is not a Sunday on which you smoked
 * zero cigarettes, it is a Sunday that does not belong in this average at all.
 * Dividing by calendar days would push every figure toward zero as the streak
 * grew, which is the opposite of the reading the page wants.
 */
export function lapseByWeekday(relapses: Relapse[] = []): LapseWeekday[] {
  const days = new Array<number>(7).fill(0)
  const totals = new Array<number>(7).fill(0)
  for (const d of lapseDays(relapses)) {
    const dt = fromISODay(d.date)
    if (Number.isNaN(dt.getTime())) continue
    const w = dt.getDay()
    days[w]++
    totals[w] += d.count
  }
  return days.map((n, day) => ({
    day,
    label: WEEKDAYS[day],
    days: n,
    total: totals[day],
    avg: n > 0 ? Math.round((totals[day] / n) * 10) / 10 : null,
  }))
}

/** The weekday with the highest average, or undefined when nothing is logged. */
export function peakLapseWeekday(relapses: Relapse[] = []): LapseWeekday | undefined {
  let best: LapseWeekday | undefined
  for (const w of lapseByWeekday(relapses)) {
    if (w.avg != null && (!best || w.avg > (best.avg ?? -1))) best = w
  }
  return best
}

export interface LapseWeek {
  /** ISO day the bucket starts on. */
  weekStart: string
  /** Occurrences in the bucket. */
  count: number
}

export interface LapseTrend {
  weeks: LapseWeek[]
  /** Occurrences inside the window. */
  total: number
  /** Occurrences per week over the window, 1dp. */
  avgPerWeek: number
  /** Second half's weekly average minus the first half's, 1dp. Signed. */
  delta: number
  direction: 'down' | 'flat' | 'up'
}

/**
 * Occurrences per week over the last `weeks` weeks, ending today.
 *
 * Bucketing and the half-window direction test are deliberately the same shape
 * as `urgeFrequencyTrend` — same window arithmetic, same ±0.25/week deadband —
 * so the two trend readings on this page cannot disagree about what "down"
 * means. `down` is the good direction here, which is why the deadband matters:
 * a single heavy week must not flip the sentence.
 */
export function lapseTrend(
  relapses: Relapse[] = [],
  weeks = 8,
  today = todayISO(),
): LapseTrend {
  const n = Math.max(1, Math.floor(weeks))
  const windowStart = addDays(today, -(n * 7 - 1))
  const buckets = new Array<number>(n).fill(0)
  for (const d of lapseDays(relapses)) {
    const offset = dayDiff(windowStart, d.date)
    if (offset < 0 || offset >= n * 7) continue
    buckets[Math.floor(offset / 7)] += d.count
  }
  const total = buckets.reduce((s, c) => s + c, 0)
  const mid = Math.floor(n / 2)
  const avg = (a: number[]) => (a.length ? a.reduce((s, c) => s + c, 0) / a.length : 0)
  const diff = avg(buckets.slice(mid)) - avg(buckets.slice(0, mid))
  return {
    weeks: buckets.map((count, i) => ({ weekStart: addDays(windowStart, i * 7), count })),
    total,
    avgPerWeek: Math.round((total / n) * 10) / 10,
    delta: Math.round(diff * 10) / 10,
    direction: diff < -0.25 ? 'down' : diff > 0.25 ? 'up' : 'flat',
  }
}
