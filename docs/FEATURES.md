# Feature reference

Every feature, where it lives, and how it works. Keep this in sync when adding
features (see `docs/prompts/01-add-feature.md`).

## Bullet legend

| Glyph | Meaning |
|---|---|
| `·` | Task (open) |
| `✕` | Task complete |
| `>` | Task migrated to next month |
| `<` | Task scheduled into the future log |
| `○` | Event |
| `–` | Note |
| `▲` | Memory |
| `!` | Important |
| `~` | Dropped (struck through) |

Click a task's glyph to cycle `open → done → migrated → dropped`.

## Quick-capture grammar

`t` task · `e` event · `n` note · `*`/`!` important · `^` memory · `#tag`.
Signifiers stack: `* t book the campsite #travel`.

## Views

| View | File | Purpose |
|---|---|---|
| Today | `views/Today.tsx` | Daily log, mood/stress/sleep, fast-break, gratitude, daily memory + photo, on-this-day. |
| Monthly | `views/Monthly.tsx` | Calendar with event dots, location, goals, photo of the month. |
| Trackers | `views/Trackers.tsx` | Habit dot-grid (drag-reorder, rename/remove, 30-day %), today focus strip, presets, emoji + weekly-goal, detail drawer (streak/30-90%/best weekday/skip-day), mood·stress·sleep chart + category radar, and a **visualizations row**: 13-week completion heatmap, streak leaderboard, weekday consistency, monthly trend. |
| Fitness | `views/Fitness.tsx` | Cardio/general workout log + edit + repeat-last (form **and** history on the right rail), weekly active-minutes goal ring, 8-week trend, active-day streak, **compact 6-tile at-a-glance metrics** (totals + bests, no scroll), auto-pace, and a **nutrition diary** with an American+Indian **food picker** that auto-sums macros (`lib/foods.ts`) plus a sample-day fill. |
| Gym | `views/Gym.tsx` | Dashboard with the anatomy lookup pinned to the **right rail**. **Quick exercise picker** (searchable). PPL split + next-day suggestion, routines, **structured `setRows`** with **previous-session + live-1RM hints**, **training-volume + per-exercise progression charts**, PRs + 1RM, rest timer, **plate calculator (unit-aware kg/lb)**, body weight, muscle map with **per-exercise form-cue + injury-watch guidance** (`lib/exerciseInfo.ts`), wger DB, the **12-week hypertrophy program tracker** (`ProgramTracker only="hyper12"`), and **progress photos** (dated upload, gallery, first-vs-latest compare). Units honour the kg/lb toggle. |
| Pull-ups | `views/Pullups.tsx` | Dedicated pull-up hub: the **"Starting From Zero" program tracker** (day-by-day check-off, load-into-session), an **ability/training-set calculator** (max → set, ladder & pyramid), the **ability ladder**, a **workout-format library** (Ladders, Pyramids, EMOMs, Elevators…), and **progression exercises** with why/how form cues. Data in `lib/programs.ts`. |
| Challenges | `views/Challenges.tsx` | Fixed-length discipline challenges — 75 Hard/Soft, 90-day, 30-day, custom; daily rule check-in, progress ring + week-grouped calendar, current streak, strict reset (miss → Day 1), whole-number progress. |
| Focus | `views/Focus.tsx` | Developer work tracker — log coding sessions (time/project/focus/stress/interruptions/tags), weekly hours + streak, 14-day minutes chart, language bars, focus↔stress insight. |
| Stats | `views/Stats.tsx` | Activity heatmap, weekly radar, sleep↔mood scatter, workout bars, task donut, mood calendar, tag cloud. |
| Plan | `views/Plan.tsx` | Recurring tasks, overdue-task migration flow, .ics calendar import. |
| Collections | `views/Collections.tsx` | Future log, birthdays, **Friends/contacts** (manual cards + opt-in GitHub public-profile enrich), and custom free-form collection pages. |
| Goals | `views/Goals.tsx` | **Cross-view roll-up** of every active target — per-habit weekly goals, fitness active-minutes, challenges, training-program days, abstinence streak — as whole-number progress bars; tap a row to jump to its home view. |
| Insights | `views/Insights.tsx` | Streaks, completion %, correlation insights, year-in-review, index, search. |
| Cycle | `views/Cycle.tsx` | *(opt-in)* Neutral temperature/cycle chart + flags. |
| Streak/NoFap | `views/NoFap.tsx` | *(opt-in)* Abstinence streak, milestones, relapse log. |
| Help | `views/Help.tsx` | In-app guide to every feature. |
| Settings | `views/Settings.tsx` | Theme, profile/gender, units, export/import. |

