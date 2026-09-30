/**
 * THE GUIDE, as a manual rather than a shelf of cards.
 *
 * Nine sections with stable ids, because the `InfoTip`s link into them — a tip
 * that says "Learn more" and lands nowhere is worse than one that does not
 * offer. `cycleHelp.more` holds these ids and a test asserts every one of them
 * resolves to a section here.
 *
 * Content, not components: this is prose with headings, so putting it in a TS
 * module keeps it greppable, testable and out of the JSX. The existing
 * `CYCLE_PHASES` cards in `cycleGuide.ts` are untouched and still render — this
 * is the reading matter around them.
 */

export interface ManualSection {
  id: string
  title: string
  /** Paragraphs. Plain, second person, short sentences. */
  body: string[]
  /** Optional bullet list under the body. */
  points?: string[]
}

export const CYCLE_MANUAL: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    body: [
      'Two things every morning: your temperature before you get up, and a tap on anything that happened. That is about ten seconds, and it is enough for everything on this page to work.',
      'Everything else is optional. Mucus, tests, mood, cravings, symptoms — log the ones you care about and ignore the rest. Nothing here penalises a blank field; a day you did not log is treated as “not logged”, never as “no”.',
      'The page learns from you rather than from a textbook. Your average cycle length, your luteal length, the day your PMS tends to start — all of it comes from your own entries, and all of it gets more accurate as you add cycles.',
    ],
  },
  {
    id: 'taking-your-temperature',
    title: 'Taking your temperature',
    body: [
      'Take it as soon as you wake, before getting up, talking, or drinking. Ideally after at least three hours of sleep and at about the same time each day, with the same thermometer.',
      'Consistency matters more than the number. The chart is read for the shift between one half of the cycle and the other, so a reading taken an hour late is worse than one that is slightly high — it moves the baseline you are comparing against.',
      'When something could skew a reading — illness, a fever, alcohol, travel, a short night, taking it much later than usual — mark it “not reliable”. Those days are left out of ovulation detection entirely, which is better than letting one bad morning invent or erase a shift.',
      'You can log in °F or °C. The backup file records which one your readings are in, so a restore cannot silently reinterpret them.',
    ],
  },
  {
    id: 'reading-your-chart',
    title: 'Reading your chart',
    body: [
      'A cycle has two halves. Before ovulation your waking temperature sits low; after it, progesterone holds it about 0.3–0.5 °F (0.2–0.3 °C) higher until your next period. That two-level shape is what the chart is for.',
      'The coverline is drawn just above your pre-shift readings. Three readings clearly above it mean the rise already happened — it is a retrospective mark, never a forecast.',
      'The confidence beside your phase says how the page knows. “Estimated” is the calendar only. “Likely” means a temperature shift was read this cycle. “Confirmed” means the shift plus another sign — an LH test or fertile mucus — agreed with it.',
      'The luteal phase is the stable half. For most people it is 11 to 17 days and barely moves, so a longer cycle is almost always a longer first half. That is why a prediction built from your own luteal length beats one built from a textbook 14.',
    ],
  },
  {
    id: 'fertility-signs',
    title: 'Fertility signs',
    body: [
      'Three signs, answering different questions. Cervical mucus changes through the cycle and turns watery, or stretchy and clear — “egg-white” — in the days before ovulation. That is the most fertile sign, and it appears before the event.',
      'An LH test detects a hormone surge that usually happens 24–36 hours before ovulation. It predicts. The temperature shift confirms, afterwards. Neither alone is as good as both together.',
      'The fertile window is the five days before ovulation plus ovulation day itself — wide because sperm survive up to five days while the egg survives about one. It is an estimate from your own data, and it is not contraception.',
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns, mood and cravings',
    body: [
      'The pattern grid folds every cycle you have logged onto one axis. Each row is something you log; each column is a cycle day; darker means it happened more often on that day.',
      'It needs at least three cycles. One cycle is an anecdote and two is a coincidence — a grid drawn from either invites you to see a pattern that is not there, so the page shows nothing instead and says why.',
      'You can line cycles up by period start or by ovulation, and they answer different questions. If your cycle length varies, a symptom that always lands three days before your period smears across a week when aligned by day 1, and stacks into a single column when aligned by ovulation.',
      'Mood and energy are shown inverted in the grid — darker means lower — so a dark band is where they dip.',
    ],
  },
  {
    id: 'nutrition',
    title: 'Nutrition by phase',
    body: [
      'General wellness information, not a diet plan and not a prescription. There are no targets here on purpose.',
    ],
    points: [
      'Menstrual — iron-rich foods paired with vitamin C; fluids.',
      'Follicular — protein, vegetables, fermented foods.',
      'Ovulation window — zinc sources, colourful produce.',
      'Luteal — magnesium-rich foods, complex carbohydrates, steady meal timing; it helps with cravings.',
      'Trying to conceive — folate, choline and omega-3 sources, and talk to a clinician about a prenatal vitamin.',
    ],
  },
  {
    id: 'clinician',
    title: 'When to talk to a clinician',
    body: [
      'None of this is a diagnosis. These are the things worth raising with someone qualified, and raising one of them early costs nothing.',
    ],
    points: [
      'Cycles regularly shorter than 21 days or longer than 35.',
      'Cycle length varying by more than 7 to 9 days.',
      'Periods lasting more than 7 days.',
      'Soaking a pad or tampon every hour for several hours.',
      'Bleeding between periods, or after sex.',
      'Severe pain that stops you doing normal things.',
      'No period for 90 days, when you are not pregnant.',
      'Trying to conceive for 12 months without success — or 6 months if you are 35 or older.',
      'Any bleeding after menopause.',
    ],
  },
  {
    id: 'privacy',
    title: 'Your data and privacy',
    body: [
      'Your cycle data stays on this device. It is saved only in this browser’s local storage, and it is excluded from every sync path this app has — the encrypted cloud, a self-hosted server, a GitHub gist. There is no setting that turns that off.',
      'That also means you are responsible for it. If you clear your browser data, use private browsing, switch browsers, or lose this device, it is gone and nobody can recover it for you. Export a backup regularly and keep the file somewhere safe.',
      'Import offers Replace or Merge, and Merge keeps what is already on this device where the dates collide. Delete all cycle data takes two steps and returns you to the welcome screen.',
      'In a private window, storage may be unavailable entirely — the page says so rather than quietly failing to save.',
      'And once more, because it is the thing that matters: this is not contraception, and it is not medical advice.',
    ],
  },
  {
    id: 'limitations',
    title: 'Limitations',
    body: [
      'Predictions rely on consistent logging. A cycle with four readings cannot show a shift, and the page says “estimated” rather than guessing.',
      'Illness, stress, travel, disrupted sleep, breastfeeding, recent hormonal contraception, PCOS, thyroid conditions and perimenopause can all make cycles and temperature patterns irregular. A chart that does not look like the textbook is common, and is not itself a problem.',
      'Everything here describes what you recorded. It cannot see what you did not.',
    ],
  },
]

export const MANUAL_IDS = CYCLE_MANUAL.map((s) => s.id)
