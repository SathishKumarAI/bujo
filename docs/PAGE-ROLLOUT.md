# Rolling the Pickleball pass out — Strength, Fitness, Nutrition, Challenges, Recovery, Cycle

Companion to `REUSABLE-PATTERNS.md` (what each piece is and the measurement
that shaped it) and `PAGE-SHAPE.md` (which zone a thing belongs in). **This file
is the work list**: what each remaining page already has, what it is missing,
and the order to do it in.

Every piece named here exists and has at least two adopters. Nothing below is a
new component — if a page needs something that is not on this list, that is a
finding, not a licence to invent a seventh disclosure implementation.

## The parts, and where they live

| Part | File | What it buys |
|---|---|---|
| Three zones | `components/page/PageLayout.tsx` | One shell, so a person who learns one page has learnt all of them |
| `actTop` | same | The act starts beside zone 1 instead of under it — for a page whose zone 1 is a BLOCK, not a bar |
| `actLast` | same | Stacked, render zone 3 before zone 2 in the DOM. Rarely what you want — `useActColumn` is usually the answer, because a form that merely moves below the record then drifts further with every bigger panel |
| `actShut` + `ActStrip` | same + `components/page/ActStrip.tsx` | Put the act away, give the width back; a 40px strip says what is inside and reopens it |
| `useActColumn` | `components/page/useActColumn.ts` | That state, plus the rule nobody guesses: **stacked, the act starts shut**. Hand `onSplitChange` to the shell and `shut` to `actShut` |
| One bar per review zone | `components/page/SectionRail.tsx`, `railAt="never"` | Five short rows, read left to right, in reading order |
| Sub-section chips | `components/pickleball/Review.tsx` + `Facet.tsx` | A row with 7+ cards narrows to 2–4 without a second navigation |
| `StatGrid` | `components/page/StatGrid.tsx` | Columns that answer to the PANEL's width, solved from a ~450px card floor. **Was `components/pickleball/PanelGrid`**; renamed on the move because `page/Panel.tsx` already exports a `PanelGrid` for reference items |
| `BarList` | `components/page/BarList.tsx` | A comparison of more than about five things, as one bar per row (§21). Written on its fourth caller; it also replaced Strength's four-axis radar, which had no baseline to be lopsided against |
| The house axis style | `components/page/chartStyle.ts` | Horizontal gridlines only, no axis line or ticks, `subtext0` tick text, compact figures, `minTickGap`. Four of 39 `CartesianGrid` call sites migrated |
| A session history card | `components/fitness/History.tsx` · `components/gym/History.tsx` | Three `PanelCard`s, `ShowMore` carrying the total, a named **Edit** that opens the real form in the card, and a delete that asks |
| The next-step sentence | `lib/pickleball.ts` → `nextStep` | Zone 1 says what to do, not only what is true |
| Drill-down to entries | `Review.tsx`'s `focus` + `onPick` | Every figure opens the rows behind it, where Edit and × live |
| A worked comparison card | `components/pickleball/SignalCards.tsx` → `WeekdayPerformanceCard` | What `BarList` looks like wrapped in a `Card`, with the subtitle saying the finding. **It now actually calls it** — this line described the intent while the card held forty retyped lines of that markup, and the copy was the one place a shared a11y fix could not reach (32 violations, four pages, found only by `a11y:panels`) |
| Per-panel a11y | `scripts/a11y-panels.mjs` | A rail hides four rows from `npm run a11y`; this drives them all, armed on a canary. One `PAGES` entry per page — **and one per sticky-state variant**, because a mode toggle hides half a page from it the way a tab shell does |

## Where each page stands

Measured by reading the view, not by guessing. All six were already on
`PageLayout` with no act controls and only two with a rail; Fitness has since
been done (COD-329) and is kept in the table as the worked example.

| Page | View | Lines | Rail | `actShut` | Sub-sections | The one thing to do first |
|---|---|---|---|---|---|---|
| ~~Strength~~ | `views/Gym.tsx` | 367 | ✓ | ✓ | n/a (7 rows) | **Done, COD-329** — see `docs/pages/gym.md` |
| ~~Fitness~~ | `views/Fitness.tsx` | 338 | ✓ | ✓ | n/a (4 rows) | **Done, COD-329** — see `docs/pages/fitness.md` |
| ~~Nutrition~~ | `views/Nutrition.tsx` | 424 | ✓ | ✓ | n/a (3 rows) | **Done, 2026-10-16** — see `docs/pages/nutrition.md` |
| Challenges | `views/Challenges.tsx` | 454 | — | — | — | One bar, then drill-down from a streak to its days |
| Recovery | `views/NoFap.tsx` | 416 | ✓ | — | — | `actShut` + arm `a11y-panels` (COD-237 names this page) |
| Cycle | `views/Cycle.tsx` | 593 | ✓ | — | — | Arm `a11y-panels`; then sub-sections on the long row |

## The order, per page

Do them in this order on each page. Each step is measurable on its own, and
each one is a commit.

