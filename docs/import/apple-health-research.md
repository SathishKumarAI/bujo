# Apple Health → bujo — how the data can actually get here

Scope: **research only.** Nothing under `src/` was touched. This answers "can a
browser-based, local-first PWA with no iOS app read a user's Apple Health data,
and at what cost" — and names the traps before anyone writes the parser.

Two constraints shape every answer below, and neither is negotiable:

| Constraint | Consequence |
|---|---|
| **There is no server API for Apple Health. At all.** HealthKit is an on-device store; iCloud syncs it device-to-device, not to a web endpoint. | Every route is a *file the user hands us* or *a third-party app the user installs*. No OAuth "Connect Apple Health" button exists and none can be built. |
| **HealthKit is only readable from a native iOS app**, and shipping one needs the Apple Developer Program ($99/yr) plus App Store review of a health app. | The Tauri wrapper in `src-tauri/` does not help: it is desktop. A Tauri **iOS** build could in principle call HealthKit, but it is still an App Store submission. |

---

## 1 · Recommended path

**Primary: parse `export.zip` picked from a file input, in a Web Worker, with a
streaming (chunked-regex, not DOM) scan over `export.xml`.** It is the only
route that needs zero purchases, zero accounts, zero network, and works for
every iPhone user on day one. The zip arrives through the user's own file
picker, so nothing leaves the device — which is the only story that fits a
local-first health app.

**Fallback: accept Health Auto Export's JSON file** (same file picker, different
branch on the parser). It costs the user $2.99–$24.99 and an App Store install,
but it is 10–100× smaller, pre-aggregated per day, and the user can automate it
to iCloud Drive so re-import is a two-tap refresh instead of a 20-minute export.

**Not recommended and not built:** any REST endpoint, `api/`, or third-party
service in the path. See §7.

---

## 2 · Every route, compared

| Route | What you actually get | User effort, per import | Automatic? | Cost | Verdict |
|---|---|---|---|---|---|
| **Health → Export All Health Data** (`export.zip`) | *Everything*: every sample ever recorded, `Record` + `Workout` + `ActivitySummary` + `Correlation`, plus `export_cda.xml` and a `workout-routes/` folder of GPX | Open Health → profile → scroll to bottom → Export → wait (seconds to **hours**) → Share → save to Files → open bujo → pick the zip | **No.** Manual, every time | Free | **Primary.** Universal, offline, complete |
| **Health Auto Export (JSON/CSV)** | 150+ named metrics, already bucketed (daily/hourly), sleep already split into `asleep`/`inBed`/`deep`/`core`/`rem`, workouts with HR and route | First run: install + configure. After: file lands in iCloud Drive on its own; user picks it | **Partly** — see trap below | Free tier is dashboard-only. **Basic $2.99 one-time** (multi-metric single file, sleep phases). **Premium $0.99/mo · $5.99/yr · $24.99 lifetime** for automated export | **Fallback.** Best UX, but paid + third-party |
| **Health Auto Export → REST API** | Same JSON, POSTed to a URL | Configure once | Yes (same iOS limits) | Premium | **Rejected.** Needs a server that receives health data. Kills local-first. Only viable for a self-hosted user who opts in explicitly |
| **Apple Shortcuts automation** | `Find All Health Samples` + `Calculate Statistics` → a number or a small CSV; can write to Files or POST | Build the shortcut (non-trivial), run it or schedule it | **Partly** — same lock-screen limit, plus a ~30s/low-memory background budget that kills big exports | Free | **Niche.** Good for "today's steps", useless for backfill. Worth documenting as a power-user recipe, not a product feature |
| **HealthKit via native wrapper** (Tauri iOS / Capacitor / Swift) | Live, incremental, background-delivered, exact | Install an app | Yes, genuinely | **$99/yr** + App Store review of a health app + privacy policy + a second codebase | **Out of scope.** The brief says no iOS app |
| **iCloud / Apple web APIs** | — | — | — | — | **Impossible.** No public server API for Health data exists. CloudKit can carry data an *app you wrote* put there — which presupposes the native app above |

