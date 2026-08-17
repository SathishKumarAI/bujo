# Data store decision — one canonical store, and how to query it

Scope: **one owner, one journal, ten years.** The multi-user scaling question
(10 → 10M users, Postgres shapes, delta sync) is answered separately in
`docs/data-engineering/schema-and-pipelines.mdx`; nothing here contradicts it,
because nothing here is about a server.

---

## 1. Recommendation

**Keep `localStorage["bujo:data"]` as the single canonical store. Do not
migrate. The measured numbers do not justify a database, and a migration nobody
needs is a data-loss risk taken for nothing.**

Everything else that holds journal bytes is a **cache** and must be labelled and
treated as one: the Supabase row, the Vercel blob, the folder `bujo.json`, the
PostgREST row, the gist, the Drive file. Each is rebuildable by pushing the
canonical journal at it.

Two things must change, because both are silent-loss bugs, not preferences:

| # | Change | Why it is not optional | State |
|---|---|---|---|
| 1 | **IndexedDB `bujo-images` must stop being canonical.** Photo bytes must travel with a sync. | They existed in exactly one place and never synced. See §8 F-1. | **Done, bounded** (PR #126). Photos travel within a budget; over it the journal syncs without them and says so. Unbounded needs blob-per-photo |
| 2 | **Every adopt path must merge**, and ideally one sync target at a time. | Four writers of the same blob can be live at once; two adopted a remote *without* merging. See §8 F-2, F-3. | **Done** (PR #125). The "one target at a time" half is still open — F-7 |

For query: a **derived SQLite file, built outside the browser from an exported
backup, by a script that can be re-run at any time.** It is a cache. It is never
written back. It buys real SQL over ten years of journal without adding a byte
to the app's runtime.

> **Status.** §2, §3, §4 and §8 describe the state **at audit time** and are
> left as written — they are the evidence, not a to-do list.
>
> | | |
> |---|---|
> | **Fixed** (PR #125) | F-2, F-3, F-4, F-5, F-6 (partly), F-9, F-10 |
> | **Fixed, bounded** (PR #126) | **F-1 · photos never sync.** They now travel with every push *within a size budget*; over it the journal still syncs and the UI says "Synced without photos". The unbounded answer (blob-per-photo) is still the right end state for heavy photo users — see F-1 in §8 |
> | **Still open, by choice** | F-7 (four writers, four debounce windows), F-8 (`bujo:sync` passphrase in plaintext) — see §9 |
> | **Not built** | Step 7, the SQLite exporter. Deliberate: it was gated on F-1 → F-4, and F-1 is not done |
>
> `tsc -b` 0 · **764 tests pass** (757 → 764, 7 new) · eslint 0 errors, 2
> pre-existing warnings · `npm run build` green.

---

## 2. The stores today

Count first. **Eleven places accept journal bytes; four of them auto-write the
same blob concurrently.**

### Auto-writing (all can be enabled simultaneously)

| Path | Writes | Format | Trigger | Conflict rule | Failure visible? |
|---|---|---|---|---|---|
| `lib/storage.ts` → `bujo:data` | whole `JournalData` | JSON, plaintext | every store change (`store.tsx:252`) | n/a — canonical | **No.** `console.error` only |
| `lib/storage.ts` → `bujo:enc` | whole journal | AES-GCM blob (`lib/crypto.ts`) | every change *when a passcode is set*; mutually exclusive with `bujo:data` | n/a — canonical | **No.** `console.error` only |
| `lib/bujocloud.ts` → `/api/sync` (Vercel Blob) | whole journal | E2E-encrypted; path = SHA-256 of passphrase | 4000 ms debounce (`App.tsx:85`) | pull-first; **remote newer ⇒ raw `replaceAll(rm)`, no union, no prompt** | Partly — `SyncIndicator` shows `error`; the debounced push swallows it (`catch {}`) |
| `lib/fscloud.ts` → folder `bujo.json` | whole journal | JSON, pretty | 1500 ms debounce (`App.tsx:216`) | pull-first; **remote newer ⇒ raw `replaceAll(rm)`, no union, no prompt** | **No.** `catch { }` |
| `lib/supabase.ts` → `journals` row | whole journal | JSONB | 4000 ms debounce (`App.tsx:137`) + realtime subscribe | pull-first; remote newer ⇒ `resolveIncoming` **union** ✔ | **No.** `catch { }` |
| `lib/serverSync.ts` → PostgREST `/journals` | whole journal | JSON, row keyed by `deviceId()` | 2500 ms debounce + `pagehide` flush (`ServerSync.tsx:44`) | **none in the push path** — blind upsert | **No.** returns `false`, caller `void`s it |

### Manual / one-way

| Path | Writes | Trigger | Notes |
|---|---|---|---|
| `lib/gdrive.ts` → Drive `appDataFolder/bujo.json` | whole journal | button (`DriveSync.tsx:43`) | raw `data` — photos not inlined |
| `lib/github.ts` → gist `bujo.json` | whole journal | button (`CloudStorage.tsx:62`) | raw `data` — photos not inlined |
| `lib/imageStore.ts` → IndexedDB `bujo-images` | photo data-URLs | on photo add | **canonical, not a cache** — see §8 F-1 |
| `lib/fscloud.ts` → IndexedDB `bujo-fs` | directory handle | on folder pick | not journal data |
| Downloads (`Settings.tsx`) | JSON / redacted JSON / checksummed JSON / Markdown / ICS / 9× CSV | button | one-way, no write-back |
| Other `localStorage` keys | `bujo:sync` (**the sync passphrase, plaintext**), `bujo:device-id`, `bujo.ui.*`, Supabase auth session | various | `bujo:sync` is a live credential sitting beside the data it unlocks |
| Service worker (`vite-plugin-pwa`) | app shell only | build | no journal data |

**The shape of the problem:** the canonical store is fine. The *periphery* is
four concurrent writers with three different conflict rules, four different
debounce windows (1500 / 2500 / 4000 / 4000 ms), and near-zero failure
visibility.

---

## 3. Measured / assumed

Measured by bundling `src/lib/demo.ts` with esbuild and running it in Node
(90 days of dense, every-day logging — a realistic *upper* bound for a committed
user).

**Measured — one 90-day journal: 65,957 bytes across 31 top-level keys.**

| Collection | Bytes | % of blob |
|---|---|---|
| `habitLog` | 21,376 | 32% |
| `entries` | 17,673 | 27% |
| `habitValues` | 8,300 | 13% |
| `metrics` | 3,672 | 6% |
| `workouts` | 3,183 | 5% |
| everything else (26 keys) | 11,753 | 17% |

`habitLog` is the largest collection and holds no user prose — it is
`Record<day, habitId[]>` and the cost is the id strings (`habit_<uuid>`, 41
chars each × 11 habits × 365 days).

**Measured — projected size and serialisation cost** (day-keyed collections
scaled to N days, then timed over 20 iterations):

| Horizon | Blob | `JSON.stringify` | `JSON.parse` | ×4 sync effects per edit |
|---|---|---|---|---|
| 1 year | 0.29 MB | 0.8 ms | 0.6 ms | 3 ms |
| 5 years | 1.20 MB | 3.1 ms | 2.4 ms | 12 ms |
| **10 years** | **2.35 MB** | **6.1 ms** | 4.7 ms | **24 ms** |

**Confirmed:** the whole journal is one in-memory object (`store.tsx:244`,
`useReducer` over `JournalData`), serialised in full on every change by the save
effect *and* independently by each active sync effect's snapshot comparison.

**Verdict against the ~5 MB localStorage quota: 10 years lands at ~47% of
budget.** There is no quota guard anywhere — `grep` for `QuotaExceeded`,
`navigator.storage`, `estimate()`, `persist()` returns nothing. `save()` catches
the throw and writes to the console.

### Assumptions, stated

| Assumption | Basis | If wrong |
|---|---|---|
| The demo's density ≈ a committed user's density | 90 days with habits logged daily, metrics most days, ~1 workout/5 days | A lighter user is smaller; this is the upper bound |
| Photos stay out of the blob | `imageStore.ts` moved them to IndexedDB; blob holds `img:` ids | If inline data-URLs return, quota is hit in months, not decades |
| ~5 MB quota, counted in UTF-16 code units | Browser convention; not measured on the owner's browsers | A 2.5 MB budget would put 10 years at ~94% — still fits, with no headroom |
| Habit count stays ~10 | demo has 11 | 50 habits roughly triples `habitLog`; 10 years → ~4 MB. Worth watching |

---

## 4. Access patterns

### Queries the app already runs (all in memory, all pure functions)

| Module | Shape | Window |
|---|---|---|
| `stats.ts` | streaks, task completion, habit consistency, weekday/month rollups, `onThisDay`, substring search | mostly all-time |
| `fitness.ts` | PRs, Epley 1RM progression, volume/week, sets per muscle, stalled lifts, muscle recovery | all-time + 7/10/28-day windows |
| `coverage.ts` | per-day rollup joining **9 collections** | 1 day, ×7 for the week |
| `pickleball.ts` | win rate, partner/venue/opponent group-bys, streaks, DUPR trend, least-squares forecast | all-time + weekly/monthly buckets |
| `correlations.ts` | Pearson r within `metrics`; habit×mood, focus×sleep joins | all-time |
| `habitStats.ts`, `streak.ts`, `focus.ts` | per-habit grades, perfect weeks, clean streaks, deep-work heatmap | 30 / 90 / 365 days, 26 weeks |

**Every join key is the ISO day string `YYYY-MM-DD`.** The only genuine
cross-collection joins in the codebase:

`moodImpactRanking`, `weekdayWeekendSplit` (habits ⋈ metrics) ·
`focusSleepCorrelation` (devSessions ⋈ metrics) · `weeklyDigest` (metrics ⋈
habits ⋈ entries) · `dayCoverage` (9-way) · `weeklyRadar` · `relativeStrength`
(workouts ⋈ bodyMetrics) · `activeDays` / `dayActivity` (6–7 collection union).

Grain is **daily everywhere**, with three sub-daily exceptions:
`habitTimes[day][habitId]` (ISO timestamps, bucketed to 24 hours by
`checkin.ts`), `Fast.start`/`end`, and `entry.createdAt` (used only for
ordering).

Performance note, relevant only as evidence that no engine change is needed:
`Insights.tsx` and `Stats.tsx` contain **no `useMemo`** and recompute every
all-time aggregate on every render, including `search()` on each keystroke. At
10 years that is tens of milliseconds of recompute per render. That is a
memoisation bug, not a storage problem — a database would not fix an
unmemoised render.

### Queries that cannot be run today, at any effort

These are the actual justification for a query surface. None is expressible
through the UI, and each is one line of SQL.

| Question | Why it is impossible now |
|---|---|
| "Win rate at each venue, but only on days I slept >7h" | pickleball ⋈ metrics join does not exist; no view offers it |
| "Does a hard workout predict worse mood *tomorrow*?" | **every join in the app is same-day.** There is no lagged join anywhere |
| "Mood on days I drank vs. didn't, by season, over 6 years" | `moodImpactRanking` is all-time only; no seasonal or arbitrary-range grouping |
| "Workouts vs. sleep" | the agent sweep found workouts are **never** correlated against sleep or mood in any module |
| "Compare Q1-2024 with Q1-2026" | no view compares two arbitrary ranges; windows are fixed (7/30/90/365 d, 6/12 mo, 52 wk) |
| "Entries tagged #work, still open, created >90 days ago" | `search()` is a substring scan with no structured filters |
| Anything, after the app stops running | the shape lives in the app's functions, not in the data |

That last row is the decisive one. Today the *questions* are compiled into
TypeScript. The data outlives the app only if the queries can be asked without it.

---

## 5. The choice

### Criteria

| Criterion | Weight | Why |
|---|---|---|
| Readable in 10 years with no app | highest | The point of the exercise |
| Exactly one writable canonical store | highest | Four concurrent writers is the live bug |
| Offline, no network, no server | fixed constraint | Deliberate property; the PWA works with no network |
| Supports the ad-hoc queries in §4 | high | The owner's stated second ask |
| No new runtime dependency | high | 2.35 MB at 10 years does not earn one |

### Chosen: JSON blob canonical + derived SQLite for analysis

| Criterion | Result |
|---|---|
| Readable in 10 years | JSON, UTF-8, one file, `JournalData` documented in `src/lib/types.ts` and `docs/DATA_MODEL.md`. Readable by `jq`, Python, a text editor |
| One canonical store | Already true for the journal; §1 change #1 makes it true for photos |
| Offline | No change — nothing added to the runtime |
| Ad-hoc queries | SQLite file, built from a backup on the desktop. Full SQL, joins, window functions |
| New dependency | **None in the app.** The build script is Node stdlib + `node:sqlite` (built in since Node 22; the repo already runs Node 24) |

The derived database gets one table per collection plus a `day` dimension —
because §4 proved every join key is the ISO day:

```
day(date PK, dow, iso_week, month, year)     -- generated, spans min..max
entries(id, date, type, status, text, important, memory, created_at)
entry_tag(entry_id, tag)                     -- normalised out of Entry.tags[]
habits(id, name, category, type, target, avoid, started_on, archived)
habit_log(date, habit_id, value, checked_at) -- habitLog ∪ habitValues ∪ habitTimes
habit_skip(habit_id, date)
metrics(date PK, mood, stress, sleep, energy, calories, protein, carbs, fat, temp_c, weather)
workouts(id, date, activity, split, duration_min, distance_km, calories, rpe, notes)
workout_set(workout_id, seq, exercise, weight, reps, rpe, kind)
body_metrics(date, weight, body_fat) · body_measurement(date, name, value)
pickleball(id, date, format, games_won, games_lost, partner, opponent, location, level,
           points_for, points_against, rpe, duration_min)
pickleball_events, dev_sessions, typing_sessions, fasts, books, book_learning,
read_links, gratitude, memories, cycle, birthdays, monthly, collections,
recurrences, challenges, challenge_log, custom_goals, mindset_focus,
relapses, urge_log, dupr_log                 -- dupr_log lifted out of settings
```

`day` is the join table. `SELECT` across any two facts becomes a join on
`date`. The lagged question that is impossible today —

```sql
SELECT AVG(m2.mood) FROM workouts w
  JOIN metrics m2 ON m2.date = date(w.date, '+1 day')
 WHERE w.rpe >= 8;
```

**One rule, enforced by construction: the script only ever reads the JSON and
writes the `.sqlite`. Nothing writes back.** If the file is deleted, re-run it.
If it disagrees with the journal, the journal is right.

### Rejected

| Option | Why rejected |
|---|---|
| **SQLite in the browser as canonical** (sql.js / wa-sqlite / OPFS) | ~1 MB of wasm, an async storage layer through a synchronous reducer, and a second store that can accept writes — the exact failure mode we are removing. Buys nothing measured: the blob is 2.35 MB at 10 years and every in-app query already runs in milliseconds |
| **Split the blob into per-collection localStorage keys** | Turns one atomic write into 28 non-atomic ones. A quota failure mid-write leaves a torn journal with no transaction to roll back. Strictly worse |
| **IndexedDB as canonical for the journal** | Async everywhere for a 2.35 MB object that fits in the sync store, and it is *less* inspectable than localStorage, not more |
| **Supabase Postgres as canonical** | Kills offline-first, the app's defining property. It is a cache and should stay one |
| **Flat files as canonical** (one Markdown/JSON per day, folder-synced) | Genuinely tempting — maximally durable, git-friendly. Rejected because the File System Access API is Chromium-only and needs a user gesture to re-grant after every reload (`fscloud.ts:53`). A canonical store the app cannot silently open is not a canonical store. Kept as a *cache* target, which is what it already is |
| **Per-collection files inside the synced folder** | Same permission problem, plus 28 files to keep transactionally consistent across a third-party sync client that reconciles them independently |

### Honest answer on the store itself

**The current setup is fine.** 2.35 MB at ten years, 6 ms to serialise, under
half the quota, in the most inspectable store the platform has. The instinct to
reach for a database here is not supported by any measurement taken. Spend the
effort on §8 instead.

---

## 6. Migration path

**There is no schema migration.** No `SCHEMA_VERSION` bump, no `migrate()`
change, no rewrite of stored data. That is the strongest property of this
decision: a journal in the wild is already in the target format.

| Step | Touches | Effect on an existing journal | Status |
|---|---|---|---|
| 1. Inline photos on push, re-externalise on pull | `inlineImages` + new `externalizeImages`, wired into the push *and* pull of all 6 sync modules | None locally. Next sync carries photo bytes for the first time | **Shipped** |
| 2. Route the blob and folder adopt paths through `resolveIncoming` | `App.tsx` | None until a conflict; then items are unioned instead of dropped | **Shipped** |
| 3. Add the missing collections to `conflict.ts` + union the settings data logs | `ID_ARRAYS`, new `unionScalars`, settings merge | None until a conflict; then three collections and `duprLog` stop vanishing | **Shipped** |
| 4. Give `serverSync` the same pull-first guard | `ServerSync.tsx` | None until two devices; then no blind clobber | **Shipped** |
| 5. Surface `save()` failure in the UI | `storage.ts` returns `boolean` + emits `bujo:persist`; new `StorageBanner` | None until quota is hit; then the user is told | **Shipped** |
| 5b. Ask for storage persistence | `main.tsx`, one line | Reduces the chance of silent eviction | **Shipped** |
| 6. ~~Make the *default* Export JSON checksummed~~ | — | — | **Rejected on implementation — see below** |
| 7. Add `scripts/journal-to-sqlite.mjs` | new file, runs in Node | Nothing. Reads a backup, writes a `.sqlite` | Not started |

**No user is asked to do anything, and no stored byte changes shape.** A user who
never updates keeps a working app; a user who does gets the same journal with
fewer ways to lose it.

### Step 6 was wrong, and is withdrawn

Writing the change revealed it contradicts this document's own first criterion.
`withChecksum` prepends a `bujo-checksum:<hex>` line, which makes the file **no
longer valid JSON** — that is why the existing button writes `.json.txt`. Making
it the default would trade "readable by `jq`, Python, or a text editor in ten
years" for truncation detection on a file that `importJSON` can already reject
by failing to parse.

Durability beats integrity-checking here, because the failure the checksum
catches (a truncated file) is one that `JSON.parse` catches anyway, while the
failure the format change causes (an archive no standard tool will open) is
silent and permanent. **The default export stays pure JSON.** The checksummed
export remains available for anyone moving a backup over a lossy channel.

Recorded rather than quietly dropped: the doc recommended it, implementation
disproved it, and the reasoning is worth more than the consistency.

The one irreversible act already happened and is worth knowing about:
`migrate()` deletes the retired `stickers` key on every load (`storage.ts:141`).
Backups taken before 2026-08-02 still hold them; the live journal does not.

---

## 7. Backup and restore

### Pipeline

| Layer | Cadence | Artefact | Verifies |
|---|---|---|---|
| **Tier 0 — canonical** | every edit | `localStorage["bujo:data"]` | nothing; this is the thing being protected |
| **Tier 1 — hot replica** | ≤ 4 s | *one* enabled sync target | `updatedAt` comparison on pull |
| **Tier 2 — cold archive** | weekly, prompted | `bujo-backup-YYYY-MM-DD.json`, checksummed | FNV-1a line via `verifyChecksum` |
| **Tier 3 — analysis** | on demand | `bujo.sqlite` | row counts vs. `dataSummary()` |

Tiers 1, 2 and 3 are all caches. Only Tier 0 is canonical.

The nudge already exists and works: `daysSinceBackup` + `recommend.ts:23` flag a
backup older than 7 days, and Settings renders the warning.

Tier 2 stays **pure JSON**, not the checksummed format — see §6 "Step 6 was
wrong". Truncation is caught by `JSON.parse` failing on import; the checksummed
variant stays available in the fold for moving a backup over a lossy channel.

Retention: keep weekly for 3 months, then one per quarter. At 2.35 MB a decade
of quarterly backups is under 100 MB — do not build pruning.

### Restore procedure

1. Settings → Data → **Import JSON**, choose the backup.
2. `verifyChecksum` runs first (`Settings.tsx:81`). A mismatch aborts before
   anything is replaced.
3. `importJSON` → `migrate()` → `replaceAll(data, { stamp: true })`. The
   re-stamp is deliberate: a restored backup must beat a stale remote.
4. Confirm against "Your data at a glance" — entries, habits, workouts,
   memories, photos, KB stored.

### Rehearsal — required, quarterly, ~10 minutes

A backup that has never been restored is not a backup. Rehearse in a **private
window** so the real journal is never at risk.

| # | Step | Pass condition |
|---|---|---|
| 1 | In the real app: Settings → Data → note the six `dataSummary` tiles and "KB stored" | Values written down |
| 2 | Export the checksummed backup | File exists, first line begins `bujo-checksum:` |
| 3 | Open the app in a **private window** (empty `localStorage`) | Welcome gate appears |
| 4 | Choose "local", then Import the backup | "Backup imported successfully." |
| 5 | Compare the six tiles to step 1 | **All six match exactly** |
| 6 | Open a memory with a photo, and Fitness → progress photos | **Images render.** If they are blank, §8 F-1 is live |
| 7 | Open Insights and Stats | Charts draw; streaks match the real app |
| 8 | Corrupt a copy: delete one character from the middle, import it | Import is **refused**, journal untouched |
| 9 | Close the private window | — |

Step 6 is the one that matters and the one a naive rehearsal skips. Step 8 is
the only proof that the integrity check does anything.

Log the date in `docs/WORKLOG.md`. A rehearsal that was not recorded did not
happen.

---

## 8. Failure modes

Ordered by how quietly they lose data. **F-2 to F-6, F-9 and F-10 are fixed**
(PR #125). **F-1 is NOT** — see its entry. The descriptions below are kept as
the record of what was wrong and how it was found, which is the part worth
keeping.

**F-1 · FIXED (bounded) · Photos existed in exactly one place and never synced.**
`inlineImages` is called by three download buttons in `Settings.tsx` and
**nowhere else**. All 19 push call sites send raw `data` holding `img:` ids.
A second device receives ids that resolve to nothing; if the first device's
storage is cleared, the ids dangle forever with no error anywhere.
*Detected by:* rehearsal step 6. *Also by:* comparing the "Photos" tile against
the count of images that actually render.

> **How it was fixed, and why not the obvious way.** Every push now inlines
> photos and every pull re-externalises them, so the bytes travel and the
> receiving device's blob stays small. But inlining *unconditionally* — the
> first attempt — would have been a worse bug than the one it fixed.
>
> Photos are 1024px JPEG q0.72 (`lib/image.ts`): ~120 KB each, ~160 KB base64.
> Progress photos are a weekly feature, so a year is ~52 of them, about 8 MB
> inlined, before the journal and before encryption's base64 overhead. But
> `api/sync.ts` rejects `payload.length > 8_000_000`, and **Vercel's platform
> request-body limit is 4.5 MB**, hit before the handler ever runs.
>
> That version passed the whole suite. It would have taken a photo user from
> "journal syncs, photos quietly missing" to "nothing syncs at all" — trading
> partial loss for total, and losing the half you cannot re-take.
>
> So the three network paths inline **within `SYNC_INLINE_BUDGET`** (2.8 MB of
> JSON — 4.5 MB less base64's ×1.34 and JSON-string escaping's ×1.05). Over it
> they push ids as before, and `SyncIndicator` says *"Synced without photos"*
> rather than failing or lying. All-or-nothing, never a partial set: a partial
> set means the far device shows some photos and dangling references for the
> rest with no way to tell which. The file-based targets — folder, Drive, gist —
> have no such limit and inline unconditionally.
>
> **Still bounded, deliberately.** A user with years of photos still will not
> sync them over the network paths; they will get the honest banner and their
> folder/Drive backups. The unbounded answer is **blob-per-photo — upload each
> photo once, keep ids in the journal** — which is the right end state and a
> larger piece of work. Tracked here rather than pretended away.
>
> Prerequisite, already fixed: F-10, the id collision a batch mint triggers.

**F-2 · FIXED · The blob and folder paths adopt a newer remote without merging.**
`App.tsx:92` and `App.tsx:221` call `replaceAll(rm)` directly. Supabase, at
`App.tsx:144`, calls `resolveIncoming` and unions. Concretely: device A logs
entries offline, never syncs; device B edits later; A comes online, sees a newer
remote, and **discards its unsynced entries with no prompt and no union**.
`resolveIncoming` was written for exactly this and is bypassed on two of three
paths.
*Detected by:* nothing today. A unit test asserting all three adopt paths union
is one file.

**F-3 · FIXED · `mergeJournals` silently drops three collections and all of settings.**
Verified by running `mergeJournals` on two journals:

```
KEPT     entries (in ID_ARRAYS): 1
DROPPED  typingSessions: 0
DROPPED  customGoals: 0
DROPPED  mindsetFocus: 0
DROPPED  settings.duprLog: 0
DROPPED  settings.programDone: 0
```

`conflict.ts:4` lists 16 id-keyed arrays; `JournalData` has 19. The three
missing ones fall through to the winner's copy, so the loser's are gone. Worse,
**`settings` is taken wholesale from the winner**, and `settings` holds real
time-series data: `duprLog` (dated DUPR ratings), `programDone`,
`programActuals`, `coachingWeeksDone`. A DUPR rating logged on the losing device
does not survive a merge.
*Detected by:* a test that asserts every array key in `JournalData` appears in
`ID_ARRAYS` or `KEYED_ARRAYS` — it fails today, and it keeps failing every time
a collection is added and the merge list is not.
*Root cause:* the merge list is maintained by hand against a type that grows.

**F-4 · FIXED · A failed local save is invisible.**
`storage.ts:193` catches and logs. The comment claims it is "surfaced by the
UI's backup nudge" — it is not; the nudge is driven by `lastBackup`, which has
nothing to do with whether the write succeeded. On quota exhaustion or Safari
private mode, the app keeps working from memory and loses everything on reload.
*Detected by:* nothing. Needs `save()` to return a boolean and a banner.

**F-5 · FIXED (copy) · The storage meter measures the wrong bytes.**
`Settings.tsx` computes `JSON.stringify(data).length / 5 MB` and warns "photos
use the most space". Photos moved to IndexedDB and are **not** in that number,
and IndexedDB is not on the 5 MB budget. The meter under-reports the thing its
own warning text blames.
*Detected by:* comparing it to `navigator.storage.estimate()`, which the app
does not call.

**F-6 · PARTLY FIXED · `serverSync` pushes blind, and it is not sync.**
The push effect has no pull-first guard. Separately, rows are keyed by
`deviceId()` and pulls filter `?id=eq.${deviceId()}` — device A can never read
device B's row. The self-host path is a **per-device backup labelled as sync**.
*Detected by:* signing two devices into the same self-host URL and observing
they never converge.

**F-7 · Four writers, four debounce windows.**
Folder 1500 ms, server 2500 ms, blob 4000 ms, Supabase 4000 ms — all can be
enabled at once, all pushing the same object, each with its own echo-guard
string. Two of them can adopt different remotes in the same second.
*Detected by:* nothing. Prevented by making sync targets mutually exclusive.

**F-8 · The sync passphrase sits in plaintext beside the data.**
`localStorage["bujo:sync"]` is the key to the E2E blob, stored unencrypted in
the same origin as the journal. It stays out of exports only incidentally — it
is a bare `localStorage` key, not a `settings` field, so `SYNC_SECRET_KEYS`
(which strips six *settings* keys) never sees it and does not protect it. Any
XSS reads both the ciphertext location and the key that opens it.
*Detected by:* review only.

**F-10 · FIXED · `putImage` minted colliding ids, so a batch of photos ate
itself.** Found while fixing F-1, and caused *by* fixing F-1. Ids were
`Date.now()` + `Math.floor(performance.now() % 1e6)` — both whole milliseconds —
so everything minted in one tick got the same id. Measured: **50 calls in one
tick produced 2 distinct ids.** Harmless for four years because photos were only
ever added one at a time by hand; instantly fatal once `externalizeImages`
started minting a batch inside a single `Promise.all`, where 48 of 50 photos
would have silently overwritten each other. A monotonic counter now carries the
uniqueness; the clocks only keep ids sortable.
*Detected by:* `imageStore.test.ts` — 500 ids in a tight loop must all differ.
*Lesson:* the fix for a silent-loss bug is itself a silent-loss risk. The batch
path exercised a latent flaw the one-at-a-time path never could.

**F-9 · FIXED · Browser eviction.**
`navigator.storage.persist()` is never called, so the origin is evictable under
pressure. This is the ordinary local-first risk and is exactly what Tier 2
backups exist for — but one line would reduce it.

---

## 9. Explicitly not doing

| Not doing | Condition that would change it |
|---|---|
| Moving the canonical store to SQLite, IndexedDB, or a server | The blob exceeds ~4 MB, **or** `JSON.stringify` on the save path exceeds ~50 ms measured on the owner's device. Both are ~4× today's ten-year projection |
| Splitting `JournalData` into per-collection keys or files | Never for the canonical store — it trades one atomic write for 28 torn ones |
| Normalising the schema in the app | The in-memory joins are all daily and all fast. Normalisation belongs in the derived SQLite, where it costs nothing |
| Delta / op-log sync | Whole-blob push is 2.35 MB at ten years. Revisit if the owner syncs over metered mobile data, or if the blob passes ~10 MB |
| Deleting any sync path | They work and they are cheap. Making them **mutually exclusive** solves F-7 without removing anyone's setup |
| Automatic scheduled export | A PWA cannot write to disk unattended without the folder permission, which needs a user gesture after every reload. The weekly nudge is the honest version. Revisit if the app is packaged with Tauri (`src-tauri/` exists), where a real scheduled file write is possible |
| Encrypting backups at rest by default | The passcode path (`bujo:enc`) already covers the device. An encrypted backup the owner cannot open in ten years is worse than a plaintext one they can. Revisit if backups leave the owner's control |
| Memoising Insights/Stats | Real, and worth a ticket, but it is a render bug and not a storage decision. Filed here so it is not silently left |
| Building the SQLite export before fixing F-1 → F-4 | A query surface over data that is quietly losing rows is a way to draw confident charts of the wrong numbers |