## App shell

- **Auto-hide sidebar** — ⋯ menu → *Auto-hide sidebar* slides the nav off-screen
  for max screen; hover the left edge to reveal it. (Or *Collapse* for an icon rail.)
- **Recommendations** live as a **lightbulb + count badge** in the top bar (no
  wasted vertical space); the dropdown lists suggestions with one-tap nav.
- **Sticky top bar** — current view title + subtitle, a contextual date-nav
  (Today/Monthly/Trackers/Cycle), a global **Quick add**, the **⌘K** trigger,
  and an overflow menu (theme · zoom · undo/redo · paper · handwriting · book).
  Replaces the old floating undo/redo + zoom clusters.
- **Unified layout** — every view opts into the `Page` grid (`main` + a wrapping
  `aside`) or a shared max-width, so there are no dead voids and lines stay
  readable. Controls follow one rule: `Switch` for on/off, `Segmented` for enums.
- See `docs/redesign/*.mdx` for the full redesign rationale.

## Smart capture (v3)

- **Completion** — the quick-add field suggests `#tags`, recent entries, and the
  bullet grammar as you type (↑/↓ move · Tab accept · ↵ add). A **live preview**
  shows what will be created (e.g. `* e dentist #health` → an *event*, *important*,
  tagged *health*).
- **Duplicate detection** — a small circular badge appears at the field's
  top-right when you're about to log something you already have (same-day entries,
  or an existing habit); its popover offers *Go to · Add anyway*.
- **Recommendations** — dismissible "smart default" chips above the page suggest
  backups, reminders, weekly goals, or turning a streak into a challenge.

## Motivation & capture

- **Training penalties** (`lib/penalties.ts`, `PenaltyCard`) — skip a habit streak,
  an overdue task, or a challenge day and Today surfaces an **anime-style penalty**
  scaled to the slip (light → legendary, from a 300-drill catalogue). Re-roll or
  dismiss for the day.
- **Voice input** (`lib/speech.ts`, `MicButton`) — dictate entry text via the Web
  Speech API; a mic button on quick-add appends each phrase. No-ops where unsupported.
- **Accent colour** — Settings → Journal feel; overrides `--primary` app-wide.
- **Progress photos** — physique tracking with a first-vs-latest compare (Gym).
- **Mobile** — a thumb-friendly **bottom tab bar** + quick-add FAB on phones
  (`shell/BottomNav.tsx`); the app shell already stacks responsively.
- **Motion** — staggered card entrance + subtle 3D hover-lift / press-dip, all
  gated behind `prefers-reduced-motion` (`.page-enter`, `index.css`).
- **Friends enrichment** — opt-in only: type a GitHub username to pull that
  person's **public** profile via the official API (`lib/enrich.ts`). No scraping,
  no people-search, no third-party calls.

## Power tools

- **Command palette** — `⌘K` / `Ctrl-K` opens a fuzzy launcher to jump to any
  view or run actions (toggle theme/paper/handwriting, export JSON, load demo).
- **Open-book frame** — Settings → Journal feel renders content inside a bound
  notebook (center spine + stacked page edges); toggle off for a flat layout.
- **Demo data** — Settings → Load demo data, or visit with `?demo=1`, seeds ~30
  days of correlated sample entries, habits, moods, workouts and memories.

## Power tools (continued)

