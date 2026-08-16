import { Icon as AppIcon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { hrefFor } from '../../lib/deepLink'
import { SECTIONS, landingOf, sectionOf, type SectionGates } from './sections'
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

/**
 * Mobile-only bottom tab bar (hidden ≥ md): the five sections, equal width, no
 * centre FAB. Capture lives in the top bar's Quick add.
 *
 * It reads `SECTIONS` directly. It used to take the rail's items and resolve a
 * hand-written `PRIMARY` list of five ids against them, which failed silently:
 * retiring a nav id dropped its tab with no error, and collapsing the Body
 * cluster once left the bar at three. There is no list to fall out of sync now
 * — the sections *are* the tabs, which is part of why there are five of them.
 *
 * This is the whole of navigation on a phone: the top bar hides its section row
 * below `md` precisely because this bar is the reachable copy.
 */
export function BottomNav({
  view,
  gates,
  onNavigate,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
}) {
  const hidden = useHideOnScroll()
  const current = sectionOf(view)

  return (
    <nav
      aria-label="Sections"
      className={`fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-card/95 backdrop-blur transition-transform duration-300 md:hidden ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {SECTIONS.map((s) => {
        const active = current === s.id
        // The section's first *visible* tab, so a gated-off Cycle never makes
        // Body land on a page that is not there.
        const target = landingOf(s.id, gates)
        return (
          <a
            key={s.id}
            href={hrefFor(target)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              onNavigate(target)
            }}
            aria-label={s.label}
            aria-current={active ? 'page' : undefined}
            // 44px minimum target (WCAG 2.5.5) — `py-1.5` around a 20px icon
            // and a micro label came out at 40 on a phone.
            className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-micro ${active ? 'text-primary' : 'text-fg-2'}`}
          >
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-pill bg-primary" />}
            <AppIcon as={s.icon} size="lg" active={active} />
            {s.label}
          </a>
        )
      })}
    </nav>
  )
}
