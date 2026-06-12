import type { LucideIcon } from 'lucide-react'
import type { NavItem } from './Sidebar'
import type { ViewId } from './viewChrome'

// The five views worth a thumb-tap on a phone (all also live in the sidebar).
// No FAB — quick-add stays in the top bar. Order matches the daily/training flow.
const PRIMARY: ViewId[] = ['today', 'trackers', 'fitness', 'plan', 'pullups']

/**
 * Mobile-only bottom tab bar (hidden ≥ md): five primary destinations, equal
 * width, no centre FAB. Capture lives in the top bar's Quick add.
 */
export function BottomNav({
  items,
  view,
  onNavigate,
}: {
  items: NavItem[]
  view: ViewId
  onNavigate: (id: ViewId) => void
  onQuickAdd?: () => void
}) {
  const byId = new Map(items.map((n) => [n.id, n]))
  const tabs = PRIMARY.map((id) => byId.get(id)).filter(Boolean) as NavItem[]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map((n) => {
        const Icon = n.icon as LucideIcon
        const active = view === n.id
        return (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            aria-label={n.label}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] ${active ? 'text-primary' : 'text-overlay1'}`}
          >
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
            <Icon size={20} aria-hidden />
            {n.label}
          </button>
        )
      })}
    </nav>
  )
}
