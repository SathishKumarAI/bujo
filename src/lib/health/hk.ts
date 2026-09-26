/**
 * THE MAPPING · which HealthKit identifiers this app can use, and where each
 * one lands. **Stated as data, in one table, on purpose.**
 *
 * A mapping scattered through a parser is a mapping nobody can audit. This
 * table is the whole answer to "what does an Apple Health import actually
 * write", it is what `docs/import/apple-health.md` is generated from by hand,
 * and it is what the test asserts against. Adding an identifier is one row.
 *
 * What is NOT here is as load-bearing as what is:
 *
 * | Left out | Why |
 * |---|---|
 * | `HeartRateVariabilitySDNN`, `VO2Max`, blood pressure, glucose, SpO₂, ECG | Nothing in the app reads them. A field nothing reads is a schema promise taken on for free |
 * | `DistanceWalkingRunning` day totals | Would double-count against `Workout.distanceKm` |
 * | `AppleExerciseTime` / `AppleStandTime` | Workouts already carry minutes; a second, differently-derived "active minutes" puts two numbers that disagree on one screen |
 * | Sleep stages (REM / Core / Deep) | `DailyMetric.sleep` is one number. Stages are collapsed into it and the preview says so |
 * | Per-workout heart-rate series | One year of samples is larger than the entire measured ten-year journal (2.35 MB) |
 * | `workout-routes/*.gpx` | The routes name the user's home and no field consumes them. The only safe handling of data you have no use for is not opening it |
 * | `Me` (date of birth, sex, blood type) | Nothing consumes it. Don't hold what you don't use |
 *
 * Units: **every rule reads the sample's own `unit` attribute.** The same
 * journal can hold `kg` and `lb` body-mass records if the user switched units
 * or used two apps, so the type's canonical unit is not a fact about any
 * individual record. `convert` below is the only place a number changes scale.
 *
 * See `docs/import/apple-health-research.md` for where these figures come from.
 */

/** What a day's worth of samples for one identifier is reduced to. */
export type Reduce =
  /** Every sample added up — steps, energy burned, food eaten. */
  | 'sum'
  /** The mean of the day's samples — resting heart rate. */
  | 'mean'
  /** The last reading of the day — weight, body fat. A scale used twice, the later one is current. */
  | 'last'
  /**
   * The EARLIEST reading of the day.
   *
   * Only basal body temperature uses this, and it is the whole correctness
   * argument for the BBT chart: a basal temperature is *defined* as the one
   * taken immediately on waking, before moving, eating or drinking. A later
   * reading on the same day is a body temperature, not a basal temperature —
   * averaging it in, or letting it win as "last", produces a curve whose
   * ovulation shift is noise. First-of-day is the only reduction that keeps
   * the measurement being the measurement.
   */
  | 'first'

/** Which journal collection a rule writes into. */
export type Target = 'metric' | 'body' | 'measurement' | 'cycle' | 'sleep'

export interface HKRule {
  /** The `type` attribute, verbatim, minus the `HKQuantityTypeIdentifier` / `HKCategoryTypeIdentifier` prefix. */
  readonly id: string
  /** `Quantity` or `Category` — the prefix, and whether `value` is a number or an enum string. */
  readonly kind: 'quantity' | 'category'
  readonly target: Target
  /** Field on the envelope record. `sleep` and `cycle` resolve their own. */
  readonly field: string
  readonly reduce: Reduce
  /** Units seen in real exports. The sample's own attribute decides; this documents the range to expect. */
  readonly units: readonly string[]
  /** One line, shown to the user in the import preview. */
  readonly label: string
}

/**
 * The prefix a `type` attribute carries. Both are stripped before lookup, so
 * `MAPPING` is keyed on the bare identifier and reads as a table.
 */
export const HK_PREFIX = {
  quantity: 'HKQuantityTypeIdentifier',
  category: 'HKCategoryTypeIdentifier',
} as const

