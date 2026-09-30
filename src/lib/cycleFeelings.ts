/**
 * HOW YOU FEEL, AGAINST WHERE YOU ARE.
 *
 * The question this answers is the one people actually open a cycle app with
 * and rarely get answered: *"is this me, or is this my cycle?"* — about desire,
 * about mood, about wanting chocolate at 9pm on day 24.
 *
 * Four signals, one axis:
 *
 * | Signal | Source | What it is |
 * |---|---|---|
 * | Drive | `drive` 1–5 | sexual desire that day |
 * | Mood | `mood` 1–5 | how you felt |
 * | Energy | `energy` 1–5 | how much you had |
 * | Cravings | `cravings[]` | how often food pulled |
 *
 * ## The rules, which are the same rules as everywhere else here
 *
 * **Absent is not zero.** A day nobody rated returns `null`, never 0. A phase
 * with no ratings says "not rated" rather than drawing a bar at the floor —
 * which is the `count ? sum / count : 0` trap this repo has now written down
 * four times.
 *
 * **Nothing here is a hormone measurement.** The app has no blood test. What it
 * has is a *timing* claim — "this is the phase when oestrogen is rising" — and
 * a record of what you logged then. The copy says which is which, because
 * "oestrogen makes you feel X" from a temperature log is a claim the data
 * cannot support, and this is a page people may repeat to a clinician.
 *
 * **A comparison needs something to compare to.** Every phase reading is
 * reported against YOUR OWN overall average, not against a population. "Your
 * drive runs a point higher around ovulation than it does across the month" is
 * a fact about the log. "Your drive is high" is not.
 */
import type { CyclePoint } from './types'

export type FeelingKey = 'drive' | 'mood' | 'energy' | 'cravings'

export interface FeelingPhase {
  phase: string
  /** Mean 1–5, or the share of days with any craving. `null` when unrated. */
  value: number | null
  /** Days in this phase that carry the signal. */
  n: number
  /** Days in this phase at all — the honest denominator. */
  days: number
}

export interface FeelingSeries {
  key: FeelingKey
  label: string
  /** What a high value means, for the axis and the reader. */
  high: string
  low: string
  phases: FeelingPhase[]
  /** Mean across every day that carries the signal, as the comparison baseline. */
  overall: number | null
  /** The phase furthest from `overall`, when the gap is big enough to mean it. */
  peak: { phase: string; value: number; delta: number } | null
}

export const FEELINGS: { key: FeelingKey; label: string; high: string; low: string }[] = [
  { key: 'drive', label: 'Sex drive', high: 'high', low: 'none' },
  { key: 'mood', label: 'Mood', high: 'great', low: 'low' },
  { key: 'energy', label: 'Energy', high: 'energised', low: 'drained' },
  { key: 'cravings', label: 'Cravings', high: 'most days', low: 'rarely' },
]

/**
 * A gap smaller than this is not worth naming. Half a point on a five-point
 * scale is inside the noise of how anyone rates their own day, and an app that
 * announces "your mood peaks in the follicular phase" off 0.2 is inventing a
 * finding — which is exactly the thing someone would repeat to a doctor.
 */
export const MEANINGFUL_DELTA = 0.5

/** Minimum rated days in a phase before its average is reported at all. */
export const MIN_DAYS = 3

