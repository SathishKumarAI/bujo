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

## B3 · Five different stat treatments on one page

Counted on Insights: streak tiles (big number + label + delta), a donut, a plain
number, pill badges (`+1.2`), monospace momentum figures, `53/100` with a pill, and
`65/100` with a gradient bar. Fitness and Nutrition share a *sixth* style (filled
box, big number, small caption), and Plan a seventh (label above, plain number).

One `Stat` primitive with two or three documented variants would replace all of it.
That is a design-system change, not a fix — it touches every page and needs the
before/after snapshot discipline the repo already mandates for shared markup.

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

## B8 · Verify at a real 390px

Chrome's minimum window width on this machine is ~501px, so nothing this session was
measured at a true phone width. Either drive CDP device emulation from
`scripts/`, or add a viewport to the existing screenshot script.
