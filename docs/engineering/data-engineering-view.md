# 🧮 Data-engineering view

## The "warehouse" is one JSON document
There is no database in the default build. The entire dataset is a single
`JournalData` object (`src/lib/types.ts`) persisted as `localStorage['bujo:data']`
(or AES-GCM ciphertext in `bujo:enc`). Think of it as one denormalized document
store keyed by the user's browser.

### Top-level collections (the "tables")
| Collection | Grain | Key |
|---|---|---|
| `entries` | one bullet (task/event/note) | `id`, partitioned by `date` |
| `habits` + `habitLog` + `habitValues` + `habitNotes` + `habitTimes` | habit defs + per-day logs | `habitId` × ISO day |
| `metrics` | one wellbeing row per day | `date` (PK) |
| `workouts`, `bodyMetrics`, `progressPhotos`, `routines` | training | `id` / `date` |
| `pickleball`, `pickleballEvents`, `devSessions` | activity sessions/events | `id` |
| `books`, `readLinks` | reading | `id` |
| `challenges` + `challengeLog`, `nofap`, `cycle`, `fasts` | disciplines/health | `id` / `date` |
| `gratitude`, `memories`, `monthly`, `collections`, `friends`, `birthdays`, `stickers` | journal extras | `date` / `id` |
| `settings` | singleton config | — |

Maps keyed by ISO day (`habitLog`, `habitValues`, `stickers`, …) are the
time-series partitions; everything else is an entity array.

## Schema evolution
- `SCHEMA_VERSION` + **`migrate(raw)`** in `storage.ts`: forward-compatible by
  spread — any missing key is filled from `emptyJournal()`, so **adding an
  optional field/collection needs no migration code**. Old exports load cleanly.
- A relational mirror of the model exists for self-host:
  [`../data-engineering/schema.sql`](../data-engineering/schema.sql) and
  [`../supabase.sql`](../supabase.sql).

## Pipelines (ETL, all in-browser + pure)
- **Ingest:** capture bar → `parseQuickCapture` / smart `lib/capture.ts` →
  typed `Entry` / metric / workout. Optional enrichment: weather (open-meteo),
  GitHub profile, wger exercises.
- **Transform:** `lib/*` derivations are the "marts" — `buildHeatmap`,
  `weeklyRadar`, `sleepMoodScatter`, `winRateSeries`, `monthlyCompletion`,
  `personalRecords`, `correlations.pearson`. All pure, all unit-tested.
- **Serve:** views read the marts; charts render them.
- **Sync (replication):** debounced pull-before-push with adopt-newer-`updatedAt`
  conflict resolution across devices (see [backend-view.md](backend-view.md)).

## Export / import (portability)
- **JSON** — full fidelity round-trip (`exportJSON` / `importJSON` → `migrate`).
- **Markdown** — Obsidian/Logseq-friendly (`exportMarkdown`).
- **CSV** — tabular extracts (`lib/csv.ts`).
- **ICS** — calendar in/out (`lib/ics.ts`).
- **PDF / print** — from Settings.

## Data quality & governance
- TypeScript types are the schema contract; `migrate` guarantees shape.
- `updatedAt` is the watermark for sync ordering.
- Storage-quota failures surfaced via the backup nudge; passcode encryption for
  at-rest privacy. No PII leaves the device without opt-in.
