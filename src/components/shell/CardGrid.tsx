import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * CARD GRID · three across, and everything flows into it.
 *
 * Most views in this app are a single vertical stack of cards, which is why
 * the tall ones got so tall — Pickleball reached 4.2 screens across twelve
 * blocks, of which only two needed the full width. A card that holds four stat
 * tiles does not need 1,344px; three of them side by side read better and cost
 * a third of the scroll.
 *
 * The steps are deliberate rather than a smooth ramp:
 *
 * | Width           | Columns | Why |
 * |-----------------|---------|-----|
 * | < 768px         | 1       | Phone. A card per row, nothing to argue about |
 * | 768–1535px      | 2       | At `wide` (1,180px) three columns would be ~380px each, too narrow for a chart axis |
 * | ≥ 1536px        | 3       | Container is 1,344px here, so each column is ~435px — enough for a chart |
 *
 * Anything that genuinely needs the room opts out per breakpoint with the two
 * exported helpers, rather than the grid trying to guess:
 *
 * ```tsx
 * <CardGrid>
 *   <Card title="Sessions">…</Card>
 *   <Card title="History" className={SPAN_2}>…</Card>   // a table
 * </CardGrid>
 * ```
 *
 * There used to be a third helper, `SPAN_ALL` (`2xl:col-span-3`), for "full
 * bleed". It had one call site — the Stats activity heatmap — and below 1536px
 * it was byte-identical to `SPAN_2`, because the grid only has two columns
 * there. So it read as a stronger claim than it made, and the one card using it
 * spent 432–978px of its width empty (BUJO-280). Deleted rather than kept for a
 * caller that does not exist: a card wanting the full row at 2xl can say
 * `2xl:col-span-3` and be measured on it.
 *
 * **Both grids carry `page-enter`.** The app's staggered entrance selects
 * DIRECT children (`.page-enter > *`), and it used to sit on the page shell,
 * which has exactly one child — so on every contract page the whole page rose
 * as one block and the 45ms ladder never ran. A grid's children ARE the cards,
 * so this is the element the ladder was written for. Measured before the move:
 * `?view=account` and `?view=trackers` each reported a single direct child at
 * `animation-delay: 0s`.
 *
 * `items-start`, not stretch: a short card next to a tall one should stay
 * short rather than grow a pocket of empty space to match its neighbour.
 *
 * **The phone column needs `minmax(0, 1fr)` spelled out.** `grid-cols-2` and
 * `grid-cols-3` expand to `repeat(n, minmax(0, 1fr))`, so the two- and
 * three-column steps have always been safe; below 768px there was no
 * `grid-template-columns` at all, leaving a single implicit `auto` track that
 * sizes to the *widest item's min-content* and is free to exceed its own
 * container. One card doing that widens the track, and a grid track is shared —
 * so every other card in the grid is stretched with it. On Stats at 390px the
 * Activity heatmap's 53-column `table-fixed` measured a 398px min-content and
 * dragged all six sibling cards to 398 inside a 324px box, putting sixteen
 * controls (every "Enlarge", the month stepper, the 3mo/6mo/1yr range) off the
 * right edge with no ancestor able to scroll to them. A card's own `min-w-0`
 * cannot prevent this: it is the track that overflows, not the item.
 */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('page-enter grid grid-cols-[minmax(0,1fr)] items-start gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3', className)}>
      {children}
    </div>
  )
}

