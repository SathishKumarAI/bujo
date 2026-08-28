# Challenges

`src/views/Challenges.tsx` · nav: Habits → Challenges · `?view=challenges`

## What this page is

Fixed-length disciplines — 75 Hard, 90-day, custom. Each has a rule list you
check off daily, a day-numbered calendar, and an optional strict mode that
resets you to day 1 on a miss.

Rebuilt on the three-zone page contract in **COD-35**. What follows is the page
as it is now; the findings that drove the rebuild are kept at the bottom because
the reasoning is worth more than the list.

## The contract, as applied here

| Zone | What it holds |
|---|---|
| 1 · Orient | `Today · 5 of 5 rules` · `Day 9 of 75` · `Streak 5` · `Complete 9%`. When more than one challenge is running, a `Segmented` picks the focused one and it filters all three zones. |
| 2 · Act | Today's rules, and nothing else. The archive and delete controls belong to the challenge, so they sit in this card's header. |
| 3 · Review | Three tiles — `Days done` · `Days missed` · `Best streak` — then the calendar, then `New challenge`, then the archive fold. |

## Measured (dev server, demo data, 2026-08-28)

- **1.00 screens** at 1440 (was 1.41), **1.39** at 390. Fits without scrolling on
  a desktop, which is the thing this page's earlier note asked to protect.
- **0 folds** open or shut, unless there is an archived challenge to fold.
- `npm run a11y` 0 serious / 0 critical, both viewports, five themes ·
  `verify-folds challenges` 0/0 at 1440 and 390 · `clipped-text` clean ·
  `smoke` 25/25.

## The finding that drove the rebuild

**The card stated its progress five ways with four denominators.** From one
screen: `Day 4 of 75`, `5 of 75 days done`, `70 to go`, `7%`, `70 Days left`,
`9/75 Elapsed`. Day 4, 5 done, 70 left, 9 elapsed. Each was correct under its
own definition — current day, days completed, days remaining, days since start —
and the page named none of them, so a user counting on their fingers found that
4, 5 and 9 could not all be true.

The fix was not "print fewer numbers". It was to make the numbers a
**partition**, so they can be added:

```
completedDays + missedDays + (1 if today is still open) === elapsedDay
```

`missedDays` was added to `lib/challenges.ts` for this, and the identity is
asserted over four different logs in `lib/challenges.test.ts`. Today is
deliberately not counted as missed while it is still open — you have not lost a
day you are still living.

`Days left` is gone. It was `duration − completed`, which counts from a
different origin than `Day n of N`, and it was the number that made the whole
set read as broken.

**`progressDay` is deleted from the app.** On a strict challenge it returned
`streakBeforeToday + 1` — the streak, again, wearing a day number's label. It
had no caller but its own test, which is the shape this repo's CLAUDE.md warns
about under "a data module can go dead without anything failing", running the
other way.

## What else was deleted, and why

| Gone | Why |
|---|---|
| The progress ring | Restated the percent printed beside it. The contract calls a ring an accent appearance even in neutral, and this page needs its accent elsewhere. |
| The progress bar | Same ratio a third time. |
| The four-tile stat row (`Current streak` · `Best streak` · `Days left` · `Elapsed`) | `Current streak` was the *third* rendering of the streak on that card, after the header flame and `🔥 3 streak`. |
| The header flame | See above. |
| The red on the strict pill | Status pills are neutral; the six words carry the stake. The copy is unchanged, deliberately — it is the best sentence on the page. |
| The inner `Card` inside the archive fold | It repeated the fold's own title. |

## Still open

- **P3 · The rules are switches, and switches read as settings.** Ticking off
  "Workout 1" for today is an event, not a preference. There is no checkbox
  primitive in `components/ui/`, so this is a separate ticket rather than a
  native `<input>` smuggled past the design-system check.
- **P3 · "Fixed-length discipline challenges, 75 Hard, 90-day & more"** — the
  old subtitle is gone with the header card it lived in, but the empty state's
  "75 Hard, 90-day, or your own rules" inherits the job and could still be
  sharper.

## Leave alone

- **Strict mode** and how it is described. The whole reason 75 Hard works is the
  reset, and the page says so without moralising.
- **Fitting in one screen.** A challenge check-in should never need a scroll.
- **The rule list as the unit** — five short strings, tick them, done.
- **The day numbers in the calendar.** The shared `DayGrid` is a week-columned
  trailing window with no text in a cell; a challenge is a sequence from day 1
  to day N and the number is what people count in. That is why this grid is not
  built on the shared primitive, and why each cell carries its state as hidden
  text rather than in a `title` alone.
