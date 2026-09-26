# Ingest architecture — one pipeline, both callers

**Every import becomes an `ImportEnvelope`, is turned into a whole candidate
journal by a pure function that touches nothing, is shown to the user as a
diff, and lands as exactly one `replaceAll` — one `localStorage` write, one
undo step.** Nothing else may write imported data.

The reason it is one dispatch and not N is not tidiness. It is the only design
under which a tab killed mid-import leaves the journal either wholly before or
wholly after, and the only one that does not evict the user's undo history.

Scope: the format research for Apple Health lives in
`docs/import/apple-health-research.md` (written separately). This document
names what the pipeline needs from that adapter and does not restate it.
The storage decision it sits on top of is `docs/DATA-STORE-DECISION.md` —
`localStorage["bujo:data"]` stays canonical; nothing here adds a store.

---

## 1. What already exists, and what the pipeline must reuse

Four import paths exist today. Three of them write straight into the journal
with no preview, no validation and no dedupe beyond one special case.

| Existing path | File | How it writes | Verdict |
|---|---|---|---|
| JSON backup import | `views/Settings.tsx:135` `onImport` | `replaceAll(importJSON(text), { stamp: true })` | **Keep as is.** It restores a whole journal — a different operation from ingesting records. Not part of this pipeline |
| Metrics CSV import | `views/Settings.tsx:97` `onMetricsCsv` | `rows.forEach(r => setMetric(r.date, r.patch))` | **Must move onto the pipeline.** See §1.1 — it is the bug this design exists to not repeat |
| ICS calendar import | `views/Plan.tsx:157` `onIcs` | `bulkAddEvents(parseICS(text))` | Move on later. Its dedupe rule is correct and is reused verbatim (§3) |
| Cloud pull | `bujocloud` / `fscloud` / `supabase` / `serverSync` | `replaceAll(migrate(remote))` | Not an import. Snapshot sync, governed by `conflict.ts` |

### Reuse, do not re-implement

| Need | Reuse | Why not new code |
|---|---|---|
| Apply the result | `store.tsx` `replaceAll(next, { stamp: true })` | `'set'` runs through `commit()`, so it is **already one undoable step**, and `stamp: true` re-dates the journal so a fresh import beats a stale remote — exactly the semantics an import needs. Already proven by `onImport` |
| Offer undo | `notify.undo(msg, () => dispatch({type:'undo'}))` | The pattern `removeWithUndo` already uses for 25 delete sites |
| Gate a risky apply, with a backup escape hatch | `useConfirm({ destructive, onBackup })` | `onBackup` renders "Export a backup first" *without closing the dialog*. Built for exactly this |
| Shape tolerance on the result | `storage.ts` `migrate()` | The plan's output is passed through `migrate()` before apply, so a planner bug can only ever emit a shape the loader already accepts |
| Day arithmetic | `lib/date.ts` `todayISO` / `fromISODay` / `toISODay` | **Trap:** `new Date("2026-09-01")` parses as UTC midnight and renders as Aug 31 west of Greenwich. `date.ts` exists because of this. Never construct a `Date` from an ISO day anywhere in the ingest code |
| Distance canonicalisation | `lib/units.ts` `toKm` | `Workout.distanceKm` is canonical km. The v2 bug that wrote display units into it is documented in `migrateWorkoutsToV3` — do not re-create it |
| Activity names | `domain/activities.ts` `isActivityKey` | **Not `normalizeActivity`.** It never fails — it returns `'other'` for anything unknown, which at an ingest boundary is a silent downgrade. Mapping to `'other'` is the adapter's decision, made explicitly; the validator rejects unknown keys |
| Entry dedupe | `store.tsx` `bulkAddEvents` rule: `` `${date}|${text}` `` | That decision is already made and shipped. Two identical-text entries on one day are one entry |
| Duplicate journal state | `lib/conflict.ts` `mergeJournals` | **Deliberately not reused** — see §3.3 |

### 1.1 The metrics-CSV importer is the anti-pattern, stated

`onMetricsCsv` calls `setMetric` once per row. Each call is a `patch`
dispatch, so a 365-row CSV produces:

| Consequence | Detail |
|---|---|
| 365 undo steps | `HISTORY_CAP = 80` (`store.tsx:44`), so the import **evicts the user's entire prior undo history** and Ctrl+Z only walks back through the import itself, 80 rows of it |
| 365 `localStorage` writes | The save effect runs per committed state |
| No atomicity | A tab killed at row 212 leaves a journal that is 212/365 imported, with nothing recording that |
| No validation | `parseMetricsCsv` accepts any finite number. `mood: 9999` and `sleep: -5` land in the journal and skew every chart that averages them |
| Silent overwrite | `setMetric` spreads the patch over the existing day. A typed mood of 7 is replaced by a CSV's 3 with no prompt and no record of the 7 |

Everything in this document is a rule against one of those five lines.

---

## 2. The envelope

One versioned format. Both callers produce it; only the Apple adapter has to
work to do so, because the Claude caller emits it directly.

