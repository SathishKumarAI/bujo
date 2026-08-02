# Home Workout

`src/views/HomeWorkout.tsx` · nav: Fitness → Home Workout · `?view=homeworkout`

## What this page is

A no-equipment workout builder. Browse a bodyweight exercise library, each entry
with a target muscle, form cues and a video demo; add exercises to build today's
session; log reps and sets, which then feed Fitness totals and history.

## Measured (1440×900, demo data)

- **0.9 screens.** Three cards: Today's session (190px) · Recent home workouts
  (188px) · Exercise library (102px, collapsed).
- **4 buttons on the entire page, and every one of them is unlabelled** (the
  three card ⓘ's and the library's chevron).
- **0 inputs.**
- All three cards are in their empty state.

## The finding that matters

**P1 · In the demo — the app's own shop window — this page is completely
empty.** Every other page in the product is rich with sample data; here a
first-time visitor gets three empty boxes:

> Today's session — *"Tap "Add" on an exercise to build your session."*
> Recent home workouts — *"No home workouts logged yet."*
> Exercise library — *collapsed*

The demo exists to show what the product can do. This page shows nothing, and it
is reachable in one click from the sidebar. Whatever else changes, the demo
dataset should seed a couple of home workouts.

**P1 · The empty states point at something that is closed.** Card 1 says "Add
exercises from the library" and "Tap 'Add' on an exercise". The library is card
3, roughly 500px below, **collapsed**. The page's only instruction refers to a
thing the user cannot see and is not told to open. With no data, the library
should be open by default — it is the only interactive content on the page.

## UX / IA

**P2 · The order is backwards for a first session.** Session → history →
library. But you cannot have a session until you pick from the library, and you
have no history at all. For an empty state the useful order is library first.

**P2 · Three cards is two too many when all three are empty.** An empty page
made of three separate empty boxes reads as three separate failures. One card
with the library in it would read as a starting point.

**P3 · No sense of what the library contains.** "Exercise library · No
equipment, tap a demo to watch proper form" does not say how many exercises, or
which muscles are covered. "38 bodyweight moves, 9 muscle groups" would give a
reason to open it.

## Copy

**P2 · Two subtitles explain the mechanism, not the value.** "Add exercises from
the library" and "Tap a day to see exercises & reps" are both instructions for
operating a widget. The top bar's "Bodyweight exercises · demos · log" is the
better line and it is the smallest text on the screen.

**P3 · "Tap"** throughout, on a desktop viewport with a mouse. Minor, but it is
the wrong verb half the time.

## Upgrades, ranked

1. **P1 · Seed the demo** with two or three home workouts, so the page shows the
   product instead of its skeleton.
2. **P1 · Open the library when there is no session** — never point at a closed
   drawer.
3. **P2 · Reorder for the empty case**: library first until a session exists.
4. **P2 · Collapse to a single card** while empty.
5. **P3 · Advertise the library's size** in its subtitle.

## Leave alone

- **The concept.** No-equipment library + build-a-session + it feeds Fitness
  totals is a clean, well-scoped idea, and the plumbing into Fitness history is
  the right kind of integration.
- **Card order once populated** — session, then history, then library is correct
  for a returning user. This is only wrong while empty.