- **Command palette** (`⌘K`), **open-book** frame, **zoom** + **hover-zoom**,
  **demo data** + `?demo=1` / `?view=` deep links.
- **Pipeline nav**: sidebar grouped Journal → Health → Review → System.
- **Global units**: kg/lb, km/mi, °F/°C, week start (Sun/Mon) — Settings.
- **Carry-forward** yesterday's tasks (Today); **per-habit streaks** (Trackers);
  **urge-surfing** counter (Streak).

## Data & privacy

- **Passcode lock + client-side encryption** (Settings → Data & Cloud) — encrypts
  the journal at rest with AES-GCM (PBKDF2 from your passcode, Web Crypto). A lock
  screen gates the app; the passcode never leaves the device (no recovery — keep a
  JSON export). Off by default.
- Stored only in `localStorage` (`bujo:data`, or `bujo:enc` when encrypted). No
  network, no accounts (core).
- Export JSON (full backup) or Markdown (portable). Import restores a backup.
- **Optional Google Drive sync** (Settings → Cloud sync): store the journal in
  Drive's appDataFolder + reference Drive images/docs. Opt-in, needs your own
  Google OAuth Client ID — see `GOOGLE_DRIVE.md`.
- Uploaded images are downscaled to ≤1024px JPEG before storage.
- Cycle and NoFap tools are off by default; enable in Settings (auto-suggested
  by the profile/gender field).

## Compacting & mobile (appended)

- **Collapsible cards** — the shared `Card` supports `collapsible`/`defaultCollapsed`
  (header chevron). Default-collapsed: Training penalty, Gym "Today's session"
  (phones), Stickers, On-this-day, Exercise database; the Completion heatmap is
  collapsible. Keeps the primary action above the fold on phones.
- **Today's plan** (`TodayPlanCard`) — one daily command-centre on Today: habits
  left · workout status · tasks due · pull-up day, plus a 7-day coverage strip;
  summary-and-link (no duplicate UIs). Replaced the separate coverage card.
- **Penalty difficulty** — Settings → Journal feel sets Beginner (default) /
  Intermediate / Hard; drills scale to a doable level.
- **5-tab bottom nav** (phones) — Today · Trackers · Fitness · Plan · Pull-ups,
  no FAB (quick-add lives in the top bar). Top bar hides keyboard-only ⌘K + the
  theme toggle on phones to avoid overflow. iOS-style slide-in nav drawer.
- **Entry-first on phones** — `Page asideFirst` puts the log forms (Fitness,
  Focus) above the charts; charts sink to the bottom on mobile.
- **Plan migration** — top 5 overdue by default with Show all / Show less.
- **Contextual help** — a `?` per view shows that page's blurb (from the view
  registry) with a link to the full guide.

## Tooling (appended)

- **graphify** (`@sentropic/graphify`, per-project devDependency + `.claude`
  skill/hooks) — turns the codebase into a queryable knowledge graph ("memory"
  for AI assistants). Generated `.graphify/` state is gitignored.

## Pickleball & more (appended)

- **Pickleball** (`views/Pickleball.tsx`, `lib/pickleball.ts`) — log sessions
  (singles/doubles, games won/lost, duration, RPE, partner). Record: sessions,
  games, win %, day streak; win-rate trend, win/loss donut, games-per-week; a
  collapsible **physio/trainer play-safe** card (ankle/shoulder/elbow/Achilles
  injury prevention). Stored in `JournalData.pickleball`.
- **Today's habits** (`TodayHabits`) — tick today's scheduled check-habits from
  Today as chips, no need to open Trackers (same store; collapsible).
- **System theme** — Theme menu adds *System*, following the OS light/dark
  preference live (mocha ↔ latte).

## Data model note

Everything is **one source of truth**: the single `JournalData` object in
localStorage (`bujo:data`, or encrypted `bujo:enc`). Every feature — including
Pickleball, Friends, progress photos — is a field on that object, so cloud sync
(own folder / Drive / gist) and JSON export carry all of it automatically; there
is no second database to keep in step.
