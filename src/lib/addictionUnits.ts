/**
 * WHAT "HOW MUCH" MEANS, PER ADDICTION.
 *
 * The lapse log counted occurrences and only occurrences, which is the right
 * measurement for some of these and the wrong one for others:
 *
 * | Thing | "3 lapses" means | What you actually want to know |
 * |---|---|---|
 * | Smoking | 3 cigarettes | how many |
 * | Masturbation | 3 times | how many |
 * | Doomscrolling | 3 *what?* | **how long** |
 * | Social media | 3 *what?* | **how long** |
 * | Alcohol | 3 drinks | how many |
 * | Junk food | 3 portions | how much |
 *
 * For half the list the count was meaningless: three sessions of scrolling is
 * twenty minutes or four hours, and the page could not tell the difference. So
 * an addiction carries a UNIT, and the amount is recorded in it.
 *
 * ## Why this is not a migration
 *
 * `Relapse.count` already holds a number and already defaults to 1. The default
 * unit is `times`, under which `count` means exactly what it always meant. Every
 * journal written before this reads correctly; only addictions whose unit is
 * changed start recording something different, and only from that point on.
 *
 * ## Why duration units matter more than they look
 *
 * A count tells you how often. A duration tells you **what it cost**, and that
 * is the number that moves people: "14 hours on your phone this month" lands in
 * a way "31 sessions" never does. `kind: 'duration'` is what lets the ledger
 * total that up and say it in hours.
 */

export type UnitKind = 'count' | 'duration'

export interface Unit {
  id: string
  /** Singular noun, for "1 cigarette". */
  one: string
  /** Plural, for "14 cigarettes". */
  many: string
  kind: UnitKind
  /** How much one tap of + adds. Minutes step by 15; cigarettes by 1. */
  step: number
  /** Minutes per unit, for duration units, so totals can be summed. */
  minutes?: number
  /**
   * Amounts offered as one-tap buttons.
   *
   * The `+` step alone is the wrong affordance for anything that comes in
   * large numbers: logging three hours of scrolling meant tapping + twelve
   * times, and a control that tedious gets abandoned or guessed at, which
   * makes the data worse than not collecting it. These are the amounts people
   * actually report — a smoke break, an evening, a packet.
   */
  quick: number[]
}

export const UNITS: Unit[] = [
  { id: 'times', one: 'time', many: 'times', kind: 'count', step: 1, quick: [1, 2, 3, 5] },
  { id: 'cigarettes', one: 'cigarette', many: 'cigarettes', kind: 'count', step: 1, quick: [1, 3, 5, 10, 20] },
  { id: 'drinks', one: 'drink', many: 'drinks', kind: 'count', step: 1, quick: [1, 2, 4, 6] },
  { id: 'portions', one: 'portion', many: 'portions', kind: 'count', step: 1, quick: [1, 2, 3] },
  // 15 minutes, not 1: nobody taps + sixty times, and a scroll is not measured
  // to the minute. The readout is still editable for the honest 7-minute answer.
  { id: 'minutes', one: 'minute', many: 'minutes', kind: 'duration', step: 15, minutes: 1, quick: [15, 30, 60, 120, 180] },
  { id: 'hours', one: 'hour', many: 'hours', kind: 'duration', step: 1, minutes: 60, quick: [1, 2, 3, 5] },
]

const BY_ID = new Map(UNITS.map((u) => [u.id, u]))

/** `times` is the fallback, which is what `count` has always meant. */
export function unitOf(id?: string): Unit {
  return BY_ID.get(id ?? '') ?? UNITS[0]
}

/**
 * The default unit for a preset name.
 *
 * Only presets are mapped: a user's own addiction name cannot be guessed at, and
 * guessing wrong is worse than asking. Everything unmapped gets `times`, which
 * is never *wrong* — only less specific.
 */
const PRESET_UNIT: Record<string, string> = {
  Nicotine: 'cigarettes',
  Vaping: 'times',
  Alcohol: 'drinks',
  Cannabis: 'times',
  Porn: 'times',
  Masturbation: 'times',
  Doomscrolling: 'minutes',
  'Social media': 'minutes',
  'Short-form video': 'minutes',
  Gaming: 'minutes',
  'Binge watching': 'minutes',
  News: 'minutes',
  'Junk food': 'portions',
  Sugar: 'portions',
  'Late-night snacking': 'portions',
  'Energy drinks': 'drinks',
  Caffeine: 'drinks',
  'Online shopping': 'times',
  Gambling: 'times',
  'Nail biting': 'times',
}

export function defaultUnitFor(name: string): string {
  return PRESET_UNIT[name] ?? 'times'
}

/** "14 cigarettes", "1 hour", "45 minutes". */
export function formatAmount(amount: number, unitId?: string): string {
  const u = unitOf(unitId)
  const n = Math.round(amount * 10) / 10
  return `${n} ${n === 1 ? u.one : u.many}`
}

/**
 * Total duration in minutes across amounts of a duration unit, or null when the
 * unit does not measure time.
 *
 * `null` rather than 0 on purpose: "no time lost" and "this is not measured in
 * time" are different facts, and a card that prints "0 hours" for cigarettes is
 * stating the second as if it were the first.
 */
export function totalMinutes(amount: number, unitId?: string): number | null {
  const u = unitOf(unitId)
  return u.kind === 'duration' && u.minutes != null ? amount * u.minutes : null
}

/** "2h 45m", "45m", "3h" — for a total that has grown past minutes. */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`
}

/**
 * A compact label for a quick-add button: `15m`, `2h`, `20`.
 *
 * Duration units collapse into hours past 60 minutes, because "120m" is a
 * number you have to convert and "2h" is one you read. Count units are bare
 * numerals — the unit is already stated once above the row, and repeating it on
 * five adjacent buttons is noise.
 */
export function quickLabel(amount: number, unitId?: string): string {
  const u = unitOf(unitId)
  if (u.kind !== 'duration') return String(amount)
  const mins = amount * (u.minutes ?? 1)
  return mins >= 60 && mins % 60 === 0 ? `${mins / 60}h` : `${mins}m`
}
