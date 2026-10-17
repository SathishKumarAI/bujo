# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-followups`, **one PR open**.
**Every page on `docs/PAGE-ROLLOUT.md` is done**, and three of Cycle's four
carried-over items with them.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Cycle (#418) and Challenges (#419) merged | up to date |
| `feat/cycle-followups` | **open** | COD-334's follow-ups — one commit | pushed |

Nothing is stacked.

## The next action

1. **Merge the follow-ups PR** once CI is green. Green locally: `verify`
   (158 files, 2,159 tests), `design`, `contrast`, `clipped`, and
   `a11y:panels` over Cycle's six rows at three theme/viewport pairs.
2. Then **COD-336** — the `maxBarSize` sweep over the nine remaining bar
   charts. It is one prop per `<Bar>`, bounded (the cap only shrinks a bar,
   and only above 180px), and the ticket says to measure a before/after bar
   width per page rather than sweep blind.
3. The rollout itself is finished; there is no page list left.

## What landed on this branch · COD-335

The one page on the rollout whose fault was never length — **1.00 desktop
screens before and after**. Three faults, one shape:

| | before | after |
|---|---|---|
| clickable controls in the review | **1** | **76** |
| 1440 · page | 900px · 1.00 screens | 900px · **1.00** |
| 1920 · page | 1,080px · 1.00 | 1,080px · **1.00** |
| phone · page | 1,347px · 1.60 | 1,714px · **2.03** |
| zone 1 | 53px of four figures | **105px**: a sentence, then the figures |

1. **`challengeNotes` was write-only.** One reader, bound to `today`, so a
   note written this morning could never be read back on any of the other
   seventy-four days. 14 seeded notes across 9 days that nothing could show.
2. **Seventy-five day cells reached nothing.** They were `<li>`.
3. **The review column was 61–75% empty** — a 262px calendar in a 678px column
   at 1440 and a 1,062px one at 1920.

One change for all three: a cell is a button, and the day it opens is a panel
beside the calendar with that day's rules and notes, editable. With no day
picked the column stands on `ruleCompletion` — rule by rule over the elapsed
window, the answer to "I keep missing a day" the page could not give.

Zone 1 gained the `nextStep` sentence; `left` **names** the rules rather than
counting them, because the count was the facts row subtracted eight pixels
below it.

**No rail and no act collapse**, both as measurements rather than inheritance
— the review holds three things, and the page had width spare rather than
width missing. The reasoning is in `docs/pages/challenges.md`.

## Done since · Cycle's carried items, COD-334

Three of the four are closed, and the fourth was retired as not a fault:

1. **COD-247's other half — closed.** It was the MARK, not the card: a bar with
   no ceiling in a 1,662px panel. **212 / 340 / 430px → 180px** at 1440 / 1920
   / 2560. `MAX_BAR` in `chartStyle.ts`.
2. **The `Manual` rail count — closed.** `panels` on the registry entry,
   derived from `CYCLE_MANUAL.length`; the row now says **9** and the deck
   says 1 of 9.
3. **The six undrawn `nextStep` tones — partly closed.** `STEP_TONE` /
   `STEP_ICON` are a typed `Record` in `components/cycle/stepStyle.ts`, so
   `tsc` proves each rule has both, and a canaried test proves each tone is a
   real palette key rather than `cat()`'s mauve fallback. **Still open:**
   seeding a journal per branch so a gate actually renders them.
4. **`food` — retired, not a fault.** 2,509px is the card's own height and no
   reader meets it: the Guide deck's track is the ACTIVE card and the row
   lands on `phases` at 1,089px, 2.37 phone screens. Quoting a card's height
   against a page budget manufactures a fault.

## Open

- **COD-336** — `maxBarSize` on the nine other bar charts.
- **A seeded journal per `nextStep` branch**, Cycle, so six of seven tones are
  rendered by a gate rather than only asserted.

## Open · Challenges, from this pass

- **A past day's notes are editable with no "edited" trace and no undo** —
  the same level the rest of the app sits at, noted rather than fixed.
- **The archive fold is still names and day counts.** Any day of an *active*
  challenge now opens; a finished one's days do not, because the panel is
  bound to the focused active challenge.

## Environment

One preview server was up at the stop: **4310**, started from this worktree.
4173 and 4299 belong to other worktrees — **compare the served
`assets/index-*.js` against your own `dist/index.html`** before believing any
measurement, because every worktree here serves an identical `<title>`.

```
npx vite preview --port 4310 --strictPort &
BUJO_URL=http://localhost:4310 node scripts/a11y-panels.mjs
```

`playwright` and `@axe-core/playwright` are installed on this machine but are
still not in `package.json` (COD-273):

```
npm i -D --no-save playwright@1.64.1 @axe-core/playwright@4.14.0
npx playwright install chromium
```

A throwaway probe must live in the **repo root**, not the scratchpad — ESM
resolves `playwright` relative to the script. Five were written for this pass
and all five are deleted; `git status` was clean before the push.

**`npm run a11y:panels` is 133 rows and some minutes**, and it is still not in
CI. Start it in the background and keep working — and do not `vite build`
while it runs, or it serves a half-written `dist` and reports a view that
"did not load".
