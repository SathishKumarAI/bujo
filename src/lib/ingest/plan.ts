/**
 * THE PLANNER · turns validated records into a whole candidate journal.
 *
 * **This is the safety argument for the entire import feature.** `plan()` takes
 * a journal and returns a new one; it holds no reference to the store, cannot
 * dispatch, and is a pure function of (records, journal). Nothing is written
 * until a caller hands `plan.next` to `replaceAll`, so a throw anywhere in
 * parse, validate or plan leaves the existing journal untouched — there is no
 * half-applied state to recover from, because there is no incremental write.
 *
 * The dedupe rule, in one sentence: **a record that would write a value
 * identical to what is already there is a no-op; a record that would write a
 * different value into an occupied slot is a conflict the user is shown, never
 * a silent overwrite and never a second row.**
 *
 * That rule is what keeps this small. The day-keyed collections (`metrics`,
 * `bodyMetrics`, `habitValues`, `cycle`) are self-deduping under it — writing
 * 8,200 steps onto a day that already holds 8,200 steps changes nothing — so
 * they need no stored provenance at all. Only the append collections do, and
 * `entries` already had one.
 *
 * Takes an `AsyncIterable` from the first line so that the streaming Apple
 * adapter does not have to rewrite it; an array caller wraps with `ofArray`.
 */
import type {
  BodyMetric, CyclePoint, DailyMetric, Entry, JournalData, PickleballSession, Workout,
} from '../types'
import { uid } from '../storage'
import type { RejectedRecord } from './validate'
import {
  srcKey,
  type BodyRecord, type CycleRecord, type EntryRecord, type HabitRecord,
  type ImportRecord, type ImportSource, type MetricRecord, type PickleballRecord,
  type WorkoutRecord,
} from './envelope'

export const KG_PER_LB = 0.453_592_37

/** Provenance prefix for a pickleball session — see `srcKey` for workouts. */
const SRC_PICKLE = 'pb'

/**
 * Fields no part of the UI can write, so an incoming value has no human value
 * to beat and updates in place without asking.
 *
 * Without this, every re-import of a corrected export would present thousands
 * of conflicts for numbers the user could not possibly have typed. The rule is
 * "the human beats the machine"; here there is no human.
 */
export const MACHINE_ONLY: readonly string[] = ['steps', 'restingHR', 'activeKcal']

export interface ImportConflict {
  kind: string
  date: string
  field: string
  /** What the journal holds now. */
  mine: number | string
  /** What the import wants to write. */
  theirs: number | string
}

export interface ImportCounts {
  added: number
  updated: number
  unchanged: number
  conflicts: number
  rejected: number
}

export interface ImportPlan {
  /** The whole journal as it would be after applying. Nothing has been written. */
  next: JournalData
  counts: ImportCounts
  conflicts: ImportConflict[]
  rejected: RejectedRecord[]
  dateRange: { from: string; to: string } | null
  /** Things the user should know that are not failures — e.g. a field with no home yet. */
  notes: string[]
  /** Stamped here, never by the producer: a "when you imported this" a file supplies is a field that can lie. */
  importedAt: string
}

export interface PlanOptions {
  source?: ImportSource
  /** Resolve every conflict the other way — the preview's "take theirs for all". */
  takeTheirs?: boolean
  /** The unit `BodyMetric.weight` is stored in for this journal. See the note on `weightKg`. */
  weightUnit?: 'kg' | 'lb'
  /** The unit `CyclePoint.temp` is stored in for this journal. Same ambiguity as `weightUnit`. */
  tempUnit?: 'F' | 'C'
}

/** One-line adapter so an array caller can use the streaming signature. */
export async function* ofArray<T>(items: Iterable<T>): AsyncIterable<T> {
  for (const item of items) yield item
}

const round = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp

