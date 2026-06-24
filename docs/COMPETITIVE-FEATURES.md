# Competitive feature research & gap-fill

Tracking features mined from other habit/tracker apps, what bujo already has, and
what we add on top. **Additive only — we never remove existing features.**

## HabitKit (habitkit.app) — researched 2026-06-24

| HabitKit feature | bujo status |
|---|---|
| Grid/heatmap tile visualization | ✅ have (activity layout + per-habit detail heatmap) |
| Habit customization (name, description, icon, color) | ✅ have (emoji, color, category, type; `cue` ≈ description) |
| Single completion | ✅ |
| Multiple completions per day | ✅ (count/timer habits with targets) |
| Frequency-based streaks | ✅ (streaks, weekly goals, scheduled days) |
| Reminders / notifications | ✅ (daily reminder + habit-reminder `.ics`) |
| Home-screen widgets | ⊘ web app (native widgets need the Tauri/native shell) |
| Calendar view (tap a day to add/remove) | ✅ (tappable grid cells, Monthly) |
| Multi-theme + dark/light | ✅ (5 themes: mocha/vscode/neon/latte/dawn + system) |
| Archive | ✅ |
| Data import/export | ✅ (JSON/CSV/Markdown/ICS) |
| Privacy-first local storage | ✅ |
| Optional cloud backup | ✅ (passphrase E2E / Supabase / gist / Drive / self-host) |
| **Share habit grid as an image** | **➕ ADDED (BUJO-242)** — "Share" button in the per-habit detail renders the heatmap to a PNG (`canvas`) and downloads it |

**Net:** bujo already matched ~12/14 HabitKit features. Added the missing signature
**grid image share**. Home-screen widgets remain gated on the native shell.

### Candidate follow-ups (HabitKit-flavoured, not yet built)
- A dedicated **"grid cards" layout** (each habit a large colourful tile-grid card,
  HabitKit's signature look) as a 4th tracker layout option.
- Per-habit **description** field distinct from `cue`.