```ts
// src/lib/ingest/envelope.ts
export const ENVELOPE_VERSION = 1

export type ImportSource = 'apple-health' | 'claude' | 'metrics-csv' | 'ics'

export interface ImportEnvelope {
  /** Format version. A reader that does not know this number refuses the file. */
  envelope: 1
  source: ImportSource
  /** Free-form producer version: "iOS 19.2", "claude-opus-5". */
  sourceVersion?: string
  /** When the SOURCE produced this, ISO instant. */
  exportedAt?: string
  /** IANA zone of the producing device, e.g. "America/Chicago". */
  tz?: string
  records: ImportRecord[]
}
```

```ts
/** Every record is dated with a LOCAL ISO day — the app's unit is the day. */
interface RecordBase {
  /** "YYYY-MM-DD", the local day this belongs to, already resolved by the adapter. */
  date: string
  /** Source-supplied stable id, if the source has one. Advisory — see §3.2. */
  key?: string
}

export type ImportRecord =
  | ({ kind: 'metric' } & RecordBase & {
      mood?: number; stress?: number; sleep?: number; energy?: number
      calories?: number; protein?: number; carbs?: number; fat?: number
      steps?: number; restingHR?: number; activeKcal?: number   // new fields, §5
    })
  | ({ kind: 'workout' } & RecordBase & {
      /** ISO instant WITH offset, e.g. "2026-09-01T07:12:00-05:00". */
      at?: string
      activity: ActivityKey
      durationMin?: number
      distanceKm?: number      // already canonical km
      calories?: number; rpe?: number
      sets?: string[]; notes?: string
    })
  | ({ kind: 'body' } & RecordBase & {
      /** ALWAYS kilograms in the envelope. Converted to the user's unit at apply. §5.1 */
      weightKg?: number
      bodyFat?: number         // percent, 0–100
      measurements?: Record<string, number>
    })
  | ({ kind: 'habit' } & RecordBase & { habit: string; value?: number })
  | ({ kind: 'entry' } & RecordBase & { text: string; type?: BulletType })
  | ({ kind: 'cycle' } & RecordBase & { flags?: string[]; note?: string })
```

### Why each provenance field exists

| Field | Exists because | What breaks without it |
|---|---|---|
| `envelope: 1` | A reader must be able to refuse a format it does not understand rather than guess at it | Version 2 records get silently half-read by a version 1 reader |
| `source` | Decides the trust tier, the copy the user sees ("412 records from Apple Health"), and the dedupe key prefix for workouts | Cannot tell an LLM guess from a device measurement when they disagree |
| `sourceVersion` | When a mapping turns out to be wrong six months later, this says which batches to re-import | A bad mapping is unfindable — you cannot select the affected rows |
| `exportedAt` | Detects a stale re-export: an envelope whose `exportedAt` is older than one already applied is almost certainly a duplicate file | The user re-imports last month's export over this month's and sees a confusing conflict list instead of "you have already imported this" |
| `tz` | Apple stamps instants; bujo stores days. Fallback when an individual record's `at` carries no offset | A 23:40 run lands on the wrong day, permanently, and moves again if re-imported elsewhere |
| `key` (per record) | Some sources have their own stable id | Nothing — it is advisory. §3.2 |

### Not in the envelope, on purpose

| Not included | Why |
|---|---|
| `importedAt` | Stamped by **us**, at parse time, never by the producer. A producer-supplied "when you imported this" is a field that can lie and that nothing can check. It lives on the plan, not the envelope |
| A checksum | `lib/csv.ts` `withChecksum`/`verifyChecksum` already exists for backup files. An import is validated record-by-record; a whole-file digest adds a second, weaker answer to a question §4 answers better |
| Any settings or preferences | An import adds **records**. It never changes how the app behaves. The one exception is offered separately and explicitly (§7, `startedOn`) |
| Nested/embedded photos | Photos go through `imageStore.ts`. An import that carries image bytes is out of scope and rejected |

Size: the envelope is a transport format and is never stored. The only thing
this design persists that did not exist before is `Workout.src` (§3.2), about
30 bytes on imported workouts only — roughly 45 KB for a decade of Apple
workouts against the measured 2.35 MB ten-year journal.

---

## 3. Idempotency and dedupe

**The rule, one sentence: a record that would write a value identical to what
is already there is a no-op; a record that would write a different value into
an occupied slot is a conflict the user is shown, never a silent overwrite and
never a second row.**

### 3.1 Identity per kind

| Kind | Lands in | Identity (the "slot") | Re-import of the same export |
|---|---|---|---|
| `metric` | `metrics[date]` (field merge) | `(date, field)` | Same value → no-op. Zero stored provenance needed |
| `body` | `bodyMetrics[date]` (field merge) | `(date, field)` | Same value → no-op |
| `cycle` | `cycle[date]` | `(date, flag)` — flags union | Set union, idempotent by construction |
| `habit` | `habitLog[date]` (set) / `habitValues[date][habitId]` | `(date, habitId)` | Set membership / same value → no-op |
| `entry` | `entries[]` (append) | `` `${date}|${text}` `` — **the existing `bulkAddEvents` rule** | Already deduped by that rule |
| `workout` | `workouts[]` (append) | `src` string, stored on the row (§3.2) | Matched by `src` → update in place, never append |

