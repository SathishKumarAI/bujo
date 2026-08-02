# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02
- **Where I stopped:** Redesign steps 1–9 done across two stacked branches.
  `feat/design-system` (PR #80) has the token layer, self-hosted fonts, the
  seven-step rem type scale, two container tiers, reconciled primitives, the
  `/kitchen-sink` route and a 2,443-replacement adoption sweep.
  `feat/accent-and-motion` (PR #81, current) has the accent-inflation pass
  (accent fills in view bodies: 19 → 0), the motion-token pass, and the bullet
  glyph column raised to a real signature. eslint 0 errors, 678 tests, build
  green, 18 views × 5 themes clean.
- **Also done:** the day/week strip (PR #82). `DayGrid` now backs both the
  Stats heatmap and the Trackers per-habit grid. `TodayHabits` was left alone —
  it is chips grouped by time of day, not a strip, and the audit was wrong to
  group it. Fixed a pre-existing bug while in there: both grids stretched their
  columns to a 39.5px pitch around 10px cells; now 12px.
- **Also done:** the pages UI/UX polish pass (PR #87, branch
  `feat/pages-ui-polish`). Settings no longer renders a second `<h1>` and its
  tab pills are sized to their text instead of a uniform 209px; Plan,
  Collections, Reading and Insights are on the `Page` shell, so they finally
  have the entrance transition and the shared gap rhythm; section headers are
  real `<h2>`s (Reading went 0 → 7 headings in `<main>`, B5 closed); and four
  hand-copied clones of `QuietSection` are gone. Every finding was measured by
  clicking through the running app, never inferred from source — see
  `docs/redesign/11-pages-ui-polish.md`, which also records three things that
  were measured and *dismissed*, so nobody re-opens them.
- **Next action:** two items, both held up only by a file collision with a
  parallel session — pick them up once that lands:
  1. Recovery and Stats are the last two views off the `Page` shell.
  2. `ui.tsx:77` names every titled card's ⓘ `"What is this?"`, so Today alone
     exposes **34 identically-named buttons** to a screen reader, and it is
     14×14 against the WCAG 2.5.8 24px floor. Name it from the card title and
     pad the target — one file, app-wide reach.

  Beyond those, the raw-`<button>` sweep continues in the files PR #87 did not
  touch (Trackers, Gym, Account). Judgement per site, not a codemod: many are
  legitimately not buttons.
- **Blocked on:** a **second session editing this same working tree** — the
  `useFocusTrap` hook plus wiring into CommandPalette, the Card modal, Stats,
  ExerciseDB, Onboarding, HabitDetail, NoFap and Trackers. It was mid-edit
  (`NoFap.tsx:73` calls the hook with no import, so `npx tsc -b` fails on
  `main`). PR #87 was written in a separate worktree to stay clear of it and
  touches none of those files. Also `B1` in `TASKS.md`: the
  Supabase project at `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so
  every account/cloud-sync feature is dead until it is repointed or the env vars
  are unset.

**Read next:** `TASKS.md` (the working board) · `docs/redesign/11-pages-ui-polish.md`
(the newest pass, with its re-measure method) · `docs/redesign/09-redesign-audit.md`
(what the codebase actually is) · `docs/redesign/10-redesign-build.md` (what
shipped, and the four bugs found on the way).
