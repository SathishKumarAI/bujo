import { describe, expect, it } from 'vitest'
import { emptyJournal } from '../storage'
import { addDays, todayISO } from '../date'
import { ENVELOPE_VERSION, MAX_RECORDS, RECORD_KINDS, srcKey, type ImportRecord } from './envelope'
import { isISODay, validateEnvelope, validateRecord, validateRecords } from './validate'
import { KG_PER_LB, ofArray, plan } from './plan'

const env = (records: unknown[], extra: Record<string, unknown> = {}) =>
  ({ envelope: ENVELOPE_VERSION, source: 'claude', records, ...extra })

/**
 * An instant on a given local day, built in the runner's own zone.
 *
 * A literal `"2026-09-01T07:12:00Z"` is 23:12 on **August 31** west of UTC-8,
 * so a test that asserts its local day would pass here and fail in CI or on a
 * traveller's laptop. The planner's own rule is that a record's instant must
 * agree with its day; the test has to obey the same rule it is checking.
 */
const atLocal = (y: number, m: number, d: number, h = 7, min = 12) =>
  new Date(y, m - 1, d, h, min).toISOString()

/** The rejection, or a failure saying the record was accepted when it must not be. */
const rejectionOf = (raw: unknown, index = 0) => {
  const r = validateRecord(raw, index)
  if (r.ok) throw new Error(`expected a rejection, got a valid ${r.record.kind} record`)
  return r.rejected
}

const journalWith = (mutate: (j: ReturnType<typeof emptyJournal>) => void = () => {}) => {
  const j = emptyJournal()
  mutate(j)
  return j
}

describe('validateEnvelope', () => {
  it('accepts a well-formed envelope', () => {
    expect(validateEnvelope(env([{ kind: 'metric', date: '2026-09-01', mood: 7 }])).ok).toBe(true)
  })

  it('refuses a newer format rather than half-reading it', () => {
    const r = validateEnvelope(env([{}], { envelope: 2 }))
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/newer version/)
  })

  it('refuses an unknown source', () => {
    const r = validateEnvelope(env([{}], { source: 'fitbit' }))
    expect(r.error).toMatch(/Unknown import source "fitbit"/)
  })

  it('refuses a file too large to be one import, and says what to do', () => {
    const r = validateEnvelope(env(new Array(MAX_RECORDS + 1).fill({ kind: 'metric', date: '2026-09-01' })))
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/Split it by year/)
  })

  it('refuses text that is not JSON at all', () => {
    expect(validateEnvelope('not json').error).toMatch(/isn't JSON/)
  })

  it('reads an envelope straight from text', () => {
    const r = validateEnvelope(JSON.stringify(env([{ kind: 'metric', date: '2026-09-01' }])))
    expect(r.ok).toBe(true)
    expect(r.envelope?.records).toHaveLength(1)
  })
})

describe('validateRecord', () => {
  /**
   * The failure this catches: a date that passes the regex and is not a day.
   * `fromISODay('2026-02-31')` silently rolls to March 3, so the pattern alone
   * would import a run onto a day that does not exist, dated three days late.
   */
  it('rejects a date that looks right and is not a day', () => {
    expect(isISODay('2026-02-31')).toBe(false)
    expect(isISODay('2026-02-28')).toBe(true)
    expect(rejectionOf({ kind: 'metric', date: '2026-02-31', mood: 5 }).reason).toMatch(/not a real date/)
  })

  it('rejects a record dated past tomorrow, and allows tomorrow', () => {
    expect(validateRecord({ kind: 'metric', date: addDays(todayISO(), 1), mood: 5 }, 0).ok).toBe(true)
    expect(rejectionOf({ kind: 'metric', date: addDays(todayISO(), 9), mood: 5 }).reason).toMatch(/outside the journal's lifetime/)
  })

  /**
   * Rejected, not clamped: a mood of 9999 clamped to 10 is a fabricated perfect
   * day that nothing downstream can tell from a real one.
   */
  it('rejects an out-of-range number instead of clamping it', () => {
    const rejected = rejectionOf({ kind: 'metric', date: '2026-09-01', mood: 9999 }, 3)
    expect(rejected).toMatchObject({ index: 3, kind: 'metric', date: '2026-09-01' })
    expect(rejected.reason).toMatch(/mood 9999 is outside 0–10/)
  })

  it('rejects a body fat given as HealthKit\'s 0-1 fraction', () => {
    expect(validateRecord({ kind: 'body', date: '2026-09-01', bodyFat: 0.18 }, 0).ok).toBe(false)
    expect(validateRecord({ kind: 'body', date: '2026-09-01', bodyFat: 18 }, 0).ok).toBe(true)
  })

  it('rejects a pound value pasted into the kilogram field', () => {
    expect(validateRecord({ kind: 'body', date: '2026-09-01', weightKg: 420 }, 0).ok).toBe(false)
    expect(validateRecord({ kind: 'body', date: '2026-09-01', weightKg: 82 }, 0).ok).toBe(true)
  })

  it('rejects an invented activity rather than downgrading it to "other"', () => {
    expect(rejectionOf({ kind: 'workout', date: '2026-09-01', activity: 'crossfit' }).reason).toMatch(/unknown activity/)
  })

  it('rejects a workout whose instant is not on its own day', () => {
    expect(rejectionOf({ kind: 'workout', date: '2026-09-01', activity: 'run', at: '2026-09-03T07:00:00Z' }).reason)
      .toMatch(/is not on 2026-09-01/)
  })

  it('rejects an unknown kind', () => {
    expect(validateRecord({ kind: 'sleepScore', date: '2026-09-01' }, 0).ok).toBe(false)
  })

  it('rejects a prose blob pasted into a note', () => {
    expect(rejectionOf({ kind: 'workout', date: '2026-09-01', activity: 'run', notes: 'x'.repeat(2_001) }).reason)
      .toMatch(/over the 2000 limit/)
  })

  it('rejects an unbounded measurement key space', () => {
    const measurements = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`m${i}`, 1]))
    expect(validateRecord({ kind: 'body', date: '2026-09-01', measurements }, 0).ok).toBe(false)
  })

  it('keeps the good records when one is bad', () => {
    const { records, rejected } = validateRecords([
      { kind: 'metric', date: '2026-09-01', mood: 7 },
      { kind: 'metric', date: '2026-09-02', mood: 99 },
      { kind: 'metric', date: '2026-09-03', mood: 6 },
    ])
    expect(records).toHaveLength(2)
    expect(rejected).toHaveLength(1)
    expect(rejected[0].index).toBe(1)
  })
})