### Traps in this table

- **"Automatic" is a lie on iOS.** iOS only lets an app read Health while the
  phone is **unlocked**, and the system decides when a background automation
  actually runs based on battery and usage. Health Auto Export's own docs say
  it cannot guarantee sync times and that daily is the realistic cadence. So
  even the paid route is "a fresh-ish file appears most days", not a feed.
- **The big export can hang.** Users report "Preparing…" sticking for hours, and
  empty zips. Budget for the user giving up; do not design a flow whose only
  path is a complete export.
- **`export_cda.xml` is not a second copy of the data.** It is a clinical-document
  (CCD) rendering, largely redundant, and it inflates the zip. Skip it.
- **`workout-routes/*.gpx`** is real GPS and is the most identifying thing in the
  archive. bujo stores no routes. Do not read that folder at all — see §7.

---

## 3 · `export.xml` in detail

### 3.1 The DTD (as emitted by the Health app)

```
<!ELEMENT HealthData (ExportDate,Me,(Record|Correlation|Workout|ActivitySummary)*)>
<!ATTLIST HealthData locale CDATA #REQUIRED>

<!ELEMENT Record (MetadataEntry*)>
<!ATTLIST Record
  type          CDATA #REQUIRED
  unit          CDATA #IMPLIED
  value         CDATA #IMPLIED
  sourceName    CDATA #REQUIRED
  sourceVersion CDATA #IMPLIED
  device        CDATA #IMPLIED
  creationDate  CDATA #IMPLIED
  startDate     CDATA #REQUIRED
  endDate       CDATA #REQUIRED>

<!ELEMENT Workout ((MetadataEntry|WorkoutEvent)*)>
<!ATTLIST Workout
  workoutActivityType   CDATA #REQUIRED
  duration              CDATA #IMPLIED  durationUnit           CDATA #IMPLIED
  totalDistance         CDATA #IMPLIED  totalDistanceUnit      CDATA #IMPLIED
  totalEnergyBurned     CDATA #IMPLIED  totalEnergyBurnedUnit  CDATA #IMPLIED
  sourceName CDATA #REQUIRED  sourceVersion CDATA #IMPLIED  device CDATA #IMPLIED
  creationDate CDATA #IMPLIED  startDate CDATA #REQUIRED  endDate CDATA #REQUIRED>

<!ELEMENT MetadataEntry EMPTY>
<!ATTLIST MetadataEntry key CDATA #REQUIRED value CDATA #REQUIRED>

<!ELEMENT ExportDate EMPTY>   <!ATTLIST ExportDate value CDATA #REQUIRED>
<!ELEMENT Me EMPTY>           <!-- HKCharacteristicTypeIdentifier{DateOfBirth,BiologicalSex,BloodType,FitzpatrickSkinType} -->
```

**The DTD is inlined in the file itself** and is the only schema Apple publishes
— HealthKit's export format is otherwise undocumented. Treat the DTD as
descriptive, not a contract: Apple has added elements (`ActivitySummary`,
`ClinicalRecord`, `Audiogram`) across iOS versions. **Parse permissively, ignore
unknown elements, never validate.**

A real record, verbatim:

```xml
<Record creationDate="2015-01-11 07:40:15 +0000"
        endDate="2015-01-10 13:39:35 +0000"
        sourceName="njr iPhone 6s"
        startDate="2015-01-10 13:39:32 +0000"
        type="HKQuantityTypeIdentifierStepCount" unit="count" value="4"/>
```

Note the shape: **32 seconds of walking, 4 steps.** That is the atom. A day of
step data is hundreds of these, not one.

### 3.2 The identifiers bujo can actually use

Mapped against the existing model (`src/lib/types.ts`): `DailyMetric` holds one
`sleep` (hours) per day; `BodyMetric` holds `weight`/`bodyFat` per day;
`Workout` holds activity/duration/distance/calories.

