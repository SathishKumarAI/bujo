import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import type { NavItem } from './Sidebar'
import type { ViewId } from './viewChrome'

// The handful of views worth a thumb-tap on a phone. The rest stay in the
// hamburger drawer. Center slot is a quick-add FAB — the one universal action.
const PRIMARY: ViewId[] = ['today', 'monthly', 'trackers', 'fitness']

/**
 * Mobile-only bottom tab bar (hidden ≥ md): four primary destinations + a raised
 * quick-add FAB. Deliberately minimal — capture is the one action every screen
 * needs; everything else lives in its own view.
 */
export function BottomNav({
  items,
  view,
  onNavigate,
  onQuickAdd,
}: {
  items: NavItem[]
  view: ViewId
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
}) {
  const byId = new Map(items.map((n) => [n.id, n]))
  const tabs = PRIMARY.map((id) => byId.get(id)).filter(Boolean) as NavItem[]
  const left = tabs.slice(0, 2)
  const right = tabs.slice(2)

  const Tab = (n: NavItem) => {
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
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {left.map(Tab)}
      <button
        onClick={onQuickAdd}
        aria-label="Quick add"
        className="press-3d -mt-5 mx-1 grid h-12 w-12 shrink-0 self-center place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={22} />
      </button>
      {right.map(Tab)}
    </nav>
  )
}
