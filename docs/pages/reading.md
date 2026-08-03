# Reading

`src/views/Reading.tsx` · nav: Library → Reading · `?view=reading`

## What this page is

Three shelves — want to read, reading now, finished — with a yearly book goal,
per-book progress and ratings, cross-book learnings, and analytics.

The tightest page in the app: **0.9 screens**, seven blocks, three of them
collapsed. It is what the other pages should measure themselves against.

## Measured (1440×900, demo data)

| Block | Height | State |
|---|---|---|
| Stat strip (6 tiles) | 74px | open |
| Yearly reading goal | 106px | open |
| Add to shelf | 67px | open |
| Three shelves | 222px | open |
| Learnings | 32px | collapsed |
| Reading analytics | 32px | collapsed |
| Read later | 32px | collapsed |

## What works — and why

**The pacing line.** `1 of 12 finished this year` · **`On pace for 2 · behind
goal`**. A goal, a projection, and a verdict in eleven words. No other page in
the app closes the loop from *what you did* to *where that lands you*.

**The per-book projection.** `41% · At this pace, done by Tue, Aug 11 · ~9d
left`. Same idea at book scale, and it makes progress feel like something with a
finish date rather than a percentage.

**Three shelves side by side.** The whole library state in 222px. Compare
Mindset's 1,575px wall.

## UX / IA

**P2 · Six stat tiles, two of which are noise at this data volume.**
`5.0★ Avg rating` from a single rated book, and `— Reading streak` with no
value. A tile showing an em-dash is a tile spending 90px to say nothing.

**P3 · Book actions are three text buttons per card** (`→ Reading`,
`→ Finished`, `Notes`). Fine for three books; at thirty the shelf becomes a
wall of controls. A single "move" affordance would scale.

**P3 · "Add to shelf" always adds to *Want to read*** — reasonable default, but
nothing says so, and adding a book you are already reading is the common case
when you first set the app up.

## UI

**P2 · The stat strip is the smallest text on a page whose numbers are its
point.** Six values at 74px total, above a goal card that repeats one of them.

**P3 · The three shelves have no visual distinction beyond their titles.**
Finished and Want to read look identical; a subtle differentiation (weight,
tint, opacity) would let the eye find "what am I reading" instantly — the one
question this page is opened to answer.

## Copy

**P2 · "Nothing here yet."** is the app's weakest empty state, and it appears on
a shelf. Compare Collections' "Inbox zero. Nothing dateless waiting to be
sorted. ✨". "No books waiting — add one above" would match the house standard.

**P3 · "Avg days/book · 28d"** is a genuinely interesting number presented as an
abbreviation stack.

## Upgrades, ranked

1. **P2 · Hide stat tiles with no data** rather than rendering an em-dash.
2. **P2 · Promote the pacing verdict** ("behind goal") — it is the most useful
   sentence on the page and it is set as caption text.
3. **P3 · Differentiate the three shelves visually**, especially "Reading now".
4. **P3 · Rewrite the shelf empty state** to house standard.
5. **P3 · Collapse per-book actions** behind one control as shelves grow.

## Leave alone

- **The pacing lines**, both of them. Copy this pattern into Goals and Fitness.
- **Page height.** 0.9 screens for a full library view is the benchmark.
- **Three collapsed sections at the bottom.** Correct.
- **Notes counts on book cards** (`Notes (2)`) — quiet, informative, no clutter.
