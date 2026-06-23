import type { DevSession, JournalData } from './types'
import { addDays, dayDiff, todayISO } from './date'
import { pearson } from './correlations'

const sessions = (data: JournalData) => data.devSessions ?? []

/** Total coding minutes in the last `days` (rolling week by default). */
export function weeklyCodingMinutes(data: JournalData, today = todayISO(), days = 7): number {
  return sessions(data)
    .filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < days })
    .reduce((acc, s) => acc + (s.durationMin || 0), 0)
}

/** Consecutive days ending today/yesterday with at least one session. */
export function focusStreak(data: JournalData, today = todayISO()): number {
  const has = (d: string) => sessions(data).some((s) => s.date === d)
  let cursor = has(today) ? today : addDays(today, -1)
  let n = 0
  while (has(cursor)) { n += 1; cursor = addDays(cursor, -1) }
  return n
}

/** Duration-weighted average of a numeric field across all sessions (whole number). */
export function avgWeighted(data: JournalData, field: 'focus' | 'stress'): number {
  const ss = sessions(data)
  const totalMin = ss.reduce((a, s) => a + (s.durationMin || 0), 0)
  if (!totalMin) return 0
  return Math.round(ss.reduce((a, s) => a + s[field] * (s.durationMin || 0), 0) / totalMin)
}

/** Pearson correlation between focus and stress across sessions (−1..1). */
export function focusStressCorrelation(data: JournalData): number {
  const ss = sessions(data)
  if (ss.length < 3) return 0
  return pearson(ss.map((s) => s.focus), ss.map((s) => s.stress))
}

/** Coding minutes per day for the last `days`, oldest→newest (whole numbers). */
export function dailyCodingMinutes(data: JournalData, today = todayISO(), days = 14): { date: string; min: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i))
    const min = sessions(data).filter((s) => s.date === date).reduce((a, s) => a + (s.durationMin || 0), 0)
    return { date, min }
  })
}

/** Running cumulative coding hours over every logged day (ascending). */
export function cumulativeHours(data: JournalData): { date: string; hours: number }[] {
  const byDay = new Map<string, number>()
  for (const s of sessions(data)) byDay.set(s.date, (byDay.get(s.date) ?? 0) + (s.durationMin || 0))
  const days = [...byDay.keys()].sort()
  let run = 0
  return days.map((date) => { run += byDay.get(date)!; return { date, hours: Math.round((run / 60) * 10) / 10 } })
}

/** Top languages/tools by total minutes. */
export function topTags(data: JournalData, limit = 5): { tag: string; min: number }[] {
  const totals = new Map<string, number>()
  for (const s of sessions(data)) for (const t of s.tags ?? []) totals.set(t, (totals.get(t) ?? 0) + (s.durationMin || 0))
  return [...totals.entries()].map(([tag, min]) => ({ tag, min })).sort((a, b) => b.min - a.min).slice(0, limit)
}

/**
 * Projected total coding minutes for the current rolling 7-day week, from the
 * pace logged so far. Extrapolates minutes-so-far across the remaining days of
 * the window: e.g. 200m over the first 4 days → ~350m projected for all 7.
 * Returns null when the week is fully elapsed (nothing left to project) or no
 * minutes have been logged yet.
 */
export function projectedWeeklyMinutes(data: JournalData, today = todayISO(), days = 7): number | null {
  const soFar = weeklyCodingMinutes(data, today, days)
  if (soFar <= 0) return null
  // Days observed = from the oldest logged day in the window through today,
  // but at least 1 and at most `days`.
  const ss = sessions(data).filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < days })
  const oldest = Math.max(...ss.map((s) => dayDiff(s.date, today)))
  const observed = Math.min(days, Math.max(1, oldest + 1))
  if (observed >= days) return null
  return Math.round((soFar / observed) * days)
}

/**
 * Total coding minutes bucketed by weekday (Sun→Sat, indices 0..6), summed
 * across all sessions. Reveals which days of the week you do deep work.
 */
export function minutesByWeekday(data: JournalData): { day: number; label: string; min: number }[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totals = new Array(7).fill(0)
  for (const s of sessions(data)) {
    // Parse the ISO day as a local date to get a stable weekday index.
    const [y, m, d] = s.date.split('-').map(Number)
    const wd = new Date(y, (m || 1) - 1, d || 1).getDay()
    totals[wd] += s.durationMin || 0
  }
  return labels.map((label, day) => ({ day, label, min: totals[day] }))
}

/**
 * Total coding minutes grouped by project, highest first. Sessions with no
 * project fall under "(no project)". Returns at most `limit` rows.
 */
