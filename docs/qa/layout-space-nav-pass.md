# Layout-space + nav-cleanup pass

Date: 2026-06-16. Goal: audit every left-nav view like a user — kill dead horizontal space on wide screens, use 2–3 columns where content suits, and cut nav duplication. Audit covered all 19 views.

## What was already fine (no change)
Most views already use space well: Today / Fitness / Pickleball / HomeWorkout / Focus use `<Page aside>` (2-col + rail); Plan / Collections / NoFap / Stats / Settings have their own responsive grids; Trackers is dense; Help is reference text (single-col on purpose); Cycle/Monthly are appropriately narrow.

## Changes

### Use the space
- **Goals** — the goals list was one narrow column on a 1400px page. Now a responsive grid: `sm:grid-cols-2 xl:grid-cols-3`. Progress cards fill the width.
- **Challenges** — active challenges stacked full-width. Now `lg:grid-cols-2` so two run side by side; the header/new-challenge card stays full-width above.
- **FitnessHub** — the tab wrapper had no width cap, so Cardio/Strength could sprawl. Wrapped in `mx-auto max-w-[1400px]`.

### Nav de-duplication (sidebar groups: Journal / Health / Review)
- **Duplicate `Target` icon** — Goals and Challenges both used it. Goals now uses `Flag`; Challenges keeps `Target`.
- **De-bloat Health (9 → 8)** — moved **Challenges** from Health to **Review**, next to Goals. Challenges are fixed-length discipline goals, so they belong with Goals/Insights/Stats, not the fitness domains. Groups are now better balanced and the goal-like views sit together.

## Deliberately not changed
- **Focus** stays in Health — it tracks wellbeing (stress/interruptions), so Health is defensible; moving it was judged churn for little gain.
- **Insights** — already half 2-col (Year-in-review + Index); Search and TagManager genuinely want full width. Left as-is.
- **Fitness vs Pull-ups vs Home Workout** — overlapping domains, but merging them into one nav entry would lose nuance and mean a routing rework. Kept separate (Stats already aggregates across them).

## Verify
- `tsc` clean · `eslint` clean · `npm run build` ✓
- Visual: interactive per-view screenshots need chrome-devtools MCP (offline this session); changes are pure responsive-grid/​nav-data edits.
