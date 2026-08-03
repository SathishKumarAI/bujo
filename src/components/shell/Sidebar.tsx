import { Sidebar as SidebarIcon, SidebarSimple } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { ViewId } from './viewChrome'
import type { SectionId } from '../../lib/routes'

export interface NavItem {
  id: ViewId
  label: string
  icon: IconGlyph
  group: string
}

function Brand() {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-title font-medium tracking-tight text-foreground">bujo</span>
      <span className="text-primary">✦</span>
    </div>
  )
}

/**
 * The navigation rail: five sections, no group headers.
 *
 * Headers were scaffolding for a 17-item rail. Five items do not need them, and
 * a heading above a single row is chrome that says nothing.
 *
 * Active state is matched on the **section**, not the view id, so `/body/pullups`
 * still lights up Body. Matching on the id would have left the rail looking
 * unselected on every sub-route, which is most of the app.
 */
export function Sidebar({
  items,
  sections,
  activeSection,
  collapsed,
  navOpen,
  autoHide = false,
  onNavigate,
  onToggleCollapse,
}: {
  items: NavItem[]
  /** Parallel to `items` — which section each rail entry stands for. */
  sections: (SectionId | 'system')[]
  activeSection: SectionId | 'system' | null
  collapsed: boolean
  navOpen: boolean
  autoHide?: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
}) {
  // Auto-hide: a thin left-edge zone reveals the sidebar as a fixed overlay.
  const deskClass = autoHide
    ? 'md:fixed md:top-0 md:left-0 md:z-50 md:h-screen md:w-60 md:-translate-x-full md:border-r md:border-line md:shadow-2xl md:transition-transform md:duration-200 md:ease-out md:peer-hover:translate-x-0 md:hover:translate-x-0'
    : `md:sticky md:top-0 md:h-screen md:shrink-0 md:self-start md:overflow-visible md:border-b-0 ${collapsed ? 'md:w-14' : 'md:w-60'}`
  return (
    <>
    {autoHide && <div className="peer fixed top-0 left-0 z-40 hidden h-screen w-2.5 md:block" aria-hidden />}
    <nav
      className={[
        // Mobile: an iOS-style slide-in drawer (fixed overlay, off-canvas until open).
        'group/sb fixed inset-y-0 left-0 z-50 w-72 max-w-[82%] border-r border-line bg-card shadow-2xl',
        'transition-transform duration-300 ease-out will-change-transform',
        navOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: dock it back into the layout (the auto-hide variant manages its own transform).
        autoHide ? '' : 'md:static md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:border-r-0 md:shadow-none',
        'md:block',
        deskClass,
      ].join(' ')}
    >
      <div
        className={`bg-card transition-[width] duration-200 ease-out md:h-screen md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-line ${
          collapsed ? 'md:w-14' : 'md:w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className={collapsed ? 'md:hidden' : ''}><Brand /></span>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
            title={collapsed ? 'Pin open' : 'Collapse'}
            className="hidden place-items-center text-fg-2 hover:text-foreground md:grid"
          >
            {collapsed ? <AppIcon as={SidebarIcon} size="md" /> : <AppIcon as={SidebarSimple} size="md" />}
          </button>
        </div>
        <div className="flex flex-col gap-0.5 px-2.5 pt-2 pb-3">
          <ul>
            {items.map((n, i) => {
              const Icon: IconGlyph = n.icon
              const active = activeSection != null && sections[i] === activeSection
              const btn = (
                <button
                  onClick={() => onNavigate(n.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-body transition-colors max-md:min-h-[44px] ${
                    active ? 'bg-secondary/70 font-medium text-foreground' : 'text-fg-2 hover:bg-secondary/40 hover:text-fg-1'
                  }`}
                >
                  {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-pill bg-primary" aria-hidden />}
                  <AppIcon as={Icon} size="md" active={active} className={`shrink-0 ${active ? 'text-brand-text' : 'text-fg-2 group-hover:text-fg-2'}`} />
                  <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{n.label}</span>
                </button>
              )
              return (
                <li key={n.label}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>{n.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    btn
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
    </>
  )
}
