import type { ReactNode } from 'react'

/**
 * The review panel's card grid — on a CONTAINER query, not the viewport.
 *
 * **It was `components/pickleball/PanelGrid`** and it is here, renamed, because
 * Fitness is the second page to need it and the honest options were importing a
 * pickleball module into a cardio page or writing the four thresholds out a
 * second time. `docs/PAGE-ROLLOUT.md` already listed it as a shared part; this
 * moves it to where the rest of the contract lives. The name changed with the
 * address: `page/Panel.tsx` already exports a `PanelGrid`, and two different
 * grids under one name in one directory is how a call site picks the wrong one.
 * Class strings unchanged, so nothing it already lays out moves.
 *
 * `CardGrid` breaks on `md:`/`2xl:`, which asks how wide the WINDOW is. The
 * panel's width is decided by the page split and by whether the act column is
 * open, so the window is the wrong question twice over. Measured at a 1440
 * viewport: with the log open the panel is **678px** and `CardGrid` still gave
 * two columns — **353px** cards, which is where "Performance by weekday"
 * squeezed seven cells and "100%" into 44px each; with the log hidden the
 * panel is **1110px** and it still gave two, so putting the log away bought
 * width that nothing spent. Reported exactly that way: *"if I hide the log
 * it's not scaling the width for the records or the performance."*
 *
 * `@container/page` is declared by `Review`. **All four steps are spelled as
 * arbitrary widths**, including the two with named equivalents (`@3xl` is
 * 48rem, `@6xl` is 72rem), for two reasons `CardGrid`'s own docstring records:
 * Tailwind has no `@8xl`, so the fourth step written that way emitted nothing
 * and the grid stayed at three columns on a 1926px panel with no error
 * anywhere; and mixing named with arbitrary variants of one family sorts by
 * neither number nor source order, so one spelling is the only one that sorts
 * by value. The steps are the panel's real widths, not round numbers:
 *
 * **The thresholds are solved from a floor of ~450px per card**, not copied
 * from a breakpoint scale: a card holding four stat tiles and a sentence reads
 * as a column below that, which is the 353px complaint this grid exists to
 * answer. `n * 450 + gaps` gives 58rem / 88rem / 116rem.
 *
 * | container | columns | card | when |
 * |---|---|---|---|
 * | < 928px | 1 | the whole panel | 1440 with the log open (678 → 702) |
 * | ≥ 928px (58rem) | 2 | ~545 | 1440 with the log hidden (1110) |
 * | ≥ 1408px (88rem) | 3 | ~517 | 1920 with the log hidden (1590) |
 * | ≥ 1856px (116rem) | 4 | ~466 | 2560 with the log hidden (1926) |
 *
 * Measured end to end at 1440×900, which is the point of the control: panels
 * went **1.73 / 2.43 / 2.86 / 1.18 screens** with the log open to **1.54 /
 * 1.75 / 2.01 / 1.00** with it hidden, and the cards from 702px to 569px in
 * two columns. Before this they were 353px in two columns either way, so
 * hiding the log bought 432px that nothing spent.
 *
 * Same answer `views/Pullups.tsx` reached for its own review column, and the
 * reason both are written down in CLAUDE.md from either side: `CardGrid` is
 * right when the page split decides the width, and wrong the moment the column
 * can change width without the window moving.
 */
/**
 * THE TWO STEP SETS, and why the second one stops at two columns.
 *
 * `stat` is the original: a ~450px card floor, solved from a card holding four
 * stat tiles and a sentence, which reads as a column below that. Every step
 * comes from `n * 450 + gaps` — 58 / 88 / 116rem.
 *
 * `pair` is for a panel whose cards are rings, diagrams and short legends
 * rather than stat tiles, and it is **two columns at most**. Both halves of
 * that were measured on Cycle at `?demo=1`:
 *
 * - The floor is ~330px, not 450, because that page already draws those cards
 *   at **329px with the act open and 413px with it shut** and has for its
 *   whole life. Holding them to 450 would have made 846px — 1440 with the act
 *   shut, the width that matters most — a single column.
 * - It stops at two because **no group on that page has more than two cards
 *   that are not full-width**. A third track cannot hold a third card; it can
 *   only make the two narrower and leave a dead column beside them. Measured
 *   at 1920 with the act shut, a 1,326px panel: three steps took `This cycle`
 *   from **1,107px to 1,169px** and the cards from 653px to 429px, for an
 *   empty third track. Same arithmetic that moved `moodphase` out of Cycle's
 *   `patterns` group, one level up.
 *
 * The step sets are literal strings, not interpolated, because Tailwind reads
 * the source: a class built from a prop emits no CSS, exits 0, and the element
 * silently inherits. That is the stale-utility trap in CLAUDE.md, and a grid
 * that quietly has no columns is how `CardGrid` drew a 1,926px panel in three
 * tracks with no error anywhere.
 */
const STEPS = {
  /** ~450px per card, up to four. Stat tiles and a sentence. */
  stat: '@min-[58rem]/page:grid-cols-2 @min-[88rem]/page:grid-cols-3 @min-[116rem]/page:grid-cols-4',
  /** ~330px per card, two at most. Rings, diagrams, short legends. */
  pair: '@min-[42rem]/page:grid-cols-2',
} as const

/**
 * A card that takes the whole panel whatever the step — a chart with thirty
 * cycle days on its x-axis, a grid with a computed `minWidth`.
 *
 * NOT `SPAN_2`. That is `md:col-span-2 2xl:col-span-2`, two VIEWPORT queries,
 * and this grid's columns answer to the container: at 1920 with the act shut
 * the panel is 1,326px and `2xl` is true, so a card asking for "two of three"
 * would get two of a grid that has four. `col-span-full` is the only spelling
 * that means the same thing at every step.
 */
export const SPAN_PANEL = 'col-span-full'

export function StatGrid({ children, steps = 'stat' }: {
  children: ReactNode
  /** Which column ladder to use. See `STEPS`. */
  steps?: keyof typeof STEPS
}) {
  return (
    <div data-card-grid className={`page-enter grid grid-cols-[minmax(0,1fr)] items-start gap-4 sm:gap-5 ${STEPS[steps]}`}>
      {children}
    </div>
  )
}
