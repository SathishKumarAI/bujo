# `components/trackers`

The habit tracker, as UI. Every pure question about a habit — is it done, what
is its streak, how consistent is it, what may its row say — lives in
`src/lib/`; nothing here re-derives one.

`src/views/Trackers.tsx` is the page: it owns the zones, the layout switcher,
the month/week/day range and the two overlay slots, and delegates everything
that draws a habit to this directory.

## Change → file

| Change | File |
|---|---|
| The zones, the layout switcher, the range control, "add a habit" | `src/views/Trackers.tsx` |
| Zone 2's tap-to-mark chip strip | `TodayStrip.tsx` |
| The month grid: a category's rows, cells, drag-reorder, the chips beside a name | `CategoryRows.tsx` |
| **Whether** a chip appears and **which** — never how it looks | `src/lib/habitRowChips.ts` |
| The by-time-of-day list | `RoutineTimeline.tsx` |
| The read-first panel opened by tapping a habit | `HabitDetail.tsx` |
| Every per-habit setting, and the modal's own stats | `HabitEditor.tsx` |
| The folded deep-analytics group (heatmap, leaderboard, monthly, weekday, perfect days) | `TrackerVisuals.tsx` |
| The mood/stress/sleep lines | `MetricsTrendCard.tsx` |
| The per-category radar | `CategoryConsistencyCard.tsx` |
| Streaks, consistency, grades, comebacks | `src/lib/stats.ts`, `habitStats.ts`, `streak.ts` |
| The category list and its order | `HABIT_CATEGORIES` in `src/lib/types.ts` |

The other two layouts the switcher offers are not in here:
`components/ActivityLayout.tsx` and `components/GridCardsLayout.tsx`, plus
`components/RadialTracker.tsx` for the wheel.

## Why the split

`views/Trackers.tsx` was 1,048 lines — twice the ceiling in the root
`CLAUDE.md` — because four self-contained components had accumulated below the
view that used them. Moving them out left the view at 425 and cost nothing:
the extraction was done by line range rather than by retyping, and the rendered
markup of all seventeen states was compared byte-for-byte before and after.

Do it that way if you move any of this again. The failure mode is not a crash;
it is `views/Pullups.tsx`, which retyped `lib/pullups.ts` inline and silently
dropped eleven of fourteen workout formats with `tsc`, eslint, vitest and the
build all clean (see the trap in the root `CLAUDE.md`).

## Traps

- **Two components put a name beside a habit, and only one is a heading.**
  `CategoryRows`' name cell is a `<button>` whose accessible name is
  `"<habit> — activity & stats"`; a sweep reading `textContent` sees only the
  habit name. Read the accessible name.
- **The row's chip budget is two, and it is enforced in `lib/habitRowChips.ts`,
  not here.** This directory chooses icons and colours for a chip; it never
  decides whether one appears. The cap exists because six chips accreted one
  commit at a time, three of them printing the same number.
- **`TrackerVisuals` renders inside a fold that is closed by default.** That
  used to put it outside `npm run a11y` entirely; since COD-93 the gate opens
  every fold in `#main` before scanning, so it is covered. The manual
  workaround this bullet used to prescribe
  (`localStorage['bujo.ui.section.trackers.deepAnalytics'] = '1'`) is no longer
  needed, and a manual workaround was never run anyway.
- **A period with nothing scheduled is `null`, not `0`.** `monthlyCompletion`
  and `weekdayConsistency` both return it, and the charts here must not draw a
  bar for it — a month before the first habit's `startedOn` is unknown, not a
  failure.
- **Grids need `gridAutoColumns` as well as `gridTemplateRows`.** Without it the
  implicit columns stretch to fill the card, and the completion heatmap drew
  10px cells in 81px tracks.
- **`HabitEditor` and `HabitDetail` are two different panels.** Tapping a habit
  opens `HabitDetail` (read-first: heatmap, strength meter, the numbers); its
  "Edit" button hands off to `HabitEditor` (settings, plus its own stats). Both
  are overlays rendered as siblings of the zones, so neither is inside the
  sticky measurement or the zone grid.
