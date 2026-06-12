import { ChevronLeft, ChevronRight, Plus, Command, MoreHorizontal, Menu, Sun, Moon, Settings as SettingsIcon, HelpCircle, Lightbulb, PanelLeft } from 'lucide-react'
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
import { addDays, prettyDay, prettyMonth, todayISO, ymOf } from '../../lib/date'

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
  const chrome = VIEW_CHROME[view]
  const recs = recommendations(data)
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur">
      <button onClick={onMenu} aria-label="Toggle menu" className="text-foreground md:hidden">
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="font-display text-lg leading-tight font-semibold text-foreground">{chrome.title}</h1>
        {chrome.subtitle && <p className="truncate text-xs text-muted-foreground">{chrome.subtitle}</p>}
      </div>

      {/* Contextual help — what this page does, pulled from the view registry. */}
      {chrome.help && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`What is ${chrome.title}?`} title={`What is ${chrome.title}?`} className="shrink-0 text-overlay0 hover:text-foreground">
              <HelpCircle size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <div className="px-2 py-1.5">
              <p className="mb-1 font-display text-sm font-semibold text-foreground">{chrome.title}</p>
              <p className="text-xs leading-relaxed text-subtext0">{chrome.help}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('help')} className="text-xs text-blue">Open the full guide →</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {chrome.dateNav && (
        <div className="ml-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous"
            onClick={() => (chrome.dateNav === 'day' ? setDay(addDays(day, -1)) : setMonth(shiftMonth(month, -1)))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (chrome.dateNav === 'day' ? setDay(todayISO()) : setMonth(ymOf(todayISO())))}
          >
            {chrome.dateNav === 'day' ? prettyDay(day) : prettyMonth(month)}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next"
            onClick={() => (chrome.dateNav === 'day' ? setDay(addDays(day, 1)) : setMonth(shiftMonth(month, 1)))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="default" size="sm" onClick={onQuickAdd} className="gap-1.5">
          <Plus size={15} /> <span className="hidden sm:inline">Quick add</span>
        </Button>

        {/* Recommendations — small icon + count badge, no wasted vertical space. */}
        {recs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`${recs.length} suggestions`} title="Suggestions" className="relative">
                <Lightbulb size={16} className="text-yellow" />
                <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-yellow px-0.5 text-[9px] font-bold text-crust">{recs.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {recs.map((r) => (
                <DropdownMenuItem key={r.id} onClick={() => r.action && onNavigate(r.action.view)} className="flex-col items-start gap-1 py-2">
                  <span className="text-sm text-subtext1">{r.text}</span>
                  {r.action && <span className="text-xs text-blue">→ {r.action.label}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant={view === 'settings' ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label="Settings"
          aria-current={view === 'settings' ? 'page' : undefined}
          title="Settings"
          onClick={() => onNavigate('settings')}
        >
          <SettingsIcon size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={data.settings.theme === 'mocha' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Toggle theme"
          onClick={() => setSettings({ theme: data.settings.theme === 'mocha' ? 'latte' : 'mocha' })}
          className="hidden sm:inline-flex"
        >
          {data.settings.theme === 'mocha' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        {/* ⌘K is keyboard-only — hide on phones to keep the bar from overflowing. */}
        <Button variant="ghost" size="icon-sm" aria-label="Command palette (⌘K)" title="⌘K" onClick={onCommand} className="hidden sm:inline-flex">
          <Command size={16} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More options">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-[10px] tracking-wider text-overlay0 uppercase">Theme</div>
            {(['mocha', 'latte', 'neon', 'system'] as const).map((th) => (
              <DropdownMenuItem key={th} onClick={() => setSettings({ theme: th })}>
                <span className={data.settings.theme === th ? 'text-mauve' : ''}>{data.settings.theme === th ? '● ' : '○ '}</span>
                {th === 'mocha' ? 'Dark' : th === 'latte' ? 'Light' : th === 'neon' ? 'Neon ✦' : 'System'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('help')}>
              <HelpCircle size={15} /> Help &amp; guide
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
              <PanelLeft size={15} /> {data.settings.sidebarAutoHide ? 'Pin sidebar' : 'Auto-hide sidebar'}
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
