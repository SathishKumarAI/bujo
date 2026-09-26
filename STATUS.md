# STATUS

**Stopped:** 2026-09-26, on `main`, clean. **Thirteen PRs merged (#263–#275)**,
each squash-merged with `npm run verify` and `npm run a11y` green.

## What this stretch was

Two requests. First: spin the UI up, find bugs, kill the duplication in
Settings and in Fitness/Strength, give Cycle real context and visualisations.
Then: Insights, Mindset and Pickleball "look empty / scattered / like plain
text", use the width, reorganise the categories.

Every item below was measured in the running app before it was called a
problem. None of the three "empty" pages had a rendering bug.

| # | What | The finding |
|---|---|---|
| 263 | Strength had two front doors | The Fitness mode toggle **and** the Strength tab both logged a `Workout`. `views/FitnessHub.tsx` was 142 lines of dead code nothing imported. |
| 264 | Settings counted the journal twice | Two cards, 3,000px apart, four identical numbers — and **"Habits" meant two different things**. `Settings.tsx` 969 → 86 lines. |
| 265 | Cycle had nothing to show | **The demo seed never wrote `data.cycle`**, so the gate could not fail on any of it. Four visualisations added. |
| 266 | A stray `undefined/` directory | My mistake in #265. |
| 267 | Mindset's library was a 3,200px wall | 46 principles in one column. Two docstrings said "26". |
| 268 | Auto-sync hands over a locked journal | `bujo:enc` holds ciphertext, `bujo:sync` holds the passphrase **in plaintext beside it**. |
| 269 | Handover | — |
| 270 | Insights was nine groups under six names | See below. Plus a new `tier={1440}` on `PageLayout`. |
| 271 | Pickleball's charts, Mindset's tiles, `docs/PAGE-SHAPE.md` | **All seven Pickleball charts were behind `defaultOpen={false}`.** |

## The four worth re-reading

**`lib/demo.ts` seeded every domain except `data.cycle`.** `npm run a11y`
visits that page at five themes and two viewports on every run and could not
fail on any of it. Seeding four cycles turned the first green run **red**.
The trap is in CLAUDE.md: when you add a domain to `types.ts`, seed it in the
same change.

**The passcode lock does not survive auto-sync, and `docs/AUTH.md` said it
did.** Measured with both on: `bujo:enc` is 103,399 characters of ciphertext
and `bujo:sync` is the passphrase in the clear. Not silently fixed —
encrypting it means auto-sync cannot run while locked, which is a product
decision. Surfaced at the switch and documented instead.

**Insights offered six domain names and rendered nine groups** under four
mechanisms, two of them sharing a title, with eight of twenty-three cards
under no heading. Nothing failed; the page was just unreadable. Zone 3 is
`DOMAINS.map(...)` now, and a test asserts the rendered `data-card` set
equals the registry in both directions. The regroup also exposed
`TrackerVisuals`: five habit grids with no card id and no filter gate, so the
chips could not filter it, the search could not find it and no count included
it. And **the test the registry's docstring claimed existed did not** — the
only one there checked the registry against itself.

**Every Pickleball chart was behind one closed fold, last on the page.** What
a reader got was fourteen cards of stat tiles and not one chart. The same
fold had already been wrong twice: a comment claimed it was collapsed when it
was not, and that was resolved by making the comment true.

## Numbers, before → after

```
space   insights  desktop 6.8 → 6.1 shipped · 2 columns → 3 · container 1180 → 1318
                  phone   12.0 → 13.5 shipped, but 13.4 → 13.5 OPEN
        mindset   desktop 4.8 → 3.8 (two columns) → 4.2 (tiles)
        pickleball desktop 3.5 → 3.9 shipped, 4.5 → 4.5 OPEN
        cycle     desktop 1.6 → 1.9 shipped, 1 column ⚠ → 3 columns
tests   1149 → 1167 in 91 files
a11y    166 rows, no serious or critical, at 5 themes × 2 viewports
```

**Read the shipped/open pairs together.** Where shipped rose and open did not,
nothing grew — a fold was opened, and the page now shows what it holds. That
is true of Insights' phone number and both of Pickleball's.

## The Gym pass (#272)

Reported as stretched and scattered; both were measured, and there was a
correctness bug under them.

`parseSet` matched the N in "Squat 5x5 @ 100kg" and **never captured it**, so
every caller counting sets from a legacy line counted one per *line*. On the
demo journal: "Sets this week" **9 against a true 39**, weekly volume
**3,083lb against 14,025lb**, and the page's signature visual — hard sets
against a 10–20 landmark — put every muscle at 1–5. Three tests asserted the
wrong behaviour, and `lib/pullups.ts` already knew: it writes one line per set
to dodge this, with a comment saying so. A local workaround that left every
other caller undercounting.

It only surfaced because the demo started writing `setRows` beside the
strings, and the same journal produced two answers.

Layout, measured at 1440 before: act column 442 × 604, review 722 × 1500,
**442 × 896px of dead page**, one bar track 606px for a value of 1–5. The
review was 46px under `MasonryGrid`'s 768px step, which the file documented
working around with `CardGrid`. `tier={1440}` fixes the cause; `LiftTable`
merges two cards that listed the same lifts (third round of that here);
`LastSessionCard` fills the act column with what a lifter reads with a bar in
front of them.

## Next, in the order I would take it

0. **`shell/TopBar`'s Quick add is `variant="primary"`** and mounts on every
   view, so it eats every page's budget and the dev-only `[one-primary]` guard
   warns on any page with one of its own. Verified by driving the app: Gym
   warns, Fitness does not. The guard is right and its scope is wrong. Touches
   every page, so it is filed rather than folded into a page PR.
1. **`npm run clipped` is red on main** — 9 findings: gym ×4, cycle ×5.
   Byte-identical before and after this stretch, so all pre-existing. Note
   COD-95 claims the gym clipping was fixed, so it regressed or these are
   different elements.
2. **`focus` (3.6 screens) and `mindset` (4.2)** are the two long pages the
   rail cannot help: measured **zero disclosure groups and zero cards** — flat
   prose, nothing to group. They need an IA decision, not a layout primitive.
3. **Recovery** — two open tickets and the measurements agree: COD-61 (2106px
   dead act column) and COD-49 (orient bar repeats the hero). 3 groups, 17
   cards, 1.7 shipped / 4.7 open.
4. **`habitgrids` overlaps `activity` and `habitanalytics`** — registered
   rather than deleted in #270 so the overlap is visible; wants a
   consolidation pass now all three are under one heading.
5. **Cycle on a phone is 4.2 screens**, ~950px a 30-row month list (the split
   is `sm:`). Either it splits at 390 or it folds.
6. **Pickleball's win-rate forecast prints "100% projected"** from a 71%
   current rate — a clamped extrapolation reading as a promise. Copy.
7. `encrypted` + `bujo:sync`: the real fix (#268 shipped the honest warning).
8. **Five Plane items sit "In Review" with no open PR** — COD-12, 13, 19, 20,
   21. At least three look already done. The board needs reconciling.
9. Still open on the board: **COD-211** blank boot on `?view=settings` in CI;
   **COD-208** a11y crash with no partial summary; **COD-197** says a11y fails
   on main and it has been green every run this stretch — likely stale.

## The rail rollout, and what it measured

Five pages now share `components/page/SectionRail.tsx`. The method is written
down in **`docs/PAGE-WORKFLOW.md`**; the shapes are in `docs/PAGE-SHAPE.md`.

| Page | before | after |
|---|---|---|
| insights | 6.3 desktop / 13.5 phone | **1.8 / 3.1** |
| help | 4.5 shipped / 10.9 open | **1.3 / 1.6** |
| pickleball | 4.3, 17 folds | **3.0, 8 folds** |
| pullups | 2.1 shipped / 5.7 open | **2.2 / 2.2**, 7 folds → 1 |
| coaching | 2,091px shut / 12.9 open | one chapter, no 12.9 state |

**Two redesigns were measured and thrown away**, and that is the more useful
half: widening the ten narrow pages to `tier={1440}` changed height on 8 of 10
by **zero**, and `stacked` on the seven with the most dead space cost +469 to
+1346px. The dead column beside a short act is the price of a layout that is
already cheaper than the alternative. Full numbers in `PAGE-SHAPE.md`.

## Traps earned, all in CLAUDE.md or `docs/PAGE-SHAPE.md`

- **An unseeded domain is a subject the gates do not check.** One level below
  the empty-journal trap.
- **A count in a comment has nothing keeping it true.** Two Mindset docstrings
  said 26 while the library held 46 and the bar rendered "46 of 46" thirty
  pixels above the list.
- **A render diff is the gate on an extraction.** Settings' five tabs and the
  whole of Insights were captured with every fold open before and after. On
  Insights the only lines that disappeared were the nine old group headings —
  which is how you know 700 lines of card markup moved intact.
- **A page that offers names must use those names as its structure.** When
  they disagree the report comes back as "scattered", and nothing fails.
- **`git add -A` is not a staging strategy.** It swept a stray `undefined/`
  directory into #265 and an unrelated untracked `docs/*.html` into #270's
  first attempt. Stage explicit paths.
