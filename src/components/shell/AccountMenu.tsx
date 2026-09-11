import { Gear, ShareNetwork, ShieldCheck, UserCircle } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useJournal } from '../../store'
import { notify } from '../../lib/notify'
import type { ViewId } from './viewChrome'

/**
 * Top-bar account menu — who this journal belongs to, and whether it travels.
 *
 * It used to subscribe to Supabase auth and show an email address with a
 * "Sign out". There are no accounts any more (`docs/AUTH.md`), so it reads the
 * local profile instead and there is nothing to sign out of.
 *
 * It also used to return `null` whenever no auth backend was configured, which
 * meant a self-hosted or offline build had no account menu at all. The profile
 * is always available, so the menu always renders now.
 *
 * The label deliberately says "This device only" rather than anything about
 * safety: sync being off is a fact about where the data is, not a claim about
 * who can read it. The passcode is the control that does that, and it lives in
 * Settings.
 */
export function AccountMenu({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { data } = useJournal()
  const profile = data.settings.profile
  const syncing = typeof localStorage !== 'undefined' && !!localStorage.getItem('bujo:sync')
  const label = profile ? profile.name : 'No name set'

  function share() {
    navigator.clipboard
      ?.writeText(window.location.origin)
      .then(() => notify.success('Link copied', 'Share it with anyone — it carries no data of yours.'))
      .catch(() => notify.error('Could not copy the link'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account" title={`Account, ${label}`} className="relative">
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
        <DropdownMenuItem onClick={() => onNavigate('settings')}>
          <Icon as={Gear} size="sm" className="mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('help')}>
          <Icon as={ShieldCheck} size="sm" className="mr-2" /> How your data is stored
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
