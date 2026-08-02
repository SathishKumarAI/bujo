# Goals

`src/views/Goals.tsx` · nav: Library → Goals · `?view=goals`

## What this page is

A cross-view roll-up. Every active target in the app — habit weekly goals,
fitness minutes, challenge days, books, streaks — as one list of progress bars,
each linking back to its home view. Plus custom manual goals.

Conceptually the most valuable page in the product: it is the only place that
answers "how am I doing, overall".

## Measured (1440×900, demo data)

- **1.0 screen.** Two blocks: the roll-up (371px) and Custom goals (411px,
  empty).
- Seven rolled-up goals:

| Goal | Progress |
|---|---|
| Caffeine · this week | 3/5 |
| Sugar · this week | 5/7 |
| Active minutes · this week | 382/150 ✓ |
| Pickleball games · this week | 7/12 |
| 75 Hard · 75-day challenge | 5/75 |
| Books read · this year | 1/12 |
| Streak vs. best | 16 of 24 days |

## The finding that matters

**P1 · Limit-habits and build-habits share one progress bar.** `Caffeine ·
3/5` and `Active minutes · 382/150 ✓` are rendered identically, but one is a
ceiling you are trying to stay under and the other is a floor you are trying to
clear. A filling bar means "good" in one row and "careful" in the next, with
nothing to tell them apart.

For Caffeine at 3/5, is the user 60% of the way to success, or 60% of the way to
failure? The page cannot say, and it is the page whose entire job is saying.

**P2 · "1 of 7 on track" and "Overall progress 53%" disagree in feel.** One in
seven is 14%; the headline number is 53%. Both are presumably right — one counts
goals met, the other averages completion — but side by side they read as two
answers to the same question. Same class of problem as Challenges' four
progress numbers.

## UX / IA

**P2 · Custom goals is 411px of empty.** Larger than the roll-up it sits under,
showing "No custom goals yet · add one above to track anything". The page's real
content is the smaller half.

**P3 · Three different time windows in one list, marked only by a caption.**
`this week` ×4, `75-day challenge`, `this year`, and an all-time streak
comparison. Sorting or grouping by horizon would make the list comparable
instead of merely stacked.

## UI

**P2 · No pacing, unlike Reading.** Reading says "On pace for 2 · behind goal".
Goals shows `1/12` books with no projection — the same data, on the page that
most needs the verdict. "Books read 1/12 · on pace for 2" would land.

**P3 · `382/150 ✓` mixes a ratio with a checkmark** while other completed rows
presumably do something else. One completion treatment, applied consistently.

**P3 · "Streak vs. best · 16 of 24 days"** is a comparison, not a goal — your
best is not a target you chose. It sits in a list of things you committed to.

## Copy

**P2 · Every row is a noun and a number.** `Caffeine · this week · 3/5`. No row
says what success is or whether you are getting there. The Coaching page manages
"True recovery, or a light 20–30 min wall session" for the same amount of space.

**P3 · "Your own targets, track anything with manual progress"** — "manual
progress" is implementation detail surfacing in a subtitle.

## Upgrades, ranked

1. **P1 · Distinguish limit goals from build goals.** Different bar direction,
   colour, or an explicit "under 5" label. Without this the page can mislead.
2. **P2 · Reconcile "1 of 7 on track" with "53%"**, or label what each counts.
3. **P2 · Add pacing verdicts** — borrow Reading's "on pace for / behind goal"
   exactly.
4. **P2 · Shrink empty Custom goals** to a single prompt row.
5. **P3 · Group by horizon** (this week · this challenge · this year).
6. **P3 · Move "Streak vs. best"** out of the goal list, or reframe it as one.

## Leave alone

- **The concept.** A single cross-domain roll-up is the strongest product idea
  in the app and no competitor bullet-journal app has one.
- **Rows linking back to their home view.**
- **Fitting in one screen.**
- **Pulling from real sources** rather than asking the user to re-enter targets.
