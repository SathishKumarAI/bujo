import { ChevronLeft, ChevronRight, Plus, Command, MoreHorizontal, Menu } from 'lucide-react'
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
  onQuickAdd,
  onCommand,
  onMenu,
}: {
  view: ViewId
  onQuickAdd: () => void
  onCommand: () => void
  onMenu: () => void
}) {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const { day, setDay, month, setMonth } = useCursor()
  const chrome = VIEW_CHROME[view]
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
        <Button variant="ghost" size="icon-sm" aria-label="Command palette (⌘K)" title="⌘K" onClick={onCommand}>
          <Command size={16} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More options">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setSettings({ theme: data.settings.theme === 'mocha' ? 'latte' : 'mocha' })}>
              {data.settings.theme === 'mocha' ? 'Light theme' : 'Dark theme'}
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
    </header>
  )
}
