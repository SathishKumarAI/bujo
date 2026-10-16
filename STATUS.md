# STATUS

**Stopped:** 2026-10-16, on `feat/recovery-pass`, **one PR open** (#417).
Recovery is done; Cycle is the last page on the contract.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Nutrition (#414), the account-menu name (#413), the a11y gate (#415) and Nutrition's follow-up (#416) all merged | up to date |
| `feat/recovery-pass` | **#417** | COD-334 — the whole Recovery pass, nine rounds of it | pushed, CI green on the earlier commits, **not merged** |

Nothing is stacked. #417 merges on its own.

## The next action

1. **Merge #417.** The last commits were still building at the stop — check
   `gh pr checks 417` once and merge on green. Everything in it is green
   locally, including both a11y gates.
2. Then **Cycle** (`views/Cycle.tsx`, 593 lines), the last page.
   `docs/PAGE-ROLLOUT.md` has its first move: arm `a11y-panels` for its rail,
   then sub-sections on the long row. **Reach for `CardDeck` (§30)** — Cycle's
   longest row is the same shape as the nine-card `Patterns` row it was built
   for.
3. Challenges is the only other page left on the rollout.

## What landed in #417

The three-zone contract pass plus nine rounds of reported changes. Measured at
`?demo=1` each time, with the served bundle hash checked against
`dist/index.html`:

| | before | after |
|---|---|---|
| page, desktop | 1,653px · 1.84 screens | **1,129px · 1.25** |
| page, phone | **5,116px · 6.06 screens** | **1,581px · 1.76** |
| act column, phone | **2,822px** | **41px** strip |
| `views/NoFap.tsx` | 416 → 613 mid-pass | **433** |

- **`actTop`** — one prop answering both "shrink it to the left side" and
  "move the log to the top": zone 1 takes the review column's width, the act
  runs from y87.
- **One card for three acts** (`LogCard`), one picker instead of two that
  overlapped, intensity as five buttons rather than a slider.
- **`CardDeck`** — one card at a time, and `a11y-panels` now steps every card
  of every deck (`9/9` in its table).
- **Discreet mode** — a display-only label swap that says on the toggle that
  it is not security.
- **Sourced coping content** — urge surfing, cyclic sighing, movement, HALT,
  the abstinence violation effect, and what a reset costs today in the
  reader's own numbers.

**Six pre-existing defects fell out**, all fixed and tested: `best` rendering
as NaN, a permanent-and-false "past your old record", a chart drawing bars
only where there was *no* data, a ring measuring against something other than
the sentence beside it, a tie reported as a winner, and a read-only history on
the page's most consequential record.

## Open, from an outside review of this page

Not done, in the order I would take them:

1. **Branch the form on outcome** — "I gave in" should ask what was different
   and hide "What helped?". Deliberately not done: the two outcome buttons sit
   above the fields by a measured, test-pinned decision (that submit used to be
   1,130px down the column), and branching means choosing the outcome first,
   which reverses it. Worth doing as its own change with its own measurement.
2. **A "Held / Slipped" tag on every urge row** — the outcome is carried by
   icon colour alone, which is the one accessibility point in that review the
   gates cannot see.
3. **Rename "Win or loss"** — a judgemental frame on a recovery tool, working
   against the page's own "both count" message.
4. **Drop the counts from the rail rows** — they read as notification badges.
5. The demo banner and the sidebar's top gap are **app-shell, not this page**.

## Traps that cost time, now written down

All six are in CLAUDE.md with their measurements. The two most reusable:

- **A test keyed to copy breaks every time the copy moves.**
  `NoFap.test.tsx` broke three times inside one change, never about the
  behaviour under test. Anchor on a `role` or an `aria-label` instead.
- **A percentage height on a flex child with no height resolves to nothing.**
  It drew a chart's bars only where there was no data, and a screenshot cannot
  show that — count the DOM.

## Environment

Two preview servers were up at the stop: **4173** (the repo default, what CI
uses) and **4299**. Start one with `npx vite preview --port 4173 --strictPort`,
and always pass `BUJO_URL` — a gate without it grades whichever app started on
the default port first.

`playwright` and `@axe-core/playwright` are still not in `package.json`
(COD-273). Install them at the versions the workflow now pins:

```
npm i -D --no-save playwright@1.64.1 @axe-core/playwright@4.14.0
npx playwright install chromium
```

A throwaway probe must live in the **repo root**, not the scratchpad: ESM
resolves `playwright` relative to the script, not the working directory. Delete
them before committing — three slipped into commits this session and had to be
reset back out.
