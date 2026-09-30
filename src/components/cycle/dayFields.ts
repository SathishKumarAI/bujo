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

export interface ChipField {
  key: 'flow' | 'mucus' | 'lh' | 'intimacy'
  label: string
  /** Glossary term for the ⓘ, or undefined where the label says it all. */
  help?: string
  options: { value: string; label: string }[]
  /** Shown only when this flag is set on the day — flow is meaningless otherwise. */
  onlyWithFlag?: string
}

export const CHIP_FIELDS: ChipField[] = [
  {
    key: 'flow',
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
  help?: string
  options: string[]
}

export const TAG_FIELDS: TagField[] = [
  {
    key: 'moodTags',
    label: 'Mood tags',
    options: ['calm', 'happy', 'energetic', 'irritable', 'anxious', 'low', 'sensitive'],
  },
  {
    key: 'cravings',
    label: 'Cravings',
    help: 'cravings',
    options: ['sweet', 'salty', 'carbs', 'chocolate', 'bigger appetite'],
  },
  {
    key: 'symptoms',
    label: 'Symptoms',
    options: ['bloating', 'headache', 'breast tenderness', 'acne', 'back pain', 'nausea', 'poor sleep', 'fatigue'],
  },
]

/** The two 1–5 scales, which share a component and differ only in their ends. */
export const SCALE_FIELDS = [
  { key: 'mood' as const, label: 'Mood', low: 'low', high: 'great', help: 'mood' },
  { key: 'energy' as const, label: 'Energy', low: 'drained', high: 'energised' },
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
