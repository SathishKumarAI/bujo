# Page walk — what was on screen

1440 × 900, mocha, demo data loaded. Nineteen views plus the three Today
surfaces and the five Settings tabs. Cycle is gated off in Profile and was not
reachable; nothing else was skipped.

Findings are cross-referenced to `FINDINGS.md`.

---

## Today

**Morning.** Mood 5 / Stress 4 as 11-dot scales, Energy unset showing `—`,
sleep stepper, "What broke your fast" as a two-way toggle with no way back to
neither. Intermittent fasting card. "Today's plan" with a streak-at-risk banner,
four chips, and the week strip — **F-02**.

**Day.** The rapid log with three lines and a working "3 lines today · 2 still
open". Habit pills below it, count in the corner. "Keep your streaks". A footer
strip of "No fast running · No training logged · Open Body". The `!` priority
marker sits far right — **F-05, withdrawn**: reclaiming the indent column on
every row is worth more than the proximity, and the code says so.

**Evening.** The close-out checklist. Before the fixture change this could only
ever show eight `check` habits, so the avoid path — the one that had a bug last
pass — was undrawable. **F-08**. After: "Doomscrolling · clean", no
strike-through, footer reconciles.

## Plan

**Week.** Migration dominates: twenty task cards, three buttons each, sixty
controls before the page's second card. The aging bar and its legend read well.
"Chronically deferred" with migration counts is the best thing on the page.
There is no week agenda on a tab called Week — **F-09**, backlog, because it is
a page-contract decision and not a defect. Demo data repeats four task titles,
which makes the queue look broken; that is fixture texture, not code.

**Month.** Calendar grid, dot markers, coverage bars per day. Location / Goals /
Photo of the month. Month pulse and a 12-month entries chart. The by-weekday
chart colours two bars orange and two blue with nothing saying why.

**Goals.** Seven derived goals plus a custom-goal form. Baselines broken —
**F-04**.

## Body

**Fitness.** The deep-link bug — **F-01**, the one S1 of the pass. Empty mode
draws furniture — **F-06**. Zone-1 facts in the mono face — **F-07**. RPE row
under 44px — **F-10**.

**Strength.** 5,285px of workshop: rest timer, plate calculator, exercise
anatomy, PRs, saved routines, exercise database, program tracker, progress
photos, training volume, muscle balance, movement balance, recovery readiness,
exercise frequency, needs-attention, stalled lifts, big-three, relative
strength, effort trend. Everything renders. "Exercise frequency" draws eight
identical full-length bars because every value is 3 — **F-18**, the same
failure as F-02 in another chart.

**Pickleball.** 5,934px, and every chart is correct. Four were nearly filed as
empty; see the method note in `FINDINGS.md`.

**Nutrition.** Macro split against target reads well. "Add food" is disabled
with no reason given while every numeric field is pre-filled with the day's
totals — **F-20**.

**Recovery.** 6,041px, ~20 cards, a floating SOS button. Numbers reconcile
(16 days clean since Jul 19). Still over the two-raised-card cap this repo set
itself, which STATUS already records as needing a judgement call.

## Mind

**Mindset.** Focus list plus a seven-category principle library. Clean. The
masonry leaves a hole bottom-right — **F-19**.

**Reading.** Star rating invisible — **F-13**. Two different "Pages read" on one
page — **F-17**.

**Collections.** Index, brain-dump inbox, future log, custom collections,
friends, birthdays. Duplicate birthdays — **F-14**. Auto-pages still folded —
**F-16**.

**Focus.** Timer, session log, typing practice, seven analytics cards. Project
names truncate in "Focus by project" — same family as F-11/F-12 but inside a
chart label, left alone.

## Insights

**Insights.** Weekly review, search, four stat tiles, weekly + coach digests,
correlations, momentum, mood analytics, habit analytics, domain digests,
lifetime, tag manager. Card titles clip — **F-12**. The same r=−0.83 correlation
is stated in two cards on one screen.

**Stats.** Activity heatmap, achievements, radar, sleep/mood pair, mood calendar,
fitness split, task breakdown, habit timing. Worst title clipping on the site —
a card literally titled `M…` — **F-12**.

**Trackers.** The habit grid, and the worst finding after F-01: names truncated
to `W.` and one row rendering with no name at all — **F-11**.

**Challenges.** One 75 Hard card with three day counters that contradict on
their face — **F-15**. Calendar fold still closed — **F-16**.

## Settings

Five tabs, all reachable, all rendering. The Data tab's destructive actions are
behind a confirm dialog that offers "Export a backup first" — which is the
pattern F-03 assumed was missing on Plan.
