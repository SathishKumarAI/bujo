// ── Recovery: urge-log analytics + trigger-plan matching ─────────────────────
import type { UrgeWin, TriggerPlan, Relapse } from './types'
import { dayDiff, todayISO, addDays, fromISODay, WEEKDAYS } from './date'

/** The coping techniques an urge can be tagged with. */
export type UrgeTechnique = NonNullable<UrgeWin['technique']>

/** One technique row in the effectiveness tally. */
export interface TechniqueRank {
  technique: UrgeTechnique
  /** How many resisted urges used this technique. */
  count: number
}

/**
 * Tally resisted urges by the coping technique used, most-used first.
 * Logs missing a `technique` are ignored. Pure; ties keep first-seen order
 * (stable sort), so the most-effective technique is `[0]`.
 */
export function techniqueRanking(urgeLog: UrgeWin[] = []): TechniqueRank[] {
  const counts = new Map<UrgeTechnique, number>()
  for (const u of urgeLog) {
    if (!u || !u.technique) continue
    counts.set(u.technique, (counts.get(u.technique) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([technique, count]) => ({ technique, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Find the first trigger plan whose `trigger` matches the typed/picked urge
 * trigger, case-insensitively. Matches when either string contains the other
 * (substring both ways) or they share a word — so "stress" finds a plan for
 * "stress at work" and vice-versa. Returns undefined when nothing matches or
 * the input is empty.
 */
export function matchPlanForTrigger(
  plans: TriggerPlan[] = [],
  triggerText: string,
): TriggerPlan | undefined {
  const q = triggerText.trim().toLowerCase()
  if (!q) return undefined
  const qWords = q.split(/\W+/).filter(Boolean)
  return plans.find((p) => {
    const t = (p.trigger ?? '').trim().toLowerCase()
    if (!t) return false
    if (t.includes(q) || q.includes(t)) return true
    const tWords = new Set(t.split(/\W+/).filter(Boolean))
    return qWords.some((w) => tWords.has(w))
  })
}

/** Current streak length measured against the personal best, for the ghost bar. */
export interface StreakVsBest {
  /** Days in the live run. */
  current: number
  /** Longest streak ever (the ghost/target length). */
  best: number
  /** 0–100: how far the current run has come toward equalling the best. 100 when
   *  current ≥ best (i.e. a new record, or no best to beat yet). */
  pct: number
  /** Days still needed to match the best (0 once equalled or exceeded). */
  daysToBeat: number
  /** True once the current run has reached or passed the previous best. */
  isRecord: boolean
}

/**
 * Compare the current streak with the personal best for a ghost-bar render.
 * Pure. `best` should already include the live run (as streakStats computes it),
 * so when `current` equals `best` the run IS the record and pct is 100.
 */
export function streakVsBest(current: number, best: number): StreakVsBest {
  const cur = Math.max(0, current)
  const bst = Math.max(0, best)
  // The bar fills toward the *previous* best — the longest streak excluding the
  // live run. If best == current the live run is the record, so target is itself.
  const isRecord = cur >= bst
  const pct = bst <= 0 ? 100 : Math.min(100, Math.round((cur / bst) * 100))
  const daysToBeat = Math.max(0, bst - cur)
  return { current: cur, best: bst, pct, daysToBeat, isRecord }
}

/** Result of the comeback check — a streak that has out-grown the one before it. */
export interface Comeback {
  /** True when the current run is longer than the immediately-prior completed streak. */
  isComeback: boolean
  /** Length of the previous (most-recent completed) streak, in days. */
  prevStreak: number
  /** Days the current run beats the previous one by (0 when not a comeback). */
  by: number
}

/**
 * Comeback badge: fires when the CURRENT run has grown longer than the streak that
 * preceded the most-recent relapse. Computed purely from the relapse history +
 * the current start day. The "previous streak" is the gap between the last two
 * relapses (or, before the second relapse, from `startedOn`-of-first back to the
 * very first relapse — i.e. how long the run was that ended at the latest reset).
 *
 * Needs at least one relapse to have something to beat; returns isComeback=false
 * with prevStreak=0 when there's no prior streak to compare against.
 */
export function comebackStatus(
  relapses: Relapse[] = [],
  currentStartedOn: string,
  today = todayISO(),
): Comeback {
  const current = Math.max(0, dayDiff(currentStartedOn, today))
  // Dedupe + sort relapse dates ascending; ignore anything after the current start
  // (defensive — the live run begins at the latest relapse).
  const dates = [...new Set(relapses.map((r) => r.date))]
    .filter((d) => dayDiff(d, currentStartedOn) >= 0)
    .sort()
  if (dates.length === 0) return { isComeback: false, prevStreak: 0, by: 0 }

  // The previous streak is the one that ENDED at the most-recent relapse: the gap
  // between the last two relapses, or from the first relapse to itself (0) when
  // there's only been one reset.
  const last = dates[dates.length - 1]
  const prev = dates.length >= 2 ? dates[dates.length - 2] : last
  const prevStreak = Math.max(0, dayDiff(prev, last))

  const isComeback = prevStreak > 0 && current > prevStreak
  return { isComeback, prevStreak, by: isComeback ? current - prevStreak : 0 }
}

// ── #114 High-risk hour heatmap ──────────────────────────────────────────────

/** One hour bucket of the 24-hour urge clock. */
export interface UrgeHour {
  /** Hour of day, 0–23 (local time of the `at` timestamp). */
  hour: number
  /** How many urges were logged in this hour. */
  count: number
  /** 0–1 share of this hour relative to the busiest hour, for heat shading. */
  heat: number
}

/** The peak (riskiest) hour pulled out of the 24-hour distribution. */
export interface PeakHour {
  hour: number
  count: number
  /** 12-hour label, e.g. "9 PM" or "12 AM". */
  label: string
}

/** Format an hour 0–23 as a 12-hour clock label ("12 AM", "1 PM"…). */
export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12} ${ampm}`
}

/**
 * Bucket urge logs by hour-of-day from their `at` ISO timestamp, returning a
 * full 24-slot array (0…23) so a clock/heatmap can render every hour. Logs
 * without an `at` (older, day-only entries) are skipped. `heat` is each hour's
 * count normalised to the busiest hour (1.0), or 0 when there are no timestamped
 * urges. Pure.
 */
export function urgeHourHistogram(urgeLog: UrgeWin[] = []): UrgeHour[] {
  const counts = new Array<number>(24).fill(0)
  for (const u of urgeLog) {
    if (!u || !u.at) continue
    const d = new Date(u.at)
    if (Number.isNaN(d.getTime())) continue
    counts[d.getHours()]++
  }
  const max = Math.max(0, ...counts)
  return counts.map((count, hour) => ({
    hour,
    count,
    heat: max > 0 ? count / max : 0,
  }))
}

/**
 * The single riskiest hour (highest urge count) from the histogram, or
 * undefined when no timestamped urges exist. Ties resolve to the earliest hour.
 */
export function peakUrgeHour(urgeLog: UrgeWin[] = []): PeakHour | undefined {
  const hist = urgeHourHistogram(urgeLog)
  let best: UrgeHour | undefined
  for (const h of hist) {
    if (h.count > 0 && (!best || h.count > best.count)) best = h
  }
  if (!best) return undefined
  return { hour: best.hour, count: best.count, label: hourLabel(best.hour) }
}

// ── #263 Day-of-week relapse pattern ─────────────────────────────────────────

/** One weekday bucket of the relapse-by-weekday pattern. */
export interface WeekdayRelapse {
  /** Day index, 0=Sun … 6=Sat. */
  day: number
  /** Short label "Sun"…"Sat". */
  label: string
  /** Resets logged on this weekday. */
  count: number
}

/**
 * Count relapses by weekday (Sun…Sat) from their ISO dates, returning a full
 * 7-slot array so a weekday bar chart always renders every day. Duplicate dates
 * are counted once (a day can only be reset once). Pure.
 */
export function relapseWeekdayPattern(relapses: Relapse[] = []): WeekdayRelapse[] {
  const counts = new Array<number>(7).fill(0)
  const seen = new Set<string>()
  for (const r of relapses) {
    if (!r || !r.date || seen.has(r.date)) continue
    seen.add(r.date)
    const d = fromISODay(r.date)
    if (Number.isNaN(d.getTime())) continue
    counts[d.getDay()]++
  }
  return counts.map((count, day) => ({ day, label: WEEKDAYS[day], count }))
}

/** The riskiest weekday (most resets), or undefined when there are no resets. */
export function peakRelapseWeekday(relapses: Relapse[] = []): WeekdayRelapse | undefined {
  let best: WeekdayRelapse | undefined
  for (const w of relapseWeekdayPattern(relapses)) {
    if (w.count > 0 && (!best || w.count > best.count)) best = w
  }
  return best
}

// ── #76 Urge-to-relapse conversion rate ──────────────────────────────────────

/** Self-efficacy metric: how often urges were resisted vs. ended in a reset. */
export interface UrgeConversion {
  /** Urges logged as resisted wins. */
  resisted: number
  /** Resets logged (relapses). */
  relapses: number
  /** resisted + relapses — the total "urge events" we have evidence for. */
  total: number
  /** 0–100: percent of urge events that were resisted (self-efficacy). 100 when
   *  there are resisted wins and no resets; 0 when there's no data at all. */
  resistRate: number
}

/**
 * Urge-to-relapse conversion: of all logged urge events (resisted wins + resets),
 * what share were resisted. A high rate is a self-efficacy signal. `resisted`
 * combines the dated urge log with any pre-dated `urgesResisted` tally so the
 * metric reflects total wins. Pure; returns resistRate 0 when there's no data.
 */
export function urgeConversion(
  urgeLog: UrgeWin[] = [],
  relapses: Relapse[] = [],
  priorResisted = 0,
): UrgeConversion {
  const resisted = (urgeLog?.length ?? 0) + Math.max(0, priorResisted)
  const relapseCount = relapses?.length ?? 0
  const total = resisted + relapseCount
  const resistRate = total > 0 ? Math.round((resisted / total) * 100) : 0
  return { resisted, relapses: relapseCount, total, resistRate }
}

// ── #298 Pace-to-record projection ───────────────────────────────────────────

/** Projection of when the current run will match / break the personal best. */
export interface RecordPace {
  /** True once the current run already equals or beats the best (already there). */
  alreadyRecord: boolean
  /** Whole days still needed to MATCH the best (0 when already at/over it). */
  daysToMatch: number
  /** ISO day the current run equals the best, undefined when already a record. */
  matchDate?: string
  /** ISO day the current run beats the best by 1 (a new record), undefined when
   *  already a record. */
  beatDate?: string
}

/**
 * Project the calendar dates the live streak will match and then beat the
 * personal best, assuming it stays unbroken. `current` and `best` come straight
 * from streakStats (best already includes the live run, so current===best means
 * the run IS the record). Pure; dates are computed off `today`.
 */
export function paceToRecord(
  current: number,
  best: number,
  today = todayISO(),
): RecordPace {
  const cur = Math.max(0, current)
  const bst = Math.max(0, best)
  if (cur >= bst) return { alreadyRecord: true, daysToMatch: 0 }
  const daysToMatch = bst - cur
  return {
    alreadyRecord: false,
    daysToMatch,
    matchDate: addDays(today, daysToMatch),
    beatDate: addDays(today, daysToMatch + 1),
  }
}

// ── #348 Urge frequency trend (weekly sparkline) ─────────────────────────────

/** One weekly bucket of the urge-frequency trend. */
export interface UrgeWeek {
  /** ISO day of the week's start (Monday-anchored 7-day bucket). */
  weekStart: string
  /** Urges logged in that 7-day window. */
  count: number
}

/** Direction + magnitude of the urge-frequency trend over the tracked weeks. */
export interface UrgeTrend {
  /** Per-week counts, oldest → newest (length === weeks asked for). */
  weeks: UrgeWeek[]
  /** Total urges across the window. */
  total: number
  /** Average urges/week over the window, rounded to one decimal. */
  avgPerWeek: number
  /** Signed change: (last week) − (first week). Negative = cravings easing. */
  delta: number
  /** 'down' | 'up' | 'flat' — overall direction (first half vs. second half). */
  direction: 'down' | 'up' | 'flat'
}

/**
 * Bucket the urge log into the last `weeks` consecutive 7-day windows ending at
 * `today`, oldest first, so a sparkline can show whether cravings are easing.
 * Each urge is placed by its `at` timestamp (falling back to its `date`). Logs
 * outside the window are ignored. `direction` compares the first half of the
 * window's average to the second half (a small flat band avoids noise). Pure.
 */
export function urgeFrequencyTrend(
  urgeLog: UrgeWin[] = [],
  weeks = 8,
  today = todayISO(),
): UrgeTrend {
  const n = Math.max(1, Math.floor(weeks))
  // Window day range: [start, today]. Bucket i covers days [i*7, i*7+6] from start.
  const windowStart = addDays(today, -(n * 7 - 1))
  const buckets = new Array<number>(n).fill(0)
  for (const u of urgeLog) {
    if (!u) continue
    const day = (u.at ? u.at.slice(0, 10) : u.date) || ''
    if (!day) continue
    const offset = dayDiff(windowStart, day)
    if (offset < 0 || offset >= n * 7) continue
    buckets[Math.floor(offset / 7)]++
  }
  const result: UrgeWeek[] = buckets.map((count, i) => ({
    weekStart: addDays(windowStart, i * 7),
    count,
  }))
  const total = buckets.reduce((s, c) => s + c, 0)
  const avgPerWeek = Math.round((total / n) * 10) / 10
  const delta = buckets[n - 1] - buckets[0]
  // Direction from half-window averages so a single spike doesn't flip it.
  const mid = Math.floor(n / 2)
  const firstHalf = buckets.slice(0, mid)
  const secondHalf = buckets.slice(mid)
  const avg = (a: number[]) => (a.length ? a.reduce((s, c) => s + c, 0) / a.length : 0)
  const diff = avg(secondHalf) - avg(firstHalf)
  const direction: UrgeTrend['direction'] = diff < -0.25 ? 'down' : diff > 0.25 ? 'up' : 'flat'
  return { weeks: result, total, avgPerWeek, delta, direction }
}

// ── #334 Streak-saved counter ────────────────────────────────────────────────

/** Resisted urges reframed as streaks protected from a possible reset. */
export interface StreaksSaved {
  /** Total resisted urges (dated log + any pre-dated tally). */
  saved: number
  /** Resisted urges logged today (a daily "wins kept" count). */
  savedToday: number
}

/**
 * Streak-saved counter (#334): every resisted urge is a moment that could have
 * become a reset, so the count of resisted urges = streaks you might have lost.
 * Folds the dated urge log together with the legacy `urgesResisted` tally. Pure.
 */
export function streaksSaved(
  urgeLog: UrgeWin[] = [],
  priorResisted = 0,
  today = todayISO(),
): StreaksSaved {
  const log = urgeLog ?? []
  const saved = log.length + Math.max(0, priorResisted)
  const savedToday = log.filter((u) => {
    if (!u) return false
    const day = (u.at ? u.at.slice(0, 10) : u.date) || ''
    return day === today
  }).length
  return { saved, savedToday }
}

// ── #74 Urge-intensity distribution ──────────────────────────────────────────

/** Aggregated stats over the self-rated urge intensities (1–5). */
export interface IntensityStats {
  /** Count of rated urges at each level, index 0 = level 1 … index 4 = level 5. */
  buckets: number[]
  /** How many urges carried an intensity rating. */
  rated: number
  /** Mean intensity over rated urges, one decimal (0 when none rated). */
  avg: number
  /** Most-common intensity level 1–5 (the mode), or undefined when none rated.
   *  Ties resolve to the higher level (the scarier reading). */
  mode?: number
  /** Signed change in average intensity: (recent half) − (earlier half) of the
   *  rated urges in log order. Negative = urges are getting weaker over time. */
  trend: number
}

/**
 * Summarise the intensity field across the urge log (#74). Urges without an
 * `intensity` are ignored. `trend` splits the rated urges in chronological log
 * order into earlier/recent halves and reports the change in mean intensity, so
 * a negative trend is evidence cravings are weakening. Pure.
 */
export function intensityStats(urgeLog: UrgeWin[] = []): IntensityStats {
  const buckets = new Array<number>(5).fill(0)
  const rated: number[] = []
  for (const u of urgeLog) {
    if (!u || !u.intensity) continue
    const lvl = u.intensity
    if (lvl < 1 || lvl > 5) continue
    buckets[lvl - 1]++
    rated.push(lvl)
  }
  const count = rated.length
  if (count === 0) return { buckets, rated: 0, avg: 0, mode: undefined, trend: 0 }
  const sum = rated.reduce((s, v) => s + v, 0)
  const avg = Math.round((sum / count) * 10) / 10
  // Mode: highest count, ties → higher level.
  let mode = 1
  for (let i = 0; i < 5; i++) if (buckets[i] >= buckets[mode - 1]) mode = i + 1
  // Trend: mean of the earlier half vs. the recent half (in log order).
  const mid = Math.floor(count / 2)
  const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
  const trend = count >= 2
    ? Math.round((mean(rated.slice(mid)) - mean(rated.slice(0, mid))) * 10) / 10
    : 0
  return { buckets, rated: count, avg, mode, trend }
}

// ── #322 Relapse-free week / month rollup ────────────────────────────────────

/** Counts of fully clean calendar weeks and months across the journey. */
export interface CleanRollup {
  /** Fully reset-free ISO weeks (Mon-anchored) since tracking began. */
  cleanWeeks: number
  /** Fully reset-free calendar months since tracking began. */
  cleanMonths: number
  /** Total whole weeks spanned by the journey (denominator for cleanWeeks). */
  totalWeeks: number
  /** Total whole months spanned by the journey (denominator for cleanMonths). */
  totalMonths: number
}

/** Monday-anchored ISO week key "YYYY-MM-DD" of the week containing `iso`. */
function weekAnchor(iso: string): string {
  const d = fromISODay(iso)
  const dow = d.getDay() // 0=Sun
  const back = (dow + 6) % 7 // days since Monday
  return addDays(iso, -back)
}

/**
 * Relapse-free rollup (#322): count fully clean weeks and months across the
 * span from the first activity (earliest of `startedOn` / first relapse) to
 * `today`. A week/month is "clean" only if it lies within the tracked span and
 * has zero resets in it. Pure; duplicate relapse dates collapse to one.
 */
export function cleanRollup(
  relapses: Relapse[] = [],
  startedOn: string,
  today = todayISO(),
): CleanRollup {
  const resetDates = [...new Set((relapses ?? []).map((r) => r?.date).filter(Boolean) as string[])]
  // Journey starts at the earliest known activity so weeks before startedOn that
  // contained a relapse (and the streak's own start) are all in scope.
  const earliest = resetDates.reduce((min, d) => (d < min ? d : min), startedOn)
  if (dayDiff(earliest, today) < 0) {
    return { cleanWeeks: 0, cleanMonths: 0, totalWeeks: 0, totalMonths: 0 }
  }
  // Weeks dirtied by a reset.
  const dirtyWeeks = new Set(resetDates.map(weekAnchor))
  const dirtyMonths = new Set(resetDates.map((d) => d.slice(0, 7)))

  // Enumerate every week anchor in [earliest, today].
  const weekSet = new Set<string>()
  let w = weekAnchor(earliest)
  const lastWeek = weekAnchor(today)
  while (w <= lastWeek) {
    weekSet.add(w)
    w = addDays(w, 7)
  }
  const monthSet = new Set<string>()
  const [ey, em] = earliest.slice(0, 7).split('-').map(Number)
  const tKey = today.slice(0, 7)
  let my = ey, mm = em
  while (true) {
    const key = `${my}-${String(mm).padStart(2, '0')}`
    monthSet.add(key)
    if (key === tKey) break
    mm++
    if (mm > 12) { mm = 1; my++ }
  }

  const totalWeeks = weekSet.size
  const totalMonths = monthSet.size
  let cleanWeeks = 0
  for (const wk of weekSet) if (!dirtyWeeks.has(wk)) cleanWeeks++
  let cleanMonths = 0
  for (const mo of monthSet) if (!dirtyMonths.has(mo)) cleanMonths++
  return { cleanWeeks, cleanMonths, totalWeeks, totalMonths }
}
