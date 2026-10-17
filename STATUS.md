# STATUS

**Stopped:** 2026-10-17, on `feat/challenges-pass`, **one PR open**.
**Every page on `docs/PAGE-ROLLOUT.md` is done.**

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Cycle (#418, COD-334) merged | up to date |
| `feat/challenges-pass` | **open** | COD-335 — the Challenges pass, three commits | pushed |

Nothing is stacked.

## The next action

1. **Merge the Challenges PR** once CI is green. Everything in it is green
   locally: `verify`, `design`, `contrast`, `clipped`, and `a11y` (187 scans,
   0 serious/critical).
2. Then **Cycle's four open items** (below). They are the only measured,
   ready-to-start work left; the rollout itself is finished.

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

## Open · Cycle, from COD-334

Still the four its own pass left, in the order I would take them:

1. **COD-247's other half.** At 2560 with the act shut the review panel is
   1,662px and the two narrow cards are **821px each**. A third column is not
   the answer (no group has three non-wide cards — measured: it only shrinks
   the two and leaves a dead track); capping the card is. Ticket in Backlog.
2. **`nextStep` lands on `steady` for the demo journal**, so six of its seven
   tones and glyphs have never been *rendered* by a gate — unit-tested only.
   The "a branch the seed never takes cannot fail" shape. Needs a seeded
   journal per branch.
3. **`food` is 2,509px on a phone** — one card of a deck now, but still five
   phases written as five blocks of prose. Shorter as rows; a content change.
4. **The `Manual` rail row says `1` and its deck says `1 of 9`.** Both true
   (the rail counts registered cards, the deck counts sections) and they read
   as disagreeing. Recovery's STATUS already proposed dropping the rail counts
   outright, which would settle it.

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
