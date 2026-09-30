/**
 * CYCLE PATTERNS · what tends to happen to you, and on which day.
 *
 * This is the one question a cycle log answers that a calendar cannot. Not
 * "when is my period" — a calendar does that — but *"my mood drops around day
 * 24, every time"*. Everything here folds many cycles onto one axis so that
 * shape becomes visible.
 *
 * ## Three rules that shape the whole file
 *
 * **Three cycles minimum, always.** One cycle is an anecdote and two is a
 * coincidence; a grid drawn from either invites reading a pattern that is not
 * there, which is worse than showing nothing. Every function here returns an
 * empty result rather than a thin one, and the UI says so in words.
 *
 * **Absent is not zero.** A day with no mood logged did not score zero — it was
 * not asked. Averages divide by the days that *carry* a value and return `null`
 * for a day with none, which is the `count ? sum / count : 0` trap this repo
 * has now shipped three times.
 *
 * **Aligning by ovulation is a different question, not a nicer view.** Period
 * start is when the cycle begins; ovulation is when the luteal phase begins, and
 * the luteal phase is the stable half. A symptom that lands 3 days before the
 * period lands on cycle day 25 in a 28-day cycle and day 32 in a 35-day one — so
 * aligned by period start it smears across a week and looks like nothing, and
 * aligned by ovulation it stacks into a column. That is why the toggle exists.
 */
import type { CyclePoint } from './types'
import { dayDiff } from './date'

export const MIN_CYCLES = 3

export type Align = 'period' | 'ovulation'

/** One cycle, already located, with the ovulation day if one was detected. */
export interface AlignedCycle {
  start: string
  /** Exclusive end — the next period start, or the day after the last entry. */
  end: string
  /** ISO date of detected ovulation, when the chart found one. */
  ovulation?: string | null
}

export interface PatternCell {
  /** Column index: cycle day when aligned by period; days from ovulation otherwise. */
  offset: number
  /** How many cycles recorded this signal at this offset. */
  count: number
  /** How many cycles had ANY entry at this offset — the honest denominator. */
  observed: number
  /** Mean level for scale signals (mood/energy/drive), null when nothing scored. */
  mean: number | null
}

export interface PatternRow {
  key: string
  label: string
  kind: 'tag' | 'scale' | 'flag'
  cells: PatternCell[]
}

export interface PatternGrid {
  rows: PatternRow[]
  /** Column offsets in order, so the header and the cells cannot disagree. */
  offsets: number[]
  cycles: number
  align: Align
}

/** Every signal the grid can show, in the order it shows them. */
const SCALE_SIGNALS = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'drive', label: 'Drive' },
] as const

const FLAG_SIGNALS = ['cramps', 'pms', 'spotting'] as const

/**
 * Fold the log onto one axis.
 *
 * `observed` is the part worth reading twice. A cell's darkness is
 * `count / observed`, not `count / cycles` — if only two of five cycles have any
 * entry at all on day 33, a symptom logged in both is *always*, not 40%. Using
 * the cycle count as the denominator makes late-cycle rows fade out purely
 * because long cycles are rarer, which is an artefact that looks exactly like a
 * finding.
 */
export function patternGrid(
  entries: CyclePoint[],
  cycles: AlignedCycle[],
  align: Align = 'period',
): PatternGrid {
  const usable = align === 'ovulation' ? cycles.filter((c) => c.ovulation) : cycles
  if (usable.length < MIN_CYCLES) {
    return { rows: [], offsets: [], cycles: usable.length, align }
  }

  const byDate = new Map(entries.map((e) => [e.date, e]))

  // Collect (offset -> entries) per cycle, so every signal reads the same folding.
  const columns = new Map<number, CyclePoint[]>()
  for (const c of usable) {
    const anchor = align === 'ovulation' ? c.ovulation! : c.start
    for (let d = c.start; d < c.end; d = nextDay(d)) {
      const e = byDate.get(d)
      if (!e) continue
      const offset = align === 'ovulation' ? dayDiff(anchor, d) : dayDiff(c.start, d) + 1
      const list = columns.get(offset) ?? []
      list.push(e)
      columns.set(offset, list)
    }
  }

  const offsets = [...columns.keys()].sort((a, b) => a - b)
  if (offsets.length === 0) return { rows: [], offsets: [], cycles: usable.length, align }

  const tagKeys = ['symptoms', 'cravings', 'moodTags'] as const
  const tagLabels = new Map<string, string>()
  for (const list of columns.values()) {
    for (const e of list) {
      for (const k of tagKeys) for (const t of e[k] ?? []) tagLabels.set(`${k}:${t}`, t)
    }
  }

  const rows: PatternRow[] = []

  for (const [key, label] of [...tagLabels.entries()].sort((a, b) => a[1].localeCompare(b[1]))) {
    const [field, tag] = key.split(':')
    rows.push({
      key,
      label,
      kind: 'tag',
      cells: offsets.map((offset) => {
        const list = columns.get(offset) ?? []
        const count = list.filter((e) => (e[field as 'symptoms'] ?? []).includes(tag)).length
        return { offset, count, observed: list.length, mean: null }
      }),
    })
  }

  for (const s of SCALE_SIGNALS) {
    rows.push({
      key: s.key,
      label: s.label,
      kind: 'scale',
      cells: offsets.map((offset) => {
        const list = columns.get(offset) ?? []
        const vals = list.map((e) => e[s.key]).filter((v): v is number => v != null)
        return {
          offset,
          count: vals.length,
          observed: list.length,
          // `null`, not 0. A day nobody rated is not a day rated zero.
          mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
        }
      }),
    })
  }

  for (const flag of FLAG_SIGNALS) {
    rows.push({
      key: `flag:${flag}`,
      label: flag,
      kind: 'flag',
      cells: offsets.map((offset) => {
        const list = columns.get(offset) ?? []
        return { offset, count: list.filter((e) => e.flags.includes(flag)).length, observed: list.length, mean: null }
      }),
    })
  }

  // Drop rows that never fired: an all-empty row is a row that says nothing and
  // costs a line of vertical space on a phone.
  return {
    rows: rows.filter((r) => r.cells.some((c) => c.count > 0)),
    offsets,
    cycles: usable.length,
    align,
  }
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * QUARTILE BUCKETS · the shared intensity scale.
 *
 * The brief asked to import "the existing quartile-bucket helper". There isn't
 * one — `SymptomPattern` used a linear ramp floored at 0.25 and nothing else in
 * the app bucketed at all. So it is written here, once, and both grids use it.
 *
 * Quartiles of the NON-ZERO values, not of the full range: most cells in a
 * pattern grid are zero, so quartiles over everything put the boundaries inside
 * the zeros and render every real value in the top bucket. Ranking only what
 * actually happened is what makes a rare event visible next to a common one.
 */
export function quartileBuckets(values: number[]): (v: number) => 0 | 1 | 2 | 3 | 4 {
  const nonZero = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (nonZero.length === 0) return () => 0
  const at = (q: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(q * nonZero.length))]
  const q1 = at(0.25)
  const q2 = at(0.5)
  const q3 = at(0.75)
  return (v: number) => {
    if (v <= 0) return 0
    if (v <= q1) return 1
    if (v <= q2) return 2
    if (v <= q3) return 3
    return 4
  }
}

