import { Icon as AppIcon } from '@/components/Icon'
import type { Icon as IconGlyph } from '@/components/icons'
import { useEffect, useState } from 'react'
import type { NavItem } from './Sidebar'
import type { ViewId } from './viewChrome'
import type { SectionId } from '../../lib/routes'

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

/**
 * Mobile-only bottom tab bar (hidden ≥ md): the same five sections as the rail,
 * equal width, no centre FAB. Capture lives in the top bar's Quick add.
 *
 * This used to keep its own hand-picked list of five view ids, because the
 * sidebar had seventeen and something had to choose. Now that the rail *is*
 * five, a second list would only be a way for the two to disagree.
 */
export function BottomNav({
  items,
  sections,
  activeSection,
  onNavigate,
}: {
  items: NavItem[]
  sections: (SectionId | 'system')[]
  activeSection: SectionId | 'system' | null
  onNavigate: (id: ViewId) => void
}) {
  const hidden = useHideOnScroll()

  return (
    <nav className={`fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-card/95 backdrop-blur transition-transform duration-300 md:hidden ${hidden ? 'translate-y-full' : 'translate-y-0'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map((n, i) => {
        const Icon = n.icon as IconGlyph
        const active = activeSection != null && sections[i] === activeSection
        return (
          <button
            key={n.label}
            onClick={() => onNavigate(n.id)}
            aria-label={n.label}
            aria-current={active ? 'page' : undefined}
            // min-h-11 is 44px — the floor for a thumb target.
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
