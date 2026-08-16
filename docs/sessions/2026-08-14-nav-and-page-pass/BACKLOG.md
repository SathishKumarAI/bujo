# Backlog — found this session, deliberately not built

Scope was "build defects, document redesigns". Everything here is a redesign or a
judgement call, so it stayed out of the diff.

## B1 · Fitness and Nutrition are one zone doing one job

At 1440px the form fields cap at 380px inside a 912px zone, so roughly 530px of the
page is empty while `History` and `Analytics` sit stacked *below* the fold instead
of beside the form.

The 380px cap is right and should stay. The fix is a two-column act/review split —
form left, history and analytics right — not a wider input. Both pages have the
same shape, and `page-contract` is the tool for it.

## B2 · Insights column bottoms are ragged

Sections lay out two-up, and the left column runs long past the right in places
(and short in others — there is a ~200px hole under "Coach digest"). Multi-column
balances *within* a masonry, but nothing balances the sections against each other.

Now much less painful than it was, because the cards inside are no longer 213px
wide, but the raggedness is structural.

## B3 · Five different stat treatments on one page — **colour half done**

Counted on Insights: streak tiles (big number + label + delta), a donut, a plain
number, pill badges (`+1.2`), monospace momentum figures, `53/100` with a pill, and
`65/100` with a gradient bar. Fitness and Nutrition share a *sixth* style (filled
box, big number, small caption), and Plan a seventh (label above, plain number).

**Update — the colour axis is fixed** (`refactor(ui): a figure is neutral unless
its colour is computed from its value`). Measuring the rendered page turned out to
sharpen the finding: the structure was already near-consistent (radius 14, 1px
border, tile background), and what varied was mostly *colour* — 13 figures in 7
colours on Insights, and `StatTile` tinting its value at 85 of 86 call sites
app-wide. Those accents were a rotation, not a reading, and they competed with the
colour that does carry meaning. Figures are now `fg-1`; `color` tints the icon.

**Still open:** the size and structure axis. Two value sizes (32px and 17px), two
font families (Instrument Sans vs Fraunces in the ring), and two alignments
(centre vs start) remain in play, and `Big` / `PickStat` / `StatTile` /
`SplitCol` are still four components doing one job. Consolidating them is the
part that needs the before/after render snapshot.

## B4 · Two tab-row visual languages

Settings uses pill tabs with icons; the section tab row uses underlined text tabs.
Both are fine; having both is not. Pick one.

## B5 · No scroll affordance on the section tab row

571px of tabs in a 491px row. Now that the active tab is centred, partial tabs show
at the edges and that is arguably enough — but an edge fade (a CSS mask that
disappears at the ends) would make it explicit. Low value, non-zero risk.

## B6 · Nutrition's "macro split against target" cannot be read

Both bars normalise to 100% width, so "today" and "target" are the same length and
the comparison the card is named after is invisible — you cannot see that protein
is 127/120 (over) while carbs are 162/200 (under). Needs a shared scale, not a
second full-width bar.

## B7 · Two walls of identical rows

Plan's migration list renders 20 rows of `→ Today / → Tomorrow / drop`, and
Nutrition's "Recent days" renders 14 rows of date + kcal with no bar to compare
against. Both are correct and both are unreadable in bulk.

## B8 · Verify at a real 390px — **done**

Chrome's minimum window width on this machine is ~501px, so nothing in the
2026-08-14 session was measured at a true phone width. The fix was not to work
around the window: Playwright sets a viewport directly, so the gates could always
have done this and simply never did. `npm run a11y` and `npm run clipped` now
sweep desktop **and** 390×844.

It paid for itself on the first run:

- `critical: button-name` on **every phone screen** — Quick add's label is
  `hidden` below `sm`, leaving the app's primary action as an unlabelled icon
  button. 16 of 16 phone scans; 0 of 16 desktop scans could ever have seen it.
- **32 clipped strings**, desktop clean. `StatBar` gave each fact **7px** at
  390px, so "Target met — anything you like" showed 7 of the 213px it needs.

Both fixed. What this says about the other backlog items: they were all written
from desktop observation, so any of them may have a phone half nobody has looked
at yet.
