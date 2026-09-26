# STATUS

**Stopped:** 2026-09-25, on `main`, clean. **Nine PRs merged (#263–#271)** in
one stretch, each squash-merged with `npm run verify` and `npm run a11y` green.

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
   warns, Fitness (whose submit is not a primary) does not. The guard is
   correct and its scope is wrong — shell chrome should not count against a
   page. Touches every page, so it was filed rather than folded into #272.
1. **Insights on a phone is 13.5 screens.** The six domain headings are right
   on desktop and expensive in one column. Either the blurb drops below `sm`,
   or the domains become a real segmented view rather than a filter.
2. **`habitgrids` overlaps `activity` and `habitanalytics`.** Registered
   rather than deleted in #270 so the overlap is visible; it wants a
   consolidation pass now that all three are under one heading.
3. **Cycle on a phone is 4.2 screens**, ~950px of which is a 30-row month list
   (the two-column split is `sm:`). Either it splits at 390 or it folds.
4. **Pickleball's win-rate forecast prints "100% projected"** from a 60%
   current rate. The maths is a clamped linear extrapolation and its test
   pins the clamp, so it is honest and reads as a promise. Copy problem.
5. **Focus wastes ~700px of its right column** — a 200px timer ring opposite
   a long form. The space audit says `1 column ⚠` for this page, which is a
   **false read**: it is a custom two-column layout the audit does not
   recognise. Do not chase that warning.
6. `encrypted` + `bujo:sync`: the real fix (#268 shipped the honest warning).
7. Still open from before: **COD-211** blank boot on `?view=settings` in CI
   (never reproduced locally this session); **COD-208**, a crash in the gate's
   `scan()` escaping before the summary prints; `pullups` and `nofap`
   unexamined.

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
