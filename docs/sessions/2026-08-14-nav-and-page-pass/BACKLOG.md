# Backlog — found this session, deliberately not built

Scope was "build defects, document redesigns". Everything here is a redesign or a
judgement call, so it stayed out of the diff.

## B1 · Fitness and Nutrition are one zone doing one job — **done, and the note was wrong**

Recorded as "at 1440px the form caps at 380px inside a 912px zone, so ~530px is
empty". Measuring the whole range rather than the one width in the ticket showed
the split has **always** worked at 1440 — the note was written from a window
reporting 1440 while handing the page a 1280-sized container.

The real defect was at **1280**, the most common laptop width. The zone split is
a container query that was set at 960px, under a comment claiming that meant "a
laptop at 1280 splits". It did not: the rail takes 240px and 1280 lands at a
918px container, 42 short. Threshold to 900; 1280 now splits 554/343, 1200 and
below still stack.

Lesson worth keeping: the page structure was right the whole time. One number was
wrong, and a comment asserting otherwise kept anyone from checking.

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

## B4 · Two tab-row visual languages — **withdrawn**

Settings uses pill tabs with icons; the section tab row uses underlined text. The
difference is not drift, it is meaning.

Settings is Radix `Tabs` with real `TabsContent` panels — the ARIA tabs pattern,
in-page state, panels in the same document. `SectionTabs` is deliberately *not*
that: it is a `<nav>` of links, each to a different page, with
`aria-current="page"`, and its own doc records that axe flagged
`critical: aria-valid-attr-value` when Radix Tabs was tried there.

Making them look the same would promise that the same gesture does the same
thing. One changes the URL and lets Back walk it; the other does not. Leave them
distinct.

## B5 · No scroll affordance on the section tab row

571px of tabs in a 491px row. Now that the active tab is centred, partial tabs show
at the edges and that is arguably enough — but an edge fade (a CSS mask that
disappears at the ends) would make it explicit. Low value, non-zero risk.

## B6 · Nutrition's "macro split against target" cannot be read — **done**

Both bars were normalised against their own total, so both were always exactly
full width: eat a third of your target of everything and the two bars render
identically. Now share one denominator, `max(today, target)`.

Measured: at 378g vs a 380g target the bars are 655px and 658px; with the day
halved to 190g, 329px and 658px. The 329 is the number that could not previously
exist.

## B7 · Two walls of identical rows — **done**

Nutrition's "Recent days" carries a bar per row: length is the day against the
busiest day or the target, whichever is larger; colour is over target or under.

Plan's migration list is now grouped by the same staleness buckets the aging
histogram directly above it already counts — same labels, same colour dots —
oldest group first, because the 30d+ tasks are the ones actually rotting and
burying them under three fresher groups is how they stay buried. The boundaries
moved into one `overdueBucketOf` that both the histogram and the list call, with
a test pinning each edge and asserting the two agree; shifting the `week` edge
by a day fails it with `expected 'stale' to be 'week'`.

The collapsed preview still caps at 8 **rows**, not 8 groups, so grouping cannot
quietly turn 8 visible tasks into 32.

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
