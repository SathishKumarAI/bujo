# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-03

## Where I stopped

**`feat/collapsible-header-ux`** — 9 commits, branched off `feat/icon-button-stage1`
(PR #94), **not pushed, no PR open**. If you push it, base the PR on
`feat/icon-button-stage1`, not `main`, or the diff shows six other branches'
commits.

The stack below it is unchanged and still needs merging bottom-up:
`#88 → #89 → #90 → #91 → #92 → #94` → this branch.

Everything verifies green: `npx tsc -b` 0, `npx eslint .` 0 errors / 2
pre-existing warnings, **1416 tests**, `npm run build` clean, `npm run design`
pass, `npm run a11y` 0 serious.

## What this branch did — the fold (§K)

`docs/COLLAPSE-PATTERN.md` is the full record; decisions are D-42/43/44. Short
version:

- **The whole header folds a card**, not just an 18px caret. The caret stays a
  real `<button>` with `aria-expanded` — still the accessible control; the header
  click is a pointer convenience on top. 42 cards and 30 sections inherit it.
- **One caret rotates**; two glyphs no longer swap. Bodies fade in on open.
  Close is deliberately instant — the body unmounts while closed and the
  collapsed-by-default cards carry real weight.
- **Four section primitives became two.** `pickleball/Section` and Settings'
  `Disclosure` deleted; they plus five open-coded inline sections moved onto
  `CollapsibleSection` / `QuietSection`.
- **Two cards had dead titles** — `PenaltyCard` and Gym's "Today's session" both
  hand-rolled a caret into `right` rather than using `Card collapsible`.
- **Plan stopped reserving an empty column.** "Chronically deferred" is
  conditional, so the unconditional two-column masonry left ~800px empty for
  most journals. Setup lost its fold and became an always-open footer with
  eight one-tap rule suggestions.
- **Demo data now has a migration history**, so "Chronically deferred" is
  actually visible in the demo.

## Next

1. **Push this branch and open the PR** against `feat/icon-button-stage1`.
2. **Merge the stack bottom-up.** Seven deep now — the biggest risk on the board.
3. **`graphify hook-rebuild` is refusing to write** — the new graph has 1782
   nodes against a stored 1784 (deleting `pickleball/Section.tsx` shrank it), so
   it wants `force=true`. Left alone because it overwrites tracked state.
4. **Per-view container tiers** — the one Stage 5 item left.
5. **B4** — the app chunk is still 658 kB (193 gzip); recharts at 429 kB is the
   next lever.
6. **§H redesign decisions** — H5, H6, H7, H9, H11, H13 still open.
7. **B1/G1/G2** — the Supabase project returns NXDOMAIN, so every account and
   cloud-sync feature is dead until it is repointed or the env vars unset.

## Traps this session hit, so you don't

- **`npm run a11y` cannot see inside a closed fold.** Unhiding Plan's Setup
  exposed a *critical* `select-name` violation that had been shipping for
  months — axe scans the rendered page, and collapsed content is not on it.
  Read every clean report as "clean for whatever was expanded".
- **`vite preview` serves a stale bundle through its service worker.** Twice a
  screenshot showed pre-change markup against a freshly built `dist/`.
  Unregister the worker and clear caches before believing what you see.
- **A dev server pinned to a worktree keeps serving that worktree's branch.**
  Six stale `vite` processes were running on 5173–5176, 5180 and 5191; the one
  on 5191 served `.claude/worktrees/today-ux` at `feat/today-ux`, so changes
  made here could never appear in the tab pointed at it. All six killed. Check
  which port and which worktree before concluding a change did not land.
- **An audit keyed on how something is drawn misses anything drawn another way.**
  Six folds using typographic `▸ ▾ ▴` matched neither the caret-icon grep nor
  the `aria-expanded` grep, and survived a sweep that claimed to be complete.
- **Demo data is persisted, not regenerated.** Changing `src/lib/demo.ts` does
  nothing for an existing journal — re-seed via Settings → Data → Load demo data.
- **`.caret-turn` is unlayered CSS and beats `@layer utilities`.** A Tailwind
  `transition-*` on the same element silently never runs, and `npm run design`
  does not catch it.

Older traps that still hold — theme flips not invalidating inherited custom
properties, regex renames rewriting prose, `.claude/worktrees/` carrying other
sessions' checkouts, verifying UI in all five themes — are in the git history of
this file (`913f8df`).

**Read next:** `TASKS.md` (the board, §K is this branch) ·
`docs/COLLAPSE-PATTERN.md` (the fold) · `docs/ICON-BUTTON-SYSTEM.md` (the pass
this grew out of) · `docs/ACCESSIBILITY.md` (the rules and the gate's blind spot).