| HK type | `unit` seen | Aggregate per day | Lands in |
|---|---|---|---|
| `HKQuantityTypeIdentifierStepCount` | `count` | **sum** | new field (none today) |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | `kcal` | **sum** | new field / workout calories |
| `HKQuantityTypeIdentifierBasalEnergyBurned` | `kcal` | sum | optional |
| `HKQuantityTypeIdentifierAppleExerciseTime` | `min` | **sum** | new field |
| `HKQuantityTypeIdentifierAppleStandTime` | `min` | sum | skip |
| `HKQuantityTypeIdentifierDistanceWalkingRunning` | `km` or `mi` — **read the attribute** | sum | new field |
| `HKQuantityTypeIdentifierHeartRate` | `count/min` | mean / min / max | new field |
| `HKQuantityTypeIdentifierRestingHeartRate` | `count/min` | **last or mean — one per day already** | new field |
| `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | `ms` | mean | new field |
| `HKQuantityTypeIdentifierVO2Max` | `mL/min·kg` | last (sparse — weeks apart) | new field |
| `HKQuantityTypeIdentifierBodyMass` | `kg` or `lb` | **last of day** | `BodyMetric.weight` |
| `HKQuantityTypeIdentifierBodyFatPercentage` | `%` (value is 0–1 fraction — verify) | last | `BodyMetric.bodyFat` |
| `HKCategoryTypeIdentifierSleepAnalysis` | *(no unit)* | see §5 | `DailyMetric.sleep` |
| `HKCategoryTypeIdentifierMindfulSession` | *(no unit)* | **sum of `endDate − startDate`** | new field |
| `<Workout>` | `min`, `km`/`mi`, `kcal` | one row each | `Workout[]` |

**Trap: `unit` is per-record, not per-type.** The same journal can hold `kg` and
`lb` body-mass records if the user switched units or used two apps. Always read
`unit` and convert; never assume the type's canonical unit. Same for `km`/`mi`
on distance. `bodyFat` in particular: HealthKit's canonical percent unit is a
**fraction** (`0.185` = 18.5%) but exporters vary — measure it against a real
file before shipping a ×100.

**Trap: `value` is optional in the DTD.** Category records (sleep, mindful) carry
a string in `value`; some records carry none at all. `parseFloat(undefined)` is
`NaN`, and `NaN` silently poisons a sum. Guard.

### 3.3 `sourceName`, `device`, and the duplicate problem

`sourceName` is a free-text device or app name (`"njr iPhone 6s"`,
`"Apple Watch"`, `"Strava"`, `"MyFitnessPal"`). `device` is a semi-structured
blob:

```
<<HKDevice: 0x…>, name:Apple Watch, manufacturer:Apple Inc., model:Watch,
 hardware:Watch6,2, software:10.1>
