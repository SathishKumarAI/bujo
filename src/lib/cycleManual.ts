/**
 * THE GUIDE, as points rather than prose.
 *
 * Rewritten from paragraphs after the first version shipped as a reading
 * column. The reason is the product's own mode: `PRODUCT.md` says **Operate** —
 * someone opens this page to do something, on a phone, in the evening. Prose is
 * for Read surfaces. A person checking what a disturbed reading means wants the
 * line that answers it, not the third sentence of a paragraph.
 *
 * So every section is a short intro plus discrete points, and each point is one
 * fact that stands on its own. `takeaway` is the sentence to remember if the
 * reader reads nothing else in the card.
 *
 * Nine sections with stable ids, because the `InfoTip`s link into them — a tip
 * that says "Learn more" and lands nowhere is worse than one that does not
 * offer. A test asserts every `more` resolves to a section here.
 */

export interface ManualSection {
  id: string
  title: string
  /** One line under the heading. What this section is for. */
  intro: string
  /** The content. One fact per point; each reads on its own. */
  points: { label: string; text: string }[]
  /** The line to remember if nothing else is read. */
  takeaway?: string
}

export const CYCLE_MANUAL: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    intro: 'Two things a morning is enough for everything on this page to work.',
    points: [
      { label: 'Temperature first', text: 'Before you get up, before you talk or drink. About five seconds.' },
      { label: 'Tap what happened', text: 'Period, spotting, cramps, PMS — the five flags cover most days.' },
      { label: 'Everything else is optional', text: 'Mood, energy, mucus, tests, cravings. Log the ones you care about.' },
      { label: 'A blank field costs nothing', text: 'A day you did not log reads as “not logged”, never as “no”.' },
      { label: 'It learns from you', text: 'Your averages, your luteal length, the day your PMS starts — all from your own entries.' },
    ],
    takeaway: 'Ten seconds a morning. The page does the rest.',
  },
  {
    id: 'taking-your-temperature',
    title: 'Taking your temperature',
    intro: 'Consistency matters more than the number — the chart is read for the shift, not the value.',
    points: [
      { label: 'Same time each day', text: 'Ideally after at least three hours of sleep, before getting up.' },
      { label: 'Same thermometer', text: 'Two devices differ by more than the shift you are looking for.' },
      { label: 'Before anything else', text: 'Talking, drinking and standing up all move the reading.' },
      { label: 'Mark a bad morning', text: 'Illness, fever, alcohol, travel, a short night, or taken much later than usual.' },
      { label: 'Marked days are excluded', text: 'They are left out of ovulation detection entirely, rather than being allowed to invent or erase a shift.' },
      { label: '°F or °C', text: 'Either. The backup file records which, so a restore cannot reinterpret your readings.' },
    ],
    takeaway: 'A reading taken an hour late is worse than one that is slightly high.',
  },
  {
    id: 'reading-your-chart',
    title: 'Reading your chart',
    intro: 'A cycle has two temperature levels. The step between them is the whole point.',
    points: [
      { label: 'Low, then high', text: 'Before ovulation your waking temperature sits low; after it, progesterone holds it about 0.3–0.5 °F (0.2–0.3 °C) higher until your period.' },
      { label: 'The coverline', text: 'Drawn just above your pre-shift readings. Three readings clearly above it mean the rise already happened.' },
      { label: 'It is retrospective', text: 'A temperature chart can confirm ovulation. It cannot forecast it.' },
      { label: 'Estimated', text: 'Calendar only — no shift has been read this cycle.' },
      { label: 'Likely', text: 'A temperature shift was found.' },
      { label: 'Confirmed', text: 'The shift plus another sign — an LH test or fertile mucus — agreed with it.' },
      { label: 'The luteal half is the stable one', text: 'Usually 11–17 days and barely moves, so a longer cycle is almost always a longer first half.' },
    ],
    takeaway: 'A prediction built from your own luteal length beats one built from a textbook 14.',
  },
  {
    id: 'fertility-signs',
    title: 'Fertility signs',
    intro: 'Three signs, answering different questions. Two predict; one confirms.',
    points: [
      { label: 'Cervical mucus', text: 'Turns watery, or stretchy and clear — “egg-white” — in the days before ovulation. The most fertile sign, and it appears before the event.' },
      { label: 'LH test', text: 'Detects a surge that usually happens 24–36 hours before ovulation. It predicts.' },
      { label: 'Temperature', text: 'Confirms, afterwards. Neither alone is as good as both together.' },
      { label: 'The fertile window', text: 'The five days before ovulation plus ovulation day — wide because sperm survive up to five days and the egg about one.' },
      { label: 'It is not contraception', text: 'An estimate from your own data, and nothing more than that.' },
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns, mood and cravings',
    intro: 'Every cycle you have logged, folded onto one axis.',
    points: [
      { label: 'Rows and columns', text: 'Each row is something you log; each column is a cycle day. Darker means it happened more often on that day.' },
      { label: 'Three cycles minimum', text: 'One is an anecdote and two is a coincidence, so the page shows nothing until three and says why.' },
      { label: 'Line up by period start', text: 'The default. Answers “where in my cycle does this land”.' },
      { label: 'Or by ovulation', text: 'Answers “how long before my period”. If your cycle length varies, this is the view where luteal symptoms stack into one column instead of smearing across a week.' },
      { label: 'Mood and energy are inverted', text: 'Darker means lower, so a dark band is where they dip.' },
    ],
    takeaway: 'The grid answers what a calendar cannot: not when, but what tends to happen and when.',
  },
  {
    id: 'nutrition',
    title: 'Nutrition by phase',
    intro: 'General wellness information. Not a diet plan, and deliberately without targets.',
    points: [
      { label: 'Menstrual', text: 'Iron-rich foods paired with vitamin C; fluids.' },
      { label: 'Follicular', text: 'Protein, vegetables, fermented foods.' },
      { label: 'Ovulation window', text: 'Zinc sources, colourful produce.' },
      { label: 'Luteal', text: 'Magnesium-rich foods, complex carbohydrates, steady meal timing — it helps with cravings.' },
      { label: 'Trying to conceive', text: 'Folate, choline and omega-3 sources. Talk to a clinician about a prenatal vitamin.' },
    ],
  },
  {
    id: 'clinician',
    title: 'When to talk to a clinician',
    intro: 'None of this is a diagnosis. Raising one of these early costs nothing.',
    points: [
      { label: 'Cycle length', text: 'Regularly shorter than 21 days or longer than 35.' },
      { label: 'Cycle variation', text: 'Varying by more than 7 to 9 days.' },
      { label: 'Period length', text: 'Lasting more than 7 days.' },
      { label: 'Heavy bleeding', text: 'Soaking a pad or tampon every hour for several hours.' },
      { label: 'Bleeding between periods', text: 'Or after sex.' },
      { label: 'Severe pain', text: 'Pain that stops you doing normal things.' },
      { label: 'No period for 90 days', text: 'When you are not pregnant.' },
      { label: 'Trying to conceive', text: '12 months without success — or 6 months if you are 35 or older.' },
      { label: 'Any bleeding after menopause', text: 'Worth a call on its own.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Your data and privacy',
    intro: 'It stays on this device. That is a promise with a consequence attached.',
    points: [
      { label: 'Nothing is uploaded', text: 'Excluded from every sync path this app has — the encrypted cloud, a self-hosted server, a gist. There is no setting that turns that off.' },
      { label: 'Nobody can recover it', text: 'Clear your browser data, use private browsing, switch browsers or lose this device and it is gone.' },
      { label: 'Export regularly', text: 'A dated JSON file. It is the only copy that survives a cleared browser.' },
      { label: 'Merge keeps what is here', text: 'On import, Merge wins for dates already on this device. Replace does not.' },
      { label: 'Delete is two steps', text: 'And returns you to the welcome screen.' },
      { label: 'Private windows', text: 'Storage may be unavailable entirely — the page says so rather than quietly failing to save.' },
    ],
    takeaway: 'This is not contraception, and it is not medical advice.',
  },
  {
    id: 'limitations',
    title: 'Limitations',
    intro: 'What this page cannot tell you, stated plainly.',
    points: [
      { label: 'It needs readings', text: 'A cycle with four temperatures cannot show a shift, and the page says “estimated” rather than guessing.' },
      { label: 'Life moves the chart', text: 'Illness, stress, travel and disrupted sleep all shift waking temperature.' },
      { label: 'So do conditions', text: 'Breastfeeding, recent hormonal contraception, PCOS, thyroid conditions and perimenopause can all make cycles and temperature patterns irregular.' },
      { label: 'Irregular is common', text: 'A chart that does not look like the textbook is not itself a problem.' },
      { label: 'It sees only what you recorded', text: 'It cannot see what you did not.' },
    ],
  },
]

export const MANUAL_IDS = CYCLE_MANUAL.map((s) => s.id)
