# Pull-ups

`src/views/Pullups.tsx` · nav: **Body → Pull-ups** · `?view=pullups`

## What this page is

A single-exercise coaching hub, and the only place a pull-up session is
recorded as a scheme rather than as a duration. A six-week "Starting From Zero"
program with a day-by-day checklist, an ability calculator that turns your max
strict pull-ups into a prescribed training set, a session recorder, and the
training manual underneath.

The audit below was written against the older version, which **told you what to
do** without recording what you did — that was its strength and the source of
most of its problems. The next section says which of those are closed.

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
