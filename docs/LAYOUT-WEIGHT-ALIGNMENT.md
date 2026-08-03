# Weight and alignment — what sits where, and how loud

Companion to `ICON-BUTTON-SYSTEM.md`. That file decides what a control *looks*
like; this one decides **how much room it gets and which side it sits on**.

Two rules, applied to every card and component in the app.

## Rule 1 — every component carries a weight

| Weight | Means | Gets |
|---|---|---|
| **1 · Primary** | The reason you opened this screen | Full width, above the fold, at most one tonal button |
| **2 · Working** | What you came to *do* here — entering, checking, rating | The wide column, or two of three tracks |
| **3 · Quiet** | Reference, summaries, appendices — read occasionally, never urgent | The rail, one track, collapsed by default when long |

A screen with three weight-1 cards has no weight-1 card. If everything is
loud, the page is flat and the user has to read all of it to find the one thing
that matters.

## Rule 2 — left is identity, right is state

Inside any row, header or card: **left says what this is, right says how it is
doing or what you can do to it.**

| Side | Holds | Never holds |
|---|---|---|
| **Left** | Icon, title, label, the entity's name | Actions, counts, status |
| **Right** | State (count, percentage, pill, timestamp), then actions | The thing's name |

Consequences that are not obvious until you apply it:

- An icon sits **left of its label, never on both sides** of one control.
- Row controls (delete, mark-important, overflow) group into **one** cluster on
  the right, side by side — not scattered along the row.
- A count and an action can share the right side; the count comes first,
  because state is read and actions are aimed at.

## Applied — cards and components

Weight is what the component gets *on its own screen*; a weight-2 card in a rail
is still a weight-2 card, it is just in quieter company.

### Shell

| Component | Weight | Left | Right |
|---|---|---|---|
| `TopBar` | 1 | View title + date cursor | Quick add, palette, theme, account |
| `Sidebar` row | 2 | Icon (duotone when current) + label | Active rail |
| `BottomNav` | 2 | — | — (icon over label, centred by nature) |
| `CommandPalette` | 1 while open | Command label | Hint / group |

### Today

`TodayPlanCard` is the **only** full-width card. Coach and penalty were weight 1
too until the band they formed was measured at 917px on a 1600×1000 viewport —
see "What this changed already" below.

| Component | Weight | Left | Right |
|---|---|---|---|
| `TodayPlanCard` | 1 — **full width, alone** | Title + chips | Week % |
| Daily log `Card` | 2 — **two of three tracks, first** | Date + weather | Logged-today count |
| `EntryRow` | 2 | Glyph, memory mark, text | `!` and `×`, one cluster |
| `CoachCard` | 2 (under the log) | Tone icon + tip | Affordance sparkle |
| `PenaltyCard` | 2 (under the log, conditional) | Title + drill | Tier pill + collapse |
| `TodayHabits` / count habits | 2 (rail) | Habit name | Tally pill, then `Stepper` |
| Wellbeing | 2 (rail) | Slider labels | Value chips |
| `FastingCard` | 3 (rail) | State | Timer |
| Gratitude · Reflection · Memory | 3 | Field label | — |
| `WeeklyGoalRings` | 3 (rail, bottom) | — | — |
| On this day | 3 | Date | Text |

### Data views (Trackers, Stats, Fitness, Insights)

| Component | Weight | Left | Right |
|---|---|---|---|
| `Card` header | — | Title + `ⓘ` | `right` slot: range/segment, then enlarge |
| `ChartCard` | 2 | Title + subtitle | Range control |
| `StatTile` | 2 | — | — (value over label, centred) |
| `DayGrid` / heatmap | 2 | Weekday labels | Legend |
| `CollapsibleSection` header | 3 | Chevron + icon + title | "show" hint |
| `HabitDetail` header | 1 while open | Emoji + name | Share, Edit, Close |
| Analytics groups | 3 | — | — |

### Recurring pieces

| Component | Weight | Rule |
|---|---|---|
| `Pill` | 3 | Right side of a row, never left of a name |
| `Button` primary (tonal) | 1 | One per screen; bottom-right of its card or end of its row |
| `Button` secondary / ghost | 2–3 | Grouped right, in a single cluster |
| `Empty` | 2 | Centred — an empty state is the whole card |
| Icon-only buttons | 3 | Right cluster, `aria-label` + tooltip mandatory |

## What this changed already

- **`EntryRow`** — `!` used to sit *left* of the text, costing an indent on
  every row in the log so a mark could appear on the few that are important,
  and splitting the row's controls across both ends of the line. `!` and `×`
  are now one right-hand cluster; the text gets that width back.
- **Today** — was a single 820px stack, so the log sat below a screenful of
  cards on a wide display and every card had the same width whether it was the
  writing surface or a collapsed appendix. The first fix gave it a full-width
  weight-1 band (plan, coach, penalty) above a two-track log.
- **Today, again — the band was the same bug wearing a different hat.** Measured
  on 1600×1000: the band was **917px**, so the log still started below the fold,
  and the wide column ran 813px against the rail's 1568px — nearly half of it
  empty. Rule 1 says so out loud ("a screen with three weight-1 cards has no
  weight-1 card") and the page was violating it in writing. Now only the plan is
  full width; the log is the first thing in the wide column and coach and
  penalty sit beneath it, because guidance is not more urgent than the day it is
  about. Measured after: band **417px**, log top **442px**, columns **1313 vs
  1409**. Page height fell from 2546px to 1887px.
  - Wellbeing was tried in the reflect grid on the way and overshot the other
    way (1632 vs 862), so it stayed in the rail — its sliders are tapped and
    dragged, which is what the rail is for.
  - The rail's "Keep your streaks" card is gone: `TodayPlanCard` already stated
    the same fact in its at-risk banner, from a *private* filter that disagreed
    with the shared one. The banner now reads `atRiskHabits`, which is the wider
    and tested rule, and the card is deleted. One fact, one source, one place.
- **Stickers** ("Decorate the day") — removed outright, including the stored
  data (see `TASKS.md` §J7). It was a weight-3 card competing for the same
  vertical space as the day's writing surface.

## Still to apply

Stage 5 of the icon/button pass rolls this table across the remaining clusters —
shell, logging views, data views, reflective views, settings. Each view gets
checked against both rules, in all five themes.
