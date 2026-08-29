# STATUS

**Stopped:** 2026-08-29. On `refactor/trackers-row-signal`, clean. **#176**
squash-merged; **#177** open with CI running. `main` is at `9b4d0dd`.

## What this session did

`?view=trackers` — "fix this page, optimise, make it premium".

| PR | What | Ticket |
|---|---|---|
| #176 | Controls pushed off the phone screen with nothing able to scroll to them; the completion heatmap in 81px tracks | COD-80 |
| #177 | Six chips per habit row printing the same number three ways; "no data" drawn as 0% | COD-81 |

## The one thing to carry forward

**There is a second way to hide something, and no gate here could see it.**

`clipped-text.mjs` asks whether an element shows less than it holds
(`scrollWidth > clientWidth`). `npm run a11y` asks whether the accessibility
tree is sound. A button sitting at **x=453 in a 390px viewport** passes both: it
shows everything it holds, its own box is fine, and it is focusable and named.
The clip happens at an *ancestor*, and `document.body.scrollWidth` still reads
390 because it happens above the body. So the Trackers toolbar had seven
controls of which Month, three layouts, the wheel and the settings button were
**unreachable on a phone**, through two green rendering gates.

The check that finds it is "a control outside the viewport with no ancestor able
to scroll it into view". Two things about writing it are worth keeping:

- **The first draft reported 52 hits across 23 views** because it ran over every
  leaf with text — tooltip descenders, SVG `path` nodes, sentences overhanging
  by 40px. All cosmetic. Narrowed to *controls only*, it reported 18, and all 18
  were real. A gate whose red is mostly noise is a gate nobody reads, which is
  the same failure as a gate that is switched off.
- **16 of the 18 were on Stats, not Trackers**, and one class fixed them.
  `CardGrid` had no `grid-template-columns` below 768px; `grid-cols-2/3` expand
  to `repeat(n, minmax(0,1fr))` so those steps were always safe, but the single
  implicit `auto` track sizes to the widest item's min-content and may exceed
  its own container — and **a grid track is shared**. Stats' Activity heatmap is
  a 53-column `table-fixed` with a 398px min-content, so it dragged all six
  sibling cards to 398px inside a 324px box. A card's own `min-w-0` cannot help:
  it is the *track* that overflows, not the item.

Second: **the count is nobody's job until it is somebody's.** The habit row grew
to seven marks in five colours, three of them the same measurement — `53%30d`,
`◆60`, and a letter grade whose own docstring says it is "a thin, pure mapping
over `consistencyScore`". No single commit added more than one. The cap now
lives in `lib/habitRowChips.ts` as the contract of a pure function (`at most
two, in priority order`), so adding a mark means deciding what it outranks.

## Measured

Dev server 5199, demo journal seeded, `#main` scroll height.

| | before | after |
|---|---|---|
| trackers · 1440 | 2463px | **1469px** |
| trackers · 390 | 3742px | **2083px** |
| unreachable controls, 23 views | 18 | **0** |

Every habit row is one line now; several were three.

## Three defects found by writing the checks, not by reading the code

- **`habitComeback` reports `recovering` after a single day.** A habit logged
  once today rendered "↺ back 1d" — a sentence meaning only "you did it today",
  which the cell beside it already said. Three of the eleven demo habits carried
  it. The chip test caught it before the page re-rendered.
- **`monthlyCompletion` and `weekdayConsistency` both ended `count ? sum/count :
  0`**, making "nothing was scheduled" and "you completed nothing" the same
  number. *Monthly trend* opened with `0% · 0%` for the two months preceding the
  first habit's `startedOn` — in the leftmost position, where a trend is read
  from. Both return `null` now, matching `moodByWeekday` immediately below them
  in the same file, which had always drawn the distinction.
- **The existing test passed by accident.** `expect(null).toBeGreaterThanOrEqual(0)`
  coerces and succeeds, so `weekdayConsistency returns 7 values in 0..1` would
  have gone on passing whatever that function returned.

## A false alarm worth recording

**The Mood/Stress/Sleep chart is not broken.** It reads as an empty grid in
full-page screenshots at 1440 because the tool downscales and 2px strokes at
`opacity 0.35` disappear. Confirmed twice — six `recharts-curve` paths with real
`d` values in the DOM, then a native-resolution element screenshot showing a
dense, legible chart. Same for the Category-consistency radar. **Take element
screenshots at native size before believing a chart is empty**; a downscaled
page shot cannot support that claim.

## Next

- **COD-85** — `views/Trackers.tsx` is still ~1000 lines, over the 500 ceiling.
  `CategoryRows`, `RoutineTimeline` and `HabitEditor` are self-contained and
  would leave it near 450. Kept out of #177 to keep that diff reviewable. Do it
  as a pure move and **diff the rendered output**: this is the exact shape of
  the `views/Pullups.tsx` case where an inline rewrite silently dropped eleven
  workout formats with every gate green.
- **`Perfect days` renders two zeroes** on the demo seed. Left alone — a perfect
  day across eleven habits is genuinely rare, so it is not evidence the card is
  broken. Worth a decision, not a hunch.
- **COD-61** — Recovery needs a real IA pass. 3734px, two review sections at
  1121 and 1729px.
- **COD-73** — flat card stacks: pickleball 5379px (18 cards), stats 4685, gym
  4207, help 4021, nofap 3734. Note the `CardGrid` fix above changes phone
  layout on every one of these; re-measure before quoting those numbers again.
- **The store persists the whole journal on every change, undebounced.**
  Unchanged from the last session — `store.tsx` is untouched and every
  write-through field still provokes it. Decide whether a debounce plus a
  `visibilitychange` flush is worth the data-loss surface before filing.

## Environment traps

- **Ports:** 5199 is this repo's dev server, 4173 its preview, and **5173
  belongs to `interview_prep/frontend`**. `scripts/clipped-text.mjs` defaults to
  4173, so pass `BUJO_URL=http://localhost:5199` to run it against the dev
  server.
- **Chrome DevTools MCP and the Claude-in-Chrome extension were both
  unavailable this session** (no browser on the debug port, extension not
  connected). Everything visual here was measured with Playwright scripts
  driving `require('playwright')` out of the repo's `node_modules` — note that
  `createRequire(import.meta.url)` fails from a scratchpad file, so point it at
  the repo's `package.json` instead.
- **`page.evaluate` ships the function source and nothing it closes over.** A
  module-level `const` used inside an evaluated function arrives undefined at
  runtime, not at lint time.
- **A `{/* comment */}` inside a JSX attribute expression is a syntax error** —
  `right={ {/* … */} <div/> }` is two expressions. Use a bare `/* … */`. Vite
  kept serving the last good module, so the page still rendered and a browser
  gate still passed while `tsc -b` was red.
- **`npm run a11y` still cannot see inside a closed fold**, and #177 closes
  Trackers' "Deep analytics" by default. It was re-run with the fold forced open
  via `localStorage['bujo.ui.section.trackers.deepAnalytics'] = '1'`, asserting
  `aria-expanded="true"` and all five inner cards present before scoring —
  otherwise folding a section buys a green report for free. Do that whenever a
  fold's default changes.
- Screenshots need `localStorage['bujo:onboarded'] = '1'` before load, and
  `?demo=1` seeds only into an empty journal.
