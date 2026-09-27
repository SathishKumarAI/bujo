import type { DevSession, JournalData } from './types'
import { addDays, dayDiff, prettyDay, todayISO } from './date'
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

/**
 * Total deep-work minutes per **rolling 7-day week**, oldest→newest.
 *
 * `dailyCodingMinutes` answers "what did I do this fortnight"; nothing on the
 * page answered "am I doing more or less deep work than a month ago", which is
 * the only question a fourteen-bar chart structurally cannot. Rolling rather
 * than calendar weeks so the newest bucket always ends today — a Monday-aligned
 * chart spends its rightmost bar on a part-week and reads as a collapse.
 *
 * `min` is a real measurement and 0 is a real answer here (a week you did
 * nothing is a fact, not a gap), so this one does NOT return null per bucket.
 */
export function weeklyVolume(
  data: JournalData,
  today = todayISO(),
  weeks = 12,
): { start: string; end: string; label: string; min: number }[] {
  return Array.from({ length: weeks }, (_, i) => {
    const back = weeks - 1 - i
    const end = addDays(today, -back * 7)
    const start = addDays(end, -6)
    const min = sessions(data)
      .filter((s) => s.date >= start && s.date <= end)
      .reduce((a, s) => a + (s.durationMin || 0), 0)
    return { start, end, label: start.slice(5), min }
  })
}

/**
 * The five session-length bands, and the focus each one tends to deliver.
 *
 * The page carries a Pomodoro timer offering 15/25/50-minute blocks and had
 * nothing to say about which of them actually works for the person using it.
 * This is that answer, from their own log.
 *
 * A **plain** mean, not the duration-weighted one `avgWeighted` uses: the band
 * already controls for length, so weighting inside it would just re-assert that
 * the longer sessions in the band count more, which is the variable being held
 * still. `avg` is `null` — never 0 — for a band nobody has worked in.
 */
export function focusByDuration(
  data: JournalData,
): { label: string; from: number; to: number | null; avg: number | null; count: number; minutes: number }[] {
  const bands: { label: string; from: number; to: number | null }[] = [
    { label: 'under 30m', from: 0, to: 30 },
    { label: '30–60m', from: 30, to: 60 },
    { label: '60–90m', from: 60, to: 90 },
    { label: '90–120m', from: 90, to: 120 },
    { label: '2h+', from: 120, to: null },
  ]
  return bands.map((b) => {
    const inBand = sessions(data).filter((s) => {
      const d = s.durationMin || 0
      return d >= b.from && (b.to == null || d < b.to)
    })
    return {
      ...b,
      count: inBand.length,
      minutes: inBand.reduce((a, s) => a + (s.durationMin || 0), 0),
      avg: inBand.length
        ? Math.round((inBand.reduce((a, s) => a + s.focus, 0) / inBand.length) * 10) / 10
        : null,
    }
  })
}

/**
 * Minutes **and** focus quality per tag, highest minutes first.
 *
 * `topTags` answers where the hours went; this adds whether they were any good,
 * which is the reading that changes what you do next — three hours of meetings
 * tagged `work` at 4.2 and one hour of `rust` at 9 is the same log telling two
 * different stories.
 *
 * Duration-weighted here (unlike `focusByDuration`), because a tag mixes lengths
 * and a 20-minute session should not outvote a three-hour one. Same sort order
 * as `topTags` so the two read as one table.
 */
export function qualityByTag(
  data: JournalData,
  limit = 6,
): { tag: string; min: number; avg: number | null; count: number }[] {
  const rows = new Map<string, { min: number; wsum: number; count: number }>()
  for (const s of sessions(data)) {
    for (const t of s.tags ?? []) {
      const r = rows.get(t) ?? { min: 0, wsum: 0, count: 0 }
      const m = s.durationMin || 0
      rows.set(t, { min: r.min + m, wsum: r.wsum + s.focus * m, count: r.count + 1 })
    }
  }
  return [...rows.entries()]
    .map(([tag, r]) => ({
      tag,
      min: r.min,
      count: r.count,
      // `r.min ? … : null` and not `: 0` — a tag logged only on zero-minute
      // sessions has no weighted average, and 0/10 would read as "terrible
      // work" rather than "nothing to divide by".
      avg: r.min ? Math.round((r.wsum / r.min) * 10) / 10 : null,
    }))
    .sort((a, b) => b.min - a.min)
    .slice(0, limit)
}

/**
 * What an interruption costs, in focus points.
 *
 * Mean focus across sessions that logged **zero** interruptions against those
 * that logged one or more. `interruptionsTrend` already plots how often they
 * happen; this is the only thing on the page that says whether they matter.
 *
 * `null` unless both sides hold at least two sessions — a gap computed from one
 * session against one session is noise wearing a decimal point, and printing it
 * as a finding is worse than printing nothing.
 */
