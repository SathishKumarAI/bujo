/**
 * ACTIVITY REGISTRY · the single declarative source for what you can log.
 *
 * Before this file, four separate things decided what a workout form showed:
 * a hardcoded 9-item `<select>` in Fitness, a sticky `fitness.tab` string, the
 * persisted `split` field, and `activity === 'Home'` string equality scattered
 * across three modules. Nothing tied them together, so the form rendered a
 * strength "sets" box while Cardio was selected and a distance stepper for
 * Pickleball — not as a slip, but because no code existed that *could* know
 * better.
 *
 * The fix is to make mode a property of the activity rather than a state of the
 * UI. `modeOf()` is the only way to ask, field visibility reads `required`, and
 * a component that wants to special-case cardio has nowhere to put the
 * condition. The bug class is gone by construction, not by patch.
 *
 * MODE IS NEVER STORED. It is derived from `activity` on every read. A session
 * that carried a mode field could disagree with its own activity; one that
 * derives it cannot.
 */

/**
 * Which shape of training this is. Derived, never persisted.
 *
 * `sport` is the third shape and not a flavour of cardio: a game is bounded by
 * a scoreboard rather than a distance, so it asks for duration and nothing
 * else. Pickleball sat under Cardio and was offered a distance field it could
 * never sensibly fill — the same field-visibility mismatch this registry
 * exists to prevent, one level up.
 */
export type Mode = 'cardio' | 'strength' | 'sport'

/** The numeric/structured fields an activity needs to be worth logging. */
export type RequiredField = 'durationMin' | 'distanceKm' | 'sets'

/** Which headline stat the summary strip shows for this activity. */
export type BestStat = 'pace' | 'distance' | 'duration' | 'volume' | 'maxReps'

export interface Activity {
  label: string
  mode: Mode
  required: RequiredField[]
  best: BestStat
}

/**
 * Distance is `distanceKm` — kilometres are the canonical storage unit and the
 * display unit (mi by default) is a `settings.distanceUnit` concern, converted
 * at the form boundary. See `lib/units.ts`.
 *
 * `yoga`/`hiit`/`sport`/`other` are not in the original brief's table; they are
 * here because the retired `<select>` offered them and journals already hold
 * them. Dropping them would have made real history unselectable and unlabelled.
 *
 * Order within a mode is the order the select offers, and the first entry is
 * what a mode switch lands on — so `pickleball` leads Sport deliberately.
 *
 * `strength` is the catch-all for a lifting session with no split recorded.
 * Legacy rows exist in exactly that state and guessing push/pull/legs for them
 * would invent a training day that never happened.
 */
