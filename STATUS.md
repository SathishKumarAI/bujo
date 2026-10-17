# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-act-clarity`, **one PR to open**.
The page rollout is finished. This branch is the second round of reported
changes on Cycle's act column.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | #418 Cycle · #419 Challenges · #420 follow-ups · #421 modernisation, all merged | up to date |
| `feat/cycle-act-clarity` | **not opened yet** | COD-337 round two — two commits | pushed |

## The next action

1. **Open and merge the PR.** Green locally: `verify` (158 files, 2,163
   tests), `clipped`, `contrast`, and `a11y:panels` over Cycle's seven rows at
   mocha, latte and phone.
2. **Answer `docs/QUESTIONS.md`** — what "it still needs to be saved for every
   month" meant. Two readings shipped; the third (a per-month summary card) is
   unbuilt on purpose.
3. **COD-336** — `maxBarSize` on the nine remaining bar charts.

## What landed on this branch

The act column, read back by pasting it in. Four findings, three of them the
same fault: a thing that works with nothing saying where it is.

| | before | after |
|---|---|---|
| flag legend | **214px** of an 807px act column | **23px** |
| day-list glyphs | `∴−`, decoded nowhere a sighted reader looks | a key under the legend |
| day-list header | none — a `title` tooltip was the only key | `Date · Cycle · Temp` |
| optional fields | named only on an empty day | named always |

The glyph key is the sharpest: the marks were `aria-hidden` with an `sr-only`
phrase, so a screen-reader user was told what they meant and a sighted one was
not. And the optional-fields hint was self-erasing — logging a mood replaced
"flow · mucus · LH · cravings · a note" with "mood 3", permanently.

The act now points at `Your log` and the manual, which were rail rows away
from the card you stand in while logging.

## What went wrong, so the next session does not repeat it

- **A commit landed on `main`** — moved to a branch, `main` reset to the merge
  commit. Branch first, every time.
- **A canary that could not fail**: the mark key's test read the glyph from the
  map the key is built from. A derived key is pinned by breaking its filter,
  not its data.
- **A commit shipped over a red test** because an `&&` chain ran `grep` before
  `git commit`. Amended. A grep's exit code is not a test result.

## Open

- `docs/QUESTIONS.md` · what "saved for every month" meant — third reading
  unbuilt.
- **COD-336** — `maxBarSize` on nine bar charts.
- **A seeded journal per `nextStep` branch**, so six of seven tones are drawn
  by a gate rather than only asserted.
- **Home Workout drives its act from a bare `useState`**, which
  `PAGE-ROLLOUT.md` says never to do.
- **COD-247 is reopened for Recovery** — Cycle's half is done, `NoFap.tsx`
  still carries the `2xl:grid-cols-2` pin and the `SPAN_2` coupling.

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
