import { useState } from 'react'
import { Compass } from 'lucide-react'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { supabaseEnabled, signInGoogle } from '../lib/supabase'
import { cat } from '../lib/colors'

/**
 * Shown while exploring sample data (the guest demo). Guest is for *seeing* the
 * features; keeping a real journal needs an account · this nudges the sign-up
 * without blocking exploration. Hidden once a real account takes over (App
 * clears `settings.explore` on sign-in).
 */
export function ExploreBanner() {
  const { data } = useJournal()
  const nav = useNav()
  const [busy, setBusy] = useState(false)
  if (!data.settings.explore) return null

  async function startAccount() {
    if (!supabaseEnabled()) { nav('settings'); return }
    setBusy(true)
    try { await signInGoogle() } // redirects to Google; App drops the demo on return
    catch { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <Compass size={15} style={{ color: cat('mauve') }} />
      <span className="text-fg-1">
        You’re exploring sample data. <strong className="text-fg-1">Sign up to start your own journal</strong> · it syncs across your devices.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={startAccount} disabled={busy} className="press-3d rounded-lg bg-mauve px-3 py-1 text-label font-medium text-crust disabled:opacity-50">
          {busy ? '…' : supabaseEnabled() ? 'Continue with Google' : 'Sign up'}
        </button>
        <button onClick={() => nav('settings')} className="text-label text-mauve hover:underline">Use email</button>
      </div>
    </div>
  )
}
