# STATUS

**Stopped:** 2026-10-16, on `feat/nutrition-trends`, **one PR open**.
Nutrition's review rows now answer one question each; both a11y gates green.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | Nutrition (#414), the account-menu name (#413) and the a11y gate (#415, COD-332) all merged | up to date |
| `feat/nutrition-trends` | — | the act's forms, the wave and the calendar, the Trend/Patterns re-split, the demo's food receipt, and 32 more name mismatches | committed, PR next |

Nothing is stacked.

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

## What landed after that

**Nutrition, second pass** — four asks, all measured in a browser first:

| asked | was | is |
|---|---|---|
| "the totals form is overflowing · keep everything side by side · show the calories outside of it" | four full-width 416px rows, unit inside a `pr-12` box; and the custom-food grid drawing **five 77px columns at 1440** off a `sm:` viewport query inside a 424px act column | four 98px columns in one row (2×158 on a phone), unit in the label; both grids on `@container/act` |
| "add a heat map of calories by day · and a wavy texture with high and low peaks" | neither existed | `Day by day` (area chart, target drawn as a band, gaps where unlogged) and `Calories by day` (20-week calendar) |
| "trends and patterns are the same — combine them if so" | Trend held the fortnight, the targets AND the training split | **Trend is WHEN, Patterns is WHY** — the training split moved, each row has one question |
| "mention you can tap to hide the log" | a `title` a phone cannot show | `Log what you ate · Tap to hide` |

Two defects found on the way, both fixed here: the demo seeded `foodLog` with
**three names that no longer exist** and on **four days against a card that
reads fourteen**, so Nutrition's best card rendered two rows; and
`a11y:panels` found **32 more name mismatches** in `BarList`, invisible to the
main gate because they sit on rail rows it never opens.

## The next action

1. **Open the PR for `feat/nutrition-trends`** and merge on green.
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
  176 planted violations, which is what proves the pass can see them. It is the
  **only** gate that sees a rail row other than the default — it found 32
  violations the full `a11y` run could not, and the truncated food labels on
  Patterns were found by neither, only by looking.
- **Two adjacent spans paint one word.** `All24`, `Log what you ateTap to
  hide`, `Oct 16+232023` — three instances in one day, each invisible in the
  JSX. Measure `textContent`, and put the space INSIDE a span rather than
  between them when the row's columns are measured.
- **A copy of a shared component is the one place a shared fix cannot reach.**
  Pickleball's weekday card held forty retyped lines of `BarList` and was the
  last page still failing after the primitive was fixed.

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
