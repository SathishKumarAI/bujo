# STATUS

**Stopped:** 2026-09-25, on `main`, clean. **Five PRs merged (#263–#268)**,
all squash-merged with `npm run verify` + `npm run a11y` green on each.

## What this stretch was

One request: spin the UI up, find bugs, kill duplication in Settings and in
Fitness/Strength, give the Cycle page real context and visualisations, and
modularise as it goes. Every item below was measured in the running app before
it was called a problem.

| # | What | The finding |
|---|---|---|
| 263 | Strength had two front doors | The Fitness mode toggle **and** the Strength tab both logged a `Workout`, forty pixels apart. `views/FitnessHub.tsx` was 142 lines of **dead code** nothing imported. |
| 264 | Settings counted the journal twice | Two cards, 3,000px apart, four identical numbers — and **"Habits" meant two different things** (`!archived` vs all). `Settings.tsx` 969 → 86 lines. |
| 265 | Cycle had nothing to show | **The demo seed never wrote `data.cycle`**, so the gate could not fail on any of it. Four visualisations added. |
| 266 | A stray `undefined/` directory | My own mistake in #265; a probe script wrote to an unset env var and `git add -A` swept it in. |
| 267 | Mindset's library was a 3,200px wall | 46 principles in one column on a 1,180px tier. Two docstrings said "26". |
| 268 | Auto-sync hands over a locked journal | `bujo:enc` holds ciphertext while `bujo:sync` holds the passphrase **in plaintext beside it**. |

## The two worth re-reading

**`lib/demo.ts` seeded every domain except `data.cycle`.** The Cycle page's
whole orientation block is `{day != null && phase && …}`, so it was absent from
the DOM; `npm run a11y` visits that page at five themes and two viewports on
every run and could not fail on any of it. Seeding four cycles turned the first
green run **red** on a serious `scrollable-region-focusable`. The trap is in
CLAUDE.md now: **when you add a domain to `types.ts`, seed it in the same
change** — an unseeded domain is a whole subject the gates silently skip.

**The passcode lock does not survive auto-sync, and `docs/AUTH.md` said it
did.** Measured, both switched on:

```
bujo:enc    {"v":1,"salt":"R6+Ar…      103,399 chars of ciphertext
bujo:sync   correct-horse-battery
```

The lock works exactly as documented. It just does not matter. Not silently
fixed — encrypting `bujo:sync` under the passcode key means auto-sync cannot
run while locked, which is a product decision. The trade-off is surfaced at the
switch and documented instead.

## Numbers, before → after

```
space   mindset   desktop 4.8 → 3.8 shipped
        cycle     desktop 1.6 → 1.9 shipped, 1 column ⚠ → 3 columns
                  phone   2.5 → 4.2 shipped   ← the real cost, four charts stacked
tests   1149 → 1164 in 90 files
a11y    166 rows, no serious or critical
```

Cycle's desktop page gained four visualisations for **0.3 screens**, because
the wide tier was being spent on one column.

## Next, in the order I would take it

1. **`insights` is 6.8 desktop / 12.0 phone**, still the largest page. Unchanged
   from the last handover and still a product decision: shortening it means
   cutting cards.
2. **Cycle on a phone is 4.2 screens**, and ~950px of that is the month list —
   30 rows in one column, because the two-column split is `sm:`. Either it
   splits at 390 (tight: the row is day / cycle-day / temp / dots) or it folds.
3. **Focus wastes ~700px of its right column.** The timer card holds a 200px
   ring opposite a long form. The space audit reports `1 column ⚠` for this
   page, which is a **false read** — it is a custom two-column layout the audit
   does not recognise, so do not chase that warning.
4. `encrypted` + `bujo:sync`: the real fix (#268 shipped the honest warning).
5. Still open from the last stretch: **COD-211** blank boot on `?view=settings`
   in CI — the diagnostics are in and it never reproduced locally this session;
   **COD-208**, a crash in the gate's `scan()` escaping before the summary
   prints; `pullups` (5.6 open) and `nofap` (4.7) unexamined.

## Traps earned, all in CLAUDE.md

- **An unseeded domain is a subject the gates do not check.** One level below
  the empty-journal trap: not "a card that never renders cannot fail" but "a
  domain the seed never writes cannot fail".
- **A count in a comment has nothing keeping it true.** Two Mindset docstrings
  said 26 while the library held 46 and the bar rendered "46 of 46" thirty
  pixels above the list. They agreed with each other and with nothing else.
- **A render diff is the gate on an extraction.** Settings' five tabs were
  captured with every fold open before and after; four came back
  byte-identical, which is the only way to move 900 lines and know it.
