# STATUS

**Stopped:** 2026-08-27. **Zero open PRs, clean tree, `main` at `a646a2e`.**
Seven merged this session: #146 #144 #148 #149 #150 #151 #152.

## What shipped

| PR | What | Ticket |
|---|---|---|
| #146 | The smoke gate runs everywhere, and green | COD-19 |
| #144 | Pickleball: quartile heatmap, one loud control, kitchen-sink states | COD-12 |
| #148 | Pull-ups: a Body tab, the manual restored, a session recorder | COD-13 |
| #149 | `ProgramTracker` opens where you left off; the dead marker draws | COD-20 |
| #150 | Stats: Achievements last, and the lock state has a name | COD-21 |
| #151 | Page heights replaced by a measured census | — |
| #152 | The census counted folds by text, so it missed every card fold | — |

## The three findings worth carrying forward

**1. `531596f` never compiled.** The commit that silently shrank the pull-ups
manual also left four TypeScript errors in `views/Pullups.tsx`, so every CI run
on `feat/pickleball-design` and its base died at `npm run build` before the a11y
job started. That had been read as flaky for two sessions. **A branch that
cannot build is not flaky, and a red base blocks its whole stack.**

**2. `docs/pages/` is largely folklore.** `stats.md`'s headline P1 ("zero charts
render by default") was closed by a rewrite three weeks earlier, and the same
file asked for a heatmap legend two headings below its own note saying the
legend exists. The heights table in `README.md` was wrong by up to 4.3 screens
*in the direction that matters*: Today listed third-tallest, actually
fourth-shortest; Coaching listed short, actually the largest structural problem
in the app. Fixed by `scripts/page-census.mjs` — re-run it, do not quote it.

**3. I then made the same class of mistake in the census itself.** It filtered
`[aria-expanded]` on `textContent`, which excludes every `Card collapsible`
toggle — that button holds a caret glyph, so its name is entirely in
`aria-label`. Coaching read as 14 folds instead of 32, Pickleball 4 instead of
18. Corrected in #152. **`Card collapsible` and `CollapsibleSection` are two
disclosure implementations and only one puts text in its toggle.** Now a
CLAUDE.md trap.

## Next action

**COD-22 · Coaching.** The census outlier and the only page left that matches
`docs/pages/README.md` pattern 3. Measured: **32 disclosure points, 25 shut,
5.80 screens at 1440** (4.27 at 1600), zero charts. The 32 are:

- 6 collapsible `Card`s
- 11 `Expand week N` rows nested inside the 12-week roadmap card
- 14 technique folds nested inside "How to play every shot"

So it is drawers inside drawers: reaching "Third-shot drop" costs two opens and
a scroll. Filed in Backlog, **not started** — it is a page-contract job, and
`page-contract`'s stop gate is the right place to begin.

**The constraint on any restructure:** the page holds `Today: Rest or wall`,
which `docs/pages/README.md` calls the best pattern in the product. It has to
survive, and stay at the top.

## Traps hit this session

- **Squash-merging the bottom of a PR stack deletes the base branch, which
  auto-closes the child PR permanently.** GitHub will not reopen or retarget a
  closed PR whose base branch is gone, so #145 and #147 had to be re-created as
  #148 and #149 with their bodies copied across. Rebase each child with
  `git rebase --onto main <old-base-sha> <branch>` **before** merging its
  parent, or accept re-creating the PR.
- **`npx tsc --noEmit` typechecks nothing here** (solution-style root config).
  Always `npx tsc -b`. Already documented; still the first thing to get wrong.
- **`CountUp` animates through a wrong value.** A `SummaryStrip` tile read 27
  where the store held 30. It is a JS transition, so `document.getAnimations()`
  does not cover it and the `settle()` helper walks straight past it. Wait ~2s.
- The a11y and clipped gates default to `http://localhost:4173` (preview).
  `BUJO_URL=http://localhost:5199` points them at the dev server and avoids the
  stale-service-worker trap entirely. Same variable works for the census.

## Verification, as run

- `npx tsc -b` exit 0 · `npx vitest run` **60 files, 831 tests** ·
  `npx eslint .` 0 errors (2 pre-existing `App.tsx` warnings) · `npm run build`
  clean.
- `node scripts/check-design-system.mjs` — passed, 275 files.
- `node scripts/clipped-text.mjs` — no clipped text, 23 views, 1440 and 390.
- `npm run a11y` — **0 serious, 0 critical**, both viewports, all five themes.
- Stats re-measured on the rendered page after the change, not inferred: first
  chart y=1386 → **814**, Achievements y=254 → **4096**, badges naming their
  lock state 0/14 → **14/14**.
