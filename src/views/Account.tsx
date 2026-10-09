import { useJournal } from '../store'
import { Card } from '../components/ui'
import { PageLayout } from '../components/page/PageLayout'
import { StatBar } from '../components/page/StatBar'
import { CardGrid } from '../components/shell/CardGrid'
import { LocalAccountCard } from '../components/account/LocalAccountCard'
import { CloudSyncCard } from '../components/account/CloudSyncCard'
import { AccountCard } from '../components/account/AccountCard'
import { SecurityCard } from '../components/account/SecurityCard'
import { ProjectLinks } from '../components/account/ProjectLinks'
import { useNav } from '../components/shell/nav'
import { useAuthUser } from '../lib/authUser'
import { useAccountStatus } from '../lib/accountStatus'
import { identityOf, phaseCopy } from '../lib/account'

/**
 * Account — who this journal belongs to, and how (or whether) it travels.
 *
 * **The one sign-in in the app lives here, and nowhere else.** This page used to
 * be a centred auth card — email, password, "Continue with Google", the local
 * option as grey text below a divider — which was Path B's front door on a
 * product that committed to Path A, and the first thing a new user saw. That
 * form was deleted; `AccountCard` is its replacement, one card in a grid rather
 * than a gate, and `lib/auth.contract.test.ts` holds the count at one.
 * `docs/AUTH.md` records what each remaining mechanism actually is.
 *
 * The page is four answers to four different questions, in the order people ask
 * them:
 *
 *   1. Who is this?           → the account, else the local profile
 *   2. Does it leave here?    → the account's sync phase, or the passphrase
 *   3. What exactly leaves?   → the uploaded/withheld lists in `AccountCard`
 *   4. Something is wrong     → the issue tracker, which is the whole channel
 *
 * `CloudSyncCard` is the same component Settings renders, not a copy of it. It
 * was moved out of `views/Settings.tsx` verbatim — the rendered card was
 * captured before and after and diffed byte-for-byte — because with no email
 * and no provider, *this* is what "sync your journal" means here, and it was
 * two tabs deep in Settings looking like an advanced option.
 */
export function Account() {
  const { data } = useJournal()
  const nav = useNav()
  const profile = data.settings.profile
  const { user } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)
  /**
   * Zone 1 used to read the LOCAL profile and `localStorage['bujo:sync']` — so
   * the page titled "Account" answered "who is this?" with a nickname and
   * "does it leave here?" with the blob-sync passphrase, and a signed-in user
   * saw "not set up · this device only" on the very page they had just signed
   * in on (COD-291).
   *
   * The account answer wins when there is one, and the local profile is the
   * fallback rather than the other way round: an account is checked and a
   * nickname is not.
   */
  const syncing = typeof localStorage !== 'undefined' && !!localStorage.getItem('bujo:sync')
  const journal = user
    ? phaseCopy(status.phase, status.lastSyncedAt).short
    : syncing ? 'synced (passphrase)' : 'this device only'

  return (
    <PageLayout
      tier={1180}
      stacked
      /* Three facts, and the middle one is the one people actually came to
         check. "This device only" is a statement of fact, not a warning — the
         whole design is that it is true until you decide otherwise. */
      zone1={
        <StatBar
          facts={[
            { label: 'account', value: who?.name ?? profile?.name ?? 'not set up', prose: true },
            { label: 'journal', value: journal, prose: true },
            { label: 'entries', value: String(data.entries.length) },
          ]}
        />
      }
      zone3={
        <CardGrid>
          {/* Renders nothing unless this build has a Supabase project, so the
              no-account app is unchanged. First in the grid when it does
              render: it is the thing the page is named after. */}
          <AccountCard onNavigate={nav} />
          <LocalAccountCard />
          <CloudSyncCard />
          {/* Both halves, and the second one is not optional. */}
          <SecurityCard />
          <ProjectLinks />

          {/* The passcode is the only control here that restricts access, and
              it lives in Settings. Saying so is load-bearing: the profile above
              looks like the thing that protects the journal and does not.

              A `Card band`, not the hand-rolled `<section>` this used to be:
              its three siblings in this grid are all `Card band`, and a
              re-typed copy of a primitive's markup is a copy that drifts. It
              already had — `py-5 sm:py-6` against the card's own padding, and
              a bare `<h2>` where `Card` names the heading for the fold and the
              screen reader. */}
          <Card band title="Locking this journal" subtitle="A name is not a lock" hideInfo>
            <p className="text-body text-fg-2">
              To encrypt the journal at rest on this device, set a passcode in{' '}
              <button className="text-brand-text hover:underline" onClick={() => nav('settings')}>
                Settings → Sync &amp; privacy
              </button>
              . Like the sync passphrase, it cannot be recovered if you lose it — that is the cost of
              the key never leaving your device.
            </p>
          </Card>
        </CardGrid>
      }
    />
  )
}
