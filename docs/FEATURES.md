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
| Fitness | `views/Fitness.tsx` | Workout log + all-time totals + history. |
| Collections | `views/Collections.tsx` | Future log + birthdays. |
| Insights | `views/Insights.tsx` | Streaks, task completion %, full-text search. |
| Cycle | `views/Cycle.tsx` | *(opt-in)* Neutral temperature/cycle chart + flags. |
| Streak/NoFap | `views/NoFap.tsx` | *(opt-in)* Abstinence streak, milestones, relapse log. |
| Help | `views/Help.tsx` | In-app guide to every feature. |
| Settings | `views/Settings.tsx` | Theme, profile/gender, units, export/import. |

## Data & privacy

- Stored only in `localStorage` (`bujo:data`). No network, no accounts.
- Export JSON (full backup) or Markdown (portable). Import restores a backup.
- Uploaded images are downscaled to ≤1024px JPEG before storage.
- Cycle and NoFap tools are off by default; enable in Settings (auto-suggested
  by the profile/gender field).
