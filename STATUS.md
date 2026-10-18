# STATUS

**Stopped:** 2026-10-18, on `main`, **nothing open**. The queue is empty —
every item carried into this session is merged.

## Where it stands

Thirteen PRs merged across the two days (#418–#433). `main` is clean, the
working tree is clean, no branch is outstanding.

| PR | what |
|---|---|
| #429 | every Recharts bar capped — and two of the nine listed files had no chart in them |
| #430 | Pickleball's history editor renders the real form, not 5 of its 14 fields |
| #431 | the 22 help tips are points; three rewritten rather than split |
| #432 | doubles has two opponents — and the seed had two dead branches |
| #433 | a log row opens that day in a window |

## The next action

Nothing is queued. The honest list of what is *known* and unbuilt:

1. **`docs/QUESTIONS.md`** — what "it still needs to be saved for every
   month" meant. Two of three readings shipped; the third (a per-month
   summary card) is unbuilt on purpose rather than guessed at.
2. **A seeded journal per `nextStep` branch** on Cycle, so six of its seven
   tones are *drawn* by a gate rather than only asserted. The one remaining
   known instance of "a branch the seed never takes cannot fail".
3. **Home Workout's act is a bare `useState`**, which `PAGE-ROLLOUT.md` says
   never to do. A correctness nit, not a visible fault.
4. **COD-247 is reopened for Recovery.** Cycle's half shipped; `NoFap.tsx`
   still carries the `2xl:grid-cols-2` pin and the `SPAN_2` coupling. The
   recipe is in a comment on that ticket.
5. **Challenges' day panel** could host the new `DayWindow` instead of
   sitting beside the calendar — COD-335 left it there for want of exactly
   the dialog #433 just built.

## What this session found that nobody reported

- **Two of the nine files in the `maxBarSize` sweep had no chart in them.**
  Their `<Bar>` is a local component of the same name. A first pass replaced
  those too and `tsc` caught it — two things with one name are two things,
  and a grep for a component name walks straight into that.
- **The pickleball seed had unreachable branches.** The loop steps `i += 3`
  from 1, so `i % 3` is always 1: the `'Dan & Priya'` and `undefined` arms of
  the opponent conditional, and two arms each of location and level, had
  never once executed. A dead branch in the seed is the quiet version of this
  repo's most-repeated trap.
- **Two ticket premises were wrong**, both found by checking rather than
  building: `CYCLE_HELP.text` does not feed the Help page (one consumer, not
  two), and the app *does* have an editing dialog with five callers. Both
  turned a careful change into a small one.

## Standing traps this session paid for again

- **`git checkout <file>` wiped uncommitted work twice** while reverting a
  canary. Copy the file first. The canary is worth running; the undo is what
  bites.
- **A canary that cannot fail.** Twice: a key built from the map it asserts
  against, and a glyph read from one source on both sides. A derived thing is
  pinned by breaking its *producer*, not its data.
- **`{value}` on a `string[]` compiles and paints the lines concatenated.**
  Three separate times in the prose sweep. `tsc` never says a word; only the
  rendered page or a test does.
- **A commit shipped over a red test** because an `&&` chain ran `grep`
  first. A grep's exit code is not a test result.

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
