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
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div data-card-grid className="page-enter grid grid-cols-[minmax(0,1fr)] items-start gap-4 sm:gap-5 @min-[58rem]/page:grid-cols-2 @min-[88rem]/page:grid-cols-3 @min-[116rem]/page:grid-cols-4">
      {children}
    </div>
  )
}
