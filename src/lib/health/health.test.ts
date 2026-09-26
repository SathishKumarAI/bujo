/**
 * Tests for the Apple Health reader, named for the failure each one catches.
 *
 * The fixtures are hand-written and tiny on purpose: every one of them is a
 * shape taken from `docs/import/apple-health-research.md`, and a fixture you
 * can read in full is a fixture whose expected answer you can compute by hand.
 * The large-input check at the bottom is the exception and is generated.
 */
import { describe, expect, it } from 'vitest'
import { aggregate, parseHKDate } from './aggregate'
import { MAPPING, convert, ruleFor } from './hk'
import { scanHealthXml, unescapeXml } from './xml'
import { findHealthXml, readZipIndex, openZipEntry } from './zip'
import { readHealthExport } from './parse'
import { plan } from '../ingest/plan'
import { validateRecords } from '../ingest/validate'
import { emptyJournal } from '../storage'
import type { CycleRecord, MetricRecord, BodyRecord, WorkoutRecord } from '../ingest/envelope'

// ── Fixture helpers ───────────────────────────────────────────────────────

const rec = (attrs: Record<string, string>) =>
  `<Record ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`

const doc = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE HealthData [\n<!ELEMENT HealthData (ExportDate,Me,(Record|Workout)*)>\n]>\n<HealthData locale="en_GB">\n<ExportDate value="2026-09-20 11:02:33 +0100"/>\n${body}\n</HealthData>`

/** A stream of the given text, chopped at `chunk` bytes to exercise the carry-over. */
function streamOf(text: string, chunk = 64): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  let i = 0
  return new ReadableStream({
    pull(ctl) {
      if (i >= bytes.length) { ctl.close(); return }
      ctl.enqueue(bytes.slice(i, i + chunk))
      i += chunk
    },
  })
}

const read = async (xml: string, opts = {}, chunk = 64) =>
  aggregate(scanHealthXml(streamOf(xml, chunk)), opts)

// ── The scanner ───────────────────────────────────────────────────────────

describe('scanHealthXml', () => {
  it('finds every record when each one is split across chunk boundaries', async () => {
    // 7 bytes per chunk is smaller than `<Record `, so EVERY element straddles
    // several reads. The carry-over tail is the only thing making this work,
    // and a 64 KB test chunk would never exercise it.
    const xml = doc(Array.from({ length: 50 }, (_, i) =>
      rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', value: String(i + 1), startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 08:00:30 +0000' })).join('\n'))
    const seen = []
    for await (const s of scanHealthXml(streamOf(xml, 7))) seen.push(s)
    expect(seen).toHaveLength(50)
    expect(seen[49].attrs.value).toBe('50')
  })

  it('does not yield the DTD, ExportDate or any element it does not know', async () => {
    const xml = doc([
      '<Me HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexFemale"/>',
      '<ActivitySummary dateComponents="2026-09-01" activeEnergyBurned="512"/>',
      '<Correlation type="HKCorrelationTypeIdentifierBloodPressure" startDate="2026-09-01 08:00:00 +0000"/>',
      rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', value: '10', startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 08:01:00 +0000' }),
    ].join('\n'))
    const seen = []
    for await (const s of scanHealthXml(streamOf(xml))) seen.push(s)
    expect(seen).toHaveLength(1)
    expect(seen[0].tag).toBe('Record')
  })

  it('reads attributes past an escaped > inside a value, instead of truncating there', async () => {
    // Apple's `device` attribute is `<<HKDevice: 0x…>, name:Apple Watch, …>`,
    // escaped. A scanner that stops at the first `>` loses every attribute
    // after `device` — including `value` — and reports the record as malformed.
    const xml = doc(rec({
      type: 'HKQuantityTypeIdentifierStepCount',
      device: '&lt;&lt;HKDevice: 0x123&gt;, name:Apple Watch, hardware:Watch6,2&gt;',
      unit: 'count', value: '742',
      startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 08:05:00 +0000',
    }))
    const seen = []
    for await (const s of scanHealthXml(streamOf(xml, 13))) seen.push(s)
    expect(seen).toHaveLength(1)
    expect(seen[0].attrs.value).toBe('742')
    expect(seen[0].attrs.device).toContain('Apple Watch')
  })

  it('unescapes only the five XML entities and leaves other ampersands alone', () => {
    expect(unescapeXml('Mum &amp; Dad&apos;s &lt;watch&gt;')).toBe("Mum & Dad's <watch>")
    expect(unescapeXml('100&nbsp;steps')).toBe('100&nbsp;steps')
  })
})

// ── Dates and the timezone rule ───────────────────────────────────────────

describe('parseHKDate', () => {
  it('takes the day from the string and not from a UTC conversion', () => {
    // 00:30 at +0100 is 23:30Z the PREVIOUS day. A UTC-derived key files this
    // under Aug 31; the wall clock the user remembers says Sep 1.
    expect(parseHKDate('2026-09-01 00:30:00 +0100')?.day).toBe('2026-09-01')
    // 17:00 at -0800 is 01:00Z TOMORROW. The other direction, same rule.
    expect(parseHKDate('2026-09-01 17:00:00 -0800')?.day).toBe('2026-09-01')
  })

  it('gives the same day for one wall clock whatever the offset, and different instants', () => {
    const tokyo = parseHKDate('2026-09-01 08:00:00 +0900')
    const london = parseHKDate('2026-09-01 08:00:00 +0100')
    expect(tokyo?.day).toBe(london?.day)
    expect(tokyo).not.toBeNull()
    expect(london!.ms - tokyo!.ms).toBe(8 * 3_600_000)
  })

  it('refuses a string that is not the Health format, rather than handing it to Date', () => {
    // `new Date()` accepts several of these in Chrome; none of them is the
    // documented format, and guessing is how a year lands in the wrong century.
    expect(parseHKDate('2026-09-01T08:00:00Z')).toBeNull()
    expect(parseHKDate('2026-09-01 08:00:00')).toBeNull()
    expect(parseHKDate('not a date')).toBeNull()
    expect(parseHKDate(undefined)).toBeNull()
  })
})

// ── Units ─────────────────────────────────────────────────────────────────

describe('unit conversion', () => {
  const tempRule = MAPPING.find((r) => r.field === 'tempC')!
  const massRule = MAPPING.find((r) => r.field === 'weightKg')!

  it('converts a Fahrenheit basal reading and leaves a Celsius one alone', async () => {
    // The headline mapping, and the headline unit trap: Health exports °F or °C
    // depending on the phone's locale, so the SAME identifier arrives in either.
    expect(convert(tempRule, 97.88, 'degF')).toBeCloseTo(36.6, 2)
    expect(convert(tempRule, 36.6, 'degC')).toBeCloseTo(36.6, 5)
  })

  it('returns null for a unit it cannot convert instead of passing the number through', () => {
    // A `lb` number written into a field meaning kg is silent corruption, which
    // is exactly the class of bug `migrateWorkoutsToV3` exists to clean up.
    expect(convert(massRule, 180, 'stones')).toBeNull()
    expect(convert(tempRule, 300, 'K')).toBeNull()
    expect(convert(massRule, 180, 'lb')).toBeCloseTo(81.65, 2)
  })

  it('reads body fat as a fraction or a percent, because exporters differ', () => {
    const rule = MAPPING.find((r) => r.field === 'bodyFat')!
    expect(convert(rule, 0.185, '%')).toBeCloseTo(18.5, 5)
    expect(convert(rule, 18.5, '%')).toBeCloseTo(18.5, 5)
  })

  it('maps both temperature identifiers but never to the same field', () => {
    const basal = ruleFor('HKQuantityTypeIdentifierBasalBodyTemperature')
    const body = ruleFor('HKQuantityTypeIdentifierBodyTemperature')
    expect(basal?.field).toBe('tempC')
    expect(body?.field).toBe('bodyTempC')
    expect(basal?.field).not.toBe(body?.field)
  })

  it('does not map an identifier this app has no field for', () => {
    expect(ruleFor('HKQuantityTypeIdentifierHeartRateVariabilitySDNN')).toBeUndefined()
    expect(ruleFor('HKQuantityTypeIdentifierOxygenSaturation')).toBeUndefined()
    // A category identifier must not match a quantity rule of the same name.
    expect(ruleFor('HKCategoryTypeIdentifierStepCount')).toBeUndefined()
  })
})

// ── Aggregation ───────────────────────────────────────────────────────────

const temp = (d: string, t: string, v: string, unit = 'degF', source = 'iPhone') =>
  rec({ type: 'HKQuantityTypeIdentifierBasalBodyTemperature', sourceName: source, unit, value: v, startDate: `${d} ${t} +0000`, endDate: `${d} ${t} +0000` })

describe('aggregate · basal temperature', () => {
  it('takes the earliest reading of the day, not the last and not the mean', async () => {
    // A basal temperature is DEFINED as the one taken on waking. The 20:15
    // reading is a body temperature wearing the same label; letting it win, or
    // averaging it in, flattens the shift the chart is read for.
    const { records } = await read(doc([temp('2026-09-01', '06:10:00', '97.70'), temp('2026-09-01', '20:15:00', '99.10')].join('\n')))
    const cycles = records.filter((r): r is CycleRecord => r.kind === 'cycle')
    expect(cycles).toHaveLength(1)
    expect(cycles[0].tempC).toBeCloseTo(36.5, 1)
  })

  it('orders by timestamp, not by the order the export happened to list them', async () => {
    const { records } = await read(doc([temp('2026-09-01', '20:15:00', '99.10'), temp('2026-09-01', '06:10:00', '97.70')].join('\n')))
    const c = records.find((r): r is CycleRecord => r.kind === 'cycle')
    expect(c?.tempC).toBeCloseTo(36.5, 1)
  })

  it('never lets general body temperature into the basal field by default', async () => {
    const xml = doc(rec({
      type: 'HKQuantityTypeIdentifierBodyTemperature', unit: 'degF', value: '100.40',
      startDate: '2026-09-02 14:00:00 +0000', endDate: '2026-09-02 14:00:00 +0000',
    }))
    const off = await read(xml)
    expect(off.records.filter((r) => r.kind === 'cycle')).toHaveLength(0)
    // …but it is counted and reported, not silently swallowed.
    expect(off.summary.bodyTempDays).toBe(1)

    const on = await read(xml, { useBodyTemperature: true })
    const c = on.records.find((r): r is CycleRecord => r.kind === 'cycle')
    expect(c?.tempC).toBeCloseTo(38, 1)
  })

  it('keeps the basal reading when both temperatures exist on one day', async () => {
    const xml = doc([
      temp('2026-09-03', '06:00:00', '97.70'),
      rec({ type: 'HKQuantityTypeIdentifierBodyTemperature', unit: 'degF', value: '101.30', startDate: '2026-09-03 15:00:00 +0000', endDate: '2026-09-03 15:00:00 +0000' }),
    ].join('\n'))
    const { records } = await read(xml, { useBodyTemperature: true })
    const c = records.find((r): r is CycleRecord => r.kind === 'cycle')
    expect(c?.tempC).toBeCloseTo(36.5, 1) // the basal one, not the 38.5 fever
  })
})

describe('aggregate · steps and sources', () => {
  const steps = (d: string, t: string, v: string, source: string) =>
    rec({ type: 'HKQuantityTypeIdentifierStepCount', sourceName: source, unit: 'count', value: v, startDate: `${d} ${t} +0000`, endDate: `${d} ${t} +0000` })

  it('sums the samples of one day', async () => {
    const { records } = await read(doc([steps('2026-09-01', '08:00:00', '400', 'iPhone'), steps('2026-09-01', '09:00:00', '600', 'iPhone')].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.steps).toBe(1_000)
  })

  it('does not add the Watch and the iPhone together and report double', async () => {
    // `export.xml` is a raw dump, not the de-duplicated view the Health app
    // shows. A phone in a pocket and a watch on a wrist both record the walk.
    const { records } = await read(doc([
      steps('2026-09-01', '08:00:00', '5000', 'Sathish’s iPhone'),
      steps('2026-09-01', '08:00:00', '5200', 'Sathish’s Apple Watch'),
    ].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.steps).toBe(5_200) // the Watch, not 10,200
  })

  it('falls back to the phone on a day the Watch wrote nothing', async () => {
    const { records } = await read(doc([
      steps('2026-09-01', '08:00:00', '5200', 'Apple Watch'),
      steps('2026-09-02', '08:00:00', '4000', 'iPhone'),
    ].join('\n')))
    const byDay = Object.fromEntries(records.filter((r): r is MetricRecord => r.kind === 'metric').map((m) => [m.date, m.steps]))
    expect(byDay).toEqual({ '2026-09-01': 5_200, '2026-09-02': 4_000 })
  })

  it('drops a record with no value rather than letting NaN poison the day', async () => {
    // `value` is #IMPLIED in Apple's own DTD. `Number(undefined)` is NaN, NaN is
    // a number, and one NaN makes the whole day's sum NaN — which passes every
    // check that asks "is this a number".
    const { records, summary } = await read(doc([
      steps('2026-09-01', '08:00:00', '400', 'iPhone'),
      rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', startDate: '2026-09-01 09:00:00 +0000', endDate: '2026-09-01 09:00:00 +0000' }),
      rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', value: 'NaN', startDate: '2026-09-01 10:00:00 +0000', endDate: '2026-09-01 10:00:00 +0000' }),
    ].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.steps).toBe(400)
    expect(summary.malformed).toBe(2)
  })

  it('counts a malformed record and an unmapped one separately', async () => {
    const { summary } = await read(doc([
      rec({ type: 'HKQuantityTypeIdentifierOxygenSaturation', unit: '%', value: '0.98', startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 08:00:00 +0000' }),
      rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', value: '5', startDate: 'garbage', endDate: 'garbage' }),
    ].join('\n')))
    expect(summary.unmapped).toBe(1)
    expect(summary.malformed).toBe(1)
    expect(summary.mapped).toBe(0)
  })
})

// ── Sleep ─────────────────────────────────────────────────────────────────

const sleep = (value: string, start: string, end: string, source = 'Apple Watch') =>
  rec({ type: 'HKCategoryTypeIdentifierSleepAnalysis', sourceName: source, value, startDate: start, endDate: end })

describe('aggregate · sleep', () => {
  it('files a night that crosses midnight on the day you woke up', async () => {
    const { records } = await read(doc(sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-01 23:00:00 +0000', '2026-09-02 07:00:00 +0000')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.date).toBe('2026-09-02') // not 2026-09-01
    expect(m?.sleep).toBe(8)
  })

  it('does not count the InBed envelope on top of the stages inside it', async () => {
    // The double-count that reports 14 hours for an 8-hour night. InBed spans
    // the whole window; Core/Deep/REM tile it from the inside.
    const { records } = await read(doc([
      sleep('HKCategoryValueSleepAnalysisInBed', '2026-09-01 22:45:00 +0000', '2026-09-02 07:15:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-01 23:00:00 +0000', '2026-09-02 02:00:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAsleepDeep', '2026-09-02 02:00:00 +0000', '2026-09-02 04:00:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAsleepREM', '2026-09-02 04:00:00 +0000', '2026-09-02 07:00:00 +0000'),
    ].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.sleep).toBe(8) // 3 + 2 + 3, and NOT 8 + 8.5
  })

  it('drops Awake segments inside a session', async () => {
    const { records } = await read(doc([
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-01 23:00:00 +0000', '2026-09-02 03:00:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAwake', '2026-09-02 03:00:00 +0000', '2026-09-02 03:30:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-02 03:30:00 +0000', '2026-09-02 06:30:00 +0000'),
    ].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.sleep).toBe(7) // 4 + 3, the half hour awake excluded
  })

  it('unions two trackers covering the same night instead of adding them', async () => {
    // A Watch and a third-party app both write asleep segments for one night.
    // Union is the only operation that is right whether they agree or not.
    const { records } = await read(doc([
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-01 23:00:00 +0000', '2026-09-02 05:00:00 +0000', 'Apple Watch'),
      sleep('HKCategoryValueSleepAnalysisAsleepUnspecified', '2026-09-01 23:30:00 +0000', '2026-09-02 06:00:00 +0000', 'AutoSleep'),
    ].join('\n')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.sleep).toBe(7) // 23:00 → 06:00, not 6 + 6.5
  })

  it('keeps an afternoon nap out of that night, by splitting on a gap over 3 hours', async () => {
    const { records } = await read(doc([
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-02 14:00:00 +0000', '2026-09-02 15:00:00 +0000'),
      sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-09-02 23:00:00 +0000', '2026-09-03 07:00:00 +0000'),
    ].join('\n')))
    const byDay = Object.fromEntries(records.filter((r): r is MetricRecord => r.kind === 'metric').map((m) => [m.date, m.sleep]))
    expect(byDay).toEqual({ '2026-09-02': 1, '2026-09-03': 8 })
  })

  it('falls back to time in bed, and says it did, for a journal with no stage records', async () => {
    // Before watchOS 9 there are no stage records at all. A rule that drops
    // InBed unconditionally imports zero sleep for everything before ~2022 and
    // reports success.
    const { records, summary } = await read(doc(sleep('HKCategoryValueSleepAnalysisInBed', '2019-03-01 23:00:00 +0000', '2019-03-02 07:30:00 +0000', 'iPhone')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.sleep).toBe(8.5)
    expect(summary.inBedDays).toBe(1)
  })

  it('measures a session spanning a DST change from the instants, not the wall clocks', async () => {
    // Europe/London spring forward: 01:00 +0000 → 02:00 +0100. The wall clocks
    // say 23:00 → 07:00 = 8 hours; the real elapsed time is 7.
    const { records } = await read(doc(sleep('HKCategoryValueSleepAnalysisAsleepCore', '2026-03-28 23:00:00 +0000', '2026-03-29 07:00:00 +0100')))
    const m = records.find((r): r is MetricRecord => r.kind === 'metric')
    expect(m?.sleep).toBe(7)
  })
})

// ── Body, cycle flags and workouts ────────────────────────────────────────

describe('aggregate · body and workouts', () => {
  it('takes the last weight of the day, in kilograms whatever the export said', async () => {
    const { records } = await read(doc([
      rec({ type: 'HKQuantityTypeIdentifierBodyMass', unit: 'lb', value: '180.0', startDate: '2026-09-01 07:00:00 +0000', endDate: '2026-09-01 07:00:00 +0000' }),
      rec({ type: 'HKQuantityTypeIdentifierBodyMass', unit: 'kg', value: '81.0', startDate: '2026-09-01 19:00:00 +0000', endDate: '2026-09-01 19:00:00 +0000' }),
    ].join('\n')))
    const b = records.find((r): r is BodyRecord => r.kind === 'body')
    expect(b?.weightKg).toBe(81)
  })

  it('maps a workout to an activity this app has, and drops one it does not', async () => {
    const xml = doc([
      '<Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="32.5" durationUnit="min" totalDistance="5.2" totalDistanceUnit="km" totalEnergyBurned="410" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" startDate="2026-09-01 07:12:00 +0100" endDate="2026-09-01 07:44:30 +0100"><MetadataEntry key="HKIndoorWorkout" value="0"/></Workout>',
      '<Workout workoutActivityType="HKWorkoutActivityTypeArchery" duration="45" durationUnit="min" sourceName="Apple Watch" startDate="2026-09-02 10:00:00 +0100" endDate="2026-09-02 10:45:00 +0100"/>',
    ].join('\n'))
    const { records, summary } = await read(xml)
    const w = records.filter((r): r is WorkoutRecord => r.kind === 'workout')
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ activity: 'run', durationMin: 33, distanceKm: 5.2, calories: 410, date: '2026-09-01' })
    // Dropped, not coerced to `other`: `normalizeActivity` would have turned
    // archery into a real-looking cardio row.
    expect(summary.unmappedWorkouts).toBe(1)
  })

  it('gives a workout an `at` whose local day matches its date, so the validator accepts it', async () => {
    // The offsetless wall clock is deliberate. An instant carrying +0900 read
    // in a UTC-ish zone is the previous day, and `validateRecord` rejects a
    // workout whose `at` is not on its `date` — so a trip abroad would import
    // as "N records skipped".
    const { records } = await read(doc('<Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="40" durationUnit="min" sourceName="Apple Watch" startDate="2026-09-01 08:00:00 +0900" endDate="2026-09-01 08:40:00 +0900"/>'))
    const { rejected } = validateRecords(records)
    expect(rejected).toEqual([])
    const w = records.find((r): r is WorkoutRecord => r.kind === 'workout')
    expect(w?.at).toBe('2026-09-01T08:00:00')
    expect(w?.date).toBe('2026-09-01')
  })

  it('collapses a third-party copy of the same run into one row', async () => {
    const one = (source: string, kcal: string) =>
      `<Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="32" durationUnit="min" totalEnergyBurned="${kcal}" totalEnergyBurnedUnit="kcal" sourceName="${source}" startDate="2026-09-01 07:12:00 +0100" endDate="2026-09-01 07:44:00 +0100"/>`
    const { records } = await read(doc([one('Apple Watch', '410'), one('Strava', '388')].join('\n')))
    expect(records.filter((r) => r.kind === 'workout')).toHaveLength(1)
  })

  it('maps menstrual flow to cycle flags only when the Cycle page is on', async () => {
    const xml = doc([
      rec({ type: 'HKCategoryTypeIdentifierMenstrualFlow', value: 'HKCategoryValueMenstrualFlowHeavy', startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 08:00:00 +0000' }),
      rec({ type: 'HKCategoryTypeIdentifierMenstrualFlow', value: 'HKCategoryValueMenstrualFlowUnspecified', startDate: '2026-09-05 08:00:00 +0000', endDate: '2026-09-05 08:00:00 +0000' }),
    ].join('\n'))
    expect((await read(xml)).records.filter((r) => r.kind === 'cycle')).toHaveLength(0)
    const on = await read(xml, { cycleEnabled: true })
    const flags = on.records.filter((r): r is CycleRecord => r.kind === 'cycle').map((c) => c.flags)
    expect(flags).toEqual([['period'], ['spotting']])
  })
})

// ── End to end, through the existing pipeline ─────────────────────────────

describe('a Health export through validate → plan', () => {
  const xml = doc([
    temp('2026-09-01', '06:05:00', '97.52'),
    temp('2026-09-02', '06:10:00', '97.88'),
    rec({ type: 'HKQuantityTypeIdentifierStepCount', unit: 'count', value: '8200', startDate: '2026-09-01 08:00:00 +0000', endDate: '2026-09-01 20:00:00 +0000' }),
  ].join('\n'))

  it('lands the basal temperature on CyclePoint.temp in the journal unit', async () => {
    const { records } = await read(xml)
    const { records: good, rejected } = validateRecords(records)
    expect(rejected).toEqual([])
    const f = await plan(good, emptyJournal(), { source: 'apple-health', tempUnit: 'F' })
    expect(f.next.cycle.find((c) => c.date === '2026-09-01')?.temp).toBeCloseTo(97.52, 1)
    const c = await plan(good, emptyJournal(), { source: 'apple-health', tempUnit: 'C' })
    expect(c.next.cycle.find((c2) => c2.date === '2026-09-01')?.temp).toBeCloseTo(36.4, 1)
  })

  it('is idempotent — importing the same export twice changes nothing the second time', async () => {
    const { records } = await read(xml)
    const { records: good } = validateRecords(records)
    const first = await plan(good, emptyJournal(), { source: 'apple-health', tempUnit: 'F' })
    expect(first.counts.added).toBeGreaterThan(0)
    const second = await plan(good, first.next, { source: 'apple-health', tempUnit: 'F' })
    expect(second.counts.added).toBe(0)
    expect(second.counts.updated).toBe(0)
    expect(second.counts.conflicts).toBe(0)
    expect(JSON.stringify(second.next)).toBe(JSON.stringify(first.next))
  })

  it('keeps a hand-typed temperature and reports the collision instead of overwriting it', async () => {
    // The merge default, and the reason the feature is safe to run: a basal
    // temperature is typed in by hand every morning, so the human wins.
    const journal = emptyJournal()
    journal.cycle.push({ date: '2026-09-01', temp: 97.9, flags: [] })
    const { records } = await read(xml)
    const { records: good } = validateRecords(records)
    const p = await plan(good, journal, { source: 'apple-health', tempUnit: 'F' })
    expect(p.counts.conflicts).toBe(1)
    expect(p.conflicts[0]).toMatchObject({ field: 'temp', date: '2026-09-01', mine: 97.9 })
    expect(p.next.cycle.find((c) => c.date === '2026-09-01')?.temp).toBe(97.9)
  })

  it('overwrites the hand-typed value only when asked, and says how many', async () => {
    const journal = emptyJournal()
    journal.cycle.push({ date: '2026-09-01', temp: 97.9, flags: [] })
    const { records } = await read(xml)
    const { records: good } = validateRecords(records)
    const p = await plan(good, journal, { source: 'apple-health', tempUnit: 'F', takeTheirs: true })
    expect(p.counts.conflicts).toBe(0)
    expect(p.counts.updated).toBe(1)
    expect(p.next.cycle.find((c) => c.date === '2026-09-01')?.temp).toBeCloseTo(97.52, 1)
  })

  it('updates steps without asking, because no part of the UI can type one', async () => {
    const journal = emptyJournal()
    journal.metrics.push({ date: '2026-09-01', steps: 7000 })
    const { records } = await read(xml)
    const { records: good } = validateRecords(records)
    const p = await plan(good, journal, { source: 'apple-health' })
    expect(p.counts.conflicts).toBe(0)
    expect(p.next.metrics.find((m) => m.date === '2026-09-01')?.steps).toBe(8_200)
  })

  it('rejects a temperature that was never converted out of Fahrenheit', async () => {
    // The backstop for the whole unit story: if a mapping change ever let a
    // raw °F reading through, the range refuses it rather than plotting a
    // 97-degree Celsius fever.
    const { rejected } = validateRecords([{ kind: 'cycle', date: '2026-09-01', tempC: 97.88 }])
    expect(rejected).toHaveLength(1)
    expect(rejected[0].reason).toContain('tempC')
  })
})

// ── The zip container ─────────────────────────────────────────────────────

/**
 * A minimal one-entry zip with a STORED (method 0) entry.
 *
 * Stored on purpose: it exercises the central-directory walk and the local-
 * header offset arithmetic — the parts this repo actually wrote — without
 * depending on `CompressionStream`, which is not in every test environment. The
 * deflate path is one `pipeThrough` on top of the same offsets.
 */
function storedZip(name: string, content: string): Blob {
  const nameBytes = new TextEncoder().encode(name)
  const body = new TextEncoder().encode(content)
  const crc = 0 // never checked by this reader; the decompressor would catch corruption

  const local = new Uint8Array(30 + nameBytes.length)
  const lv = new DataView(local.buffer)
  lv.setUint32(0, 0x0403_4b50, true)
  lv.setUint16(4, 10, true)
  lv.setUint16(8, 0, true) // method 0, stored
  lv.setUint32(14, crc, true)
  lv.setUint32(18, body.length, true)
  lv.setUint32(22, body.length, true)
  lv.setUint16(26, nameBytes.length, true)
  local.set(nameBytes, 30)

  const cd = new Uint8Array(46 + nameBytes.length)
  const cv = new DataView(cd.buffer)
  cv.setUint32(0, 0x0201_4b50, true)
  cv.setUint16(10, 0, true)
  cv.setUint32(16, crc, true)
  cv.setUint32(20, body.length, true)
  cv.setUint32(24, body.length, true)
  cv.setUint16(28, nameBytes.length, true)
  cv.setUint32(42, 0, true) // local header at offset 0
  cd.set(nameBytes, 46)

  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x0605_4b50, true)
  ev.setUint16(8, 1, true)
  ev.setUint16(10, 1, true)
  ev.setUint32(12, cd.length, true)
  ev.setUint32(16, local.length + body.length, true)

  return new Blob([local, body, cd, eocd])
}

describe('the zip reader', () => {
  it('finds export.xml by its byte range and reads it', async () => {
    const xml = doc(temp('2026-09-01', '06:00:00', '97.70'))
    const zip = storedZip('apple_health_export/export.xml', xml)
    const index = await readZipIndex(zip)
    expect(index.map((e) => e.name)).toEqual(['apple_health_export/export.xml'])
    const entry = findHealthXml(index)
    expect(entry).toBeDefined()
    const stream = await openZipEntry(zip, entry!)
    const seen = []
    for await (const s of scanHealthXml(stream)) seen.push(s)
    expect(seen).toHaveLength(1)
  })

  it('does not mistake export_cda.xml for the file it wants', async () => {
    // The clinical-document rendering. Matching on a suffix would take it, and
    // it holds largely the same information in a shape none of this parses.
    const index = [
      { name: 'apple_health_export/export_cda.xml', method: 0, compressedSize: 1, uncompressedSize: 1, headerOffset: 0 },
      { name: 'apple_health_export/workout-routes/route.gpx', method: 0, compressedSize: 1, uncompressedSize: 1, headerOffset: 0 },
    ]
    expect(findHealthXml(index)).toBeUndefined()
  })

  it('says what the archive contained when there is no export.xml, rather than "failed"', async () => {
    const zip = storedZip('photos/cat.jpg', 'not xml')
    await expect(readHealthExport(zip)).rejects.toThrow(/photos\/cat\.jpg/)
  })

  it('refuses a file that is not a zip and not XML with a sentence, not a stack trace', async () => {
    await expect(readZipIndex(new Blob(['just some text, nowhere near a zip']))).rejects.toThrow(/not a zip archive/)
  })

  it('reads a bare export.xml too, decided by the bytes and not the file name', async () => {
    // A user who already unzipped has this in their hand, and the extension
    // may be anything by then.
    const file = new File([doc(temp('2026-09-01', '06:00:00', '97.70'))], 'whatever.txt')
    const { records, info } = await readHealthExport(file)
    expect(info.kind).toBe('xml')
    expect(records).toHaveLength(1)
  })
})

// ── The large-input check ─────────────────────────────────────────────────

describe('a large export', () => {
  /**
   * 300,000 records — two thirds of a real 1.5-year export (446,670) and ~46 MB
   * of XML, generated on the fly so nothing that large is committed.
   *
   * What this proves is **not throughput**, it is that nothing accumulates: the
   * record count out is bounded by DAYS, not by samples, and the scanner's
   * whole memory is one chunk plus a partial element. 300k samples across 365
   * days must come out as at most a few hundred records.
   */
  it('folds 300,000 samples into one row per day without holding them', async () => {
    const DAYS = 365
    const PER_DAY = 822 // 300,030 records total
    const open = '<?xml version="1.0"?>\n<HealthData locale="en_GB">\n'

    const stream = new ReadableStream<Uint8Array>({
      start(ctl) { ctl.enqueue(new TextEncoder().encode(open)) },
      pull(ctl) {
        if (day >= DAYS) { ctl.enqueue(new TextEncoder().encode('</HealthData>')); ctl.close(); return }
        const date = `2025-${String(Math.floor(day / 31) + 1).padStart(2, '0')}-${String((day % 31) + 1).padStart(2, '0')}`
        let chunk = ''
        for (let i = 0; i < PER_DAY; i++) {
          const t = `${String(Math.floor(i / 60) % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
          chunk += `<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" value="10" startDate="${date} ${t} +0000" endDate="${date} ${t} +0000"/>\n`
        }
        day++
        ctl.enqueue(new TextEncoder().encode(chunk))
      },
    })
    let day = 0

    const ticks: number[] = []
    const { records, summary } = await aggregate(
      scanHealthXml(stream, (p) => ticks.push(p.records), 50_000),
    )

    expect(summary.samples).toBe(DAYS * PER_DAY)
    expect(summary.mapped).toBe(DAYS * PER_DAY)
    // The whole point: 300,030 samples in, at most one record per calendar day
    // out. If this number ever tracks `samples`, the fold has been lost and the
    // import will OOM a phone.
    expect(records.length).toBeLessThanOrEqual(DAYS)
    expect(records.length).toBeGreaterThan(300)
    // Progress was reported while it ran, not once at the end — a silent
    // ten-second freeze reads as a crash.
    expect(ticks.length).toBeGreaterThan(4)
  }, 120_000)
})