```

**The duplicate problem is the single biggest correctness risk in this whole
document, and it is worse than it looks.** The Health *app* de-duplicates on
screen — Apple's own docs say it "adjusts results to avoid any double counting
of data from different sources". **`export.xml` does not.** It is a raw dump of
every sample from every source. So:

- An iPhone in your pocket and a Watch on your wrist both write
  `StepCount` for the same walk. Naively summing the day gives roughly **double**.
- A third-party app that *writes back* to Health (Strava, Nike Run Club) adds a
  third copy of the same run's distance and calories.
- Re-syncing a device can re-write samples that are already present.

There is no universal key. Practical rules, in order:

| Rule | Why |
|---|---|
| **1. Pick one source per type per day and use only it.** Prefer the Watch (`sourceName` matching `/watch/i`) for steps, energy, exercise, HR; fall back to the iPhone when the Watch wrote nothing that day | Deterministic, explainable, and matches what the Health app shows for a Watch wearer. A user who switched to a Watch mid-history gets a clean handover per-day, not a step in the middle of a month |
| **2. Never sum across sources.** Ever | This is the doubling bug |
| **3. Drop exact-duplicate tuples** `(type, startDate, endDate, value, sourceName)` before anything else | Kills re-sync artefacts cheaply |
| **4. For `Workout`, de-duplicate on overlapping time windows**, not on equality — Strava's copy of a run has a different `sourceName`, a slightly different `startDate`, and a different calorie figure | Two rows for one run is visible and annoying; the user notices immediately |
| **5. Show the user which source was chosen**, and let them change it | Whatever heuristic ships will be wrong for someone. A dropdown is cheaper than a support thread |

`ActivitySummary` elements are an alternative worth testing: they are **already
one row per day, already de-duplicated by Apple** (`activeEnergyBurned`,
`appleExerciseTime`, `appleStandHours`). If it covers the user's whole history
they are strictly better than summing `Record`s for those three metrics. It does
*not* carry steps, HR, or sleep — so it is a shortcut for three fields, not the
whole import.

### 3.4 Timestamps

Format is `yyyy-MM-dd HH:mm:ss ZZZZ` with a **numeric offset**, e.g.
`2016-04-15 07:27:26 +0100`. The offset is the offset *at the device's location
when the sample was recorded*. There is no IANA zone name anywhere — you get
`+0100`, never `Europe/London`, so you cannot reconstruct the zone, only the
instant and the local wall-clock.

**`new Date("2016-04-15 07:27:26 +0100")` is not reliably parseable** — this is
not an ISO-8601 string (space instead of `T`, offset without a colon). Chrome
accepts it; it is not specified behaviour. **Parse with a regex**, do not hand it
to `Date`.

---

## 4 · Size and performance

### Measured figures

| Source | Span | `export.xml` | `.zip` | Records |
|---|---|---|---|---|
| tdda.info (real export, verbatim) | ~1.5 yr | **109 MB** | **5.5 MB** | **446,670 `Record` elements** (446,702 nodes total) |
| aihealthexport.com, 1 yr light | 1 yr | 30–80 MB | 9–32 MB | — |
| aihealthexport.com, Watch daily | 5 yr | 200–500 MB | 60–200 MB | — |
| aihealthexport.com, heavy | 10+ yr | 800 MB – 1.5 GB | 240–600 MB | — |
| dev.to ETL writeup | 8 yr | ~1 GB | — | ~2.8 M records |
| Apple Support thread | — | **2.46 GB** | >100 MB | — |

Note the compression ratio in the one export we have both numbers for: **20:1**.
The XML is mostly repeated attribute names and device strings — roughly 200
bytes of markup per data point. That ratio is a trap in itself: *a 60 MB zip the
user picks can be a 1.2 GB stream.*

### What that means in a browser tab

| Approach | Verdict |
|---|---|
| `DOMParser.parseFromString(xml)` | **No.** A 500 MB document becomes a multi-gigabyte DOM. Reported to crash desktop browsers outright; guaranteed death on a phone |
| Read whole file to a string, then regex | **No.** V8's max string length is ~512 MB (64-bit) / ~256 MB (32-bit). A 1 GB `export.xml` cannot be held as one string at all — `.text()` throws before you write a line of parsing |
| **Chunked stream + line/element regex, in a Web Worker** | **Yes.** `Record` elements are self-closing one-liners; a regex over a sliding buffer handles them without an XML parser. Keep a carry-over tail for elements split across chunk boundaries |
| SAX library (`sax-js`, `saxes`) over the stream | Also fine, ~50 KB, handles `MetadataEntry` children properly. Reasonable if the hand-rolled scanner gets hairy — but `Record` is 99.99% of the file (446,670 of 446,702 nodes) and is self-closing |

Reported streaming throughput is **100k–200k records/sec** on desktop hardware.
At 446k records that is ~3 s; at 2.8 M, ~20 s. On a phone, assume 3–5× worse.
**Either way it must not run on the main thread** — a Worker is not an
optimisation here, it is the difference between "importing…" and a beachball.

### Unzipping

The zip comes from `<input type="file">`, so it is a `File`/`Blob` — random-access
and already on disk, not in memory. That is the good news.

- `DecompressionStream('deflate-raw')`: **Safari/iOS 16.4+, Chrome 103+,
  Firefox 113+, ~95% global.** Zip entries are raw deflate, so this is the whole
  decompressor — no dependency needed.
- The zip *container* still needs parsing: read the last ~64 KB via
  `file.slice()` for the End of Central Directory, walk the central directory,
  find the entry whose name ends `/export.xml`, `slice()` exactly its byte range,
  pipe through `DecompressionStream`. ~80 lines. **`package.json` has no zip
  library today and does not need one.**
- **Trap: never `await blob.arrayBuffer()` on the zip.** A 600 MB zip as one
  `ArrayBuffer` is already near the phone's ceiling before decompression starts.
  Slice and stream.

### The phone ceiling

Mobile Safari kills a tab that exceeds its budget, and **there is no catchable
exception** — the page simply goes blank. Empirical per-tab ceilings cited in the
wild sit around 1 GB on older iPhones; newer devices are higher but Safari is
still far more aggressive than desktop. Consequences:

1. Stream everything. Never materialise the XML, and never accumulate parsed
   records — fold into a `Map<isoDay, dayAccumulator>` as you go. 10 years of
   days is ~3,650 entries; that is the memory ceiling of the whole import, a few
   hundred KB.
2. Show a real progress figure (bytes decompressed / uncompressed size from the
   central directory) so a 40-second import is not indistinguishable from a hang.
3. **Warn before starting on mobile** if the zip is over ~100 MB, and say
   "this works better on a computer". A blank tab is a worse outcome than a
   refusal.

---

## 5 · Sleep

bujo stores exactly one number: `DailyMetric.sleep?: number // hours`. Getting
from Apple's representation to that number is where the double-counting lives.

