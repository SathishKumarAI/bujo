# STATUS

**Stopped:** 2026-08-28. **Zero open PRs, clean tree, `main` at `f839de8`.**
One PR this session: **#161**, Challenges rebuilt on the three-zone contract
(COD-35). The previous session's fourteen are in the git log; this file no
longer repeats them.

## What shipped

| PR | What | Ticket |
|---|---|---|
| #161 | Challenges: numbers that add up, and the act moved to the top | COD-35 |

Two commits, deliberately split: the arithmetic (`lib/challenges.ts`) and the
layout (`views/Challenges.tsx`). The first is the one worth reading.

## The finding worth carrying forward

**"Too many numbers" was the wrong diagnosis, and the obvious fix would have
been wrong too.** Challenges printed its progress five ways with four
denominators from one screen — `Day 4 of 75`, `5 of 75 days done`, `70 to go`,
`7%`, `70 Days left`, `9/75 Elapsed` — and `docs/pages/challenges.md` had
recorded it as a P1 for weeks. The tempting fix is to delete four of them.

That would have hidden the problem rather than fixed it. Each number was
correct under its own definition; what was missing is that **no two of them
could be added to each other**. `Days left` was `duration − completed`, which
counts from a different origin than `Day n of N`, so 4, 5, 9 and 70 could never
be reconciled by a user counting on their fingers no matter how few of them
were shown.

The fix is a partition, asserted in a test:

```
completedDays + missedDays + (1 if today is still open) === elapsedDay
```

Now five numbers on one screen is fine, because they agree. **The rule to carry
to Goals and Recovery, which have the same shape: make the numbers add up
before deciding how many to show.**

Two smaller things fell out of it:

- **`progressDay` was the streak, said twice.** On a strict challenge it
  returned `streakBeforeToday + 1` and was labelled as a day number, which is
  most of why the set read as contradictory. Its only remaining caller was its
  own test, so it is deleted rather than left unused — the CLAUDE.md trap about
  a data module going dead without anything failing, running the other way.
- **Today is not a missed day.** `missedDays` excludes the day in progress. The
  first version did not, and the strip read `Days missed 3` at breakfast.

## Next action

**No page is obviously worth restructuring.** The census (re-run 2026-08-28
against the dev server) says the tallest left are **Pickleball 5.92** and
**Stats 5.21**, and both are long because their analytics are open — which is
the state `docs/pages/` explicitly asked for. Do not treat height as a queue.

Two real candidates, in order:

1. **COD-32 · a design call, not an implementation.** Still open, unchanged
   from the last session. `scripts/solve-contrast.mjs` solved each accent to
   clear 4.5:1 as text, and its output was applied to latte and dawn for green,
   red and peach but **skipped for yellow and pink** — latte yellow measures
   **1.83:1**. It was skipped because the solver's answer for latte yellow
   (`#f29900` → `#8a5700`) lands on top of latte's `peach` (`#9b4c07`), and
   Plan's migration pill and Trackers' completion bands both use red / peach /
   yellow as a **three-step** scale. Collapsing two steps into one brown is a
   real loss. Three options are written up on the ticket. Nothing fails today —
   #157 moved every failing call site off yellow — so this is a trap for the
   next person who writes `cat('yellow')` as text, not a live bug.
2. **COD-37 · rule ticks are switches.** Filed this session out of #161 and
   deliberately left out of it. Ticking "Workout 1" for today is an event, not
   a preference. There is no checkbox primitive in `src/components/ui/`, so it
   needs one — or the bullet glyph the journal already uses — rather than a
   native `<input>` smuggled past `check-design-system.mjs`.

If neither appeals, `node scripts/page-census.mjs` and read it fresh. It is
cheap and it has twice sent work at the right page.

## Traps hit this session

- **The census clamps at 1.00 screens, so "1.00" means "at most one screen",
  not "one screen".** Challenges, Account and Settings all read 1.00 and are
  not the same height. Measuring `#main` directly gave 800px / 0.89 screens.
  Do not diff two 1.00s and conclude nothing changed.
- **A Playwright screenshot of this app is blurred by the onboarding overlay
  unless you set `localStorage['bujo:onboarded'] = '1'` first**, on a load
  *before* the one you are capturing. The first screenshot of the rebuild was a
  frosted-glass rectangle and read as a broken layout. `scripts/a11y-axe.mjs`
  already does this at line 178; borrow from it rather than rediscovering it.
- **`Segmented` renders Radix `ToggleGroupItem`, not `<button>`.** Playwright's
  `getByRole('button', …)` times out on it. Query by text.
- **A dev server was already on 5199 serving this working copy.** Checking
  `Get-CimInstance Win32_Process` before assuming it was a stale worktree saved
  restarting it — the check in CLAUDE.md cuts both ways, and this time the
  answer was "it is fine".

## Verification, as run

Against `http://localhost:5199` (dev server, which sidesteps the
stale-service-worker trap entirely), demo data seeded and asserted present:

- `npx tsc -b` exit 0 · `npx vitest run` **60 files, 831 → 837 tests** ·
  `npx eslint .` 0 errors (2 pre-existing `App.tsx` warnings) · `npm run build`
  clean.
- `npm run a11y` — **0 serious, 0 critical**, both viewports, all five themes.
- `node scripts/verify-folds.mjs challenges` — 0/0 at 1440 and 390, folds open.
- `node scripts/clipped-text.mjs` — no clipped text, 23 views.
- `npm run smoke` — 25/25 views.
- `node scripts/check-design-system.mjs` — passed, 275 files.
- Challenges re-measured on the rendered page, not inferred: **1.41 screens →
  1.00** at 1440 (800px of `#main`), 1.39 at 390.
- Three states opened by hand: no challenge (em dashes and an empty-frame
  line), one challenge, two challenges plus an archived one. The two-challenge
  segments were **clicked**, and all three zones changed — a mode switch that
  only moves a highlight is the failure the contract names, so it is checked by
  clicking rather than by reading.
