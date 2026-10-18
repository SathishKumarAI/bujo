# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-one-box`, **one PR to open**.
Cycle's fourth round of reported changes — the SaaS-polish pass.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | #418–#423 merged | up to date |
| `feat/cycle-one-box` | **not opened yet** | COD-337 round four — one commit | local |

## The next action

1. **Open and merge the PR.** Green locally: `verify` (158 files, 2,166
   tests), `clipped`, `design`, `contrast`, `a11y:panels`.
2. **Answer `docs/QUESTIONS.md`** — what "saved for every month" meant.
3. **COD-336** — `maxBarSize` on the nine remaining bar charts.
4. **The rest of the prose sweep** — `cycleHelp` and `cycleManual`, 27
   multi-sentence strings. `CYCLE_HELP.text` feeds popovers *and* the Help
   page, so check consumers first.

## What landed on this branch

| | before | after |
|---|---|---|
| month stepper | app top bar | inside zone 1's block |
| orientation | a block in zone 1 **and** a strip at the head of zone 3 | one box |
| flag colours | five pills always drawn + a separate glyph key | one named row, both keys behind it |
| the two fold rows | three lines and two | **one line each** |

`viewChrome` drops `dateNav` for this view so there is one stepper, not two
for one cursor. `SummaryStrip` is gone from zone 3. Both disclosure rows are a
non-shrinking title, a muted value pushed right, and the same caret on the
same side — the `▸` text glyph became the app's own rotating `CaretRight`.

**`npm run clipped` caught the dishonest half of "make it one line":** the
collapsed summary needed **265px in a 114px slot**, hiding three of the five
things logged. Fixed by fitting the content (`mood 3 · energy 3 · +3`), not by
`data-clip-ok`.

## Open

- `docs/QUESTIONS.md` · what "saved for every month" meant.
- **COD-336** · `maxBarSize` on nine bar charts.
- **`cycleHelp` and `cycleManual` prose** — 27 multi-sentence strings.
- **A seeded journal per `nextStep` branch.**
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
