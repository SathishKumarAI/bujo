import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
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
  onNavigate,
  onToggleCollapse,
}: {
  items: NavItem[]
  groupOrder: string[]
  view: ViewId
  collapsed: boolean
  navOpen: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
}) {
  return (
    <nav
      className={`${navOpen ? 'block' : 'hidden'} group/sb relative border-b border-border bg-card md:sticky md:top-0 md:block md:h-screen md:shrink-0 md:self-start md:overflow-visible md:border-b-0 ${collapsed ? 'md:w-14' : 'md:w-60'}`}
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
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => onNavigate(n.id)}
                          aria-current={active ? 'page' : undefined}
                          title={n.label}
                          className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            active ? 'bg-secondary/70 font-medium text-foreground' : 'text-subtext0 hover:bg-secondary/40 hover:text-subtext1'
                          }`}
                        >
                          {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
                          <Icon size={17} className={`shrink-0 ${active ? 'text-primary' : 'text-overlay1 group-hover:text-subtext0'}`} aria-hidden />
                          <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{n.label}</span>
                        </button>
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
  )
}
