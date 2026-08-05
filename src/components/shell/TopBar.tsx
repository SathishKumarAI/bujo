import { CaretLeft, CaretRight, Command, DotsThree, Lightbulb, List, Plus, Question, Sidebar, SlidersHorizontal } from '@/components/icons'
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
import { useCursor } from './cursor'
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

/**
 * Sticky header · breadcrumb + title, hoisted date-nav, and at most five
 * controls on the right.
 *
 * It used to carry nine, ungrouped: page actions, content tools and app
 * preferences at one level, all unlabelled icons. The rule now is that the bar
 * holds what acts on *this page*, in two groups separated by a hairline —
 * content tools, then the one accented button and the overflow.
 *
 * What left, and where it went:
 *
 * - **account, settings, theme** → the bottom of the sidebar. They are app
 *   preferences, reached a few times a month, and they were sitting next to
 *   Quick add, which is reached a few times an hour.
 * - **⌘K** → the overflow. The shortcut is the interface; the button was a
 *   permanent reminder that a shortcut exists.
 * - **help + suggestions** → merged. Two adjacent icons both answering "what
 *   should I do here?" is one affordance wearing two hats.
 */
export function TopBar({
  view,
  section,
  onNavigate,
  onQuickAdd,
  onCommand,
  onMenu,
}: {
  view: ViewId
  /** Nav group of the current view — the breadcrumb's first crumb. */
  section?: string
  onNavigate: (id: ViewId) => void
  onQuickAdd: () => void
  onCommand: () => void
  onMenu: () => void
}) {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const { day, setDay, month, setMonth } = useCursor()
  const [pickerOpen, setPickerOpen] = useState(false)
  const chrome = VIEW_CHROME[view]
  const recs = recommendations(data)
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  return (
    <header className="app-header sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-card/80 px-4 py-2.5 backdrop-blur">
      <button onClick={onMenu} aria-label="Toggle menu" className="text-foreground md:hidden">
        <Icon as={List} size="lg" />
      </button>

      {/* Breadcrumb over the title, not a subtitle under it. "Cardio &
          strength" restated what the page already showed; "Body / Fitness"
          says where you are, which the title alone cannot. Views with no nav
          entry (the Body companions) keep their subtitle. */}
      <div className="min-w-0">
        {/* `Today / Today` is not a trail, it is the same word twice: a
            single-tab section is its own page, so it gets no crumb. */}
        {section && section !== chrome.title ? (
          <p className="truncate text-micro text-fg-2">
            {section} <span aria-hidden>/</span> <span className="text-fg-1">{chrome.title}</span>
          </p>
        ) : null}
        <h1 className="font-display text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
        {!section && chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
      </div>

      {chrome.dateNav && (
        <div className="relative ml-2 flex items-center gap-1">
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

      <div className="ml-auto flex items-center gap-1.5">
        {/* ── Content tools ───────────────────────────────────────────────── */}

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

        {/* ── Page action, then everything else ───────────────────────────── */}
        <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line" />

        <Button variant="primary" size="sm" onClick={onQuickAdd} className="gap-1.5">
          <Icon as={Plus} size="sm" /> <span className="hidden sm:inline">Quick add</span>
        </Button>

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
            <DropdownMenuItem onClick={() => setSettings({ sidebarAutoHide: !data.settings.sidebarAutoHide })}>
              <Icon as={Sidebar} size="sm" /> {data.settings.sidebarAutoHide ? 'Pin sidebar' : 'Auto-hide sidebar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettings({ paperMode: !data.settings.paperMode })}>Toggle paper</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ handwriting: !data.settings.handwriting })}>Toggle handwriting</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ bookMode: !data.settings.bookMode })}>Toggle book frame</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
