# Stats

`src/views/Stats.tsx` · nav: Review → Stats · `?view=stats`

## What this page is

The analytics wall: activity heatmap, weekly averages, sleep↔mood scatter,
workout bars, task donut, mood calendar, year-in-pixels, habit timing — plus an
achievements board.

Its subtitle in the top bar is **"Charts at a glance"**.

## Measured (1440×900, demo data)

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

1. **P1 · Open two or three charts by default** — or change the subtitle. A page
   promising charts at a glance must show one.
2. **P2 · Move Achievements below the analytics**, or onto its own surface.
3. **P2 · Turn the two "see X for live metrics" sections into links** instead of
   maintaining duplicate views.
4. **P2 · Decide the Stats/Insights split** and state it: one for *charts*, one
   for *reflection*, with no overlapping drawers.
5. **P3 · Give the heatmap a real scale legend.**
6. **P3 · Make achievement lock state explicit**, not styling-only.

## Leave alone

- **The heatmap and its range switch.**
- **"Every day you showed up".**
- **The achievement set itself** — well chosen, spans every domain of the app,
  and the names have personality.
