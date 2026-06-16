# Habit polarity + tracker fixes

Date: 2026-06-16.

## Good vs avoid habits

A habit now has a polarity. Default is a **build** habit (do it more: meditate, water). Marking `avoid` makes it a **quit** habit (alcohol, smoking, sugar, doomscroll) where the meaning inverts:

| | build habit | avoid habit |
|---|---|---|
| Logging a day means | a win ✓ | a **slip** (you did the thing) |
| Success is | doing it | staying **clean** |
| Streak | consecutive done days (🔥 Flame) | consecutive **clean** days (🛡 `Nd clean`) — `cleanStreak()` |
| Color | the habit's color | **red** |
| Marker | emoji / colored dot | 🚫 Ban icon |

Data model: `Habit.avoid?: boolean` (optional, additive — existing habits are unaffected). The underlying log is unchanged (a logged day = the habit happened); only the interpretation/visuals invert.

**Where it shows** (all habit surfaces): the classic grid (red slip cells + clean-streak), the activity/cube view, the Trackers today-strip, and the Today-page `TodayHabits` card (avoid chips show 🚫 + slip/clean and are excluded from the build "Mark all" / done count). Toggle it per habit in the edit dialog ("Habit to avoid"). Presets added: Alcohol-free, Smoke-free, No-doomscroll, No-sugar.

## Fixes shipped alongside

- **Activity/"cube" view was read-only for check habits.** Heatmap days were `<span>`s, so you could only toggle *today* via the side control — the cube looked dead for check habits. Cells are now buttons: check → toggle, count/timer → cycle value, rating stays display-only. Matches the classic grid.
- **No duplicate trackers.** Manual add and preset taps now refuse a habit name that already exists (case-insensitive); already-added presets render disabled.
- **`cleanStreak` loop guard.** Capped the back-walk so an avoid habit with no start date and an all-clean history can't loop forever. Unit-tested.

## Not done / open questions
- **"Same-unit tracker"** (raised in passing): unclear whether the ask is to group/compare trackers that share a unit (e.g. all `min` habits) or to enforce a unit when adding. Left for clarification — no change made.
- Visual device pass with chrome-devtools MCP still pending — the server was offline this session (needs Chrome started on the debug port + an `/mcp` reconnect).
