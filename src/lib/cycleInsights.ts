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
