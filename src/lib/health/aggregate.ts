/**
 * SAMPLES → ONE ROW PER DAY. The fold that makes the whole thing fit in memory.
 *
 * A step is recorded in bursts of a few seconds — the real atom in a Health
 * export is literally `type="StepCount" value="4"` for 32 seconds of walking —
 * so a day of step data is hundreds of samples and a decade is millions. This
 * module is the reason none of that is ever held: every sample is folded into a
 * `Map` keyed by day and thrown away. **Ten years is ~3,650 days, and that is
 * the memory ceiling of the entire import** regardless of whether the file was
 * 10 MB or 1.5 GB.
 *
 * It also bounds the record count for free, which matters because the pipeline
 * refuses a file over `MAX_RECORDS` (50,000): aggregating per day means a decade
 * of samples arrives at the planner as ~11,000 records, not 2.8 million.
 *
 * ## The rules, each of which is a decision
 *
 * | Rule | Why |
 * |---|---|
 * | **The day is the `YYYY-MM-DD` written in `startDate`, offset ignored** | The attribute already holds the local wall-clock at the moment of recording, which is exactly what `toISODay()` means. Converting to UTC moves a 00:30 workout to yesterday; converting to the importing browser's zone moves a run logged in Tokyo when it is read in London. Taking the string is not a shortcut, it is the only rule that is stable across a move |
 * | **Never sum across sources** | `export.xml` is a raw dump, not the de-duplicated view the Health app shows. An iPhone in a pocket and a Watch on a wrist both record the same walk, so summing a day gives roughly double. One source is chosen per field per day, Watch preferred |
 * | **Basal temperature is the *earliest* reading of the day** | A basal temperature is by definition the one taken on waking, before moving. A later reading is a body temperature wearing the same label, and averaging it in flattens the ovulation shift the chart exists to show |
 * | **Basal and general body temperature never mix** | Two separate accumulators, and the general one is off unless asked for. See `useBodyTemperature` |
 * | **Sleep belongs to the day you woke up** | "I slept seven hours last night" is said while looking at today |
 * | **An unconvertible unit drops the sample and is counted** | A `lb` value written into a field meaning kilograms is silent corruption. Counted and reported beats guessed at |
 *
 * ## Sleep, in more detail
 *
 * A night is 20–60 overlapping segments, and they overlap **by design**: on
 * watchOS 9+ `Core`/`Deep`/`REM`/`Awake` are nested inside a broad `InBed`
 * envelope. Adding every segment's duration counts the same minutes twice and
 * reports 14 hours for an 8-hour night. So:
 *
 * 1. Keep only the asleep values (`hk.ts` `ASLEEP_VALUES`) — drop `InBed` and `Awake`.
 * 2. Group into **sessions** by splitting wherever there is a gap over 3 hours.
 * 3. **Union** each session's intervals rather than summing them, because a user
 *    with both a Watch and a third-party tracker has two overlapping sets from
 *    different sources and union is the only operation that is right whether
 *    they agree or not.
 * 4. Key the session by the local day of its **last** segment's `endDate`.
 * 5. Where a day produced no asleep segments at all, fall back to the union of
 *    `InBed` and **say so** — before watchOS 9 there are no stage records, so a
 *    rule that drops `InBed` unconditionally imports zero sleep for everything
 *    before ~2022 and calls it success.
 *
 * Sessions rather than days is what keeps an afternoon nap from being added to
 * that night's sleep and reported as a ten-hour night.
 */
import type { BodyRecord, CycleRecord, ImportRecord, MetricRecord, WorkoutRecord } from '../ingest/envelope'
import { isActivityKey, type ActivityKey } from '../../domain/activities'
import {
  ASLEEP_VALUES, FLOW_FLAG, IN_BED_VALUE, MAPPING, WORKOUT_ACTIVITY,
  convert, ruleFor, toKm, toMinutes, type HKRule,
} from './hk'
import type { HKSample } from './xml'

/** field → rule, for the resolve pass. One field, one rule, by construction. */
const RULE_BY_FIELD: ReadonlyMap<string, HKRule> = new Map(MAPPING.map((r) => [r.field, r]))

