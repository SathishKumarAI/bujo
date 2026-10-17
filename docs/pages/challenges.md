# Challenges

`src/views/Challenges.tsx` · nav: Habits → Challenges · `?view=challenges`

## What this page is

Fixed-length disciplines — 75 Hard, 90-day, custom. Each has a rule list you
check off daily, a day-numbered calendar, and an optional strict mode that
resets you to day 1 on a miss.

Rebuilt on the three-zone page contract in **COD-35**, and finished on the
rollout in **COD-335**. What follows is the page as it is now; the findings
that drove each pass are kept below, because the reasoning is worth more than
the list.

## The contract, as applied here

| Zone | What it holds |
|---|---|
| 1 · Orient | `Today · 5 of 5 rules` · `Day 9 of 75` · `Streak 5` · `Complete 9%`. When more than one challenge is running, a `Segmented` picks the focused one and it filters all three zones. |
| 2 · Act | Today's rules, and nothing else. The archive and delete controls belong to the challenge, so they sit in this card's header. |
| 3 · Review | Three tiles — `Days done` · `Days missed` · `Best streak` — then **two columns**: the day calendar, and beside it the rule-by-rule panel or the picked day's record. Then `New challenge`, then the archive fold. |

## What shipped · COD-335, 2026-10-17

The rollout pass, and the one page on the list whose fault was never length.
Measured at `?demo=1`, mocha, bundle hash checked against `dist/index.html`:
**1.00 desktop screens before and after.**

Three faults, one shape:

**1 · `challengeNotes` was write-only.** Its only reader was `RuleNote`, which
the view rendered for `today` and for no other day — so a note written this
morning could never be read back, corrected or removed. That is
`docs/USER-CONTROL.md`'s rule that add without edit is a bug, in the same
shape as the Home Workout history the doc was written for, and `lib/demo.ts`
had been seeding **fourteen notes across nine days** that nothing on the page
could show.

**2 · Seventy-five day cells reached nothing.** They were `<li>`. Measured in
the browser: `clickable in review: 1` — the only interactive thing in the
whole zone was the New-challenge button, and `docs/PAGE-ROLLOUT.md` step 7
(every grouped figure opens the rows behind it) had no implementation here.

**3 · The review column was mostly empty.** The calendar is 262px wide and sat
in a **678px column at 1440 and a 1,062px column at 1920** — 61% and 75% of
the zone was nothing at all.

One change answers all three. A cell is a button; the day it opens is a panel
beside the calendar with that day's rules, tickable, and their notes. The
store could always do this — `toggleChallengeRule` and `setChallengeRuleNote`
have always taken a `day` — so the capability was there and the affordance was
not, which is the finding rather than the fix.

| | before | after |
|---|---|---|
| clickable controls in the review | **1** | **76** |
| 1440 · page | 900px · 1.00 screens | 900px · **1.00** |
| 1920 · page | 1,080px · 1.00 | 1,080px · **1.00** |
| phone · page | 1,347px · 1.60 | 1,714px · **2.03** |
| zone 1 | 53px of four figures | **105px**: a sentence, then the figures |

Desktop is unchanged because the panel lands in width that was already there
and empty — which was the point. The phone pays 367px for two things it could
not previously ask for at any width.

**With no day picked the column stands on `ruleCompletion`** — rule by rule,
over the elapsed window. The page could say how many days were complete and
never which rule broke them, so "I keep missing a day" had no answer on
screen. Same origin as `completedDays` and `missedDays`, asserted in
`lib/challenges.test.ts`, so the figures read against `Day n of N` with no
second arithmetic. Standing content rather than a "pick a day" placeholder on
purpose: a column empty until you touch something else is the dead width the
split was opened to spend.

**Zone 1 gained the sentence** (`nextStep`, six rules by urgency). `left`
**names** the rules rather than counting them — "2 of 5 rules left today" is
`Today · 3 of 5 rules` subtracted, eight pixels above, and a sixth statement
of progress on this page would be the mistake the first pass was about. It now
reads *"Left today: Read 10 pages and Drink 1 gallon of water."*

### What this page did NOT take from the rollout, and why

- **No `SectionRail`.** The review holds three things. A rail is for a zone
  with five or more, and it would hide two of them behind a row.
- **No `useActColumn`/`ActStrip`.** Collapsing the act gives width back to a
  review that already had 61–75% of its column spare. The page is 1.00 screens
  at 1440; there is nothing to put away. Both decisions are measured above
  rather than inherited from the pages before it.

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
| The `Switch` on each daily rule (COD-37) | A switch is a *setting* — it says how the app should behave from now on and stays where you left it. Ticking "Workout 1" records that a thing happened **on a date**, and tomorrow starts blank. Now `Checkbox`, which is new in `components/ui/` and in the kitchen sink beside a `Switch` so the difference is reviewable. The `strict` toggle on the new-challenge form is still a switch, correctly. |

## Still open

- **A past day's notes are editable but the page never says so.** The panel
  opens with an input carrying the saved text, which is the right affordance;
  there is no "edited" trace and no undo, which is the same level the rest of
  the app sits at.
- **The archive fold is still a list of names and day counts.** Now that any
  day of an active challenge opens, a finished one's days do not — the panel
  is bound to the focused ACTIVE challenge. The least-surprising fix is to let
  an archived challenge be focused read-only.
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
