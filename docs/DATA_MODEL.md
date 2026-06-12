# Data model & storage

bujo is **local-first**: there is no server and no database. The entire journal
is one JSON object (`JournalData`) kept in the browser's `localStorage`. This doc
is the source-of-truth map of that model and how it's persisted, hosted, and
synced. The authoritative types live in [`src/lib/types.ts`](../src/lib/types.ts).

## Where data lives

| Key | Contents | Written by |
|---|---|---|
| `bujo:data` | The full `JournalData` JSON (plaintext) | `lib/storage.ts` `save()` |
| `bujo:enc` | AES-GCM blob of the same JSON, when a passcode is set | `lib/crypto.ts` + `storage.ts` |
| `bujo:notified:<date>` | One-shot flag: OS reminder already fired today | `ReminderBanner` |
| `bujo:penalty-dismissed:<date>` | One-shot flag: today's penalty dismissed | `PenaltyCard` |

When a passcode is set, `bujo:data` is **removed** and only the encrypted
`bujo:enc` remains; unlock decrypts it into memory (see `DECISIONS.md` D-30).

## `JournalData` (the root object)

One object, versioned by `SCHEMA_VERSION`, migrated forward on load by
`storage.ts` `migrate()`.

| Field | Type | What it holds |
|---|---|---|
| `version` | `number` | Schema version for migrations |
| `entries` | `Entry[]` | Rapid-log bullets (task/event/note) |
| `habits` | `Habit[]` | Tracked habits (check or count) |
| `habitLog` | `Record<day, habitId[]>` | Which check-habits were done each day |
| `habitValues` | `Record<day, Record<habitId, number>>` | Count-habit values per day |
| `habitSkips` | `Record<habitId, day[]>` | Planned skip days (don't break streak) |
| `metrics` | `DailyMetric[]` | Mood/stress/sleep/nutrition per day |
| `workouts` | `Workout[]` | Cardio + strength sessions (`setRows`) |
| `routines` | `Routine[]` | Saved reusable workout routines |
| `bodyMetrics` | `BodyMetric[]` | Weight + measurements over time |
| `progressPhotos` | `ProgressPhoto[]` | Physique photos (downscaled data-URLs) |
| `friends` | `Friend[]` | Contacts (manual + opt-in GitHub public-profile fields) |
| `cycle` | `CyclePoint[]` | Opt-in cycle/temperature points |
| `gratitude` | `Gratitude[]` | One gratitude line per day |
| `memories` | `Memory[]` | One daily memory (+ optional photo) |
| `birthdays` | `Birthday[]` | Recurring birthdays |
| `monthly` | `MonthlyMeta[]` | Per-month location/goals/photo |
| `collections` | `Collection[]` | Custom free-form list pages |
| `recurrences` | `Recurrence[]` | Rules that auto-materialise entries |
| `stickers` | `Record<day, string[]>` | Per-day emoji decorations |
| `nofap` | `Streak` | Opt-in abstinence streak |
| `challenges` / `challengeLog` | `Challenge[]` / nested | 75-Hard-style challenges + daily check-ins |
| `devSessions` | `DevSession[]` | Developer focus/coding sessions |
| `settings` | `Settings` | Units, theme, accent, reminders, storage mode, … |

Images (memory photos, monthly photos, progress photos) are downscaled to a
≤1024px JPEG **data-URL** before storage (`lib/image.ts`) to keep `localStorage`
within budget.

## Built-in reference data (not user data)

Encoded as code, shipped with the app, never written to storage:

- `lib/programs.ts` — the pull-up novice program, the 12-week hypertrophy block,
  the pull-up workout-format library, progression exercises, ability table.
- `lib/penalties.ts` — the 300-entry penalty catalogue.
- `lib/foods.ts` — the American + Indian food macro database.
- `lib/exerciseInfo.ts` — per-exercise form cue + injury watch.

## Outbound network (all opt-in, no analytics)

The app makes **no** network calls by default. Opt-in calls, each user-triggered:

| Call | When | Endpoint |
|---|---|---|
| Weather | "Auto-log weather" on | open-meteo + browser geolocation |
| Cloud sync | a storage mode chosen | Google Drive / GitHub gist / local folder |
| Friend enrich | a GitHub username entered | `api.github.com/users/{u}` (public, official) |

No third-party trackers, ad networks, or people-search services are ever contacted.

## Persistence, export, sync

- **Save**: every state change writes `bujo:data` (or `bujo:enc`) synchronously.
- **Export / import**: `exportJSON` / `exportMarkdown` / `importJSON` in
  `storage.ts` (Settings → Data). JSON is the full, restorable backup.
- **Optional cloud** (opt-in, still client-side):
  - *Own folder* — File System Access API into a cloud-synced folder (`fscloud.ts`).
  - *Google Drive* — `appDataFolder` via the user's own OAuth client (`gdrive.ts`).
  - *GitHub gist* — a private gist holding `bujo.json` (`github.ts`).

## Hosting

Static-only. `vite build` emits `dist/`; any static host works because
`vite.config.ts` sets `base: './'` (relative asset paths) and routing is
query-param based (`?view=`), so no SPA rewrite rules are needed.

- **GitHub Pages** — `.github/workflows/deploy.yml` builds + publishes on push to
  `main`. Enable once under *Repo → Settings → Pages → Build and deployment:
  GitHub Actions*.
- **Vercel / Netlify / Cloudflare Pages** — point at the repo, build command
  `npm run build`, output `dist`. No env vars required.

Because there is no backend, hosting never sees user data — it only serves the
app shell. A true multi-device account/sync backend is intentionally out of
scope (see `TICKETS.md` R2-10); the at-rest encryption is the client half of it.
