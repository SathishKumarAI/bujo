import { MagnifyingGlass, Microphone, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { SHELL_SCOPE } from '../../lib/onePrimary'
import { Button } from '../ui/button'
import { Brand } from './Brand'
import { RailToggle } from './RailToggle'
import { AccountMenu } from './AccountMenu'
import { SectionTabs } from './SectionTabs'
import { HeaderRail } from './topbar/HeaderRail'
import { DateNav } from './topbar/DateNav'
import { useHideOnScroll } from './useHideOnScroll'
import { sectionOf, tabsOf, type SectionGates } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'

/**
 * The sticky header. **On desktop it no longer carries navigation** — `SideRail`
 * does. On a phone it still carries the tab row, and `BottomNav` the sections.
 *
 * Two rows:
 *
 * 1. **Who and what** — brand, the week, and the controls that are not about
 *    this page (Quick add, account, overflow). Folds away while you scroll
 *    down; see `topbar/HeaderRail`.
 * 2. **Where you are** — the page title on desktop; the section's tabs on a
 *    phone, where the title lives behind them as an `sr-only` `h1`. Plus the
 *    date nav. Never folds: losing "which tab am I on" is the one thing a
 *    scrolled header must not do.
 *
 * ── The rail came back, and that is not a revert ───────────────────────────
 *
 * PR #120 deleted a left rail and moved its contents here, correctly: the app
 * then had **three** chrome layers between viewport and page (a 240px rail, this
 * bar, and a detached tab row), and the rail had grown `collapsed`,
 * `sidebarAutoHide`, a hover reveal zone and a mobile drawer — all of it machinery
 * for winning back space the rail itself was spending.
 *
 * Phase 5 adds a rail that *replaces* these two nav rows instead of sitting
 * above them, with none of that machinery: 208px, always open, desktop only.
 * Measured at 1512×950 on `?demo=1`, chrome before content went **152px → 103px**
 * (17.2% → 11.7% of the viewport). The thing #120 was right about — three layers
 * answering one question — is what this removes a layer from.
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
  railHidden,
  onToggleRail,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
  onTalk: () => void
  onCommand: () => void
  /** Desktop only: whether `SideRail` is collapsed away right now. */
  railHidden: boolean
  onToggleRail: () => void
}) {
  const chrome = VIEW_CHROME[view]
  const current = sectionOf(view)
  // Ask the same question `SectionTabs` asks itself, so the title and the tabs
  // cannot both decide to render — or both decide not to.
  const hasTabs = !!current && tabsOf(current, gates).length > 1
  // Today's three time-of-day surfaces ARE its tabs — one per third of the day,
  // each a filter over the same record. They belong on this row for the same
  // reason `SectionTabs` does; see `topbar/SurfaceTabs.tsx`.
  const collapsed = useHideOnScroll()

  return (
    // Sticky, so content genuinely passes underneath it — which is the one
    // thing that earns a blur. `--shadow-raise` puts the bar a rung in front of
    // whatever is sliding under it; the hairline stays because a translucent
    // surface over arbitrary content cannot rely on colour alone to end.
    <header className="app-header sticky top-0 z-30 border-b border-line bg-card/75 pt-2.5 shadow-raise backdrop-blur-lg md:hidden">
      {/* ── Row 1 · who, and the controls that are not about this page ───── */}
      <HeaderRail collapsed={collapsed}>
        {/* ONE ROW on desktop. The brand is in the rail’s head, the page
            title is here, and the tools are at the right edge — so the header
            is a single band over the content column and the rail owns the
            left edge from y=0.

            It was two full-width rows above the rail: brand + tools, then
            title + date nav. That drew a chrome band across the rail as well
            as the page, left the rail’s first 103px empty, and left ~1100px
            of the title row empty in turn — reported as the bar and the rail
            conflicting and wasting space. Row 2 still exists **below `md`**,
            where it carries the tab row and there is no rail to take it.

            Worth keeping from the three-column version this replaced, because
            it will bite whoever next centres something in this bar: the outer
            columns were plain `1fr`, NOT `minmax(0,1fr)`, and the difference
            was measured. `minmax(0,1fr)` has no content floor, so between `md`
            and about 1100px the tool cluster was handed an equal half of the
            bar and spilled **56px past it on every single view** — the streak
            strip’s "90d" and the feedback count outside the header’s own box.
            Plain `1fr` is `minmax(auto,1fr)`, which floors each outer column
            at its content. */}
        <div className="flex items-center gap-3 px-4 pb-2">
          {/* The rail toggle, ONLY while the rail is away.

              When the rail is open it carries its own copy in its head, next
              to Search — a control belongs on the thing it operates. This is
              the other half: once the rail is `display: none` so is that copy,
              and something has to be able to bring it back. Same component,
              same label, same `aria-pressed`; `railHidden` decides which of
              the two renders, so they cannot both appear.

              Desktop only — there is no rail below `md`. */}
          {railHidden && <RailToggle hidden onToggle={onToggleRail} className="hidden md:inline-flex" />}

          {/* Phone only: on desktop the rail’s head carries it. One component,
              two placements, never both visible — see `Brand.tsx`. */}
          <div className="md:hidden">
            <Brand />
          </div>

          {/* Desktop only: the page title, at the gutter of the content
              column it names. Below `md` the tab row in row 2 says the same
              thing and this would be a second claim on it; there the heading
              lives as the `sr-only` `h1` beside those tabs. Exactly one `h1`
              is in the accessibility tree at each breakpoint — the other is
              `display: none`, not merely invisible. */}
          <div className="hidden min-w-0 flex-1 flex-col justify-center md:flex">
            <h1 className="truncate text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
            {chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
          </div>

          {/* Desktop only. The date cursor belongs beside the title it
              qualifies — "Fitness, this week" is one statement. Below `md` it
              stays in row 2 beside the tab row, where it has always been and
              where there is width for it; the two are never both rendered,
              one of them is always `display: none`. */}
          {chrome.dateNav && (
            <div className="hidden shrink-0 items-center md:flex">
              <DateNav view={view} mode={chrome.dateNav} />
            </div>
          )}

          <div className="ml-auto flex items-center justify-end gap-1.5">
            {/* SEARCH, PHONE ONLY — COD-260.

                On a desktop the rail’s head carries a Search row that says
                `⌘K`. A phone has no rail, so until now the palette was four
                taps behind a twelve-item corner menu: the one control that
                reaches every destination in the app was the hardest thing on
                the screen to find.

                It REPLACES the week strip here rather than joining it. Row 1
                was already five controls at 390px and the repo has the scars
                to prove it; a sixth would have been the one that pushed the
                cluster over. Between an ambient seven-dot streak read in
                passing and the door to every page, the door wins on a phone.
                Desktop keeps both — the strip at the rail’s foot, Search at
                its head.

                Icon-only, like the microphone beside it: at 390px the word
                "Search" costs more than it says, and `aria-label` carries the
                name that `⌘K` cannot (there is no ⌘ on a phone). */}
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={onCommand}
              aria-label="Search and jump to anything"
              className="md:hidden"
            >
              <Icon as={MagnifyingGlass} size="sm" />
            </Button>

            {/* Help and Send feedback used to stand here as two more buttons.
                They are items in the corner menu now — and feedback in
                particular was `hidden sm:inline-flex`, so on a phone the app
                had no way to send any. A menu item costs no bar width, which
                is why it can exist at every size. */}

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
            <Button variant="secondary" size="icon-sm" onClick={onTalk} aria-label="Ask Relay" title="Ask Relay — say it, and it files it">
              <Icon as={Microphone} size="sm" />
            </Button>

            {/* `primaryScope`: this button mounts once and lives on every view,
                so without it the dev one-primary guard charges it to whichever
                page happened to load first — and then warns on any page with a
                primary of its own. See `lib/onePrimary.ts`. */}
            <Button variant="primary" primaryScope={SHELL_SCOPE} size="sm" onClick={onQuickAdd} aria-label="Quick add" className="gap-1.5">
              <Icon as={Plus} size="sm" /> <span className="hidden sm:inline">Quick add</span>
            </Button>

            {/* One menu. It was two — an avatar and a ⋯ — with two doors to
                Settings, two differently-named doors to Help, and a theme
                picker missing two of the six themes. See `AccountMenu`. */}
            <AccountMenu view={view} onNavigate={onNavigate} onCommand={onCommand} />
          </div>
        </div>
      </HeaderRail>

      {/* ── Row 2 · PHONE ONLY · which surface, and the date ─────────── */}
      {/* `md:hidden` on the whole row. On desktop the rail carries the tabs
          and row 1 carries the title and the date nav, so there is no second
          band at all — which is the space this phase gives back.

          Kept from when this row was centred at `md`, because it will bite
          anyone who puts a grid back here: the columns were plain `1fr`, and
          under `minmax(0,1fr)` the date nav was squeezed below its own
          content and **"September 2026" was drawn straight through the Cycle
          and Recovery tabs** at 1024–1280. Two strings on top of each other,
          on a row whose whole job is telling you where you are.

          `items-stretch` keeps the tab row and the date nav the same height.
          It used to also be load-bearing for the tabs’ active *underline*,
          which had to land exactly on the header’s own bottom rule; the tabs
          are filled pills now and carry their own `my-1` inset instead. */}
      <div className="flex items-stretch gap-3 border-t border-line px-4 md:hidden">
        {hasTabs ? (
          <>
            {/* Still the page's heading for a screen reader and for the
                outline; the tab marked `aria-current` is what a sighted
                reader sees. Its desktop twin in row 1 is `display: none`
                here, so exactly one `h1` is in the accessibility tree. */}
            <h1 className="sr-only">{chrome.title}</h1>
            <div className="flex min-w-0 flex-1">
              <SectionTabs view={view} gates={gates} onNavigate={onNavigate} />
            </div>
          </>
        ) : (
          /* No tabs to stand in for it, so the heading is drawn. */
          <div className="flex min-w-0 flex-1 flex-col justify-center py-2">
            <h1 className="truncate text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
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
