import { Gear, ShareNetwork, SignIn, SignOut, UserCircle } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useJournal } from '../../store'
import { supabaseEnabled, currentUser, signOut, pushJournal } from '../../lib/supabase'
import type { ViewId } from './viewChrome'

/**
 * Top-bar account menu — one tap to your account status + sign out, no digging
 * through Settings. Especially for mobile. Only shown when an account backend
 * (Supabase) is configured.
 */
export function AccountMenu({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { data } = useJournal()
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (supabaseEnabled()) currentUser().then(setUser) }, [])
  if (!supabaseEnabled()) return null

  const signedIn = !!user && !user.is_anonymous
  const label = signedIn ? user!.email : user?.is_anonymous ? 'Guest' : 'Not signed in'

  async function out() {
    setBusy(true)
    try { await signOut() } finally { setUser(await currentUser()); setBusy(false) }
  }
  function share() { navigator.clipboard?.writeText(window.location.origin).catch(() => {}) }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account" title={`Account, ${label}`} className="relative">
          <Icon as={UserCircle} size="md" style={{ color: signedIn ? 'var(--color-green)' : undefined }} />
          {!signedIn && <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-pill bg-yellow" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-body font-medium text-fg-1">{label}</p>
          <p className="text-label text-fg-2">{signedIn ? 'Synced to your account' : 'Data on this device only'}</p>
        </div>
        <DropdownMenuSeparator />
        {signedIn ? (
          <>
            <DropdownMenuItem onClick={() => { setBusy(true); pushJournal(data).finally(() => setBusy(false)) }}>{busy ? 'Saving…' : 'Save now'}</DropdownMenuItem>
            <DropdownMenuItem onClick={out} className="text-red"><Icon as={SignOut} size="sm" className="mr-2" /> Sign out</DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => onNavigate('account')}><Icon as={SignIn} size="sm" className="mr-2" /> Sign in / Sign up</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={share}><Icon as={ShareNetwork} size="sm" className="mr-2" /> Share app</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('settings')}><Icon as={Gear} size="sm" className="mr-2" /> Account & sync settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
