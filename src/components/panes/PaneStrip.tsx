import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * N panes side by side, on one screen, with the page itself never scrolling.
 *
 * Wide: every pane is a column and they all fit. Narrow: each pane is the full
 * width and the strip scroll-snaps, so a phone swipes between them. The layout
 * is `styles/panes.css`; this file is the behaviour — which pane you are on,
 * how a deep link reaches one, and the keyboard.
 *
 * ── What it replaces, and the coverage that came back with it ──────────────
 *
 * Settings was a tab shell. **A tab shell holds one panel in the DOM**, which
 * is COD-232: `npm run space -- settings` reported `0.9 shipped · 2 cards` for
 * a four-tab view because that was the Account tab, and `npm run a11y` scanned
 * whatever had mounted — so the passcode form, the erase-everything dialog and
 * every export button had never been seen by axe at any theme or viewport. The
 * workaround was four separate gate entries visiting `?tab=…` by URL: four
 * navigations, four axe runs, at twelve shards each.
 *
 * All four panes are in the DOM here, always. That is not a side effect, it is
 * half the reason to do it — and because a lazily-mounted pane would silently
 * take the coverage away again, `Settings.test.tsx` asserts that every pane's
 * CONTENT renders in one pass — content, not headings, because a heading list
 * is cheap to keep passing while the panel under it stops rendering. The gate
 * entries collapse to one.
 *
 * ── Scrolled out of view is not hidden ─────────────────────────────────────
 *
 * Worth stating because the two look identical from a screenshot and are
 * opposites to every tool: a pane off the right edge of the strip is rendered,
 * measurable, in the accessibility tree and reachable by Tab. `display: none`
 * is none of those. This is why the gates can see all four at once, and also
 * why the keyboard has to work — see `onKeyDown`.
 *
 * ── Why not a carousel library ─────────────────────────────────────────────
 *
 * `scroll-snap-type` plus `scroll-snap-align` is the platform's own version of
 * this, it is two CSS lines, and it keeps momentum, rubber-banding and
 * `prefers-reduced-motion` behaving the way the OS wants rather than the way a
 * library reimplements. The only thing it does not give us is "which pane am I
 * looking at", which is the `IntersectionObserver` below and about fifteen
 * lines. A dependency here would be bigger than the thing it replaced.
 */
export interface Pane {
  /** Stable id. Deep links address a pane by this. */
  id: string
  /** The name. Labels the section, names the dot, and is shown above the pane. */
  label: string
  /** Drawn beside the label. Decorative — the label is what names the pane. */
  icon?: ReactNode
  content: ReactNode
}

