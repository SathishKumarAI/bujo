import type { Icon as IconGlyph } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { hrefFor } from '../../../lib/deepLink'
import { SECTIONS, landingOf, sectionOf, type SectionGates } from '../sections'
import type { ViewId } from '../viewChrome'

/**
 * The five sections, as the top bar's first row.
 *
 * Hidden on phones, where `BottomNav` carries the same five within thumb reach.
 * Two copies of the section list on a 390px bar is one too many, and the bottom
 * one is the reachable one.
 */
export function SectionNav({
  view,
  gates,
  onNavigate,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
}) {
  const current = sectionOf(view)

  return (
    <nav aria-label="Sections" className="hidden min-w-0 items-center gap-0.5 md:flex">
      {SECTIONS.map((s) => {
        const SectionIcon: IconGlyph = s.icon
        const active = current === s.id
        // The rail lit a section for any view inside it; so does this. The href
        // is the section's first *visible* tab, so a gated-off Cycle never
        // becomes a dead link.
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
            aria-current={active ? 'page' : undefined}
            // A 3px rule on the leading edge and full-strength ink — the rail's
            // active treatment turned ninety degrees. No filled pill: a fill
            // makes the current item a raised object, and the flat treatment is
            // the whole point. The transparent rule on the inactive items keeps
            // every label on the same baseline.
            className={`inline-flex min-h-9 items-center gap-2 border-t-[3px] px-3 text-body whitespace-nowrap transition-colors ${
              active
                ? 'border-brand font-medium text-foreground'
                : 'border-transparent text-fg-2 hover:text-fg-1'
            }`}
          >
            <Icon as={SectionIcon} size="md" active={active} className={active ? 'text-brand-text' : undefined} />
            {s.label}
          </a>
        )
      })}
    </nav>
  )
}
