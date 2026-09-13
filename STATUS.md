# STATUS

**Stopped:** 2026-09-13, on `refactor/centre-the-nav-bars` (off `main`). One
commit. `npm run verify` green — **1030 tests across 81 files**, tsc, eslint
(one pre-existing `react-hooks/exhaustive-deps` warning in `App.tsx`, zero
errors), build — plus `clipped` (0 across 24 views at 1440 and 390), `a11y`
(0 serious/critical across 5 themes x 24 views), `smoke` (25/25), `design`
(305 files) and `contrast`.

## Where the redesign is

`DESIGN.md` carries the phase table and the four rules — **read it before
touching any UI here.** Phases 1 (#216) and 2 (#217) are merged, plus the
Mindset content pass (#218). **Phase 3 — Today · Plan · Body · Mind ·
Insights — is next.**

## What this branch did

Both header rows were left-aligned under a tool cluster pinned right, so at
1440px the section names started ~120px in and the actions ended at 1424 —
"where am I" and "what can I do" a full screen apart. Both rows are now
`1fr auto 1fr` from `md` up: section nav mid **721**, tab row mid **720**,
page title mid **720**, window mid **720**.

## Next action

Open the PR against `main`, then start **phase 3**.

## Decisions that will surprise you later

- **`justify-center` on a scrolling tab row is a navigation bug, not a style
  choice.** It distributes *negative* free space too, so an overflowing row is
  pushed off both edges and `scrollLeft` cannot go below zero — the leading
  tabs become unreachable by scrolling, by keyboard, by anything. Body's eleven
  tabs at 1440 put Fitness at a negative x and `npm run a11y` died on "no tab
  with that name inside Body". The row is centred by **auto margins on the
  first and last tab**, which collapse to 0 the moment free space goes
  negative. Do not "simplify" them back to `justify-center`.
- **The centring grid is `md`-and-up on purpose.** `SectionNav` is
  `hidden md:flex`, so on a phone there is no middle column: the grid degrades
  to two equal `1fr` halves, which caps the tool cluster at half the bar with
  no content floor (`minmax(0,1fr)`) and indents the tab row 24px past the page
  gutter. Below `md` both rows stay flex, `-ml-3` included.
- **The `sr-only` heading in row 2 is absolutely positioned**, so it is not a
  grid item and does not consume the middle column. If it ever stops being
  `sr-only`, the tab row moves.

## Still open, unchanged by this branch

- **Mindset (3.29 screens, 0 folds) and Focus (3.08 screens, 0 folds)** are
  flat stacks. Use the `page-contract` skill, not folds by reflex.
- **COD-137** sync-effect consolidation — still the only eslint warning.
- **Two components named `Section`** — `components/pickleball/Section` is a
  near-duplicate of `CollapsibleSection` with no `stickyKey`. Do not merge them
  by name alone.
- **`npm run shots` captures the onboarding modal over every view.** The script
  clicks past the storage gate but never dismisses the first-run tour; set
  `bujo:onboarded` to `'1'` first. Filed, not fixed.
- **Demo data is persisted, not regenerated** — re-seed via Settings -> Data ->
  Load demo data after editing `src/lib/demo.ts`.
- **Plane was down this session** (`localhost:8080` refused), so nothing was
  filed or moved on the board for this branch.
