import { Card } from '../ui'
import { Button } from '../ui/button'
import { isConfigured, signInGoogle, signOut } from '../../lib/supabase'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy, SYNCED, WITHHELD, type AccountPhase } from '../../lib/account'
import { notify } from '../../lib/notify'
import { useState } from 'react'

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
 * ── It no longer owns the session ──────────────────────────────────────────
 *
 * The user comes from `lib/authUser.ts` and the sync phase from
 * `lib/accountStatus.ts`, not from a `useState` in here. That is COD-291: while
 * this card held the only copy, signing in changed this card and nothing else —
 * the header avatar still said "No name set", the Account page's orientation bar
 * still said "this device only", and the sync pill never lit. Reported, exactly,
 * as "able to sign in, but it's not showing any kind of updates on my UI".
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
 *
 * ── And the second sentence, which is newer and was being contradicted ─────
 *
 * **Signed in is not synced.** `AccountSync` cannot upload without a sync
 * passphrase and returns early when there is none; this card's subtitle used to
 * read "Signed in — your journal syncs to your account" regardless. So the
 * commonest state of a brand-new account — signed in, no passphrase, nothing
 * uploaded, nothing ever going to be — was reported as a working sync. The
 * status row below is driven by the phase the sync component publishes, so the
 * card can only say what is actually happening.
 */
export function AccountCard({ onGoToSync }: { onGoToSync?: () => void } = {}) {
  const [busy, setBusy] = useState(false)
  const configured = isConfigured()
  const { user, ready } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)

  if (!configured) return null

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
      notify.success('Signed out', 'Your journal is still on this device.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      band
      title="Account"
      /* The phase, not the email. The email is the identity line in the body,
         and `Card` also feeds the subtitle to the ⓘ popover — so repeating it
         here put the same address on screen twice and in the tooltip. */
      subtitle={who ? `Signed in with ${who.provider} · ${copy.short}` : 'Sign in to reach this journal from any device'}
    >
      {who ? (
        <div className="space-y-4">
          {/* Who, with the provider's own name and picture. The picture is the
              fastest possible answer to "did that sign-in work" — it cannot be
              produced by a signed-out app. `referrerPolicy` because Google
              serves avatars from a host that 403s on a cross-origin referrer,
              and `onError` hides a broken frame rather than drawing one. */}
          <div className="flex items-center gap-3">
            {who.avatarUrl ? (
              <img
                src={who.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-pill object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-body font-medium text-fg-1">{who.name}</p>
              {who.email ? <p className="truncate text-label text-fg-2">{who.email}</p> : null}
            </div>
          </div>

          {/* The status row. A dot carries the tone and the sentence carries the
              meaning — never the other way round, because a colour alone is not
              readable to everyone and `short` has to stand on its own. */}
          <div className="flex items-start gap-2">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-pill ${TONE[copy.tone]}`} />
            <p className="max-w-[56ch] text-body text-fg-2">
              <strong className="font-medium text-fg-1">{copy.short}</strong> — {copy.detail}
            </p>
          </div>

          {/* The one actionable state. `no-passphrase` is where a new account
              sits by default and it is the state in which nothing syncs, so it
              gets the button rather than a line of prose to act on. */}
          {phase === 'no-passphrase' && onGoToSync ? (
            <Button onClick={onGoToSync}>Set a sync passphrase</Button>
          ) : null}

          {/* "What kind of data is being synced" had no answer anywhere on
              screen. Both lists, because the withheld one is the half a reader
              cannot verify for themselves. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-label font-medium text-fg-1">Uploaded, encrypted</p>
              <ul className="mt-1 space-y-1 text-label text-fg-2">
                {SYNCED.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-label font-medium text-fg-1">Never uploaded</p>
              <ul className="mt-1 space-y-1 text-label text-fg-2">
                {WITHHELD.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          <p className="max-w-[56ch] text-body text-fg-2">
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
        <div className="max-w-[56ch] space-y-3">
          {/* Capped at the house measure. This card is full-bleed — it is the act
            zone — so without a cap its paragraphs ran the width of the page: at
            1707 they measured **1378px carrying 160 and 230 characters**, the
            widest measure anywhere in the app, on the card that has to be read
            rather than skimmed. 56ch is `.prose-doc`'s width and it is measured,
            not guessed: `ch` is the width of "0", which in Instrument Sans is
            half again the average letter, so 56ch lands at 68-75 characters.
            The class rather than `.prose-doc` itself, which also recolours to
            `subtext1` — the honesty sentence below is `fg-1` on purpose. */}
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

/**
 * Tone → a `bg-*` utility, spelled out rather than interpolated.
 *
 * Tailwind cannot see `bg-${tone}`, and a class it cannot see is a class it does
 * not emit — the Tailwind-v4 trap in `CLAUDE.md`: no error, no CSS, the dot just
 * inherits and the status loses its colour silently. And these are backgrounds
 * on purpose: an accent as *text* is the `cat('crust')` family of contrast bugs,
 * and the sentence beside the dot is what actually carries the meaning.
 */
const TONE: Record<string, string> = {
  green: 'bg-green',
  peach: 'bg-peach',
  red: 'bg-red',
  'fg-2': 'bg-fg-2',
}
