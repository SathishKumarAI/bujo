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
 *
 * **`cravings`, `eat` and `sources` were added for the gym reader**, who wants
 * to know what to eat in which phase. Two rules held while writing them, and
 * both are the reason this is data rather than prose in a view:
 *
 * 1. **Every dietary claim is one a published health body makes**, and it says
 *    which one, with a link. `sources` is a list because the luteal advice comes
 *    from two pages and a single credit would have to pick a winner. It reuses
 *    the glossary's `GlossarySource` shape — a second "label + url" interface
 *    would be the palette-written-down-twice mistake in miniature.
 * 2. **Where the evidence is thin, it says so.** Ovulation has no established
 *    craving pattern, and the honest entry says that instead of inventing a
 *    food for symmetry. A guide that is confident in four places out of four is
 *    not a guide, it is a horoscope.
 *
 * The training connection stays in `tip` — one opinion about training per
 * phase, not a second one written into `eat`.
 */
import type { GlossarySource } from './glossary'

/**
 * THE FOUR PHASES, AS POINTS.
 *
 * WHAT THIS FILE OWNS: the educational content for each phase.
 * WHAT IT DOES NOT OWN: how it is drawn (`components/cycle/Guide.tsx`,
 * `PhaseNutrition.tsx`), or the phase a reader is in (`lib/cycleInsights.ts`).
 *
 * ── Why every field is a list ────────────────────────────────────────────
 *
 * Asked for directly: *"make all the content in the guide into parts and
 * points so that it's easy to read."* It is also the rule CLAUDE.md already
 * states — **a field people read is `string[]`, not `string`, the moment it
 * holds more than one idea** — and this file was the largest violation of it
 * in the app. Measured before the split: **twelve strings over 120
 * characters**, the worst a **456-character** luteal `eat` carrying four
 * separate pieces of advice and two citations in one paragraph.
 *
 * The type is the rule. A `string` invites the next sentence to be appended,
 * which is exactly how that 456-character field grew.
 *
 * ── The rules the points keep ────────────────────────────────────────────
 *
 * - **One idea per line**, and a real line — not a fragment left behind by
 *   splitting a sentence on its full stops. `cycleGuide.test.ts` asserts a
 *   floor of 12 characters per point for that reason, and the canary that
 *   proved it plants `'and stays up'`.
 * - **Two points minimum, or it stays one line.** A one-item list is a bullet
 *   pretending to be structure.
 * - **The heading says what the list is; the points do not repeat it.**
 *
 * ── The two rules that predate the split, and still hold ─────────────────
 *
 * 1. **Every dietary claim is one a published health body makes**, and it
 *    says which, with a link. `sources` is a list because the luteal advice
 *    comes from two pages and a single credit would have to pick a winner.
 * 2. **Where the evidence is thin, it says so.** Ovulation has no established
 *    craving pattern and the entry says that rather than inventing a food for
 *    symmetry. A guide confident in four places out of four is not a guide.
 *
 * Day ranges assume the 28-day textbook cycle; the page's own estimate scales
 * to the logged personal average, and 21–35 days is a normal range.
 */
export interface CyclePhase {
  id: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  name: string
  days: string
  color: string
  /** What is physically happening. */
  what: string[]
  /** How it commonly feels. A tendency, never a prediction. */
  feel: string[]
  /** What helps, including the one training opinion per phase. */
  tip: string[]
  /** What the cravings tend to be here. */
  cravings: string[]
  /** What is worth eating and why. Orientation, not a prescription. */
  eat: string[]
  /** Where the `cravings`/`eat` claims come from. At least one, linked. */
  sources: GlossarySource[]
}

