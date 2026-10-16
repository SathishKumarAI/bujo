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

## What shipped · COD-329, 2026-10-15

The three-zone pass above left the shape right and the SIZE wrong. Measured at
`?demo=1` against a preview, before this change:

| | shipped | opened | act column | review |
|---|---|---|---|---|
| 1440 | 1538px · 1.7 screens | 3234px · 3.6 | **3001px** | 678 × **3016px** |
| 1920 | 1539 · 1.4 | 3056 · 2.8 | 2838 | 1062 × 2563 |
| 1152 (stacked) | 2304 · 2.6 | **6262 · 7.0** | 2712 | 825 × 3292 |
| 390 | 3048 · 3.6 | **7262 · 8.6** | 2998 | 324 × 3737 |

**28 `aria-expanded` controls**, four review folds of which three started shut.
A fold hides a section's height and keeps its row; the page you landed on was a
form and four identical grey bars, and the answer you came back for was behind
whichever one you guessed right. That is the same finding the Home Workout pass
wrote down ("a review zone has one navigation in it") arriving a cluster later.

### Shape, now

| zone | holds |
|---|---|
| 1 · orient | Train next · Last session · Sets this week · Stalled lifts |
| 2 · act | The set logger, last session, the rest timer, the tools fold — **and a control that puts the whole column away** |
| 3 · review | One bar of five rows |

| # | row | the question |
|---|---|---|
| 1 | Week | what have I done in seven days, and where is the volume going |
| 2 | Sessions | what did I log — and the page had **no history at all** before |
| 3 | Strength | am I getting stronger: records, standards, effort |
| 4 | Balance | what am I neglecting: movement split, recovery, frequency, stalls |
| 5 | Body | how is my body changing: weight trend and photos |

**It opens on Week, not Sessions** — the one difference from the sport pages,
and the reason is that a lifting session is logged set by set with the logger
already open in zone 2, so what you want afterwards is what the week now looks
like.

### The history the page never had

You logged a session, a rollup card appeared until your next keystroke, and
after that the session existed only inside twelve analytics. There was no list,
so there was nothing to correct: a set typed as `120` instead of `12` was
permanent, while `updateWorkout` had been in the store the whole time —
`USER-CONTROL.md` rule 1 failing on the page with the most data entry in the
app.

**Sets are grouped the way a lifter says them.** One row per stored set made
the first demo card **thirteen rows**, five of them the identical string
"Bench Press 65lb × 5". `groupSets` collapses a run into `5 × 65lb × 5` and
keeps the set that BROKE separate — `5,5,5,5,4` prints two lines, because the
failure is the interesting part. Bodyweight is `BW`, never `0lb`. Phone
Sessions row: 2039px → **1450px**.

The editor rewrites BOTH stored shapes through `setLineOf`, which the logger
also calls: `setRows` is what every analytic counts, `sets` is what `parseSet`
reads, and rewriting one is how a corrected session keeps reporting its old
numbers.

### The charts

Reported as *"some of the charts are looking like just a generic slop"*.

- **A house axis style** (`components/page/chartStyle.ts`): horizontal
  gridlines only, no axis line, no tick marks, `subtext0` ticks (`overlay0` on
  a card is 2.57:1), compact figures (`14k`), and `minTickGap` so twenty dated
  points thin themselves instead of running together. 39 `CartesianGrid` call
  sites exist in the app; these four are migrated, the rest are a follow-up.
- **Every subtitle states the finding**: "This week 14k lb · 9% above your
  eight-week average of 13k", not "weekly working-set volume".
- **The current week is drawn quietly** and says so under the chart — the last
  bar covers a week that has not finished, and a short bar at the right-hand
  end reads as a collapse rather than as Tuesday.
- **The movement radar became four bars.** Four axes make a quadrilateral, so
  there is no baseline for a shape to be lopsided against, and with Core at
  zero — true in the demo and in most real weeks — it collapsed to a triangle
  against an empty axis. Measured: a **224px plot holding a small purple
  triangle**, with the four real numbers printed as a caption because the chart
  could not carry them.
- **`pl-2` on the lift table's numeric columns.** At 390px the right-aligned
  cells butted into each other: `146lb1.61×` read as one wrong number. Invisible
  to both rendering gates; caught on a screenshot.

### Measured after

| | shipped | review | worst row |
|---|---|---|---|
| 1440 | **1051px · 1.2 screens** | 678 × **786px** | 1490px (Balance) |
| 1920 | 1125 · 1.0 | 1062 × 786 | — |
| 1152 | **1085 · 1.2** | 825 × 786 | — |
| 390 | **1593 · 1.9** | 324 × 1025 | 1912 (Balance) |

`views/Gym.tsx` 781 → 558 lines. Folds on the page 28 → 18.

**a11y per row**: `npm run a11y:panels` drives all five — part of **126 scans ·
0 serious · 0 critical** across three pages, armed on a planted violation
(`BUJO_CANARY=1` → 36 criticals). The fold counts it prints for the gym rows
(14–29) are the act column being opened by `openFolds`, because `ActStrip`
renders `aria-expanded="false"` — which is what you want from a gate meant to
see the whole page.

### The act column, second round

