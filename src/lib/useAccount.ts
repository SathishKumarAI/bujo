/**
 * The signed-in account, or null — for every surface that has to ask.
 *
 * `ready` exists because "not signed in" and "we have not looked yet" must not
 * render the same. On a cold load the SDK has to be fetched and the stored
 * session refreshed; showing "Sign in" for that half-second makes a signed-in
 * user reach for the button. Same family as the browser-gate trap in
 * `CLAUDE.md`: an empty answer is usually "not yet", not "not ever".
 *
 * With no Supabase configured this settles immediately to `{ user: null,
 * ready: true, configured: false }` and never touches the network.
 */
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { currentAccount, onAccountChange, supabaseConfigured } from './supacloud'

export interface AccountState {
  user: User | null
  ready: boolean
  configured: boolean
}

export function useAccount(): AccountState {
  const configured = supabaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!configured)

  useEffect(() => {
    if (!configured) return
    let live = true
    let off = () => {}
    void (async () => {
      // Subscribe first, then read: the magic-link exchange can complete while
      // `getUser()` is in flight, and a listener attached afterwards misses it.
      off = await onAccountChange((u) => { if (live) { setUser(u); setReady(true) } })
      const u = await currentAccount().catch(() => null)
      if (live) { setUser(u); setReady(true) }
    })()
    return () => { live = false; off() }
  }, [configured])

  return { user, ready, configured }
}