describe('plan', () => {
  it('writes into an empty day and counts it as added', async () => {
    const p = await plan(ofArray<ImportRecord>([{ kind: 'metric', date: '2026-09-01', mood: 7, sleep: 7.5 }]), emptyJournal())
    expect(p.counts).toMatchObject({ added: 2, updated: 0, unchanged: 0, conflicts: 0 })
    expect(p.next.metrics[0]).toMatchObject({ date: '2026-09-01', mood: 7, sleep: 7.5 })
    expect(p.dateRange).toEqual({ from: '2026-09-01', to: '2026-09-01' })
  })

  /** The property the whole design rests on: importing twice is importing once. */
  it('is idempotent — the second plan of the same records changes nothing', async () => {
    const records: ImportRecord[] = [
      { kind: 'metric', date: '2026-09-01', mood: 7, steps: 8_200 },
      { kind: 'workout', date: '2026-09-01', activity: 'run', at: atLocal(2026, 9, 1), durationMin: 40, distanceKm: 6 },
      { kind: 'entry', date: '2026-09-01', text: 'Ran the river loop' },
      { kind: 'cycle', date: '2026-09-01', flags: ['period'] },
    ]
    const first = await plan(ofArray(records), emptyJournal(), { source: 'apple-health' })
    const second = await plan(ofArray(records), first.next, { source: 'apple-health' })
    expect(second.counts.added).toBe(0)
    expect(second.counts.updated).toBe(0)
    expect(second.counts.conflicts).toBe(0)
    expect(second.next.workouts).toHaveLength(1)
    expect(second.next.entries).toHaveLength(1)
    expect(second.next.metrics).toHaveLength(1)
    expect(second.next.cycle[0].flags).toEqual(['period'])
  })

  it('never touches the journal it was given', async () => {
    const journal = journalWith((j) => { j.metrics = [{ date: '2026-09-01', mood: 5 }] })
    const before = JSON.stringify(journal)
    await plan(ofArray<ImportRecord>([{ kind: 'metric', date: '2026-09-01', mood: 9, steps: 100 }]), journal)
    expect(JSON.stringify(journal)).toBe(before)
  })

  it('shows a disagreement as a conflict and keeps the typed value', async () => {
    const journal = journalWith((j) => { j.metrics = [{ date: '2026-09-01', mood: 5 }] })
    const p = await plan(ofArray<ImportRecord>([{ kind: 'metric', date: '2026-09-01', mood: 9 }]), journal)
    expect(p.counts.conflicts).toBe(1)
    expect(p.conflicts[0]).toMatchObject({ date: '2026-09-01', field: 'mood', mine: 5, theirs: 9 })
    expect(p.next.metrics[0].mood).toBe(5)
  })

  it('takes theirs for every conflict when asked', async () => {
    const journal = journalWith((j) => { j.metrics = [{ date: '2026-09-01', mood: 5 }] })
    const p = await plan(ofArray<ImportRecord>([{ kind: 'metric', date: '2026-09-01', mood: 9 }]), journal, { takeTheirs: true })
    expect(p.counts).toMatchObject({ conflicts: 0, updated: 1 })
    expect(p.next.metrics[0].mood).toBe(9)
  })

  /**
   * No UI writes steps, so a changed step count has no human value to defend.
   * Without this rule every corrected re-export would present thousands of
   * conflicts for numbers nobody could have typed.
   */
  it('updates a machine-only field without asking', async () => {
    const journal = journalWith((j) => { j.metrics = [{ date: '2026-09-01', mood: 5, steps: 8_000 }] })
    const p = await plan(ofArray<ImportRecord>([{ kind: 'metric', date: '2026-09-01', steps: 8_200 }]), journal)
    expect(p.counts).toMatchObject({ updated: 1, conflicts: 0 })
    expect(p.next.metrics[0].steps).toBe(8_200)
    expect(p.next.metrics[0].mood).toBe(5)
  })

  it('matches a re-imported workout by provenance instead of appending', async () => {
    const rec = { kind: 'workout', date: '2026-09-01', activity: 'run', at: atLocal(2026, 9, 1), durationMin: 40 } as ImportRecord
    const first = await plan(ofArray([rec]), emptyJournal(), { source: 'apple-health' })
    expect(first.next.workouts[0].src).toBe(srcKey('apple-health', rec as never))
    const corrected = { ...rec, durationMin: 42 } as ImportRecord
    const second = await plan(ofArray([corrected]), first.next, { source: 'apple-health' })
    expect(second.next.workouts).toHaveLength(1)
    expect(second.next.workouts[0].durationMin).toBe(42)
    expect(second.counts.updated).toBe(1)
  })

  it('converts kilograms into the unit the journal stores', async () => {
    const kg = await plan(ofArray<ImportRecord>([{ kind: 'body', date: '2026-09-01', weightKg: 82 }]), emptyJournal(), { weightUnit: 'kg' })
    expect(kg.next.bodyMetrics[0].weight).toBe(82)
    const lb = await plan(ofArray<ImportRecord>([{ kind: 'body', date: '2026-09-01', weightKg: 82 }]), emptyJournal(), { weightUnit: 'lb' })
    expect(lb.next.bodyMetrics[0].weight).toBeCloseTo(82 / KG_PER_LB, 0)
  })

  it('refuses to invent a habit an import names', async () => {
    const p = await plan(ofArray<ImportRecord>([{ kind: 'habit', date: '2026-09-01', habit: 'Cold plunge' }]), emptyJournal())
    expect(p.next.habits).toHaveLength(0)
    expect(p.counts.rejected).toBe(1)
    expect(p.notes[0]).toMatch(/does not have/)
  })

  it('logs a habit the journal does have, by name or id', async () => {
    const journal = journalWith((j) => {
      j.habits = [{ id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' }]
    })
    const p = await plan(ofArray<ImportRecord>([{ kind: 'habit', date: '2026-09-01', habit: 'read' }]), journal)
    expect(p.next.habitLog['2026-09-01']).toEqual(['h1'])
  })

  it('dedupes an entry on the rule bulkAddEvents already uses', async () => {
    const rec: ImportRecord = { kind: 'entry', date: '2026-09-01', text: 'Dentist' }
    const first = await plan(ofArray([rec]), emptyJournal())
    const second = await plan(ofArray([rec]), first.next)
    expect(second.next.entries).toHaveLength(1)
    expect(second.counts.unchanged).toBe(1)
  })

  /**
   * The `ID_ARRAYS` lesson from `conflict.ts`, applied before it can bite:
   * a kind added to the union with no planner branch would silently drop every
   * record of that kind. This fails instead.
   */
  it('has a planner branch for every record kind', async () => {
    const sample: Record<string, ImportRecord> = {
      metric: { kind: 'metric', date: '2026-09-01', mood: 7 },
      workout: { kind: 'workout', date: '2026-09-01', activity: 'run' },
      body: { kind: 'body', date: '2026-09-01', weightKg: 80 },
      habit: { kind: 'habit', date: '2026-09-01', habit: 'h1' },
      entry: { kind: 'entry', date: '2026-09-01', text: 'x' },
      cycle: { kind: 'cycle', date: '2026-09-01', flags: ['period'] },
    }
    const journal = journalWith((j) => {
      j.habits = [{ id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' }]
    })
    for (const kind of RECORD_KINDS) {
      expect(sample[kind], `no sample record for kind "${kind}"`).toBeDefined()
      const p = await plan(ofArray([sample[kind]]), journal)
      const touched = p.counts.added + p.counts.updated + p.counts.unchanged + p.counts.conflicts
      expect(touched, `kind "${kind}" was planned into nothing`).toBeGreaterThan(0)
    }
  })
})
