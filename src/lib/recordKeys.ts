/**
 * EVERY RECORD A CAPTURE CAN WRITE, AS A STABLE KEY AND A FINGERPRINT.
 *
 * The receipt tells you a page changed. To point at *what* changed on it, the
 * app has to be able to name a record — and half of what a capture writes has
 * no id at all. An entry and a workout have one; a day's mood is a field on a
 * row keyed by date, and a ticked habit is a string in an array under a day.
 * So this gives all seven kinds one vocabulary: `entry:<id>`, `metric:<date>`,
 * `habit:<date>:<habitId>`, and so on.
 *
 * It returns a fingerprint per key rather than a bare set, because "added" is
 * not the only thing worth pointing at. Saying "mood 7" on a day that already
 * had a sleep figure **updates** a row that already existed; a set difference
 * would find nothing new and highlight nothing, on the single most common
 * capture in the app.
 *
 * Scoped deliberately to what a capture writes — the same seven kinds
 * `captureLanding.ts` routes and `lib/ingest/envelope.ts` defines. This is not
 * a general diff of the journal, and it should not grow into one: a key here
 * is a promise that some view can point at the thing.
 */
import type { JournalData } from './types'

/** key → fingerprint of the record's current contents. */
export type RecordFingerprints = Map<string, string>

export const ENTRY_KEY = (id: string) => `entry:${id}`
export const WORKOUT_KEY = (id: string) => `workout:${id}`
export const PICKLEBALL_KEY = (id: string) => `pickleball:${id}`
/**
 * Keyed per FIELD, not per day, and that is the difference between pointing at
 * a reading and pointing at a date.
 *
 * `DailyMetric` is one row carrying up to eleven numbers, so a day-level key
 * says only "something about this day changed". Saying "mood 7" on a day that
 * already has stress and sleep would then mark all three lines on the trend
 * chart — three readings the user did not just give, two of them days old.
 * Measured in a browser: three dots for a one-word capture.
 */
export const METRIC_KEY = (date: string, field: string) => `metric:${date}:${field}`

/** The fields a capture or an import can write onto a `DailyMetric`. */
export const METRIC_FIELDS = [
  'mood', 'stress', 'sleep', 'energy',
  'calories', 'protein', 'carbs', 'fat',
  'steps', 'restingHR', 'activeKcal',
] as const
export const BODY_KEY = (date: string) => `body:${date}`
export const CYCLE_KEY = (date: string) => `cycle:${date}`
export const HABIT_KEY = (date: string, habitId: string) => `habit:${date}:${habitId}`

export function fingerprint(d: JournalData): RecordFingerprints {
  const m: RecordFingerprints = new Map()

  for (const e of d.entries) m.set(ENTRY_KEY(e.id), JSON.stringify(e))
  for (const w of d.workouts) m.set(WORKOUT_KEY(w.id), JSON.stringify(w))
  for (const p of d.pickleball ?? []) m.set(PICKLEBALL_KEY(p.id), JSON.stringify(p))
  for (const row of d.metrics) {
    for (const f of METRIC_FIELDS) {
      const v = (row as unknown as Record<string, unknown>)[f]
      if (typeof v === 'number') m.set(METRIC_KEY(row.date, f), String(v))
    }
  }
  for (const row of d.bodyMetrics) m.set(BODY_KEY(row.date), JSON.stringify(row))
  for (const row of d.cycle) m.set(CYCLE_KEY(row.date), JSON.stringify(row))

  // A ticked habit lives in two places — `habitLog` for a check, `habitValues`
  // for a count — and a capture can write either. Both fold into one key so a
  // view does not have to know which kind of habit it is holding.
  for (const [date, ids] of Object.entries(d.habitLog)) {
    for (const id of ids) m.set(HABIT_KEY(date, id), 'checked')
  }
  for (const [date, byHabit] of Object.entries(d.habitValues ?? {})) {
    for (const [id, v] of Object.entries(byHabit)) m.set(HABIT_KEY(date, id), String(v))
  }

  return m
}

/**
 * Keys whose record was added or changed between two fingerprints.
 *
 * Deletions are not "changed" — nothing is left on the page to point at, and
 * the receipt for a capture never deletes anything anyway.
 */
export function changedKeys(before: RecordFingerprints, after: RecordFingerprints): Set<string> {
  const out = new Set<string>()
  for (const [k, v] of after) if (before.get(k) !== v) out.add(k)
  return out
}
