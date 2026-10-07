import type { Icon as IconGlyph } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Kbd } from '../Kbd'
import { hrefFor } from '../../lib/deepLink'
import { SECTIONS, landingOf, sectionOf, type SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * The five sections, stacked — `SideRail`'s upper half.
 *
 * It lived in `topbar/` and was `hidden … md:flex` there: the top bar's first
 * row on desktop, absent on phones because `BottomNav` carries the same five
 * within thumb reach. The rail took that job, so the horizontal branch was
 * rendered by nothing and went with it, and the file moved out of a directory
 * that no longer describes it. A `vertical` prop would have been a second
 * layout with one caller — the dead branch this repo keeps finding.
 *
 * Still not rendered below `md`: the rail is `hidden md:flex`, `BottomNav` is
 * unchanged, and two copies of the section list on a 390px screen is one too
 * many.
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
    <nav aria-label="Sections" className="flex min-w-0 flex-col gap-0.5">
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
            {/* The chord that already jumps here, drawn on the row that does.
                `useLeaderKey('g', …)` has worked since the shell was built and
                appeared in exactly one place — the shortcut cheatsheet behind
                `?` — so in practice nobody knew the app had keyboard navigation
                at all. A rail row is the one place a reader looks at the moment
                they want to go somewhere, which is when the hint is worth
                reading.

                `aria-hidden` on a WRAPPER, not on `Kbd`: `Kbd` destructures
                `children` and `className` and spreads nothing, so an
                `aria-hidden` passed to it is dropped on the floor — it
                typechecks, renders, and does nothing. The link is already named
                by its label, and without this a screen-reader user hears
                "Today g t" on every row; the chord is announced where it is
                actionable, in the `?` cheatsheet.

                `opacity`, deliberately NOT used to make it recede — this repo
                measured 3.08:1 from exactly that move. `Kbd` carries real
                tokens (`fg-1` on `ink-2`), and it is quiet because it is small
                and boxed, not because it is faded. */}
            <span aria-hidden className="ml-auto">
              <Kbd>g {s.jump}</Kbd>
            </span>
          </a>
        )
      })}
    </nav>
  )
}