The append collections are the only ones that need stored provenance, because
appending twice is the failure. The day-keyed collections are self-deduping:
writing 8,200 steps onto a day that already holds 8,200 steps changes nothing,
so idempotency is free and costs no schema.

### 3.2 `Workout.src` — the one schema addition

```ts
// types.ts, added to Workout
/** Provenance key for an imported row: "<src>:<local ISO instant>".
 *  Present only on imported workouts. Its only job is to make a re-import
 *  update this row instead of appending a second one. */
src?: string
```

Built as `` `${code}:${at ?? date}` `` with a two-character source code
(`ah` = apple-health, `cl` = claude), e.g. `ah:2026-09-01T07:12:00-05:00`.

**`record.key` is advisory and is not used for `apple-health`.** We do not
currently know whether an `HKWorkout` UUID survives a re-export unchanged —
that is a question for `apple-health-research.md`. If a re-export re-mints
uuids, keying on them turns every re-import into a full duplicate of the
user's training history. The derived timestamp key cannot do that. When the
research answers "uuids are stable", switching is a one-line change and the
old rows keep working because they are matched by an exact string either way.
Until then, `key` is used only for `source: 'claude'` (where the producer is
asked to supply one and the fallback is identical).

Ceiling: two Apple workouts starting in the same minute collapse to one. Two
simultaneous workouts are not a thing a single wrist records; if the research
says otherwise, append the activity key to `src`.

### 3.3 When the same day arrives from two sources

Apple says 8,200 steps; the user typed 8,000. **The user wins, by default,
visibly, and the losing value is not thrown away silently.**

| Situation | Resolution | User sees |
|---|---|---|
| Field empty locally | Import writes it | Counted as "new" |
| Field holds the **same** value | No-op | Counted as "already had it" |
| Field holds a **different** value | **Conflict.** Default = keep the local value, import value discarded | Listed in the preview: `2026-09-01 steps · yours 8,000 · Apple 8,200`, with a per-row "take theirs" and a "take theirs for all N" |
| Field holds a different value and the incoming source is the **only** thing that ever writes it (`steps`, `restingHR`, `activeKcal` — no UI writes these) | Import wins automatically, not shown as a conflict | Counted as "updated" |

The last row matters: without it every single re-import of a corrected Apple
export would present thousands of conflicts for fields the user cannot have
typed. The rule is "the human beats the machine" — where no human could have
entered the value, there is no human to beat.

Where the losing side goes: for `apple-health` the source file *is* the
recoverable copy — it is on disk and re-importable forever. For `claude` it is
not, so the preview screen carries a **"Save this import as JSON"** button
(one line, reusing the existing `download()` helper) that writes the validated
envelope to `bujo-import-<source>-<today>.json`. That is the archive. There is
no automatic vault and there should not be one.

### 3.4 Why `conflict.ts` is not reused

`mergeJournals` is the right tool for its job and the wrong one for this.

