# STATUS

**Stopped:** 2026-09-12, on `refactor/layered-depth-tokens` (off `main`). Four
commits, all verified together at the end: `npm run verify` green — **1020
tests across 80 files**, tsc, eslint (one pre-existing
`react-hooks/exhaustive-deps` warning in `App.tsx`, zero errors), build — plus
all four visual gates: `contrast`, `design` (304 files), `a11y` (**0
serious/critical** across 5 themes x 24 views), `clipped` (0 across 24 views at
1440 and 390) and `smoke` (25/25).

## What this branch did

**Phase 1 of a five-phase redesign.** The brief was "the UI looks like a 1990s
website"; the cause was already written down in `src/styles/tokens.css`. A past
"Modernist" pass set all three radius tokens to `0rem`, removed every fill, and
left a 1px hairline as the only way anything was bounded.

`PRODUCT.md` (product truth) and `DESIGN.md` (the visual world, "Layered
Depth") are new at the repo root. **Read `DESIGN.md` before touching any of
this** — it carries the four rules and the phase table.

1. **Elevation was upside down.** `--card` aliased `--color-mantle`, which sits
   *below* `--color-base` in all three dark themes. Cards sank into the page.
2. **Depth is `--shadow-raise/lift/float`** — one decision, five sets of
   ingredients. `.card-3d` and four per-theme overrides collapsed into it.
3. **Radius 0/0/0 -> 10px/16px/full**, and 242 hard-coded `rounded-none` call
   sites swept back onto the three tokens.
4. **Controls get a fill**; 63 grey-outlined, page-coloured boxes became real
   surfaces. Habit chips now say hue-is-identity, fill-is-state.

## Next action

Open the PR against `main`, then **Phase 2: the shell** (header, nav, page
frame). Unchanged from before this branch:

- **Mindset (3.29 screens, 0 folds) and Focus (3.08 screens, 0 folds)** are
  flat stacks. Use the `page-contract` skill, not folds by reflex.
- **COD-137** sync-effect consolidation — still the only eslint warning.
- **Two components named `Section`** — `components/pickleball/Section` is a
  near-duplicate of `CollapsibleSection` with no `stickyKey`. Do not merge them
  by name alone.

## Decisions that will surprise you later

- **`washStyle()` solves for TWO grounds now**, not one. Its default was
  `base`, which was only ever conservative while the card was *darker* than the
  page — i.e. only while the elevation bug was in place. The moment cards lifted,
  twenty axe violations appeared, every one a wash pill and none of them new
  markup. Which ground is harder flips with the theme's polarity, so it solves
  for `base` and `surface0` and keeps whichever demands more. **Pass the actual
  surface when you know it.**
- **`colors.test.ts` asserted that grid against `base` alone**, so it stayed
  green through all twenty. It asserts both grounds now. A per-theme colour
  constant tuned against one surface is a latent failure the moment that surface
  moves — two of the four `--danger-text` values this branch re-solved were
  *already* failing on `main`, at 4.50 and 4.41, with no gate pointed at them.
- **Three `rounded-none` survive on purpose.** The Trackers month grid is a data
  matrix (a 10px radius on a 14px cell is a dot), and two are variant-prefixed
  Radix rules that square the *inner seams* of a joined segment group. Do not
  sweep them.
- **A three-line context window is enough to misclassify.** The radius
  classifier claimed Goals' progress bar as a `<Button>` because a real Button
  sat three lines above it, and claimed a modal sheet as a control for the same
  reason. Both were caught by reading the buckets before applying. If you re-run
  that sweep, read the classification, do not trust the counts.
- **`--edge-light` is `transparent` in latte and dawn** and that is deliberate:
  a 1px white highlight on white paper is nothing, and their hairline border
  already separates. Do not "fix" it by giving them one.
- **Demo data is persisted, not regenerated** — re-seed via Settings -> Data ->
  Load demo data after editing `src/lib/demo.ts`.
- **`npm run shots` captures the onboarding modal over every view.** Every
  screenshot in `docs/screenshots/` from the last refresh is a shot of the
  first-run tour with the app blurred behind it. The script clicks past the
  storage gate but never dismisses the tour; set `bujo:onboarded` to `'1'`
  first. Filed, not fixed here.
