import { Microphone, Plus } from '@/components/icons'
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
  onTalk,
  onCommand,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
  onTalk: () => void
  onCommand: () => void
}) {
  const chrome = VIEW_CHROME[view]
  const current = sectionOf(view)
  // Ask the same question `SectionTabs` asks itself, so the title and the tabs
  // cannot both decide to render — or both decide not to.
  const hasTabs = !!current && tabsOf(current, gates).length > 1
  const collapsed = useHideOnScroll()

  return (
    // Sticky, so content genuinely passes underneath it — which is the one
    // thing that earns a blur. `--shadow-raise` puts the bar a rung in front of
    // whatever is sliding under it; the hairline stays because a translucent
    // surface over arbitrary content cannot rely on colour alone to end.
    <header className="app-header sticky top-0 z-30 border-b border-line bg-card/75 pt-2.5 shadow-raise backdrop-blur-lg">
      {/* ── Row 1 · where you can go ─────────────────────────────────────── */}
      <HeaderRail collapsed={collapsed}>
        {/* THREE COLUMNS at `md`, and the nav is the middle one.
            The nav used to sit immediately after the brand with the tools
            pushed right by `ml-auto`, which left the five section names
            starting ~120px from the left edge of a 1440px window and the tools
            ending at the far right — so reading "where am I" and reaching "what
            can I do" were a full screen apart, on every page load.

            `1fr auto 1fr` centres the nav against the WINDOW rather than
            against the space left over by its siblings, so the section names
            stay put when the brand or the tool cluster changes width (Feedback
            drops below `sm`, the streak strip is content-derived). The outer
            columns are `minmax(0, 1fr)` so a wide tool cluster shrinks the
            spacer instead of shoving the nav off-centre.

            Flex below `md`, and that is not laziness: `SectionNav` is
            `hidden md:flex`, so on a phone there is no middle column to centre
            and the grid would only be two equal `1fr` halves — which caps the
            tool cluster at half the bar and clips it, since `minmax(0,1fr)`
            has no content floor.

            Nothing moves between columns and no action changes — this is the
            same three groups in the same order, measured from a different
            origin. */}
        <div className="flex items-center gap-3 px-4 pb-2 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Brand />
          <SectionNav view={view} gates={gates} onNavigate={onNavigate} />

          <div className="ml-auto flex items-center justify-end gap-1.5 md:ml-0">
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
            {/* The assistant sits beside Quick add because it is the same job
                said out loud — capture — and the two belong together rather
                than one of them being a page. Icon-only at every width: the
                cluster is already five controls at 390px, and "Talk" as a word
                buys nothing the microphone does not say. */}
            <Button variant="secondary" size="icon-sm" onClick={onTalk} aria-label="Talk to your journal" title="Talk to your journal">
              <Icon as={Microphone} size="sm" />
            </Button>

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
      {/* Centred on the same axis as row 1, from `md` up and for the same
          reason: the tab row is the other half of "where am I", and it was
          starting at the left gutter while row 1's nav did too — two
          left-aligned rows under a tool cluster pinned right.

          Below `md` it stays the flex row it was. Row 1's nav is hidden there,
          so there is no axis to share; centring one lone row against the window
          would only pull it out of line with the page content under it.

          `items-stretch` keeps the tab row and the date nav the same height. It
          used to also be load-bearing for the tabs' active *underline*, which
          had to land exactly on the header's own bottom rule; the tabs are
          filled pills now and carry their own `my-1` inset instead.

          The empty first column is what makes the centring true — without it
          the tabs would centre in the space the date nav leaves over, which
          moves as the date label changes width (a month name is wider than
          "Sat, Sep 12"). The `sr-only` heading is absolutely positioned, so it
          is not a grid item and does not consume the middle column. */}
      <div className="flex items-stretch gap-3 border-t border-line px-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <span aria-hidden className="hidden md:block" />
        {hasTabs ? (
          <>
            {/* Still the page's heading for a screen reader and for the outline;
                the tab marked `aria-current` is what a sighted reader sees. */}
            <h1 className="sr-only">{chrome.title}</h1>
            <SectionTabs view={view} gates={gates} onNavigate={onNavigate} />
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col justify-center py-2 md:flex-none md:text-center">
            <h1 className="truncate font-display text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
            {chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
          </div>
        )}

        <div className="flex items-center justify-end">
          {chrome.dateNav && <DateNav view={view} mode={chrome.dateNav} />}
        </div>
      </div>
    </header>
  )
}
