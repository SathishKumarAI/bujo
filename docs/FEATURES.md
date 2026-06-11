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
| Trackers | `views/Trackers.tsx` | Habit dot-grid (rename/remove, 30-day %), mood·stress·sleep chart. |
| Fitness | `views/Fitness.tsx` | Cardio/general workout log + totals + history + nutrition macro diary (km/mi unit). |
| Gym | `views/Gym.tsx` | PPL split + next-day suggestion, routines, structured sets, PRs + 1RM, rest timer, body weight, muscle map, wger exercise DB + detail, single-exercise anatomy (kg/lb unit). |
| Stats | `views/Stats.tsx` | Activity heatmap, weekly radar, sleep↔mood scatter, workout bars, task donut, mood calendar, tag cloud. |
| Plan | `views/Plan.tsx` | Recurring tasks, overdue-task migration flow, .ics calendar import. |
| Collections | `views/Collections.tsx` | Future log + birthdays + custom free-form collection pages. |
| Insights | `views/Insights.tsx` | Streaks, completion %, correlation insights, year-in-review, index, search. |
| Cycle | `views/Cycle.tsx` | *(opt-in)* Neutral temperature/cycle chart + flags. |
| Streak/NoFap | `views/NoFap.tsx` | *(opt-in)* Abstinence streak, milestones, relapse log. |
| Help | `views/Help.tsx` | In-app guide to every feature. |
| Settings | `views/Settings.tsx` | Theme, profile/gender, units, export/import. |

## App shell

- **Sticky top bar** — current view title + subtitle, a contextual date-nav
  (Today/Monthly/Trackers/Cycle), a global **Quick add**, the **⌘K** trigger,
  and an overflow menu (theme · zoom · undo/redo · paper · handwriting · book).
  Replaces the old floating undo/redo + zoom clusters.
- **Unified layout** — every view opts into the `Page` grid (`main` + a wrapping
  `aside`) or a shared max-width, so there are no dead voids and lines stay
  readable. Controls follow one rule: `Switch` for on/off, `Segmented` for enums.
- See `docs/redesign/*.mdx` for the full redesign rationale.

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

- Stored only in `localStorage` (`bujo:data`). No network, no accounts (core).
- Export JSON (full backup) or Markdown (portable). Import restores a backup.
- **Optional Google Drive sync** (Settings → Cloud sync): store the journal in
  Drive's appDataFolder + reference Drive images/docs. Opt-in, needs your own
  Google OAuth Client ID — see `GOOGLE_DRIVE.md`.
- Uploaded images are downscaled to ≤1024px JPEG before storage.
- Cycle and NoFap tools are off by default; enable in Settings (auto-suggested
  by the profile/gender field).
