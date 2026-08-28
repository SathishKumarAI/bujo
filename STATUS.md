# STATUS

**Stopped:** 2026-08-27. **Pull-ups · COD-13** on `feat/pullups-manual`, five
commits, branched off `feat/pickleball-design`.

The ask was "build the pull-ups training manual for this UI — the code is mostly
there, connect it to Body". Both halves turned out to be true and both hid
something.

## What was actually wrong

| # | Found | Fix |
|---|---|---|
| 1 | **The page had no door.** Reachable only by picking Pull-ups on the Fitness activity select and then finding a companion link inside the form | A **Body tab**. `sections.ts` had argued the exemption for three releases — "a pull-up session IS a `Workout`, so it is an activity" — which is true about the record and the wrong subject. `sections.test.ts` carried the same wording in its exempt list, so the "every view has a section" guard passed by being told not to look |
| 2 | **Commit `531596f` silently deleted content.** It re-wrote the workout formats and progressions *inline* in the view instead of importing `lib/pullups.ts`: 14 formats became 3, 9 progressions became 7 rewritten ones, the ability table was dropped | The manual reads the library again. `lib/pullups.test.ts` asserts the counts |
| 3 | **Commit `4a25ff5` pasted a shrunken copy** of three of those cards into `views/Coaching.tsx`, already drifting (kept "3-5 times per day", dropped the reason) | Deleted |
| 4 | The checklist could mark a program day done but **nothing recorded what was pulled** | A session recorder: method + top set + rounds, stored as a plain `Workout` |

**#2 is the one to remember, and it is now a CLAUDE.md trap.** `tsc -b`, eslint,
vitest and `npm run build` were all clean through it — an export nobody imports
is not an error — and the shrunken list still rendered something plausible, so
it was invisible on screen too. **When a view stops importing a data module,
that is the finding.**

## Where things are

- `src/lib/pullups.ts` — all the data plus `repScheme` / `setLines` / `repsOf` /
  `bestSet`. Nothing about pull-ups belongs in the view.
- `src/views/Pullups.tsx` — `PageLayout` three zones. ACT is calculator →
  recorder → `ProgramTracker`; the manual is six closed folds at the bottom of
  REVIEW, not a zone 4.
- A session is a `Workout` with `activity: 'pullups'` and one
  `Pull-up 1xN @ 0kg` line **per set**. Not grouped: `fitness.parseSet` reads
  the reps and drops the leading set count, so `Pull-up 5x3` would count as one
  set everywhere downstream.

## Verification — run, not asserted

All on a `vite --port 5199` dev server, driven with Playwright:

- `npx tsc -b` · `npx vitest run` → **57 files, 815 tests** · `npx eslint .` →
  **0 errors** (2 pre-existing `App.tsx` warnings) · `npm run build` → clean.
- `node scripts/check-design-system.mjs` → passed, 275 files.
- `node scripts/clipped-text.mjs` → no clipped text, 23 views, 1440 and 390.
- `npm run a11y` (mocha, both viewports) → **0 serious, 0 critical**, and
  Pull-ups now appears in the desktop and phone lists.
- **axe again with all six manual folds OPEN**, both widths → 0 serious, 0
  critical. The closed-fold pass proves nothing; that is this repo's own trap.
- End to end: click Body → Pull-ups, log a ladder to 4 for 3 rounds. Preview
  reads `1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4 · 30 reps in 12 sets`; the store
  holds 12 lines totalling 30; zone 1, the history row and the summary tile then
  all read 30. 14/14 formats and 9/9 progressions render, 14 demo links. No
  sideways scroll at 390.

**One measurement lied at first and is worth knowing about:** the summary tile
read `27` where the store said 30. That is `CountUp` mid-animation — it is a JS
transition, so `document.getAnimations()` does not cover it and the `settle()`
helper the a11y gate uses walks straight past it. Wait ~2s before reading any
`SummaryStrip` value.

## Next action

Open the PR against `feat/pickleball-design` (its parent), and move **COD-13**
to In Review.

Then, if continuing: the three upgrades still open in `docs/pages/pullups.md`
all live in `components/ProgramTracker.tsx`, which this branch did not touch —
the program grid opens cold on week 1 with no "you are here" and no "continue",
for a page whose whole promise is "follow this in order". That is shared with
the Program tab, so it is one fix for two pages.

## Traps hit this session

- **`npx tsc --noEmit` typechecks nothing here** (solution-style root config).
  Always `npx tsc -b`. Already in CLAUDE.md; still the first thing to get wrong.
- **`npm run smoke` cannot run on Windows.** `scripts/smoke-views.mjs:49` passes
  `executablePath: CHROME` and CHROME is `/usr/bin/google-chrome-stable`. The
  other three gates do not set it and all run. Filed as **COD-19**, Backlog —
  pre-existing, unrelated to this branch, and quietly skipped until now.
- The a11y and clipped gates default to `http://localhost:4173` (preview).
  `BUJO_URL=http://localhost:5199` points them at the dev server, which avoids
  the stale-service-worker trap entirely.
