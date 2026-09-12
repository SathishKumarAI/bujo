/**
 * THE IMPORT ENVELOPE · one transport format for every importer.
 *
 * Apple Health's export and a payload Claude wrote are the same shape by the
 * time they reach the planner, so there is one set of validation rules, one
 * dedupe rule and one preview screen rather than one of each per source. See
 * `docs/import/ingest-architecture.md` for the reasoning; this file is only the
 * contract.
 *
 * It is a **transport** format and is never stored. Nothing in a journal is
 * shaped like this.
 */
import type { ActivityKey } from '../../domain/activities'
import type { BulletType } from '../types'

export const ENVELOPE_VERSION = 1

/**
 * More than this in one file is a mistake rather than a journal — the largest
 * real bujo journal measured is a few thousand rows per collection, and an
 * Apple export split by year lands well inside it. Refused whole, with the
 * "split it by year" message, rather than half-applied.
 */
export const MAX_RECORDS = 50_000

export type ImportSource = 'apple-health' | 'claude' | 'metrics-csv' | 'ics'

/** Two-character prefix for a workout's provenance key. See `srcKey`. */
export const SOURCE_CODE: Record<ImportSource, string> = {
  'apple-health': 'ah',
  claude: 'cl',
  'metrics-csv': 'csv',
  ics: 'ics',
}

export interface ImportEnvelope {
  /** Format version. A reader that does not know this number refuses the file. */
  envelope: typeof ENVELOPE_VERSION
  source: ImportSource
  /** Free-form producer version: "iOS 19.2", "claude-opus-5". Says which batch to re-import when a mapping turns out wrong. */
  sourceVersion?: string
  /** When the SOURCE produced this, ISO instant. Detects a stale re-export. */
  exportedAt?: string
  /** IANA zone of the producing device. Apple stamps instants; this app stores days. */
  tz?: string
  records: ImportRecord[]
}

interface RecordBase {
  /** "YYYY-MM-DD", the local day this belongs to, already resolved by the adapter. */
  date: string
  /**
   * Source-supplied stable id. **Advisory.** Used only where the producer can
   * promise it survives a re-export — not for `apple-health`, where a re-export
   * may re-mint uuids and keying on them would duplicate a training history.
   */
  key?: string
}

export type MetricRecord = { kind: 'metric' } & RecordBase & {
  mood?: number
  stress?: number
  sleep?: number
  energy?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  steps?: number
  restingHR?: number
  activeKcal?: number
}

export type WorkoutRecord = { kind: 'workout' } & RecordBase & {
  /** ISO instant with offset. Its local day must equal `date` — an adapter that disagrees with itself is a bug, not a tolerance. */
  at?: string
  activity: ActivityKey
  durationMin?: number
  /** Canonical kilometres, always. The envelope does not carry the user's unit. */
  distanceKm?: number
  calories?: number
  rpe?: number
  sets?: string[]
  notes?: string
}

export type BodyRecord = { kind: 'body' } & RecordBase & {
  /**
   * **Always kilograms**, converted to the user's unit at apply.
   *
   * Explicit because `BodyMetric.weight` has no canonical unit: `settings
   * .weightUnit` is written in Settings, read in Gym, and converted nowhere, so
   * the stored number is whatever unit was on screen when it was typed. Filed
   * separately; the envelope refuses to inherit the ambiguity.
   */
  weightKg?: number
  /** Percent, 0–100 — never HealthKit's 0–1 fraction. */
  bodyFat?: number
  measurements?: Record<string, number>
}

export type HabitRecord = { kind: 'habit' } & RecordBase & {
  /** Habit id or exact name. A habit that does not exist is rejected, never created — an import adds records, not structure. */
  habit: string
  value?: number
}

export type EntryRecord = { kind: 'entry' } & RecordBase & {
  text: string
  type?: BulletType
}

export type CycleRecord = { kind: 'cycle' } & RecordBase & {
  flags?: string[]
  note?: string
}

export type PickleballRecord = { kind: 'pickleball' } & RecordBase & {
  format?: 'singles' | 'doubles'
  gamesWon?: number
  gamesLost?: number
  pointsFor?: number
  pointsAgainst?: number
  durationMin?: number
  partner?: string
  notes?: string
}

export type ImportRecord =
  | MetricRecord
  | WorkoutRecord
  | BodyRecord
  | HabitRecord
  | EntryRecord
  | CycleRecord
  | PickleballRecord

export type RecordKind = ImportRecord['kind']

/**
 * Every kind, as a value — so a new kind added to the union above fails a test
 * rather than being silently dropped by a planner that has no branch for it.
 *
 * `conflict.ts` learned this the expensive way: `ID_ARRAYS` was a hand-written
 * list against a growing type, and `typingSessions` fell out of it silently.
 */
export const RECORD_KINDS = ['metric', 'workout', 'body', 'habit', 'entry', 'cycle', 'pickleball'] as const

/**
 * A workout's provenance key: `<code>:<instant or day>`.
 *
 * Its only job is to make a re-import update the row it already wrote instead
 * of appending a second one. Derived rather than taken from the source, because
 * a source id that is re-minted on every export turns each re-import into a
 * full duplicate of the user's training history — and we do not yet know
 * whether Apple's workout uuids are stable.
 *
 * Ceiling: two workouts of the same source starting in the same minute collapse
 * to one. One wrist does not record two simultaneous sessions; add the activity
 * to the key if that ever stops being true.
 */
export function srcKey(source: ImportSource, r: WorkoutRecord): string {
  return `${SOURCE_CODE[source]}:${r.at ?? r.date}`
}
