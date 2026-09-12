import { Compass, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { supabaseEnabled, signInGoogle } from '../lib/supabase'
import { useStickyState } from '../lib/useStickyState'
import { cat } from '../lib/colors'
import { Button } from './ui/button'

/**
 * Shown while exploring sample data (the guest demo). Guest is for *seeing* the
 * features; keeping a real journal needs an account · this nudges the sign-up
 * without blocking exploration. Hidden once a real account takes over (App
 * clears `settings.explore` on sign-in).
 *
 * **It is dismissible, and the dismissal sticks.** It sat above every view of
 * every page for as long as the demo data was loaded — an unclosable strip that
 * says the same sentence on the thousandth screen as on the first, which is an
 * ad, not a nudge. Someone deliberately exploring the sample journal reads it
 * once. The offer is not lost with it: Settings → Account carries the same two
 * buttons, which is where the banner's own "Use email" already pointed.
 *
 * Per device, not in the journal: `useStickyState` writes to `bujo.ui.*` rather
 * than `settings`, so dismissing it on a laptop does not silently dismiss it on
 * a phone that has never seen it — and it cannot ride the sync or the undo
 * stack. Loading the demo again on a fresh device shows it again, once.
 */
export function ExploreBanner() {
  const { data } = useJournal()
  const nav = useNav()
  const [busy, setBusy] = useState(false)
  const [seen, setSeen] = useStickyState('explore.banner', 'show', ['show', 'dismissed'] as const)
  if (!data.settings.explore || seen === 'dismissed') return null

  async function startAccount() {
    if (!supabaseEnabled()) { nav('settings'); return }
    setBusy(true)
    try { await signInGoogle() } // redirects to Google; App drops the demo on return
    catch { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <Icon as={Compass} size="sm" style={{ color: cat('mauve') }} />
      <span className="text-fg-1">
        You’re exploring sample data. <strong className="text-fg-1">Sign up to start your own journal</strong> · it syncs across your devices.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={startAccount} disabled={busy} className="press-3d text-label">
          {busy ? '…' : supabaseEnabled() ? 'Continue with Google' : 'Sign up'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => nav('settings')} className="h-auto p-0 text-label">Use email</Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSeen('dismissed')}
          aria-label="Dismiss the sample-data notice"
          title="Dismiss · sign up any time from Settings → Account"
          className="text-fg-2 hover:text-fg-1"
        >
          <Icon as={X} size="sm" />
        </Button>
      </div>
    </div>
  )
}
