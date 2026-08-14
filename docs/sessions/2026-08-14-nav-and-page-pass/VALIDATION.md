# Validation

All gates run on the final tree of `fix/nav-audit-ui-pass`.

## Gates

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc -b` | clean (**not** `--noEmit` — the root config is solution-style and always exits 0) |
| Tests | `npx vitest run` | `Test Files 52 passed (52)` · `Tests 755 passed (755)` |
| Lint | `npx eslint .` | clean on changed files; 2 pre-existing `exhaustive-deps` warnings in `App.tsx` sync effects, untouched |
| Build | `npm run build` | succeeds; PWA precache 53 entries / 2001.96 KiB. Pre-existing >500 kB chunk warning, unchanged |
| a11y | `npm run a11y` | **No serious or critical violations** across 28 view/theme combinations |
| Design system | `npm run design` | `Design-system check passed (236 files).` |
| Clipped text | `npm run clipped` | `No clipped text across 23 views.` |

`npm run a11y` needs `npm run preview` running on :4173 first — it fails
`ERR_CONNECTION_REFUSED` otherwise, which is a missing server, not a passing gate.

The a11y sweep covers `Body · Strength` and `Body · Pickleball`, so the two views
restored to the classic rail are checked, not just reachable.

755 includes the four new assertions in `classicNav.test.ts`; the pre-change count
was not run on `main`, so treat 755 as the figure for this branch rather than as a
delta. No worktrees existed under `.claude/worktrees/` during these runs, so the
count is not inflated by a second copy of the suite.

## Before / after, measured in the browser with demo data

| What | Before | After |
|---|---|---|
| Classic rail destinations | 16, no Strength, no Pickleball | 18 |
| Section tab row on `?view=nofap` @501px | `scrollLeft 0`, active tab clipped | `scrollLeft 79/80`, fully visible, page unscrolled |
| Insights ⓘ buttons visible @1440 | 17 | 0 (all 17 still on phone, where the subtitle is not drawn) |
| Coaching ⓘ buttons visible @1440 | 8 | 8 (real `help`, correctly kept) |
| Bar tracks of height 0 — Trackers | 13 of 13 | 0 of 13 |
| Bar tracks of height 0 — Insights | 13 of 13 | 0 of 13 |
| Insights inner masonry @1440 | 2 columns × 213px | 1 column × 446px |
| Mindset masonry @1440 | 2 columns × 446px | unchanged |
| Plan week-strip entries clipped | 16 of 16 | 0 of 16 |

## Guard test proven to fail

Removing the `gym` row from `CLASSIC_NAV` again:

```
AssertionError: expected [ 'gym' ] to deeply equal []
  19|     expect(missing).toEqual([])
Tests  1 failed | 3 passed (4)
```

Restored afterwards. A guard that has never been seen to fail is not a guard.

## Not verified

- Latte theme (out of scope).
- True 390px — see `BACKLOG.md` B8. Phone figures are at 501px, Chrome's minimum
  window width on this machine.
- The 22 views outside the agreed six, except where a shared fix landed on them
  (`Reading`, `Trackers`, `Mindset`, `Coaching`), which were each re-measured.
