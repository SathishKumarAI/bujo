import type { JournalData, PickleballSession, PickleballEvent, Settings } from './types'
import { todayISO, addDays, dayDiff, fromISODay, ymOf, prettyMonth, WEEKDAYS } from './date'

const sessions = (data: JournalData): PickleballSession[] => data.pickleball ?? []
const events = (data: JournalData): PickleballEvent[] => data.pickleballEvents ?? []

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

export interface DuprTrend {
  /** Chronologically-sorted points (date asc), deduped to one per day (last wins). */
  points: { date: string; rating: number }[]
  /** Most recent rating, or null when nothing is logged. */
  latest: number | null
  /** Earliest rating, or null when nothing is logged. */
  first: number | null
  /** latest − first, rounded to 2dp (0 when fewer than 2 points). */
  change: number
  /** Highest logged rating. */
  best: number | null
  /** 'up' | 'down' | 'flat' over the logged span (flat when < 2 points). */
  direction: 'up' | 'down' | 'flat'
}

/**
 * DUPR rating trend from the manual log (settings.duprLog). Sorts points by
 * date, dedupes to one entry per day (keeping the last logged that day), and
 * summarises the change/best/direction for a sparkline + delta badge. Pure.
 */
export function duprTrend(settings: Settings): DuprTrend {
  const byDay = new Map<string, number>()
  for (const e of settings.duprLog ?? []) byDay.set(e.date, e.rating)
  const points = [...byDay.entries()]
    .map(([date, rating]) => ({ date, rating }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  if (points.length === 0) return { points, latest: null, first: null, change: 0, best: null, direction: 'flat' }
  const first = points[0].rating
  const latest = points[points.length - 1].rating
  const best = Math.max(...points.map((p) => p.rating))
  const change = points.length < 2 ? 0 : Math.round((latest - first) * 100) / 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  return { points, latest, first, change, best, direction }
}

export interface MonthGames {
  /** "YYYY-MM" key. */
  ym: string
  /** "June 2026" label. */
  label: string
  sessions: number
  games: number
  gamesWon: number
  winPct: number
}

/**
 * Games + win% per calendar month (#monthly games played). Returns the most
 * recent `months` calendar months ending at `today`, oldest → newest, so empty
 * months still appear as zero bars. Pure.
 */
export function monthlyGames(data: JournalData, months = 6, today = todayISO()): MonthGames[] {
  // Build the trailing window of month keys ending at today's month.
  const base = fromISODay(today)
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
    keys.push(ymOf(d))
  }
  const acc = new Map<string, { sessions: number; games: number; won: number }>()
  for (const k of keys) acc.set(k, { sessions: 0, games: 0, won: 0 })
  for (const s of sessions(data)) {
    const k = ymOf(s.date)
    const cur = acc.get(k)
    if (!cur) continue // outside the window
    cur.sessions += 1
    cur.games += s.gamesWon + s.gamesLost
    cur.won += s.gamesWon
  }
  return keys.map((ym) => {
    const a = acc.get(ym)!
    return { ym, label: prettyMonth(ym), sessions: a.sessions, games: a.games, gamesWon: a.won, winPct: a.games ? Math.round((a.won / a.games) * 100) : 0 }
  })
}

export interface WinRateForecast {
  /** Whether there's enough data (≥4 decisive sessions) to project. */
  ready: boolean
  /** Current win% over all games (whole number). */
  current: number
  /** Per-session win% slope from a least-squares fit (points/session). */
  slope: number
  /** Projected win% `ahead` sessions out, clamped 0–100 (null when not ready). */
  projected: number | null
  /** 'up' | 'down' | 'flat' read of the slope. */
  direction: 'up' | 'down' | 'flat'
  /** Rating-readiness label from the projected/current win%. */
  readiness: 'building' | 'consolidating' | 'ready'
}

/**
 * Win-rate trend forecast & rating-readiness (#133). Fits a least-squares line
 * to each session's win% (oldest → newest) and projects `ahead` sessions out.
 * Readiness reads the projected level: a sustained ≥60% win rate signals you're
 * winning enough to move up. Pure; needs ≥4 decisive sessions to project.
 */
export function winRateForecast(data: JournalData, ahead = 5): WinRateForecast {
  const ys = [...sessions(data)]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => { const g = s.gamesWon + s.gamesLost; return g ? (s.gamesWon / g) * 100 : null })
    .filter((v): v is number => v != null)
  const current = pickleTotals(data).winPct
  const n = ys.length
  if (n < 4) {
    return { ready: false, current, slope: 0, projected: null, direction: 'flat', readiness: current >= 60 ? 'ready' : current >= 45 ? 'consolidating' : 'building' }
  }
  // Least-squares slope/intercept over x = 0..n-1.
  const meanX = (n - 1) / 2
  const meanY = ys.reduce((a, v) => a + v, 0) / n
  let num = 0, den = 0
  ys.forEach((v, i) => { num += (i - meanX) * (v - meanY); den += (i - meanX) ** 2 })
  const slope = den ? num / den : 0
  const intercept = meanY - slope * meanX
  const raw = intercept + slope * (n - 1 + ahead)
  const projected = Math.max(0, Math.min(100, Math.round(raw)))
  const direction = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'flat'
  const gauge = Math.max(projected, current)
  const readiness = gauge >= 60 ? 'ready' : gauge >= 45 ? 'consolidating' : 'building'
  return { ready: true, current, slope: Math.round(slope * 10) / 10, projected, direction, readiness }
}

