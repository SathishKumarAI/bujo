# Pull-ups

`src/views/Pullups.tsx` · nav: Fitness → Pull-ups · `?view=pullups`

## What this page is

A single-exercise coaching hub. A six-week "Starting From Zero" program with a
day-by-day checklist, an ability calculator that turns your max strict pull-ups
into a prescribed training set, and a reference section of workout formats and
progressions.

Unusually for this app, this page **tells you what to do** rather than recording
what you did. That is its strength and the source of most of its problems.

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

1. **P1 · Add a "start here" state.** With 0/30 done, the page should show one
   next action, not a six-week grid.
2. **P1 · Make the week/day picker know where you are** — highlight the current
   day, and offer "continue".
3. **P2 · Let the checklist capture reps**, so the program produces data instead
   of only consuming it.
4. **P2 · Collapse the ability table** behind the calculator's result.
5. **P3 · Move "Mark all done" to the card header.**
6. **P3 · Use the numeric type treatment** for the counts and rep ranges.

## Leave alone

- **The ability calculator.** Type in one number, get a prescription — the
  clearest single idea on the page and genuinely useful.
- **The six-week program content** itself. It is real, specific and well
  sequenced.
- **Reference collapsed by default.**
