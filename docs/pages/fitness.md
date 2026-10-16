# Fitness

`src/views/Fitness.tsx` · nav: Body → Fitness · `?view=fitness`

## What this page is

Everything you do that is not lifting and not a pickleball match: cardio
(run, cycle, swim, row, walk, hike, yoga, HIIT, other) and sport (a game of
anything). Strength owns lifting (`?view=gym`), Pickleball owns pickleball
(`?view=pickleball`); this page owns the rest of the record.

Two modes, one toggle, and **every fact re-reads on the switch** — a mode
toggle that only moves a highlight was the bug the first pass over this page
existed to remove.

## What shipped · COD-329, 2026-10-15

It was already on `PageLayout`, which is why it never looked broken, and zone 3
was a flat stack: a History section, then an "Analytics" heading over three
tiles and a heatmap. **553px of record under a 705px log form** at 1440 — the
act column taller than the thing it feeds, at every width — and in sport mode a
review zone of **47px**, because no workout in the demo had ever derived that
mode.

### Shape

`PageLayout` tier 1180, `actTop`, the same shell as Pickleball, Pull-ups and
Home Workout.

| zone | holds |
|---|---|
| 1 · orient | **one bordered block**: the `nextStep` sentence, the mode toggle, three facts |
| 2 · act | Log a session, 38% column, one primary button, **Hide the log** |
| 3 · review | one bar of four rows |

**The rail reads in order, and the default is not the first row.**

| # | row | the question |
|---|---|---|
| 1 | Volume | am I training enough — eight weeks, cadence, the calendar |
| 2 | Sessions | what did I log, and can I fix that row |
| 3 | Bests | am I getting fitter — best per activity, next round number |
| 4 | Mix | what do I actually do — which activities, which days |

The page opens on **Sessions**: the order is for finding things, the default is
for the thirty seconds after pressing Log session.

**No sub-section chips.** `REUSABLE-PATTERNS.md` §16 puts the threshold at about
five cards in a row and the biggest row here holds four.

### The orient block

One line that says what to do next (`nextStep` in `lib/fitnessReview.ts`), by
priority: `first` → `lapse` → `goal` → `today` → `milestone`. It is a button
into the row that answers it and a paragraph when none does. **Lapse outranks
goal**, which is Pickleball's measurement reused: a target inside a week you
have already let go is worth less than the fact that you stopped.

There is no `event` rule — nothing in a `Workout` has a date you cannot move —
and the `goal` rule is cardio-only, because a game has no minutes denominator.

### Figures lead back to your entries

Every activity row and every weekday bar is a button. It opens Sessions
filtered to exactly those rows, where the editor and × already live, and the
filter states itself as a chip you can take off (`3 of 17 ×`). Not sticky, not
in the URL, cleared when you change rail row.

### The weekly target has a control now

`settings.fitnessGoalMin` had **three readers and no writer**: this page's
headline fact, `lib/coach.ts` and Goals, all against a 150-minute default that
nothing in the app could change. The field is under the sessions it counts, the
way Pickleball's weekly-games field is.

## Measured · `?demo=1`, preview server, mocha

| | before | after |
|---|---|---|
| desktop landing (1440) | 945px · 1.1 screens | 945px · 1.1 |
| phone landing (390) | 1905px · 2.3 screens | **1279px · 1.5** |
| stacked (1152) landing | 1402px · 1.6 screens | **972px · 1.1**, strip 41px |
| review zone, cardio | 553px, two sections | 513px, four rows |
| review zone, **sport** | **47px** (one empty frame) | **513px** |
| review width, log open → hidden (1440) | 678 either way | 678 → **1054** |
| review width, hidden, 1920 / 2560 | — | **1534 / 1870** (no empty track) |
| cards per row, log hidden (1440 / 1920 / 2560) | — | 2×541 / 2×522 / 2×477 |
| worst row, desktop | — | **1.4 screens** (Volume) |
| worst row, phone | — | **2.1 screens** (Volume) |
| `views/Fitness.tsx` | 388 lines | **338**, plus 638 in `components/fitness/` and 362 in `lib/fitnessReview.ts` |

`npm run space -- fitness` reports **1.0 shipped / 1.0 open** on desktop and
1.2 / 2.1 on a phone — but it grades only the row the rail opens on, so the
per-row numbers above come from a throwaway probe. Quote both, and say which.