export interface RpeLoad {
  /** Sessions that logged an RPE. */
  sessions: number
  /** Average RPE across logged sessions, one decimal (0 when none). */
  avg: number
  /** Hardest single logged session's RPE (0 when none). */
  hardest: number
  /** RPE-weighted training load over the last `days` (Σ rpe·duration-or-1 proxy). */
  weekLoad: number
  /** Plain-language read of the average effort. */
  label: 'easy' | 'moderate' | 'hard' | 'very hard'
}

/**
 * Session intensity / training-load from logged RPE (#566 conditioning). Uses
 * session.rpe; sessions without it are ignored. weekLoad is an RPE×games proxy
 * over the last `days` (a session-RPE load like training monotony, no duration
 * required). Pure & empty-safe.
 */
export function rpeLoad(data: JournalData, days = 7, today = todayISO()): RpeLoad {
  const withRpe = sessions(data).filter((s) => s.rpe != null && s.rpe > 0)
  const n = withRpe.length
  const avg = n ? Math.round((withRpe.reduce((a, s) => a + (s.rpe ?? 0), 0) / n) * 10) / 10 : 0
  const hardest = n ? Math.max(...withRpe.map((s) => s.rpe ?? 0)) : 0
  let weekLoad = 0
  for (const s of withRpe) {
    const d = dayDiff(s.date, today)
    if (d >= 0 && d < days) weekLoad += (s.rpe ?? 0) * Math.max(1, s.gamesWon + s.gamesLost)
  }
  const label: RpeLoad['label'] = avg >= 8 ? 'very hard' : avg >= 6 ? 'hard' : avg >= 4 ? 'moderate' : 'easy'
  return { sessions: n, avg, hardest, weekLoad, label }
}

export interface PickleMilestone {
  /** Stable id. */
  id: string
  label: string
  /** The target value to reach. */
  target: number
  /** Current progress toward the target. */
  current: number
  done: boolean
}

/**
 * Pickleball milestone badges (#161) derived purely from logged sessions:
 * sessions logged, total games won, and the longest winning-session streak.
 * Each metric has a fixed achievement ladder; the milestone shown per metric is
 * the next unmet one, or the top tier once all are cleared. Pure.
 */
export function pickleMilestones(data: JournalData): PickleMilestone[] {
  const rows = sessions(data)
  const sessionCount = rows.length
  const gamesWon = rows.reduce((a, s) => a + s.gamesWon, 0)
  const { longest } = winStreaks(data)
  const ladder = (prefix: string, name: string, current: number, tiers: number[]): PickleMilestone => {
    const next = tiers.find((t) => current < t)
    const target = next ?? tiers[tiers.length - 1]
    return { id: `${prefix}-${target}`, label: `${name}: ${target}`, target, current, done: next == null }
  }
  return [
    ladder('sessions', 'Sessions logged', sessionCount, [10, 25, 50, 100, 250]),
    ladder('wins', 'Games won', gamesWon, [25, 100, 250, 500, 1000]),
    ladder('streak', 'Win streak', longest, [3, 5, 10, 20]),
  ]
}

export interface PickleHours {
  /** Sessions that logged a durationMin (others are excluded from time math). */
  timedSessions: number
  /** Total minutes logged across timed sessions. */
  minutes: number
  /** Total hours, one decimal. */
  hours: number
  /** Average minutes per timed session (rounded). */
  avgMin: number
  /** Hours logged within the last `recentDays` window, one decimal. */
  recentHours: number
  /** Minutes per game where games were played (court efficiency), rounded; 0 when none. */
  minPerGame: number
}

/**
 * Time-on-court summary (#149 time-allocation) from session durationMin. Only
 * sessions that logged a duration count toward the time totals. recentHours is
 * the trailing window; minPerGame is a tempo read (lower = faster games). Pure.
 */
export function pickleHours(data: JournalData, recentDays = 30, today = todayISO()): PickleHours {
  const timed = sessions(data).filter((s) => s.durationMin != null && s.durationMin > 0)
  const minutes = timed.reduce((a, s) => a + (s.durationMin ?? 0), 0)
  const n = timed.length
  let recentMin = 0
  let games = 0
  for (const s of timed) {
    const d = dayDiff(s.date, today)
    if (d >= 0 && d < recentDays) recentMin += s.durationMin ?? 0
    games += s.gamesWon + s.gamesLost
  }
  return {
    timedSessions: n,
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    avgMin: n ? Math.round(minutes / n) : 0,
    recentHours: Math.round((recentMin / 60) * 10) / 10,
    minPerGame: games ? Math.round(minutes / games) : 0,
  }
}

