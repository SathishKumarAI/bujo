/**
 * VALIDATION · the trust boundary for every importer.
 *
 * Both callers are untrusted. A file picked off disk can be anything, and an
 * LLM-generated payload can be confidently, plausibly wrong — which is the
 * dangerous case, because it parses.
 *
 * Two rules decide everything here:
 *
 * 1. **An envelope-level failure rejects the whole file; a record-level failure
 *    rejects that record only.** A bad row must not cost the other 400.
 * 2. **Out-of-range numbers are rejected, never clamped.** A `mood: 9999`
 *    clamped to 10 is a fabricated perfect day that nothing downstream can tell
 *    from a real one. Refusing it keeps the journal's contents traceable to
 *    something that actually happened.
 *
 * Hand-written, no schema library: this repo hand-writes `parseICS`,
 * `parseMetricsCsv` and `verifyChecksum`, and ~150 lines of explicit checks
 * read better than a DSL and carry no supply chain.
 */
import { isActivityKey } from '../../domain/activities'
import { addDays, fromISODay, toISODay, todayISO } from '../date'
import {
  ENVELOPE_VERSION, MAX_RECORDS, RECORD_KINDS,
  type ImportEnvelope, type ImportRecord, type ImportSource, type RecordKind,
} from './envelope'

const SOURCES: ImportSource[] = ['apple-health', 'claude', 'metrics-csv', 'ics']

/** Per-field bounds. Outside these a record is rejected — see the header. */
export const RANGES: Record<string, [number, number]> = {
  mood: [0, 10],
  stress: [0, 10],
  energy: [0, 10],
  sleep: [0, 24],
  rpe: [1, 10],
  bodyFat: [1, 70], // under 1 is a 0–1 fraction bug; over 70 is not survivable
  weightKg: [20, 400], // catches a pound value pasted into a kilogram field
  // Celsius, and the bound IS the unit check: an unconverted Fahrenheit basal
  // reading is ~97.8, which is rejected rather than plotted as a fever that
  // never happened. 30–45 covers hypothermia to untreatable, so nothing real
  // is refused. Apple exports °F or °C depending on the phone's locale, which
  // makes this the field most likely to arrive in the wrong one.
  tempC: [30, 45],
  steps: [0, 200_000],
  restingHR: [25, 150],
  calories: [0, 20_000],
  activeKcal: [0, 20_000],
  protein: [0, 2_000],
  carbs: [0, 2_000],
  fat: [0, 2_000],
  durationMin: [1, 1_440], // a workout longer than a day is a parse bug
  distanceKm: [0, 500],
  value: [0, 100_000], // habit value
}

export interface RejectedRecord {
  index: number
  kind?: string
  date?: string
  reason: string
  raw: unknown
}

export interface EnvelopeCheck {
  ok: boolean
  /** Present when `ok`. */
  envelope?: ImportEnvelope
  /** Present when not `ok` — one sentence, shown to the user as-is. */
  error?: string
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * A real calendar day, not merely a well-shaped string.
 *
 * The regex alone accepts `2026-02-31`, which `fromISODay` silently rolls
 * forward to March 3 — so the round-trip is the check, not the pattern.
 */
export function isISODay(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  return toISODay(fromISODay(v)) === v
}

/** Parse a file's text into an envelope, or say in one sentence why not. */
export function validateEnvelope(input: unknown): EnvelopeCheck {
  let raw = input
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { return { ok: false, error: "That file isn't JSON." } }
  }
  if (!isObj(raw)) return { ok: false, error: "That file isn't an import envelope." }
  if (raw.envelope !== ENVELOPE_VERSION) {
    return typeof raw.envelope === 'number' && raw.envelope > ENVELOPE_VERSION
      ? { ok: false, error: 'This import was made for a newer version of bujo.' }
      : { ok: false, error: "That file isn't an import envelope." }
  }
  if (typeof raw.source !== 'string' || !SOURCES.includes(raw.source as ImportSource)) {
    return { ok: false, error: `Unknown import source "${String(raw.source)}".` }
  }
  if (!Array.isArray(raw.records)) return { ok: false, error: 'No records in that file.' }
  if (raw.records.length === 0) return { ok: false, error: 'Nothing to import.' }
  if (raw.records.length > MAX_RECORDS) {
    return { ok: false, error: `That's ${raw.records.length.toLocaleString()} records — more than one import can take. Split it by year.` }
  }
  return { ok: true, envelope: raw as unknown as ImportEnvelope }
}

/** `field` is within its range, when it is present at all. */
function numberField(o: Record<string, unknown>, field: string): string | null {
  const v = o[field]
  if (v === undefined) return null
  if (typeof v !== 'number' || !Number.isFinite(v)) return `${field} is not a number`
  const range = RANGES[field]
  if (range && (v < range[0] || v > range[1])) return `${field} ${v} is outside ${range[0]}–${range[1]}`
  return null
}