/**
 * MASONRY GRID · the same steps, but columns balance instead of rows aligning.
 *
 * A CSS grid makes every row as tall as its tallest item, so a short card beside
 * a tall one leaves a pocket of dead space until the next row starts — on
 * Insights that reached ~600px below "Mood stability", and on Mindset it left
 * "Connection" alone with an empty half-page beside it. `items-start` stops the
 * short card *stretching*; it cannot stop the gap.
 *
 * This is CSS multi-column, which flows content to balance the columns and has
 * no rows at all. Two consequences, and both are why it is a separate component
 * rather than a change to `CardGrid`:
 *
 * 1. **Reading order becomes column-major.** Fine for a set of peer cards in no
 *    particular order — a principle library, a shelf of analytics. Wrong for
 *    anything sequenced, and wrong for anything paginated by eye.
 * 2. **`SPAN_2` does not work.** There are no grid columns to span. Use
 *    `CardGrid` for any section that needs it.
 *
 * `break-inside-avoid` on the children is load-bearing: without it a card splits
 * across the column boundary mid-content, which looks exactly like a rendering
 * bug. `gap` does not apply to multi-column, hence the explicit
 * `[column-gap]` + bottom margin on children.
 *
 * **Breakpoints query the container, not the viewport.** `md:columns-2` asks
 * how wide the *window* is, which is the wrong question the moment a masonry
 * is not full-bleed. On Insights the sections lay out two-up, so each masonry
 * sat in a 446px column, read "the viewport is 1440, that is ≥ md" and split
 * 446 into two 213px columns — on a desktop screen. At 213px "Best & worst
 * day" wrapped its title across three lines and its weekday axis rendered as
 * seven unreadable numbers. `@container` + `@3xl:` asks how wide *this* is, so
 * the same component gives one column at 446px and three at full width without
 * any call site knowing where it has been placed.
 */
/**
 * A fourth column past a 1600px container, and a note on the third.
 *
 * `@7xl` (1280px) was written for the 1440 tier's 1344px shell — which, minus
 * the section rail's 176px and the 32px gap, hands the masonry **1136px**. So
 * the third column never appeared: measured on the shipped build, Insights drew
 * two columns at 1440, at 1920, at 2560 *and* at 3840. It arrives now only
 * because the shell grows (`shell-fluid`), which is worth stating because the
 * class list has said `@7xl:columns-3` for months and looked like it worked.
 *
 * 1600 for the fourth: at that container width a column is ~390px, which is
 * what two columns get on the 820 tier and enough for a chart axis. Below it,
 * four columns would be under 340px and the axis labels start colliding.
 *
 * A **container** query, not `2xl:`, so this cannot reach a masonry that merely
 * happens to be on a wide screen — the mistake this component's own docstring
 * records (446px sections splitting into two 213px columns at 1440).
 *
 * All four steps are spelled as arbitrary widths, including the two that have
 * named equivalents (`@3xl` is 48rem, `@7xl` is 80rem). Measured, not assumed:
 * with the third step named and the fourth arbitrary, Tailwind emitted the
 * arbitrary rule FIRST, so three columns won at every width and the fourth
 * never appeared — Insights drew three columns at 3840 with the fourth step
 * sitting in the class list doing nothing. Mixing named and arbitrary variants
 * of one family sorts by neither number nor source order; one spelling sorts by
 * value. Read the emitted CSS, not the class list.
 *
 * And do not write a class name into a comment here: Tailwind scans this file as
 * text, so the retired spelling of the fourth step kept generating a live rule
 * from the sentence explaining why it was wrong.
 */
/*
 * EACH STEP MOVED UP ONE SIZE, because the cards were too narrow.
 *
 * The breakpoints were 48/80/100rem. A container at 768px therefore split into
 * two ~370px cards — a chart, a legend and a readout inside 370px is a column,
 * not a card. Measured on Insights at a 1489px `<main>`: a 1160px grid at two
 * columns gives 570px, which is fine; the problem is everything BELOW that,
 * where the old steps packed a third and fourth column in early.
 *
 * Now 64/96/120rem: a container has to earn each extra column. Same four steps,
 * same single spelling (see the sorting trap below) — only the thresholds move.
 *
 * The gaps go up with them (4→5, 5→6). Widening the cards while leaving the
 * gutters is how a grid starts reading as one slab.
 */
const MASONRY_COLUMNS =
  'columns-1 gap-5 sm:gap-6 @min-[64rem]:columns-2 @min-[96rem]:columns-3 @min-[120rem]:columns-4 [&>*]:mb-5 [&>*]:break-inside-avoid sm:[&>*]:mb-6'

/**
 * The container query needs a wrapper: an element cannot be its own
 * `@container`, so the marker and the `@`-variants that read it cannot live on
 * the same div. Hence a component rather than an exported class string — the
 * old `MASONRY` export could not carry this and every call site using it would
 * have silently kept the viewport behaviour.
 */
export function MasonryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="@container">
      <div className={cn('page-enter', MASONRY_COLUMNS, className)}>{children}</div>
    </div>
  )
}

/** Two of the three columns — tables, wide charts, anything with an x-axis. */
export const SPAN_2 = 'md:col-span-2 2xl:col-span-2'
