# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-guide-points`, **one PR to open**.
Cycle's content pass — points, and the "how do I mark it" question answered
on its second asking.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | #418 · #419 · #420 · #421 · #422 all merged | up to date |
| `feat/cycle-guide-points` | **not opened yet** | COD-337 round three — two commits | local |

## The next action

1. **Open and merge the PR.** Green locally: `verify` (158 files, 2,166
   tests), `clipped`, `design`, `a11y:panels`.
2. **Answer `docs/QUESTIONS.md`** — what "saved for every month" meant.
3. **COD-336** — `maxBarSize` on the nine remaining bar charts.
4. **The rest of the prose sweep.** `lib/cycleHelp.ts` (the ⓘ tooltips, 2–3
   sentences each) and `lib/cycleManual.ts` (point texts running 130–161
   chars) are the 27 multi-sentence strings still standing. Same treatment,
   their own change — `CYCLE_HELP.text` feeds popovers and the Help page, so
   it needs its consumers checked first.

## What landed on this branch

**The guide is points.** Swept first: 91 strings over 120 characters, 36 of
them two or more sentences; the worst a 456-character luteal `eat`. All five
`CyclePhase` fields are `string[]`, both renderers updated — `{ph.what}` on a
list compiles and paints the lines concatenated, so the data change alone
would have made it worse.

| card | before | after |
|---|---|---|
| `food`, 1440 | 1,434px | **1,428px** |
| `food`, phone | 2,509px | **3,044px** |
| `phases`, phone | 1,089px | 1,392px |

Desktop level, **phone +535px for scannability** — the honest cost of bullets.

**"How can I mark it?" asked twice.** The first fix put the field names in the
grey hint; the title still said "Mood, energy & symptoms". It is `Mood,
energy, mucus, LH & more` now, in the panel's own order, and the mark key says
where the marks are set.

## What went wrong

- **`git checkout <file>` wiped uncommitted work twice** while reverting a
  canary. Copy the file first, or stash — the canary is worth running and the
  undo is what bites.
- **A canary that could not fail**, again: the first version asserted a glyph
  read from the map the key is built from.

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
