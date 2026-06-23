import type { Habit, JournalData, Relapse, AddictionStreak } from './types'
import { addDays, dayDiff, todayISO } from './date'
import { STREAK_MILESTONES as MILESTONE_DAYS } from './milestones'
import { habitDoneOn } from './stats'
import { isScheduledOn } from './habitStats'

/**
 * Streak (abstinence) analytics — pure + testable. Goes beyond "days since the
 * last reset": lifetime clean days across all streaks, milestone progress, the
 * recovery-benefits timeline, and trigger patterns. Private, judgement-free.
 */

/** Common urge / temptation types for the quick-pick. Users can type any custom
 *  value too — anything they log appears alongside these. */
export const URGE_PRESETS = [
  'Porn', 'Masturbation', 'Smoking', 'Vaping', 'Alcohol',
  'Junk food', 'Sugar', 'Doomscrolling', 'Gaming', 'Caffeine',
]

export interface Milestone { day: number; label: string; benefit: string }

/** Milestone ladder with a short "what improves" note (educational, motivating). */
export const STREAK_MILESTONES: Milestone[] = [
  { day: 1, label: 'Day one', benefit: 'The decision is made. Momentum starts here.' },
  { day: 3, label: '72 hours', benefit: 'Cravings peak around now — ride them out; they pass.' },
  { day: 7, label: 'One week', benefit: 'Energy and sleep start to even out.' },
  { day: 14, label: 'Two weeks', benefit: 'Sharper focus and a steadier mood.' },
  { day: 30, label: 'One month', benefit: 'Confidence and motivation climb noticeably.' },
  { day: 60, label: 'Two months', benefit: 'New habits feel automatic; urges are quieter.' },
  { day: 90, label: 'Ninety days', benefit: 'A full reset — this is your new baseline.' },
  { day: 180, label: 'Half a year', benefit: 'Lasting change; the old pattern feels distant.' },
  { day: 365, label: 'One year', benefit: 'Identity-level change. You did the hard thing.' },
]

export interface StreakStats {
  current: number
  best: number
  /** Lifetime clean days across every streak (not just the current one). */
  totalClean: number
  relapseCount: number
  urges: number
  next?: Milestone
  prevDay: number
  /** 0–100 progress from the previous milestone to the next. */
  progressPct: number
  daysToNext: number
  /** Average days between relapses (0 if fewer than 2). */
  avgGap: number
  /** Most common triggers, most-frequent first. */
  topTriggers: { trigger: string; count: number }[]
}

export function streakStats(data: JournalData, today = todayISO()): StreakStats {
  const s = data.nofap
  return streakStatsFor(s.startedOn, s.best, s.relapses, today, (s.urgesResisted ?? 0) + (s.urgeLog?.length ?? 0))
}

/**
 * Pure streak analytics for ANY single streak (the main one or a per-addiction
 * one, BUJO-199). Pass its startedOn / stored best / relapses; `urges` is the
 * resisted-urge total to surface (0 for per-addiction streaks that share the
 * global urge log).
 */
export function streakStatsFor(
  startedOn: string,
  storedBest: number,
  relapses: Relapse[],
  today = todayISO(),
  urges = 0,
): StreakStats {
  const current = Math.max(0, dayDiff(startedOn, today))

  // Normalise relapse dates for gap maths: ignore anything before tracking began
  // (the user's original start day — relapses can't predate it), then sort
  // ascending and drop duplicates so out-of-order / repeated logs don't skew gaps.
  const sorted = relapses
    .map((r) => r.date)
    .filter((d) => dayDiff(startedOn, d) <= 0) // on/before the current start day
    .sort()
  const dates: string[] = []
  for (const d of sorted) {
    if (dates[dates.length - 1] === d) continue // duplicate
    dates.push(d)
  }

  // Lifetime clean days: the current run + each completed streak (the gap
  // between consecutive relapses, since a relapse resets the start to that day).
  // Also track the longest completed gap so a long PAST streak counts toward best.
  let completed = 0
  let longestGap = 0
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.max(0, dayDiff(dates[i - 1], dates[i]))
    completed += gap
    longestGap = Math.max(longestGap, gap)
  }
  const totalClean = current + completed

  // Best = the longest streak ever: the stored best, the live run, OR the
  // longest historical gap between relapses (which the stored best may predate).
  const best = Math.max(storedBest, current, longestGap)

  const gaps = dates.length - 1
  const avgGap = gaps >= 1 ? Math.round(completed / gaps) : 0

  const next = STREAK_MILESTONES.find((m) => m.day > current)
  const prevDay = [...STREAK_MILESTONES].reverse().find((m) => m.day <= current)?.day ?? 0
  const span = next ? next.day - prevDay : 1
  const progressPct = next ? Math.min(100, Math.round(((current - prevDay) / span) * 100)) : 100
  const daysToNext = next ? next.day - current : 0

  const counts = new Map<string, number>()
  for (const r of relapses) {
    const t = (r.trigger || '').trim().toLowerCase()
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const topTriggers = [...counts.entries()]
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { current, best, totalClean, relapseCount: relapses.length, urges, next, prevDay, progressPct, daysToNext, avgGap, topTriggers }
}

