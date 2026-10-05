import { useEffect, useState } from 'react'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { isConfigured, currentUser, onAuthChange, signInGoogle, signOut, type User } from '../../lib/supabase'
import { notify } from '../../lib/notify'

/**
 * THE ONLY SIGN-IN SURFACE IN THIS APP, and it is kept to one on purpose.
 *
 * The previous implementation had the same auth form in `views/Account`,
 * `views/Welcome` and `views/Settings`, plus two call sites that went around
 * the shared hook entirely. Removing it needed a tree-wide sweep because
 * nothing had ever counted the copies, and only one of the three handled a
 * recovery link. `lib/auth.contract.test.ts` now asserts the count: at most one
 * component may call `signInGoogle`. If you need sign-in somewhere else, render
 * *this* component there.
 *
 * ── Absent, not broken ─────────────────────────────────────────────────────
 *
 * Returns null when the build has no Supabase project configured. This repo is
 * public; most clones will never set `VITE_SUPABASE_URL`, and a sign-in button
 * that throws on click is a worse first run than no button at all.
 *
 * ── The sentence this card exists to say ───────────────────────────────────
 *
 * **The account is recoverable. The journal is not.** Signing in gets you back
 * to your row; only the sync passphrase gets you back to your journal, because
 * the journal is encrypted in the browser and this project has never held the
 * key. Every other product that offers a Google button means "we can always get
 * your data back to you", and this one cannot. That is a deliberate trade — see
 * `docs/security/account-sync-plan.md` §0 — and a card that offers the button
 * without the sentence would be misrepresenting it.
 */
export function AccountCard() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)
  const configured = isConfigured()

  useEffect(() => {
    if (!configured) return
    // Seed from the current session, then follow changes. Both halves are
    // needed: `currentUser()` alone is how the old `AccountMenu` ended up
    // disagreeing with the page until a reload (COD-134), and the subscription
    // alone would miss a session restored from storage on this very mount.
    let alive = true
    void currentUser().then((u) => { if (alive) setUser(u) })
    const off = onAuthChange((u) => setUser(u))
    return () => { alive = false; off() }
  }, [configured])

  if (!configured) return null

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
      notify.success('Signed out', 'Your journal is still on this device.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      band
      title="Account"
      subtitle={user ? 'Signed in — your journal syncs to your account' : 'Sign in to reach this journal from any device'}
    >
      {user ? (
        <div className="space-y-3">
          <p className="text-body text-fg-1">
            Signed in as <strong className="text-fg-1">{user.email ?? 'your Google account'}</strong>.
          </p>
          <p className="text-body text-fg-2">
            Your journal is encrypted on this device before it is uploaded, so the server stores
            ciphertext and nothing else. Signing in on another device finds your journal; your sync
            passphrase is what opens it.
          </p>
          <Button variant="secondary" onClick={disconnect} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </Button>
          <p className="text-body text-fg-2">Signing out leaves this journal on this device.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-body text-fg-2">
            An account is how this journal reaches your phone and your desktop without copying
            anything by hand. Google tells us who you are — it does not get your journal.
          </p>
          <Button onClick={connect} disabled={busy}>
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </Button>
          {/* The honest half. It is not a footnote and it is not styled as one:
              a reader who takes only one sentence from this card should take
              this one, because every other account they have ever made behaves
              the opposite way. */}
          <p className="text-body text-fg-1">
            <strong>The account is recoverable. The journal is not.</strong> If you lose your sync
            passphrase you can still sign in, your data is still there, and it cannot be read —
            by you or by anyone else. That is what keeps it private, and it is the cost.
          </p>
        </div>
      )}
    </Card>
  )
}
