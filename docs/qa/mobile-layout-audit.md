# Mobile layout audit — overflow & overlap

Date: 2026-06-16. Trigger: habit-tracker text overflowing the app width / sticky column overlapping the day cells on small screens.

## Fixed

### Trackers — habit-name column overflow + overlap (`src/views/Trackers.tsx`)
**Symptom:** in the month grid (`HabitGrid`), a long habit name in the sticky left column pushed the column wider than the viewport and, because the column is `sticky left-0 z-10`, its text floated over the day cells when scrolled — looked like overlapping text running out of the app frame.

**Cause:** the name `<td>` used `whitespace-nowrap` with **no width cap**, so the column grew to the longest name.

**Fix:** wrap the cell contents in a flex row capped at `max-w-[44vw] sm:max-w-[220px]`; the name `<button>` gets `min-w-0 truncate` (ellipsis + `title` tooltip), while drag handle / emoji / unit / streak / weekly badges are `shrink-0` so they stay visible. Column can no longer exceed the cap, so nothing overlaps the day grid.

## Checked — OK, no change

| Spot | Why it's fine |
|---|---|
| `Stats.tsx` year-in-pixels `min-w-[520px]` | Inside `overflow-x-auto` — intentional horizontal scroll. |
| `max-w-[1400px]` across views (Page, Insights, Plan, …) | Page-width cap with `mx-auto`; collapses fine below 1400px. |
| `whitespace-nowrap` in tabs / button / sidebar nav | Short, controlled labels; not user-length text. |
| `grid-cols-7` calendars (Monthly, Stats, Challenges) | 7 small cells fit ≥320px; intended week layout. |

## Pattern to watch (for future code)
A `sticky left-0` cell in a horizontally-scrolling table **must** have a width cap + truncation, or long content overlaps the scrolled columns. Apply `max-w-[Nvw] … truncate min-w-0` to the variable-length child and `shrink-0` to fixed badges.

## Backlog (not blocking)
- Visually confirm on a real device / headless mobile viewport once chrome-devtools MCP is reconnected (it was offline this pass; audit was code-level).
