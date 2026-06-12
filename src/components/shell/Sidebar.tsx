import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { ViewId } from './viewChrome'

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  group: string
}

function Brand() {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">bujo</span>
      <span className="text-primary">✦</span>
    </div>
  )
}

/** Grouped, collapsible navigation rail. Mobile: shown when navOpen. */
export function Sidebar({
  items,
  groupOrder,
  view,
  collapsed,
  navOpen,
  autoHide = false,
  onNavigate,
  onToggleCollapse,
}: {
  items: NavItem[]
  groupOrder: string[]
  view: ViewId
  collapsed: boolean
  navOpen: boolean
  autoHide?: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
}) {
  // Auto-hide: a thin left-edge zone reveals the sidebar as a fixed overlay.
  const deskClass = autoHide
    ? 'md:fixed md:top-0 md:left-0 md:z-50 md:h-screen md:w-60 md:-translate-x-full md:border-r md:border-border md:shadow-2xl md:transition-transform md:duration-200 md:ease-out md:peer-hover:translate-x-0 md:hover:translate-x-0'
    : `md:sticky md:top-0 md:h-screen md:shrink-0 md:self-start md:overflow-visible md:border-b-0 ${collapsed ? 'md:w-14' : 'md:w-60'}`
  return (
    <>
    {autoHide && <div className="peer fixed top-0 left-0 z-40 hidden h-screen w-2.5 md:block" aria-hidden />}
    <nav
      className={[
        // Mobile: an iOS-style slide-in drawer (fixed overlay, off-canvas until open).
        'group/sb fixed inset-y-0 left-0 z-50 w-72 max-w-[82%] border-r border-border bg-card shadow-2xl',
        'transition-transform duration-300 ease-out will-change-transform',
        navOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: dock it back into the layout (the auto-hide variant manages its own transform).
        autoHide ? '' : 'md:static md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:border-r-0 md:shadow-none',
        'md:block',
        deskClass,
      ].join(' ')}
    >
      <div
        className={`bg-card transition-[width] duration-200 ease-out md:h-screen md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-border ${
          collapsed ? 'md:w-14' : 'md:w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className={collapsed ? 'md:hidden' : ''}><Brand /></span>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
            title={collapsed ? 'Pin open' : 'Collapse'}
            className="hidden text-overlay1 hover:text-foreground md:block"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <div className="flex flex-col gap-0.5 px-2.5 pb-3">
          {groupOrder.map((group) => {
            const groupItems = items.filter((n) => n.group === group)
            if (groupItems.length === 0) return null
            return (
              <div key={group}>
                <p className={`px-3 pt-4 pb-1 text-[10px] font-medium tracking-wider text-overlay0 uppercase ${collapsed ? 'md:hidden' : ''}`}>
                  {group}
                </p>
                <ul>
                  {groupItems.map((n) => {
                    const Icon: LucideIcon = n.icon
                    const active = view === n.id
                    const btn = (
                      <button
                        onClick={() => onNavigate(n.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'bg-secondary/70 font-medium text-foreground' : 'text-subtext0 hover:bg-secondary/40 hover:text-subtext1'
                        }`}
                      >
                        {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
                        <Icon size={17} className={`shrink-0 ${active ? 'text-primary' : 'text-overlay1 group-hover:text-subtext0'}`} aria-hidden />
                        <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{n.label}</span>
                      </button>
                    )
                    return (
                      <li key={n.id}>
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
            )
          })}
        </div>
      </div>
    </nav>
    </>
  )
}
