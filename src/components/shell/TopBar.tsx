import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'
import { AccountMenu } from './AccountMenu'
import { SectionTabs } from './SectionTabs'
import { WeekStrip } from './WeekStrip'
import { FeedbackButton } from '../feedback/FeedbackButton'
import { HeaderRail } from './topbar/HeaderRail'
import { SectionNav } from './topbar/SectionNav'
import { DateNav } from './topbar/DateNav'
import { HelpMenu } from './topbar/HelpMenu'
import { OverflowMenu } from './topbar/OverflowMenu'
import { useHideOnScroll } from './useHideOnScroll'
import { sectionOf, tabsOf, type SectionGates } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'

function Brand() {
  return (
    <div className="flex shrink-0 items-baseline gap-2">
      <span className="font-display text-title font-medium tracking-tight text-foreground">bujo</span>
      {/* A 6px accent square, not the ✦ glyph it replaces. The redesign spends
          its accent on state and one mark of identity; a star reads as
          decoration, and decoration is what the flat treatment removes. */}
      <span className="size-1.5 bg-brand" aria-hidden />
    </div>
  )
}

/**
 * The sticky header · and, since the rail was deleted, the app's only
 * navigation on desktop.
 *
 * Two rows, because five sections holding up to seven tabs each cannot honestly
 * be one:
 *
 * 1. **Where you can go** — brand, the five sections, the week, and the
 *    controls that are not about this page (Quick add, account, overflow).
 *    Folds away while you scroll down; see `topbar/HeaderRail`.
 * 2. **Where you are** — the section's tabs, or the page title when the section
 *    has only one surface, plus the date nav. Never folds: losing "which tab am
 *    I on" is the one thing a scrolled header must not do.
 *
 * Both rows are horizontal, both are sticky, and they share one bottom rule, so
 * the whole thing reads as a single header block rather than as the three
 * separate chrome layers it replaced (rail, top bar, detached tab row).
 *
 * **The breadcrumb is gone.** It said `Body / Fitness`; row 1 lights Body and
 * row 2 marks Fitness `aria-current`, so the crumb was the third statement of
 * the same fact. For the same reason the `<h1>` goes `sr-only` whenever the tab
 * row renders — the heading still exists for a screen reader and for the
 * document outline, it just stops being drawn twice.
 *
 * This file composes; each control owns its own file under `topbar/`. See
 * `topbar/README.md` for the change → file table.
 */
export function TopBar({
  view,
  gates,
  onNavigate,
  onQuickAdd,
  onCommand,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
  onCommand: () => void
}) {
  const chrome = VIEW_CHROME[view]
  const current = sectionOf(view)
  // Ask the same question `SectionTabs` asks itself, so the title and the tabs
  // cannot both decide to render — or both decide not to.
  const hasTabs = !!current && tabsOf(current, gates).length > 1
  const collapsed = useHideOnScroll()

  return (
    <header className="app-header sticky top-0 z-30 border-b border-line bg-card/80 pt-2.5 backdrop-blur">
      {/* ── Row 1 · where you can go ─────────────────────────────────────── */}
      <HeaderRail collapsed={collapsed}>
        <div className="flex items-center gap-3 px-4 pb-2">
          <Brand />
          <SectionNav view={view} gates={gates} onNavigate={onNavigate} />

          <div className="ml-auto flex items-center gap-1.5">
            <WeekStrip />

            {/* ── Content tools ───────────────────────────────────────────── */}
            <HelpMenu view={view} onNavigate={onNavigate} />
            {/* Feedback is secondary — keep it off phones so the bar fits. */}
            <span className="hidden sm:inline-flex"><FeedbackButton /></span>

            {/* ── Page action, then everything else ───────────────────────── */}
            <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line" />

            {/* `aria-label` because the words are `hidden` below `sm`, which
                left the app's primary action as a button containing one
                decorative icon — announced as "button", on every screen, on
                every phone. The label has to live on the element rather than in
                the span, since the span is what disappears. */}
            <Button variant="primary" size="sm" onClick={onQuickAdd} aria-label="Quick add" className="gap-1.5">
              <Icon as={Plus} size="sm" /> <span className="hidden sm:inline">Quick add</span>
            </Button>

            {/* Renders nothing when no account backend is configured. */}
            <AccountMenu onNavigate={onNavigate} />
            <OverflowMenu onNavigate={onNavigate} onCommand={onCommand} />
          </div>
        </div>
      </HeaderRail>

      {/* ── Row 2 · where you are ────────────────────────────────────────── */}
      {/* `items-stretch` so the tabs run the full height of the row and their
          active underline lands on the header's own bottom rule. */}
      <div className="flex items-stretch gap-3 border-t border-line px-4">
        {hasTabs ? (
          <>
            {/* Still the page's heading for a screen reader and for the outline;
                the tab marked `aria-current` is what a sighted reader sees. */}
            <h1 className="sr-only">{chrome.title}</h1>
            <SectionTabs view={view} gates={gates} onNavigate={onNavigate} />
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col justify-center py-2">
            <h1 className="truncate font-display text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
            {chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
          </div>
        )}

        {chrome.dateNav && <DateNav view={view} mode={chrome.dateNav} />}
      </div>
    </header>
  )
}
