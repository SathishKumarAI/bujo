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

/** Which shape of training this is. Derived, never persisted. */
export type Mode = 'cardio' | 'strength'

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
  pickleball:  { label: 'Pickleball',   mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  yoga:        { label: 'Yoga',         mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  hiit:        { label: 'HIIT',         mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  sport:       { label: 'Sport',        mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  other:       { label: 'Other',        mode: 'cardio',   required: ['durationMin'],               best: 'duration' },
  push:        { label: 'Push day',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  pull:        { label: 'Pull day',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  legs:        { label: 'Leg day',      mode: 'strength', required: ['sets'],                      best: 'volume' },
  strength:    { label: 'Strength',     mode: 'strength', required: ['sets'],                      best: 'volume' },
  pullups:     { label: 'Pull-ups',     mode: 'strength', required: ['sets'],                      best: 'maxReps' },
  homeWorkout: { label: 'Home workout', mode: 'strength', required: ['sets'],                      best: 'volume' },
} as const satisfies Record<string, Activity>

export type ActivityKey = keyof typeof ACTIVITIES

/** Filled less than half the time · these live behind one "More" disclosure. */
export const OPTIONAL_FIELDS = ['calories', 'rpe', 'notes'] as const

export const MODES: Mode[] = ['cardio', 'strength']

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
