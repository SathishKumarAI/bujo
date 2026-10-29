---
name: phone-page
description: Use when making any bujo page work on a phone — "fix this for mobile", "make it fit one screen", "too much scrolling on the phone", "iOS look", "the log button", or a screenshot of the app at phone width. Measures first, applies the phone patterns the owner already accepted (log first, no charts, one screen, selection bar, one row per item, small floating primary), and proves desktop did not move.
---

# Phone page

The owner's rule, 2026-10-28: **a phone logs, a desktop reads.** On a phone:
no charts, the log is first and fits one screen without scrolling, iOS look,
and the desktop does not change at all. Decided by `useDevice()` (width), never
a mode. Background: `CLAUDE.md` "A phone logs, a desktop reads", the
prompt in `docs/MOBILE-BRIEF.md`, the accepted pieces in
`docs/REUSABLE-PATTERNS.md` §28–33, the history in
`docs/sessions/2026-10-29-phone-pages.md`.

## 1 · Measure before touching anything

Playwright, `devices['iPhone 13 Pro']` (390×664 visible), `?demo=1`, with
`localStorage['bujo:onboarded']='1'` set by an init script. Resolve playwright
from the repo: `createRequire('<repo>/package.json')`. Per page record:

| number | how |
|---|---|
| screens | `scrollHeight / innerHeight` |
| first input y | first visible `input, textarea, [role=radio], button[aria-pressed]` in `#main` |
| charts | `svg.recharts-surface, canvas` in `#main` (bars drawn as divs need a look) |
| overflow | `scrollWidth > innerWidth`; controls right of the viewport WITHOUT a scrolling ancestor |
| primary button | its box vs the bottom nav's top — it must be above it |

And the desktop contract at 1440×900: the same numbers, saved, to diff after.

## 2 · Pick the fix, from what was already accepted

| symptom | fix | where it lives |
|---|---|---|
| no visible input / form behind a strip | nothing — `useActColumn` opens on a phone now | `components/page/useActColumn.ts` |
| charts on the phone | flag in the card registry (`chart: true` / `phone: true`), filter in the rail's `idsIn` | `lib/cycleCards.ts`, `lib/focusCards.ts` |
| stacked pickers eating the top | one 44px bar of native `<select>`s | `.select-bar` / `.select-pill`, Program |
| a long list of sub-rows | one row per item + tap counter, opening in place | `.lift-row` / `.set-count`, `SetCards bare` |
| a week of anything | 7-chip day strip + that day below | `.day-chip`, `plan/PlanPhone.tsx` |
| numbers the user repeats | pre-fill from last time AND say "last …", − / +, a next-value hint | `program/phone/programLog.ts` |
| optional fields | a bottom `Sheet` | `ui/sheet.tsx`, Pickleball `QuickLog` |
| a big primary slab | 44px pill at the right in a sticky dock; use the space left of it | `.cta-compact`, `.log-dock`, `.dock-chip` |
| empty bands between cards | `.phone-frame` rule (every phone page) | `styles/phone.css`, `App.tsx` `ViewFrame` |
| a heading that repeats a select | `sr-only` it | Program's focus heading |

The owner's taste, from their own words: wants judgment, not a menu; "all fit
in one space"; "usability is more important"; side-by-side over stacked;
"futuristic", iOS. Propose and build; do not ask which shade.

## 3 · Build it phone-only

- `const phone = useDevice() === 'mobile'` — after every hook; an early
  `if (phone) return <XPhone/>` for a full phone page.
- Styles under `.ios-form`, `.phone-frame` or a new scoped class in
  `styles/phone.css` — **no media query**. Unlayered rules beat utilities;
  weight to 0,3,1 to beat `.ios-form :is(input…)`.
- 44px minimum target. An `aria-label` CONTAINS the visible text
  ("Machine chest press: 2/3 sets done…", not "2 of 3").
- Never `Seg allowNone` on a carried-over value (tap-to-confirm clears it).
- Pure logic out of the component file (fast refresh) with a test named for
  the failure it catches.

## 4 · Prove it

1. Re-run step 1 at 390 (and 375 / 430 if the layout is tight): numbers before
   → after in the PR body.
2. Drive the real flow: tap, log, read back `localStorage` (the key whose value
   contains `"workouts"`), and the row it shows.
3. axe on `#main` at mocha + latte (+ dawn for new colours), with any fold or
   row OPEN.
4. Desktop 1440 probe: unchanged.
5. `npm run verify`, `npm run design`, `npm run contrast` — all exit 0.
6. Screenshot and LOOK at it — the first Program dock covered the last row,
   which no number in step 1 flagged.

## 5 · Ship

A branch per change, stacked on the open phone stack if it extends it; a Plane
item with `repo:bujo` (In Review when the PR opens); conventional commit with
the numbers; a new trap goes into `CLAUDE.md` in the same commit.

**Servers:** dev is `127.0.0.1:5199 --strictPort`. Never stop a server this
session did not start. A server serves the checkout it started in, and a
branch swap under it can leave CSS stale — restart only your own.
