import type { JournalData, PickleballSession } from './types'
import { todayISO, addDays, dayDiff } from './date'

const sessions = (data: JournalData): PickleballSession[] => data.pickleball ?? []

export interface PickleStats {
  sessions: number
  gamesWon: number
  gamesLost: number
  games: number
  winPct: number // whole number 0–100
  minutes: number
}

/** Overall totals (optionally within the last `days`). */
export function pickleTotals(data: JournalData, days?: number, today = todayISO()): PickleStats {
  const rows = days == null ? sessions(data) : sessions(data).filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < days })
  const gamesWon = rows.reduce((a, s) => a + s.gamesWon, 0)
  const gamesLost = rows.reduce((a, s) => a + s.gamesLost, 0)
  const games = gamesWon + gamesLost
  return {
    sessions: rows.length,
    gamesWon,
    gamesLost,
    games,
    winPct: games ? Math.round((gamesWon / games) * 100) : 0,
    minutes: rows.reduce((a, s) => a + (s.durationMin ?? 0), 0),
  }
}

/** Win % per session over time (oldest → newest), for the trend line. */
export function winRateSeries(data: JournalData): { date: string; winPct: number }[] {
  return [...sessions(data)]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => {
      const g = s.gamesWon + s.gamesLost
      return { date: s.date.slice(5), winPct: g ? Math.round((s.gamesWon / g) * 100) : 0 }
    })
}

/** Games played per week for the last `weeks` (oldest → newest). */
export function weeklyGames(data: JournalData, weeks = 8, today = todayISO()): number[] {
  return Array.from({ length: weeks }, (_, i) => {
    const end = addDays(today, -7 * (weeks - 1 - i))
    return sessions(data)
      .filter((s) => { const d = dayDiff(s.date, end); return d >= 0 && d < 7 })
      .reduce((a, s) => a + s.gamesWon + s.gamesLost, 0)
  })
}

/** Consecutive-day play streak ending today/yesterday. */
export function playStreak(data: JournalData, today = todayISO()): number {
  const days = new Set(sessions(data).map((s) => s.date))
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) { streak++; cursor = addDays(cursor, -1) }
  return streak
}