/** Per-addiction streak stats (BUJO-199). Shares the global urge log, so urges=0 here. */
export function addictionStats(a: AddictionStreak, today = todayISO()): StreakStats {
  return streakStatsFor(a.startedOn, a.best, a.relapses, today, 0)
}

/**
 * Nearest upcoming habit-streak milestone for a clean-day / build streak. Uses
 * the celebratory milestone ladder in milestones.ts (3, 7, 14, 30, …). Returns
 * the next rung the streak hasn't reached yet plus how many days remain, or null
 * once every milestone is passed. Pure — powers the per-habit "nearest milestone"
 * badge (e.g. for quit/avoid habits' clean-day counter).
 */
export function nextHabitMilestone(streak: number): { day: number; daysToGo: number } | null {
  const day = (MILESTONE_DAYS as readonly number[]).find((m) => m > streak)
  if (day === undefined) return null
  return { day, daysToGo: day - streak }
}

/**
 * Comeback streak (BUJO trackers): how a build-habit is doing AFTER a lapse.
 * Walks the habit's scheduled days back from `today`; the *current run* is the
 * unbroken tail of done scheduled days, and a "comeback" is any time the user
 * resumes (a done scheduled day immediately preceded by a missed scheduled one).
 * `comebackCount` is the lifetime number of such restarts; `recovering` flags
 * the encouraging "back on track — Nd" state: there's a current run AND at least
 * one earlier break, so the user has genuinely bounced back (not a clean run from
 * day one). Pure + unit-tested. Only meaningful for build habits — quit/avoid
 * habits already have their own clean-streak logic, so callers pass those by
 * choice. `window` bounds the lookback (365 days by default).
 */
export interface HabitComeback {
  /** Consecutive done scheduled days ending today (or the last scheduled day). */
  current: number
  /** Lifetime count of restarts after a missed scheduled day. */
  comebackCount: number
  /** True when there's a live run AND a prior break — show "back on track". */
  recovering: boolean
}

export function habitComeback(
  data: JournalData,
  habit: Habit,
  today = todayISO(),
  window = 365,
): HabitComeback {
  // Collect scheduled days oldest→newest within the window (cap at startedOn).
  const sched: { day: string; done: boolean }[] = []
  for (let i = window - 1; i >= 0; i--) {
    const day = addDays(today, -i)
    if (day < habit.startedOn) continue
    if (!isScheduledOn(habit, day)) continue
    sched.push({ day, done: habitDoneOn(data, habit, day) })
  }

  // Current run: unbroken tail of done days.
  let current = 0
  for (let i = sched.length - 1; i >= 0; i--) {
    if (!sched[i].done) break
    current += 1
  }

  // Comebacks: a done day whose previous scheduled day was missed.
  let comebackCount = 0
  let sawMiss = false
  for (const s of sched) {
    if (!s.done) { sawMiss = true; continue }
    if (sawMiss) { comebackCount += 1; sawMiss = false }
  }

  // "Recovering" = there is a live run and at least one earlier break, i.e. the
  // run doesn't reach the very first scheduled day.
  const recovering = current > 0 && current < sched.length && sched.some((s) => !s.done)
  return { current, comebackCount, recovering }
}

/** Milestones already reached at `current` days. */
export function unlockedBenefits(current: number): Milestone[] {
  return STREAK_MILESTONES.filter((m) => current >= m.day)
}

/**
 * Urges resisted broken down by addiction/type (from the dated urge log),
 * most-resisted first. Powers the per-addiction visualization.
 */
export function urgesByType(data: JournalData): { type: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const u of data.nofap.urgeLog ?? []) {
    const t = (u.trigger || 'Other').trim()
    const key = t.charAt(0).toUpperCase() + t.slice(1)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}
