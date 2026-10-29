import { useState } from 'react'
import { List, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { SHELL_SCOPE } from '../../lib/onePrimary'
import { useJournal } from '../../store'
import { useAuthUser } from '../../lib/authUser'
import { Button } from '../ui/button'
import { PhoneMenu } from './PhoneMenu'
import { SectionTabs } from './SectionTabs'
import { DateNav } from './topbar/DateNav'
import { useSuggestionCount } from './topbar/useSuggestionCount'
import { useSampleData } from '../useSampleData'
import { sectionOf, tabsOf, type SectionGates } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'

/**
 * The PHONE's header — one row: ☰ · where you are · Quick add.
 *
 * OWNS: the phone bar's layout and the hamburger's open state.
 * DOES NOT OWN: the desktop header (`TopBar.tsx` hands off here only when
 * `useDevice()` says mobile, so the desktop branch is untouched), the menu's
 * rows (`PhoneMenu.tsx`), the tab row itself (`SectionTabs.tsx`).
 *
 * Owner direction, 2026-10-28: no search, no microphone, no logo, Account behind
 * a hamburger — "usability is what matters most". What went where:
 *
 * | Was in the bar | Now |
 * |---|---|
 * | Cadence wordmark | gone — the bottom nav and the tab row already say where you are |
 * | Search (⌘K palette) | gone — every destination is in the bottom nav + tab row; undo/redo, Settings and Help are in the menu; themes, export and demo data are in Settings |
 * | Microphone (Ask Relay) | gone on a phone — Quick add is the typed capture beside it; the desktop rail keeps the voice agent |
 * | Account menu | the ☰ sheet, with the suggestion count on the ☰ |
 *
 * Quick add stays: it is the only capture that works from every page, and the
 * a11y gate drives it by name.
 *
 * A view with no tabs and a date cursor (Today) puts the cursor in the row;
 * a second row appears only for tabs AND a cursor (Month, Trackers), where the
 * strip is using the width. Nothing folds on scroll: at 52px there is nothing
 * worth the motion.
 */
export function PhoneTopBar({ view, gates, onNavigate, onQuickAdd }: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const chrome = VIEW_CHROME[view]
  const current = sectionOf(view)
  const hasTabs = !!current && tabsOf(current, gates).length > 1
  // Everything the ☰ Notifications tab lists, so the number and the tab agree.
  const suggestions = useSuggestionCount() + (useSampleData().active ? 1 : 0)
  const { data } = useJournal()
  const { user } = useAuthUser()
  const setUp = !!user || !!data.settings.profile

  return (
    <header className="app-header phone-bar sticky top-0 z-30 border-b border-line bg-card/75 shadow-raise backdrop-blur-lg md:hidden">
      <div className="flex min-h-13 items-center gap-1 px-2">
        {/* The badge's number is in the name: axe's label-content-name-mismatch
            fails a control whose visible text ("2") is not in its accessible
            name — the same rule the old account trigger was fixed for. */}
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={suggestions > 0 ? `Menu · ${suggestions} notifications` : 'Menu'}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
          className="relative shrink-0"
        >
          <Icon as={List} size="md" />
          {suggestions > 0 ? (
            <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-pill bg-yellow px-1 text-micro font-medium text-crust">{suggestions}</span>
          ) : (
            !setUp && <span aria-hidden className="absolute top-2 right-2 h-2 w-2 rounded-pill bg-yellow" />
          )}
        </Button>

        {hasTabs ? (
          <>
            <h1 className="sr-only">{chrome.title}</h1>
            <div className="phone-strip flex min-w-0 flex-1">
              <SectionTabs view={view} gates={gates} onNavigate={onNavigate} />
            </div>
          </>
        ) : chrome.dateNav ? (
          /* Today: the bottom nav already says "Today", so the row spends its
             width on the date you are logging, not on the word. */
          <>
            <h1 className="sr-only">{chrome.title}</h1>
            <div className="flex min-w-0 flex-1 justify-center">
              <DateNav view={view} mode={chrome.dateNav} />
            </div>
          </>
        ) : (
          <h1 className="min-w-0 flex-1 truncate px-1 text-heading leading-tight font-semibold text-foreground">{chrome.title}</h1>
        )}

        {/* `primaryScope`: mounts once for every view — see `lib/onePrimary.ts`. */}
        <Button variant="primary" primaryScope={SHELL_SCOPE} size="icon-lg" onClick={onQuickAdd} aria-label="Quick add" className="shrink-0">
          <Icon as={Plus} size="md" />
        </Button>
      </div>

      {hasTabs && chrome.dateNav && (
        <div className="flex justify-center border-t border-line px-2">
          <DateNav view={view} mode={chrome.dateNav} />
        </div>
      )}

      <PhoneMenu open={menuOpen} onOpenChange={setMenuOpen} onNavigate={onNavigate} />
    </header>
  )
}
