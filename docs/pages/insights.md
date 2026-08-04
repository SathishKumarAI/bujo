# Insights

`src/views/Insights.tsx` · nav: Review → Insights · `?view=insights`

## What this page is

The reflection hub. A weekly-review ritual, full-text search, headline stats, a
weekly digest, a coach digest, and seven collapsed analytics groups covering
correlations, mood, habits, cross-domain digests, lifetime totals and the tag
manager.

## Measured (1440×900, demo data)

- **1.5 screens · 11 blocks**, seven of them collapsed 32px strips.
- Open: Weekly review (142px) · Search (159px) · big-stat row (179px) · Weekly
  digest (347px).

## The finding that matters

**P1 · The headline stats spend over a second reading zero.** Measured
immediately after navigation, the big-stat row says
`0d Current streak · 0d Longest streak · 0% Tasks done · 0 Entries`. After ~3s
it settles to `90d · 90d · 50% · 67`.

That is the `CountUp` animation doing its job, and the data is correct — but the
first thing a returning user sees on the app's analytics page is every number at
zero. On a slow device, or a glance-and-leave visit, "0d current streak" is the
whole message. Count *up from a near value*, animate faster, or skip the
animation on first paint. (Reduced-motion users already bypass it.)

**P2 · Seven collapsed strips in a row.** Correlations · Task migration & aging ·
Mood analytics · Habit analytics · Domain digests · Lifetime · Tag manager. The
same filing-cabinet problem as Pickleball, at greater length, and "Domain
digests" versus "Correlations" versus "Deeper signals" (on Pickleball) are
titles no user can rank by usefulness.

Note the one at 19px: *Task migration & aging* renders shorter than its
siblings, so the row of drawers is not even visually even.

## UX / IA

**P2 · Two digests, stacked, doing similar jobs.** "Weekly digest" (logging
streak, tasks, avg mood, habit deltas) and "Coach digest · What to focus on
next" are both summaries of the same week; one reports, one advises. Their
proximity makes the page feel like it is summarising twice.

**P3 · Search is second on the page.** It is a utility, not a read — and it is
above the stats and the digest, which are what the page is *for*. On a page
titled Insights, search is a tool you reach for, not content you consume.

**P3 · The weekly review is the best thing here and reads as a banner.** "A
1-minute Sunday ritual: clear overdue tasks, see what slipped, and write one
reflection" with `Start review` — a genuine product ritual, styled like a
notification.

## UI

**P2 · `+3%` floats between two stat tiles** with no visual attachment to
either. It belongs to Current streak (habits vs last week) but sits at the tile
boundary.

**P3 · `Avg mood 5.6/10 ↓ from 6.6`** is the single most informative line on the
page — a value, a direction and a baseline — and it is styled the same as
everything around it.

## Copy

**"A 1-minute Sunday ritual: clear overdue tasks, see what slipped, and write
one reflection."** Excellent: names the cost (1 minute), the cadence (Sunday),
and the three steps. This is how every feature in the app should be introduced.

**P2 · "Sugar — 5× this week" and "Vitamins — down 2 from last week"** are
presented as peers, but one is a count and the other a delta. Neither says
whether it is good news.

**P3 · "Find anything across your journal"** is a good subtitle for search.

## Upgrades, ranked

1. **P1 · Fix the zero flash** on the headline stats — shorter animation, or
   render the final value on first paint.
2. **P2 · Merge or clearly separate the two digests** — report vs advice.
3. **P2 · Group the seven drawers** into two or three named clusters, and rename
   the vague ones.
4. **P3 · Move search below the digests**, or into the command palette where it
   already lives.
5. **P3 · Attach `+3%` to its tile.**
6. **P3 · Give mood-delta lines a good/bad reading**, not just a direction.

## Leave alone

- **The weekly review ritual.** The strongest retention idea in the app.
- **The digest's content** — streak, tasks, mood with baseline, two habit
  callouts is the right set.
- **Seven groups collapsed.** Correct default; only their naming and grouping
  need work.
