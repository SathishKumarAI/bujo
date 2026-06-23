import type { JournalData, PickleballSession } from './types'
import { todayISO, addDays, dayDiff, fromISODay, WEEKDAYS } from './date'

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

export interface RollingForm {
  /** Last-N session results, newest first, as a 'W'/'L'/'–' string (W = net games won that session). */
  results: ('W' | 'L' | '–')[]
  wins: number
  losses: number
  draws: number
  /** Win% over the window's decisive (non-draw) sessions, whole number 0–100. */
  winPct: number
  /** 'up' if recent half outperforms older half, 'down' if worse, 'flat' otherwise. */
  momentum: 'up' | 'down' | 'flat'
}

/**
 * Rolling form over the last `n` sessions (default 10): a W/L/– string and a
 * momentum read (#323). Each session resolves to one mark by net games
 * (won > lost = W, won < lost = L, tie = draw). Momentum compares the win rate
 * of the most-recent half of the window to the older half.
 */
export function rollingForm(data: JournalData, n = 10): RollingForm {
  const recent = [...sessions(data)]
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
    .slice(0, n)
  const mark = (s: PickleballSession): 'W' | 'L' | '–' =>
    s.gamesWon > s.gamesLost ? 'W' : s.gamesWon < s.gamesLost ? 'L' : '–'
  const results = recent.map(mark)
  const wins = results.filter((r) => r === 'W').length
  const losses = results.filter((r) => r === 'L').length
  const draws = results.filter((r) => r === '–').length
  const decisive = wins + losses
  // chronological order (oldest → newest) for the momentum split
  const chrono = [...results].reverse()
  const rate = (arr: ('W' | 'L' | '–')[]): number | null => {
    const w = arr.filter((r) => r === 'W').length
    const l = arr.filter((r) => r === 'L').length
    return w + l ? w / (w + l) : null
  }
  let momentum: RollingForm['momentum'] = 'flat'
  if (chrono.length >= 4) {
    const mid = Math.floor(chrono.length / 2)
    const older = rate(chrono.slice(0, mid))
    const newer = rate(chrono.slice(mid))
    if (older != null && newer != null) {
      if (newer > older + 0.001) momentum = 'up'
      else if (newer < older - 0.001) momentum = 'down'
    }
  }
  return { results, wins, losses, draws, winPct: decisive ? Math.round((wins / decisive) * 100) : 0, momentum }
}

/**
 * Longest run of consecutive winning sessions, ever (#161). A session counts as
 * a win when net games won > lost; a loss or draw breaks the run. Also returns
 * the current active streak (trailing wins up to the most recent session).
 */
export function winStreaks(data: JournalData): { longest: number; current: number } {
  const chrono = [...sessions(data)].sort((a, b) => (a.date < b.date ? -1 : 1))
  let longest = 0
  let run = 0
  for (const s of chrono) {
    if (s.gamesWon > s.gamesLost) { run++; if (run > longest) longest = run }
    else run = 0
  }
  // current = trailing wins from the newest session backward
  let current = 0
  for (let i = chrono.length - 1; i >= 0; i--) {
    if (chrono[i].gamesWon > chrono[i].gamesLost) current++
    else break
  }
  return { longest, current }
}

export interface PointDiff {
  /** Total points you scored across sessions that logged points. */
  pointsFor: number
  pointsAgainst: number
  /** Net (for − against): >0 you outscore opponents on balance. */
  diff: number
  /** Number of sessions that contributed points. */
  sessions: number
  /** Average net point margin per contributing session, one decimal. */
  avgMargin: number
}

/**
 * Aggregate point differential from sessions that logged pointsFor/pointsAgainst
 * (close-game signal beyond raw win%). Sessions without points are ignored.
 */
export function pointDifferential(data: JournalData): PointDiff {
  let pf = 0, pa = 0, n = 0
  for (const s of sessions(data)) {
    if (s.pointsFor == null && s.pointsAgainst == null) continue
    pf += s.pointsFor ?? 0
    pa += s.pointsAgainst ?? 0
    n++
  }
  const diff = pf - pa
  return { pointsFor: pf, pointsAgainst: pa, diff, sessions: n, avgMargin: n ? Math.round((diff / n) * 10) / 10 : 0 }
}

export interface LevelBucket {
  /** 'Below', 'At/unknown', 'Above' relative to your own logged level — or a raw level when self level is unknown. */
  bucket: 'stronger' | 'similar' | 'weaker'
  label: string
  games: number
  gamesWon: number
  winPct: number
}

/**
 * Win% split by opponent strength (#478). Parses the numeric DUPR-style level
 * from each session (e.g. "3.5"). When a session also carries a self-level we
 * compare; otherwise we bucket relative to the player's median logged level so
 * the split still reflects stronger/similar/weaker fields. Sessions without any
 * parseable level are ignored.
 */
export function levelMatchup(data: JournalData): LevelBucket[] {
  const num = (v?: string): number | null => {
    if (!v) return null
    const m = v.match(/\d+(\.\d+)?/)
    return m ? Number(m[0]) : null
  }
  const rows = sessions(data)
    .map((s) => ({ s, lvl: num(s.level) }))
    .filter((r): r is { s: PickleballSession; lvl: number } => r.lvl != null)
  if (!rows.length) return []
  // Reference = median of logged levels (a stable read of "your usual field").
  const sorted = [...rows.map((r) => r.lvl)].sort((a, b) => a - b)
  const ref = sorted[Math.floor((sorted.length - 1) / 2)]
  const acc: Record<LevelBucket['bucket'], { games: number; won: number }> = {
    stronger: { games: 0, won: 0 }, similar: { games: 0, won: 0 }, weaker: { games: 0, won: 0 },
  }
  for (const { s, lvl } of rows) {
    const key: LevelBucket['bucket'] = lvl > ref + 0.25 ? 'stronger' : lvl < ref - 0.25 ? 'weaker' : 'similar'
    acc[key].games += s.gamesWon + s.gamesLost
    acc[key].won += s.gamesWon
  }
  const LABEL: Record<LevelBucket['bucket'], string> = {
    stronger: 'vs stronger', similar: 'vs similar', weaker: 'vs weaker',
  }
  return (['stronger', 'similar', 'weaker'] as const)
    .map((bucket) => ({
      bucket,
      label: LABEL[bucket],
      games: acc[bucket].games,
      gamesWon: acc[bucket].won,
      winPct: acc[bucket].games ? Math.round((acc[bucket].won / acc[bucket].games) * 100) : 0,
    }))
    .filter((b) => b.games > 0)
}

/**
 * Win% and games played by weekday (#: time-of-day/day performance). Index 0 =
 * Sunday … 6 = Saturday, so it can be rendered in calendar order. Surfaces which
 * days you actually perform best on.
 */
export function weekdayPerformance(data: JournalData): { day: string; games: number; gamesWon: number; winPct: number }[] {
  const acc = WEEKDAYS.map((day) => ({ day, games: 0, gamesWon: 0, winPct: 0 }))
  for (const s of sessions(data)) {
    const dow = fromISODay(s.date).getDay()
    acc[dow].games += s.gamesWon + s.gamesLost
    acc[dow].gamesWon += s.gamesWon
  }
  return acc.map((d) => ({ ...d, winPct: d.games ? Math.round((d.gamesWon / d.games) * 100) : 0 }))
}
