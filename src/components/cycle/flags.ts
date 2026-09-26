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