**a11y per row**: `npm run a11y:panels` now drives both pages. Fitness is
**56 scans** — 4 rows × 2 modes × (5 desktop + 2 phone themes) — **0 serious, 0
critical**, armed on a planted violation first (`BUJO_CANARY=1` → 26 criticals
on one theme). Fitness is listed twice there because the mode toggle is sticky
UI state rather than a URL parameter, so a single entry would scan the cardio
half seven times and never render the sport half.

Gates, this branch, against a local preview of its own build: `tsc -b` clean,
**2006 tests / 147 files**, eslint clean, `vite build` clean, `design` 466
files, `contrast` 5 themes, `smoke` 23/23, `clipped` clean at 1440 / 1024 / 390.

## Files

| Change | File |
|---|---|
| The shell, zone 1, the next-step row, the log form | `src/views/Fitness.tsx` |
| The bar and which cards each row holds | `src/components/fitness/Review.tsx` |
| The four rail rows, and what each says about when to read it | `src/components/fitness/panels.ts` |
| The record, the filter chip, the edit dialog, the weekly target | `src/components/fitness/History.tsx` |
| Every read-only card | `src/components/fitness/Cards.tsx` |
| Every aggregate, and `nextStep` | `src/lib/fitnessReview.ts` |
| A comparison drawn as bars | `src/components/page/BarList.tsx` |
| The container-query card grid | `src/components/page/StatGrid.tsx` |
| The form, shared with the edit dialog | `src/components/page/ActivityForm.tsx` |
| Which activities exist, and which mode each is | `src/domain/activities.ts` |

## Traps this page paid for

- **Two "this week" figures can disagree by 4.7x and both be right.**
  `weeklyActiveMinutes` — the 150-minute target in zone 1, in Goals and in
  `lib/coach.ts` — counts *every* activity, lifting and pickleball included;
  the Volume card counts one mode. Toning the weekly bars against that target
  put **a red bar on a 123-minute week while the bar above it said 578**.
  Scope is part of a comparison's currency, exactly like a unit. The card
  compares its blocks with each other and names its scope; the fact is labelled
  `All training`.
- **An unseeded mode is a whole half of a page no gate has ever rendered.**
  `lib/demo.ts` drew from `['run','strength','yoga','walk','cycle']` and
  pickleball lives in another collection, so `sessionsInMode(data, 'sport')`
  matched nothing. Third instance after `data.cycle` and `activity: 'pullups'`.
- **A sticky toggle hides half a page from a gate the same way a tab shell
  does.** The a11y probe had to be told to set `bujo.ui.fitness.mode`, or it
  would have reported seven green scans of the same mode.
- **Four facts beside a mode toggle do not fit `actTop`'s zone 1.** It is 678px
  wide, not the full 1110, so each fact had ~85px and `578 / 150 min` drew as
  `578 / 150 …`. Three facts; the dropped one is `StatBar`'s own example of what
  belongs in zone 3.
- **jsdom measures a 0px shell, so every component test sees the stacked
  layout** — and `useActColumn` shuts the act there by design. Four view tests
  went red on a correct change; they now open the strip and assert
  `aria-expanded=false` on the way in, which is the only coverage that default
  has outside a browser.
- **`prettyDay` in a 56px label column is eight identical ellipses.** "Fri, Aug
  15" needs ~86px; the seven-day blocks all start on the same weekday anyway,
  so the weekday carried no information.

## Carried over from the audit this file replaced

`docs/pages/fitness.md` used to hold a browser audit of **`views/FitnessHub.tsx`**
— the retired shell that put Cardio and Strength behind one 808px segmented
control. Every P1 in it described UI that no longer exists: the switcher that
announced no state (Strength is its own tab), the cardio form advertising
`Bench 5x5 @ 60kg` (per-mode `notesPlaceholder` now), the "NEXT UP · Pull day"
card on the cardio tab, the Nutrition accordion (its own page), the unlabelled
RPE stepper (`Effort · RPE 1–10`).

One finding survived and is **still open, deliberately**: *"Repeat last should
probably be the primary path for a returning user"* — eight controls, all
blank, is a lot to log a run you have logged forty times. It is a secondary
button in the form header today. Not done here because the right version of it
is a measurement (how many sessions ARE repeats of the last one?) rather than a
preference, and that measurement is not in this pass.
