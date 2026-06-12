import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus, PenLine, Dumbbell, CheckSquare, Target, X } from 'lucide-react'
import type { NavItem } from './Sidebar'
import type { ViewId } from './viewChrome'

// The handful of views worth a thumb-tap on a phone. The rest stay in the
// hamburger drawer. Center slot is a quick-action FAB.
const PRIMARY: ViewId[] = ['today', 'monthly', 'trackers', 'fitness']

/**
 * Mobile-only bottom tab bar (hidden ≥ md). Four primary destinations plus a
 * raised FAB that opens a sheet of the most-used actions — fastest path to the
 * things a phone user does over and over (capture, log a workout, check habits).
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
  const [menu, setMenu] = useState(false)
  const byId = new Map(items.map((n) => [n.id, n]))
  const tabs = PRIMARY.map((id) => byId.get(id)).filter(Boolean) as NavItem[]
  const left = tabs.slice(0, 2)
  const right = tabs.slice(2)

  // Frequently-used quick actions surfaced from the FAB.
  const actions: { label: string; icon: LucideIcon; color: string; run: () => void }[] = [
    { label: 'Quick add', icon: PenLine, color: 'mauve', run: onQuickAdd },
    { label: 'Log workout', icon: Dumbbell, color: 'teal', run: () => onNavigate('fitness') },
    { label: 'Habits', icon: CheckSquare, color: 'green', run: () => onNavigate('trackers') },
    { label: 'Goals', icon: Target, color: 'peach', run: () => onNavigate('goals') },
  ]

  const Tab = (n: NavItem) => {
    const Icon = n.icon as LucideIcon
    const active = view === n.id
    return (
      <button
        key={n.id}
        onClick={() => onNavigate(n.id)}
        aria-label={n.label}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] ${active ? 'text-primary' : 'text-overlay1'}`}
      >
        <Icon size={20} aria-hidden />
        {n.label}
      </button>
    )
  }

  return (
    <>
      {/* Quick-action sheet (scrim + popup above the bar). */}
      {menu && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-crust/50" />
          <div
            className="absolute right-3 bottom-[4.5rem] left-3 rounded-2xl border border-border bg-card p-2 shadow-xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              {actions.map((a) => {
                const Icon = a.icon
                return (
                  <button
                    key={a.label}
                    onClick={() => { setMenu(false); a.run() }}
                    className="press-3d flex items-center gap-2 rounded-xl border border-surface0 bg-base px-3 py-2.5 text-sm text-subtext1"
                  >
                    <Icon size={18} style={{ color: `var(--color-${a.color})` }} /> {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {left.map(Tab)}
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label={menu ? 'Close actions' : 'Quick actions'}
          aria-expanded={menu}
          className="press-3d -mt-5 mx-1 grid h-12 w-12 shrink-0 self-center place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform"
          style={{ transform: menu ? 'rotate(45deg)' : 'none' }}
        >
          {menu ? <X size={22} /> : <Plus size={22} />}
        </button>
        {right.map(Tab)}
      </nav>
    </>
  )
}