export const MAPPING: readonly HKRule[] = [
  // ── The one the feature exists for ──────────────────────────────────────
  {
    id: 'BasalBodyTemperature', kind: 'quantity', target: 'cycle', field: 'tempC',
    reduce: 'first', units: ['degF', 'degC'],
    label: 'Basal body temperature → the temperature chart on Cycle',
  },
  {
    // Deliberately a SEPARATE rule with a separate target field, resolved
    // separately in `aggregate.ts` and off by default. Basal and general body
    // temperature are different measurements: one is taken on waking before
    // moving, the other is taken whenever you felt warm. Mixing them corrupts
    // the biphasic shift the chart is read for, which is the only reason the
    // chart exists. See `AggregateOptions.useBodyTemperature`.
    id: 'BodyTemperature', kind: 'quantity', target: 'cycle', field: 'bodyTempC',
    reduce: 'first', units: ['degF', 'degC'],
    label: 'Body temperature → only if you ask for it, and only on days with no basal reading',
  },

  // ── Day metrics ─────────────────────────────────────────────────────────
  { id: 'StepCount', kind: 'quantity', target: 'metric', field: 'steps', reduce: 'sum', units: ['count'], label: 'Steps → your daily step count' },
  { id: 'ActiveEnergyBurned', kind: 'quantity', target: 'metric', field: 'activeKcal', reduce: 'sum', units: ['kcal', 'Cal'], label: 'Active energy → calories burned' },
  { id: 'RestingHeartRate', kind: 'quantity', target: 'metric', field: 'restingHR', reduce: 'mean', units: ['count/min'], label: 'Resting heart rate' },
  { id: 'DietaryEnergyConsumed', kind: 'quantity', target: 'metric', field: 'calories', reduce: 'sum', units: ['kcal', 'Cal'], label: 'Calories eaten' },
  { id: 'DietaryProtein', kind: 'quantity', target: 'metric', field: 'protein', reduce: 'sum', units: ['g'], label: 'Protein' },
  { id: 'DietaryCarbohydrates', kind: 'quantity', target: 'metric', field: 'carbs', reduce: 'sum', units: ['g'], label: 'Carbohydrates' },
  { id: 'DietaryFatTotal', kind: 'quantity', target: 'metric', field: 'fat', reduce: 'sum', units: ['g'], label: 'Fat' },

  // ── Body ────────────────────────────────────────────────────────────────
  { id: 'BodyMass', kind: 'quantity', target: 'body', field: 'weightKg', reduce: 'last', units: ['kg', 'lb', 'st'], label: 'Weight → the weight trend on Gym' },
  { id: 'BodyFatPercentage', kind: 'quantity', target: 'body', field: 'bodyFat', reduce: 'last', units: ['%'], label: 'Body fat percentage' },
  { id: 'LeanBodyMass', kind: 'quantity', target: 'measurement', field: 'lean', reduce: 'last', units: ['kg', 'lb'], label: 'Lean body mass → a body measurement' },
  { id: 'WaistCircumference', kind: 'quantity', target: 'measurement', field: 'waist', reduce: 'last', units: ['cm', 'in', 'm'], label: 'Waist → a body measurement' },

  // ── Categories ──────────────────────────────────────────────────────────
  {
    // Not reduced per day like the rest: sleep arrives as overlapping
    // intervals that must be grouped into sessions and unioned. `reduce` is
    // 'sum' only to satisfy the type; `aggregate.ts` routes `target: 'sleep'`
    // to its own path and never calls a reducer on it.
    id: 'SleepAnalysis', kind: 'category', target: 'sleep', field: 'sleep', reduce: 'sum',
    units: [], label: 'Sleep → hours asleep, on the day you woke up',
  },
  { id: 'MenstrualFlow', kind: 'category', target: 'cycle', field: 'flags', reduce: 'last', units: [], label: 'Period → the flags on Cycle' },
] as const

/** Bare identifier → rule. Built once; the scanner hits this per record. */
export const RULES: ReadonlyMap<string, HKRule> = new Map(MAPPING.map((r) => [r.id, r]))

/**
 * A `type` attribute → its rule, or `undefined` for one of the hundreds of
 * identifiers this app has no field for.
 *
 * Kept as a function rather than a second map so the two prefixes are stated
 * once and an identifier carrying neither is rejected rather than half-matched.
 */
export function ruleFor(type: string): HKRule | undefined {
  for (const kind of ['quantity', 'category'] as const) {
    const prefix = HK_PREFIX[kind]
    if (type.startsWith(prefix)) {
      const rule = RULES.get(type.slice(prefix.length))
      return rule?.kind === kind ? rule : undefined
    }
  }
  return undefined
}

// ── Unit conversion ───────────────────────────────────────────────────────

export const KG_PER_LB = 0.453_592_37
const KG_PER_ST = 6.350_293_18
const CM_PER_IN = 2.54

/**
 * A sample's value in the canonical unit its field expects, or `null` when the
 * unit is one this app cannot convert.
 *
 * **`null`, never a pass-through.** A `lb` value written into a field that
 * means kilograms is silent corruption of exactly the kind
 * `migrateWorkoutsToV3` exists to clean up after — so an unrecognised unit
 * drops the sample and is counted, rather than being hoped about. The counts
 * surface in the preview as "N samples in a unit we don't recognise".
 *
 * Canonical units, per field: `tempC`/`bodyTempC` → °C, `weightKg`/`lean` → kg,
 * `waist` → cm, `bodyFat` → percent 0–100, everything else → as exported.
 */
