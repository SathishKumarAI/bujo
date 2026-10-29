import { Card } from '../ui'
import { Button } from '../ui/button'
import { isConfigured, signInGoogle, signOut } from '../../lib/supabase'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy, SYNCED, WITHHELD, type AccountPhase } from '../../lib/account'
import { notify } from '../../lib/notify'
import { useState } from 'react'
import { PhonePoints } from '../PhonePoints'

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
 * ── What this card used to say, and why it no longer does ─────────────────
 *
 * It led with **"The account is recoverable. The journal is not."** — true
 * under COD-271, where the row was ciphertext and only a passphrase this
 * project never held could open it. COD-309 removed that, so the sentence is
 * gone rather than softened. Copy that survives the mechanism it described is
 * how a card ends up lying politely.
 *
 * What replaces it is not reassurance, it is the other half of the same trade:
 * **the server can read this journal, and your account is what keeps it
 * yours.** A reader who takes one sentence from this card should take that one,
 * because the thing they are signing into is now an ordinary cloud account and
 * the previous version promised something stronger.
 *
 * ── The claim that must still never be made ───────────────────────────────
 *
 * **Signed in is not synced.** The structural reason is gone — there is no
 * passphrase to be missing — but a first pull still takes a moment, an upload
 * still fails offline, a demo journal is still refused, and a row this build
 * cannot read is still refused. The status row is driven by the phase
 * `AccountSync` publishes, so the card can only say what is actually
 * happening; now that the obvious obstacle has been removed, a wrong "synced"
 * would be harder to doubt, not easier.
 */
export function AccountCard() {
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
      // "Everywhere", because it now is: `signOut` revokes the refresh token
      // globally, so the phone-shaped copy of this session dies with it. A
      // toast that said only "Signed out" would under-report what just
      // happened to the user's other devices.
      notify.success('Signed out everywhere', 'Your journal is still on this device.')
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

          {/* "What kind of data is being synced" had no answer anywhere on
              screen. Both lists, because the withheld one is the half a reader
              cannot verify for themselves. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-label font-medium text-fg-1">Uploaded to your account</p>
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
            Sign in on another device and your journal is there — nothing to copy, nothing to
            enter. Your account is what keeps it yours: every row is readable only by the account
            that owns it, enforced by the database rather than by this app. The flip side is that
            it is stored in a form the server can read, so it is private to your account and not
            secret from it.
          </p>
          <Button variant="secondary" onClick={disconnect} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </Button>
          <p className="max-w-[56ch] text-body text-fg-2">
            Signing out leaves this journal on this device, and ends the session on your other
            devices too.
          </p>
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
          <PhonePoints
            prose={<p className="text-body text-fg-2">
              An account is how this journal reaches your phone and your desktop without copying
              anything by hand. One tap, and it keeps itself up to date from then on — there is
              nothing else to set up and no second password to remember.
            </p>}
            points={[
              'Your journal on your phone and your desktop, nothing copied by hand',
              'One tap, and it keeps itself up to date',
              'No second password to remember',
            ]}
          />
          <Button onClick={connect} disabled={busy}>
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </Button>
          {/* The honest half. Not a footnote and not styled as one — it is the
              sentence the previous version of this card promised the opposite
              of, so a reader who skims has to still meet it. */}
          <PhonePoints
            className="text-body text-fg-1"
            prose={<p className="text-body text-fg-1">
              <strong>Your journal is private to your account, not secret from the server.</strong>{' '}
              It is stored in a form the service can read, so losing access never loses your data —
              and anyone with database access could read it. Your cycle log is the exception: it is
              never uploaded, by any route.
            </p>}
            points={[
              <strong key="h">Private to your account, not secret from the server</strong>,
              'Losing access never loses your data',
              'Anyone with database access could read it',
              'Your cycle log is never uploaded, by any route',
            ]}
          />
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
