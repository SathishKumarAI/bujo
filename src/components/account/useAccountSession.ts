import { useState } from 'react'
import { isConfigured, signInGoogle, signOut } from '../../lib/supabase'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy, type AccountPhase } from '../../lib/account'
import { notify } from '../../lib/notify'

/** The session, its phase and the two actions — shared by this card and the
 *  phone's rows (`AccountPhoneCells.tsx`), so both say and do the same. */
export function useAccountSession() {
  const [busy, setBusy] = useState(false)
  const configured = isConfigured()
  const { user, ready } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)

  // `status.phase` is the sync component's view of the world and this is the
  // card's view of the *session*; they can disagree for a tick after a sign-in
  // (the subscription fires in both, in whatever order React flushes them). The
  // session wins, because it is the thing the user just did.
  const phase: AccountPhase = !ready ? 'checking' : user ? (status.phase === 'signed-out' ? 'checking' : status.phase) : 'signed-out'
  const copy = phaseCopy(phase, status.lastSyncedAt)

  async function connect() {
    setBusy(true)
    try {
      await signInGoogle()
      // No success toast: this navigates away to Google. Anything optimistic
      // here would be a claim made before the thing it claims has happened.
    } catch (e) {
      setBusy(false)
      notify.error('Could not start sign-in', (e as Error).message)
    }
  }

  async function disconnect() {
    setBusy(true)
    try {
      await signOut()
      // "Everywhere", because it now is: `signOut` revokes the refresh token
      // globally, so the phone-shaped copy of this session dies with it. A
      // toast that said only "Signed out" would under-report what just
      // happened to the user's other devices.
      notify.success('Signed out everywhere', 'Your journal is still on this device.')
    } finally {
      setBusy(false)
    }
  }

  return { configured, who, copy, busy, connect, disconnect }
}
