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
            // A tonal pill. This was a 3px rule on the leading edge, defended
            // in a comment here as "no filled pill: a fill makes the current
            // item a raised object, and the flat treatment is the whole point"
            // — true of the Modernist world, and exactly inverted in this one.
            // The section you are in IS the raised object; a hairline over a
            // label is the weakest signal available for the app's single most
            // important piece of state, and it read as an underlined link.
            //
            // `--radius-control`: this is a thing you operate. Inactive items
            // get the same box with no fill, so nothing shifts on hover and
            // every label stays on one baseline — which is what the old
            // transparent rule was for.
            className={`inline-flex min-h-9 items-center gap-2 rounded-control px-3 text-body whitespace-nowrap transition-colors ${
              active
                ? 'bg-brand-wash font-medium text-brand-text'
                : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
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
