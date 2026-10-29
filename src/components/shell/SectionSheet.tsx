import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Sheet } from '../ui/sheet'
import { Cell, Cells } from '../ui/cells'
import { SECTIONS, tabsOf, type SectionGates, type SectionId } from './sections'
import type { ViewId } from './viewChrome'

/**
 * EVERY PAGE OF A SECTION, ON ONE PHONE SHEET.
 *
 * OWNS: the list. DOES NOT OWN: when it opens — the strip's "All" button
 * (`PhoneTopBar`) and a second tap on the active bottom tab (`BottomNav`).
 *
 * Owner, 2026-10-29: "I'm unable to … access the body or the other pages,
 * like body, mind, and sub sections." Measured at 390px: Body has 11 pages
 * and its tab strip showed 3, with 8 off the right edge and nothing saying
 * the strip scrolls; Mind hid Focus the same way. A strip that scrolls is
 * fine for switching between neighbours and useless for finding a page you
 * have never seen. This lists them all, one row each, the current one ticked.
 */
export function SectionSheet({ section, view, gates, open, onOpenChange, onNavigate }: {
  section: SectionId
  view: ViewId
  gates: SectionGates
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (id: ViewId) => void
}) {
  const s = SECTIONS.find((x) => x.id === section)
  const tabs = tabsOf(section, gates)
  if (!s) return null
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={s.label}>
      <Cells>
        {tabs.map((t) => (
          <Cell
            key={t.view}
            title={t.label}
            subtitle={t.view === view ? 'You are here' : undefined}
            chevron={t.view !== view}
            trail={t.view === view ? <Icon as={Check} size="md" className="text-brand-text" /> : undefined}
            onPress={() => { onOpenChange(false); if (t.view !== view) onNavigate(t.view) }}
          />
        ))}
      </Cells>
    </Sheet>
  )
}
