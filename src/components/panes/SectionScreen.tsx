import type { ReactNode } from 'react'

/**
 * One section, filling one screen, with the page pinned.
 *
 * The caller renders a section switcher and hands this the cards of whichever
 * section is open. This component is only the box: a fixed height taken from
 * the viewport, and `column-fill: auto` packing the cards into columns that
 * fill that height before starting the next one. The layout is
 * `styles/section-screen.css`.
 *
 * ── Why this is a component and not a class string ─────────────────────────
 *
 * Because the `aria` wiring below is the half that gets forgotten. The box is
 * a scrollport whenever a section outgrows one screen, and a scrollport that a
 * keyboard cannot reach is axe's `scrollable-region-focusable` — the exact
 * violation the repo's own gate was armed to catch. Exporting
 * `className="section-screen"` would ship the layout and leave the `tabIndex`,
 * the role and the label to each call site, which is how a shared primitive
 * ends up correct in one place and wrong in three.
 *
 * ── What it replaced ───────────────────────────────────────────────────────
 *
 * An earlier attempt put all four Settings sections on screen at once, side by
 * side. Wrong reading: four 328px columns at 1440, every card narrower than it
 * gets on a phone. The request was that *one section* fit *one page* — which
 * is this, and which also keeps the page comprehensible, because one screen
 * now answers one question instead of four at a quarter size each.
 *
 * ── Honest about the overflow ──────────────────────────────────────────────
 *
 * A section can still hold more than three columns of screen. It then scrolls
 * **sideways**, which is deliberate and is the direction asked for — and is
 * also why `scrollLeft` is worth watching: a section that routinely needs a
 * fourth column is a section with too much in it, not a layout that needs a
 * fourth breakpoint. `Settings.test.tsx` and the browser probe in the PR both
 * record the per-section numbers so that stays visible.
 */
export function SectionScreen({
  children,
  label,
}: {
  children: ReactNode
  /** Names the scrollport. Should name the section, e.g. "Sync & privacy". */
  label: string
}) {
  return (
    <div
      className="section-screen"
      // `group`, not `region`: the cards inside are already the page's
      // structure, and wrapping them in a landmark adds a level to the
      // document outline that describes a box rather than a topic.
      role="group"
      aria-label={label}
      // Focusable because it can scroll. A scrollport reachable only by
      // pointer is unreachable for a keyboard, and the horizontal direction is
      // the one a browser will not scroll for you on arrow keys unless the
      // element has focus.
      tabIndex={0}
    >
      {children}
    </div>
  )
}