### What the export contains

`type="HKCategoryTypeIdentifierSleepAnalysis"` records carry a **string** in
`value`, not a number (the integers below are the HealthKit enum; the export
writes the name):

| `value` string | Enum | Meaning | Written by |
|---|---|---|---|
| `HKCategoryValueSleepAnalysisInBed` | 0 | In bed, not necessarily asleep | iPhone bedtime, some 3rd-party |
| `HKCategoryValueSleepAnalysisAsleepUnspecified` | 1 | Asleep, stage unknown | pre-watchOS 9, 3rd-party trackers |
| `HKCategoryValueSleepAnalysisAsleep` | 1 | Legacy spelling of the same value | old exports |
| `HKCategoryValueSleepAnalysisAwake` | 2 | Awake during a sleep session | watchOS 9+ |
| `HKCategoryValueSleepAnalysisAsleepCore` | 3 | Light / intermediate sleep | watchOS 9+ |
| `HKCategoryValueSleepAnalysisAsleepDeep` | 4 | Deep sleep | watchOS 9+ |
| `HKCategoryValueSleepAnalysisAsleepREM` | 5 | REM | watchOS 9+ |

**A single night is many segments, and they overlap by design.** `InBed` spans a
broad window; `Core`/`Deep`/`REM`/`Awake` are nested inside it, typically 20–60
short segments per night on a Watch. Summing every record's duration
double-counts the stages inside the `InBed` envelope and can report 14 "hours"
for an 8-hour night.

### The reduction rule

```
hoursSlept(night) =
  1. take only value ∈ {AsleepCore, AsleepDeep, AsleepREM, AsleepUnspecified, Asleep}
     — drop InBed and Awake entirely
  2. merge overlapping/adjacent intervals into a union (sort by start, coalesce)
  3. sum the union's durations, / 3_600_000
  4. if step 1 produced nothing, fall back to the union of InBed and flag it
```

Why each step:

- **Dropping `InBed`** is what stops the double count: on watchOS 9+ the stages
  tile the asleep time exactly, and `InBed` is a *superset*. Keeping both counts
  the same minutes twice.
- **The union, not the sum**, because a user with both a Watch and a third-party
  tracker (AutoSleep, Pillow, an Oura app writing back) gets two overlapping sets
  of asleep segments from different `sourceName`s. Union is the only operation
  that is correct whether the sources agree or not. (Per-source selection, §3.3
  rule 1, is the alternative — but sleep is the one place where union is safer,
  because a source can cover only part of a night.)
