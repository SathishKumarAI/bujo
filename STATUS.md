# STATUS

**Stopped:** 2026-08-28. **Zero open PRs, clean tree, `main` at `588dc00`.**
Fourteen merged this session: #146 #144 #148 #149 #150 #151 #152 #153 #154 #155
#156 #157 #158 #159.

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
| #153 | STATUS, and the two traps the session cost time to find | — |
| #154 | Coaching rebuilt on the three-zone contract, 5.80 screens → 2.19 | COD-22 |
| #155 | STATUS: Coaching done, Recovery next | — |
| #156 | Recovery: fold Setup and Reference, 6.33 screens → 4.15 | COD-23 |
| #157 | **The a11y gate ran on an empty journal.** Armed it; fixed the 16 it hid | COD-28 |
| #158 | STATUS: the gate was measuring an empty app | — |
| #159 | Reconcile the docs — `ACCESSIBILITY.md` had recorded the bug as the fix | — |

## The findings worth carrying forward

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

**3. Every green a11y run this project has ever printed was partial.** The gate
seeded an empty journal, so every card behind a `{rows.length > 0 && …}` guard
was absent from the DOM and could not fail. Arming it turned one green run into
**16 serious violations** in four of five themes. Three causes: `cat('crust')`
used as a foreground where `onAccent()` exists (a helper with 2 adopters against
21 hand-written call sites); the accent-on-wash idiom calibrated at `'22'` and
written as `'33'`; and `solve-contrast.mjs` having only ever solved the two
light themes. All fixed, gate now armed and green.

**4. I made the same class of mistake in the census itself.** It filtered
`[aria-expanded]` on `textContent`, which excludes every `Card collapsible`
toggle — that button holds a caret glyph, so its name is entirely in
`aria-label`. Coaching read as 14 folds instead of 32, Pickleball 4 instead of
18. Corrected in #152. **`Card collapsible` and `CollapsibleSection` are two
disclosure implementations and only one puts text in its toggle.** Now a
CLAUDE.md trap.

## Next action

**COD-32 · a design call, not an implementation.** `solve-contrast.mjs` solves
each accent to clear 4.5:1 as text; its output was applied to latte and dawn for
green, red and peach and **skipped for yellow and pink**, which are still the
unsolved originals — latte yellow measures **1.83:1**.

It was not simply applied because the solver's answer for latte yellow
(`#f29900` → `#8a5700`, a 43% darkening) lands visually on top of latte's
`peach` (`#9b4c07`), and Plan's migration pill and Trackers' completion bands
both use red / peach / yellow as a **three-step** scale. Collapsing two steps
into the same brown is a real loss. Three options are written up on the ticket.

Nothing fails on it today — #157 moved every failing call site off yellow — so
this is a trap for the next person who writes `cat('yellow')` as text, not a
live bug.

After that, the census picks the next page: **Pickleball 5.92** and **Stats
5.21** are the tallest left, and both are long because their analytics are open,
which is the state this directory asked for. There may be no page worth
restructuring right now. Run `node scripts/page-census.mjs` and see.

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
- Coaching **5.80 screens → 2.19**, 32 disclosure points → 17. Recovery
  **6.33 → 4.15**.
- `node scripts/verify-folds.mjs <view>` re-opens the folds and re-runs axe at
  1440 and 390 — 0/0 for both `coaching` and `nofap`. `npm run a11y` cannot see
  inside a closed fold, so it vouches for nothing #154 and #156 closed.
- **`npm run a11y` — 0 serious, 0 critical, with the seed armed.** That number
  now means something it did not this morning: it was 16 the moment the gate was
  given data.
- `npm run smoke` — 25/25 views.
