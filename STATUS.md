# STATUS

**Stopped:** 2026-08-16, on `feat/header-scroll-collapse` — stacked on
`refactor/one-nav-bar` (PR #120). All gates green, nothing in flight.

## Where the work stopped

Two branches, in order:

| Branch | PR | What |
|---|---|---|
| `refactor/one-nav-bar` | #120 | Rail deleted; navigation is a two-row top bar |
| `feat/header-scroll-collapse` | — | Row 1 folds on scroll; `TopBar` split into `topbar/` |

Reasoning lives in the commit bodies and in
`docs/sessions/2026-08-16-one-nav-bar/` (PROMPTS.md + PLAN.md) — not repeated
here.

## Next action

Open the PR for `feat/header-scroll-collapse` against `refactor/one-nav-bar`,
then merge #120 first (or retarget).

Then, the agreed next branch: **the 12-Week Hypertrophy Block as its own Body
tab.** Scoped at the end of `docs/sessions/2026-08-16-one-nav-bar/PLAN.md` —
what exists, the four-file checklist, and the two decisions to settle first
(Body would reach eight tabs; `ProgressPhotos` shares the collapsible that
would move).

Smaller, still open:

1. `src/components/shell/` has 16 files and no README, while five other
   component dirs have one. The new `topbar/` has one.
2. `PageLayout.tsx`'s `window.innerHeight - 64` slack is a second, independent
   model of header height. Still conservative against the ~55px folded header,
   so it was left alone.
3. `TodayPlanCard.tsx` hardcodes `pullup-zero` for program progress, so the
   hypertrophy block never reaches Today's chip.

## Traps hit on the way (the ones not already in CLAUDE.md)

- **`overflow-x-hidden` makes an element a scroll container.** Non-`visible` on
  one axis forces the other to `auto`. `<main>` had it, so every
  `position: sticky` child stuck to a scrollport that never scrolls — Mindset's
  `LibraryBar`, Today's mobile `CaptureBar` and the page contract's act column
  were all inert, for months, while reading `--header-h` correctly. Use
  `overflow-x: clip` when you only want clipping. Symptom: the bar reads
  -544px instead of clamping.
- **A header that changes height fights scroll anchoring.** Collapsing chrome
  that sits in flow shortens the content above the reader; the browser moves
  `scrollY` to compensate; a scroll listener reads that as the user scrolling
  the other way and flips back. The result oscillates forever off one scroll
  (`44 → 25 → 9 → 35 → 24 …`). Fixed with a 450ms settle window in
  `useHideOnScroll`, not by disabling `overflow-anchor` — this app lazy-loads
  charts everywhere and anchoring is what keeps them from shoving content.
- **`grid-template-rows: 0fr` does not collapse without `min-height: 0`.** Grid
  items default to `min-height: auto`, which floors the track at min-content —
  measured 27.4px, so the row folded 44 → 34.7 and stopped.
- **`settings.layout` was two decisions in one key** (which nav *and* which
  Today). Read every consumer before changing a flag.
- **The devtools screenshot can return a stale frame.** Two inline captures
  showed an unfolded header while the DOM measured folded; writing the
  screenshot to a file gave the true frame. Trust the measurement, and save to
  disk when the picture matters.
- Dev server on 5200 this session (other worktrees hold 4173/5174/5199). The
  Chrome extension MCP was not connected; `chrome-devtools` MCP worked.
