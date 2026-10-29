import { Icon as AppIcon } from '@/components/Icon'
import { hrefFor } from '../../lib/deepLink'
import { useState } from 'react'
import { SECTIONS, landingOf, sectionOf, tabsOf, type SectionGates, type SectionId } from './sections'
import { SectionSheet } from './SectionSheet'
import type { ViewId } from './viewChrome'

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
 *
 * **It never hides.** It used to slide away on scroll-down (`useHideOnScroll`),
 * so on a long page the only navigation a phone has was gone until you
 * scrolled back up — owner, 2026-10-29: "so that user doesn't need to again
 * scroll up". An iOS tab bar stays put; so does this one. A second tap on the
 * active section lists all its pages (`SectionSheet`), from anywhere on the
 * page.
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
  const current = sectionOf(view)
  // A second tap on the section you are in lists all its pages — the thumb's
  // way to them, from anywhere on a long page, without scrolling back up to
  // the tab strip (owner: "so that user doesn't need to again scroll up").
  const [sheet, setSheet] = useState<SectionId | null>(null)

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-card/95 backdrop-blur md:hidden"
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
              if (active && tabsOf(s.id, gates).length > 1) setSheet(s.id)
              else onNavigate(target)
            }}
            aria-label={s.label}
            aria-current={active ? 'page' : undefined}
            // 44px minimum target (WCAG 2.5.5) — `py-1.5` around a 20px icon
            // and a micro label came out at 40 on a phone.
            className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-micro transition-colors ${active ? 'text-brand-text' : 'text-fg-2'}`}
          >
            {/* An active indicator BEHIND the icon rather than a 2px hairline
                pinned to the bar's top edge. At phone size that hairline was
                8px wide and sat above a 24px glyph — the smallest mark in the
                app carrying the most-consulted piece of state. `-z-10` keeps it
                under the label without a stacking context of its own. */}
            {active && <span aria-hidden className="absolute inset-x-3 inset-y-1 -z-10 rounded-control bg-brand-wash" />}
            <AppIcon as={s.icon} size="lg" active={active} />
            {s.label}
          </a>
        )
      })}
      {current && (
        <SectionSheet section={sheet ?? current} view={view} gates={gates} open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)} onNavigate={onNavigate} />
      )}
    </nav>
  )
}
