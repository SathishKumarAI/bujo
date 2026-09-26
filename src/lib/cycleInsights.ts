import type { CyclePoint } from './types'
import { addDays, dayDiff } from './date'

/**
 * Derivations over the neutral cycle log (`data.cycle`): where each period
 * episode starts, which cycle day today is, the personal average cycle
 * length, and a *labelled estimate* of the current phase.
 *
 * All of it is arithmetic over what the user logged — no prediction model,
 * and every consumer must present phase and next-period values as estimates.
 * Functions return `null` when the log cannot answer, never a fake zero
 * (the `count ? sum / count : 0` trap in CLAUDE.md: "no data" must be
 * distinguishable from a real value).
 */

/** Dates where a `period` flag starts a run — flagged, previous day not. */
export function periodStarts(entries: CyclePoint[]): string[] {
  const flagged = new Set(entries.filter((e) => e.flags.includes('period')).map((e) => e.date))
  return [...flagged].filter((d) => !flagged.has(addDays(d, -1))).sort()
}

/** 1-based day of the current cycle, from the latest start on or before today. */
export function cycleDay(entries: CyclePoint[], today: string): number | null {
  const starts = periodStarts(entries).filter((d) => d <= today)
  if (starts.length === 0) return null
  return dayDiff(starts[starts.length - 1], today) + 1
}

/**
 * Personal average cycle length over the last few gaps (≤6, so an old
 * irregular year does not outvote the recent pattern). Needs two starts.
 * Gaps outside 15–60 days are skipped as logging artifacts, not cycles.
 */
export function avgCycleLength(entries: CyclePoint[]): number | null {
  const starts = periodStarts(entries)
  const gaps: number[] = []
  for (let i = 1; i < starts.length; i++) {
    const g = dayDiff(starts[i - 1], starts[i])
    if (g >= 15 && g <= 60) gaps.push(g)
  }
  const recent = gaps.slice(-6)
  if (recent.length === 0) return null
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
}

/** Estimated start of the next period: latest start + the personal average. */
export function nextPeriodEstimate(entries: CyclePoint[], today: string): string | null {
  const starts = periodStarts(entries).filter((d) => d <= today)
  const len = avgCycleLength(entries)
  if (starts.length === 0 || len == null) return null
  return addDays(starts[starts.length - 1], len)
}

export interface PhaseEstimate {
  id: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  label: string
  /** Palette token, matching the flag hues on the Cycle page. */
  color: string
}

/**
 * Textbook phase for a cycle day, scaled to the personal length when known
 * (28 otherwise). Ovulation is placed ~14 days *before* the next period —
 * the luteal phase is the stable half — with a 3-day window around it.
 * An estimate for orientation, never a fertility claim; the page says so.
 */
export function phaseOf(day: number, length: number | null): PhaseEstimate {
  const len = length ?? 28
  const ovulation = len - 14
  if (day <= 5) return { id: 'menstrual', label: 'Menstrual', color: 'red' }
  if (day >= ovulation - 1 && day <= ovulation + 1) return { id: 'ovulation', label: 'Ovulation window', color: 'green' }
  if (day < ovulation) return { id: 'follicular', label: 'Follicular', color: 'teal' }
  return { id: 'luteal', label: 'Luteal', color: 'mauve' }
}

// ── Derivations the page's visualisations read ───────────────────────────────
//
// Everything below is arithmetic over the log, and everything returns `null`
// or an empty array when the log cannot answer. There is no model here and
// there must not be one: a number this file invents becomes a fertility claim
// the moment it renders beside the word "ovulation".

/** One completed or in-progress cycle, newest last. */
export interface CycleSpan {
  /** ISO day the period started — the cycle's day 1. */
  start: string
  /** Days to the next start, or to `today` for the cycle still running. */
  length: number
  /** Consecutive flagged days from the start. */
  periodDays: number
  /** True for the cycle that has not ended yet; its length is a floor. */
  current: boolean
}

/**
 * Every cycle the log can delimit, oldest first.
 *
 * The last entry is the one in progress, and its `length` is "so far" rather
 * than a measurement — which is why it carries `current` instead of being
 * silently mixed into the history. A bar chart that draws a 12-day in-progress
 * cycle beside four finished ones reads as a cycle that collapsed.
 */