export async function plan(
  records: AsyncIterable<ImportRecord> | Iterable<ImportRecord>,
  journal: JournalData,
  opts: PlanOptions = {},
): Promise<ImportPlan> {
  const source = opts.source ?? 'claude'
  const weightUnit = opts.weightUnit ?? 'kg'
  const tempUnit = opts.tempUnit ?? 'F'
  const counts: ImportCounts = { added: 0, updated: 0, unchanged: 0, conflicts: 0, rejected: 0 }
  const conflicts: ImportConflict[] = []
  const notes: string[] = []
  let from: string | null = null
  let to: string | null = null

  // A structured clone, so a planner bug cannot reach back into the live
  // journal through a shared array or a shared day-row object.
  const next: JournalData = JSON.parse(JSON.stringify(journal)) as JournalData
  next.metrics ??= []
  next.workouts ??= []
  next.bodyMetrics ??= []
  next.cycle ??= []
  next.entries ??= []
  next.pickleball ??= []
  next.habitLog ??= {}
  next.habitValues ??= {}

  const metricOn = new Map(next.metrics.map((m) => [m.date, m]))
  const bodyOn = new Map(next.bodyMetrics.map((b) => [b.date, b]))
  const cycleOn = new Map(next.cycle.map((c) => [c.date, c]))
  const workoutBySrc = new Map(
    next.workouts.filter((w) => w.src).map((w) => [w.src as string, w]),
  )
  const entryKeys = new Set(next.entries.map((e) => `${e.date}|${e.text}`))
  const pickleBySrc = new Map(
    (next.pickleball ?? []).filter((p) => p.src).map((p) => [p.src as string, p]),
  )
  const habitById = new Map(next.habits.map((h) => [h.id, h]))
  const habitByName = new Map(next.habits.map((h) => [h.name.toLowerCase(), h]))
  let missingHabits = 0

  /**
   * Write one field into one day-row, and return what happened.
   *
   * Every day-keyed kind goes through here, so "identical is a no-op" and "a
   * difference is a conflict" are stated once rather than six times.
   */
  function setField(row: Record<string, unknown>, field: string, value: number | string, kind: string, date: string) {
    const mine = row[field]
    if (mine === undefined || mine === null || mine === '') {
      row[field] = value
      counts.added++
      return
    }
    if (mine === value) { counts.unchanged++; return }
    if (MACHINE_ONLY.includes(field) || opts.takeTheirs) {
      row[field] = value
      counts.updated++
      return
    }
    conflicts.push({ kind, date, field, mine: mine as number | string, theirs: value })
    counts.conflicts++
  }

  for await (const r of records) {
    if (from === null || r.date < from) from = r.date
    if (to === null || r.date > to) to = r.date

    switch (r.kind) {
      case 'metric': {
        const m = r as MetricRecord
        let row = metricOn.get(m.date)
        if (!row) {
          row = { date: m.date } as DailyMetric
          metricOn.set(m.date, row)
          next.metrics.push(row)
        }
        for (const field of ['mood', 'stress', 'sleep', 'energy', 'calories', 'protein', 'carbs', 'fat', 'steps', 'restingHR', 'activeKcal'] as const) {
          const v = m[field]
          if (typeof v === 'number') setField(row as unknown as Record<string, unknown>, field, v, 'metric', m.date)
        }
        break
      }

      case 'body': {
        const b = r as BodyRecord
        let row = bodyOn.get(b.date)
        if (!row) {
          row = { date: b.date, measurements: {} } as BodyMetric
          bodyOn.set(b.date, row)
          next.bodyMetrics.push(row)
        }
        row.measurements ??= {}
        if (typeof b.weightKg === 'number') {
          // The envelope is kilograms; the journal is whatever unit the user
          // has selected, because `BodyMetric.weight` carries no unit of its
          // own. Converting here is the workaround, not the fix.
          const stored = weightUnit === 'lb' ? round(b.weightKg / KG_PER_LB, 1) : round(b.weightKg, 1)
          setField(row as unknown as Record<string, unknown>, 'weight', stored, 'body', b.date)
        }
        if (typeof b.bodyFat === 'number') setField(row as unknown as Record<string, unknown>, 'bodyFat', round(b.bodyFat, 1), 'body', b.date)
        for (const [key, v] of Object.entries(b.measurements ?? {})) {
          setField(row.measurements as Record<string, unknown>, key, round(v, 1), 'body', b.date)
        }
        break
      }

      case 'cycle': {
        const c = r as CycleRecord
        let row = cycleOn.get(c.date)
        if (!row) {
          row = { date: c.date, flags: [] } as CyclePoint
          cycleOn.set(c.date, row)
          next.cycle.push(row)
        }
        row.flags ??= []
        // A union, so this kind is idempotent by construction.
        let changed = false
        for (const flag of c.flags ?? []) {
          if (!row.flags.includes(flag)) { row.flags.push(flag); changed = true }
        }
        if (changed) counts.added++
        else if ((c.flags?.length ?? 0) > 0) counts.unchanged++
        if (c.note) setField(row as unknown as Record<string, unknown>, 'note', c.note, 'cycle', c.date)
        if (typeof c.tempC === 'number') {
          // The envelope is Celsius; `CyclePoint.temp` is whatever unit the
          // user has selected, because it carries none of its own. Same
          // workaround as `weightKg` above, for the same reason.
          //
          // Two decimals in both units: a basal chart is read for a shift of
          // ~0.2 °C / 0.4 °F, so one decimal throws away a third of the signal.
          // NOT machine-only — a basal temperature is typed in by hand every
          // morning, so a hand-entered reading wins and the import reports it
          // as a conflict. That is the whole point of the default.
          const stored = tempUnit === 'F' ? round(c.tempC * 9 / 5 + 32, 2) : round(c.tempC, 2)
          setField(row as unknown as Record<string, unknown>, 'temp', stored, 'cycle', c.date)
        }
        break
      }

      case 'habit': {
        const h = r as HabitRecord
        const habit = habitById.get(h.habit) ?? habitByName.get(h.habit.toLowerCase())
        if (!habit) {
          // An import adds records, never structure. Creating habits from a
          // file would let an import rewrite what the app is *for*.
          missingHabits++
          counts.rejected++
          break
        }
        if (typeof h.value === 'number') {
          next.habitValues![h.date] ??= {}
          setField(next.habitValues![h.date] as unknown as Record<string, unknown>, habit.id, h.value, 'habit', h.date)
        } else {
          const log = (next.habitLog[h.date] ??= [])
          if (log.includes(habit.id)) counts.unchanged++
          else { log.push(habit.id); counts.added++ }
        }
        break
      }

      case 'entry': {
        const e = r as EntryRecord
        // The same identity `bulkAddEvents` already uses, so an ICS file and an
        // import of the same event cannot both land.
        const key = `${e.date}|${e.text}`
        if (entryKeys.has(key)) { counts.unchanged++; break }
        entryKeys.add(key)
        next.entries.push({
          id: uid('entry'),
          date: e.date,
          type: e.type ?? 'note',
          text: e.text,
          status: 'open',
          important: false,
          memory: false,
          tags: [],
          createdAt: new Date().toISOString(),
        } as Entry)
        counts.added++
        break
      }

      case 'pickleball': {
        const s = r as PickleballRecord
        // Append collection, so it needs provenance for the same reason
        // `workouts` does. Keyed on the day plus the format: a second session
        // the same day in the same format is the ambiguous case, and merging it
        // into the first is better than silently logging a phantom third on the
        // next re-import.
        const key = `${SRC_PICKLE}:${s.date}:${s.format ?? 'doubles'}`
        const existing = pickleBySrc.get(key)
        const fields = {
          format: s.format ?? 'doubles',
          gamesWon: s.gamesWon,
          gamesLost: s.gamesLost,
          pointsFor: s.pointsFor,
          pointsAgainst: s.pointsAgainst,
          durationMin: s.durationMin,
          partner: s.partner,
          opponent: s.opponent,
          notes: s.notes,
        }
        const defined = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        if (existing) {
          const before = JSON.stringify(existing)
          Object.assign(existing, defined)
          if (JSON.stringify(existing) === before) counts.unchanged++
          else counts.updated++
          break
        }
        const row = {
          id: uid('pb'),
          date: s.date,
          src: key,
          format: s.format ?? 'doubles',
          gamesWon: s.gamesWon ?? 0,
          gamesLost: s.gamesLost ?? 0,
          ...defined,
        } as PickleballSession
        next.pickleball!.push(row)
        counts.added++
        break
      }

      case 'workout': {
        const w = r as WorkoutRecord
        const key = srcKey(source, w)
        const existing = workoutBySrc.get(key)
        const fields: Partial<Workout> = {
          activity: w.activity,
          durationMin: w.durationMin,
          distanceKm: typeof w.distanceKm === 'number' ? round(w.distanceKm, 2) : undefined,
          calories: w.calories,
          rpe: w.rpe,
          sets: w.sets ?? [],
          notes: w.notes,
        }
        if (existing) {
          // Matched by provenance: update in place. Appending here is the one
          // failure this key exists to prevent.
          const before = JSON.stringify(existing)
          Object.assign(existing, Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)))
          if (JSON.stringify(existing) === before) counts.unchanged++
          else counts.updated++
          break
        }
        const row = {
          id: uid('workout'),
          date: w.date,
          src: key,
          ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)),
          sets: w.sets ?? [],
        } as Workout
        next.workouts.push(row)
        workoutBySrc.set(key, row)
        counts.added++
        break
      }
    }
  }

  if (missingHabits > 0) {
    notes.push(`${missingHabits} habit record${missingHabits === 1 ? '' : 's'} named a habit this journal does not have — create the habit first, then re-import.`)
  }
  next.metrics.sort((a, b) => a.date.localeCompare(b.date))
  next.bodyMetrics.sort((a, b) => a.date.localeCompare(b.date))
  next.cycle.sort((a, b) => a.date.localeCompare(b.date))

  return {
    next,
    counts,
    conflicts,
    rejected: [],
    dateRange: from && to ? { from, to } : null,
    notes,
    importedAt: new Date().toISOString(),
  }
}