- **Dropping `Awake`** because it is mid-session wakefulness, not sleep.
- **The `InBed` fallback** matters for history: before watchOS 9 (and for
  iPhone-only users) there are **no stage records at all**, only `InBed`. A rule
  that drops `InBed` unconditionally silently imports zero sleep for everything
  before ~2022. Surface it — "before <date>, only time in bed was recorded" — do
  not quietly conflate the two.

### Which day is a night?

A night crosses midnight, so keying by `startDate`'s day and by `endDate`'s day
give different answers for the same night. **Assign a sleep session to the day it
ends on** — i.e. "Tuesday's sleep" is the night of Monday→Tuesday, which is how
every sleep app and every human reads it. Concretely: **group asleep segments
into sessions by splitting wherever there is a gap > 3 hours, then key the
session by the local day of its last segment's `endDate`.** Naps are a real
consequence of that rule and are why the union is per-session rather than
per-day: an afternoon nap and the following night both key to the same day and
would otherwise be summed into a 10-hour night.

---

## 6 · Timezones and day boundaries

`src/lib/date.ts` `toISODay()` uses `getFullYear/getMonth/getDate` — **the
browser's local zone**, deliberately, with the comment "no UTC shift". Every key
in the journal is that string. So the import has to produce the same kind of key,
and the question is *whose* local time.

Three candidates, and the failure each one causes:

| Rule | Failure |
|---|---|
| **Convert to UTC, take the UTC date** | A workout at 23:40 local `+0100` is `22:40Z` — same day, fine. But a workout at **00:30 local `+0100`** is `23:30Z` the *previous* day: it lands on yesterday's page. In `-0800`, an afternoon session at 17:00 is `01:00Z` **tomorrow**. Roughly a sixth of an evening-training user's workouts move by a day. **Wrong.** |
| **Convert to the importing browser's zone** | Correct while the user is home. A run logged at 08:00 in Tokyo, imported later from London, becomes 23:00 the previous day. Travel history silently shifts. **Wrong.** |
| **Use the offset carried in the record** — take the wall-clock as written | A run at 08:00 `+0900` is Tokyo's 08:00 and keys to that Tokyo date. The user's memory of the day and the journal agree. **Right.** |

**Recommended rule: parse `startDate` with a regex, take the `YYYY-MM-DD`
literally as it appears in the attribute, and ignore the offset entirely for
day-keying.** The offset is only needed for duration arithmetic and for ordering
within a day.

```
/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/
//  ^^^^^^^^^^^^^^^^^^^^ this is the ISO day. Nothing else is.
```

This is not a shortcut — it is *more* correct than a `Date` round-trip, because
the string already encodes the local wall-clock at the moment of recording, which
is exactly the semantic `toISODay()` has. It also sidesteps the parse-reliability
problem in §3.4.

Corollaries and remaining edge cases:

- **DST.** Both `startDate` and `endDate` carry their own offset, so a session
  spanning the spring-forward boundary has *different* offsets on its two ends.
  Compute duration from the two instants (apply each offset), never from the
  wall-clock difference — the latter is off by exactly an hour twice a year.
- **Travel across zones produces a 23-hour or 25-hour day.** That is correct and
  should be left alone. Do not "fix" a day that has 25 hours of records.
- **Flying east loses a day; flying west repeats one.** A westward flight can
  give two sleep sessions keyed to the same day. The gap>3h session rule (§5)
  keeps them as two sessions; the union then correctly reports the total, which
  is the honest answer.
- **A `Workout` spanning midnight** keys to its `startDate` day. That matches how
  a person describes it ("I ran Friday night").

---

## 7 · Privacy

This is health data on a local-first app. The rules are short and absolute.

### Must never happen

