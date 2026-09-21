import { ArrowCounterClockwise, Command, Gear, Minus, Plus, Question, ShareNetwork, ShieldCheck, UserCircle } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useJournal } from '../../store'
import { notify } from '../../lib/notify'
import type { ViewId } from './viewChrome'

/**
 * THE header menu — who this journal belongs to, and everything that is not
 * this page's job.
 *
 * It was two menus sitting next to each other in the top-right corner, and
 * they overlapped:
 *
 * | Item | Account (avatar) | Overflow (⋯) |
 * |---|---|---|
 * | Settings | ✓ | ✓ |
 * | Help | "How your data is stored" | "Help & guide" |
 * | Theme | — | 4 of the 6 |
 * | Paper / handwriting / book | — | ✓ (also in Settings) |
 *
 * Two doors to Settings, two differently-named doors to Help, and a theme
 * picker that could not reach `vscode` or `dawn` — so picking Dawn in Settings
 * left the ⋯ menu showing no theme selected at all.
 *
 * One menu now, anchored on the avatar rather than on ⋯, because identity is
 * something a person looks for and "more options" is not. What it holds is
 * **who you are, where you go, and what you can undo** — three things that are
 * about the app rather than about the page.
 *
 * **Appearance is deliberately not here.** Theme, paper, handwriting and the
 * book frame all live in Settings → Appearance, which is where their other
 * copies already were, and where the theme picker has swatches and all six
 * options instead of four bare labels. A setting with two homes drifts; this
 * one had drifted before anyone noticed.
 *
 * Zoom stays, and is not the same control as Settings' "Text size": zoom is a
 * live nudge of the whole page, `fontScale` is a typographic preference that
 * leaves charts alone. Two names for two things.
 *
 * The label deliberately says "This device only" rather than anything about
 * safety: sync being off is a fact about where the data is, not a claim about
 * who can read it. The passcode is the control that does that, and it lives in
 * Settings.
 */
export function AccountMenu({
  onNavigate,
  onCommand,
}: {
  onNavigate: (id: ViewId) => void
  onCommand: () => void
}) {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const profile = data.settings.profile
  const syncing = typeof localStorage !== 'undefined' && !!localStorage.getItem('bujo:sync')
  const label = profile ? profile.name : 'No name set'
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  function share() {
    navigator.clipboard
      ?.writeText(window.location.origin)
      .then(() => notify.success('Link copied', 'Share it with anyone — it carries no data of yours.'))
      .catch(() => notify.error('Could not copy the link'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account and app menu" title={`Account, ${label}`} className="relative">
          {profile ? (
            <span aria-hidden className="text-base leading-none">{profile.emoji}</span>
          ) : (
            <Icon as={UserCircle} size="md" />
          )}
          {!profile && <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-pill bg-yellow" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-body font-medium text-fg-1">{label}</p>
          <p className="text-label text-fg-2">{syncing ? 'Syncing with your passphrase' : 'This device only'}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onNavigate('account')}>
          <Icon as={UserCircle} size="sm" className="mr-2" /> {profile ? 'Account & sync' : 'Set up this journal'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={share}>
          <Icon as={ShareNetwork} size="sm" className="mr-2" /> Share app
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onCommand}>
          <Icon as={Command} size="sm" className="mr-2" /> Command palette
          <span className="ml-auto text-micro text-fg-2">⌘K</span>
        </DropdownMenuItem>
        {/* One door to Settings, not two — and it is the door to the theme
            picker, the paper toggles and the text size as well. */}
        <DropdownMenuItem onClick={() => onNavigate('settings')}>
          <Icon as={Gear} size="sm" className="mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('help')}>
          <Icon as={Question} size="sm" className="mr-2" /> Help &amp; guide
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('account')}>
          <Icon as={ShieldCheck} size="sm" className="mr-2" /> How your data is stored
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={!canUndo} onClick={undo}>
          <Icon as={ArrowCounterClockwise} size="sm" className="mr-2" /> Undo
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canRedo} onClick={redo}>
          <Icon as={ArrowCounterClockwise} size="sm" className="mr-2 -scale-x-100" /> Redo
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom - 0.1) })}>
          <Icon as={Minus} size="sm" className="mr-2" /> Zoom out
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSettings({ zoom: 1 })}>
          <span className="mr-2 w-4" /> Reset zoom ({Math.round(zoom * 100)}%)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom + 0.1) })}>
          <Icon as={Plus} size="sm" className="mr-2" /> Zoom in
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