export function feelingsByPhase(
  entries: CyclePoint[],
  phaseOfDate: (date: string) => string | null,
  phaseOrder: string[],
): FeelingSeries[] {
  return FEELINGS.map(({ key, label, high, low }) => {
    const buckets = new Map<string, { vals: number[]; days: number }>()
    const all: number[] = []

    for (const e of entries) {
      const phase = phaseOfDate(e.date)
      if (!phase) continue
      const b = buckets.get(phase) ?? { vals: [], days: 0 }
      b.days++
      const v = key === 'cravings'
        // Cravings are a yes/no per day, reported as a share of days — an
        // average of "how many cravings" would say a day with three is three
        // times the day with one, which is not what the tags mean.
        ? ((e.cravings?.length ?? 0) > 0 ? 1 : 0)
        : (e[key] ?? null)
      if (v != null) { b.vals.push(v); all.push(v) }
      buckets.set(phase, b)
    }

    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
    const overall = mean(all)

    const phases: FeelingPhase[] = phaseOrder.map((phase) => {
      const b = buckets.get(phase) ?? { vals: [], days: 0 }
      return {
        phase,
        // Below the floor the average is not reported. Two rated days in a
        // phase is not a tendency, and showing it as one invites belief.
        value: b.vals.length >= MIN_DAYS ? round1(mean(b.vals)!) : null,
        n: b.vals.length,
        days: b.days,
      }
    })

    let peak: FeelingSeries['peak'] = null
    if (overall != null) {
      for (const p of phases) {
        if (p.value == null) continue
        const delta = p.value - overall
        if (Math.abs(delta) >= MEANINGFUL_DELTA && (!peak || Math.abs(delta) > Math.abs(peak.delta))) {
          peak = { phase: p.phase, value: p.value, delta: round1(delta) }
        }
      }
    }

    return { key, label, high, low, phases, overall: overall == null ? null : round1(overall), peak }
  })
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * One sentence per signal that has a real peak, phrased against the reader's
 * own baseline rather than against a population.
 *
 * Cravings are phrased as a share of days because that is what was measured;
 * the others as points on their scale.
 */
export function feelingNotes(series: FeelingSeries[]): { key: FeelingKey; text: string }[] {
  const out: { key: FeelingKey; text: string }[] = []
  for (const s of series) {
    if (!s.peak || s.overall == null) continue
    const dir = s.peak.delta > 0 ? 'higher' : 'lower'
    if (s.key === 'cravings') {
      out.push({
        key: s.key,
        text: `You log a craving on ${pct(s.peak.value)} of ${s.peak.phase === 'Ovulation window' ? 'ovulation-window' : s.peak.phase.toLowerCase()} days, against ${pct(s.overall)} across the month.`,
      })
    } else {
      out.push({
        key: s.key,
        text: `Your ${s.label.toLowerCase()} runs ${Math.abs(s.peak.delta)} ${Math.abs(s.peak.delta) === 1 ? 'point' : 'points'} ${dir} ${phaseClause(s.peak.phase)} than your own average of ${s.overall}.`,
      })
    }
  }
  return out
}

/**
 * "in the luteal phase" but "in your ovulation window" — the window is already
 * a noun, and "the ovulation window phase" is the kind of phrase that tells a
 * reader the sentence was assembled rather than written.
 */
function phaseClause(phase: string): string {
  return phase === 'Ovulation window' ? 'in your ovulation window' : `in the ${phase.toLowerCase()} phase`
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}

/**
 * WHAT IS HAPPENING HORMONALLY, per phase — the timing claim, and only that.
 *
 * Deliberately separated from the measurements above: this is textbook
 * physiology about *when*, and it is true of cycles in general rather than of
 * this user's log. Presenting the two as one thing would let "oestrogen rises
 * here" borrow the authority of "your drive was 4.1 here", and the app has
 * measured one and not the other.
 */
export const PHASE_HORMONES: { phase: string; hormones: string; felt: string }[] = [
  {
    phase: 'Menstrual',
    hormones: 'Oestrogen and progesterone are both at their lowest.',
    felt: 'Energy is often lowest in the first days. Desire varies widely — some notice a dip, some the opposite.',
  },
  {
    phase: 'Follicular',
    hormones: 'Oestrogen rises steadily as a follicle matures.',
    felt: 'Mood and energy commonly climb once bleeding ends. Often the phase people describe as feeling most like themselves.',
  },
  {
    phase: 'Ovulation window',
    hormones: 'Oestrogen peaks, then luteinising hormone surges and the egg is released.',
    felt: 'Sex drive is most often reported at its highest here, and it is the best-documented cyclical pattern in desire.',
  },
  {
    phase: 'Luteal',
    hormones: 'Progesterone dominates and holds temperature higher; both hormones fall at the end if no pregnancy starts.',
    felt: 'Appetite and cravings commonly rise. Mood dips and irritability cluster in the last week — this is where PMS lives.',
  },
]