export function cycleHistory(entries: CyclePoint[], today: string): CycleSpan[] {
  const starts = periodStarts(entries).filter((d) => d <= today)
  const flagged = new Set(entries.filter((e) => e.flags.includes('period')).map((e) => e.date))
  return starts.map((start, i) => {
    const next = starts[i + 1]
    let periodDays = 0
    while (flagged.has(addDays(start, periodDays))) periodDays++
    return {
      start,
      length: dayDiff(start, next ?? today) + (next ? 0 : 1),
      periodDays,
      current: !next,
    }
  })
}

/** Days from `today` to the estimated next period. Negative means overdue. */
export function daysUntilNextPeriod(entries: CyclePoint[], today: string): number | null {
  const next = nextPeriodEstimate(entries, today)
  return next == null ? null : dayDiff(today, next)
}

/** A phase and the 1-based cycle days it covers, for a timeline or a wheel. */
export interface PhaseBand extends PhaseEstimate {
  from: number
  to: number
}

/**
 * The four phases as contiguous day ranges for a cycle of `length`.
 *
 * Derived by asking `phaseOf` for every day rather than by re-deriving the
 * boundaries — the ovulation window is placed relative to the *next* period
 * and getting that arithmetic twice, in two files, is how the timeline and the
 * "you are here" pill come to disagree by a day.
 */
export function phaseBands(length: number | null): PhaseBand[] {
  const len = length ?? 28
  const bands: PhaseBand[] = []
  for (let day = 1; day <= len; day++) {
    const p = phaseOf(day, len)
    const last = bands[bands.length - 1]
    if (last && last.id === p.id) last.to = day
    else bands.push({ ...p, from: day, to: day })
  }
  return bands
}

/**
 * How often each flag lands on each cycle day, across every completed cycle.
 *
 * This is the one thing a cycle log can tell you that a calendar cannot: not
 * "when is my period" but "cramps show up on day 27, every time". Only
 * completed cycles count — the one in progress has no days past today to
 * report, and including it would make every late-cycle flag look rarer than
 * it is.
 *
 * Returns `[]` when fewer than two cycles are logged, because one cycle is an
 * anecdote and a chart of it invites reading a pattern that is not there.
 */
export function flagPatternByDay(
  entries: CyclePoint[],
  today: string,
): { flag: string; cycles: number; days: { day: number; count: number }[] }[] {
  const history = cycleHistory(entries, today).filter((c) => !c.current)
  if (history.length < 2) return []
  const byDate = new Map(entries.map((e) => [e.date, e.flags]))
  const maxLen = Math.max(...history.map((c) => c.length))
  const tally = new Map<string, number[]>()
  for (const c of history) {
    for (let d = 0; d < c.length; d++) {
      for (const f of byDate.get(addDays(c.start, d)) ?? []) {
        const row = tally.get(f) ?? Array(maxLen).fill(0)
        row[d]++
        tally.set(f, row)
      }
    }
  }
  return [...tally.entries()]
    .map(([flag, row]) => ({
      flag,
      cycles: history.length,
      days: row.map((count, i) => ({ day: i + 1, count })),
    }))
    .sort((a, b) => {
      const sum = (x: typeof a) => x.days.reduce((s, d) => s + d.count, 0)
      return sum(b) - sum(a)
    })
}

/**
 * The follicular-phase **coverline**: the highest of the six temperatures
 * before the first sustained rise, which is what a thermal shift is read
 * against in fertility-awareness charting.
 *
 * Deliberately conservative — it needs six pre-shift readings and three
 * consecutive readings above them — and it is a *retrospective* mark, never a
 * prediction. It says "the rise already happened", which is the only thing a
 * temperature chart can honestly say. `null` when the cycle cannot support it.
 */
export function coverline(temps: { day: number; temp?: number }[]): number | null {
  const read = temps.filter((t) => t.temp != null) as { day: number; temp: number }[]
  if (read.length < 9) return null
  for (let i = 6; i <= read.length - 3; i++) {
    const before = read.slice(i - 6, i).map((t) => t.temp)
    const high = Math.max(...before)
    const after = read.slice(i, i + 3)
    if (after.every((t) => t.temp > high)) return Math.round(high * 100) / 100
  }
  return null
}