export interface Insight {
  text: string
  /** The signal it describes, so the UI can put it beside the right row. */
  key: string
}

/**
 * Up to three plain-language sentences, and only ones the data supports.
 *
 * The bar is deliberately high: a signal must appear in at least 60% of the
 * cycles that observed its peak day, and there must be at least `MIN_CYCLES`.
 * An insight is the most quotable thing on the page — someone will repeat it to
 * a clinician — so a sentence generated from two coincidences is the worst
 * output this feature could produce.
 */
export function insights(grid: PatternGrid, avgCycleLength: number | null): Insight[] {
  if (grid.cycles < MIN_CYCLES) return []
  const out: Insight[] = []

  for (const row of grid.rows) {
    if (row.kind === 'scale') continue
    const peak = row.cells.reduce<PatternCell | null>(
      (best, c) => (c.observed > 0 && (!best || c.count / c.observed > best.count / best.observed) ? c : best),
      null,
    )
    if (!peak || peak.observed < MIN_CYCLES) continue
    const share = peak.count / peak.observed
    if (share < 0.6) continue

    if (grid.align === 'ovulation') {
      const rel = peak.offset
      out.push({
        key: row.key,
        text: rel === 0
          ? `${cap(row.label)} usually lands on the day you ovulate.`
          : `${cap(row.label)} usually shows up ${Math.abs(rel)} day${Math.abs(rel) === 1 ? '' : 's'} ${rel > 0 ? 'after' : 'before'} you ovulate.`,
      })
    } else {
      const beforePeriod = avgCycleLength != null ? avgCycleLength - peak.offset : null
      out.push({
        key: row.key,
        text: beforePeriod != null && beforePeriod >= 0 && beforePeriod <= 14
          ? `${cap(row.label)} usually starts around day ${peak.offset} — about ${beforePeriod} day${beforePeriod === 1 ? '' : 's'} before your period.`
          : `${cap(row.label)} usually shows up around day ${peak.offset} of your cycle.`,
      })
    }
    if (out.length === 3) break
  }

  return out
}

/**
 * Sentence-case a signal name, without mangling the ones that are acronyms.
 * A naive `charAt(0).toUpperCase()` rendered "Pms usually starts…", which reads
 * as a typo in the most quotable sentence on the page.
 */
const ACRONYMS: Record<string, string> = { pms: 'PMS', lh: 'LH' }

function cap(s: string): string {
  return ACRONYMS[s.toLowerCase()] ?? s.charAt(0).toUpperCase() + s.slice(1)
}

export interface PhaseAverage {
  phase: string
  mood: number | null
  energy: number | null
  days: number
}

/**
 * Mean mood and energy per phase.
 *
 * `null` for a phase nobody rated, never 0 — the same rule as everything else
 * here, and the one this repo keeps re-learning.
 */
export function moodByPhase(
  entries: CyclePoint[],
  phaseOfDate: (date: string) => string | null,
): PhaseAverage[] {
  const acc = new Map<string, { mood: number[]; energy: number[]; days: number }>()
  for (const e of entries) {
    const phase = phaseOfDate(e.date)
    if (!phase) continue
    const a = acc.get(phase) ?? { mood: [], energy: [], days: 0 }
    a.days++
    if (e.mood != null) a.mood.push(e.mood)
    if (e.energy != null) a.energy.push(e.energy)
    acc.set(phase, a)
  }
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)
  return [...acc.entries()].map(([phase, a]) => ({
    phase,
    mood: mean(a.mood),
    energy: mean(a.energy),
    days: a.days,
  }))
}
