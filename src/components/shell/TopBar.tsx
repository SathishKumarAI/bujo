import { CaretLeft, CaretRight, Command, DotsThree, Lightbulb, Plus, Question, SlidersHorizontal } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { recommendations } from '../../lib/recommend'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useJournal } from '../../store'
import { AccountMenu } from './AccountMenu'
import { useCursor } from './cursor'
import { SectionTabs } from './SectionTabs'
import { WeekStrip } from './WeekStrip'
import { SECTIONS, landingOf, sectionOf, tabsOf, type SectionGates } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'
import { addDays, prettyDay, prettyMonth, ymOf } from '../../lib/date'
import { hrefFor } from '../../lib/deepLink'
import { FeedbackButton } from '../feedback/FeedbackButton'
import { DateJumpPicker } from './DateJumpPicker'
import { useState } from 'react'

function shiftMonth(ym: string, delta: number): string {
  const [y, mo] = ym.split('-').map(Number)
  return ymOf(new Date(y, mo - 1 + delta, 1))
}

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
 * 2. **Where you are** — the section's tabs, or the page title when the section
 *    has only one surface, plus the date nav.
 *
 * Both rows are horizontal, both are sticky, and they share one bottom rule, so
 * the whole thing reads as a single header block rather than as the three
 * separate chrome layers it replaced (rail, top bar, detached tab row).
 *
 * **The breadcrumb is gone.** It said `Body / Fitness`; row 1 now lights Body
 * and row 2 marks Fitness `aria-current`, so the crumb was the third statement
 * of the same fact. For the same reason the `<h1>` goes `sr-only` whenever the
 * tab row renders — the heading still exists for a screen reader and for the
 * document outline, it just stops being drawn twice.
 *
 * The right-hand group is unchanged in kind: page-scoped content tools, a
 * hairline, then the one accented button and the overflow. Account joined it
 * from the rail's footer, which no longer exists.
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
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const { day, setDay, month, setMonth } = useCursor()
  const [pickerOpen, setPickerOpen] = useState(false)
  const chrome = VIEW_CHROME[view]
  const recs = recommendations(data)
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))
  const current = sectionOf(view)
  // Ask the same question `SectionTabs` asks itself, so the title and the tabs
  // cannot both decide to render — or both decide not to.
  const hasTabs = !!current && tabsOf(current, gates).length > 1

  return (
    <header className="app-header sticky top-0 z-30 border-b border-line bg-card/80 pt-2.5 backdrop-blur">
      {/* ── Row 1 · where you can go ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pb-2">
        <Brand />

        {/* Hidden on phones, where `BottomNav` carries the same five sections
            within thumb reach. Two copies of the section list on a 390px bar is
            one too many, and the bottom one is the reachable one. */}
        <nav aria-label="Sections" className="hidden min-w-0 items-center gap-0.5 md:flex">
          {SECTIONS.map((s) => {
            const SectionIcon: IconGlyph = s.icon
            const active = current === s.id
            // The rail lit a section for any view inside it; so does this. The
            // href is the section's first *visible* tab, so a gated-off Cycle
            // never becomes a dead link.
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
                // A 3px rule on the leading edge and full-strength ink — the
                // rail's active treatment turned ninety degrees. No filled
                // pill: a fill makes the current item a raised object, and the
                // flat treatment is the whole point. The transparent rule on
                // the inactive items keeps every label on the same baseline.
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

        <div className="ml-auto flex items-center gap-1.5">
          <WeekStrip />

          {/* ── Content tools ─────────────────────────────────────────────── */}

          {/* Help and suggestions, merged. Both answer "what should I do on this
              page?" — the blurb statically, the recommendations from your data —
              so they share one door, with the count badge on it when there is
              something waiting. */}
          {(chrome.help || recs.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={recs.length > 0 ? `Help and ${recs.length} suggestions` : `What is ${chrome.title}?`}
                  title={recs.length > 0 ? 'Help & suggestions' : `What is ${chrome.title}?`}
                  className="relative shrink-0 text-fg-2 hover:text-foreground"
                >
                  <Icon as={Question} size="md" />
                  {recs.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-pill bg-yellow px-0.5 text-micro font-medium text-crust">{recs.length}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {chrome.help && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="mb-1 font-display text-body font-medium text-foreground">{chrome.title}</p>
                      <p className="text-label leading-relaxed text-fg-2">{chrome.help}</p>
                    </div>
                    <DropdownMenuItem onClick={() => onNavigate('help')} className="text-label text-blue">Open the full guide →</DropdownMenuItem>
                  </>
                )}
                {recs.length > 0 && (
                  <>
                    {chrome.help && <DropdownMenuSeparator />}
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-micro tracking-wider text-fg-2 uppercase">
                      <Icon as={Lightbulb} size="sm" className="text-yellow" /> Suggestions
                    </div>
                    {recs.map((r) => (
                      <DropdownMenuItem key={r.id} onClick={() => r.action && onNavigate(r.action.view)} className="flex-col items-start gap-1 py-2">
                        <span className="text-body text-fg-1">{r.text}</span>
                        {r.action && <span className="text-label text-blue">→ {r.action.label}</span>}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Feedback is secondary — keep it off phones so the bar fits. */}
          <span className="hidden sm:inline-flex"><FeedbackButton /></span>

          {/* ── Page action, then everything else ─────────────────────────── */}
          <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line" />

          {/* `aria-label` because the words are `hidden` below `sm`, which left
              the app's primary action as a button containing one decorative icon
              — announced as "button", on every screen, on every phone. The label
              has to live on the element rather than in the span, since the span
              is what disappears. */}
          <Button variant="primary" size="sm" onClick={onQuickAdd} aria-label="Quick add" className="gap-1.5">
            <Icon as={Plus} size="sm" /> <span className="hidden sm:inline">Quick add</span>
          </Button>

          {/* Renders nothing when no account backend is configured. */}
          <AccountMenu onNavigate={onNavigate} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More options">
                <Icon as={DotsThree} size="md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* ⌘K lives here rather than as its own icon: the palette is a
                  keyboard surface, and a permanent button for it spent a slot in
                  the bar advertising a shortcut to people already using it. */}
              <DropdownMenuItem onClick={onCommand}>
                <Icon as={Command} size="sm" /> Command palette
                <span className="ml-auto text-micro text-fg-2">⌘K</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-micro tracking-wider text-fg-2 uppercase">Theme</div>
              {(['mocha', 'latte', 'neon', 'system'] as const).map((th) => (
                <DropdownMenuItem key={th} onClick={() => setSettings({ theme: th })}>
                  <span className={data.settings.theme === th ? 'text-mauve' : ''}>{data.settings.theme === th ? '● ' : '○ '}</span>
                  {th === 'mocha' ? 'Dark' : th === 'latte' ? 'Light' : th === 'neon' ? 'Neon ✦' : 'System'}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <Icon as={SlidersHorizontal} size="sm" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('help')}>
                <Icon as={Question} size="sm" /> Help &amp; guide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom - 0.1) })}>Zoom out</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings({ zoom: 1 })}>Reset zoom ({Math.round(zoom * 100)}%)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom + 0.1) })}>Zoom in</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canUndo} onClick={undo}>Undo</DropdownMenuItem>
              <DropdownMenuItem disabled={!canRedo} onClick={redo}>Redo</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettings({ paperMode: !data.settings.paperMode })}>Toggle paper</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings({ handwriting: !data.settings.handwriting })}>Toggle handwriting</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings({ bookMode: !data.settings.bookMode })}>Toggle book frame</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

        {chrome.dateNav && (
          <div className="relative flex shrink-0 items-center gap-1 py-1.5">
            {/* Real anchors on day views, so ⌘-click and middle-click open a day
                in a new tab — the thing a date you can link to is for. Month
                views have no addressable URL of their own yet, so they stay
                buttons rather than pretending to be links. */}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous"
              {...(chrome.dateNav === 'day'
                ? { asChild: true }
                : { onClick: () => setMonth(shiftMonth(month, -1)) })}
            >
              {chrome.dateNav === 'day' ? (
                <a
                  href={hrefFor(view, addDays(day, -1))}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                    e.preventDefault()
                    setDay(addDays(day, -1))
                  }}
                >
                  <Icon as={CaretLeft} size="md" />
                </a>
              ) : (
                <Icon as={CaretLeft} size="md" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              title="Jump to month / year"
              onClick={() => setPickerOpen((o) => !o)}
            >
              {chrome.dateNav === 'day' ? prettyDay(day) : prettyMonth(month)}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next"
              {...(chrome.dateNav === 'day'
                ? { asChild: true }
                : { onClick: () => setMonth(shiftMonth(month, 1)) })}
            >
              {chrome.dateNav === 'day' ? (
                <a
                  href={hrefFor(view, addDays(day, 1))}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                    e.preventDefault()
                    setDay(addDays(day, 1))
                  }}
                >
                  <Icon as={CaretRight} size="md" />
                </a>
              ) : (
                <Icon as={CaretRight} size="md" />
              )}
            </Button>
            {pickerOpen && (
              <DateJumpPicker
                mode={chrome.dateNav}
                month={month}
                day={day}
                onPickMonth={setMonth}
                onPickDay={setDay}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </header>
  )
}
