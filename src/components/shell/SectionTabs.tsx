import { Link, useLocation } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { pathFor, tabsFor, viewForPath, type SectionId } from '../../lib/routes'

/**
 * The tab strip on a section landing.
 *
 * The active tab is derived from the URL, never held in state — that is the
 * whole point of it being a sub-route. Each trigger is a real `<Link>` (via
 * Radix's `asChild`), so a tab can be middle-clicked, cmd-clicked, bookmarked
 * and reached with Back, which a `<button>` driving `useState` could not do.
 *
 * Renders nothing for a section with one tab: a tab strip that offers no choice
 * is furniture.
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
  const active = viewForPath(pathname)

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
      <Tabs value={active ?? tabs[0].id}>
        <TabsList variant="line" className="w-max">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} asChild className="max-md:min-h-[44px] shrink-0">
              <Link to={pathFor(t.id)}>{t.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
