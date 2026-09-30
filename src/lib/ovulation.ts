/**
 * OVULATION DETECTION · what a temperature chart can honestly say.
 *
 * Everything here is retrospective. A thermal shift says *"the rise already
 * happened"*, which is the only claim a BBT chart supports — it cannot predict
 * ovulation, and nothing in this file pretends to. The predictions below it are
 * labelled as estimates, given as ranges, and widen when the log says they
 * should.
 *
 * This replaces nothing: `cycleInsights.coverline` already found the 3-over-6
 * line and is kept, because the chart reads it. What is new is everything that
 * turns that line into a *day*, a *confidence* and a *luteal length*.
 *
 * ## The rules, and why each one is there
 *
 * **3-over-6.** The first day where three consecutive valid readings are all
 * above the highest of the six valid readings before them. That highest-of-six
 * is the coverline.
 *
 * **The 0.2 °F confirmation.** The third high reading must clear the coverline
 * by at least 0.2 °F (0.1 °C); otherwise a fourth reading above the line is
 * required. Three readings a hundredth of a degree above a noisy baseline is
 * measurement error, not progesterone.
 *
 * **Disturbed and missing days are skipped, and do not break the run.** A day
 * marked unreliable is not evidence either way — counting it as a low would
 * invent a shift, and letting it break the sequence would erase a real one.
 * This is the entire reason `tempDisturbed` exists.
 *
 * **Supporting signs strengthen, never override.** An LH peak or egg-white
 * mucus can raise confidence from `likely` to `confirmed`, but no combination
 * of them produces a detected ovulation without a temperature shift. A urine
 * test predicts; only the temperature confirms.
 */
import type { CyclePoint } from './types'
import { addDays, dayDiff } from './date'

/** A reading the engine is willing to reason about. */
interface Reading { date: string; day: number; temp: number }

export type Confidence = 'confirmed' | 'likely' | 'estimated'

export interface OvulationResult {
  /** Cycle day of the estimated ovulation — the last low before the first high. */
  day: number | null
  /** ISO date of that day, when it is known. */
  date: string | null
  coverline: number | null
  confidence: Confidence
  /** Which supporting signs were found, for the UI to name rather than imply. */
  signs: string[]
  /** Days from ovulation to the day before the next period, when both are known. */
  lutealLength: number | null
  /** The 5 days before ovulation plus ovulation day, as cycle days. */
  fertileFrom: number | null
  fertileTo: number | null
}

const NONE: OvulationResult = {
  day: null, date: null, coverline: null, confidence: 'estimated',
  signs: [], lutealLength: null, fertileFrom: null, fertileTo: null,
}

/** Minimum rise above the coverline for the third high reading to confirm. */
export const CONFIRM_MARGIN = { F: 0.2, C: 0.1 } as const

/**
 * Detect the thermal shift in one cycle's entries.
 *
 * `entries` must be one cycle, in date order, starting at its period start.
 * `nextPeriodStart` is the following cycle's day 1 when it exists — only then
 * can a luteal length be measured, because the luteal phase ends the day before
 * the next period and a cycle in progress has not ended.
 */
export function detectOvulation(
  entries: CyclePoint[],
  unit: 'F' | 'C' = 'F',
  nextPeriodStart?: string,
): OvulationResult {
  if (entries.length === 0) return NONE
  const start = entries[0].date

  // Skip both unreadable days and unreliable ones. A disturbed reading is not
  // a low and not a high — it is absent, which is the whole point of the flag.
  const readings: Reading[] = entries
    .filter((e) => e.temp != null && !e.tempDisturbed)
    .map((e) => ({ date: e.date, day: dayDiff(start, e.date) + 1, temp: e.temp as number }))

  const margin = CONFIRM_MARGIN[unit]
  let shiftAt = -1
  let coverline: number | null = null

  for (let i = 6; i <= readings.length - 3; i++) {
    const before = readings.slice(i - 6, i)
    const high = Math.max(...before.map((r) => r.temp))
    const after3 = readings.slice(i, i + 3)
    if (!after3.every((r) => r.temp > high)) continue

    // The third high must clear the line by the margin; failing that, a fourth
    // reading above it will do. Two ways to be sure, one way to be wrong.
    const thirdClears = after3[2].temp >= high + margin
    const fourth = readings[i + 3]
    const fourthConfirms = fourth != null && fourth.temp > high
    if (!thirdClears && !fourthConfirms) continue

    shiftAt = i
    coverline = Math.round(high * 100) / 100
    break
  }

  if (shiftAt < 0) return NONE

  // Estimated ovulation is the LAST LOW before the first high — not the first
  // high itself. The rise follows ovulation by a day or so, so naming the first
  // high day would place it consistently late.
  const lastLow = readings[shiftAt - 1]
  const day = lastLow.day
  const date = lastLow.date

  const signs = supportingSigns(entries, date)
  const confidence: Confidence = signs.length > 0 ? 'confirmed' : 'likely'

  return {
    day,
    date,
    coverline,
    confidence,
    signs,
    // The luteal phase runs from ovulation to the day BEFORE the next period,
    // so a cycle still in progress has no length yet. `null`, not a guess.
    lutealLength: nextPeriodStart ? dayDiff(date, nextPeriodStart) : null,
    fertileFrom: Math.max(1, day - 5),
    fertileTo: day,
  }
}

