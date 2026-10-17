import type { CyclePoint } from './types'
import { addDays, dayDiff, todayISO } from './date'
import type { CycleGroup } from './cycleCards'

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
export function phaseOf(day: number, length: number | null, ovulationDay?: number | null): PhaseEstimate {
  const len = length ?? 28
  // A MEASURED ovulation beats the calendar every time. `len - 14` assumes a
  // textbook luteal phase because, with no temperature shift to read, that is
  // the only thing available — but once the chart has shown the rise, using the
  // assumption instead of the observation is choosing to be wrong. `detectOvulation`
  // supplies the day; this is the only line that has to change to honour it.
  const ovulation = ovulationDay ?? len - 14
  if (day <= 5) return { id: 'menstrual', label: 'Menstrual', color: 'red' }
  if (day >= ovulation - 1 && day <= ovulation + 1) return { id: 'ovulation', label: 'Ovulation window', color: 'green' }
  if (day < ovulation) return { id: 'follicular', label: 'Follicular', color: 'teal' }
  // `blue`, not the accent. Luteal was `mauve`, which is simultaneously the
  // app's accent and the `pms` flag's hue — so the longest phase of the cycle
  // was painted in the colour that is supposed to mean "this is the control you
  // press", and in dawn it sat **8.6 dE** from the cramps dot beside it.
  // Measured across five themes, `blue` is 42.8 dE from the nearest other phase
  // and 25.5 from the nearest flag hue, both clear of this repo's 15 floor.
  return { id: 'luteal', label: 'Luteal', color: 'blue' }
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
/**
 * Mean bleeding days per **completed** cycle, rounded.
 *
 * Was computed inline in `views/Cycle.tsx` beside the stat strip that renders
 * it, which made the page's headline "Avg period" number the one derivation on
 * this page no test could reach. The cycle in progress is excluded: its period
 * days are already counted, but including a cycle whose later days have not
 * happened drags the mean down as a cycle ages.
 *
 * `null` when no cycle has completed — not 0, which reads as "your periods
 * last no days".
 */
export function avgPeriodLength(history: CycleSpan[]): number | null {
  const finished = history.filter((c) => !c.current)
  if (finished.length === 0) return null
  return Math.round(finished.reduce((s, c) => s + c.periodDays, 0) / finished.length)
}

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
export function phaseBands(length: number | null, ovulationDay?: number | null): PhaseBand[] {
  const len = length ?? 28
  const bands: PhaseBand[] = []
  for (let day = 1; day <= len; day++) {
    const p = phaseOf(day, len, ovulationDay)
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

/** One phase's average drive rating, and how many rated days it rests on. */
export interface DrivePhase extends PhaseEstimate {
  /** Mean of the 1–5 ratings logged in this phase, or `null` if none were. */
  avg: number | null
  /** Rated days behind `avg`. Zero when `avg` is null; never the other way. */
  days: number
}

/**
 * Average sex-drive rating per phase, across every day the log rates.
 *
 * The textbook claim is that libido rises around ovulation. Checking that
 * against yourself instead of against a textbook is the entire reason to write a
 * number down every day, so the rating exists to be folded along the cycle —
 * a column of 1–5s nobody reads back is dead weight.
 *
 * `avg` is `null`, never `0`, for a phase with no ratings: "you have not rated a
 * luteal day yet" and "your luteal drive is rock bottom" are opposite readings
 * and `count ? sum / count : 0` prints the same thing for both. Two functions in
 * this repo shipped that bug and opened a trend card with `0% · 0%` for months
 * that had not happened.
 *
 * Days are placed by `phaseOf`, so this inherits the same personal cycle length
 * the wheel and the pill use, and days before the first logged period start are
 * skipped — there is no cycle day to put them on.
 */
export function driveByPhase(
  entries: CyclePoint[],
  today: string,
  length: number | null,
): DrivePhase[] {
  const starts = periodStarts(entries).filter((d) => d <= today)
  const sum = new Map<string, { total: number; days: number }>()
  for (const e of entries) {
    if (e.drive == null || e.date > today) continue
    const start = [...starts].reverse().find((s) => s <= e.date)
    if (!start) continue
    const day = dayDiff(start, e.date) + 1
    // Past a plausible cycle this is a gap in the log, not day 74.
    if (day > 60) continue
    const { id } = phaseOf(day, length)
    const at = sum.get(id) ?? { total: 0, days: 0 }
    sum.set(id, { total: at.total + e.drive, days: at.days + 1 })
  }
  // One row per phase in cycle order, whether or not it has data: a missing row
  // reads as "no such phase", and the gap is itself the thing to notice.
  return phaseBands(length).map((b) => {
    const at = sum.get(b.id)
    return {
      id: b.id,
      label: b.label,
      color: b.color,
      avg: at ? Math.round((at.total / at.days) * 10) / 10 : null,
      days: at?.days ?? 0,
    }
  })
}

/**
 * The phase where drive is highest, or `null` when the comparison cannot be
 * made yet.
 *
 * Needs two phases with ratings — one is not a peak, it is the only bar on the
 * chart — and it refuses a tie, because "it peaks in the follicular phase (and
 * equally in the luteal one)" is not a finding. Deliberately says nothing about
 * *why*; the page compares it to the textbook claim and leaves it there.
 */
export function drivePeak(rows: DrivePhase[]): DrivePhase | null {
  const rated = rows.filter((r) => r.avg != null)
  if (rated.length < 2) return null
  const sorted = [...rated].sort((a, b) => b.avg! - a.avg!)
  return sorted[0].avg === sorted[1].avg ? null : sorted[0]
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

/** A `nextStep` rule's id, its sentence, and the rail row that elaborates it. */
export interface CycleStep {
  id: 'first' | 'late' | 'due' | 'stale' | 'fertile' | 'young' | 'steady'
  text: string
  group: CycleGroup
}

/**
 * THE ONE SENTENCE AT THE TOP OF THIS PAGE · what to do, not only what is true.
 *
 * Zone 1 was four facts and a privacy line. `docs/PAGE-ROLLOUT.md` step 6 is
 * the sentence, and Cycle was the last page without one — so the page said
 * "Day 23 · Luteal · ~2 Nov ±2d · 29 days" and left the reader to work out
 * that the thing to do was take tomorrow's temperature.
 *
 * Priority is URGENCY, which is also the order a reader would ask in:
 *
 * | rule | fires when |
 * |---|---|
 * | `first` | nothing logged — a record with no rows cannot say anything else |
 * | `late` | past the estimate, worded as an estimate running out, never as a result |
 * | `due` | the estimate lands within two days |
 * | `stale` | temperatures are being taken and the run has a hole in it |
 * | `fertile` | today is inside the measured window |
 * | `young` | fewer than three completed cycles, and it says how many |
 * | `steady` | the floor to stand on |
 *
 * Total, like every other `nextStep` in this app: it always returns a
 * sentence, so zone 1 renders it without a conditional that would leave a
 * hole at the top of the page.
 *
 * **`stale` has a coverage floor on both sides** — it needs a temperature in
 * the last 30 days before it can complain about a missing one. Without that
 * it fires permanently for the reader whose goal is `understand` and who has
 * never taken a basal temperature in their life, which is a page nagging
 * someone about a feature they have declined.
 *
 * Nothing here predicts and nothing here diagnoses. `late` says the estimate
 * has run out; it does not say what that means, because this file cannot know
 * and `CYCLE_DISCLAIMER` says so on every row of the page.
 */
export function nextStep(entries: CyclePoint[], opts: {
  today?: string
  /** The measured window, as 1-based cycle days — from `analyseCycles`. */
  fertileFrom?: number | null
  fertileTo?: number | null
  /** The prediction's own spread in days, so the sentence can carry it. */
  spread?: number
  /** Detected ovulation day, for the phase label. */
  ovulationDay?: number | null
} = {}): CycleStep {
  const today = opts.today ?? todayISO()
  const day = cycleDay(entries, today)
  const length = avgCycleLength(entries)
  const until = daysUntilNextPeriod(entries, today)
  const finished = cycleHistory(entries, today).filter((c) => !c.current).length
  const spread = opts.spread ?? 0
  const plus = spread > 0 ? ` (±${spread}d)` : ''

  if (entries.length === 0 || day == null) {
    return {
      id: 'first',
      text: 'Nothing logged yet — flag the first day of your period and this page starts reading your cycles back.',
      group: 'cycle',
    }
  }
  if (until != null && until < 0) {
    return {
      id: 'late',
      text: `${-until} ${-until === 1 ? 'day' : 'days'} past the estimate${plus}. Flag day 1 when it starts — an estimate running out is not a result.`,
      group: 'cycle',
    }
  }
  if (until != null && until <= 2) {
    return {
      id: 'due',
      text: `Period estimated ${until === 0 ? 'today' : `in ${until} ${until === 1 ? 'day' : 'days'}`}${plus}. Flag day 1 when it starts.`,
      group: 'cycle',
    }
  }
  const gap = morningsSinceTemp(entries, today)
  if (gap != null && gap >= 3) {
    return {
      id: 'stale',
      text: `No temperature for ${gap} mornings. The shift is read from a run of them, not from one reading.`,
      group: 'fertility',
    }
  }
  const { fertileFrom: from, fertileTo: to } = opts
  if (from != null && to != null && day >= from && day <= to) {
    return {
      id: 'fertile',
      text: `Day ${day} of the fertile window, days ${from}–${to}. The temperature confirms it afterwards, never during.`,
      group: 'fertility',
    }
  }
  if (finished < 3) {
    return {
      id: 'young',
      text: `${finished} complete ${finished === 1 ? 'cycle' : 'cycles'} on the record. Three or four is where the patterns start meaning anything.`,
      group: 'patterns',
    }
  }
  return {
    id: 'steady',
    text: `Day ${day}${length != null ? ` of about ${length}` : ''} · ${phaseOf(day, length, opts.ovulationDay).label}. Nothing due.`,
    group: 'cycle',
  }
}

/**
 * Mornings since the last temperature, or `null` when none was taken in the
 * last 30 days.
 *
 * The `null` is the whole point — see `nextStep`'s `stale` rule. "No
 * temperature ever" and "no temperature for three days" are different
 * sentences, and only one of them is worth saying.
 */
export function morningsSinceTemp(entries: CyclePoint[], today: string): number | null {
  const window = addDays(today, -30)
  const dates = entries.filter((e) => e.temp != null && e.date >= window && e.date <= today)
    .map((e) => e.date).sort()
  const last = dates[dates.length - 1]
  return last ? dayDiff(last, today) : null
}
