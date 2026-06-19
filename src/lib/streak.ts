import type { JournalData } from './types'
import { dayDiff, todayISO } from './date'

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
  const current = Math.max(0, dayDiff(s.startedOn, today))
  const best = Math.max(s.best, current)

  // Lifetime clean days: the current run + each completed streak (the gap
  // between consecutive relapses, since a relapse resets the start to that day).
  const dates = [...s.relapses].map((r) => r.date).sort()
  let completed = 0
  for (let i = 1; i < dates.length; i++) completed += Math.max(0, dayDiff(dates[i - 1], dates[i]))
  const totalClean = current + completed

  const avgGap = dates.length >= 2 ? Math.round(completed / (dates.length - 1)) : 0

  const next = STREAK_MILESTONES.find((m) => m.day > current)
  const prevDay = [...STREAK_MILESTONES].reverse().find((m) => m.day <= current)?.day ?? 0
  const span = next ? next.day - prevDay : 1
  const progressPct = next ? Math.min(100, Math.round(((current - prevDay) / span) * 100)) : 100
  const daysToNext = next ? next.day - current : 0

  const counts = new Map<string, number>()
  for (const r of s.relapses) {
    const t = (r.trigger || '').trim().toLowerCase()
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const topTriggers = [...counts.entries()]
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const urges = (s.urgesResisted ?? 0) + (s.urgeLog?.length ?? 0)
  return { current, best, totalClean, relapseCount: s.relapses.length, urges, next, prevDay, progressPct, daysToNext, avgGap, topTriggers }
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