/** A gap longer than this starts a new sleep session, so a nap is not part of the night. */
const SLEEP_GAP_MS = 3 * 3_600_000

/** Longer than this from one `startDate` is not a session, it is a stuck sensor. */
const MAX_SESSION_MS = 20 * 3_600_000

export interface AggregateOptions {
  /**
   * Use `HKQuantityTypeIdentifierBodyTemperature` on days with no basal
   * reading. **Off by default, and that default is the point.** General body
   * temperature is a different measurement taken under different conditions;
   * silently blending it into a BBT chart would corrupt the one signal the
   * chart is read for. Offered because refusing a user's own data outright is
   * worse than offering it with the difference named.
   */
  useBodyTemperature?: boolean
  /** Skip menstrual flow when the Cycle page is switched off. */
  cycleEnabled?: boolean
}

export interface HealthSummary {
  /** `<Record>` and `<Workout>` elements seen. */
  samples: number
  /** Samples whose `type` this app has a field for. */
  mapped: number
  /** Samples whose identifier is not in `MAPPING` — the overwhelming majority, and not a problem. */
  unmapped: number
  /** Samples dropped because `value` was absent or not a number. `parseFloat(undefined)` is `NaN`, and `NaN` poisons a sum silently. */
  malformed: number
  /** Samples dropped because their `unit` could not be converted. Reported, never guessed. */
  badUnit: number
  /** Workouts whose `workoutActivityType` has no clean equivalent here. Dropped, not coerced to `other`. */
  unmappedWorkouts: number
  /** Days where only "in bed" was recorded, so time in bed stood in for time asleep. */
  inBedDays: number
  /** Days with a general body temperature but no basal one. */
  bodyTempDays: number
  /** Sources seen, so the preview can say which device the numbers came from. */
  sources: string[]
  /** How many days each field produced, for the preview's "what you are about to get". */
  byField: Record<string, number>
}

export interface AggregateResult {
  records: ImportRecord[]
  summary: HealthSummary
}

// ── Date handling ─────────────────────────────────────────────────────────

/**
 * `2016-04-15 07:27:26 +0100` → its local day and its exact instant.
 *
 * A regex, and never `new Date(attr)`: the attribute is not ISO-8601 (a space
 * instead of `T`, an offset with no colon) and browsers accepting it is
 * unspecified behaviour. The day is taken verbatim from the front of the
 * string — the offset is used only for duration arithmetic, which is why a
 * session spanning a DST boundary is still measured correctly: both ends carry
 * their own offset, so the instants are right even though the wall clocks are
 * an hour apart.
 */
const HK_DATE = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/

export function parseHKDate(s: string | undefined): { day: string; ms: number } | null {
  if (!s) return null
  const m = HK_DATE.exec(s.trim())
  if (!m) return null
  const [, day, hh, mm, ss, sign, oh, om] = m
  const offset = (Number(oh) * 60 + Number(om)) * 60_000 * (sign === '-' ? -1 : 1)
  const ms = Date.UTC(
    Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)),
    Number(hh), Number(mm), Number(ss),
  ) - offset
  return { day, ms }
}

// ── Source selection ──────────────────────────────────────────────────────

/**
 * Two classes, not N, and that is a deliberate ceiling.
 *
 * The rule that matters is "prefer the Watch, fall back to the phone", and
 * collapsing every `sourceName` to one of two buckets implements it while
 * capping the accumulator at 2 entries per (day, field) instead of one per app
 * the user has ever installed. A third-party tracker writing back lands in
 * `other` alongside the phone, where it competes only when the Watch wrote
 * nothing that day.
 *
 * Ceiling: a user with a Watch **and** a chest strap gets the Watch. Choosing
 * per source is the upgrade path, and it needs a dropdown before it needs code.
 */
function sourceClass(name: string | undefined): 'watch' | 'other' {
  return name && /watch/i.test(name) ? 'watch' : 'other'
}

interface Acc {
  sum: number
  n: number
  firstAt: string
  firstV: number
  lastAt: string
  lastV: number
}

function reduceAcc(rule: HKRule, a: Acc): number {
  switch (rule.reduce) {
    case 'sum': return a.sum
    case 'mean': return a.sum / a.n
    case 'first': return a.firstV
    case 'last': return a.lastV
  }
}

