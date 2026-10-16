# STATUS

**Stopped:** 2026-10-16, on `feat/strength-pass`, **two PRs open and stacked** —
Fitness (#410) and Strength (#411), both COD-329.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `feat/fitness-pass` | **#410** | Fitness: one bar of four rows, `useActColumn`, `nextStep`, a three-card history with a named Edit, pickleball out of the form, sport seeded | pushed, open against `main` |
| `feat/strength-pass` | **#411** | Strength: one bar of seven rows, the logger put away, the history the page never had, per-exercise rest, the charts | pushed, open against **`feat/fitness-pass`** |

**#410 merges first.** #411 is stacked on it (it uses `StatGrid`, `BarList`,
`chartStyle` and the capped-list history pattern), so after #410 squash-merges:
`git rebase --onto main <old-base-sha> feat/strength-pass` and **retarget #411
to `main` BEFORE the parent's branch is deleted** — GitHub closes a child whose
base branch is gone and will not reopen it (CLAUDE.md records #145/#147 having
to be re-created as #148/#149).

Verified on `feat/strength-pass`, against a local preview of its own build:
**2027 tests / 149 files**, `tsc -b` clean, eslint clean (one pre-existing
`App.tsx` warning), `vite build` clean, `design` 473 files, `contrast` 5 themes,
`smoke` 23/23, `clipped` clean at 1440 / 1024 / 390, and **`a11y:panels` 140
scans · 0 serious · 0 critical** (armed: `BUJO_CANARY=1` reports 36).

## The next action

1. **Merge #410, rebase and retarget #411, merge it.** Nothing else is in
   flight.
2. Then `docs/PAGE-ROLLOUT.md` — **four pages left: Nutrition, Challenges,
   Recovery, Cycle.** Nutrition is next and has no orient sentence and no
   `StatBar` at all.

Three things to know before starting one:

- **`npm run a11y:panels` is local-only and now 140 scans.** `main`'s a11y job
  has been red since 2026-10-15 09:08 on an unrelated shell-dropdown
  `label-content-name-mismatch`, which is why every PR shows UNSTABLE. Fix that
  before adding a second browser gate to the workflow.
- **Measure a rail page per row with a throwaway probe.** `npm run space`
  grades only the row the rail opens on — Strength reports ~1.1 screens and its
  worst row is 1.5.
- **Any breakpoint inside zone 2 or zone 3 is a container query.** Strength's
  set row used `sm:` inside a 416px act column and drew seven desktop tracks in
  it; three inputs rendered two characters each.

## Open, and worth doing before the next page

- **The demo journal trains 138 working sets a week** — a gym session most days
  plus pull-ups plus home workouts, three programmes at once. Every Strength
  analytic reads high because of it (lats 87 after the COD-330 fix, which is
  honest arithmetic over an unrealistic seed). Trimming it will move every
  snapshot that pins a seeded number, so it is its own change.
- **COD-330 is fixed** (the muscle-balance count), **COD-237 is three pages
  armed of six.** Insights, Coaching, Pull-ups, Help, Recovery and Cycle still
  have rails no gate drives.

## The two passes, in one place each

- **Fitness** — `docs/pages/fitness.md`. Sport mode's review zone was **47px**
  because no seeded workout derived that mode; two "this week" figures
  disagreed by **4.7x**, both correct, because one counts every activity and the
  other one mode; `fitnessGoalMin` had three readers and no writer.
- **Strength** — `docs/pages/gym.md`. **3001px of act column** beside a 678px
  review, 28 `aria-expanded` controls, and **no session history at all** — you
  could not correct a set you mistyped. Now one bar of seven rows, a 541px
  sticky act, grouped set lines, rest per exercise with a session estimate, and
  four defects fixed that no gate had caught: `onAccent` handed a token name,
  a viewport breakpoint inside a page-split column, a `PanelCard` with no
  `group` hiding every `.reveal` control, and a muscle landmark nobody could
  reach.

The permanent record of both, with every measurement, is the 2026-10-16 entry
in `docs/WORKLOG.md`.
