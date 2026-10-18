/**
 * THE OPTIONAL HALF OF A DAY, described once.
 *
 * Every field the "More for today" section offers: its label, its values, and
 * the help key that explains it. One file, because a value list, the label it
 * renders under and the tip that defines it are three views of the same fact —
 * and this repo has the scars from keeping those in three places (`flags.ts`
 * exists for exactly this reason, one level up).
 *
 * The orders are not arbitrary. Mucus runs dry → egg-white because that is the
 * direction of the cycle and the last value is the fertile one; flow runs light
 * → very heavy; LH runs not-taken → peak. A segment scale reads as a progression
 * and rendering one of these unordered would imply a ranking that is not there.
 */

/**
 * THE THREE QUESTIONS THE PANEL ASKS, in the order it asks them.
 *
 * Nine chip groups rendered as nine peers — same weight, same spacing, no
 * heading between them — is **~900px of flat stack** in a 424px column, and a
 * flat list of nine is a thing you scan rather than read. Reported as
 * "improve the UI of this", pasted as the nine legends in a row, which is
 * exactly how it reads on screen.
 *
 * They are not nine things. They are three: how you felt, what your body did,
 * and the cycle signs. The grouping is DATA and not a heading typed into the
 * view, for the reason this file exists at all — a field's label, its values
 * and the family it belongs to are three views of one fact, and this repo has
 * the scars from keeping those apart.
 *
 * `fertilityFirst` reorders the SECTIONS now rather than the fields inside
 * them, which is the same intent with a shape the reader can see.
 */
export type FieldSection = 'felt' | 'body' | 'signs'

export const FIELD_SECTIONS: { id: FieldSection; title: string }[] = [
  { id: 'felt', title: 'How you felt' },
  { id: 'body', title: 'What your body did' },
  { id: 'signs', title: 'Cycle signs' },
]

export interface ChipField {
  key: 'flow' | 'mucus' | 'lh' | 'intimacy'
  label: string
  section: FieldSection
  /** Glossary term for the ⓘ, or undefined where the label says it all. */
  help?: string
  options: { value: string; label: string }[]
  /** Shown only when this flag is set on the day — flow is meaningless otherwise. */
  onlyWithFlag?: string
}

export const CHIP_FIELDS: ChipField[] = [
  {
    key: 'flow',
    section: 'signs',
    label: 'Flow',
    help: 'flow',
    onlyWithFlag: 'period',
    options: [
      { value: 'light', label: 'light' },
      { value: 'medium', label: 'medium' },
      { value: 'heavy', label: 'heavy' },
      { value: 'very-heavy', label: 'very heavy' },
    ],
  },
  {
    key: 'mucus',
    section: 'signs',
    label: 'Cervical mucus',
    help: 'cervical mucus',
    options: [
      { value: 'dry', label: 'dry' },
      { value: 'sticky', label: 'sticky' },
      { value: 'creamy', label: 'creamy' },
      { value: 'watery', label: 'watery' },
      { value: 'egg-white', label: 'egg-white' },
    ],
  },
  {
    key: 'lh',
    section: 'signs',
    label: 'LH test',
    help: 'LH test',
    options: [
      { value: 'not-taken', label: 'not taken' },
      { value: 'negative', label: 'negative' },
      { value: 'positive', label: 'positive' },
      { value: 'peak', label: 'peak' },
    ],
  },
  {
    key: 'intimacy',
    section: 'signs',
    label: 'Intimacy',
    options: [
      { value: 'none', label: 'none' },
      { value: 'protected', label: 'protected' },
      { value: 'unprotected', label: 'unprotected' },
    ],
  },
]

export interface TagField {
  key: 'moodTags' | 'cravings' | 'symptoms'
  label: string
  section: FieldSection
  help?: string
  options: string[]
}

export const TAG_FIELDS: TagField[] = [
  {
    key: 'moodTags',
    section: 'felt',
    label: 'Mood tags',
    options: ['calm', 'happy', 'energetic', 'irritable', 'anxious', 'low', 'sensitive'],
  },
  {
    key: 'cravings',
    section: 'body',
    label: 'Cravings',
    help: 'cravings',
    options: ['sweet', 'salty', 'carbs', 'chocolate', 'bigger appetite'],
  },
  {
    key: 'symptoms',
    section: 'body',
    label: 'Symptoms',
    options: ['bloating', 'headache', 'breast tenderness', 'acne', 'back pain', 'nausea', 'poor sleep', 'fatigue'],
  },
]

/** The two 1–5 scales, which share a component and differ only in their ends. */
/**
 * The 1–5 self-ratings, with a word per step.
 *
 * `words` is what the chosen number MEANS, and it is the half a rank cannot
 * carry on its own: the endpoints define 1 and 5, and 3 — the value people
 * pick most — is defined by nothing. Asked for as "if I scroll to three, you
 * should say you're energetic".
 *
 * Five words each, in option order, and deliberately plain: these are read
 * back to someone about their own day, so "fine" beats "moderate" and
 * nothing here is a judgement. `low`/`high` stay because they label the ends
 * of the track whether or not anything is chosen.
 */
export const SCALE_FIELDS = [
  {
    key: 'mood' as const,
    section: 'felt' as FieldSection,
    label: 'Mood',
    low: 'low',
    high: 'great',
    help: 'mood',
    words: ['rough', 'low', 'fine', 'good', 'great'],
  },
  {
    key: 'energy' as const,
    section: 'felt' as FieldSection,
    label: 'Energy',
    low: 'drained',
    high: 'energised',
    words: ['drained', 'tired', 'steady', 'lively', 'energised'],
  },
]

/**
 * Compact glyphs for the temperature table's one extra column.
 *
 * The table already carries date, cycle day, temperature and up to five flag
 * dots. A column per new field would make it unreadable, so mucus and LH — the
 * two that a chart reader actually cross-references against the temperature —
 * share one narrow column, and everything else stays in the day editor.
 *
 * Glyphs, not colour: this column sits beside five coloured dots already, and a
 * sixth hue would be read as a sixth flag.
 */
export const MUCUS_GLYPH: Record<string, string> = {
  dry: '·',
  sticky: ':',
  creamy: '∴',
  watery: '≈',
  'egg-white': '◇',
}

export const LH_GLYPH: Record<string, string> = {
  'not-taken': '',
  negative: '−',
  positive: '+',
  peak: '✦',
}