interface Interval { start: number; end: number; endDay: string }

/** Overlapping and touching intervals merged, then totalled. Sorted input required. */
function unionMs(list: Interval[]): number {
  let total = 0
  let start = list[0].start
  let end = list[0].end
  for (let i = 1; i < list.length; i++) {
    const iv = list[i]
    if (iv.start <= end) end = Math.max(end, iv.end)
    else { total += end - start; start = iv.start; end = iv.end }
  }
  return total + (end - start)
}

/** Sessions split on a >3h gap, each keyed by the wake day of its last segment. */
function sleepHoursByDay(list: Interval[]): Map<string, number> {
  const out = new Map<string, number>()
  if (list.length === 0) return out
  list.sort((a, b) => a.start - b.start)

  let session: Interval[] = [list[0]]
  // Tracked incrementally rather than recomputed with `Math.max(...session)`,
  // which was both O(session²) across the whole log and a `RangeError` waiting
  // to happen — spreading a large array into a call blows the stack at around
  // 100k elements, and a decade of watch sleep segments is that order.
  let sessionEnd = list[0].end
  const close = () => {
    const hours = unionMs(session) / 3_600_000
    // Keyed on the last segment's own local end day — the day you woke up.
    const day = session[session.length - 1].endDay
    out.set(day, (out.get(day) ?? 0) + hours)
  }
  for (let i = 1; i < list.length; i++) {
    if (list[i].start - sessionEnd > SLEEP_GAP_MS) {
      close()
      session = [list[i]]
      sessionEnd = list[i].end
    } else {
      session.push(list[i])
      if (list[i].end > sessionEnd) sessionEnd = list[i].end
    }
  }
  close()
  return out
}

/**
 * Every sample, folded into one record per day per collection.
 *
 * Pure and streaming: takes an `AsyncIterable` so it composes with
 * `scanHealthXml` without either side holding a list, and returns the finished
 * record array — which is bounded by *days*, not samples.
 */
