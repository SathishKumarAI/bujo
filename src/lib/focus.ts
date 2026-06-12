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

/** A plain-language read on the focus↔stress relationship. */
export function focusInsight(data: JournalData): string | null {
  const r = focusStressCorrelation(data)
  if (Math.abs(r) < 0.4) return null
  return r < 0
    ? 'Higher-focus sessions tend to come with lower stress.'
    : 'Higher-focus sessions tend to come with higher stress — watch for burnout.'
}

export type { DevSession }
