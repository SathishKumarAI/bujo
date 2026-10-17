# STATUS

**Stopped:** 2026-10-16, on `feat/cycle-pass`, **one PR open**.
Cycle is done. **Challenges is the only page left on the rollout.**

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Recovery (#417, COD-334's predecessor) merged | up to date |
| `feat/cycle-pass` | **open** | COD-334 — the Cycle pass, six commits | pushed |

Nothing is stacked. The PR merges on its own.

## The next action

1. **Merge the Cycle PR** once CI is green — everything in it is green
   locally, including `verify`, `design`, `contrast`, `clipped`, `space` and
   both a11y gates.
2. Then **Challenges** (`views/Challenges.tsx`), the last page on
   `docs/PAGE-ROLLOUT.md`. The order per page is in that file; the parts it
   will want are `useActColumn`/`ActStrip`, `StatGrid`, and an `a11y-panels`
   entry in the same commit as any rail.

## What landed on this branch

Measured at `?demo=1`, mocha, **per rail row**, with the served bundle hash
checked against `dist/index.html` each time. Desktop figures with the act shut:

| row | 1440 before | 1440 after | phone before | phone after |
|---|---|---|---|---|
| This cycle | 1.39 screens | 1.40 | 2.90 | **2.23** |
| How you feel | 1.94 | 1.88 | 3.78 | **3.11** |
| Fertility | 1.59 | 1.52 | 3.15 | **2.48** |
| Patterns | 1.59 | 1.60 | 2.88 | **2.21** |
| Guide | **7.38** | **1.15** | **13.09** | **2.37** |
| Manual | — | 1.19 | — | 1.98 |

The page's worst row: **7.38 → 1.88 desktop, 13.09 → 3.11 phone.**

1. **The act column collapses** — `useActColumn` + `ActStrip`, the last page on
   the contract without them. Review 678 → **846px** at 1440, 854 → **1,326px**
   at 1920; the act 424/520px → a **40px** strip, and a 44px bar stacked.
2. **The manual is its own rail row, as a `CardDeck`** of its nine sections.
   It was 5,435px on a phone inside the Guide row, with its own contents `<nav>`
   — three navigations for one subject. Worst card 5,435 → **827px**.
3. **The Guide row is a deck too** and is now the shortest desktop row.
4. **Zone 3 uses `StatGrid steps="pair"`**, a container query, instead of
   `CardGrid` with a viewport-query cap. COD-247, half fixed — see below.
5. **Zone 1 says what to do** — `nextStep`, seven rules, two with coverage
   floors, every one tested.
6. **`a11y-panels` drives all six rows.** Arming it found a serious
   `label-content-name-mismatch` on twelve rows at once.

`docs/pages/cycle.md` has the full write-up.

## Open, found and not fixed

1. **COD-247's other half.** At 2560 with the act shut the panel is 1,662px and
   the two narrow cards are 821px each. A third column is *not* the answer (no
   group has three non-wide cards — measured, it only shrinks the two); capping
   the card is, and it is a separate change. The ticket is still in Backlog.
2. **`nextStep` lands on `steady` for the demo journal**, so six of its seven
   tones and glyphs have never been rendered by a gate. Unit-tested, not
   *drawn*. Same shape as latte's yellow at 2.02:1 behind a branch the seed
   never took. Fixing it means a seeded journal per branch.
3. **`food` is 2,509px on a phone** — one card of a deck now rather than half a
   row, but still a catalogue of five phases written as five blocks of prose.
   Shorter as rows; that is a content change, not a layout one.
4. **The `Manual` rail row says `1` and the deck says `1 of 9`.** The rail
   counts registered cards and the deck counts sections, so both are true and
   they read as disagreeing. Recovery's STATUS already proposed dropping the
   rail counts outright ("they read as notification badges"); that would settle
   this too.
5. The demo banner eats the top of a phone screen. App-shell, not this page —
   carried over from Recovery's STATUS, still true.

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
