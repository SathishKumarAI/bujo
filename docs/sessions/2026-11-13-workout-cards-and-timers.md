# 2026-11-13: Workout cards, timers, and habit cards on the phone

Written to be read cold. It covers what shipped, what it measured, what the owner
said, and what is still open. The rules sit in `CLAUDE.md` under "A phone logs, a
desktop reads". The reusable pieces are in `docs/REUSABLE-PATTERNS.md` §34–§37.
PRs #539–#554 cover COD-585…614 under the parent COD-590. Production was
deployed at #553.

## The ask, in the owner's words

- "No more subparts. I want only cards with all the exercises planned."
- "Make all the cards in the program and pull-ups show in one page only if possible."
  Then, pasting the Bird dogs card: "redesign these cards to fit all in one card".
- "I need 20 seconds for the plank, but right after 20 seconds I need a pause of
  10 seconds … I need to do it like 8 times … did you miss anything, these kind of
  gaps?"
- "They can change based upon their needs … done … pause, reset, undo. Options are
  needed here, time, and also saving them into the history."
- Habits on Today: "make them all in mobile version into cards, and also, if
  needed, card animation."
- Earlier in the day:
  - no symbols and no animations on the workout pages;
  - no week or month on the phone;
  - the three date chips "look like a calendar on the top";
  - "look at the desktop too".

## What shipped

All PRs were squash-merged and the branches deleted. Every PR ran `verify`,
`design` and `contrast`, and all three exited 0.

| PR | Ticket | What | Measured |
|---|---|---|---|
| #539 | COD-585 | Pull-ups phone: one card per exercise; History and the guide moved into sheet rows | 5.36 → 2.33 screens; `aria-expanded` 5 → 0 |
| #540 | COD-586 | Trainer's 25 sessions as a program (`lib/trainerPlan.ts`); a Hypertrophy / Trainer picker | 5 tests |
| #541 | COD-588 | Program phone: one card per lift; notes shown open | 7 cards, 2.78 screens |
| #542 | COD-592 | Pull-ups: the day on one page; Straight, Ladder, Pyramid and EMOM as plain steps (`methodSteps`) | symbols 13 → 0 |
| #543 | COD-593 | Home workout: routines and exercises as cards; no part-switcher; `lib/plain.ts` | `aria-expanded` 4 → 0 |
| #544 | COD-594 | Today: nothing opens in place on the phone; symbols changed to words | symbols 14 → 0; axe caught "not set" at 3.54:1, fixed |
| #545 | COD-595 | `HoldTimer`, a big count-up timer, on every timed card | Fix: a ticked timed row on Program had been dropped from `programDone` |
| #546 | COD-596 | No week or month on the workout pages; a single "Day N of M" picker | "week" in `#main`: 0 / 0 / 1 (the 1 is the routine's own advice) |
| #547 | COD-600 | One "Today ▾" day pill in the phone bar instead of three chips | 3 chips → 1 pill, 44px |
| #548 | — | STATUS | |
| #549 | COD-601 | One-row exercise cards on Pull-ups, Program and Home workout | Program day 3.30 → 1.80 screens, cards 68–88px; the Pull-ups day and Home workout each fit on one screen |
| #550 | COD-602 | `IntervalTimer`: Tabata and hold lists, the WORK / REST word, beeps | Tabata 8 × 20 saved; dead hangs stop at hold 2 |
| #551 | COD-603 | `RestClock` between sets; an EMOM minute clock in QuickLog | Checked in Chrome |
| #552 | COD-604 (really COD-608) | Tune work, rest and rounds before Start; Back, Round done, Skip rest, Reset; every logged day in History with its lines | 2466 tests |
| #553 | COD-614 | Today's habits as cards: two per row, tap a card to mark it, − / + on counted habits, the tick pops | 12 cards, no overflow |
| #554 | — | STATUS; production deployed | Live `index-C_PTuXdi.js` matches the local `.vercel/output` |

## How the timers decide

These rules live in `lib/holdTime.ts`, which is pure logic with tests beside it.

| The plan says | Card gets | Save writes |
|---|---|---|
| a single time ("30 s", "1 min") | `HoldTimer`: counts up, buzzes at the target | "30 s", and ticks one set |
| "Tabata 20s/10s" in the name or plan | `IntervalTimer` built by `tabata(on, off, rounds)`, with no rest after the last round | "8 rounds of 20 s"; ticks up to the number of rounds |
| a list ("15,30,15 s") | `IntervalTimer`, `manual`: stops between holds, and the wait is your rest | "15, 30, 15 s", and ticks one set |
| EMOM (QuickLog) | `emomSteps(minutes, reps)`, one 60 s step per minute | ticks the minutes done |
| anything else | no timer button | — |

- **Tuning.** Work, rest and rounds can be changed only before Start (`since ==
  null && ms === 0`), so a run that has started is never retimed.
- **Back.** Back goes to the start of the current step, or to the step before
  when the current one is under two seconds old.
- **Sound and screen.**
  - Three short beeps come before each switch and a long beep on it. A sound is
    used because an iPhone browser cannot vibrate.
  - The `AudioContext` is created on the Start tap, because iOS needs a gesture.
    With no Web Audio, the timer runs without beeps.
  - Wake Lock keeps the screen on.
- **Logging.** Every logged program day is now a History session. Its notes hold
  "Pull-ups, day N of M, focus" and then one line for each exercise. Only the
  assessment max counts as a pull-up set, so rep totals stay true.

## What was tried and thrown away

- **Three-row cards, with the counter, plan and input stacked.** Five cards were
  1.5 screens. Rejected: "fit all in one card". One row won.
- **A pill per set on Program.** There were 22 pills across 7 lifts. They were
  replaced by the single `.set-count` ring, which reads "n/total".
- **A ref to stop manual holds from re-stopping.** Lint rejects setState inside
  an effect. The stop point is now the derived `cap`, set when Start is tapped.
- **`Date.now()` in a tap handler to start the rest clock.** `react-hooks/purity`
  rejects it. `RestClock` records its own start when it mounts, and callers pass
  a counter as the `key`.

## Findings outside the ask, and where they went

- **COD-595 (fixed).** On Program, a ticked timed row was never written to
  `programDone`.
- **COD-594 (fixed).** Today's "not set" was 3.54:1 on mocha.
- **#552.** The commit and PR name COD-604, but the real ticket is COD-608. A
  comment on COD-608 says so.
- **COD-575 (open).** Sheets on phone pages outside Settings are still not
  scanned by the a11y gate.

## Still open

- **COD-590 cards: pages not yet done.**
  - Recovery (8 folds).
  - Insights (6).
  - Trackers (4).
  - Nutrition, Challenges, Cycle and Monthly (3 each).
  - The chip rails on Coaching and Focus.
- **Owner questions.**
  - Should "no month" also cover the Monthly page and the Trackers month layout
    on the phone?
  - COD-434 and COD-436 are still waiting on a decision.
- **Interval timers on Program and Home workout.** Not built: no plan on those
  pages has Tabata or a hold list (checked with grep).

## Environment, as left

- **Dev server.** The server on `127.0.0.1:5199` was stopped by the system for
  low memory. Restart it with `npm run dev` when needed.
- **Debug Chrome.** Port 9333 (PID 43496), started by this session.
- **Gate dependencies.** The deploy wiped them. Before running `a11y`, `smoke`,
  `clipped` or `space`, run `npm i -D --no-save playwright @axe-core/playwright`.
