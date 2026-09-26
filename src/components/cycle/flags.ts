/**
 * The flags, and the hue each one keeps everywhere.
 *
 * One map, because the colour is the flag's identity across four places now —
 * the editor chips, the day list dots, the symptom-pattern rows and the BBT
 * chart's period shading. Every flag used to fill `red` when on, so a row read
 * as "something is marked" without saying what; the hues are what made the
 * dots legible without opening the day, and a second copy of them would be a
 * copy that drifts.
 */
export const FLAGS = ['period', 'spotting', 'ovulation', 'pms', 'cramps'] as const

export type Flag = typeof FLAGS[number]

export const FLAG_COLOR: Record<string, string> = {
  period: 'red',
  spotting: 'maroon',
  ovulation: 'green',
  pms: 'mauve',
  cramps: 'peach',
}

/**
 * What each mark records — the legend's second column, beside the swatch.
 *
 * Keyed off the same `FLAG_COLOR` keys and living in the same file on purpose:
 * a flag is a name, a hue and a meaning, and splitting the three across modules
 * is how a colour comes to mean two things. `FlagLegend` renders it; nothing
 * else needs it.
 *
 * This says what pressing the chip *means*, not what the word means. The word
 * is the glossary's job — `pms` carries an `<Abbr>` in the legend, so ACOG's
 * definition of the syndrome is one press away and is deliberately not restated
 * here. Why it is worth logging at all is `TRACKING_TIPS` in `lib/cycleGuide.ts`,
 * also once.
 */
export const FLAG_MEANS: Record<Flag, string> = {
  period: 'bleeding. The first day of a run is cycle day 1, and every number here counts from it.',
  spotting: 'light bleeding outside the period — a different event, not a lighter one.',
  ovulation: 'you think you ovulated (test, mucus, a twinge). The temperature chart confirms later.',
  pms: 'the premenstrual stretch. The pattern grid folds these to show which day yours starts.',
  cramps: 'pain, wherever it lands — cramps do not only happen while bleeding.',
}
