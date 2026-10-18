# STATUS

**Stopped:** 2026-10-18, on `main`, **nothing open**. Seven PRs merged today
(#418–#427). The queue below is what was reported and deliberately not built.

## The next action

Work the queue in this order — the first two are dependencies of the rest.

1. **COD-348 · Pickleball's history editor is a five-field subset of a
   fourteen-field form.** Switching a session to doubles there offers no
   partner — nor opponent, location, level, points or scoring. **Not data
   loss**: `updatePickleball` merges a `Partial<>`, so the hidden fields
   survive, which rules out the expensive fix. The editor should host the
   real form instead of re-declaring part of it.
2. **COD-350 · A log row should open the day in a window.** Tapping a row in
   `Your log` selects a day whose editor is in the act column — the other
   side of the page on a desktop, a collapsed strip on a phone. Needs a
   focus-trapped editing dialog, which the app does not have; Challenges wants
   the same one, so it belongs in `components/page`.
3. **COD-349 · Doubles needs a team, not one opponent.** `partner?: string` +
   `opponent?: string` cannot hold four people. A schema change — use the
   `data-engineer` agent, and settle whether a record is against a PAIR or
   against each PLAYER before writing anything.
4. **COD-336** · `maxBarSize` on the nine remaining bar charts.
5. **The rest of the Cycle prose sweep** — `cycleHelp` and `cycleManual`, 27
   multi-sentence strings. `CYCLE_HELP.text` feeds popovers *and* the Help
   page, so check consumers first.

## What shipped today

| PR | what |
|---|---|
| #418 | Cycle onto the contract — worst row 7.38 → 1.88 desktop screens, 13.09 → 3.11 phone |
| #419 | Challenges — the review went from **1 interactive control to 76** |
| #420 | Cycle follow-ups — bar widths 430 → 180px, the rail count made true |
| #421 | `actTop`, subtitles that say what is in the card, `Your log` |
| #422 | the act column read back — a key for the glyphs, names for the columns |
| #423 | the guide is points, not paragraphs |
| #424 | one box at the top, the month beside what it changes |
| #425 | nine chip groups became three sections |
| #426 | `ChipPick` draws an ordered rating as a segmented track |
| #427 | the scale names the value, the countdown is the headline |

## Reported and answered with a reason, not code

These are in the reply and are **not** queued, because building them would
have the page claim something untrue:

- **Mood tags as a 1–5 scale.** The seven words are a SET, not an order — you
  can be calm and sensitive at once, and "is anxious a 5 or a 1?" has no
  answer. Ordering them invents a claim the data cannot support.
- **A scroll-to-fill dial.** Slower and less accurate than five segments for a
  1–5 value, and a custom `role="slider"` with keyboard and touch support is a
  large build to replace something that works. The part of the ask that was
  real — "tell me what 3 means" — shipped in #427 as `scale.words`.
- **Mood and Energy side by side.** Two tracks in a 384px column is five
  segments of ~36px, under the 44px target floor COD-96 is open about and
  which #426 just established for this control.

## Open

- `docs/QUESTIONS.md` · what "saved for every month" meant — third reading
  (a per-month summary card) unbuilt on purpose.
- **A seeded journal per `nextStep` branch**, Cycle.
- **Home Workout's act is a bare `useState`.**
- **COD-247 reopened for Recovery.**

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