export interface ScoringStat {
  /** Scoring system used. */
  scoring: '11' | '15' | '21' | 'rally21'
  label: string
  sessions: number
  games: number
  gamesWon: number
  winPct: number // whole number 0–100
}

const SCORING_LABEL: Record<ScoringStat['scoring'], string> = {
  '11': 'To 11', '15': 'To 15', '21': 'To 21', rally21: 'Rally 21',
}

/**
 * Win% + games split by the scoring system logged on each session (to 11/15/21
 * or rally-21). Surfaces whether you play better in short vs long games. Only
 * sessions carrying a `scoring` value count. Sorted by games desc, then win%
 * desc. Pure & empty-safe.
 */
export function scoringStats(data: JournalData): ScoringStat[] {
  const by = new Map<ScoringStat['scoring'], { sessions: number; games: number; won: number }>()
  for (const s of sessions(data)) {
    const sc = s.scoring
    if (!sc) continue
    const cur = by.get(sc) ?? { sessions: 0, games: 0, won: 0 }
    cur.sessions += 1
    cur.games += s.gamesWon + s.gamesLost
    cur.won += s.gamesWon
    by.set(sc, cur)
  }
  return [...by.entries()]
    .map(([scoring, v]) => ({
      scoring,
      label: SCORING_LABEL[scoring],
      sessions: v.sessions,
      games: v.games,
      gamesWon: v.won,
      winPct: v.games ? Math.round((v.won / v.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games || b.winPct - a.winPct || (a.scoring < b.scoring ? -1 : 1))
}

export interface UpcomingEvent {
  id: string
  name: string
  date: string
  kind: 'league' | 'tournament'
  format: PickleballEvent['format']
  division?: string
  /** Whole days from `today` until the event (0 = today, never negative here). */
  daysUntil: number
  /** True when the event is today or tomorrow (urgency styling hook). */
  soon: boolean
}

/**
 * Upcoming leagues/tournaments for a prep countdown (#345). Returns events dated
 * today or later, soonest first, each with a daysUntil. `soon` flags the next
 * 48h. Past events are excluded. Pure.
 */
export function upcomingEvents(data: JournalData, today = todayISO()): UpcomingEvent[] {
  return events(data)
    .map((e) => ({ e, daysUntil: dayDiff(today, e.date) }))
    .filter((x) => x.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil || (a.e.name < b.e.name ? -1 : 1))
    .map(({ e, daysUntil }) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      kind: e.kind,
      format: e.format,
      division: e.division,
      daysUntil,
      soon: daysUntil <= 1,
    }))
}

export interface PlayConsistency {
  /** Distinct calendar days you played. */
  daysPlayed: number
  /** Longest gap (in days) between consecutive play days; 0 with <2 play days. */
  longestGap: number
  /** Average days between consecutive play days, one decimal; 0 with <2. */
  avgGap: number
  /** Distinct weeks with ≥1 session within the trailing `weeks` window. */
  activeWeeks: number
  /** The trailing window size used for activeWeeks. */
  weeks: number
  /** Days since your most recent session; null when nothing is logged. */
  daysSinceLast: number | null
}

/**
 * Play-consistency / cadence read over session days (#: gap analysis, extends
 * playStreak). Looks at the spacing of distinct play days: the longest layoff,
 * the average cadence, and how many of the last `weeks` weeks had any play.
 * Pure & empty-safe.
 */
export function playConsistency(data: JournalData, weeks = 8, today = todayISO()): PlayConsistency {
  const days = [...new Set(sessions(data).map((s) => s.date))].sort()
  const daysPlayed = days.length
  let longestGap = 0
  let gapSum = 0
  for (let i = 1; i < days.length; i++) {
    const gap = dayDiff(days[i - 1], days[i])
    if (gap > longestGap) longestGap = gap
    gapSum += gap
  }
  const avgGap = days.length >= 2 ? Math.round((gapSum / (days.length - 1)) * 10) / 10 : 0
  // Active weeks: count distinct 7-day buckets ending at `today` that had play.
  const start = addDays(today, -(weeks * 7 - 1))
  const activeBuckets = new Set<number>()
  for (const d of days) {
    const off = dayDiff(start, d)
    if (off >= 0 && off < weeks * 7) activeBuckets.add(Math.floor(off / 7))
  }
  const last = days[days.length - 1]
  return {
    daysPlayed,
    longestGap,
    avgGap,
    activeWeeks: activeBuckets.size,
    weeks,
    daysSinceLast: last ? Math.max(0, dayDiff(last, today)) : null,
  }
}
