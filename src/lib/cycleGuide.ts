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

export interface CyclePhase {
  id: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  name: string
  days: string
  color: string
  what: string
  feel: string
  tip: string
  /** What the cravings tend to be here. A tendency, never a prediction. */
  cravings: string
  /** What is worth eating and why. Orientation, not a prescription. */
  eat: string
  /** Where the `cravings`/`eat` claims come from. At least one, linked. */
  sources: GlossarySource[]
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
    cravings: 'Appetite tends to swing rather than climb: sugar and salt are the usual pull, while cramps, fatigue and a headache compete for attention. This is also the only stretch of the cycle with a measurable nutritional cost attached to it.',
    eat: 'Iron is the one to be deliberate about — red meat or liver, beans and lentils, nuts, dried apricots, fortified breakfast cereal. The NHS notes that people who lose a lot of blood in a period are at higher risk of iron-deficiency anaemia, which is often what "the first two days wipe me out" actually is. Warm food and steady fluids go down easier than a large plate.',
    sources: [{ label: 'NHS · Iron', url: 'https://www.nhs.uk/conditions/vitamins-and-minerals/iron/' }],
  },
  {
    id: 'follicular',
    name: 'Follicular',
    days: 'Days 1–13 (overlaps the period)',
    color: 'teal',
    what: 'Rising estrogen matures a follicle and rebuilds the uterine lining. Basal temperature sits in its lower range.',
    feel: 'Energy and mood typically climb after the period ends — many people feel their sharpest and strongest here.',
    tip: 'A good window for harder training and demanding work; recovery tends to be fastest in this phase.',
    cravings: 'The steadiest stretch for most people — cravings are usually least noticeable here, and appetite often sits at its lowest in the days just after the period ends.',
    eat: 'Fuel the training this phase is good for rather than chasing a cycle-specific diet: base meals on higher-fibre starchy carbohydrates (potatoes, wholegrain bread, rice, pasta) and keep protein in every one. That is the whole of the NHS balanced-diet guidance, and nothing phase-specific beats it — the phase decides how hard you train, not what a plate looks like.',
    sources: [{ label: 'NHS · Eating a balanced diet', url: 'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/' }],
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    days: 'Around day 14 (≈14 days before the next period)',
    color: 'green',
    what: 'The egg is released. Cervical mucus turns clear and stretchy; basal temperature rises ~0.3–0.5 °F (0.2–0.3 °C) just after and stays up.',
    feel: 'Some feel a one-sided twinge (mittelschmerz); energy and sociability often peak.',
    tip: 'The fertile window is roughly the five days before ovulation through the day after — the reason the temperature chart matters.',
    cravings: 'No distinctive craving pattern is well established around ovulation. Some people notice appetite dipping for a day or two; the phase is defined by fertility signs, not by appetite, and an app that named a food here would be ahead of the evidence.',
    eat: 'Nothing special, which is worth saying plainly — eat as you do in the follicular phase. The useful habit in these few days is a note rather than a food: cervical mucus turning clear and stretchy, which the NHS describes as the visible sign, and the temperature step that confirms the day afterwards.',
    sources: [{ label: 'NHS · Periods and fertility in the menstrual cycle', url: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/' }],
  },
  {
    id: 'luteal',
    name: 'Luteal',
    days: 'Days 15–28',
    color: 'mauve',
    what: 'Progesterone dominates and holds temperature in its higher range. If no pregnancy starts, hormones fall and the cycle restarts.',
    feel: 'PMS lives here — bloating, breast tenderness, mood dips and cravings, usually in the last week.',
    tip: 'Sleep and steady meals blunt PMS; scale training by feel rather than forcing peak sessions.',
    cravings: 'This is the phase cravings are actually documented in: the NHS lists "changes in appetite or food cravings" among the commonest PMS symptoms, and the pull in the last week is typically toward carbohydrate, sugar and salt.',
    eat: 'Smaller meals every two to three hours steady the swing better than three large ones. Calcium-rich food — milk, yoghurt, cheese or a fortified alternative — is the one specific the Office on Women\'s Health names for cravings, fatigue and low mood, and the same page suggests easing off caffeine, salt and sugar in the fortnight before a period. Regular aerobic activity is on that list too, which is why the training note above says scale rather than stop.',
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

export const CYCLE_DISCLAIMER =
  'Educational only — not medical advice, and temperature tracking is not contraception. Cycles vary; talk to a clinician about pain, heavy bleeding, or cycles consistently shorter than 21 or longer than 35 days.'