1. **Measure first, at more than one width.** `npm run space -- <view>` grades
   only the row the rail opens on, so drive each row with a throwaway probe.
   Record: landing height in screens, worst panel, review width with the act
   open and shut, at 1440 **and 1920** — the 1365px column rule only misbehaves
   above 1680.
2. **One bar for the review zone.** Rows named in one or two words, ordered by
   the question they answer, each with a blurb that says *when* you read it.
   The default row is the one you want after the primary button, which need not
   be the first.
3. **`useActColumn` + `ActStrip`** — never a bare `useState` for this, and
   never `actLast` unless the act is genuinely short. **And ask what is in the
   act that is not the act**: Strength's column was 3001px because four
   reference panels lived under the logger in a fold. Moved to a rail row they
   are *beside* it instead of below it, and the column came back to 541px and
   became sticky again. **Sort them by the question they answer**, not into one
   row called Tools: Strength's five split into Load (put a prescription in the
   logger) and Lookup (what is this lift), with the plate calculator staying in
   the act because it is neither. A page whose act is over
   ~500px must be measured stacked: at 1152 and 1024 the zones are a single
   column while every viewport test still says "desktop".
4. **`StatGrid`** for the cards, never `CardGrid` — the panel's width is
   decided by the page split, not the window. (`PanelGrid`, the other one, is
   for reference items: a named thing with a short body.)
5. **Sub-section chips** on any row with five or more cards, counted from a
   single `has` map so a chip can never select an empty panel.
6. **The next-step sentence** in zone 1, as a priority list over the page's own
   data, with a coverage floor on anything that compares two windows.
7. **Drill-down**: every grouped figure opens the rows behind it.
8. **Seed the page's domain**, including the conditional branches — a card the
   demo cannot reach has never been rendered by any gate. Bump `DEMO_VERSION`,
   and derive new fields from the loop index rather than `rand()`.
9. **Arm `a11y-panels`** for the page's rows in the same commit as the rail.
10. **Write `docs/pages/<page>.md`** the way `pickleball.md` is written: shape,
    rail table, measurements, file map, traps.

## What NOT to repeat

- A second disclosure, collapse, or grid primitive. There are already three
  disclosures (`CollapsibleSection`, `Card collapsible`, `DisclosureRow`) and
  that was two too many; the act-collapse was briefly built twice in one week
  (`collapsibleAct` vs `actShut`) and had to be converged.
- A breakpoint that asks about the WINDOW when the box is sized by the page
  split. Strength's set row used `sm:` inside a 416px act column and drew seven
  desktop tracks in it, clipping three inputs to two characters each.
- A threshold copied from another page. Pickleball's drill split at 58rem was
  right until the log moved beside it, then it was 40rem. Measure the block.
- A chip list written beside the render conditions. One source, two readers.
- Colour behind text to carry a value. Put the ramp on the bar or the border.
- A gate's green quoted before the gate has been armed on a planted violation.

## Open, and worth doing before the next page

- ~~**`main`'s a11y job has been failing since 2026-10-15 09:08**~~ — **fixed.**
  The account-menu trigger's only visible text is its suggestion-count badge,
  and the count was not part of its accessible name, so
  `label-content-name-mismatch` fired as serious on **every view in the app**.
  It started the day a journal first produced a suggestion rather than on the
  commit that introduced it, because `suggestions > 0` is a branch and no gate
  renders an app with nothing to suggest — the same shape as every other "a
  branch the seed never takes cannot fail" entry. The name carries the count
  now rather than the badge being hidden, because the badge is the one thing on
  that control that changes from day to day.
- **COD-237** still names four rail pages whose other rows no gate reaches —
  Insights, Coaching, Pull-ups, Help, Recovery and Cycle, less the two now
  armed. `scripts/a11y-panels.mjs` takes one `PAGES` entry per page, plus one
  per sticky-state variant the page can be in.
- **`npm run a11y:panels` is still not in CI**, which is how every "a gate
  nobody runs" entry in CLAUDE.md started. It is 91 scans and some minutes;
  the a11y workflow is red on `main` for an unrelated reason, so adding a
  second browser gate to it buys nothing until that is fixed.
- With the act open the review is one column, so a short card looks sparse at
  702px. Pairing short cards needs a dense/span rule, not a new grid.
- **COD-330**: Strength's signature card grades weekly sets per muscle against
  a 10–20 landmark while counting a set once per muscle the lift works, so
  nine of twelve muscles are permanently "over 20". Filed during the Strength
  pass, not fixed in it.
- **Challenges, Recovery and Cycle** are the three left. Recovery and Cycle
  have rails that `a11y-panels` does not drive yet.
- Nutrition's pass added four patterns rather than only consuming them —
  `ResetField` (§26), the title-as-toggle (§27), a library behind a search with
  its groups as a filter (§28), and the record living beside the figure it
  explains (§29). The last of those is the one to carry into Recovery: its urge
  log is in the act, under the form, for the same reason Nutrition's was.
