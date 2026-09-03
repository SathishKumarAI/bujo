/**
 * Educational reference for the Cycle page: the four phases, how to take a
 * usable basal temperature, and what is worth logging. Static content in the
 * style of the training guides (`pullups.ts`, Coaching's manual) — standard
 * menstrual-health education as published by ACOG/NHS-class sources, kept
 * neutral and phrased as orientation, not diagnosis. The page pairs it with
 * an educational-only disclaimer, mirroring the knee-rehab one.
 *
 * Day ranges assume the 28-day textbook cycle; the page's phase estimate
 * scales to the logged personal average, and 21–35 days is a normal range.
 */

export interface CyclePhase {
  id: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  name: string
  days: string
  color: string
  what: string
  feel: string
  tip: string
}

export const CYCLE_PHASES: CyclePhase[] = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    days: 'Days 1–5',
    color: 'red',
    what: 'The uterine lining sheds; day 1 is the first day of full flow. Hormones (estrogen and progesterone) are at their lowest.',
    feel: 'Cramps, fatigue and headaches are common; energy is often lowest in the first days.',
    tip: 'Iron-rich food helps replace what bleeding costs. Gentle movement — walking, stretching — can ease cramps.',
  },
  {
    id: 'follicular',
    name: 'Follicular',
    days: 'Days 1–13 (overlaps the period)',
    color: 'teal',
    what: 'Rising estrogen matures a follicle and rebuilds the uterine lining. Basal temperature sits in its lower range.',
    feel: 'Energy and mood typically climb after the period ends — many people feel their sharpest and strongest here.',
    tip: 'A good window for harder training and demanding work; recovery tends to be fastest in this phase.',
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    days: 'Around day 14 (≈14 days before the next period)',
    color: 'green',
    what: 'The egg is released. Cervical mucus turns clear and stretchy; basal temperature rises ~0.3–0.5 °F (0.2–0.3 °C) just after and stays up.',
    feel: 'Some feel a one-sided twinge (mittelschmerz); energy and sociability often peak.',
    tip: 'The fertile window is roughly the five days before ovulation through the day after — the reason the temperature chart matters.',
  },
  {
    id: 'luteal',
    name: 'Luteal',
    days: 'Days 15–28',
    color: 'mauve',
    what: 'Progesterone dominates and holds temperature in its higher range. If no pregnancy starts, hormones fall and the cycle restarts.',
    feel: 'PMS lives here — bloating, breast tenderness, mood dips and cravings, usually in the last week.',
    tip: 'Sleep and steady meals blunt PMS; scale training by feel rather than forcing peak sessions.',
  },
]

/** How to take a basal temperature the chart can actually use. */
export const BBT_RULES = [
  'Measure at the same time every morning, before getting up, talking or drinking — movement raises the reading.',
  'After at least 3 hours of unbroken sleep; a short night makes the number unreliable, log it anyway and expect noise.',
  'Use the same thermometer all cycle; a basal (two-decimal) thermometer shows the shift more clearly.',
  'Look for the pattern, not one reading: a rise of ~0.3–0.5 °F held for 3+ days means ovulation already happened.',
  'Alcohol, illness, travel and late nights all bump the reading — a note on the day explains the outlier later.',
]

/** What is worth logging beyond temperature, and why. */
export const TRACKING_TIPS = [
  { what: 'Period days', why: 'Day 1 anchors everything — cycle day, phase estimate and the next-period estimate all count from it.' },
  { what: 'Spotting', why: 'Mid-cycle spotting around ovulation is common; frequent or heavy spotting is worth mentioning to a clinician.' },
  { what: 'Cramps & PMS', why: 'Patterns across months show whether symptoms cluster where the textbook says — and when to expect them.' },
  { what: 'Cycle length itself', why: '21–35 days is a normal range, and your average beats the textbook 28. Consistent logging for 2–3 cycles is enough to see yours.' },
]

export const CYCLE_DISCLAIMER =
  'Educational only — not medical advice, and temperature tracking is not contraception. Cycles vary; talk to a clinician about pain, heavy bleeding, or cycles consistently shorter than 21 or longer than 35 days.'
