import { Icon as AppIcon } from '@/components/Icon'
import type { Icon as IconGlyph } from '@/components/icons'
import { useEffect, useState } from 'react'
import type { NavItem } from './Sidebar'
import { sectionOf } from './sections'
import type { ViewId } from './viewChrome'

/** Hide the bottom bar when scrolling down, show it when scrolling up. */
function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      setHidden(y > last && y > 64) // down & past the top → hide
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}

// The five views worth a thumb-tap on a phone, for the CLASSIC rail only.
// No FAB — quick-add stays in the top bar. Order matches the daily/training flow.
//
// This list is resolved against the sidebar's items and silently filtered, so an
// id that leaves the nav takes its tab with it without a word. Collapsing the
// Body cluster retired `pickleball` and `pullups` as destinations and left this
// list pointing at both — the bar quietly dropped to three tabs on phones, and
// nothing failed. If you retire a nav id, check here.
//
// The five-section rail has no such problem and needs no such list: it is
// already exactly five items, so the bar renders it straight through. That is
// part of why it is five.
const PRIMARY: ViewId[] = ['today', 'plan', 'fitness', 'nutrition', 'trackers']

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
}) {
  // Section rows carry `section`; when they do, the rail IS the tab bar.
  const byId = new Map(items.map((n) => [n.id, n]))
  const tabs = items.some((n) => n.section)
    ? items
    : (PRIMARY.map((id) => byId.get(id)).filter(Boolean) as NavItem[])
  const hidden = useHideOnScroll()

  return (
    <nav className={`fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-card/95 backdrop-blur transition-transform duration-300 md:hidden ${hidden ? 'translate-y-full' : 'translate-y-0'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map((n) => {
        const Icon = n.icon as IconGlyph
        const active = n.section ? sectionOf(view) === n.section : view === n.id
        return (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            aria-label={n.label}
            aria-current={active ? 'page' : undefined}
            // 44px minimum target (WCAG 2.5.5) — `py-1.5` around a 20px icon
            // and a micro label came out at 40 on a phone.
            className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-micro ${active ? 'text-primary' : 'text-fg-2'}`}
          >
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-pill bg-primary" />}
            <AppIcon as={Icon} size="lg" active={active} />
            {n.label}
          </button>
        )
      })}
    </nav>
  )
}