| | `mergeJournals` | Ingest |
|---|---|---|
| Inputs | Two **snapshots of the same journal** | One journal + a foreign **record list** |
| Collision unit | The whole object (`unionById` keeps the winner's entire item) | A **single field** |
| Bias | Additions beat deletions — "losing a fresh note is worse than re-seeing a deleted one" | The human beats the machine |
| Absent key | Means the loser never knew about it | Means the source does not measure it |

Feeding an import through `mergeJournals` would require synthesising a fake
journal, and its object-level collision rule would let an Apple day-row replace
a `metrics[date]` object that carries a hand-typed mood, stress and gratitude
note — losing three human-entered values to win one machine one. That is the
exact silent loss this pipeline exists to prevent.

What *is* reused is its bias, restated for this domain, and its hard-won
structural lesson: `ID_ARRAYS` is a hand-maintained list against a growing
type, and `conflict.test.ts` now derives that list from `emptyJournal()` so the
next collection added fails a test instead of losing data. **The ingest planner
gets the same test**: one that enumerates `ImportRecord['kind']` and asserts
every kind has a planner branch, so adding a kind without wiring it fails
rather than silently dropping every record of that kind.

---

## 4. Validation and trust

Both callers are untrusted. A file picked off disk can be anything; an
LLM-generated payload can be confidently, plausibly wrong — the dangerous case,
because it parses.

### 4.1 The structural guarantee

```
parse(text|File)  →  ImportEnvelope        // may throw; nothing written
validate(env)     →  { records, rejected } // pure, total, never throws
plan(records, j)  →  ImportPlan            // pure; builds the WHOLE next journal
                                            // in memory, touches no store
apply(plan)       →  replaceAll(migrate(plan.next), { stamp: true })
```

**A malformed import cannot corrupt an existing journal because nothing writes
until the entire plan is built.** `plan()` takes `JournalData` and returns a
new one; it holds no reference to the store, cannot dispatch, and is unit-
testable with a literal journal object. A throw anywhere in parse/validate/plan
leaves `plan` undefined and `apply` unreachable. `migrate()` on the way in to
`replaceAll` means even a planner bug can only emit a shape the loader accepts.

Everything before `apply` is a pure function of (bytes, journal). That is the
whole safety argument, and it is testable without a browser.

### 4.2 Envelope-level checks — any failure rejects the whole file

| Check | Message |
|---|---|
| Valid JSON | "That file isn't JSON." |
| `envelope === 1` | "This import was made for a newer version of bujo." |
| `source` in the union | "Unknown import source `X`." |
| `Array.isArray(records)` | "No records in that file." |
| `records.length <= MAX_RECORDS` (50,000) | "That's N records — more than one import can take. Split it by year." |
| `records.length > 0` | "Nothing to import." |
| **All records rejected** | "Nothing in that file looked like bujo data — is it the right file?" Refuses rather than showing a 5,000-line rejection list |

### 4.3 Record-level checks — failure rejects **that record only**

| Field class | Rule | Rejected, not clamped, because |
|---|---|---|
| `kind` | Must be a known kind | An unknown kind silently dropped is the `PULLUP_WORKOUTS` failure — a module goes dead and nothing errors |
| `date` | `/^\d{4}-\d{2}-\d{2}$/` **and** `toISODay(fromISODay(date)) === date` | The regex alone accepts `2026-02-31`, which `fromISODay` silently rolls to Mar 3 |
| `date` range | `>= "1970-01-01"` and `<= addDays(todayISO(), 1)` | A future-dated record breaks every streak and "days since" calculation. +1 day tolerates a device clock ahead of this one |
| `at` | Parses as an instant and its local day equals `date` | An adapter bug that puts the day and the instant on different days must be loud |
| Numbers | `Number.isFinite` **and** within the per-field range below | **Clamping invents data.** A `mood: 9999` clamped to 10 is a fabricated perfect day that no one can later distinguish from a real one |
| `activity` | `isActivityKey(activity)` | `normalizeActivity` would turn an invented `"crossfit"` into `'other'` — a silent downgrade at a trust boundary |
| Strings | `text` ≤ 500, `notes` ≤ 2000, `sets[]` ≤ 100 entries × 200 chars | An LLM emitting a 2 MB prose blob as a note is a quota event, not an entry |
| `measurements` | ≤ 20 keys, keys `/^[a-z][a-z0-9 _-]{0,30}$/i` | Unbounded key space in a `Record` is how a schema stops being a schema |

Per-field ranges (reject outside):

| Field | Range | Source |
|---|---|---|
| `mood`, `stress`, `energy` | 0–10 | `DailyMetric` doc comment |
| `sleep` | 0–24 hours | Type says "0–10+"; 24 is the physical bound |
| `rpe` | 1–10 | `Workout.rpe` |
| `bodyFat` | 1–70 % | Below 1 is a decimal-fraction bug (HK stores 0–1); above 70 is not survivable |
| `weightKg` | 20–400 | Catches a lb value pasted into a kg field |
| `steps` | 0–200,000 | |
| `restingHR` | 25–150 bpm | |
| `calories`, `activeKcal` | 0–20,000 | |
| `protein`, `carbs`, `fat` | 0–2,000 g | |
| `durationMin` | 1–1,440 | A workout longer than a day is a parse bug |
| `distanceKm` | 0–500 | |

### 4.4 What a rejected record does

| | Behaviour |
|---|---|
| Does it stop the import? | **No.** The batch continues |
| Where does it go? | `plan.rejected: { index, kind, date, reason, raw }[]` |
| Is it visible? | **Unavoidably.** The apply button reads `Apply 412 · skip 7`. You cannot apply without the skip count in front of you |
| Can it be inspected? | The preview lists the first 10 with reasons and offers "Download all 7 rejected records" as JSON |
| Is it recoverable? | The source file is unchanged. Fix the producer, re-import — the pipeline is idempotent, so the 412 that landed land as no-ops |
| Is the whole file ever rejected? | Only per §4.2 — including "everything was rejected", which is a wrong-file signal, not 5,000 individual errors |

---

## 5. Mapping — Apple Health → bujo

Keyed on `HK*` type identifiers, which are stable public API names. **How to
get them out of the export is `apple-health-research.md`'s job, not this
table's.** Everything here is the adapter's contract: what it must emit in the
envelope, already converted, already day-resolved.

### 5.1 Has a home

| Apple type | HK unit | bujo field | Conversion | Rounding |
|---|---|---|---|---|
| `HKWorkout` | — | `workouts[]` | activity via the adapter's own map → `ActivityKey`; unmapped → **reject, do not coerce to `other`** | — |
| `HKWorkout.duration` | s | `Workout.durationMin` | `÷ 60` | integer minutes |
| `HKWorkout` total distance | m | `Workout.distanceKm` | `÷ 1000` | **3 dp** — matches `migrateWorkoutsToV3` |
| `HKWorkout` active energy | kcal | `Workout.calories` | 1:1 | integer |
| `HKQuantityTypeIdentifierStepCount` | count | `DailyMetric.steps` **(new)** | day sum, 1:1 | integer |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | kcal | `DailyMetric.activeKcal` **(new)** | day sum | integer |
| `HKQuantityTypeIdentifierRestingHeartRate` | count/min | `DailyMetric.restingHR` **(new)** | day mean | integer |
| `HKCategoryTypeIdentifierSleepAnalysis` | segments | `DailyMetric.sleep` | sum of asleep segments ÷ 60, bucketed by **wake day** (§6) | **1 dp** hours |
| `HKQuantityTypeIdentifierDietaryEnergyConsumed` | kcal | `DailyMetric.calories` | day sum | integer |
| `HKQuantityTypeIdentifierDietaryProtein` / `Carbohydrates` / `FatTotal` | g | `DailyMetric.protein` / `carbs` / `fat` | day sum | integer g |
| `HKQuantityTypeIdentifierBodyMass` | kg | `bodyMetrics[date].weight` | **`weightKg × 2.20462` when `settings.weightUnit === 'lb'`** — see the trap below | 1 dp |
| `HKQuantityTypeIdentifierBodyFatPercentage` | 0–1 fraction | `bodyMetrics[date].bodyFat` | `× 100` | 1 dp |
| `HKQuantityTypeIdentifierLeanBodyMass` | kg | `bodyMetrics[date].measurements.lean` | same weight-unit rule | 1 dp |
| `HKQuantityTypeIdentifierWaistCircumference` | m | `bodyMetrics[date].measurements.waist` | `× 100` → cm | 1 dp |
| `HKCategoryTypeIdentifierMenstrualFlow` | category | `cycle[date].flags` | `light`/`medium`/`heavy` → `"period"`, `unspecified` → `"spotting"` | — |
| `HKQuantityTypeIdentifierMindfulSession` *(as `HKCategoryTypeIdentifierMindfulSession`)* | s | a `count`/`timer` habit, if one exists whose name matches | minutes, `÷ 60` | integer |

> **Trap — `BodyMetric.weight` is NOT canonical.** `Workout.distanceKm` is
> canonical km with `lib/units.ts` as its boundary. `BodyMetric.weight` and
> `WorkoutSet.weight` have no such boundary: `settings.weightUnit` is a bare
> display *label*, written at `Settings.tsx:195` and read at `Gym.tsx:91`,
> with **no conversion anywhere**. So the stored number is whatever unit was
> on screen when it was typed, and toggling kg↔lb reinterprets ten years of
> history in place (180 lb becomes 180 kg). This is the same bug class as the
> v2 `distanceKm` bug that `migrateWorkoutsToV3` had to clean up, still live.
> **The envelope therefore carries `weightKg` — explicitly named — and the
> planner converts to `settings.weightUnit` at apply time.** That is correct
> against today's schema and will need revisiting when the underlying bug is
> fixed. Filed as a separate finding; it is not this pipeline's to fix.

### 5.2 No home in the current schema

| Apple concept | Needs a home? | Decision |
|---|---|---|
| Step count | **Yes** | Add `DailyMetric.steps`. Apple's headline number; a fitness import that cannot carry it is not worth doing |
| Active energy (day total) | **Yes** | Add `DailyMetric.activeKcal`. `DailyMetric.calories` is food *eaten* — overloading it would make every nutrition chart wrong |
| Resting heart rate | **Yes** | Add `DailyMetric.restingHR`. One number a day, trends over years, and it is the single best recovery signal the phone already has |
| HRV (`SDNN`) | No | Nothing in the app reads it, and a field nothing reads is a schema promise taken on for free |
| VO2max | No | Same |
| Per-workout heart-rate series | **No, and never** | Thousands of samples per day. The measured ten-year journal is 2.35 MB against a ~5 MB quota; one year of HR series is larger than the entire journal. The pipeline **drops** these and the preview says so |
| Sleep stages (REM / Core / Deep) | No | `DailyMetric.sleep` is a single number. Collapsed to total asleep hours; stages dropped, stated in the preview |
| `DistanceWalkingRunning` day totals | No — **must be dropped** | Would double-count against `HKWorkout` distance. Keep workout distance only |
| Exercise / Stand ring minutes | No | Workouts already carry minutes. Adding a second, differently-derived "active minutes" invites two numbers that disagree on one screen |
| Blood pressure, glucose, SpO₂, ECG, audio exposure | No | This is a bullet journal, not a health record. Out of scope, dropped, said so in the preview |
| Symptoms (`HKCategoryTypeIdentifier*` symptom family) | Arguably | Closest home is an `avoid`-polarity habit or an `entry`. **Not in v1** — needs a UI to be worth anything |

Adding `steps`, `activeKcal` and `restingHR` needs **no `SCHEMA_VERSION` bump**.
`migrate()` is additive-tolerant (it spreads unknown keys and passes array items
through untouched), so an older client that loads a journal containing them
round-trips them without loss — including across cloud sync. The version gate
is only for non-idempotent conversions.

---

## 6. Timezones — the rules, written down once

| Case | Rule |
|---|---|
| A workout's day | The local day of its **start** instant, in the **offset the record itself carries**. Not UTC, not the importing device's zone |
| Missing offset on the record | Fall back to `envelope.tz`, then to the importing device, and **mark the record `assumedTz`** so the preview can say "N records used your current timezone" |
| A sleep session crossing midnight | Belongs to its **wake day** — the local day of `endDate`. "I slept 7 hours last night" is said while looking at today. **Decision D1, default recommended** |
| Day-total quantities (steps, energy) | Bucketed by the local day of each sample's start, summed. Never by UTC day — a UTC bucket shifts every step taken after 19:00 in Chicago into tomorrow |
| DST | Handled for free: bucketing by each record's own local day means a 23- or 25-hour day still has exactly one date |
| Constructing days in code | Only through `lib/date.ts`. `new Date("2026-09-01")` is UTC midnight and is a bug west of Greenwich |

A workout at 23:40 in Chicago is Sep 1's workout forever, even if the same
export is imported in Tokyo two years later. That property is what makes
re-import idempotent across a move, and it is why the offset must come from the
record and not the machine.

---

## 7. Preview → apply → undo

### The flow

| Step | What happens | Store touched |
|---|---|---|
| 1 · Pick | File picker (Apple) or a paste textarea (Claude) | No |
| 2 · Parse | Bytes → `ImportEnvelope`. Apple adapter streams (§8) | No |
| 3 · Validate | `{ records, rejected }` | No |
| 4 · Plan | `plan(records, data)` → `{ next, counts, conflicts, rejected, dateRange, notes }` | **No** — `data` is read, never written |
| 5 · Preview | The diff, below | No |
| 6 · Resolve | Per-conflict toggle; re-plans (pure, instant) | No |
| 7 · Confirm | `confirm({ destructive: counts.updated > 0, onBackup: doExport })` | No |
| 8 · Apply | `replaceAll(migrate(plan.next), { stamp: true })` | **One write** |
| 9 · Undo offer | `notify.undo('Imported 412 records', () => undo())` | On click, one step back |

### What the preview shows

| Line | Example |
|---|---|
| Source and span | `Apple Health · iOS 19.2 · 2019-03-04 → 2026-09-10 · 2,743 days` |
| New | `412 new · 96 workouts, 291 metric days, 25 body rows` |
| Already had | `1,886 already in your journal — nothing to do` |
| Updated | `14 will overwrite a value only Apple writes (steps, resting HR)` |
| Conflicts | `3 disagree with something you typed — keeping yours` + the three rows, each with "take theirs" |
| Rejected | `7 skipped` + the first ten reasons + a download |
| Dropped by design | `Heart-rate samples, sleep stages and daily walking distance are not imported.` |
| Timezone note | `28 records had no timezone and used yours (America/Chicago).` |
| Predates history | `1,204 days are before your journal started (2024-06-01).` → see below |

The counts are the verification. A pass that reports "412 imported" without
being able to say new/updated/skipped is a pass that cannot be checked — the
same shape as `bulkAddEvents` returning `candidates.length` computed against a
stale closure while the reducer's authoritative filter may insert fewer. That
is a real, existing, small honesty bug in `store.tsx:453`; the pipeline must
report the **planner's** counts, which are computed against the same journal
the plan was built from and therefore cannot drift.

### How it plugs into the undo stack

| Fact | Consequence |
|---|---|
| `replaceAll` dispatches `{ type: 'set' }` | `reducer` routes `'set'` through `commit()`, which pushes the current journal onto `past` |
| `commit` coalescing only applies when a `label` is passed; `'set'` passes none | One import is **exactly one** undo step, whatever its size |
| `HISTORY_CAP = 80` | The user's prior 79 undo steps survive the import, instead of being evicted by 412 of them |
| `stamp: true` re-dates `updatedAt` | The imported journal wins against a stale remote on the next sync, so the import is not quietly reverted by a cloud pull |
| `notify.undo` | Same one-click affordance as the 25 delete sites already use |

**Ceiling, stated:** undo is a history pop, not a snapshot taken at import
time. Import, then make 80 more edits, and the import is no longer reachable
by Ctrl+Z — the same ceiling `removeWithUndo` already documents. The answer
for "undo an import from last week" is the backup the confirm dialog pushed you
to take, which is why `onBackup: doExport` is not optional on this dialog.
A stored import ledger with per-batch revert is the upgrade path; it is not in
v1 because nothing has yet shown it is needed.

### The `startedOn` offer

`settings.startedOn`, each `Habit.startedOn` and `nofap.startedOn` gate
rendering — "days before this render as blank, not missed". An import of 2019
data lands behind all three and is invisible.

| Field | On import | Why |
|---|---|---|
| `settings.startedOn` | **Offer** to move it back to the earliest imported day, default yes, shown as a separate confirm after apply | It is the journal's own start; moving it makes the imported history visible |
| `Habit.startedOn` | **Never move** | It would retroactively turn years of untracked days into *missed* days and destroy every streak and completion percentage. A habit tracked from June 2024 was not failed in 2019 |
| `nofap.startedOn` | **Never move** | Same, and worse — it is a personal record |

Related trap already in this codebase: `count ? sum / count : 0` makes "no
data" read as "you scored zero". An import that stretches the journal's span
backwards by seven years multiplies the number of days that hit those
branches. Any stat touched by a backdated import must return `null` for "no
data", not `0`.

---

## 8. Failure modes

| # | Failure | Detected by | What the user sees | Data at risk |
|---|---|---|---|---|
| 1 | **Partial import** — plan built, apply interrupted | Cannot happen. Apply is one `replaceAll` → one synchronous `localStorage.setItem`, which is atomic per key | Nothing, or the whole import | **None** |
| 2 | **Tab killed mid-import** | Same as #1. Before the write: nothing happened. After: everything happened | The journal is exactly as it was, or exactly as previewed. Re-import is a no-op | **None** |
| 3 | **400 MB Apple export** | The adapter streams (`File.stream()`, never `readAsText`). Record count checked against `MAX_RECORDS = 50,000` as it goes | Progress by record count; over the cap it **stops and refuses**: "That's more than one import can take — split it by year" | None. Nothing is written |
| 4 | **Browser OOM on a huge file anyway** | Tab crashes during parse | The tab reloads to the unchanged journal | **None** — nothing was written |
| 5 | **`localStorage` quota exceeded on apply** | `save()` returns `false` and `emitPersist(false)` fires; `StorageBanner` shows | "Changes are not being saved" banner. **Trap: the in-memory journal still shows the import**, which looks like success | **Real.** The import is lost on reload. The preview must show projected size and warn over 80% of budget |
| 6 | **LLM invents plausible records** | Range + enum validation (§4.3) | `Apply 412 · skip 7` with reasons | Bounded by what passes validation — which is why nothing is clamped |
| 7 | **LLM produces syntactically perfect but factually wrong data** | **Not detectable.** This is the residual risk | Nothing | **Real, and accepted.** Mitigation is the preview: the user sees every new day and count before applying. Do not claim more |
| 8 | **Timezone drift** — records with no offset | `assumedTz` flag on the record | "28 records had no timezone and used yours" | Up to one day of misplacement, visible before apply |
| 9 | **Re-importing the same export** | Identity rules (§3) | `1,886 already in your journal` | **None** — the design's core property |
| 10 | **Re-importing an *older* export over a newer one** | `exportedAt` older than a previously applied envelope of the same source | "This export is older than one you already imported" — warns, does not block | Would surface as conflicts; defaults keep local |
| 11 | **Import predates journal history** | `dateRange.start < settings.startedOn` | "1,204 days are before your journal started" + the `startedOn` offer | Streaks, if `Habit.startedOn` were moved. It is not (§7) |
| 12 | **A new `ImportRecord` kind added with no planner branch** | The exhaustiveness test (§3.4) fails in CI | A red test, not a silent drop | None, because it never ships |
| 13 | **Apple adapter maps an activity wrongly** | Not automatically. The preview lists activity counts (`96 workouts · 61 run, 30 walk, 5 other`) | A wrong count is visible before apply | Mislabelled workouts. Re-importable after a fix, because `src` matches and updates in place |
| 14 | **Cloud sync overwrites the import before it syncs** | `stamp: true` re-dates `updatedAt`; `resolveIncoming` sees local-newer and prompts | The existing conflict dialog | Covered by `conflict.ts` |
| 15 | **Import applied while the journal is passcode-locked** | Unreachable — the app renders `LockScreen` instead of children when locked | n/a | None |

Failure 5 is the one worth building for: it is the only mode where the app
shows success and the data is gone. The preview must carry a projected-size
line, and the apply path must check `save()`'s return value and say so loudly
if it is `false` rather than trusting the toast.

---

## 9. Increment plan

Smallest first, each independently useful and verifiable on its own.

| # | Branch | Ships | Verified by |
|---|---|---|---|
| **1** | `feat/ingest-pipeline` | `src/lib/ingest/` — `envelope.ts` (types), `validate.ts`, `plan.ts`, and their tests. **No UI, no caller.** | `npm run verify`. Tests: idempotency (plan twice → second is all no-ops), conflict defaults, every range rejection, the kind-exhaustiveness test, the `2026-02-31` case, `Workout.src` matching |
| 2 | `feat/ingest-paste` | Settings → Data → "Import records" paste box, preview dialog, apply via `replaceAll`. **The Claude caller works end to end.** `Workout.src` added to `types.ts` | Paste a hand-written envelope, see the preview, apply, Ctrl+Z, re-apply, confirm the second apply reports all-no-ops |
| 3 | `refactor/metrics-csv-via-ingest` | Point `onMetricsCsv` at the pipeline; delete the `forEach(setMetric)` loop. Net deletion | A 365-row CSV produces **one** undo step, not 365. Out-of-range rows are skipped, not written |
| 4 | `feat/metric-steps-hr` | `steps`, `restingHR`, `activeKcal` on `DailyMetric`, plus somewhere to see them (Stats tiles). No version bump | A journal round-trips them through `migrate()` and a cloud push/pull without loss |
| **5 · shipped** | `feat/apple-health-import` | `src/lib/health/` — zip index, streaming XML scan, per-day fold — plus `AppleHealthCard` on the Data tab. Measured: 817.9 MB of XML through a **116.7 MB peak**, **−4.5 MB retained**, 3,317 records out. User doc: `docs/import/apple-health.md` | 45 tests. Re-planning the same export reports all-no-ops and a byte-identical journal; a hand-typed temperature is a conflict, not an overwrite |
| 6 | `feat/ingest-startedon` | The "your import predates your journal" offer | Import 2019 data into a 2024 journal; the days become visible; no habit streak changes |
| 7 | `refactor/ics-via-ingest` | Fold `bulkAddEvents` in, fixing its stale-closure count | `parseICS` → envelope → preview; the reported count equals the rows actually added |

### What is in branch 1, precisely

**In:** `ImportEnvelope` / `ImportRecord` types; `validateEnvelope()` and
`validateRecord()` with the full range table; `plan(records, journal)` returning
`{ next, counts, conflicts, rejected, dateRange, notes }`; the identity rules
for all six kinds; the kg→display-unit weight conversion; the km/minute/percent
conversions and rounding; unit tests for every row of §4.3.

**Deliberately not in branch 1:**

| Not in | Why | Comes in |
|---|---|---|
| Any UI | The pipeline is pure and testable without one. A branch that ships both is a branch where a planner bug hides behind a rendering bug | 2 |
| Any change to `types.ts` | `Workout.src` is a schema promise. It ships in the branch that first writes one | 2 |
| The Apple adapter | Blocked on research that is not this branch's | 5 |
| Streaming | A paste box produces an array. `plan()` takes an `AsyncIterable` from day one so branch 5 does not rewrite it, and branch 1 feeds it a one-line `async function*` over an array | 5 |
| A stored import ledger / per-batch revert | Nothing has shown it is needed. Undo + the pre-import backup cover the demonstrated cases | never, unless asked |
| A new dependency (zod &c.) | This repo hand-writes `parseICS`, `parseMetricsCsv` and `verifyChecksum` and carries no validation library. ~120 lines of explicit checks read better than a schema DSL and carry no supply chain | never |

---

## 10. Decisions needed

Each has a recommended default; none of them blocks branch 1.

| # | Decision | Recommended default |
|---|---|---|
| D1 | A sleep session spanning midnight belongs to which day? | **The wake day** (local day of `endDate`). Matches how people read "I slept 7 hours last night" |
| D2 | Add `steps`, `restingHR`, `activeKcal` to `DailyMetric`? | **Yes, those three, nothing else.** Reject HRV, VO₂max, exercise-ring minutes and the whole clinical family |
| D3 | When Apple and a typed value disagree, who wins? | **The typed value**, shown as a conflict with per-row "take theirs". Machine-only fields (steps, resting HR, active energy) update silently — no human wrote them |
| D4 | Does an import move `settings.startedOn` back? | **Ask once after apply, default yes.** Never move `Habit.startedOn` or `nofap.startedOn` |
| D5 | Map Apple menstrual flow to `cycle[].flags`? | **Yes**, one-line map, and only when `settings.cycleTrackerEnabled` |
| D6 | Cap on records per import | **50,000**, refused loudly above it with "split it by year" |
| D7 | Archive the applied envelope? | **A "Save this import as JSON" button on the preview.** No automatic archive, no ledger |
| D8 | Drop per-workout heart-rate series and sleep stages? | **Yes, and say so in the preview.** One year of HR samples is larger than the entire ten-year journal |

---

## 11. Found outside this work, not fixed here

| Finding | Where | Severity |
|---|---|---|
| **`BodyMetric.weight` / `WorkoutSet.weight` have no canonical unit.** `settings.weightUnit` is a display label with no conversion at any boundary; toggling it reinterprets all history in place (180 lb → 180 kg). Same bug class as the v2 `distanceKm` bug that `migrateWorkoutsToV3` exists to clean up | `types.ts:192`, `Settings.tsx:195`, `Gym.tsx:91` | **Silent data corruption.** Needs its own ticket and its own one-shot migration |
| `bulkAddEvents` returns `candidates.length` computed against the closed-over `data`, while the authoritative dedupe runs inside the reducer against live `d`. When they differ the user is told more was imported than was | `store.tsx:453` | Low — a wrong number in a toast, but it is the "reports success it did not verify" shape |
| `onMetricsCsv` writes N undo steps, has no validation, and silently overwrites typed values | `Settings.tsx:97` | Fixed by increment 3 |
