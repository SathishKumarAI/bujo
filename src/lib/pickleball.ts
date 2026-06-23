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

/** Games + win% split by format (singles vs doubles). */
export function formatStats(data: JournalData): { format: 'singles' | 'doubles'; games: number; winPct: number }[] {
  return (['doubles', 'singles'] as const).map((format) => {
    const rows = sessions(data).filter((s) => s.format === format)
    const won = rows.reduce((a, s) => a + s.gamesWon, 0)
    const games = rows.reduce((a, s) => a + s.gamesWon + s.gamesLost, 0)
    return { format, games, winPct: games ? Math.round((won / games) * 100) : 0 }
  }).filter((x) => x.games > 0)
}

/** Running cumulative games played over every session day (ascending). */
export function cumulativeGames(data: JournalData): { date: string; games: number }[] {
  const byDay = new Map<string, number>()
  for (const s of sessions(data)) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.gamesWon + s.gamesLost)
  let run = 0
  return [...byDay.keys()].sort().map((date) => { run += byDay.get(date)!; return { date: date.slice(5), games: run } })
}

/** Games played per day, for a play-frequency heatmap. */
export function gamesByDay(data: JournalData): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of sessions(data)) m.set(s.date, (m.get(s.date) ?? 0) + s.gamesWon + s.gamesLost)
  return m
}

/** Consecutive-day play streak ending today/yesterday. */
export function playStreak(data: JournalData, today = todayISO()): number {
  const days = new Set(sessions(data).map((s) => s.date))
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) { streak++; cursor = addDays(cursor, -1) }
  return streak
}

export interface PartnerStat {
  partner: string
  sessions: number
  games: number
  gamesWon: number
  gamesLost: number
  winPct: number // whole number 0–100
}

/**
 * Win% + games per doubles partner (chemistry). Only doubles sessions that name a
 * partner count. Sorted by games desc, then win% desc, so your most-played
 * partners surface first.
 */
export function partnerStats(data: JournalData): PartnerStat[] {
  const by = new Map<string, PartnerStat>()
  for (const s of sessions(data)) {
    const name = s.partner?.trim()
    if (!name) continue
    const cur = by.get(name) ?? { partner: name, sessions: 0, games: 0, gamesWon: 0, gamesLost: 0, winPct: 0 }
    cur.sessions += 1
    cur.gamesWon += s.gamesWon
    cur.gamesLost += s.gamesLost
    cur.games += s.gamesWon + s.gamesLost
    by.set(name, cur)
  }
  return [...by.values()]
    .map((p) => ({ ...p, winPct: p.games ? Math.round((p.gamesWon / p.games) * 100) : 0 }))
    .sort((a, b) => b.games - a.games || b.winPct - a.winPct || (a.partner < b.partner ? -1 : 1))
}

export interface VenueStat {
  location: string
  sessions: number
  games: number
  gamesWon: number
  gamesLost: number
  winPct: number // whole number 0–100
}

/**
 * Games + win% aggregated by venue/location. Only sessions with a location count.
 * Sorted by games desc, then win% desc.
 */
export function venueStats(data: JournalData): VenueStat[] {
  const by = new Map<string, VenueStat>()
  for (const s of sessions(data)) {
    const loc = s.location?.trim()
    if (!loc) continue
    const cur = by.get(loc) ?? { location: loc, sessions: 0, games: 0, gamesWon: 0, gamesLost: 0, winPct: 0 }
    cur.sessions += 1
    cur.gamesWon += s.gamesWon
    cur.gamesLost += s.gamesLost
    cur.games += s.gamesWon + s.gamesLost
    by.set(loc, cur)
  }
  return [...by.values()]
    .map((v) => ({ ...v, winPct: v.games ? Math.round((v.gamesWon / v.games) * 100) : 0 }))
    .sort((a, b) => b.games - a.games || b.winPct - a.winPct || (a.location < b.location ? -1 : 1))
}

export interface OpponentRecord {
  opponent: string
  sessions: number
  games: number
  gamesWon: number
  gamesLost: number
  winPct: number // whole number 0–100
  /** Net game differential vs this opponent (won − lost): >0 you lead the rivalry. */
  diff: number
}

/**
 * Head-to-head record book per opponent (your wins/losses against them). Only
 * sessions naming an opponent count. Sorted by games played desc, then by your
 * lead (diff) desc.
 */
export function opponentRecords(data: JournalData): OpponentRecord[] {
  const by = new Map<string, OpponentRecord>()
  for (const s of sessions(data)) {
    const opp = s.opponent?.trim()
    if (!opp) continue
    const cur = by.get(opp) ?? { opponent: opp, sessions: 0, games: 0, gamesWon: 0, gamesLost: 0, winPct: 0, diff: 0 }
    cur.sessions += 1
    cur.gamesWon += s.gamesWon
    cur.gamesLost += s.gamesLost
    cur.games += s.gamesWon + s.gamesLost
    by.set(opp, cur)
  }
  return [...by.values()]
    .map((o) => ({ ...o, winPct: o.games ? Math.round((o.gamesWon / o.games) * 100) : 0, diff: o.gamesWon - o.gamesLost }))
    .sort((a, b) => b.games - a.games || b.diff - a.diff || (a.opponent < b.opponent ? -1 : 1))
}
