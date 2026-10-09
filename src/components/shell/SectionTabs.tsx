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
  vertical = false,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  /** Stack the tabs - the rail form. Same list, same hrefs, one source. */
  vertical?: boolean
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
  /**
   * The VERTICAL counterpart. COD-298.
   *
   * The rail stacks the section nav and this list in one `overflow-y-auto`
   * column, and Body is the section that does not fit: eleven tabs plus five
   * sections. Matching the nav's 38px rhythm (see the row's className) made it
   * fit at 1440x900 — it had overflowed by 102px, which put **Cycle**, the last
   * tab, off the bottom — but a 1280x720 laptop is still 56px short, and there
   * the hidden pair is Recovery and Cycle.
   *
   * So the rhythm is the fix and this is the floor under it: when the list
   * cannot fit, the one tab that must never be the hidden one is the tab you
   * are on. Otherwise the page says Cycle and the rail shows Fitness…Nutrition,
   * which is the same defect the horizontal effect above exists to prevent,
   * turned ninety degrees.
   *
   * Adjusts `scrollTop` on the rail's own scroller, found by walking up, for
   * the reason the horizontal one sets `scrollLeft`: `scrollIntoView` walks
   * EVERY scrollable ancestor, so it would also scroll the page and throw the
   * header away. Rect maths, so running it twice is idempotent.
   */
  useEffect(() => {
    if (!vertical) return
    const a = activeRef.current
    if (!a) return
    let sc: HTMLElement | null = a.parentElement
    while (sc && sc !== document.body) {
      const cs = getComputedStyle(sc)
      if (/auto|scroll/.test(cs.overflowY) && sc.scrollHeight > sc.clientHeight + 1) break
      sc = sc.parentElement
    }
    if (!sc || sc === document.body) return
    const reveal = () => {
      const sr = sc!.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      if (ar.top >= sr.top && ar.bottom <= sr.bottom) return // already in view
      // `block: 'nearest'` semantics by hand: move the minimum distance.
      sc!.scrollTop += ar.top < sr.top ? ar.top - sr.top : ar.bottom - sr.bottom
    }
    const id = requestAnimationFrame(reveal)
    let live = true
    // Same font race as the horizontal effect: row heights settle late.
    void document.fonts?.ready.then(() => { if (live) reveal() })
    const ro = new ResizeObserver(reveal)
    ro.observe(sc)
    return () => { live = false; cancelAnimationFrame(id); ro.disconnect() }
  }, [vertical, view, gates.cycle, gates.nofap])

  useEffect(() => {
    const row = rowRef.current
    const a = activeRef.current
    if (!row || !a || vertical) return
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
  }, [vertical, view, gates.cycle, gates.nofap])

  const section = sectionOf(view)
  if (!section) return null
  const tabs = tabsOf(section, gates)
  if (tabs.length < 2) return null

  return (
    <nav
      ref={rowRef}
      aria-label="Section"
      // Two layouts, and the horizontal one is now PHONE ONLY — its sole call
      // site is inside the top bar's `md:hidden` wrapper, because the rail
      // carries these on desktop. Every `md:` utility that used to live here
      // went with that: the row was centred from `md` up by auto margins on
      // the first and last tab, and `md:ml-0 md:flex-none` undid the phone
      // gutter alignment at the same breakpoint. Both now describe a state
      // that renders nowhere, and Tailwind would never have told us — a stale
      // utility emits no CSS and fails no build.
      //
      // What stays is the phone row: horizontal scroll rather than wrap, since
      // six tabs at 360px would stack into two rows and shove the page down;
      // and `-ml-3`, which cancels the first tab's own `px-3` so its label
      // starts on the header's 16px gutter, level with the content beneath it.
      className={
        vertical
          // `border-t` here rather than in `SideRail`: the rule has to exist
          // exactly when this list does, and this component returns null
          // below two tabs.
          ? 'mt-2 flex min-w-0 flex-col gap-0.5 border-t border-line pt-2'
          : '-ml-3 flex min-w-0 flex-1 gap-1 overflow-x-auto'
      }
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
            // ── Two rhythms in one column, and only one of them was right ──
            //
            // The horizontal row is the PHONE's tab strip, so it keeps the
            // 44px minimum touch target (WCAG 2.5.5) via `min-h-11`, plus
            // `my-1` so the pills do not touch the scroll edges.
            //
            // The vertical rail is `hidden md:flex` in `SideRail` — desktop,
            // pointer — and it sits directly under `SectionNav`, which uses
            // `min-h-9` and no margin. Carrying the phone's spacing into it
            // made the SUB-navigation 42% looser than the primary navigation
            // above it: measured on Body at 1440x849, section rows ran at a
            // 38px pitch and tab rows at 54px (`my-1` 8 + `min-h-11` 44 +
            // `gap-0.5` 2).
            //
            // Eleven tabs at 54px is 601px where the nav's own rhythm would be
            // 418px, and the rail's scroller overflowed by exactly **102px** —
            // which put **Cycle, the last tab, off the bottom**. Reported as
            // "when I click on Body, why do I need to scroll down to get to
            // Cycle". Matching the rhythm reclaims 183px and leaves 81px of
            // headroom, so the list fits with room for another tab or two.
            //
            // The fix is the rhythm, not a smaller number: two lists stacked in
            // one column that disagree about row height read as two unrelated
            // things, which is the second half of why this looked wrong.
            //
            // A NEUTRAL fill, deliberately one step quieter than the accent
            // pill the section nav above it uses. Two rows of navigation both
            // painted in the accent is two things claiming to be where you
            // are; the section owns the accent, the tab owns the surface. This
            // was a 2px `border-foreground` underline, which was both the
            // loudest possible rule and the same weight as the row's own
            // bottom border.
            // The centring that used to live here (`md:first:ml-auto
            // md:last:mr-auto`) is gone with the desktop row. Keeping the
            // finding, because it is about `justify-center` and not about this
            // row: `justify-center` distributes NEGATIVE free space too, so an
            // overflowing scroll container is pushed off BOTH edges and
            // `scrollLeft` cannot go below 0 — the leading items become
            // unreachable by any means. Measured here: Body's twelve tabs at
            // 1440px put Fitness at a negative x and `npm run a11y` died on
            // "no tab with that name inside Body" after
            // `scrollIntoViewIfNeeded` failed to reach it. Auto margins
            // resolve to 0 the moment free space is negative; `justify-center`
            // does not. Reach for the margins if you ever centre an
            // overflowing row again.
            className={`inline-flex flex-none items-center rounded-control px-3 text-body font-medium whitespace-nowrap transition-colors ${
              vertical ? 'min-h-9' : 'my-1 min-h-11'
            } ${
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
