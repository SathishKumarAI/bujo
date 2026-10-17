# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-modernize`, **one PR open**.
The page rollout is finished; this is the reported-changes pass on Cycle.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Cycle (#418), Challenges (#419), Cycle follow-ups (#420) merged | up to date |
| `feat/cycle-modernize` | **open** | COD-337 — two commits | pushed |

## The next action

1. **Merge the PR** once CI is green. Green locally: `verify` (158 files,
   2,161 tests), `design`, `contrast`, `clipped`, and `a11y:panels` over
   Cycle's **seven** rows.
2. **Answer the open question in `docs/QUESTIONS.md`** — what "it still needs
   to be saved for every month" meant. Two of the three readings are shipped;
   the third (a per-month summary card) is not built, deliberately.
3. **COD-336** — the `maxBarSize` sweep over the nine remaining bar charts.

## What landed on this branch · COD-337

Eight things reported in two messages. Six shipped, one answered by
measurement, one abandoned with its reason:

1. **`actTop`** — the log starts at the top, beside zone 1, which is now one
   block (§22). The note that said actTop "buys nothing" was measuring height
   and the ask was about placement.
2. **Every subtitle says what is in the card**, not why the card exists —
   "Your four phases, sized by your own 29-day average" for "The cycle as one
   shape, not a line that restarts every month", and five more. Same for the
   six rail blurbs.
3. **`Your log`, a new rail row** — `CyclePoint` carries fourteen fields and
   the month list drew four, so ten could be filled in and never seen again.
   Tapping a row opens that day in the editor and moves the month cursor.
4. **The act names the month it writes to**, with "Back to today".
5. **The temperature chart follows the month you are browsing.**
6. **The temperature line breaks at a missed morning** — a reversal, asked
   for directly.
7. **"Saved for every month" was not data loss** — verified in a browser,
   every month renders its own rows. See `docs/QUESTIONS.md`.
8. **Remembering the selected day per month: abandoned.** Three lines, and
   the React Compiler refuses the whole component over it.

**Two gates caught two real defects**, both in the new row and both found
because it was armed in the same commit: a 3.83:1 selected-row contrast and a
`label-content-name-mismatch` from an `aria-label` that named less than the
row paints.

## Open

- `docs/QUESTIONS.md` · what "saved for every month" meant — the third
  reading, a per-month summary card, is unbuilt on purpose.
- **COD-336** — `maxBarSize` on the nine other bar charts.
- **A seeded journal per `nextStep` branch**, so six of seven tones are drawn
  by a gate rather than only asserted.
- **Home Workout drives its act from a bare `useState`**, which
  `PAGE-ROLLOUT.md` says never to do. Found while checking what the "like
  home workouts" ask referred to; not fixed.

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