export function PaneStrip({
  panes,
  initial,
  label,
  onPaneChange,
}: {
  panes: Pane[]
  /** Pane to open on. An unknown id falls through to the first. */
  initial?: string
  /** Names the scrollport for a screen reader, and the dot row for everyone. */
  label: string
  onPaneChange?: (id: string) => void
}) {
  const first = panes[0]?.id ?? ''
  const known = initial && panes.some((p) => p.id === initial) ? initial : first
  const [active, setActive] = useState(known)
  const stripRef = useRef<HTMLDivElement>(null)
  const paneEls = useRef(new Map<string, HTMLElement>())
  const labelId = useId()

  const show = useCallback((id: string, smooth = true) => {
    const el = paneEls.current.get(id)
    const strip = stripRef.current
    if (!el || !strip) return
    // `scrollIntoView` would also scroll the PAGE to bring the strip into view,
    // and on a layout whose entire point is that the page does not move that is
    // a visible jolt. Driving this scrollport's own offset touches nothing else.
    const left = el.offsetLeft - strip.offsetLeft
    // `Element.scrollTo` is the smooth path and is NOT universal — jsdom has no
    // such method at all, which is how this was found: the deep-link test threw
    // `strip.scrollTo is not a function` before it could assert anything. A
    // throw inside a mount effect takes the whole view down, so the fallback is
    // not politeness, it is the difference between "no animation" and "Settings
    // renders nothing". Assigning `scrollLeft` is supported everywhere.
    if (typeof strip.scrollTo === 'function') {
      strip.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
    } else {
      strip.scrollLeft = left
    }
  }, [])

  // The deep link, applied once the panes have been laid out. `auto` rather
  // than `smooth`: this is where the page starts, not a movement the user made,
  // and animating it would read as the layout settling after load.
  useEffect(() => {
    if (known !== first) show(known, false)
    // Only on mount and when the requested pane changes — re-running this on
    // every `active` change would fight the user's own scroll.
  }, [known, first, show])

  /**
   * Which pane is on screen, for the dots: the one whose left edge is nearest
   * where the strip is scrolled to.
   *
   * **This was an `IntersectionObserver` and the observer was wrong.** It took
   * any entry over a 0.6 ratio as the answer, and on first paint the browser
   * reports every pane at once — so the last one through the callback won and
   * a phone showing *Account* lit the *Data* dot. Caught on a 390px
   * screenshot, not by a test: the dots are the only navigation at that width,
   * so "which one is filled" is the entire state of the control.
   *
   * The repair is not a better threshold, it is a different question. Scroll
   * position is a single number the browser already maintains, there is no
   * ordering to lose a race to, and it is correct before the first scroll
   * event rather than after it. `Math.round` on the index keeps a half-swipe
   * from flickering between two dots.
   */
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const sync = () => {
      const w = strip.clientWidth
      if (!w) return
      // On a wide screen every pane is visible and `scrollLeft` is 0, so this
      // settles on the first — which is the right answer when the dots are
      // hidden anyway.
      const i = Math.round(strip.scrollLeft / w)
      const p = panes[Math.min(panes.length - 1, Math.max(0, i))]
      if (p) setActive(p.id)
    }
    sync()
    strip.addEventListener('scroll', sync, { passive: true })
    return () => strip.removeEventListener('scroll', sync)
  }, [panes])

  useEffect(() => { onPaneChange?.(active) }, [active, onPaneChange])

  /**
   * Arrow keys move between panes when the strip itself has focus.
   *
   * The strip is focusable because it is a scrollport (axe's
   * `scrollable-region-focusable`), and a focusable thing that does nothing on
   * a key press is a trap in the ordinary sense of the word. Guarded on
   * `e.target === e.currentTarget` so an arrow key inside a text field in a
   * pane still moves the caret rather than the layout.
   */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const i = panes.findIndex((p) => p.id === active)
    const next = panes[Math.min(panes.length - 1, Math.max(0, i + dir))]
    if (next) { setActive(next.id); show(next.id) }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        ref={stripRef}
        className="pane-strip"
        // A scrollport needs to be reachable without a pointer. `group` rather
        // than `region`: four panes that are each already a labelled section do
        // not need a fifth landmark wrapped round them.
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {panes.map((p) => (
          <section
            key={p.id}
            className="pane"
            data-pane={p.id}
            aria-labelledby={`${labelId}-${p.id}`}
            ref={(el) => {
              if (el) paneEls.current.set(p.id, el)
              else paneEls.current.delete(p.id)
            }}
          >
            {/* Every pane names itself. In a tab shell the tab carried the
                name and the panel had none, which was fine while only one was
                on screen; with four columns side by side an unnamed column is
                one you have to read to identify.

                **A `<p>`, not an `<h2>`, and that was found by the test rather
                than reasoned out.** `Card` titles are already `h2`, and the
                first card in three of these four panes is titled the same word
                as the pane — so a heading here produced two `h2 "Account"` on
                one screen. Duplicate headings at the same level are worse than
                no heading: they make the document outline claim two sections
                where there is one, and a screen-reader user listing headings
                gets each name twice with no way to tell which is the column.
                `aria-labelledby` does not require a heading, so the region is
                still named and the outline stays honest. */}
            <p
              id={`${labelId}-${p.id}`}
              className="mb-3 flex items-center gap-1.5 text-label font-medium text-fg-2"
            >
              {p.icon}
              {p.label}
            </p>
            {p.content}
          </section>
        ))}
      </div>

      {/* The dots. Hidden once every pane is a column, because then they would
          be a control for a thing that cannot change. `lg:` matches the
          breakpoint in `panes.css` — if one moves, move both. */}
      <nav aria-label={label} className="flex justify-center gap-1 lg:hidden">
        {panes.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setActive(p.id); show(p.id) }}
            aria-current={active === p.id ? 'true' : undefined}
            // The hit area is the button and the dot is only what it draws.
            // A bare 8px target fails every pointer-size rule there is, and on
            // the one layout whose navigation IS these dots that is not a
            // detail.
            className="grid h-11 w-11 place-items-center rounded-pill"
          >
            <span className="sr-only">{p.label}</span>
            <span
              aria-hidden
              className={`h-2 w-2 rounded-pill transition-colors ${active === p.id ? 'bg-fg-1' : 'bg-fg-2/40'}`}
            />
          </button>
        ))}
      </nav>
    </div>
  )
}
