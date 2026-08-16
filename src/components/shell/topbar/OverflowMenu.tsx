import { Command, DotsThree, Question, SlidersHorizontal } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { useJournal } from '../../../store'
import type { ViewId } from '../viewChrome'

/**
 * Everything that is not this page's job · the ⋯ menu.
 *
 * ⌘K lives here rather than as its own icon: the palette is a keyboard surface,
 * and a permanent button for it spent a slot in the bar advertising a shortcut
 * to the people already using it.
 */
export function OverflowMenu({
  onNavigate,
  onCommand,
}: {
  onNavigate: (id: ViewId) => void
  onCommand: () => void
}) {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More options">
          <Icon as={DotsThree} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
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
  )
}
