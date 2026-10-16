# STATUS

**Stopped:** 2026-10-16, on `fix/name-contains-visible-text`, **one PR open**
(#415). Nutrition shipped; the a11y gate goes green for the first time in days.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Nutrition (#414, COD-331) and the account-menu name (#413) merged | up to date |
| `fix/name-contains-visible-text` | **#415** | COD-332 — every accessible name contains what it draws, two real contrast failures, and the gate pinned | pushed, open against `main`, CI running |

Nothing is stacked. #415 branches off `main` and merges on its own.

## What landed today

**Nutrition (#414, COD-331)** — fourth page onto the three-zone contract, and
the first where the contract was not the main problem: **adding a food stored no
food.** It folded four macros into four running totals and threw the item away,
so there was nothing to edit, nothing to delete and no undo at any price —
`USER-CONTROL.md` rule 1 with no edit path to find, because the record itself
was a sum.

| | before | after |
|---|---|---|
| page, desktop 1440 | 1159px | **945px** |
| page, phone 390 | 3703px | **1380px** |
| act column, phone | 2258px | **41px** (a strip) |
| review zone | 842px, three stacked sections | one bar, three rows |

Four patterns came out of it rather than only going in — `REUSABLE-PATTERNS.md`
§26 `ResetField`, §27 the title-as-toggle, §28 a library behind a search with
its groups as a filter, §29 the record living beside the figure it explains.
Full write-up in `docs/pages/nutrition.md`.

**The a11y gate (#415, COD-332)** — it had been red on `main` and on every open
branch for days and nobody put it there: CI installed `@axe-core/playwright`
unpinned, axe went 4.13 → 4.14 with no commit, and 4.14 turned
`label-content-name-mismatch` on. **137 controls over nine components**, all
real. Now **187 of 187 scans across 12 of 12 shards, all five themes, no serious
or critical**, and the workflow pins both gate dependencies.

## The next action

1. **Merge #415** once its a11y job is green — that job IS the deliverable, so
   it is worth one check rather than merging on `verify` alone.
2. Then **Recovery (`views/NoFap.tsx`)**, then **Cycle (`views/Cycle.tsx`)** —
   the user's order, "let's go one after the other". `docs/PAGE-ROLLOUT.md` has
   the per-page first move; three pages are left (Challenges too).
   **Carry §29 into Recovery first**: its urge log sits in the act under the
   form, for exactly the reason Nutrition's did.

## Traps that cost time today, now written down

- **A gate red on `main` as well as your branch is the gate's environment, not
  your diff.** `gh run list --branch main --workflow a11y.yml` answers it in
  seconds. Recorded in CLAUDE.md with both corollaries: WCAG 2.5.3 compares a
  name against the **painted** text (`aria-hidden` is no exemption), and two
  adjacent spans with no text node between them paint one word (`All24`).
- **Reading a gate through `tail -2` hid a failure.** The design gate's last
  failing line and the next gate's pass printed together and looked like one
  clean result. Read the exit code.
- **A gate that hard-codes a label it does not own breaks when the label moves.**
  `scanInsightsAll` matched `All — ` and reported "no All row" while printing
  seven rows including `All 28 panels`. Its failure message printing what it DID
  find is the only reason that cost minutes instead of an hour.
- `npm run a11y:panels` now carries a Nutrition entry; `BUJO_CANARY=1` reports
  176 planted violations, which is what proves the pass can see them.

## Environment

`playwright` and `@axe-core/playwright` are still **not** in `package.json`
(COD-273) — install them per machine, now at the pinned versions the workflow
uses:

```
npm i -D --no-save playwright@1.64.1 @axe-core/playwright@4.14.0
npx playwright install chromium
```

A throwaway probe must live in the **repo root**, not the scratchpad: ESM
resolves `playwright` relative to the script, not to the working directory.
