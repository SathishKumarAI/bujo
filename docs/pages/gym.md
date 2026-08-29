# Strength (Gym)

`src/views/Gym.tsx` · nav: **Body → Strength** · `?view=gym`

## What this page is

Where a lifting session is recorded, set by set: exercise, weight, reps, RPE,
set type. Everything else on it — the muscle map, the plate maths, the wger
library, eleven analytics cards — exists to support that one act or to report
on it afterwards.

It was the **last page in the Body cluster still laid out as `Page` + `aside`**
while thirteen views had moved to `PageLayout`, and the census numbers were what
you would expect of the holdout: 4.67 screens at 1440 (third tallest page in the
app), 6.89 at 390, ten folds of which **ten were open**.

## What shipped · 2026-08-28

| Was | Now |
|---|---|
| A flat stack under `Page` + `aside`, with no orientation of any kind | The three-zone contract — `PageLayout` / `StatBar` / `SummaryStrip` / `DisclosureRow`, like Fitness, Pickleball and Pull-ups |
| **The act was folded and the review was not.** `sessionOpen` defaulted to `false` below 640px, so a phone opened Strength with the set logger *shut* and four charts plus twelve analytics cards *open* | The logger is zone 2 and never folds. Compactness comes from folding the review |
| **The rest timer sat ~4,700px down on a phone.** It was in the rail, and the rail appends under `main` below `xl` | Zone 2, under the logger, at every width — ~600px on a phone |
| Two `CollapsibleSection`s whose comments read "(default COLLAPSED — drill-down stats, not daily-use)" and which rendered open, because `defaultOpen` is `true` | Nine `QuietSection`s, all `defaultOpen={false}` with a `stickyKey`, so the choice persists |
| "Progress photos" printed as a heading twice, back to back, with two different subtitles | One heading |
| Three coloured fold icons out of nine | None. A zone-3 section header is not where the accent gets spent |
| No primary button — Finish session was `secondary`, beside four other `secondary` buttons | `variant="primary"`, and it is the only one on the page |
| "Save as routine" was an input parked in the button row, permanently | The page's single `DisclosureRow`, at the bottom of the form |

### Two defects found by measuring, not by reading

**The set row did not fit a phone.** In the act column at 390px the container is
324px and the seven desktop tracks plus gaps came to 326. The **remove button
landed at x=387 in a 390 viewport** with nothing able to scroll to it, and
`document.body.scrollWidth` still read 390 because the clip happens at an
ancestor — so neither `npm run a11y` nor `scripts/clipped-text.mjs` could see
it. The same squeeze collapsed `1fr` to **50px**, making the exercise picker —
the widest thing a set row has to say — the narrowest control in the row. The
grid now has a phone step; `1fr` resolves to 122px.

**`BigThreeCard` measured 1.41:1 in latte.** Its three numbers were
green / red / blue via `cat()`, which are tuned to sit on a near-black card;
`bg-ink-0` is near-white in the light themes. Same family as the `cat('crust')`
trap. They are `text-fg-1` now — which also removes three accents from a page
the contract allows one.

**Neither was found by a gate, and one is a warning about this change.**
`npm run a11y` does not open folds, and `BigThreeCard` now sits inside a section
that is shut by default — so folding the review made a real violation *invisible
to the gate*. It was found by re-running axe against `?view=gym` with every fold
forced open. **Do that whenever you add or move a fold on this page**, and read
a clean `npm run a11y` here as "clean for whatever happened to be expanded".

## Zones

| Zone | Holds |
|---|---|
| 1 · orient | Train next · Last session · Sets this week · Stalled lifts |
| 2 · act | The set logger, its one disclosure, and the rest timer |
| 3 · review | Session rollup (after Finish) → this-week strip → **muscle volume balance** → nine folded sections |

**Stalled lifts is in zone 1 on purpose.** A lift with no new top set in three
sessions is the one number on this page that should change what you load today,
and it was four folds deep.

**The signature visual is `MuscleVolumeBalance`** — hard sets per muscle against
the 10–20 hypertrophy landmark. It is the only chart here that says what to do
next rather than what happened.

**The summary strip deliberately does not print the set count.** Zone 1 already
carries "Sets this week", and a strip that repeats an orient fact is the mistake
this page already made with its lift lists. It carries volume instead: sets are
the stimulus, volume is the load.

## Still true, and not fixed here

- **The same lifts are listed three times.** Personal records, Stalled lifts and
  Relative strength each enumerate the same exercises with the same weights, and
  Big-three total repeats three of them a fourth time. Same shape as the habit
  row that printed one number three ways (#177). They are now in three separate
  folds, which hides the redundancy rather than resolving it.
- **"Stalled lifts" fires on everything.** Six of six lifts in the demo journal.
  An alert that fires on everything is a label, not an alert.
- **`ExercisePicker` is not a combobox.** No `role="combobox"`, no `aria-expanded`,
  no arrow-key navigation — it is a button plus a filtered list.
- **The set row's controls are under the 44px touch floor** (`h-7`), as they were
  before.

## Measured

`node scripts/page-census.mjs`-style probe, demo journal, dev server 5199.

| | before | after |
|---|---|---|
| gym · 1440 | 4207px · **4.67** screens | 1246px · **1.38** |
| gym · 390 | 5818px · **6.89** screens | 1997px · **2.37** |
| folds open on arrival | 10 of 10 | **0 of 9** |
| charts on first paint | 4 | **0** |
| controls outside the viewport at 390 | 1 (remove row, x=387) | **0** |

axe with every fold forced open: **0 serious/critical** at mocha 1440, latte
1440 and mocha 390.