/**
 * Signs that corroborate the temperature, within the windows they are useful in.
 *
 * An LH surge precedes ovulation by 24–36 hours, so a peak more than two days
 * out is describing a different event. Fertile mucus appears across a slightly
 * wider run-up, hence three. Both windows look BACKWARD from the estimate: a
 * positive test after ovulation is not evidence for it.
 */
function supportingSigns(entries: CyclePoint[], ovulationDate: string): string[] {
  const found: string[] = []
  const within = (date: string, days: number) => {
    const d = dayDiff(date, ovulationDate)
    return d >= 0 && d <= days
  }
  for (const e of entries) {
    if ((e.lh === 'peak' || e.lh === 'positive') && within(e.date, 2) && !found.includes('LH test')) {
      found.push('LH test')
    }
    if ((e.mucus === 'egg-white' || e.mucus === 'watery') && within(e.date, 3) && !found.includes('mucus')) {
      found.push('mucus')
    }
    if (e.flags.includes('ovulation') && within(e.date, 2) && !found.includes('your own mark')) {
      found.push('your own mark')
    }
  }
  return found
}

export interface Prediction {
  /** Midpoint of the next-period estimate. */
  date: string | null
  /** Earliest and latest, inclusive — a range, never a single date. */
  from: string | null
  to: string | null
  /** Half-width of the range in days, so the UI can say "±3". */
  spread: number
  /** Predicted next ovulation, from the personal luteal length. */
  ovulation: string | null
  /** Fewer than 3 cycles: the numbers are real but thin. */
  early: boolean
  /** Cycles outside 21–35, or varying by more than 7 days. */
  irregular: boolean
}

/**
 * Next period and next ovulation, as ranges.
 *
 * A single date is a promise a cycle log cannot make. The spread is the
 * personal standard deviation of cycle length, floored at 1 day — a user whose
 * last three cycles were all exactly 28 days still does not get "Tuesday, and
 * it will be Tuesday".
 *
 * `lutealLengths` are the confirmed ones from `detectOvulation`. With fewer
 * than two, the classic 14 is used, which is the same assumption `phaseOf`
 * already makes for the calendar estimate — stated here rather than hidden.
 */
export function predict(
  cycleLengths: number[],
  lastPeriodStart: string | null,
  lutealLengths: number[] = [],
): Prediction {
  const none: Prediction = { date: null, from: null, to: null, spread: 0, ovulation: null, early: true, irregular: false }
  if (!lastPeriodStart || cycleLengths.length === 0) return none

  const mean = cycleLengths.reduce((s, n) => s + n, 0) / cycleLengths.length
  const avg = Math.round(mean)
  const variance = cycleLengths.reduce((s, n) => s + (n - mean) ** 2, 0) / cycleLengths.length
  const sd = Math.sqrt(variance)
  const spread = Math.max(1, Math.round(sd))

  const range = Math.max(...cycleLengths) - Math.min(...cycleLengths)
  const irregular = cycleLengths.some((n) => n < 21 || n > 35) || range > 7
  // An irregular log gets a WIDER stated range, not a hidden one. Narrowing a
  // prediction that the data does not support is the failure mode here.
  const half = irregular ? spread + 2 : spread

  const date = addDays(lastPeriodStart, avg)
  const luteal = lutealLengths.length >= 2
    ? Math.round(lutealLengths.reduce((s, n) => s + n, 0) / lutealLengths.length)
    : 14

  return {
    date,
    from: addDays(date, -half),
    to: addDays(date, half),
    spread: half,
    ovulation: addDays(date, -luteal),
    early: cycleLengths.length < 3,
    irregular,
  }
}

/** Mean of the confirmed luteal lengths, or null when none are confirmed. */
export function avgLutealLength(lengths: number[]): number | null {
  if (lengths.length === 0) return null
  return Math.round(lengths.reduce((s, n) => s + n, 0) / lengths.length)
}

export interface CycleAnalysis {
  /** Detection for the cycle currently running, or the last one logged. */
  current: OvulationResult
  /** Confirmed luteal lengths from completed cycles, oldest first. */
  lutealLengths: number[]
  /** Lengths of completed cycles, for `predict`. */
  cycleLengths: number[]
  /** Day 1 of the cycle in progress. */
  lastStart: string | null
}

/**
 * Run the engine over a whole log, once.
 *
 * Splitting the log into cycles is done here rather than in the view because
 * three separate places need it — the ring, the chart and the prediction — and
 * three copies of "where does a cycle start" is how they come to disagree by a
 * day. `periodStarts` stays the single definition of a start; this only groups
 * by it.
 */
export function analyseCycles(
  entries: CyclePoint[],
  starts: string[],
  unit: 'F' | 'C' = 'F',
): CycleAnalysis {
  if (starts.length === 0) {
    return { current: NONE, lutealLengths: [], cycleLengths: [], lastStart: null }
  }
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1))
  const lutealLengths: number[] = []
  const cycleLengths: number[] = []
  let current = NONE

  for (let i = 0; i < starts.length; i++) {
    const from = starts[i]
    const next = starts[i + 1]
    const slice = sorted.filter((e) => e.date >= from && (next ? e.date < next : true))
    const result = detectOvulation(slice, unit, next)
    if (next) {
      cycleLengths.push(dayDiff(from, next))
      if (result.lutealLength != null) lutealLengths.push(result.lutealLength)
    } else {
      current = result
    }
  }

  return { current, lutealLengths, cycleLengths, lastStart: starts[starts.length - 1] }
}
