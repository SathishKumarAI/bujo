import { useState } from 'react'
import { CaretDown, List, Plus, SquaresFour } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { SHELL_SCOPE } from '../../lib/onePrimary'
import { useJournal } from '../../store'
import { useAuthUser } from '../../lib/authUser'
import { Button } from '../ui/button'
import { PhoneMenu } from './PhoneMenu'
import { SectionSheet } from './SectionSheet'
import { DateNav } from './topbar/DateNav'
import { useSuggestionCount } from './topbar/useSuggestionCount'
import { useSampleData } from '../useSampleData'
import { SECTIONS, sectionOf, tabsOf, type SectionGates } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'

/**
 * The PHONE's header — one row: ☰ · where you are · Quick add.
 *
 * OWNS: the phone bar's layout and the hamburger's open state.
 * DOES NOT OWN: the desktop header (`TopBar.tsx` hands off here only when
 * `useDevice()` says mobile, so the desktop branch is untouched), the menu's
 * rows (`PhoneMenu.tsx`), the page grid (`SectionSheet.tsx`).
 *
 * **No tab strip (2026-10-29).** The row is the page's name under its
 * section's, and tapping it opens every page of the app. The strip it
 * replaced showed 2.5 of Body's 11 pages with the third cut to "Pro…" —
 * owner: "if I have this [the page grid], why do I need the top navbar with
 * these options?" The neighbour hop the strip gave is the bottom bar's
 * memory now (`lastPage.ts`).
 *
 * Owner direction, 2026-10-28: no search, no microphone, no logo, Account behind
 * a hamburger — "usability is what matters most". What went where:
 *
 * | Was in the bar | Now |
 * |---|---|
 * | Cadence wordmark | gone — the bottom nav and the title (section over page) already say where you are |
 * | Search (⌘K palette) | gone — every destination is in the bottom nav + the title's page grid; undo/redo, Settings and Help are in the menu; themes, export and demo data are in Settings |
 * | Microphone (Ask Relay) | gone on a phone — Quick add is the typed capture beside it; the desktop rail keeps the voice agent |
 * | Account menu | the ☰ sheet, with the suggestion count on the ☰ |
 *
 * Quick add stays: it is the only capture that works from every page, and the
 * a11y gate drives it by name.
 *
 * A view with no tabs and a date cursor (Today) puts the cursor in the row;
 * a second row appears only for tabs AND a cursor (Month, Trackers), where the
 * title is using the row. Nothing folds on scroll: at 52px there is nothing
 * worth the motion.
 */
export function PhoneTopBar({ view, gates, onNavigate, onQuickAdd }: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [allOpen, setAllOpen] = useState(false)
  const chrome = VIEW_CHROME[view]
  const current = sectionOf(view)
  const tabs = current ? tabsOf(current, gates) : []
  const hasTabs = tabs.length > 1
  const sectionLabel = SECTIONS.find((s) => s.id === current)?.label
  // The grid's own word for this page, so the bar and the tile agree ("Month",
  // where the view's title says "Monthly").
  const pageLabel = tabs.find((t) => t.view === view)?.label ?? chrome.title
  // Everything the ☰ Notifications tab lists, so the number and the tab agree.
  const suggestions = useSuggestionCount() + (useSampleData().active ? 1 : 0)
  const { data } = useJournal()
  const { user } = useAuthUser()
  const setUp = !!user || !!data.settings.profile

  // WHERE YOU ARE, as the way to go anywhere else: the section over the page,
  // and a tap opens every page of the app (`SectionSheet`). Not an <h1> inside
  // the button — a heading is not button content — so the h1 is beside it.
  const titleButton = current && (
    <>
      <h1 className="sr-only">{chrome.title}</h1>
      <button
        type="button"
        onClick={() => setAllOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={allOpen}
        className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center rounded-control px-2 text-left transition-colors active:bg-ink-2"
      >
        {/* `{' '}` so the name reads "Plan Month", not "PlanMonth" — two spans
            with nothing between them are one word to a screen reader. */}
        {sectionLabel !== pageLabel && <><span className="text-micro font-medium text-fg-2">{sectionLabel}</span>{' '}</>}
        <span className="flex max-w-full items-center gap-1 text-heading leading-tight font-semibold text-fg-1">
          <span className="truncate">{pageLabel}</span>
          <Icon as={CaretDown} size="sm" className="shrink-0 text-fg-2" />
          <span className="sr-only">, all pages</span>
        </span>
      </button>
    </>
  )

  // The same grid from a bar whose row is the date (Today) or that belongs to
  // no section (Settings, Help). Owner, 2026-10-29: "not able to navigate from
  // today to other pages" — Today was the one page with no door to the grid,
  // so Nutrition or Coaching meant landing on another Body page first.
  /* A DAY view draws the shared DayStrip pinned right under this bar (Today,
     2026-10-31: "the log-a-day calendar should be placed on the top nav
     bar"), so a ‹ date › stepper here was a second picker for the same day,
     stacked on the first. The strip does everything it did — any day, a week
     at a time, today marked — so the bar shows the title instead. */
  const stripBelow = chrome.dateNav === 'day'

  const gridButton = (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label="All pages"
      aria-haspopup="dialog"
      aria-expanded={allOpen}
      onClick={() => setAllOpen(true)}
      className="shrink-0"
    >
      <Icon as={SquaresFour} size="md" />
    </Button>
  )

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

        {/* `stripBelow`: Today's date lives in the strip now, so it takes the
            same "Section · Page ⌄" button as every other page — owner,
            2026-10-31: "why can't I have all same navigation style?". */}
        {current && (hasTabs || !chrome.dateNav || stripBelow) ? (
          titleButton
        ) : chrome.dateNav && !stripBelow ? (
          /* Today: the bottom nav already says "Today", so the row spends its
             width on the date you are logging, not on the word. A second tap
             on the Today tab opens every page. */
          <>
            <h1 className="sr-only">{chrome.title}</h1>
            <div className="flex min-w-0 flex-1 justify-center">
              <DateNav view={view} mode={chrome.dateNav} />
            </div>
            {gridButton}
          </>
        ) : (
          <>
            <h1 className="min-w-0 flex-1 truncate px-1 text-heading leading-tight font-semibold text-foreground">{chrome.title}</h1>
            {gridButton}
          </>
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
      <SectionSheet view={view} gates={gates} open={allOpen} onOpenChange={setAllOpen} onNavigate={onNavigate} />
    </header>
  )
}
