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
    <Tabs value={active ?? tabs[0].id} className="mb-4 sm:mb-5">
      <TabsList variant="line">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id} asChild>
            <Link to={pathFor(t.id)}>{t.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
