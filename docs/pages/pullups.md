# Pull-ups

`src/views/Pullups.tsx` · nav: **Body → Pull-ups** · `?view=pullups`

## What this page is

A single-exercise coaching hub, and the only place a pull-up session is
recorded as a scheme rather than as a duration. A six-week "Starting From Zero"
program with a day-by-day checklist, an ability calculator that turns your max
strict pull-ups into a prescribed training set, a session recorder, and the
training manual — all of it now behind one bar of eight panels, with the log
form alone in the act column beside them.

The audit at the bottom of this file was written against the first version,
which **told you what to do** without recording what you did — that was its
strength and the source of most of its problems. The two "What shipped"
sections below say which of those are closed, newest first.

## What shipped · COD-312, 2026-10-15 (PR #400)

The page had grown back into the shape the `SectionRail` was added to fix. The
review zone was four stacked peer sections — the program tracker, the history
list, an "Analytics" heading, and the six-chapter manual rail **last**, so the
table of contents was the final thing on the page.

| Was | Now |
|---|---|
| Four peer sections stacked, the rail among them | **One rail, eight panels**, one at a time: Today · Formats · Training set · Form · History · Progressions · Principles · Equipment |
| The rail was a side column at `railAt` default `@4xl` | **A horizontal bar** (`railAt="never"`, new), across the top of the panel it switches. It wraps rather than scrolling |
| Sticky, so it painted over the panel on scroll | **Not sticky.** A side rail sticks because it is a column beside content; a bar sits above its panel |
| Zone 2 held the calculator *and* the log form | **The log form alone**, in the right-hand act column. The calculator is the head of the Training set panel, above the ability table it was restating |
| Zone 1 carried four facts, two of them absences on an empty journal | **Two.** Weekly target became the denominator of `This week` (with a track); Last session is already the log form's first row |
| Five reference panels, five different list idioms | One `PanelCard` in a two-column container-query grid |
| The program map was a `<div>` per week, columns aligned by coincidence | **One grid**, week as a row header. A probe asserts every day column has one left edge |
| Formats were fourteen four-paragraph `<li>`s | Cards: duration beside the name, volume/intensity as tags, RX/Scale as a labelled pair, **solo first** |
| Panels ordered as the sections were written, opening on History | **Ordered for doing** — Today (the program's current day, with its boxes) is the default |

### Measured (built bundle, `?demo=1`)

| | before | after |
|---|---|---|
| desktop page | 1885px · **2.09 screens** | 995–1720px · **1.11–1.91 per panel** |
| phone page | 3490px · **4.14 screens** | 1761–4158px per panel |
| card headers, 8 views | 23 subtitled, **1075px** | 23 subtitled, **687px** |
| program map (here, desktop) | 377px, 125px cells | **298px**, 104px cells |
| program map (Program, phone) | 171px, 30px cells | **130px**, 42px cells |
| the bar, desktop | — | 1 row, **635px of chips in 686px** |
| the bar, phone | — | 4 rows, 101px — eight labels do not fit 324px |

Supersedes the **1.7 screens** figure in the older audit below; that number
described a different page.

### Six defects found on the way

1. **The demo seed produced no `activity: 'pullups'` workout at all.** The
   history list rendered its empty frame at 47px, the summary strip read
   `0 · 0 · 0`, the heatmap drew 84 blank cells — at five themes and two
   viewports, on every `npm run a11y` run, for the life of the page. Sibling of
   the unseeded `data.cycle`. Seeded, with five tests armed against a planted
   empty seed: three failed, **two passed vacuously** (`every([])` is true,
   `0 < 40` is true) and both now carry a floor.
2. **`SectionRail`'s default breakpoint cannot fire in a review column.**
   `@4xl` is 896px and zone 3 at the 1180 tier is 722px, so the rail had been
   drawing its *phone* chip strip on a 1440 desktop since it shipped.
3. **`ChipPick` put accent text on a 15% wash of itself.** `brand-wash` /
   `brand-text` is the only solved pair in `index.css`. Measured selected,
   composited over the first opaque ancestor: latte **4.25 / 3.64 / 4.33 /
   4.40**, dawn **4.54 / 3.81 / 4.59 / 4.70** — seven of ten under 4.5, and
   `teal` and `peach` shipped that way at every call site. Worst of twenty
   readings now **6.42**.
4. **`PullupWorkout.profile` was three facts in one string.** Now `volume`,
   `intensity` and `minutes` with a shared `PullupRating`, and the test asserts
   every field on every row.
5. **Zone 1 clipped a phone.** `320 of 120–210 pull-ups` needs **200px against
   138**; caught by `npm run clipped`. The floor behind its track was
   `weekly.match(/\d+/)` — a parse over our own data — so `PULLUP_ABILITY` now
   carries `weeklyLow` / `weeklyHigh`, with a test that the sentence starts
   with them.
6. **Two viewport queries in `ProgramMap` should have been container queries.**
   `?view=program` draws the same map in a ~300px card on a 1440 screen, where
   `sm:` answered "plenty of room" to a 39px cell.

Filed, not fixed: **COD-313** (the demo banner overflows a 390px phone by 24px
on every view) and **COD-314** (Cycle's `text-fg-3` day label at 4.01–4.16 and
Mindset's inline `rgb(0,0,0)` on a brand fill at 3.19–3.92 — the seven serious
violations `npm run a11y` reports, all of them also on `main`).

### Gates

| gate | result |
|---|---|
| `verify` | 141 files, **1928 tests**, `tsc -b` + eslint + build clean |
| `clipped` | **0** across 23 views at 1440 / 1024 / 390 |
| `space -- pullups program` | 1.1 / 1.0 desktop, 2.6 / 1.9 phone — inside budget |
| `a11y` | Pull-ups **0 serious on all 7 shards** |
| per-panel axe probe | **56 scans, 0 serious**, armed with a planted violation |

Both rendering gates grade only the panel the bar opens on (COD-237), so a
throwaway probe drove all eight panels at five desktop themes and two phone
themes. It was armed first: a planted contrast violation fired **on Equipment
alone**, which is also what proves the panel switching was real rather than
eight scans of the same DOM.

### Which of the audit below this closes

- **P2 · "Two 620px cards of near-identical weight"** — zone 2 is one card now,
  and the calculator sits with the table it explains.
- **P2 · "The ability table is a reference document dropped into the page"** —
  it is a panel you choose, with your own row calculated at the top of it.
- **P1 · "The page never says what to do first"** — the default panel is the
  program's current day, with its boxes.

Still open from that list: the checklist does not capture reps (the recorder
beside it does), and **P2 · "max strict pull-ups" assumes the reader knows what
*strict* means**.

### The honest weak spot

The **phone**. The bar wraps to four rows (101px) because eight labels do not
fit 324px, and the two-column cards cost height in a single column — Formats
went **3.68 → 4.93 screens** there while desktop went 1.91 → 1.84. Taken
deliberately: a bar that scrolls instead of wrapping hides three of its eight
rows behind a scroll nothing advertises. It is the first thing a phone user
would notice.

---

## What shipped · COD-13, 2026-08-27

| Was | Now |
|---|---|
| No door. Reached only by picking Pull-ups on the Fitness activity select and then finding a companion link | **A Body tab.** `sections.ts` argued for three releases that a pull-up session IS a `Workout` so the page was an activity — the wrong test, and the same one this repo already records getting wrong about Pickleball. The test is what the *page* holds |
| The checklist marked a day done; nothing recorded what was pulled | **A session recorder.** Method (straight / ladder / pyramid / EMOM) + top set + rounds, which is how these are actually prescribed. Stores a plain `Workout` with `activity: 'pullups'`, one `Pull-up 1xN @ 0kg` line per set, so the existing strength analytics, CSV export and search read it unchanged |
| The ability table sat permanently open below the calculator that had already told you your row | Collapsed, inside the manual |
| Max strict pull-ups was a number you typed and retyped | Derived from the biggest single set you have logged. The input is still there and overrides it, and deliberately does not persist |
| Counts and rep ranges set as body text | `.num` throughout |
| A flat stack of eight cards | The three-zone contract — `PageLayout` / `StatBar` / `SummaryStrip` / `CalendarHeatmap`, like Fitness and Pickleball |

**And a content regression, undone.** Commit `531596f` re-wrote the workout
formats and progressions inline in the view instead of reading
`lib/pullups.ts`. Fourteen formats became three, nine progressions became seven
rewritten ones, and the ability-ladder table was dropped. Nothing failed —
`PULLUP_WORKOUTS` and `PULLUP_PROGRESSIONS` simply became exports nobody read,
which typechecks, lints and renders. `lib/pullups.test.ts` asserts the counts
now, and the manual is back on the library.

Commit `4a25ff5` had also pasted a shrunken copy of three of these cards into
`views/Coaching.tsx`; that is deleted.

## Measured (1440×900, demo data)

- **1.7 screens.** Three blocks: program (627px) · training set (628px) ·
  Reference (68px, collapsed).
- 15 buttons, 11 inputs.
- Demo state: **`0/30 days done`, `0/5 done`** — the program is untouched.

## UX / IA

**P1 · Two week/day pickers stacked as bare number rows.** The program has
`Week 1 2 3 4 5 6` then `Day 1 2 3 4 5` as two rows of digits. Nothing marks
which is selected beyond styling, nothing says which week you are *on* versus
which you are *looking at*, and there is no "resume where I left off". For a
program whose whole promise is "follow this in order", the navigation does not
know your place.

**P2 · The ability table is a reference document dropped into the page.** Seven
rows × four columns of prescriptions (Beginner → Elite) rendered as a full data
table, permanently open, below a calculator that already told you your row. Once
the calculator says "Novice (1–5) · 1 rep/set · 90–180 reps weekly", the table is
noise for everyone except the curious.

**P2 · "Max effort ×1" and "20s work ×8" are prescriptions with no capture.**
The checklist marks a day done, but you cannot record *what you actually did* —
no reps field, no weight, no note. So the page can tell you your program is 40%
complete but never how strong you got. The one number it does take (max strict
pull-ups) lives in a different card.

**P3 · "Mark all done" sits at the bottom of the exercise list**, after five
individual rows, so the fast path is the last thing you find.

## UI

**P2 · Two 620px cards of near-identical weight.** Program and training set are
the same size, same chrome, same density, stacked. Nothing says the program is
the main event and the calculator is the setup step.

**P3 · The `STRENGTH` label is the only all-caps micro-label on the page** and
it labels a group of five exercises, not a section. It reads like a leftover
category tag.

**P3 · Numbers are set as body text.** `0/30 days done`, `0/5 done`,
`30–60 reps` — this is a numeric page and its numbers get no typographic
treatment. The app has a `.num` / tabular-figures convention; it is unused here.

## Copy

**P1 · The page never says what to do first.** Landing cold on
`Starting From Zero — Pull-up Program · Novice pull-up program · 6 weeks ·
5 days/week` with `0/30 days done`, the correct first action is to take the
pull-up assessment so the calculator has a number — but nothing says so. A
one-line "Start here: test your max, then begin week 1" would orient a beginner,
which is precisely who this page is for.

**P2 · "From your max strict pull-ups"** assumes the reader knows what a *strict*
pull-up is (no kipping, dead hang, full lockout). The page is aimed at people
starting from zero.

**P3 · "Pull-up assessment · Max effort · ×1"** reads as spreadsheet shorthand.
"Do as many as you can, once" is the same information in plain words.

## Upgrades, ranked

**All six are closed.** COD-13 did capture (the recorder), the ability table
(collapsed) and the numeric type treatment; COD-20 did the rest, in
`components/ProgramTracker.tsx`, which Pull-ups shares with Program:

| Was | Now |
|---|---|
| **P1 ·** the picker did not know your place | It opens on the **first unfinished day**. `useState(p.weeks[0].week)` had ignored `settings.programDone` entirely — the same render read it two lines later to draw "8/30 days done" |
| **P1 ·** no marker for what was finished | `✓` on every complete week and day, `▸` on the one you are up to — in the accessible name as well as on screen. **The marker was already written and rendered nothing:** `{dayComplete(week, dn) && ''}` computed the predicate and printed an empty string |
| **P1 ·** no way back from browsing | A **Continue** link, shown only while the day you are looking at is not the day you are on |
| **P3 ·** "Mark all done" last, after every row | In the card header, beside the count it changes |

`resumeAt` / `dayComplete` / `daysComplete` / `exerciseKey` are pure and live in
`lib/programs.ts` with `programs.test.ts` on them — "which day am I on" is the
whole promise of a six-week program and should be checkable without mounting a
component and a store.

The one nuance kept from the old list: **the checklist still does not capture
reps.** The recorder beside it does, which is the cheaper half and not the whole
of that upgrade.

## Leave alone

- **The ability calculator.** Type in one number, get a prescription — the
  clearest single idea on the page and genuinely useful.
- **The six-week program content** itself. It is real, specific and well
  sequenced.
- **Reference collapsed by default.**
