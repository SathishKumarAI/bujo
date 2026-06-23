import type { Habit, HabitCategory, JournalData } from './types'
import { addDays, fromISODay, todayISO } from './date'
import { habitDoneOn, habitTarget, habitValueOn } from './stats'
import { dayIntensity } from './habitIntensity'

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

export interface CategoryRollup {
  category: HabitCategory
  /** Non-archived habits in this category (build + avoid). */
  habits: number
  /** Total scheduled habit-days across the category in the window. */
  scheduled: number
  /** Of those, how many were done (a slip counts as "done" for avoid habits). */
  done: number
  /** 0–100 completion rate; 0 when nothing was scheduled (never NaN). */
  pct: number
}

/**
 * Per-category completion roll-up over the last `window` days (30 by default),
 * summing scheduled-vs-done habit-days across every non-archived habit in each
 * category (BUJO trackers · category roll-up stats). Each habit contributes its
 * own scheduled days (respecting activeDays/startedOn), so a category's pct is
 * the share of all its scheduled habit-days that were completed — a single
 * glanceable health number per group. Avoid habits are excluded from the
 * completion maths (a logged day is a *slip*, not a win, so counting them would
 * invert the metric); they still count toward `habits`. Categories with no
 * habits are dropped. Pure; sorted by pct descending then category name.
 */
export function categoryRollup(
  data: JournalData,
  today = todayISO(),
  window = 30,
): CategoryRollup[] {
  const groups = new Map<HabitCategory, { habits: number; scheduled: number; done: number }>()
  for (const h of data.habits) {
    if (h.archived) continue
    const g = groups.get(h.category) ?? { habits: 0, scheduled: 0, done: 0 }
    g.habits += 1
    if (!h.avoid) {
      for (let i = 0; i < window; i++) {
        const day = addDays(today, -i)
        if (!isScheduledOn(h, day)) continue
        g.scheduled += 1
        if (habitDoneOn(data, h, day)) g.done += 1
      }
    }
    groups.set(h.category, g)
  }
  return [...groups.entries()]
    .map(([category, g]) => ({
      category,
      habits: g.habits,
      scheduled: g.scheduled,
      done: g.done,
      pct: g.scheduled ? Math.round((g.done / g.scheduled) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct || a.category.localeCompare(b.category))
}

/**
 * Count of fully-complete weeks for a build habit (BUJO #322 · week rollup):
 * calendar weeks in which EVERY scheduled day was done. Walks back `weeks`
 * (12 by default) Sunday-start weeks from the week containing `today`; the
 * current (in-progress) week is excluded so a half-finished week never counts
 * as a miss. A week with no scheduled days (e.g. a Mon/Wed habit that started
 * mid-week, or an off-week) is skipped entirely — it's neither perfect nor
 * broken. Pure; rewards sustained windows rather than single days. Only
 * meaningful for build habits — avoid habits have their own clean-day logic.
 */
export function perfectWeeks(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  weeks = 12,
): number {
  const dow = fromISODay(today).getDay() // 0=Sun
  // Sunday that starts the current (in-progress) week.
  const curWeekStart = addDays(today, -dow)
  let count = 0
  for (let w = 1; w <= weeks; w++) {
    const weekStart = addDays(curWeekStart, -7 * w)
    let scheduled = 0
    let done = 0
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d)
      if (!isScheduledOn(habit, day)) continue
      scheduled += 1
      if (habitDoneOn(data, habit, day)) done += 1
    }
    if (scheduled > 0 && done === scheduled) count += 1
  }
  return count
}

export interface PerfectDayStats {
  /** Days in the window where every scheduled check habit was done. */
  total: number
  /** Consecutive perfect days ending today (or the last scheduled day). */
  streak: number
}

/**
 * "Perfect day" analytics across all build (non-avoid) check habits (BUJO
 * trackers · perfect-day consistency). A day is *perfect* when at least one
 * check habit was scheduled AND every scheduled check habit was done that day.
 * `total` counts such days over the last `window` days; `streak` is the
 * unbroken run of perfect days ending today — but an as-yet-unlogged today with
 * habits still pending does NOT break the streak (we only count today if it's
 * already perfect, otherwise we start the run from yesterday). Days with nothing
 * scheduled are neutral: they neither count nor break the streak. Pure; powers
 * an all-habits "you nailed everything" tile. Mirrors dayCompletion's
 * check-habit, non-archived scheduling rules.
 */
export function perfectDayStats(
  data: JournalData,
  today = todayISO(),
  window = 90,
): PerfectDayStats {
  const checks = data.habits.filter((h) => !h.archived && !h.avoid && (h.type ?? 'check') === 'check')
  const isPerfect = (day: string): boolean | null => {
    const sched = checks.filter((h) => isScheduledOn(h, day))
    if (sched.length === 0) return null // nothing scheduled → neutral
    return sched.every((h) => habitDoneOn(data, h, day))
  }

  let total = 0
  for (let i = 0; i < window; i++) {
    if (isPerfect(addDays(today, -i)) === true) total += 1
  }

  // Streak: walk back from today. A neutral day is skipped (doesn't break),
  // a perfect day extends, a non-perfect day stops. Today only breaks the run
  // if it has scheduled habits AND isn't perfect yet — but we forgive it by
  // starting from yesterday when today isn't perfect, so a mid-day check-in
  // doesn't read as a broken streak.
  let streak = 0
  let start = 0
  if (isPerfect(today) !== true) start = 1 // forgive an unfinished today
  for (let i = start; i < window; i++) {
    const p = isPerfect(addDays(today, -i))
    if (p === null) continue // neutral
    if (p) streak += 1
    else break
  }
  return { total, streak }
}

/**
 * Last-7-day intensity strip for a habit (BUJO trackers · weekly heat row).
 * Returns 7 cells oldest→newest ending `today`, each with its ISO day, whether
 * the habit was scheduled, and a 0–4 intensity level (graded for count/timer/
 * rating habits, on/off for checks). Off-schedule days carry level 0 and
 * scheduled=false so the row can dim them. Pure; lets the grid show a glanceable
 * "how's this week going" sparkline beside each habit without re-deriving cells.
 */
export interface HeatCell {
  day: string
  scheduled: boolean
  level: 0 | 1 | 2 | 3 | 4
}

export function weeklyHeatRow(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
): HeatCell[] {
  const out: HeatCell[] = []
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i)
    const scheduled = isScheduledOn(habit, day)
    const level = scheduled ? dayIntensity(data, habit, day) : 0
    out.push({ day, scheduled, level })
  }
  return out
}