export async function aggregate(
  samples: AsyncIterable<HKSample> | Iterable<HKSample>,
  opts: AggregateOptions = {},
): Promise<AggregateResult> {
  const summary: HealthSummary = {
    samples: 0, mapped: 0, unmapped: 0, malformed: 0, badUnit: 0, unmappedWorkouts: 0,
    inBedDays: 0, bodyTempDays: 0, sources: [], byField: {},
  }
  // `${day}|${field}|${class}` → accumulator. Flat rather than nested because
  // the nesting buys nothing and costs an object per day per field.
  const acc = new Map<string, Acc>()
  const asleep: Interval[] = []
  const inBed: Interval[] = []
  const flags = new Map<string, Set<string>>()
  const workouts: WorkoutRecord[] = []
  const workoutKeys = new Set<string>()
  const sources = new Set<string>()

  for await (const s of samples) {
    summary.samples++

    if (s.tag === 'Workout') {
      const start = parseHKDate(s.attrs.startDate)
      const activity = WORKOUT_ACTIVITY[s.attrs.workoutActivityType ?? '']
      if (!start) { summary.malformed++; continue }
      if (!activity || !isActivityKey(activity)) { summary.unmappedWorkouts++; continue }
      if (s.attrs.sourceName) sources.add(s.attrs.sourceName)

      // A workout spanning midnight keys to its START day, which is how a
      // person describes it ("I ran Friday night").
      //
      // `at` is the wall clock WITHOUT an offset on purpose. Its only job is to
      // make a re-import update this row instead of appending a second one
      // (`srcKey` in `ingest/envelope.ts`), and the validator checks that its
      // browser-local day equals `date`. An offset-carrying instant would fail
      // that check for anyone importing a trip abroad — a run at 08:00 +0900
      // read in London is the previous day. The offsetless form is parsed as
      // local time by spec, so the two always agree, and nothing stores it.
      const at = `${start.day}T${s.attrs.startDate.slice(11, 19)}`
      // Two rows for one run is the thing a user notices immediately. Strava's
      // copy of a run has a different sourceName and different calories, so
      // the key is the activity and the minute — not the whole tuple.
      const key = `${activity}|${at}`
      if (workoutKeys.has(key)) continue
      workoutKeys.add(key)

      const min = s.attrs.duration ? toMinutes(Number(s.attrs.duration), s.attrs.durationUnit ?? 'min') : null
      const km = s.attrs.totalDistance ? toKm(Number(s.attrs.totalDistance), s.attrs.totalDistanceUnit ?? 'km') : null
      const kcal = s.attrs.totalEnergyBurned ? Number(s.attrs.totalEnergyBurned) : null
      const record: WorkoutRecord = { kind: 'workout', date: start.day, at, activity: activity as ActivityKey }
      // Rounded here rather than at the planner because the planner's rounding
      // is about storage shape; this is about a duration that is 32.400001
      // minutes being 32.
      if (min != null && Number.isFinite(min) && min >= 1) record.durationMin = Math.round(min)
      if (km != null && Number.isFinite(km) && km > 0) record.distanceKm = Math.round(km * 1_000) / 1_000
      if (kcal != null && Number.isFinite(kcal) && kcal > 0) record.calories = Math.round(kcal)
      // A workout with no duration fails the app's own required-field contract
      // and would land as an empty row on the training log.
      if (record.durationMin === undefined) { summary.malformed++; continue }
      workouts.push(record)
      summary.mapped++
      summary.byField.workouts = (summary.byField.workouts ?? 0) + 1
      continue
    }

    const rule = ruleFor(s.attrs.type ?? '')
    if (!rule) { summary.unmapped++; continue }
    const start = parseHKDate(s.attrs.startDate)
    if (!start) { summary.malformed++; continue }
    if (s.attrs.sourceName) sources.add(s.attrs.sourceName)

    // ── Categories: sleep and menstrual flow carry a string, not a number ──
    if (rule.target === 'sleep') {
      const end = parseHKDate(s.attrs.endDate)
      const value = s.attrs.value ?? ''
      if (!end || end.ms <= start.ms || end.ms - start.ms > MAX_SESSION_MS) { summary.malformed++; continue }
      if (ASLEEP_VALUES.includes(value)) { asleep.push({ start: start.ms, end: end.ms, endDay: end.day }); summary.mapped++ }
      else if (value === IN_BED_VALUE) { inBed.push({ start: start.ms, end: end.ms, endDay: end.day }); summary.mapped++ }
      else summary.unmapped++ // `Awake` — a real value, deliberately not sleep
      continue
    }
    if (rule.field === 'flags') {
      if (!opts.cycleEnabled) { summary.unmapped++; continue }
      const flag = FLOW_FLAG[s.attrs.value ?? '']
      if (!flag) { summary.unmapped++; continue }
      const set = flags.get(start.day) ?? new Set<string>()
      set.add(flag)
      flags.set(start.day, set)
      summary.mapped++
      continue
    }

    // ── Quantities ────────────────────────────────────────────────────────
    const raw = Number(s.attrs.value)
    // `value` is `#IMPLIED` in Apple's own DTD — some records carry none. The
    // guard is here because `Number(undefined)` is `NaN` and one `NaN` in a
    // day's sum makes the whole day `NaN`, which is a number, which passes
    // every check that asks "is this a number".
    if (s.attrs.value === undefined || !Number.isFinite(raw)) { summary.malformed++; continue }
    const value = convert(rule, raw, s.attrs.unit ?? '')
    if (value === null || !Number.isFinite(value)) { summary.badUnit++; continue }

    const key = `${start.day}|${rule.field}|${sourceClass(s.attrs.sourceName)}`
    const a = acc.get(key)
    if (!a) {
      acc.set(key, { sum: value, n: 1, firstAt: s.attrs.startDate, firstV: value, lastAt: s.attrs.startDate, lastV: value })
    } else {
      a.sum += value
      a.n++
      // Ordered on the timestamp string, which sorts correctly within one day
      // for one offset and is what "earliest reading" means for a basal
      // temperature. Not the arrival order: the export interleaves sources.
      if (s.attrs.startDate < a.firstAt) { a.firstAt = s.attrs.startDate; a.firstV = value }
      if (s.attrs.startDate > a.lastAt) { a.lastAt = s.attrs.startDate; a.lastV = value }
    }
    summary.mapped++
  }

  // ── Resolve one source per (day, field), then emit ──────────────────────
  const metrics = new Map<string, MetricRecord>()
  const bodies = new Map<string, BodyRecord>()
  const cycles = new Map<string, CycleRecord>()
  const resolved = new Map<string, number>() // `${day}|${field}` → value

  for (const [key, a] of acc) {
    const [day, field, cls] = key.split('|')
    const flat = `${day}|${field}`
    // Watch wins outright; `other` only fills a slot the Watch left empty.
    if (cls === 'watch' || !acc.has(`${day}|${field}|watch`)) {
      resolved.set(flat, reduceAcc(RULE_BY_FIELD.get(field)!, a))
    }
  }

  const sleepByDay = sleepHoursByDay(asleep)
  const inBedByDay = sleepHoursByDay(inBed)
  for (const [day, hours] of inBedByDay) {
    if (!sleepByDay.has(day)) { sleepByDay.set(day, hours); summary.inBedDays++ }
  }

  const metricOf = (day: string) => {
    let m = metrics.get(day)
    if (!m) { m = { kind: 'metric', date: day }; metrics.set(day, m) }
    return m
  }
  const bodyOf = (day: string) => {
    let b = bodies.get(day)
    if (!b) { b = { kind: 'body', date: day }; bodies.set(day, b) }
    return b
  }
  const cycleOf = (day: string) => {
    let c = cycles.get(day)
    if (!c) { c = { kind: 'cycle', date: day }; cycles.set(day, c) }
    return c
  }
  const tally = (field: string) => { summary.byField[field] = (summary.byField[field] ?? 0) + 1 }

  for (const [flat, value] of resolved) {
    const [day, field] = flat.split('|')
    const rule = RULE_BY_FIELD.get(field)!
    if (!Number.isFinite(value)) continue
    switch (rule.target) {
      case 'metric':
        // Every metric this app carries is a whole number.
        ;(metricOf(day) as unknown as Record<string, number>)[field] = Math.round(value)
        tally(field)
        break
      case 'body':
        ;(bodyOf(day) as unknown as Record<string, number>)[field] = Math.round(value * 10) / 10
        tally(field)
        break
      case 'measurement': {
        const b = bodyOf(day)
        b.measurements ??= {}
        b.measurements[field] = Math.round(value * 10) / 10
        tally(field)
        break
      }
      case 'cycle': {
        if (field === 'tempC') {
          // Two decimals: a basal chart is read for a shift of ~0.2 °C, so one
          // decimal throws away a third of the signal.
          cycleOf(day).tempC = Math.round(value * 100) / 100
          tally('tempC')
        }
        break
      }
      case 'sleep':
        break
    }
  }

  // General body temperature, second and only where asked for — resolved after
  // basal so it can see which days basal already filled. Separate loop rather
  // than a branch above, because "only where the real measurement is missing"
  // is the entire safeguard and burying it in a switch would hide it.
  for (const [flat, value] of resolved) {
    const [day, field] = flat.split('|')
    if (field !== 'bodyTempC' || !Number.isFinite(value)) continue
    const existing = cycles.get(day)
    if (existing?.tempC !== undefined) continue
    summary.bodyTempDays++
    if (!opts.useBodyTemperature) continue
    cycleOf(day).tempC = Math.round(value * 100) / 100
    tally('bodyTempC')
  }

  for (const [day, hours] of sleepByDay) {
    metricOf(day).sleep = Math.round(hours * 10) / 10
    tally('sleep')
  }
  for (const [day, set] of flags) {
    cycleOf(day).flags = [...set]
    tally('flags')
  }

  summary.sources = [...sources].sort()
  const records: ImportRecord[] = [
    ...[...metrics.values()].filter((m) => Object.keys(m).length > 2),
    ...[...bodies.values()].filter((b) => Object.keys(b).length > 2),
    ...[...cycles.values()].filter((c) => Object.keys(c).length > 2),
    ...workouts,
  ]
  records.sort((a, b) => a.date.localeCompare(b.date))
  return { records, summary }
}
