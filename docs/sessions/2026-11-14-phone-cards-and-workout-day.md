# 2026-11-14: Every phone page as cards, and a workout day you finish and leave

Written to be read cold. It covers what shipped, what was measured, what the
owner said, and what is still open. The rules live in `CLAUDE.md` under "A
phone logs, a desktop reads". PRs #557–#566 cover COD-590 and COD-630.
**Production is still at #553**: nothing in this document is deployed yet.

## The ask, in the owner's words

- Earlier in the day, for COD-590: nothing opens in place, no symbols, no
  charts, one row per item, and the desktop unchanged.
- "I want to stop all monthly and weekly things for mobile version. They can
  stay in [the desktop] version."
- On the workout cards:
  - "a button only showing watch … change to kind of edit … all in one line";
  - "exercise names … in one line only, in one card";
  - "delete button, minimize it and move it to my right hand side";
  - "the completion … left hand side … easy for the right-handed";
  - "a settings option for left-handed and right-handed".
- "Show only the things which are needed. Everything can go into notes … the
  main focus is getting the user to understand what exercises to do on the
  day, complete it and get out of there."
- On the timers: "pause, edit, undo, round again if they miss it, break if they
  want to add more seconds … think like a gym rat who makes mistakes."
- "Tap the circle after each set. Tap the plan to change it, Watch to see how.
  Log when you are done. In points."
- "When I enable the timer … show that you can do it … so the user can
  motivate himself."
- "Log and tick everything … overlapping with the workout … move the log down
  … do we need the bottom tab, the navbar? I don't think it's needed."

## What shipped

| PR | Ticket | What | Measured |
|---|---|---|---|
| #557 | COD-590 | Recovery: `FlatCards`, row editors in a `Sheet`, 7 chart panels `chart: true` | folds 8 → 0 |
| #558 | COD-590 | Insights: `usePlain()`; `plain()` handles ×, a/b, ↑↓, ± | symbol lines → 0 |
| #559 | | a11y and clipped-text gates, red on main since #551 | 249/249 scans clean |
| #560 | COD-590 | Nutrition, Challenges, Cycle as cards | folds 3 → 0 on each |
| #561 | COD-590 | No week or month on a phone: Monthly, Trackers, Plan, Focus | week squares 84 → 0 |
| #562 | COD-590 | Coaching: steps, not weeks; shots and drills in sheets | folds 22 → 0; desktop byte-identical (178,366 chars) |
| #564 | COD-630 | One exercise card, a Hand setting, how-to notes as points | names on two lines 6 → 0; cards 68–106 → 77px |
| #563 | COD-630 | Timers: pause, rest ±15 s, undo, redo round, edit plan mid-session | new tests, one armed on a canary |
| #565 | COD-630 | Timer push: a filling ring, a line that changes with the moment | ring 0.55 at 11 s of 20, "Last 3 s. Push!" at 17 s |
| #566 | COD-630 | Workout days drop the tab bar; Log sits after the last card | cards covered by a floating element 1 → 0 |

## The shapes, as they are now

**The exercise card** (`components/workout/ExerciseCard.tsx`), on Program,
Pull-ups and Home workout:

- Line 1: the set counter, the name on one line, and a small remove at the
  edge. Remove appears only on Home workout; the other pages have nothing to
  remove.
- Line 2: one row of actions. The plan ("3 sets of 12, 35 lb") is the Edit
  button, then Watch, then Timer when the plan is timed. The plan wraps rather
  than cuts.
- Behind Edit:
  - Program: − / + for every set, last time, and Try N.
  - Pull-ups: "what you did", including the assessment max.
  - Home workout: the plan.

**Hand** (Settings › Workouts): right-handed is the default and puts the
counter on the left and remove on the right. Left-handed mirrors the card and
the log dock. The setting is `settings.hand`, applied as `<html data-hand>`,
and mirrored by `styles/phone-exercise.css`.

**How-to notes** (`ui/pageHint.tsx`): a note in points at the top of a page.
"Got it" hides it for good. The three workout pages share one key, and Today's
habit cards have their own.

**A workout day** (Program, Pull-ups, Home workout on a phone):

- No bottom tab bar (`AppShell` `NO_TAB_BAR`). The way out is the title's All
  pages grid.
- Log and Tick all sit after the last card (`.log-dock-end`).
- A running rest clock still floats at the foot of the screen.

**Timers:**

- `IntervalTimer`:
  - Pause.
  - During a rest: −15 s, +15 s and Skip rest.
  - Round done, then Undo.
  - Redo round.
  - Edit plan, which changes only the steps still to come.
- `RestClock`:
  - Pause and Stop.
  - ±15 s when it counts down to a target.
- A ring around Start/Pause fills as the step runs (green for work, sky for a
  rest). On an open stopwatch it goes round once a minute.
- The line under the clock comes from `lib/cheer.ts`.

**Coaching:** the twelve weeks are a course, so a phone calls them steps
("Step 6 of 12"), chosen from one select.

## What I got wrong, and the measurement that caught it

- **The timer ring made the panel taller**, which pushed the clock half under
  the sheet's header at 390 × 664. The button shrank from 10rem to 8rem inside
  the ring, and the clock now sits fully on screen.
- **The plan was truncated** to make room for Watch and Timer. clipped-text
  caught "8 rounds, 20 s on, 10 s off" showing 95px of the 149px it needed. The
  plan is what to do, so it now wraps.
- **The counter's accessible name said "0 of 3" over a painted "0/3"**, which
  fails axe's `label-content-name-mismatch` on every card. The name went back
  to "0/3".
- **The "45 to 60 min session" row opened a sheet without `aria-haspopup`.**
  Coaching's axe probe found it.
- **Hiding the tab bar broke the a11y gate**: it reached sections by tapping
  "Body", and on a workout day that tab is gone. A first fix opened the ☰
  Menu, which turned out to hold notifications, not sections. `go()` now uses
  the All pages grid, the way a person would, and still completes 101 of 101
  scans.

## Open

- **Deploy.** This session's permission check blocks
  `bash scripts/ship.sh --deploy-only`; the owner runs it.
- **COD-575:** phone-page sheets outside Settings are still not scanned by
  `npm run a11y`. Coaching, Program, Pull-ups and Home workout were probed by
  hand this session.
- **Other pages:** they keep the tab bar and their floating dock. Ask the
  owner before extending "no tab bar" beyond the workout days.
- **Timer layout:** on an iPhone 13 Pro the timer's Save and Edit plan sit
  just below the visible part of the sheet during a rest.
- **"+" left as is:** `plain()` does not rewrite "+", so "50+" and
  "accuracy + decisions" still show in drill text.
- **Leftover folder:** `.claude/worktrees/agent-a33c5a885d81da128` remains
  because deleting it was refused with "Permission denied". Its branch is
  merged and deleted.