export function minutesByProject(data: JournalData, limit = 6): { project: string; min: number }[] {
  const totals = new Map<string, number>()
  for (const s of sessions(data)) {
    const key = s.project?.trim() || '(no project)'
    totals.set(key, (totals.get(key) ?? 0) + (s.durationMin || 0))
  }
  return [...totals.entries()]
    .map(([project, min]) => ({ project, min }))
    .filter((r) => r.min > 0)
    .sort((a, b) => b.min - a.min)
    .slice(0, limit)
}

/**
 * Interruptions-per-session over the last `days`, oldest→newest. Each day shows
 * the mean interruptions across that day's sessions (0 when no session logged
 * interruptions that day, null-free for charting). `count` is how many sessions
 * contributed, so the view can dim empty days.
 */
export function interruptionsTrend(data: JournalData, today = todayISO(), days = 14): { date: string; avg: number; count: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i))
    const day = sessions(data).filter((s) => s.date === date && s.interruptions != null)
    if (!day.length) return { date, avg: 0, count: 0 }
    const total = day.reduce((a, s) => a + (s.interruptions || 0), 0)
    return { date, avg: Math.round((total / day.length) * 10) / 10, count: day.length }
  })
}

/** The single longest focus session by duration (null when no sessions). */
export function longestSession(data: JournalData): DevSession | null {
  const ss = sessions(data)
  if (!ss.length) return null
  return ss.reduce((best, s) => ((s.durationMin || 0) > (best.durationMin || 0) ? s : best))
}

/**
 * GitHub-style heatmap of daily coding minutes ending today, covering the last
 * `weeks` calendar weeks aligned to whole Sun→Sat rows (backlog #376). Returns
 * one cell per day, oldest→newest, each with its weekday column (0=Sun..6=Sat)
 * and an intensity level 0..4 (0 = no work) bucketed against the busiest day in
 * the window. `max` is that busiest day's minutes, for a legend.
 */
export function deepWorkHeatmap(
  data: JournalData,
  today = todayISO(),
  weeks = 26,
): { cells: { date: string; min: number; weekday: number; level: number }[]; max: number } {
  // Align the window's end to the Saturday of today's week so rows are whole.
  const [ty, tm, td] = today.split('-').map(Number)
  const todayWd = new Date(ty, (tm || 1) - 1, td || 1).getDay() // 0..6
  const end = addDays(today, 6 - todayWd) // Saturday of this week
  const totalDays = weeks * 7
  const start = addDays(end, -(totalDays - 1))

  const byDay = new Map<string, number>()
  for (const s of sessions(data)) byDay.set(s.date, (byDay.get(s.date) ?? 0) + (s.durationMin || 0))
  const max = Math.max(0, ...[...byDay.values()])

  const cells = Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(start, i)
    const min = byDay.get(date) ?? 0
    const [y, m, d] = date.split('-').map(Number)
    const weekday = new Date(y, (m || 1) - 1, d || 1).getDay()
    let level = 0
    if (min > 0 && max > 0) level = Math.min(4, Math.max(1, Math.ceil((min / max) * 4)))
    return { date, min, weekday, level }
  })
  return { cells, max }
}

/**
 * Duration-weighted average focus score per weekday (Sun→Sat, indices 0..6),
 * across all sessions — complements minutesByWeekday by showing *quality*, not
 * just volume. Days with no logged minutes report avg 0 and count 0 so the view
 * can dim them.
 */
export function focusByWeekday(data: JournalData): { day: number; label: string; avg: number; count: number }[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const wsum = new Array(7).fill(0) // focus * minutes
  const wmin = new Array(7).fill(0) // minutes
  const cnt = new Array(7).fill(0)
  for (const s of sessions(data)) {
    const [y, m, d] = s.date.split('-').map(Number)
    const wd = new Date(y, (m || 1) - 1, d || 1).getDay()
    const min = s.durationMin || 0
    wsum[wd] += s.focus * min
    wmin[wd] += min
    cnt[wd] += 1
  }
  return labels.map((label, day) => ({
    day,
    label,
    avg: wmin[day] ? Math.round((wsum[day] / wmin[day]) * 10) / 10 : 0,
    count: cnt[day],
  }))
}

/** A plain-language read on the focus↔stress relationship. */
export function focusInsight(data: JournalData): string | null {
  const r = focusStressCorrelation(data)
  if (Math.abs(r) < 0.4) return null
  return r < 0
    ? 'Higher-focus sessions tend to come with lower stress.'
    : 'Higher-focus sessions tend to come with higher stress — watch for burnout.'
}

export type { DevSession }
