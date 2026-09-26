# Page shape — the three-zone contract, and the tiers

What decides where a thing goes on a page, and how wide the page is. Companion
to `DESIGN.md`, which decides what a thing *looks* like once it is there.

Written after a pass over Insights, Mindset and Pickleball, all three reported
as "empty", "scattered" or "plain text on a page". None of them had a rendering
bug. All three had the same class of fault: **a page whose structure did not
match the vocabulary it offered the reader.**

## The three zones

| Zone | What | Rule |
|---|---|---|
| 1 · Orient | One horizontal bar, at most four facts | A fact earns its place only if it changes what you do in the next thirty seconds |
| 2 · Act | The one thing the page exists to do | Holds the page's single primary button |
| 3 · Review | What has been recorded | Summary, the signature visual, then the list |

There is no zone 4. Content that fits none of the three belongs on another
page — that is the rule that stops streak badges, tips and promos accreting at
the bottom of every screen.

`components/page/PageLayout.tsx` owns this. Pages hand over content per zone
and never lay themselves out.

## The width tiers

`PageLayout` takes `tier`. Three values, and the choice is about **what the
page holds**, not what looks generous.

| Tier | Width | For | Example |
|---|---|---|---|
| `820` | `max-w-read` | Reading. Single column at every width; the gutters are the point | — |
| `1180` | `max-w-wide` | A form and a list. The default | Fitness, Cycle, Gym |
| `1440` | `max-w-wide xl:max-w-[84rem]` | A dashboard — many peer cards, no single act | Insights |

**Why a third tier exists.** `PageLayout` capped every page at 1180px while the
older `shell/Page` it replaced already widened to 84rem at `2xl`. So a contract
page and a legacy page on the same 1440px screen used different amounts of it,
and the newer one used less. Insights is 24 analytics cards in a
`MasonryGrid`, whose third column needs a **1280px container** (`@7xl`) — at
1180 it drew two columns with ~260px of the page unused beside it.

The dashboard tier takes the same 84rem cap one breakpoint earlier than `Page`
does (`xl`, not `2xl`), because 1280 is exactly where the third column becomes
available and holding it to 1536 wastes every width in between.

**It is not the default and should not spread.** A form and a list read worse
at 1344px than at 1180 — that is the entire reason for a tier system. Reach for
1440 only when the page is a grid of peers.

## Grouping: one vocabulary, or none

A page that offers the reader a set of names — filter chips, a tab row, a
legend — must use **those same names** as its structure. Insights was the
worst case in this codebase and is worth keeping written down:

- `lib/insightsFilter.ts` named six domains and the chip row offered them.
- The page rendered **nine groups** under four mechanisms: a bare grid with no
  heading (eight cards), three loose cards, six folds titled from a different
  vocabulary, and a seventh fold **sharing a title with one of those six**.
- Eight of twenty-three cards sat under no heading at all.

Nothing failed. Every card rendered, every chip filtered. The page was simply
unreadable, and the report that came back was "scattered plots" — which is what
a reader says when structure and vocabulary disagree.

The fix is always the same shape: **render the groups from the registry**, not
from the order the JSX happens to be in. `views/Insights.tsx` zone 3 is
`DOMAINS.map(...)` now, and `views/Insights.test.tsx` asserts the rendered
`data-card` set equals the registry — in both directions, and that no heading
stands over an empty grid.

### The corollary: an unregistered card is invisible to everything

`TrackerVisuals` rendered five habit grids on Insights with **no card id and
no filter gate**. The chip row could not filter it, the search could not find
it, no count included it, and the registry test could not see it. It is
`habitgrids` now.

## Folds

A fold is for reference content that a returning reader already knows. It is
**not** a way to fit more on a page, and a chart behind a closed fold is a
chart that does not exist.

Three instances of this in one codebase, all found by looking at the rendered
page rather than the code:

| Page | What was folded | What the page looked like |
|---|---|---|
| Fitness | The training calendar, behind "Cardio analytics" | The most useful thing on the page, unseen for a release |
| Pickleball | **All seven charts**, `defaultOpen={false}`, last on the page | Fourteen cards of stat tiles and not one chart — reported as "empty" |
| Insights | `TrackerVisuals`, five habit grids | Absent from the shipped page, present in the "open" measurement |

The Pickleball one had already been wrong twice: an earlier comment claimed the
section was collapsed when it was not, and the discrepancy was resolved by
making the comment true rather than by asking whether it should be.

**Measure both numbers.** `npm run space` reports scroll *as shipped* and *with
every fold open*, because either alone is gameable — measuring only the opened
page punishes a disclosure for existing, measuring only the shipped page
rewards hiding content. When shipped rises and open does not, nothing grew: a
fold was opened.

## Objects need boundaries

A list of title-plus-description rows separated by hairlines is not a list of
objects, and any control on such a row sits closer to the *next* row's text
than to its own. Mindset's library was forty-six of them.

A tile draws the boundary and lets the control belong to the thing it acts on —
there, the whole tile is the button. The cost is padding: measured, 3.8 → 4.2
shipped screens on desktop. Worth it, and stated rather than hidden.

**Tiles stay neutral.** Nine categories is nine hues if you let it be. The
contract spends the accent on one thing per page; in the library that is the
principles you have actually chosen, which is what makes them findable in a
wall of forty-six.

## A short act beside a long review is dead page

The 62/38 split assumes the two columns are comparable. When the act is a
form and the review is the rest of the page, the difference is empty:

```
Gym at 1440, before
  act     442 × 604     the logger and a rest timer
  review  722 × 1500    everything else
  dead    442 × 896     27% of the page below the orient bar
```

Two fixes, and the order matters. **Widen first**: the review was 46px under
`MasonryGrid`'s 768px container step, so every group in it silently resolved
to one column — the page had already worked around that by reaching for
`CardGrid`, which is a patch on a symptom. `tier={1440}` took the review to
807px and the cause went away.

**Then fill the column with something that belongs to the act.** Not a
read-back moved up to plug a hole — the thing a person needs while doing the
thing. On Gym that is what you lifted last time you trained this split, which
you read with a bar in front of you. The fix for dead space is the thing that
should have been there.

## Two cards listing the same rows are one table

Gym shipped `Personal records` and `Strength standards` side by side. Eight of
nine lift names appeared **twice on the same horizontal band, 360px apart**.
They were never two subjects: one column was `weight`, the other was
`weight ÷ bodyweight`.

The tell is that the reading you actually want is impossible. "My deadlift is
125lb, which is 1.6× bodyweight, which is Advanced" cannot be done when the
halves are in different cards with different row orders. That is the
signature of a table that has been split, and it had survived two previous
de-duplication passes on the same page because each round merged the pair in
front of it rather than asking what the rows were.

## What to measure, and with what

| Question | Command |
|---|---|
| How long is this page, shipped and opened? How many columns? | `npm run space -- <view>` |
| Is the accessibility tree sound, at five themes and two viewports? | `npm run a11y` |
| Does any control sit outside the viewport with no way to reach it? | `npm run clipped` |
| Do the two palettes agree, and does every accent clear 4.5:1? | `npm run contrast` |

And then open the page and look at it. Every defect in this pass was found in
the first minute of looking at a screenshot; none of them failed a gate.
