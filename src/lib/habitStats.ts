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

export interface MonthlyCompletion {
  /** Calendar month key "YYYY-MM". */
  ym: string
  /** Scheduled days for this habit in that month (respecting activeDays/startedOn). */
  scheduled: number
  /** Of those, how many were done. */
  done: number
  /** 0–100 completion share; 0 when nothing was scheduled (never NaN). */
  pct: number
}

/**
 * Per-habit monthly completion over the trailing `months` calendar months
 * (BUJO #407), oldest→newest, ending with the current (in-progress) month.
 * For each month it sums the habit's scheduled days vs done days — so a
 * Mon/Wed/Fri habit isn't penalised for days it was never due, and months
 * before the habit started simply report scheduled=0. Days in the future (after
 * `today`, within the current month) are not counted toward scheduled, so the
 * current month reflects only what's been due so far. Pure; powers a per-habit
 * monthly bar chart to spot seasonal momentum. Avoid habits can be passed but
 * "done" means a *slip* for them, so callers typically use it for build habits.
 */
export function monthlyHabitCompletion(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  months = 12,
): MonthlyCompletion[] {
  const [y0, m0] = today.split('-').map(Number)
  const out: MonthlyCompletion[] = []
  for (let k = months - 1; k >= 0; k--) {
    // First of the target month, k months before the current one.
    const y = y0
    const monthIndex = m0 - 1 - k // 0-based, may go negative → normalise below
    const d = new Date(y, monthIndex, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    let scheduled = 0
    let done = 0
    for (let day = 1; day <= lastDay; day++) {
      const iso = `${ym}-${String(day).padStart(2, '0')}`
      if (iso > today) break // future days don't count yet
      if (!isScheduledOn(habit, iso)) continue
      scheduled += 1
      if (habitDoneOn(data, habit, iso)) done += 1
    }
    out.push({ ym, scheduled, done, pct: scheduled ? Math.round((done / scheduled) * 100) : 0 })
  }
  return out
}

/**
 * Last-`days` value sparkline for a habit (BUJO #399), oldest→newest ending
 * `today`. Each point carries the habit's raw logged value that day and a 0–1
 * `norm` for drawing a fixed-height sparkline: count/timer normalise to the
 * target (clamped to 1), rating to /5, and check habits to 0/1. Off-schedule and
 * pre-start days carry value 0 / norm 0 so the line dips for genuinely-missed
 * days without special-casing. Pure; lets the grid/editor render a tiny inline
 * trend beside numeric habits instead of only a single day's number.
 */
export interface SparkPoint {
  day: string
  value: number
  /** 0–1 height fraction for a fixed-height sparkline. */
  norm: number
}

export function valueSparkline(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  days = 14,
): SparkPoint[] {
  const type = habit.type ?? 'check'
  const target = habitTarget(habit)
  const out: SparkPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i)
    const value = isScheduledOn(habit, day) ? habitValueOn(data, habit, day) : 0
    let norm: number
    if (value <= 0) norm = 0
    else if (type === 'rating') norm = Math.min(1, value / 5)
    else if (type === 'check') norm = 1
    else norm = Math.min(1, target > 0 ? value / target : 1)
    out.push({ day, value, norm })
  }
  return out
}

/**
 * Letter grade (A–F) for a habit's recency-weighted consistency (BUJO trackers ·
 * at-a-glance grade). A thin, pure mapping over {@link consistencyScore} so the
 * grid can show a single glanceable mark instead of a raw number: A ≥ 90, B ≥ 75,
 * C ≥ 60, D ≥ 40, else F. Returns the numeric `score` too so callers can colour
 * the badge. Build habits only in spirit (avoid habits invert the meaning), but
 * it's a pure read so callers choose.
 */
export interface HabitGrade {
  letter: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
}

export function habitGrade(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  window = 30,
): HabitGrade {
  const score = consistencyScore(data, habit, today, window)
  const letter = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'
  return { letter, score }
}

export interface TrackerSummary {
  /** Non-archived build (non-avoid) habits being tracked. */
  buildHabits: number
  /** Non-archived avoid (quit) habits being tracked. */
  avoidHabits: number
  /** Mean 30-day recency-weighted consistency across build habits (0–100). */
  avgConsistency: number
  /** Longest current streak among build check habits and which habit holds it. */
  topStreak: number
  topStreakHabit: string | null
  /** Build habits scheduled today that are still done across all of them (0–100). */
  todayPct: number
}

/**
 * One-glance roll-up across all tracked habits (BUJO trackers · summary tile):
 * how many build vs quit habits, the mean consistency score, the single longest
 * current streak (with the habit's name), and today's overall completion share of
 * scheduled build habits. Pure — composes the existing per-habit helpers
 * (consistencyScore, habitStreak via the passed streakOf, isScheduledOn,
 * habitDoneOn) into a header card so the user sees the shape of their whole grid
 * without scanning every row. `streakOf` is injected (the live habit-streak fn
 * lives in stats.ts, outside this module) so this stays a pure, dependency-light
 * composition; pass a no-op returning 0 to skip streaks.
 */
export function trackerSummary(
  data: JournalData,
  streakOf: (habitId: string, today: string) => number,
  today = todayISO(),
): TrackerSummary {
  const active = data.habits.filter((h) => !h.archived)
  const build = active.filter((h) => !h.avoid)
  const avoid = active.filter((h) => h.avoid)

  const scores = build.map((h) => consistencyScore(data, h, today))
  const avgConsistency = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  let topStreak = 0
  let topStreakHabit: string | null = null
  for (const h of build) {
    if ((h.type ?? 'check') !== 'check') continue
    const s = streakOf(h.id, today)
    if (s > topStreak) { topStreak = s; topStreakHabit = h.name }
  }

  let scheduledToday = 0
  let doneToday = 0
  for (const h of build) {
    if (!isScheduledOn(h, today)) continue
    scheduledToday += 1
    if (habitDoneOn(data, h, today)) doneToday += 1
  }
  const todayPct = scheduledToday ? Math.round((doneToday / scheduledToday) * 100) : 0

  return {
    buildHabits: build.length,
    avoidHabits: avoid.length,
    avgConsistency,
    topStreak,
    topStreakHabit,
    todayPct,
  }
}
