import { Link, useLocation } from 'react-router-dom'
import { pathFor, tabsFor, viewForPath, type SectionId } from '../../lib/routes'

/**
 * The tab strip on a section landing.
 *
 * The active tab is derived from the URL, never held in state — that is the
 * whole point of it being a sub-route. Each entry is a real `<Link>`, so it can
 * be middle-clicked, cmd-clicked, bookmarked and reached with Back, which a
 * `<button>` driving `useState` could not do.
 *
 * Renders nothing for a section with one tab: a tab strip that offers no choice
 * is furniture.
 *
 * ── Why this is a <nav>, not Radix Tabs ──────────────────────────────────────
 *
 * It used to render `Tabs` / `TabsList` / `TabsTrigger` with `asChild`. Radix
 * puts `role="tab"` and `aria-controls="…-content"` on every trigger, but there
 * is no `TabsContent` here — the panel is a *route*. Every tab therefore
 * pointed `aria-controls` at an element id that exists nowhere in the document,
 * which axe reports as a **critical** `aria-valid-attr-value`, on all seven
 * sections that have a strip.
 *
 * The dangling attribute was the symptom; the role was the cause. `role="tab"`
 * promises a tablist — arrow-key traversal, one tab stop for the group, and a
 * panel that swaps in place. This control does none of that: it navigates.
 * Announcing it as a tablist tells a screen-reader user to press arrow keys
 * that do nothing. So it is described as what it is: a list of links, with the
 * current one carrying `aria-current="page"`.
 *
 * The `after:` underline reproduces Radix's `line` variant, so nothing moves.
 */
export function SectionTabs({
  section,
  gates,
}: {
  section: SectionId
  gates: { cycle: boolean; nofap: boolean }
}) {
  const { pathname } = useLocation()
  const tabs = tabsFor(section, gates)
  if (tabs.length < 2) return null
  const active = viewForPath(pathname) ?? tabs[0].id

  return (
    /* Body carries six tabs, which measured 545px inside a 424px column on a
       phone — the strip, not the 1180px container tier, is what actually
       overflows on this app at mobile widths (the tier is a `max-width`, so it
       can never force a page wider than the viewport). Scroll the strip rather
       than wrap it: a wrapped tab row reflows as tabs are gated in and out, and
       moves the tab you were aiming at. `-mx` + `px` so the scroll runs edge to
       edge instead of leaving a dead gutter, and the scrollbar is hidden
       because the cut-off tab is its own affordance. */
    <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:mb-5 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <nav aria-label={`${section} sections`} className="inline-flex w-max items-center gap-1">
        {tabs.map((t) => {
          const current = t.id === active
          return (
            <Link
              key={t.id}
              to={pathFor(t.id)}
              aria-current={current ? 'page' : undefined}
              className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control border border-transparent px-2 py-1 text-body font-medium whitespace-nowrap transition-all max-md:min-h-[44px] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:transition-opacity ${
                current ? 'text-foreground after:opacity-100' : 'text-foreground/60 hover:text-foreground after:opacity-0'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
