import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Sheet } from '../ui/sheet'
import { SECTIONS, tabsOf, type SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * EVERY PAGE OF THE APP, ON ONE PHONE SHEET, in the bottom bar's order.
 *
 * OWNS: the list. DOES NOT OWN: when it opens — the top bar's "All" button
 * (`PhoneTopBar`) and a second tap on the active bottom tab (`BottomNav`).
 *
 * Owner, 2026-10-29: "I'm unable to … access the body or the other pages,
 * like body, mind, and sub sections." The first version listed one section's
 * pages (Body's 11, of which the strip shows 3). Asked again the same day —
 * "unable to navigate from body to … mind" — because Body → Reading was still
 * three taps: Mind, then a strip whose third tab is cut to "C…", then the
 * page. Now every page is one tap from anywhere, grouped under the same
 * section names the bottom bar uses.
 */
export function SectionSheet({ view, gates, open, onOpenChange, onNavigate }: {
  view: ViewId
  gates: SectionGates
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (id: ViewId) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="All pages">
      {/* A GRID, not a list of rows. As rows, Body's eleven filled the sheet
          and Mind started below the fold — the scroll this sheet exists to
          remove. Three across, all twenty pages fit one 844px screen.
          Groups keep the bottom bar's order rather than putting the current
          section first, so a page is always in the same place. */}
      <nav aria-label="All pages" className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <section key={s.id} aria-label={s.label}>
            <h2 className="mb-1.5 flex items-center gap-1.5 text-label font-semibold text-fg-2">
              <Icon as={s.icon} size="sm" />{s.label}
            </h2>
            <ul className="grid grid-cols-3 gap-1.5">
              {tabsOf(s.id, gates).map((t) => {
                const here = t.view === view
                return (
                  <li key={t.view}>
                    <button
                      type="button"
                      aria-current={here ? 'page' : undefined}
                      onClick={() => { onOpenChange(false); if (!here) onNavigate(t.view) }}
                      className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-control px-1.5 py-1 text-center text-body leading-tight transition-colors active:scale-95 ${here ? 'border border-brand bg-brand-wash font-medium text-fg-1' : 'bg-ink-2 text-fg-1'}`}
                    >
                      {here && <Icon as={Check} size="sm" className="shrink-0 text-brand-text" />}
                      {t.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </nav>
    </Sheet>
  )
}
