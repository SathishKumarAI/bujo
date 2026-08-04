# Fitness

`src/views/FitnessHub.tsx` (shell) · `src/views/Fitness.tsx` (Cardio) ·
`src/views/Gym.tsx` (Strength) · nav: Fitness → Fitness · `?view=fitness`

## What this page is

Two products behind one nav item. A **Cardio** tab that logs sessions with
duration/distance/calories/RPE and keeps a history, and a **Strength** tab that
is a full lifting app — programs, plate maths, muscle map, progress photos.
A segmented control at the top switches between them.

## Measured (1440×900, demo data)

| Tab | Height | Top-level blocks |
|---|---|---|
| Cardio | 1.7 screens | Log a workout (612px) · History (409px) · Nutrition (102px) · Cardio analytics (68px) |
| Strength | 1.3 screens | Today's session (420px) · Body weight (102px) · Program & progress · Training insights · Deep analytics |

The Strength/Cardio switcher is **404px wide per button, 808px total**.

## UX / IA

**P1 · The tab switcher is not a tab switcher to assistive tech.** Both halves
are plain `<button>`s: `role` is `null`, `aria-pressed` is `null`. A screen
reader hears "Strength, button. Cardio, button" with nothing to say which view
you are in. It is the single most important control on the page and it announces
no state. (`Tabs`/`TabsList` already exist in the codebase and Settings uses
them.)

**P1 · Cardio's form shows a Strength example.** The notes textarea placeholder
reads `Sets, one per line / Bench 5x5 @ 60kg` — on the *cardio* tab, under
Duration and Distance. The two tabs are sharing a form component and the copy
did not follow the split.

**P2 · "NEXT UP · Pull day →" sits on the Cardio tab.** Pull day is a strength
session. The header cards belong to whichever tab you are *not* looking at.

**P2 · Empty by default, four steppers deep.** Logging "I ran 5k" means Date,
Activity, Duration, Distance, Calories, RPE, notes, feel — eight controls, all
blank, four of them −/+ steppers. "Repeat last" is the good answer and it is
tucked in the header as a secondary button; it should probably be the primary
path for a returning user.

**P3 · RPE has no scale.** A stepper labelled `RPE` with no range. It is 1–10 to
someone who lifts and nothing to everyone else.

## UI

**P1 · An 808px segmented control for a binary choice.** The switcher spans the
whole column with two 404px halves, making it the largest element on the page
above the fold — heavier than the ring, the goal, and the log form's first
field. A binary toggle should be the width of its labels. The same `flex-1`
stretch problem Settings' tabs had.

**P2 · The two tabs have different rhythms.** Cardio is one long open form plus
an open history; Strength is one open card plus four collapsed sections. Same
page, same chrome, two different densities depending on which half you land on.

**P3 · "Sample day" on the Nutrition card** is a filled button next to a
chevron, so the card has two competing affordances before you have opened it.

## Copy

**P2 · Both tabs claim the same title.** The top bar reads `Fitness · Cardio &
strength` on one tab and `Fitness · Strength` on the other, from two separate
`VIEW_CHROME` entries (`fitness` and `gym`). The subtitle changes but the tab
you are on is only visible in the switcher, which (see above) does not say.

**P3 · "Log a workout"** is right. **"How did it feel?"** is right — a good,
human prompt. Keep both.

## Upgrades, ranked

1. **P1 · Make the switcher a real `Tabs`** — `role="tablist"`, selected state,
   arrow-key navigation. The primitive is already in the codebase.
2. **P1 · Shrink it to content width** (`flex-none`, same fix as Settings).
3. **P1 · Split the placeholder copy** so Cardio stops advertising bench press.
4. **P2 · Promote "Repeat last"** to the primary action for anyone with history;
   most sessions repeat.
5. **P2 · Move "NEXT UP" to the tab it belongs to.**
6. **P3 · Label the RPE scale** (1–10, with the anchors in the ⓘ).

## Leave alone

- **The weekly ring + "382 / 150 min · Goal met 🎉"** — the best header on any
  page in the app. Immediate, specific, celebratory without being loud.
- **History rows.** Name, date, duration, right-aligned. Nothing wasted.
- **Strength's collapsed deep-analytics stack** — correct default for a tab that
  already has a lot going on.
- **Keeping cardio and strength apart.** They are genuinely different activities
  with different fields; two tabs is the right call, only the control is wrong.