| Rule | Why it is not a preference |
|---|---|
| **The file is never uploaded. Not to `api/`, not to Supabase, not to a Vercel blob, not to a "parsing service".** Parsing happens in a Worker in the tab | The user's entire medical timeline, GPS routes included, is in that zip. There is no benign version of shipping it somewhere |
| **No third-party endpoint, ever, without an explicit per-use consent the user typed into.** Health Auto Export's REST mode must not be a documented default | A URL field in settings is a data-exfiltration primitive. If it ships at all it ships with a warning and off |
| **`workout-routes/*.gpx` is not read.** bujo has no route field; reading it buys nothing and risks it landing in a sync blob | The routes name the user's home. The only safe handling of data you have no use for is not opening it |
| **Nothing from the import goes into a log, a Sentry breadcrumb, or a `console.log` that survives to production** | `console.error` already swallows sync failures in this codebase (see `docs/DATA-STORE-DECISION.md` §2); a health-data breadcrumb is a different class of mistake |
| **`Me` (date of birth, biological sex, blood type, Fitzpatrick skin type) is parsed only if a field consumes it.** Today nothing does | Don't hold what you don't use |
| **Import must be reversible.** Every imported day is tagged with its source and the import is undoable in one action | An import that cannot be undone is an import nobody dares run twice |

### What the UI must say, before the file picker opens

Not a checkbox buried in settings — the text on the screen where the user taps
"Choose file":

1. **"This file is read on your device. It is never uploaded."** In those words.
2. **What will be read**, named: the metrics list from §3.2. Not "your health data".
3. **What will be ignored**: GPS routes, clinical records, everything not listed.
4. **What it will change**: which existing days it can overwrite, and that it can
   be undone.
5. **The size warning on mobile** (§4), because the honest failure mode of a
   1 GB import on a phone is a blank tab.

### One thing to be honest about

bujo already has sync paths that push the whole journal to Vercel Blob, a folder,
Supabase and Drive. **An imported health metric is a journal field like any
other, and it will travel on every one of those paths.** That is a legitimate
design — but the consent screen must say "imported data syncs like the rest of
your journal" if any sync target is enabled, or the "never uploaded" promise in
point 1 becomes technically true about the *file* and misleading about the
*data*. Say both sentences, or say neither.

---

## 8 · Open questions, numbers not verified

Stated rather than invented:

- **Body-fat scaling.** HealthKit's `%` unit is documented as a fraction, but
  whether `export.xml` writes `0.185` or `18.5` was not confirmed against a real
  file. Check before shipping a ×100.
- **`ActivitySummary` attribute names and coverage.** It is in the DTD's content
  model and is known to carry active energy, exercise time and stand hours, but
  the exact attribute spellings and how far back it goes were not verified.
- **Health Auto Export's exact JSON field names** per metric. The top-level shape
  (`data.metrics[]`, `data.workouts[]`, sleep with `asleep`/`inBed`/`deep`/
  `core`/`rem`) and the date format (`yyyy-MM-dd HH:mm:ss Z`, e.g.
  `2024-02-06 14:30:00 -0800`) are confirmed; per-metric key names are not.
- **Real segment count per night.** "20–60" is an estimate from the shape of
  published sample nights, not a measured figure.
- **Streaming throughput on a phone.** The 100k–200k records/sec figure is desktop.
  The 3–5× penalty is an assumption.
- **iOS Safari's current per-tab memory ceiling.** Published numbers are from
  iPhone 6/6s/7 era hardware (645 MB / 1 GB / 2 GB). Modern figures were not found.

None of these change the recommendation. All of them are answerable in one
afternoon with one real `export.zip`, and **that is the correct next step before
any parser is written.**

---

## Sources