export const ACTIVITIES = {
  run:         { label: 'Run',          mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'pace' },
  cycle:       { label: 'Cycle',        mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'distance' },
  swim:        { label: 'Swim',         mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'distance' },
  row:         { label: 'Row',          mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'distance' },
  walk:        { label: 'Walk',         mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'distance' },
  hike:        { label: 'Hike',         mode: 'cardio',   required: ['durationMin', 'distanceKm'], best: 'distance' },
  yoga:        { label: 'Yoga',         mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  hiit:        { label: 'HIIT',         mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  other:       { label: 'Other',        mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  pickleball:  { label: 'Pickleball',   mode: 'sport',    required: ['durationMin'],               best: 'duration' },
  sport:       { label: 'Other sport',  mode: 'sport',    required: ['durationMin'],               best: 'duration' },
  push:        { label: 'Push day',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  pull:        { label: 'Pull day',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  legs:        { label: 'Leg day',      mode: 'strength', required: ['sets'],                      best: 'volume' },
  strength:    { label: 'Strength',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  pullups:     { label: 'Pull-ups',     mode: 'strength', required: ['sets'],                      best: 'maxReps' },
  homeWorkout: { label: 'Home workout', mode: 'strength', required: ['sets'],                      best: 'volume' },
} as const satisfies Record<string, Activity>

export type ActivityKey = keyof typeof ACTIVITIES

/**
 * SUB-ACTIVITY · what kind of the thing it was.
 *
 * Reported as "I want to say the activity is a home workout — what kind of
 * home workout did I do? Why is there no sub-activity?" The registry had one
 * level: nine cardio activities, two sport, and no way to say that the run was
 * intervals rather than an easy hour, or that HIIT meant Tabata. The record
 * said "Yoga, 45 min" for a restorative session and a power class alike.
 *
 * It is not that the dimension did not exist — it existed exactly once, for
 * lifting, as `Workout.split`, bolted on beside the activity rather than
 * modelled. One activity had a sub-activity and the other sixteen had nothing,
 * which is the shape this registry was written to prevent one level up.
 *
 * So it is a property of the activity, like `required` and `best`. A view
 * cannot special-case which activities have kinds, because it has nowhere to
 * put the condition — `kindsFor()` is the only way to ask.
 *
 * Keyed by `ActivityKey`, so a typo is a compile error rather than a chip row
 * that silently never renders. That is deliberate: this is a hand-written list
 * resolved against another source, the shape this repo has been bitten by
 * repeatedly, and the type is what keeps it honest.
 *
 * The lists are presets, not an enum — `Workout.subActivity` is a plain string,
 * so a journal that already holds something else keeps it, and these are what
 * the form offers rather than what the field permits.
 *
 * **The field is `subActivity`, not `kind`, and that is not fussiness.** The
 * first draft called it `kind` and the collision was immediate: `ImportRecord`
 * and `CaptureResult` both use `kind` as their union discriminant, `WorkoutSet`
 * uses it for warmup/working/drop, and the search index emits `kind: 'workout'`.
 * Writing `fullLabelOf(r.activity, r.kind)` in `captureLanding.ts` TYPECHECKED
 * and would have printed "Run · workout" on every capture receipt, because
 * `r.kind` there is the discriminant. Five meanings of one word in one
 * codebase is four too many.
 *
 * **No kinds for push/pull/legs/strength.** They carry `split`, which does the
 * same job and feeds the strength analytics; giving them both would be two
 * mechanisms for one question, which is how `split` became an exception in the
 * first place.
 */
export const ACTIVITY_KINDS: Partial<Record<ActivityKey, readonly string[]>> = {
  run: ['Easy', 'Tempo', 'Intervals', 'Long run', 'Treadmill', 'Race'],
  cycle: ['Road', 'Indoor trainer', 'Mountain', 'Commute', 'Spin class'],
  swim: ['Freestyle', 'Mixed strokes', 'Drills', 'Open water'],
  row: ['Steady', 'Intervals', 'Time trial'],
  walk: ['Outdoor', 'Treadmill', 'Incline', 'Rucking'],
  hike: ['Day hike', 'Summit', 'Trail'],
  yoga: ['Vinyasa', 'Hatha', 'Yin', 'Power', 'Restorative', 'Mobility'],
  hiit: ['Tabata', 'EMOM', 'AMRAP', 'Circuit', 'Sprints', 'Bike intervals'],
  // `other` is the activity you pick when none of the above fits, so it is the
  // one that needs a kind most — without one the record says nothing at all.
  other: ['Elliptical', 'Stair climber', 'Jump rope', 'Dance', 'Martial arts', 'Climbing', 'Sports class'],
  pickleball: ['Singles', 'Doubles', 'Drills', 'Open play', 'Tournament'],
  sport: ['Basketball', 'Cricket', 'Tennis', 'Badminton', 'Football', 'Soccer', 'Volleyball', 'Table tennis'],
  homeWorkout: ['Full body', 'Upper body', 'Lower body', 'Core', 'Push', 'Pull', 'Mobility', 'HIIT circuit'],
  pullups: ['Max reps', 'Ladder', 'Greasing the groove', 'Weighted', 'Negatives', 'Assisted'],
}


/** Never required by an activity · the form decides which are worth showing. */
export const OPTIONAL_FIELDS = ['calories', 'rpe', 'notes'] as const

export const MODES: Mode[] = ['cardio', 'strength', 'sport']

/**
 * The modes the **Fitness page** offers as a toggle — which is not all of them.
 *
 * `strength` is a shape a `Workout` can have (a legacy row, a Gym session, a
 * pull-up set all derive it), so it stays in `MODES` and every derivation still
 * handles it. What it is not is a thing you log *here*: Strength is its own
 * Body tab, forty pixels above this toggle, and it holds the set logger, the
 * rest timer, PRs, the muscle map and twelve analytics. The Fitness segment
 * offered a duration-and-sets textarea for the same record — two front doors
 * to one room, and the smaller one silently wrote sessions the Strength page's
 * own logger would never have produced.
 *
 * So the door is deleted, not the mode. `modeSegments()` reads this list;
 * `modeOf()`, `activitiesForMode()` and the edit dialog still read `MODES`,
 * which is why a push day logged last year still opens with its sets field.
 */
export const LOGGABLE_MODES: Mode[] = ['cardio', 'sport']

/**
 * Everything that changes with the mode, in one place.
 *
 * The contract requires the copy and the orientation facts to follow the mode —
 * "Log a cardio session", not "Log a workout" — and the obvious way to write
 * that is a ternary at each call site. That is the same shape as the field-
 * visibility bug this registry exists to prevent: a literal mode comparison
 * scattered across components, where adding a third mode means finding every
 * one of them.
 *
 * So the copy lives here too, and the sweep grep for literal mode comparisons
 * stays meaningful: a hit in a component is now a genuine finding rather than
 * one of a dozen legitimate ones nobody reads past. (This comment avoids
 * spelling the literal for the same reason.)
 */
export interface ModeCopy {
  label: string
  /** Heading above the log form. */
  formHeading: string
  /** Zone-1 label for the weekly-progress fact. */
  weekLabel: string
  /**
   * Example value for the notes field. A real one, per the copy rule — and one
   * that belongs to the mode: "legs felt heavy for the first mile" is a running
   * note, and offering it on a lifting form is the copy version of showing a
   * distance field to a bench press.
   */
  notesPlaceholder: string
}

export const MODE_COPY: Record<Mode, ModeCopy> = {
  cardio: {
    label: 'Cardio', formHeading: 'Log a cardio session', weekLabel: 'This week',
    notesPlaceholder: 'Legs felt heavy for the first mile',
  },
  strength: {
    label: 'Strength', formHeading: 'Log a strength session', weekLabel: 'This week',
    notesPlaceholder: 'Bench moved well, left shoulder tight on the last set',
  },
  sport: {
    label: 'Sport', formHeading: 'Log a game', weekLabel: 'This week',
    notesPlaceholder: 'Third-shot drop finally landing under pressure',
  },
}

/** The mode segments for a StatBar, in registry order. Loggable modes only. */
export const modeSegments = (): { value: Mode; label: string }[] =>
  LOGGABLE_MODES.map((m) => ({ value: m, label: MODE_COPY[m].label }))

const KEYS = Object.keys(ACTIVITIES) as ActivityKey[]

export const isActivityKey = (k: string): k is ActivityKey => k in ACTIVITIES

export const activitiesForMode = (mode: Mode): [ActivityKey, Activity][] =>
  KEYS.filter((k) => ACTIVITIES[k].mode === mode).map((k) => [k, ACTIVITIES[k]])

/** The first activity of a mode · what a mode switch resets the selection to. */
export const defaultActivityFor = (mode: Mode): ActivityKey => activitiesForMode(mode)[0][0]

/**
 * Mode of an activity. Unknown keys fall back to cardio: a session that somehow
 * survived migration unrecognised should still render *something* loggable
 * rather than throw on a journal the user cannot repair.
 */
export const modeOf = (activityKey: string): Mode =>
  isActivityKey(activityKey) ? ACTIVITIES[activityKey].mode : 'cardio'

/** Human label. Falls back to the raw key so an unmigrated row is still legible. */
export const labelOf = (activityKey: string): string =>
  isActivityKey(activityKey) ? ACTIVITIES[activityKey].label : activityKey

export const requiredFields = (activityKey: string): readonly RequiredField[] =>
  isActivityKey(activityKey) ? ACTIVITIES[activityKey].required : ACTIVITIES.other.required

export const bestStat = (activityKey: string): BestStat =>
  isActivityKey(activityKey) ? ACTIVITIES[activityKey].best : 'duration'

/** Does this activity ask for `field`? The only sanctioned field-visibility test. */
export const asks = (activityKey: string, field: RequiredField): boolean =>
  requiredFields(activityKey).includes(field)

/** The kinds an activity offers, or an empty list. The only sanctioned test. */
export const kindsFor = (activityKey: string): readonly string[] =>
  (isActivityKey(activityKey) && ACTIVITY_KINDS[activityKey]) || []

/** Does this activity have a sub-activity to ask about? */
export const hasKinds = (activityKey: string): boolean => kindsFor(activityKey).length > 0

/**
 * "Run · Intervals", or just "Run". The label any list of sessions should show.
 *
 * Exists because the alternative is every call site writing
 * `w.subActivity ? ... : ...` itself, and the one that forgets stores a value
 * nobody can see — a field written and never read is the same defect as a data
 * module nothing imports, which this repo has shipped before.
 */
export const fullLabelOf = (activityKey: string, kind?: string): string =>
  kind ? `${labelOf(activityKey)} · ${kind}` : labelOf(activityKey)

/**
 * Legacy free-form `activity` strings → registry keys.
 *
 * Two generations wrote these: the retired Fitness `<select>` ('Run', 'Home',
 * 'Cycling'…) and Gym's template literal (`${splitMeta(split).label} day`,
 * which produced 'Push day'), plus the demo seeder's lowercase 'push day'.
 * Matching is case-insensitive, so both spellings land in one entry.
 */
const LEGACY: Record<string, ActivityKey> = {
  run: 'run', running: 'run',
  walk: 'walk', walking: 'walk',
  cycling: 'cycle', cycle: 'cycle', bike: 'cycle', biking: 'cycle',
  swim: 'swim', swimming: 'swim',
  row: 'row', rowing: 'row',
  hike: 'hike', hiking: 'hike',
  pickleball: 'pickleball',
  yoga: 'yoga',
  hiit: 'hiit',
  sport: 'sport',
  other: 'other',
  home: 'homeWorkout', 'home workout': 'homeWorkout',
  'pull-ups': 'pullups', pullups: 'pullups', 'pull ups': 'pullups',
  strength: 'strength',
  'push day': 'push', 'pull day': 'pull', 'legs day': 'legs', 'leg day': 'legs',
  // Gym offered four more splits than the registry names as activities. They
  // keep their `split` field for the strength analytics; as an *activity* they
  // are just a lifting session.
  'upper day': 'strength', 'lower day': 'strength',
  'full body day': 'strength', 'other day': 'strength',
}

/** The split values that are activities in their own right. */
const SPLIT_ACTIVITY: Record<string, ActivityKey> = { push: 'push', pull: 'pull', legs: 'legs' }

/**
 * Normalise a stored session's activity to a registry key.
 *
 * `split` wins when it names a real training day, because it was the structured
 * field and the free-form `activity` string was derived from it. Anything else
 * falls through the legacy table, then to `other` — never to a guess.
 */
export function normalizeActivity(activity: unknown, split?: unknown): ActivityKey {
  const raw = typeof activity === 'string' ? activity.trim() : ''
  if (isActivityKey(raw)) return raw
  const s = typeof split === 'string' ? split : ''
  if (SPLIT_ACTIVITY[s]) return SPLIT_ACTIVITY[s]
  const hit = LEGACY[raw.toLowerCase()]
  if (hit) return hit
  // A lifting session whose split was upper/lower/full/other, or any unknown
  // string on a row that carried a split at all.
  if (s) return 'strength'
  return 'other'
}

/** The activity key a Gym session of this split should be logged under. */
export const activityForSplit = (split?: string): ActivityKey =>
  (split && SPLIT_ACTIVITY[split]) || 'strength'
