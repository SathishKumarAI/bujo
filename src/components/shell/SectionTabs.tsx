import { useEffect, useRef } from 'react'
import { hrefFor } from '../../lib/deepLink'
import { tabsOf, sectionOf, type SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * The tab row for a section landing page — the second row of the top bar.
 *
 * Rendered once in the shell rather than in each of the fifteen views it sits
 * above — a tab row is a property of *where you are*, and putting it in the
 * views would mean fifteen copies that drift.
 *
 * It draws no border and no padding of its own: it is a cell inside the
 * header's second row, which owns the rule under it and the gutter beside it.
 * The active underline still lands on that rule, because the row stretches its
 * children to full height.
 *
 * **The tab is in the URL, not in state.** Each tab is a real `<a href>`
 * pointing at `?view=<id>`, so ⌘-click opens it in a new browser tab and Back
 * walks the tabs.
 *
 * **Not built on the shadcn `Tabs` primitive**, which the brief asked for, and
 * the reason is worth keeping: `Tabs` implements the ARIA *tabs* pattern, where
 * each trigger owns a `tabpanel` in the same document and `aria-controls`
 * points at it. These tabs have no panels — each one is a different page. Radix
 * still emitted `role="tab"` and an `aria-controls` naming a panel that is
 * never rendered, which `axe` flags `critical: aria-valid-attr-value`, and
 * which leaves a screen reader following a pointer to nothing.
 *
 * This is navigation, so it is marked up as navigation: a `<nav>` of links with
 * `aria-current="page"`. Same look, honest semantics, less code.
 *
 * Renders nothing for a section with one tab (Today), which is the point of
 * Today having none.
 */
export function SectionTabs({
  view,
  gates,
  onNavigate,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
}) {
  const rowRef = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Bring the current tab into view. Body's six tabs measure 571px against a
  // 491px row, and the row opened at `scrollLeft: 0` — so arriving on
  // `?view=nofap` from a link, the rail or a redirect showed Fitness…Coaching
  // with Recovery clipped off the right edge, entirely invisible at 390px. The
  // page said Recovery and the tab row said Fitness, which is the one thing a
  // tab row must never do.
  //
  // Setting `scrollLeft` rather than calling `scrollIntoView`: the latter walks
  // every scrollable ancestor, so on a short viewport it also scrolls the page
  // itself — landing on a tab would jump you past the header. This touches only
  // the row.
  //
  // Measured from `getBoundingClientRect`, not `offsetLeft`, and run after
  // paint. Two reasons, both found by measuring rather than reasoning:
  //
  // 1. The row is not `position: relative`, so an `offsetLeft` is relative to
  //    `<body>` and stops agreeing with the row the moment either one moves.
  // 2. On a cold load the variable fonts have not resolved when the effect
  //    fires. The row measured 80px narrower than its settled width, the scroll
  //    clamped to that stale maximum, and Recovery came to rest still clipped —
  //    a fix that moved the row and did not finish the job. `fonts.ready`
  //    re-runs it once the real widths exist.
  //
  // Rect maths is position-aware, so running it twice is idempotent rather than
  // cumulative.
  useEffect(() => {
    const row = rowRef.current
    const a = activeRef.current
    if (!row || !a) return
    const centre = () => {
      const rr = row.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      if (ar.left >= rr.left && ar.right <= rr.right) return // already in view
      row.scrollLeft += ar.left - rr.left - (rr.width - ar.width) / 2
    }
    const id = requestAnimationFrame(centre)
    let live = true
    void document.fonts?.ready.then(() => { if (live) centre() })
    // Re-centre when the row itself changes width. The effect keys on `view`
    // and the gates, so a rotation or a window resize re-clipped the active tab
    // and nothing put it back: measured at 390px with Body's eight tabs, the
    // row held 734px of content and `aria-current` sat outside the visible
    // 471px. A fresh load at the same width centres fine, which is what makes
    // this easy to miss — you have to resize to see it.
    const ro = new ResizeObserver(centre)
    ro.observe(row)
    return () => { live = false; cancelAnimationFrame(id); ro.disconnect() }
  }, [view, gates.cycle, gates.nofap])

  const section = sectionOf(view)
  if (!section) return null
  const tabs = tabsOf(section, gates)
  if (tabs.length < 2) return null

  return (
    <nav
      ref={rowRef}
      aria-label="Section"
      // Horizontal scroll rather than wrap: six tabs at 360px would stack into
      // two rows and shove the page down on every phone.
      // Centred from `md` up by AUTO MARGINS on the first and last tab, NOT by
      // `justify-content: center` — see the tab's own className below.
      //
      // Below `md` the row is the flex child it was, `-ml-3` and all: that
      // negative margin cancels the first tab's own `px-3` so its label starts
      // on the header's 16px gutter, level with the page content beneath it.
      // The alignment it buys is real on a phone and meaningless once the row
      // is centred, so it is dropped at the same breakpoint the centring
      // starts.
      className="-ml-3 flex min-w-0 flex-1 gap-1 overflow-x-auto md:ml-0 md:flex-none"
    >
      {tabs.map((t) => {
        // Companion views (Strength's deeper tools, the retired activity views)
        // belong to the section but are not tabs — nothing is current, and that
        // is honest: you are inside Body but not on one of its surfaces.
        const active = t.view === view
        return (
          <a
            key={t.view}
            ref={active ? activeRef : undefined}
            href={hrefFor(t.view)}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              // Let the browser handle modified clicks — that is the whole
              // reason these are anchors.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              onNavigate(t.view)
            }}
            // 44px minimum touch target (WCAG 2.5.5) via `min-h-11`.
            //
            // A NEUTRAL fill, deliberately one step quieter than the accent
            // pill the section nav above it uses. Two rows of navigation both
            // painted in the accent is two things claiming to be where you
            // are; the section owns the accent, the tab owns the surface. This
            // was a 2px `border-foreground` underline, which was both the
            // loudest possible rule and the same weight as the row's own
            // bottom border.
            // `first:ml-auto last:mr-auto` is how this row is centred, and
            // `justify-center` on the scroll container is NOT an alternative:
            // it distributes NEGATIVE free space too, so an overflowing row is
            // pushed off BOTH edges and `scrollLeft` cannot go below 0 — the
            // leading tabs become unreachable by any means. Measured: with
            // `justify-center`, Body's twelve tabs at 1440px put Fitness at a
            // negative x and `npm run a11y` died on "no tab with that name
            // inside Body" after `scrollIntoViewIfNeeded` failed to reach it.
            // Auto margins resolve to 0 the moment free space is negative, so
            // an overflowing row falls back to left-aligned and scrolls.
            className={`my-1 inline-flex min-h-11 flex-none items-center rounded-control px-3 text-body font-medium whitespace-nowrap transition-colors md:first:ml-auto md:last:mr-auto ${
              active
                ? 'bg-ink-2 text-foreground shadow-raise'
                : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
            }`}
          >
            {t.label}
          </a>
        )
      })}
    </nav>
  )
}
