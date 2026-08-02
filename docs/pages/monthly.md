# Monthly

`src/views/Monthly.tsx` · nav: Library → Monthly · `?view=monthly`

## What this page is

The month at a glance. A calendar grid where each day shows dots for events, a
ribbon for habit completion and a tint for mood; tap a day to open it. Below the
grid: this month's location, goals, and one photo. A collapsed analytics section
holds the month pulse and trailing-year rhythm.

## Measured (1440×900, demo data)

- **1.3 screens.** Grid is 669px of the 1,063px column.
- Four blocks: summary strip (33px) · calendar (669px) · Location/Goals/Photo
  row (211px) · Month analytics (32px, collapsed).
- **Only 3 elements on the whole page carry an `aria-label`.** The day cells are
  buttons without one.

## UX / IA

**P1 · The day cells are unlabelled buttons.** A screen reader hears "2" and
then nothing — the dots, the ribbon and the mood tint are all visual-only. This
is the deferred `AUD-5` item and it is the page's most concrete defect: the
calendar's entire information layer is inaccessible. Each cell wants a label
like "August 2 · 5 entries · 4 of 5 habits · mood 7".

**P2 · Nothing explains the marks.** A cell can carry coloured dots, a green
ribbon, a star and a background tint. The subtitle says "Events show as dots"
and stops. Four encodings, one explained. Either a legend or on-hover
explanation — a reader should not have to guess what a star means.

**P2 · Past, today and future look the same when empty.** An empty Tuesday in
the past means "nothing logged"; an empty Tuesday next week means "hasn't
happened". Both render as the same dark box, so a month in progress looks like a
month you failed to fill in.

**P3 · The grid's height is fixed regardless of content.** Every cell is ~100px
whether it holds five dots or nothing, so a sparse month is 669px of mostly
empty boxes. Sizing rows to their fullest cell, or a compact mode for sparse
months, would make the page feel considered rather than padded.

## UI

**P1 · The most interesting cell is the least visible.** August 2 (today) carries
five dots, a star and a full ribbon, and it is a 140×100px box among thirty
identical ones. The one day with a story looks like the twenty-nine without one,
except for a thin outline.

**P2 · The three bottom cards do not share a shape.** Location is one input,
Goals is a textarea, Photo is a button plus a caption field. Same card chrome,
three different internal rhythms, side by side. They are the "month header"
material of a paper bullet journal and would read better as one three-part band.

**P3 · The summary strip is the best thing on the page and is styled as the
smallest.** "8 entries · 1/5 tasks · 4 days · mood 6/10 · #travel 1" in 33px of
caption text above a 669px grid. It is the answer to "how was this month" and it
is set like a footnote.

## Copy

**P2 · "Events show as dots" undersells the page.** It is the page's subtitle in
the top bar, and it describes one of four encodings. "Your month at a glance"
with a real legend elsewhere would do more.

**P3 · "Photo of the month · One image"** — the subtitle restates the title in
different words. "The one shot that says August" would earn its line.

**P3 · "Goals · What matters this month"** is good. Keep.

## Upgrades, ranked

1. **P1 · Label the day cells** for screen readers, with entry count, habit
   completion and mood.
2. **P1 · Make today unmistakable** — not just an outline, but the one cell that
   is visibly the subject of the page.
3. **P2 · Add a legend** for dots, ribbon, star and tint, or reduce to fewer
   encodings and explain those.
4. **P2 · Dim future days** so an in-progress month does not read as failure.
5. **P2 · Promote the summary strip** to a real header — the numbers are the
   month's story.
6. **P3 · Unify the Location / Goals / Photo trio** into one band with a shared
   internal rhythm.
7. **P3 · Let sparse months collapse** rather than always rendering 669px.

## Leave alone

- **The month/year picker in the top bar.** `dateNav: 'month'` wiring is clean
  and the arrows-plus-label control is right.
- **The summary strip's content** — entries, tasks, active days, mood, top tag is
  exactly the right five numbers. Only its prominence is wrong.
- **Location / Goals / Photo as a concept.** These are the paper bullet journal's
  monthly spread and they give the page a personality the analytics cannot.
- **Month analytics collapsed by default.**