- [Test-Driven Data Analysis — In Defence of XML: Exporting and Analysing Apple Health Data](https://www.tdda.info/in-defence-of-xml-exporting-and-analysing-apple-health-data) — the DTD verbatim, 109 MB / 5.5 MB / 446,670 records, the sample `Record`, the date format
- [Apple Health Export XML: Format, File Size, and Why AI Tools Can't Read It](https://www.aihealthexport.com/guides/apple-health-xml-format) — size-by-span table, ~200 bytes/record
- [Taming the Beast: a High-Performance ETL Pipeline for Apple Health's XML Exports](https://dev.to/beck_moulton/taming-the-beast-building-a-high-performance-etl-pipeline-for-apple-healths-massive-xml-exports-3f3e) — 2.8 M records / 8 years / ~1 GB, 100k–200k rec/s, DOM-parser crash
- [Apple Community — Health Data Takes Hours to Export](https://discussions.apple.com/thread/254105133) and [health data export.xml](https://discussions.apple.com/thread/254094174) — 2.46 GB export, multi-hour exports, "Preparing…" hangs
- [Can I Blog Too? — Sleep Data in the Apple Health Export](https://www.johngoldin.com/blog/apple-health-export/2023-02-sleep-export/) — the five `HKCategoryValueSleepAnalysis*` strings as they appear in the export, and the InBed/stage overlap
- [HKCategoryValueSleepAnalysis](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis) · [asleepUnspecified](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis/asleepunspecified) · [asleepCore](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis/asleepcore) · [asleepDeep](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis/asleepdeep) · [asleepREM](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis/asleeprem) · [inBed](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis/inbed)
- [What's new in HealthKit — WWDC22](https://developer.apple.com/videos/play/wwdc2022/10005/) — the watchOS 9 four-state split
- [HKQuantityTypeIdentifier](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier) · [heartRateVariabilitySDNN](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartratevariabilitysdnn) — units for exercise time (min), HRV SDNN (ms), VO2max (mL/min·kg)
- [Health Auto Export — FAQ / pricing](https://help.healthyapps.dev/en/health-auto-export/faq/) — $2.99 Basic, $0.99/mo · $5.99/yr · $24.99 lifetime Premium; unlocked-phone requirement; no guaranteed sync cadence
- [Health Auto Export — export format](https://help.healthyapps.dev/en/health-auto-export/export-format) — `data.metrics[]` / `data.workouts[]`, sleep `asleep`/`inBed`/`deep`/`core`/`rem`, `yyyy-MM-dd HH:mm:ss Z`
- [Health Auto Export — Automations](https://help.healthyapps.dev/en/health-auto-export/automations/) and [Lybron/health-auto-export](https://github.com/Lybron/health-auto-export) — destinations (iCloud Drive, Google Drive, Dropbox, REST, MQTT, Home Assistant), 150+ metrics
- [Using Shortcuts and serverless to build a personal Apple Health API](https://blog.maximeheckel.com/posts/build-personal-health-api-shortcuts-serverless/) — `Find All Health Samples` + `Calculate Statistics`, background/lock-screen limits
- [What You Can (and Can't) Do With Apple HealthKit Data](https://www.themomentum.ai/blog/what-you-can-and-cant-do-with-apple-healthkit-data) — no server API for Health; on-device only
- [Protecting access to user's health data — Apple Support](https://support.apple.com/guide/security/protecting-access-to-users-health-data-sec88be9900f/web) — iCloud sync is device-to-device
- [Apple Developer Program cost](https://www.appaloosa.io/blog/what-is-the-apple-development-program) and [what the $99 fee covers](https://www.trifleck.com/blog/what-does-the-99-apple-developer-get-you) — HealthKit is gated behind the paid program for distribution
- [Duplicate Steps or Metrics in Apple Health](https://circular.crisp.help/en/article/duplicate-steps-or-metrics-in-apple-health-1t2jlcz/) and [Apple HealthKitV2 Workouts Export Format](https://support.mydatahelps.org/hc/en-us/articles/4412890806419-Apple-HealthKitV2-Workouts-Export-Format) — Watch/iPhone double counting, re-sync duplicates, de-duplication guidance
- [caniuse — DecompressionStream "deflate-raw"](https://caniuse.com/mdn-api_decompressionstream_decompressionstream_deflate-raw) — Safari/iOS 16.4, Chrome/Edge 103, Firefox 113, 95.07% global
- [Compression Streams are now supported on all browsers — web.dev](https://web.dev/blog/compressionstreams)
- [Mobile Safari web pages are severely limited by memory](https://lapcatsoftware.com/articles/2026/1/7.html) and [Godot #70621](https://github.com/godotengine/godot/issues/70621) — per-tab ceilings, uncatchable OOM