export const CYCLE_PHASES: CyclePhase[] = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    days: 'Days 1–5',
    color: 'red',
    what: [
      'The uterine lining sheds. Day 1 is the first day of full flow.',
      'Estrogen and progesterone are both at their lowest.',
    ],
    feel: [
      'Cramps, fatigue and headaches are common.',
      'Energy is often lowest in the first two days.',
    ],
    tip: [
      'Iron-rich food helps replace what bleeding costs.',
      'Gentle movement — walking, stretching — can ease cramps.',
    ],
    cravings: [
      'Appetite tends to swing rather than climb.',
      'Sugar and salt are the usual pull.',
      'The only stretch of the cycle with a measurable nutritional cost attached.',
    ],
    eat: [
      'Iron is the one to be deliberate about.',
      'Red meat or liver, beans and lentils, nuts, dried apricots, fortified cereal.',
      'The NHS notes that heavy periods raise the risk of iron-deficiency anaemia — often what "the first two days wipe me out" actually is.',
      'Warm food and steady fluids go down easier than a large plate.',
    ],
    sources: [{ label: 'NHS · Iron', url: 'https://www.nhs.uk/conditions/vitamins-and-minerals/iron/' }],
  },
  {
    id: 'follicular',
    name: 'Follicular',
    days: 'Days 1–13 (overlaps the period)',
    color: 'teal',
    what: [
      'Rising estrogen matures a follicle and rebuilds the uterine lining.',
      'Basal temperature sits in its lower range.',
    ],
    feel: [
      'Energy and mood typically climb once the period ends.',
      'Many people feel their sharpest and strongest here.',
    ],
    tip: [
      'A good window for harder training and demanding work.',
      'Recovery tends to be fastest in this phase.',
    ],
    cravings: [
      'The steadiest stretch for most people — cravings are least noticeable here.',
      'Appetite often sits at its lowest in the days just after the period ends.',
    ],
    eat: [
      'Fuel the training this phase is good for, rather than chasing a cycle-specific diet.',
      'Base meals on higher-fibre starchy carbohydrates — potatoes, wholegrain bread, rice, pasta.',
      'Keep protein in every meal.',
      'That is the whole of the NHS balanced-diet guidance, and nothing phase-specific beats it: the phase decides how hard you train, not what a plate looks like.',
    ],
    sources: [{ label: 'NHS · Eating a balanced diet', url: 'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/' }],
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    days: 'Around day 14 (≈14 days before the next period)',
    color: 'green',
    what: [
      'The egg is released.',
      'Cervical mucus turns clear and stretchy.',
      'Basal temperature rises ~0.3–0.5 °F (0.2–0.3 °C) just after, and stays up.',
    ],
    feel: [
      'Some feel a one-sided twinge (mittelschmerz).',
      'Energy and sociability often peak.',
    ],
    tip: [
      'The fertile window is roughly the five days before ovulation through the day after.',
      'That window is the reason the temperature chart matters.',
    ],
    cravings: [
      'No distinctive craving pattern is well established around ovulation.',
      'Some people notice appetite dipping for a day or two.',
      'This phase is defined by fertility signs, not by appetite — naming a food here would be ahead of the evidence.',
    ],
    eat: [
      'Nothing special, which is worth saying plainly: eat as you do in the follicular phase.',
      'The useful habit here is a note rather than a food.',
      'Mucus turning clear and stretchy is the visible sign the NHS describes; the temperature step confirms the day afterwards.',
    ],
    sources: [{ label: 'NHS · Periods and fertility in the menstrual cycle', url: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/' }],
  },
  {
    id: 'luteal',
    name: 'Luteal',
    days: 'Days 15–28',
    // Kept in step with `phaseOf` in lib/cycleInsights.ts by hand, because the
    // phase's hue is written down in both files — the ring reads one and this
    // card reads the other, so a change to one alone shows the same phase in
    // two colours on the same screen. Moved off `mauve` with the ring: see the
    // note there for the measurement.
    color: 'blue',
    what: [
      'Progesterone dominates and holds temperature in its higher range.',
      'If no pregnancy starts, hormones fall and the cycle restarts.',
    ],
    feel: [
      'PMS lives here — bloating, breast tenderness, mood dips and cravings.',
      'Usually in the last week before the period.',
    ],
    tip: [
      'Sleep and steady meals blunt PMS.',
      'Scale training by feel rather than forcing peak sessions.',
    ],
    cravings: [
      'This is the phase cravings are actually documented in.',
      'The NHS lists "changes in appetite or food cravings" among the commonest PMS symptoms.',
      'The pull in the last week is typically toward carbohydrate, sugar and salt.',
    ],
    eat: [
      'Smaller meals every two to three hours steady the swing better than three large ones.',
      'Calcium-rich food — milk, yoghurt, cheese or a fortified alternative — is the one specific the Office on Women\'s Health names for cravings, fatigue and low mood.',
      'The same page suggests easing off caffeine, salt and sugar in the fortnight before a period.',
      'Regular aerobic activity is on that list too, which is why the training note above says scale rather than stop.',
    ],
    sources: [
      { label: 'NHS · Premenstrual syndrome (PMS)', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' },
      { label: 'Office on Women\'s Health · Premenstrual syndrome', url: 'https://www.womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
    ],
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

/**
 * Bump when the PROMISES in `CycleWelcome` change, not when a word is tidied.
 * `settings.cycleDisclaimerAck` stores this number, so raising it re-asks — an
 * acknowledgement of different text is not an acknowledgement of this one.
 */
export const CYCLE_DISCLAIMER_VERSION = 1

/**
 * The page's standing caveat, as points (owner, 2026-10-31: "make them into
 * points"). Ordered by what costs most to miss: the two things this page is
 * NOT, then when to see someone.
 */
export const CYCLE_DISCLAIMER: string[] = [
  'Educational only — not medical advice',
  'Temperature tracking is not contraception',
  'See a clinician for pain or heavy bleeding',
  'Also if cycles keep running under 21 or over 35 days',
]
