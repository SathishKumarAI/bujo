import { CaretLeft, CaretRight, Command, DotsThree, Lightbulb, List, Moon, Plus, Question, Sidebar, SlidersHorizontal, Sun } from '@/components/icons'
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
import { AccountMenu } from './AccountMenu'
import { FeedbackButton } from '../feedback/FeedbackButton'
import { DateJumpPicker } from './DateJumpPicker'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function shiftMonth(ym: string, delta: number): string {
  const [y, mo] = ym.split('-').map(Number)
  return ymOf(new Date(y, mo - 1 + delta, 1))
}

/** Sticky header: view title, hoisted date-nav, quick-add, ⌘K, overflow menu. */
export function TopBar({
  view,
  onNavigate,
  onQuickAdd,
  onCommand,
  onMenu,
}: {
  view: ViewId
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

      <div className="min-w-0">
        <h1 className="font-display text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
        {chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
      </div>

      {/* Contextual help — what this page does, pulled from the view registry. */}
      {chrome.help && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`What is ${chrome.title}?`} title={`What is ${chrome.title}?`} className="shrink-0 text-fg-2 hover:text-foreground">
              <Icon as={Question} size="md" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <div className="px-2 py-1.5">
              <p className="mb-1 font-display text-body font-medium text-foreground">{chrome.title}</p>
              <p className="text-label leading-relaxed text-fg-2">{chrome.help}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('help')} className="text-label text-blue">Open the full guide →</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {chrome.dateNav && (
        <div className="relative ml-2 flex items-center gap-1">
          {/* Day steps are real anchors, not click handlers, so middle-click
              and cmd-click open the day in a new tab the way any other link
              would. The month cursor has no route yet (Stage 2), so it stays a
              button — a link to nowhere would be a worse lie than a button. */}
          {chrome.dateNav === 'day' ? (
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to={`/day/${addDays(day, -1)}`} aria-label={`Previous day, ${prettyDay(addDays(day, -1))}`}>
                <Icon as={CaretLeft} size="md" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <Icon as={CaretLeft} size="md" />
            </Button>
          )}
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
          {chrome.dateNav === 'day' ? (
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to={`/day/${addDays(day, 1)}`} aria-label={`Next day, ${prettyDay(addDays(day, 1))}`}>
                <Icon as={CaretRight} size="md" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <Icon as={CaretRight} size="md" />
            </Button>
          )}
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
        <Button variant="primary" size="sm" onClick={onQuickAdd} className="gap-1.5">
          <Icon as={Plus} size="sm" /> <span className="hidden sm:inline">Quick add</span>
        </Button>

        {/* Recommendations — small icon + count badge, no wasted vertical space. */}
        {recs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`${recs.length} suggestions`} title="Suggestions" className="relative hidden sm:inline-flex">
                <Icon as={Lightbulb} size="md" className="text-yellow" />
                <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-pill bg-yellow px-0.5 text-micro font-medium text-crust">{recs.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {recs.map((r) => (
                <DropdownMenuItem key={r.id} onClick={() => r.action && onNavigate(r.action.view)} className="flex-col items-start gap-1 py-2">
                  <span className="text-body text-fg-1">{r.text}</span>
                  {r.action && <span className="text-label text-blue">→ {r.action.label}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Feedback is secondary — keep it off phones so the bar fits. */}
        <span className="hidden sm:inline-flex"><FeedbackButton /></span>
        <AccountMenu onNavigate={onNavigate} />
        {/* Settings gear hidden on phones (it's in the ⋯ menu there) to keep the
            header within the viewport. */}
        <Button
          variant={view === 'settings' ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label="Settings"
          aria-current={view === 'settings' ? 'page' : undefined}
          title="Settings"
          onClick={() => onNavigate('settings')}
          className="hidden sm:inline-flex"
        >
          <Icon as={SlidersHorizontal} size="md" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={data.settings.theme === 'mocha' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Toggle theme"
          onClick={() => setSettings({ theme: data.settings.theme === 'mocha' ? 'latte' : 'mocha' })}
          className="hidden sm:inline-flex"
        >
          {data.settings.theme === 'mocha' ? <Icon as={Sun} size="md" /> : <Icon as={Moon} size="md" />}
        </Button>
        {/* ⌘K is keyboard-only — hide on phones to keep the bar from overflowing. */}
        <Button variant="ghost" size="icon-sm" aria-label="Command palette (⌘K)" title="⌘K" onClick={onCommand} className="hidden sm:inline-flex">
          <Icon as={Command} size="md" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More options">
              <Icon as={DotsThree} size="md" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-micro tracking-wider text-fg-2 uppercase">Theme</div>
            {(['mocha', 'latte', 'neon', 'system'] as const).map((th) => (
              <DropdownMenuItem key={th} onClick={() => setSettings({ theme: th })}>
                <span className={data.settings.theme === th ? 'text-mauve' : ''}>{data.settings.theme === th ? '● ' : '○ '}</span>
                {th === 'mocha' ? 'Dark' : th === 'latte' ? 'Light' : th === 'neon' ? 'Neon ✦' : 'System'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('settings')} className="sm:hidden">
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