export function convert(rule: HKRule, value: number, unit: string): number | null {
  const u = unit.trim()
  switch (rule.field) {
    case 'tempC':
    case 'bodyTempC':
      if (u === 'degC' || u === 'C' || u === '°C') return value
      if (u === 'degF' || u === 'F' || u === '°F') return (value - 32) * 5 / 9
      return null
    case 'weightKg':
    case 'lean':
      if (u === 'kg') return value
      if (u === 'lb') return value * KG_PER_LB
      if (u === 'st') return value * KG_PER_ST
      return null
    case 'waist':
      if (u === 'cm') return value
      if (u === 'in') return value * CM_PER_IN
      if (u === 'm') return value * 100
      return null
    case 'bodyFat':
      // HealthKit's canonical percent unit is documented as a FRACTION
      // (0.185 = 18.5%) but exporters vary and some write 18.5 directly.
      // Whether a real file uses one or the other was never confirmed against
      // a live export (`apple-health-research.md` §8), so both are accepted on
      // a bound rather than on trust: no human has 0.8% body fat and no human
      // has 8,000%, so the reading is unambiguous either way. A value between
      // 1 and 70 is already a percentage; below 1 it is a fraction.
      if (u !== '%' && u !== '') return null
      return value <= 1 ? value * 100 : value
    case 'restingHR':
      return u === 'count/min' || u === '' ? value : null
    case 'steps':
      return u === 'count' || u === '' ? value : null
    case 'activeKcal':
    case 'calories':
      // `Cal` is what Health writes for a kilocalorie; `kcal` appears too.
      if (u === 'kcal' || u === 'Cal') return value
      if (u === 'kJ') return value / 4.184
      return null
    case 'protein':
    case 'carbs':
    case 'fat':
      if (u === 'g') return value
      if (u === 'mg') return value / 1_000
      return null
    default:
      return value
  }
}

// ── Workouts ──────────────────────────────────────────────────────────────

/**
 * `workoutActivityType` → this app's `ActivityKey`, for the types that map
 * **cleanly**. Anything not here is dropped and counted, never coerced to
 * `other`: `normalizeActivity` would happily turn an unrecognised activity
 * into a real-looking row, and at an import boundary that is a silent
 * downgrade of something the user could have corrected.
 *
 * Deliberately short. Apple ships ~80 activity types; this app has 18 keys and
 * only these ten are the same *thing* on both sides.
 */
export const WORKOUT_ACTIVITY: Readonly<Record<string, string>> = {
  HKWorkoutActivityTypeRunning: 'run',
  HKWorkoutActivityTypeCycling: 'cycle',
  HKWorkoutActivityTypeSwimming: 'swim',
  HKWorkoutActivityTypeRowing: 'row',
  HKWorkoutActivityTypeWalking: 'walk',
  HKWorkoutActivityTypeHiking: 'hike',
  HKWorkoutActivityTypeYoga: 'yoga',
  HKWorkoutActivityTypeHighIntensityIntervalTraining: 'hiit',
  HKWorkoutActivityTypeTraditionalStrengthTraining: 'strength',
  HKWorkoutActivityTypeFunctionalStrengthTraining: 'strength',
  HKWorkoutActivityTypePickleball: 'pickleball',
}

/** `duration` / `totalDistance` / `totalEnergyBurned` are unit-tagged too. */
export function toMinutes(value: number, unit: string): number | null {
  if (unit === 'min') return value
  if (unit === 's' || unit === 'sec') return value / 60
  if (unit === 'hr' || unit === 'h') return value * 60
  return null
}

export function toKm(value: number, unit: string): number | null {
  if (unit === 'km') return value
  if (unit === 'mi') return value * 1.609_34
  if (unit === 'm') return value / 1_000
  if (unit === 'yd') return value * 0.000_914_4
  if (unit === 'ft') return value * 0.000_304_8
  return null
}

/**
 * The `HKCategoryValueSleepAnalysis*` strings that mean **asleep**.
 *
 * `InBed` is excluded on purpose and that exclusion is what stops the double
 * count: on watchOS 9+ the stages tile the asleep time exactly and `InBed` is
 * a superset of them, so keeping both counts the same minutes twice and
 * reports 14 hours for an 8-hour night. `Awake` is mid-session wakefulness,
 * not sleep. See `aggregate.ts` for the `InBed` fallback, which matters for
 * every export from before watchOS 9.
 */
export const ASLEEP_VALUES: readonly string[] = [
  'HKCategoryValueSleepAnalysisAsleepUnspecified',
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
]

export const IN_BED_VALUE = 'HKCategoryValueSleepAnalysisInBed'

/** Menstrual-flow enum → the free-text flags `CyclePoint.flags` already uses. */
export const FLOW_FLAG: Readonly<Record<string, string>> = {
  HKCategoryValueMenstrualFlowLight: 'period',
  HKCategoryValueMenstrualFlowMedium: 'period',
  HKCategoryValueMenstrualFlowHeavy: 'period',
  HKCategoryValueMenstrualFlowUnspecified: 'spotting',
  HKCategoryValueMenstrualFlowNone: '',
}
