import { Moon, Sidebar as SidebarIcon, SidebarSimple, SlidersHorizontal, Sun } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useJournal } from '../../store'
import { AccountMenu } from './AccountMenu'
import { hrefFor } from '../../lib/deepLink'
import { sectionOf, type SectionId } from './sections'
import type { ViewId } from './viewChrome'

export interface NavItem {
  id: ViewId
  label: string
  icon: IconGlyph
  /** Rail grouping. Empty in the five-section layout, which needs no headers. */
  group: string
  /**
   * Section this row stands for, in the five-section layout. Present means
   * "light this row for any view in the section", so `?view=nutrition` lights
   * Body — `id` alone would only match the section's landing view.
   */
  section?: SectionId
}

function Brand() {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-title font-medium tracking-tight text-foreground">bujo</span>
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
  // Only the groups that actually have items, so the divider rule ("every
  // group but the first") can't draw a rule above the first *rendered* group
  // when an earlier one was filtered out by a settings gate.
  //
  // An empty `groupOrder` means the five-section layout: one flat list, no
  // headers. Seven group headers over seventeen rows were scaffolding for the
  // row count, and five items do not need them.
  const groups = groupOrder.length ? groupOrder.filter((g) => items.some((n) => n.group === g)) : ['']
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
      {/* `flex-col` + a `flex-1` scroller so the footer pins to the bottom of
          the rail instead of trailing the last group. Account, settings and
          theme are app preferences, not destinations — they sat in the top bar
          beside Quick add, which put a monthly-use control next to an hourly
          one. */}
      <div
        className={`flex h-full flex-col bg-card transition-[width] duration-200 ease-out md:h-screen md:overflow-x-hidden md:border-r md:border-line ${
          collapsed ? 'md:w-14' : 'md:w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className={collapsed ? 'md:hidden' : ''}><Brand /></span>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
            title={collapsed ? 'Pin open' : 'Collapse'}
            className="hidden text-fg-2 hover:text-foreground md:block"
          >
            {collapsed ? <AppIcon as={SidebarIcon} size="md" /> : <AppIcon as={SidebarSimple} size="md" />}
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3">
          {groups.map((group, gi) => {
            const groupItems = items.filter((n) => n.group === group)
            return (
              // A hairline between groups, not just a gap. The uppercase label
              // named each group but nothing drew the boundary, so fifteen rows
              // read as one list with headings sprinkled through it.
              <div key={group} className={gi > 0 ? 'mt-1 border-t border-line pt-1' : undefined}>
                {group && (
                  <p className={`px-3 pt-4 pb-1 text-micro font-medium tracking-wider text-fg-2 uppercase ${collapsed ? 'md:hidden' : ''}`}>
                    {group}
                  </p>
                )}
                <ul>
                  {groupItems.map((n) => {
                    const Icon: IconGlyph = n.icon
                    // Section rows match on the *section*, not the landing view,
                    // so Body stays lit on `?view=nutrition`.
                    const active = n.section ? sectionOf(view) === n.section : view === n.id
                    const btn = (
                      <a
                        href={hrefFor(n.id)}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                          e.preventDefault()
                          onNavigate(n.id)
                        }}
                        aria-current={active ? 'page' : undefined}
                        // `min-h-11` — these are the mobile drawer's rows as
                        // well as the desktop rail's, and 39px is under the
                        // 44px target guide (WCAG 2.5.5).
                        className={`group relative flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left text-body transition-colors ${
                          active ? 'bg-secondary/70 font-medium text-foreground' : 'text-fg-2 hover:bg-secondary/40 hover:text-fg-1'
                        }`}
                      >
                        {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-pill bg-primary" aria-hidden />}
                        <AppIcon as={Icon} size="md" active={active} className={`shrink-0 ${active ? 'text-brand-text' : 'text-fg-2 group-hover:text-fg-2'}`} />
                        <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{n.label}</span>
                      </a>
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
        <SidebarFooter view={view} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </nav>
    </>
  )
}

/**
 * The rail's pinned base · account, settings, theme.
 *
 * These are the app's preferences rather than its destinations, so they sit
 * below the divider at the bottom edge — the position every desktop app puts
 * them in — instead of competing with Quick add in the top bar. Theme is a
 * two-way switch here; the full four-theme picker stays in the overflow menu,
 * because a rail row is a toggle and a picker is a menu.
 */
function SidebarFooter({
  view, collapsed, onNavigate,
}: {
  view: ViewId
  collapsed: boolean
  onNavigate: (id: ViewId) => void
}) {
  const { data, setSettings } = useJournal()
  const dark = data.settings.theme === 'mocha'
  const active = view === 'settings'
  const row = 'group flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left text-body transition-colors'
  return (
    <div className="mt-auto shrink-0 border-t border-line px-2.5 py-2">
      <button
        onClick={() => onNavigate('settings')}
        aria-current={active ? 'page' : undefined}
        title="Settings"
        className={`${row} ${active ? 'bg-secondary/70 font-medium text-foreground' : 'text-fg-2 hover:bg-secondary/40 hover:text-fg-1'}`}
      >
        <AppIcon as={SlidersHorizontal} size="md" active={active} className="shrink-0" />
        <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>Settings</span>
      </button>
      <button
        onClick={() => setSettings({ theme: dark ? 'latte' : 'mocha' })}
        title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        className={`${row} text-fg-2 hover:bg-secondary/40 hover:text-fg-1`}
      >
        <AppIcon as={dark ? Sun : Moon} size="md" className="shrink-0" />
        <span className={`whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{dark ? 'Light theme' : 'Dark theme'}</span>
      </button>
      {/* Renders nothing when no account backend is configured, so the footer
          is two rows on a local-only install rather than a dead avatar. */}
      <div className="px-1 pt-1"><AccountMenu onNavigate={onNavigate} /></div>
    </div>
  )
}
