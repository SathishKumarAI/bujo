# Stats

`src/views/Stats.tsx` · nav: Review → Stats · `?view=stats`

## What this page is

The analytics wall: activity heatmap, weekly averages, sleep↔mood scatter,
workout bars, task donut, mood calendar, year-in-pixels, habit timing — plus an
achievements board.

Its subtitle in the top bar is **"Charts at a glance"**.

## Measured (1440×900, demo data) — **2026-08-02, superseded**

**This block is a snapshot of the page before the 2026-08-24 rewrites. It is
kept because the reasoning below it was built on it; for what the page does now,
read the re-measured table under "Upgrades, ranked".**

- **1.3 screens.**
- **Zero chart elements rendered by default.** Every Recharts surface on the
  page is inside a collapsed section; the only data graphic on first paint is
  the activity heatmap, which is hand-built DOM.
- Six collapsed drawers: This week · Sleep & mood · Mood views · Fitness stats ·
  Tasks · Habit timing.
- Above them: Activity heatmap and Achievements, together 1,086px.

## The finding that matters

**P1 · A page called "Charts at a glance" shows no charts at a glance.** Six
drawers, all shut. The user must open one to see a single chart. The page's own
promise is broken by its default state, and unlike Pickleball — where collapsing
the analytics at least left the logging tools visible — here the analytics *are*
the page.

**P2 · Achievements outrank the statistics.** Fourteen achievement cards
("Centurion · Log 100 entries", "16:8 · Complete a 16-hour fast") sit above all
six analytics drawers. A gamification layer is the second thing on a page whose
job is analysis, and it is open while every chart is closed.

## UX / IA

**P2 · Six drawers, six unpredictable names.** "This week", "Mood views",
"Habit timing", "Tasks" — reasonable individually, but a user looking for "is my
sleep affecting my mood" has to guess between "This week" and "Sleep & mood",
and one for "where your tasks land" is a riddle.

**P2 · Two subtitles admit the page is a duplicate.** "This week · 7-day
averages, **see Trackers for live metrics**" and "Fitness stats · workout minutes
& split, **see Fitness for live logging**". The page itself says the real
versions live elsewhere. That is honest, and it is also an argument that these
sections should be links rather than copies.

**P3 · Overlap with Insights is substantial.** Both hold mood analytics, habit
analytics, task analysis and lifetime totals behind collapsed drawers. Two
"review" pages with two drawer stacks covering much the same ground.

## UI

**P2 · The heatmap is the page's best asset and carries no legend beyond
`less → more`.** Range switches (3mo / 6mo / 1yr) are right there and good; the
colour scale is unexplained beyond two words.

**P3 · Achievement cards mix locked and unlocked in one grid** with the state
carried by styling alone. "8 of 14 unlocked" is stated once at the top; per-card
state is a visual difference a reader has to infer.

## Copy

**"Every day you showed up"** as the heatmap subtitle — the best line on the
page. It reframes a contribution graph as something kinder than a productivity
score.

**P3 · Achievement names are strong** ("Unbroken", "No excuses", "Self-aware")
and their descriptions are plain ("30-day journaling streak"). The pairing
works.

## Upgrades, ranked

**Re-measured 2026-08-27, and four of the six had moved.** Everything above this
line was audited on 2026-08-02; `Stats.tsx` was then rewritten twice on
**2026-08-24** (`f4a9336` onto the three-zone contract, `733df32` moving nine
Insights panels in), so the audit was three weeks behind the page it described
and the top item was no longer true. The numbers below come from the rendered
page at 1440×900 with demo data, not from reading the source.

| # | Was | Now |
|---|---|---|
| 1 | **P1 · "Zero chart elements rendered by default"** — six drawers, all shut | **Already closed by the 2026-08-24 rewrite.** All six folds report `aria-expanded="true"` and **six Recharts surfaces** are in the DOM on first paint. `CollapsibleSection`'s `defaultOpen` is `true` and no call site on this page overrides it — the audit's claim had simply expired |
| 2 | **P2 · Achievements outrank the statistics** | **Closed.** It is last, and spans the row. The fourteen badges were the second block, so the first chart began at **y=1386**; it now begins at **y=814** and Achievements sits at **y=4096** |
| 3 | P2 · the two "see X for live metrics" sections should be links | **Still open.** Both subtitles still say it |
| 4 | P2 · decide the Stats/Insights split | **Partly done** by `733df32`, which moved the nine analytics panels here. Not stated anywhere yet |
| 5 | **P3 · Give the heatmap a real scale legend** | **Already closed.** The card renders a `less → more` scale. The audit's own UI note said so; the upgrade list contradicted it |
| 6 | **P3 · Make achievement lock state explicit** | **Closed.** It was worse than "styling-only": the padlock *was* drawn, but as an unnamed `<svg>`, so a screen reader was given `opacity-50` and a tint and nothing else. Measured before: **0 of 14** badges named their state. After: **14 of 14**, via `role="img"` + `aria-label` on the glyph cell, and the grid is a real `<ul>`. `AchievementsCard.test.tsx` counts both, because an assertion that "a Locked label exists" would still pass if thirteen lost theirs |

**The lesson is about the audit, not the page.** Two of six items were fixed by
work that never came back to update this file, and one of those two — the P1 —
was the headline finding quoted in `docs/pages/README.md`'s cross-page patterns
list. A ranked upgrade list is a claim about the present tense; re-measure
before building from it.

## Leave alone

- **The heatmap and its range switch.**
- **"Every day you showed up".**
- **The achievement set itself** — well chosen, spans every domain of the app,
  and the names have personality.
