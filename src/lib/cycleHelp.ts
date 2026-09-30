/**
 * CYCLE HELP · every explanatory string on the page, in one file.
 *
 * The rule the brief asks for and the reason it matters: a tip, the label it
 * sits beside and the Guide section that expands it are three views of one
 * explanation, and this repo has watched them drift before — the palette lived
 * in two files and disagreed for a release, and the phase hue still does.
 *
 * **These do not duplicate `src/data/glossary.json`.** That file defines *terms*
 * — what PMS is, what BBT stands for — and is shared with Help's glossary and
 * the `Abbr` popover. This file explains *this page's controls and readings*:
 * what the Next-period range means, why a disturbed reading is excluded, what
 * "confirmed" is claiming. A term goes in the glossary; an explanation of a
 * number on this screen goes here.
 */

export interface HelpEntry {
  /** Where it appears, and the key an InfoTip asks for. */
  key: string
  /** The tip itself. Plain, second person, short sentences. */
  text: string
  /** Guide section id to scroll to, when there is more to say. */
  more?: string
}

export const CYCLE_HELP: HelpEntry[] = [
  {
    key: 'cycle-day',
    text: 'Day 1 is the first day of full bleeding. Every other number counts from it. Spotting before your period doesn’t start a new cycle.',
    more: 'getting-started',
  },
  {
    key: 'phase',
    text: 'Where you are in your cycle, based on your own averages. "Estimated" means calendar-based; "confirmed" means your temperature shift showed ovulation happened.',
    more: 'reading-your-chart',
  },
  {
    key: 'next-period',
    text: 'A range, not a promise. It’s built from your own cycle lengths and gets more accurate the more cycles you log.',
    more: 'reading-your-chart',
  },
  {
    key: 'your-average',
    text: 'Your mean cycle length across logged cycles. Anywhere from 21 to 35 days is common for adults.',
    more: 'clinician',
  },
  {
    key: 'temp-shift',
    text: 'The rise in your waking temperature after ovulation, usually about 0.3–0.5 °F (0.2–0.3 °C). It’s caused by progesterone and stays up until your next period.',
    more: 'reading-your-chart',
  },
  {
    key: 'menstrual',
    text: 'Your period. The uterine lining sheds. Usually lasts 3–7 days.',
  },
  {
    key: 'follicular',
    text: 'From day 1 until ovulation. Estrogen rises and an egg matures. This is the part that varies most — a longer cycle usually means a longer follicular phase.',
  },
  {
    key: 'ovulation-window',
    text: 'The days an egg is likely released. The egg survives about a day; sperm can survive up to five, so the fertile window starts before ovulation.',
    more: 'fertility-signs',
  },
  {
    key: 'luteal',
    text: 'From ovulation to your next period. It’s steady for most people — about 11 to 17 days. Temperature stays higher and PMS symptoms often show up here.',
  },
  {
    key: 'bbt',
    text: 'Take it as soon as you wake, before getting up, talking, or drinking — ideally after at least 3 hours of sleep and at about the same time each day. Use the same thermometer.',
    more: 'taking-your-temperature',
  },
  {
    key: 'coverline',
    text: 'A reference line just above your pre-ovulation temperatures. Three readings in a row above it suggest ovulation has already happened.',
    more: 'reading-your-chart',
  },
  {
    key: 'temp-disturbed',
    text: 'Mark this when something could skew the reading: illness, fever, alcohol, travel, a short night, or taking it much later than usual. Those days are left out of ovulation detection.',
    more: 'taking-your-temperature',
  },
  {
    key: 'cervical mucus',
    text: 'Changes through the cycle. Watery or clear, stretchy "egg-white" mucus usually appears in the days before ovulation and is the most fertile sign.',
    more: 'fertility-signs',
  },
  {
    key: 'LH test',
    text: 'Ovulation test strips detect a hormone surge that usually happens 24–36 hours before ovulation. A positive test predicts ovulation; the temperature shift confirms it.',
    more: 'fertility-signs',
  },
  {
    key: 'flow',
    text: 'How heavy bleeding is. Soaking through a pad or tampon every hour for several hours is worth calling a clinician about.',
    more: 'clinician',
  },
  {
    key: 'drive',
    text: 'Your sex drive today, 1 (none) to 5 (high). Optional. Many people notice it rises near ovulation.',
  },
  {
    key: 'mood',
    text: 'A quick 1–5 check-in. After a few cycles, the Patterns view shows whether your mood follows your cycle.',
    more: 'patterns',
  },
  {
    key: 'cravings',
    text: 'Appetite and cravings often rise in the luteal phase. Logging them helps you see when yours start.',
    more: 'patterns',
  },
  {
    key: 'fertile-window',
    text: 'The 5 days before ovulation plus ovulation day. It’s an estimate based on your data — it is not contraception.',
    more: 'fertility-signs',
  },
  {
    key: 'confidence',
    text: 'Estimated: calendar only. Likely: temperature shift seen. Confirmed: temperature shift plus another sign (LH test or mucus).',
    more: 'reading-your-chart',
  },
  {
    key: 'pattern-grid',
    text: 'Each row is something you log; each column is a cycle day. Darker cells mean it happened more often on that day across your cycles.',
    more: 'patterns',
  },
  {
    key: 'local-only',
    text: 'Your cycle data lives only in this browser. Nothing is uploaded. Export a backup regularly — if browser data is cleared, it can’t be recovered.',
    more: 'privacy',
  },
]

const BY_KEY = new Map(CYCLE_HELP.map((h) => [h.key, h]))

/** The tip for a key, or undefined. Never throws — a missing tip renders no ⓘ. */
export function cycleHelp(key: string): HelpEntry | undefined {
  return BY_KEY.get(key)
}

/**
 * GOAL MODE · what the page leads with.
 *
 * Two modes, and the difference is ORDER and EMPHASIS, never availability.
 * Hiding the fertility fields from someone who is "just understanding their
 * cycle" would be the app deciding what she is allowed to know about her own
 * body; hiding the symptom patterns from someone trying to conceive would
 * assume conceiving is all she is tracking.
 */
export type CycleGoal = 'understand' | 'conceive'

export const GOAL_LABEL: Record<CycleGoal, string> = {
  understand: 'Understanding my cycle',
  conceive: 'Trying to conceive',
}

export interface PhaseFood {
  phase: string
  focus: string
}

/**
 * Phase-by-phase nutrition, framed as general wellness and nothing else.
 *
 * Deliberately short and deliberately unquantified: no grams, no targets, no
 * supplement doses. The moment this reads like a plan it is dietary advice, and
 * a page that has just disclaimed being medical care cannot then prescribe.
 */
export const PHASE_FOOD: PhaseFood[] = [
  { phase: 'Menstrual', focus: 'Iron-rich foods paired with vitamin C; fluids.' },
  { phase: 'Follicular', focus: 'Protein, vegetables, fermented foods.' },
  { phase: 'Ovulation window', focus: 'Zinc sources, colourful produce.' },
  { phase: 'Luteal', focus: 'Magnesium-rich foods, complex carbohydrates, steady meal timing — it helps with cravings.' },
]

export const CONCEIVE_FOOD_NOTE =
  'Folate, choline and omega-3 sources. Talk to a clinician about a prenatal vitamin.'

export const FOOD_FOOTER = 'General wellness information, not a diet plan.'
