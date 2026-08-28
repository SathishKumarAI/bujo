# STATUS

**Stopped:** 2026-08-28. **Zero open PRs, clean tree, `main` at `1beb9a7`.**
Nine merged this session: #146 #144 #148 #149 #150 #151 #152 #153 #154.

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

**COD-23 · Recovery (`nofap`).** The census outlier now that Coaching is done:
**6.33 screens at 1440 and 6.33 at 1600, 0 folds, 3 charts.** Identical at both
widths means the third grid column does nothing for it — it is one long
vertical stack with no shape to reason about and nothing to collapse.

The opposite failure to COD-22: Coaching had too many drawers, Recovery has
none. **Mindset (3.29), Focus (3.04) and Help (4.47) share the shape** — over
three screens, zero folds, equal at both widths — so whatever fixes Recovery
probably generalises to those three.

Two constraints: `docs/pages/README.md` names Recovery's tone and its HALT check
as assets to protect, and the a11y gate found a contrast bug here the moment the
page was added to its `VIEWS` list — so re-run `npm run a11y` on any change.

**Open question for the next session, not a defect:** #154 re-closed five
reference folds on Coaching, and `4609317` had opened every fold app-wide on an
explicit "keep the dropdowns open" request. The narrow reading — reference
content closed, personal content open — is argued in `docs/pages/coaching.md`
and made survivable by `stickyKey`, but it is a decision worth confirming
before it is applied anywhere else.

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
- Coaching re-measured the same way: **5.80 screens → 2.19**, 32 disclosure
  points → 17. `node scripts/verify-coaching.mjs` re-opens the folds and re-runs
  axe at 1440 and 390 — **0 serious, 0 critical** — because `npm run a11y`
  cannot see inside a closed fold and so vouches for nothing that #154 closed.
