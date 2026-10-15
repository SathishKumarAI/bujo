import type { ReactNode } from 'react'

/**
 * The review panel's card grid — on a CONTAINER query, not the viewport.
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
 * `@container/page` is declared by `Review`. The steps are the panel's real
 * widths, not round numbers:
 *
 * | container | columns | card |
 * |---|---|---|
 * | < 768px (`@3xl`) — log open, panel 678 | 1 | the full **702** — a seven-day row fits |
 * | ≥ 768px — log hidden, panel 1110 | 2 | **569** |
 * | ≥ 1152px (`@6xl`) — a shell wider than this page's tier ever gets today | 3 | ~450 |
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
export function PanelGrid({ children }: { children: ReactNode }) {
  return (
    <div data-card-grid className="page-enter grid grid-cols-[minmax(0,1fr)] items-start gap-4 sm:gap-5 @3xl/page:grid-cols-2 @6xl/page:grid-cols-3">
      {children}
    </div>
  )
}