export function interruptionCost(
  data: JournalData,
): { clean: number; noisy: number; gap: number; cleanCount: number; noisyCount: number } | null {
  const logged = sessions(data).filter((s) => s.interruptions != null)
  const clean = logged.filter((s) => (s.interruptions ?? 0) === 0)
  const noisy = logged.filter((s) => (s.interruptions ?? 0) > 0)
  if (clean.length < 2 || noisy.length < 2) return null
  const mean = (ss: DevSession[]) => ss.reduce((a, s) => a + s.focus, 0) / ss.length
  const c = Math.round(mean(clean) * 10) / 10
  const n = Math.round(mean(noisy) * 10) / 10
  return { clean: c, noisy: n, gap: Math.round((c - n) * 10) / 10, cleanCount: clean.length, noisyCount: noisy.length }
}

/**
 * Everything the log can say in a sentence, strongest claim first.
 *
 * The page used to carry exactly two of these ("longest session", the
 * focus↔stress line) in a band titled *Worth knowing*, and both were computed
 * one line apart in the view. Collected here so a finding is a tested function
 * rather than a conditional in JSX, and so the page can render "nothing yet"
 * once instead of five times.
 *
 * Every entry is derived from a helper that returns `null` when it cannot
 * answer, and an entry that cannot be made is **absent** rather than hedged —
 * a findings list padded with "not enough data to say" is a list nobody reads.
 */
export function focusFindings(data: JournalData, today = todayISO()): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = []

  const stress = focusInsight(data)
  if (stress) out.push({ id: 'stress', text: stress })

  const cost = interruptionCost(data)
  if (cost && Math.abs(cost.gap) >= 0.5) {
    out.push({
      id: 'interruptions',
      text: cost.gap > 0
        ? `Uninterrupted sessions score ${cost.gap} higher on focus (${cost.clean} vs ${cost.noisy}/10). Protecting the block is worth more than lengthening it.`
        : `Interrupted sessions score ${Math.abs(cost.gap)} higher on focus (${cost.noisy} vs ${cost.clean}/10) — the interruption count is not what is limiting you.`,
    })
  }

  const bands = focusByDuration(data).filter((b) => b.count >= 2 && b.avg != null)
  if (bands.length >= 2) {
    const best = bands.reduce((a, b) => (b.avg! > a.avg! ? b : a))
    out.push({
      id: 'duration',
      text: `Your best focus comes in ${best.label} blocks — ${best.avg}/10 across ${best.count} sessions.`,
    })
  }

  const wd = focusByWeekday(data).filter((w) => w.count >= 2)
  if (wd.length >= 3) {
    const best = wd.reduce((a, b) => (b.avg > a.avg ? b : a))
    const worst = wd.reduce((a, b) => (b.avg < a.avg ? b : a))
    if (best.label !== worst.label && best.avg - worst.avg >= 1) {
      out.push({
        id: 'weekday',
        text: `${best.label} is your deepest day (${best.avg}/10) and ${worst.label} your shallowest (${worst.avg}/10).`,
      })
    }
  }

  const tags = qualityByTag(data, 8).filter((t) => t.count >= 2 && t.avg != null)
  if (tags.length >= 2) {
    const best = tags.reduce((a, b) => (b.avg! > a.avg! ? b : a))
    const most = tags[0]
    if (best.tag !== most.tag) {
      out.push({
        id: 'tagquality',
        text: `Most of your hours go to ${most.tag}, but ${best.tag} is where the work is deepest (${best.avg}/10 against ${most.avg}).`,
      })
    }
  }

  // Volume, last rolling week against the four before it. Needs a real
  // baseline: comparing this week to a single previous week is a coin toss.
  const vol = weeklyVolume(data, today, 5)
  const recent = vol[vol.length - 1].min
  const prior = vol.slice(0, -1).filter((w) => w.min > 0)
  if (recent > 0 && prior.length >= 2) {
    const base = prior.reduce((a, w) => a + w.min, 0) / prior.length
    const pct = Math.round(((recent - base) / base) * 100)
    if (Math.abs(pct) >= 15) {
      out.push({
        id: 'volume',
        text: `This week is ${Math.abs(pct)}% ${pct > 0 ? 'above' : 'below'} your recent average of ${formatMinutes(Math.round(base))} a week.`,
      })
    }
  }

  const longest = longestSession(data)
  if (longest) {
    out.push({
      id: 'longest',
      text: `Longest session · ${formatMinutes(longest.durationMin)}${longest.project ? ` on ${longest.project}` : ''} · ${prettyDay(longest.date)}`,
    })
  }

  return out
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

/**
 * Minutes as "1h 30m" / "45m".
 *
 * Lived three times in `views/Focus.tsx` — twice as `hrs`, once as `hrsLabel`,
 * all three identical. One definition, so a change to the format is a change
 * everywhere it is read.
 */
export function formatMinutes(min: number): string {
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`
}
