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

## Hosting on Vercel (single user)

`vercel.json` configures a static Vite deploy (build → `dist`, SPA rewrite, asset
caching). Two ways to ship:
- **Git integration** — import the repo at vercel.com; auto-deploys on push.
- **CLI** — `npx vercel` (preview) / `npx vercel --prod` (production).

**Where the data lives (single user):** the app is **local-first** — Vercel only
serves the static app shell; **your journal stays in *your* browser**
(localStorage + IndexedDB for photos). Vercel never sees your data. For
multi-device, turn on the built-in own-cloud sync (Drive / GitHub gist / folder)
in Settings → Data & Cloud. Zero backend, zero per-user cost, fully private.

**If you want the data stored server-side** (so it follows you without bringing a
cloud): add **Vercel Blob or KV** + one serverless function that saves/loads the
`JournalData` JSON behind a passphrase. That's a small backend (a Vercel Function
+ a token); optional, and it makes us a data processor — keep the at-rest
encryption (passcode) on if you go this way. Not needed for the local-first plan.

### Live deployment

Production: **https://bujo-journal.vercel.app** (Vercel, project `bujo`).
Deployment Protection is **off** so it's publicly reachable; privacy is handled
client-side (optional passcode + at-rest encryption).

**Sharing with others:** send the link. Local-first means every visitor gets
their own private journal in their own browser — no accounts, no shared data, no
backend. Each user enables their own cloud sync (Drive/gist/folder) for
multi-device, and exports JSON backups. A server-side multi-account system would
require a backend (Vercel Blob/KV + auth) and is out of the local-first scope.

### Cloud sync (Vercel Blob, E2E-encrypted) — WORKING

Settings → Data & Cloud → **Cloud sync**: enter one **passphrase**, then
**Push**/**Pull**. How it works (`api/sync.ts` + `lib/bujocloud.ts`):
- The journal is **encrypted in the browser** (PBKDF2→AES-GCM, `crypto.ts`) before
  upload — the server only ever stores **ciphertext**.
- The storage path is `sync/<sha256(passphrase)>.json` — a hash of the passphrase,
  never the key — so the path is unguessable and reveals nothing.
- Backed by a **public Vercel Blob store** + a serverless function (`/api/sync`,
  Node runtime). Free tier covers a personal user easily. No accounts.
- Same passphrase on another device → your data. **Lost passphrase = no recovery.**

Verified live: `POST /api/sync` → `{ok:true}`; `GET /api/sync?code=…` round-trips.
Note: the SPA rewrite in `vercel.json` excludes `/api/` so functions aren't
swallowed by the index.html fallback.

### Supabase accounts + per-user sync (LIVE)

A second, account-based sync alongside the passphrase one. Settings → Data &
Cloud → **Account**.
- **Guest (anonymous) auth** by default — "Continue as guest" → instant private
  account; data syncs to the user's own row.
- **Email sign-up/login**; a guest can **"Save to an account"** (account linking)
  to keep their data + gain recovery.
- Storage: one row per user in `public.journals` (`user_id` PK, `data` jsonb),
  **row-level security** scopes every read/write to `auth.uid()` (schema in
  `docs/supabase.sql`). Auto-sync: pull on load, push on change (`App.tsx`).
- Config: `lib/supabase.ts`; client is **null/disabled** unless
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set, so the local-first app
  is unaffected when unconfigured. Project: `ueahhgqxshfvkjgcwtnh` (anon key is
  public; the service token was used once for setup and revoked).

**Two sync options ship together:** Supabase accounts (login, recovery, guest)
*or* the Vercel-Blob passphrase E2E sync (no-account, max privacy). User picks.