The bar fixed the review and left the act at **3001px**: the logger, the
last-session card, the rest timer and a "Look up & tools" fold. Reported as
"it is wasting scrolling", and the fix was to decide what each piece is for.

| Piece | Where it went | Why |
|---|---|---|
| Anatomy, plate maths, saved routines, coach sessions, the wger library | **Tools, a rail row** | They are consulted between DECISIONS. Zone 3 is beside zone 2, not below it, so the anatomy map and the logger are now on screen together — which the fold never allowed |
| Rest timer | stayed in zone 2 | Used between SETS, 80px, and a timer you navigate to is a timer you do not start |
| `LastSessionCard` | **deleted** | Every card in the Sessions row carries **Load**, so any session reloads, not only the latest of the selected split. `lastSessionOfSplit` went with it — no other reader |

| | act column | sticky | folds on the page | landing |
|---|---|---|---|---|
| 1440 | 3001px → **541px** | now **true** | 28 → **5** | 1003px · 1.1 screens |
| 1152 | 2712 → **41** (strip) | true | 4 | 1085 · 1.2 |
| 390 | 2998 → **41** (strip) | true | 4 | 1593 · 1.9 |

`PageLayout` sticks the act only while it is shorter than the viewport, so at
3001px it became its own scrollport; at 541px it sticks, which is what it was
built for. `views/Gym.tsx` is **367 lines**, down from 781 at the start of the
pass.

The tools reach the review as a **slot**, not as eleven props: everything in
them reads state the act owns, and threading that through the review would make
it know what a set row is.

### The barbell

Reported as *"make the plates look real… it really looks like AI slop"*. It was
nine flat rectangles, one accent each from the palette, all the same thickness,
heights scaled by `p / max`, with the weight printed inside at 8px.

Now: real diameters and thicknesses in millimetres (450mm for a 25kg down to
160mm for a 1.25), the **IWF colour code** mapped onto the nearest tokens, a
gradient plus a one-pixel specular edge and a dark trailing edge per disc, the
sleeve drawn **through** the stack with the collar over the inner edge, knurl
ticks on the shaft, and no numbers on the discs — side-on you cannot see a
plate's face.

**The first version was lit from below in every light theme**, because it shaded
with `cat('text')` over `cat('crust')` and those swap ends between mocha and
latte. A specular highlight is the room's light, not a palette entry: `#fff` at
0.22 over `#000` at 0.3, in every theme. Caught by screenshotting two themes
side by side — the only way this class of bug has ever been caught here.

### Still open after this pass

- **`MuscleVolumeBalance` cannot be satisfied.** Its landmark is 10–20 hard
  sets per muscle per week, and it counts a set once per muscle the lift works
  — so the demo journal's 134 weekly sets render as traps 96, lats 91, biceps
  76, i.e. every muscle permanently "over 20" in red. The card is arithmetically
  right and useless as drawn; either the landmark needs to be per *direct* set
  or the count needs a divisor. Filed, not fixed here.
- The act column is still ~3000px with the tools fold open. Shutting the column
  is the answer the user has; shortening it is a separate measurement.

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
| 3 · review | Session rollup (after Finish) → this-week strip → **muscle volume balance** → nine folded sections · **superseded by the five-row bar, COD-329** |

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

## The four things that pass left open · closed 2026-09-02

Each was filed rather than silently left, and each is now shipped. They are
worth keeping written down, because three of the four were invisible to a gate.

| Was | Now |
|---|---|
| **The same lifts listed three times**, and Big-three total repeating three of them a fourth — "Deadlift 100kg" appeared on the page four times. Three separate folds *hid* the redundancy rather than resolving it | `BigThreeCard` is gone. Three of its four numbers were `Personal records` printed again; the one it owned, the total, is a line at the top of `RelativeStrengthCard`, which is now the page's single "how strong am I" card (COD-89) |
| **"Stalled lifts" fired on six of six.** An alert that fires on everything is a label | The demo seeder was logging one fixed weight per lift, so the journal held **no PR anywhere** and the detector was right. Real progressions now; 3 of 7 flagged. Flagging and counting were also two disagreeing definitions — `60, 65, 65, 65` printed "4 sessions stuck", counting the session that went up (COD-90) |
| **`ExercisePicker` was not a combobox** — no roles, no `aria-expanded`, no arrow keys. `npm run a11y` passed it and always would: a named button over named buttons is valid markup | The ARIA 1.2 listbox pattern, guarded by `ExercisePicker.test.tsx` rather than by a gate, because widget semantics are not a thing axe asserts (COD-91) |
| **Set-row controls under the 44px floor** — 28×28, and the picker 120×61 with its own label wrapping | Two lines on a phone, one on desktop. Every control ≥44px; page 1988 → 1993px. Buying height rather than fighting for width is what `ui/button.tsx` prescribes (COD-92) |

Found while closing them, still open: **COD-94** Settings is not on the a11y
gate's `VIEWS` list · **COD-96** 24 other controls on this page are still under
44px (the quick-load links are 19px).

The `npm run a11y` warning below is now obsolete in its particulars — the gate
opens folds itself since COD-93 — but the general lesson is why this section
exists at all.

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