function stringField(o: Record<string, unknown>, field: string, max: number): string | null {
  const v = o[field]
  if (v === undefined) return null
  if (typeof v !== 'string') return `${field} is not text`
  if (v.length > max) return `${field} is ${v.length} characters, over the ${max} limit`
  return null
}

/**
 * One record, checked. Returns the record or the reason it was refused.
 *
 * `index` travels with the rejection so the preview can say *which* row, which
 * is the difference between a fixable report and "something was wrong".
 */
export function validateRecord(raw: unknown, index: number): { ok: true; record: ImportRecord } | { ok: false; rejected: RejectedRecord } {
  const no = (reason: string, kind?: string, date?: string): { ok: false; rejected: RejectedRecord } =>
    ({ ok: false, rejected: { index, kind, date, reason, raw } })

  if (!isObj(raw)) return no('not an object')
  const kind = raw.kind
  if (typeof kind !== 'string' || !(RECORD_KINDS as readonly string[]).includes(kind)) {
    return no(`unknown kind "${String(kind)}"`)
  }
  const k = kind as RecordKind
  const date = raw.date
  if (!isISODay(date)) return no(`"${String(date)}" is not a real date`, k)
  // A future record breaks every streak and every "days since" figure in the
  // app. One day of tolerance, because the producing device's clock may be
  // ahead of this one — more than that is a wrong year, not a clock.
  if (date < '1970-01-01' || date > addDays(todayISO(), 1)) {
    return no(`${date} is outside the journal's lifetime`, k, date)
  }

  for (const field of Object.keys(RANGES)) {
    const err = numberField(raw, field)
    if (err) return no(err, k, date)
  }

  if (k === 'workout') {
    if (typeof raw.activity !== 'string' || !isActivityKey(raw.activity)) {
      // Deliberately not `normalizeActivity`: it maps anything unknown to
      // 'other', which at a trust boundary is a silent downgrade of an invented
      // value into a real-looking one.
      return no(`unknown activity "${String(raw.activity)}"`, k, date)
    }
    if (raw.at !== undefined) {
      if (typeof raw.at !== 'string') return no('at is not a timestamp', k, date)
      const t = new Date(raw.at)
      if (Number.isNaN(t.getTime())) return no(`at "${raw.at}" is not a timestamp`, k, date)
      // The adapter resolved the day; if its own instant disagrees, one of the
      // two is wrong and importing either quietly would bury it.
      if (toISODay(t) !== date) return no(`at ${raw.at} is not on ${date}`, k, date)
    }
    if (raw.sets !== undefined) {
      if (!Array.isArray(raw.sets) || raw.sets.some((s) => typeof s !== 'string')) return no('sets is not a list of text', k, date)
      if (raw.sets.length > 100) return no(`${raw.sets.length} sets, over the 100 limit`, k, date)
      if (raw.sets.some((s) => (s as string).length > 200)) return no('a set line is over 200 characters', k, date)
    }
    const err = stringField(raw, 'notes', 2_000)
    if (err) return no(err, k, date)
  }

  if (k === 'entry') {
    if (typeof raw.text !== 'string' || raw.text.trim() === '') return no('entry has no text', k, date)
    const err = stringField(raw, 'text', 500)
    if (err) return no(err, k, date)
    if (raw.type !== undefined && !['task', 'event', 'note'].includes(String(raw.type))) {
      return no(`unknown bullet type "${String(raw.type)}"`, k, date)
    }
  }

  if (k === 'habit' && (typeof raw.habit !== 'string' || raw.habit.trim() === '')) {
    return no('habit has no name', k, date)
  }

  if (k === 'body' && raw.measurements !== undefined) {
    if (!isObj(raw.measurements)) return no('measurements is not an object', k, date)
    const keys = Object.keys(raw.measurements)
    // An unbounded key space in a `Record` is how a schema stops being one.
    if (keys.length > 20) return no(`${keys.length} measurements, over the 20 limit`, k, date)
    for (const key of keys) {
      if (!/^[a-z][a-z0-9 _-]{0,30}$/i.test(key)) return no(`measurement name "${key}" is not a name`, k, date)
      const v = raw.measurements[key]
      if (typeof v !== 'number' || !Number.isFinite(v)) return no(`measurement "${key}" is not a number`, k, date)
    }
  }

  if (k === 'cycle' && raw.flags !== undefined) {
    if (!Array.isArray(raw.flags) || raw.flags.some((f) => typeof f !== 'string')) return no('flags is not a list of text', k, date)
    if (raw.flags.length > 20) return no(`${raw.flags.length} flags, over the 20 limit`, k, date)
  }

  return { ok: true, record: raw as unknown as ImportRecord }
}

/** Every record, in order, split into what survived and what did not. */
export function validateRecords(records: unknown[]): { records: ImportRecord[]; rejected: RejectedRecord[] } {
  const good: ImportRecord[] = []
  const rejected: RejectedRecord[] = []
  records.forEach((raw, i) => {
    const r = validateRecord(raw, i)
    if (r.ok) good.push(r.record)
    else rejected.push(r.rejected)
  })
  return { records: good, rejected }
}
