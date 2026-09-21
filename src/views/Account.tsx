import { useJournal } from '../store'
import { Card } from '../components/ui'
import { PageLayout } from '../components/page/PageLayout'
import { StatBar } from '../components/page/StatBar'
import { CardGrid } from '../components/shell/CardGrid'
import { LocalAccountCard } from '../components/account/LocalAccountCard'
import { CloudSyncCard } from '../components/account/CloudSyncCard'
import { ProjectLinks } from '../components/account/ProjectLinks'
import { useNav } from '../components/shell/nav'

/**
 * Account — who this journal belongs to, and how (or whether) it travels.
 *
 * **There is no sign-in here, and there is no longer one anywhere in the app.**
 * This page used to be a centred auth card: email, password, "Continue with
 * Google", and the local option as grey text below a divider. That was Path B's
 * front door on a product that committed to Path A, and it was the first thing
 * a new user saw. `docs/AUTH.md` records why it was removed rather than
 * deprecated, and what each remaining mechanism actually is.
 *
 * The page is now three answers to three different questions, in the order
 * people ask them:
 *
 *   1. Who is this?           → the local profile (a name, nothing checked)
 *   2. Does it leave here?    → the sync passphrase (opt-in, E2E, no accounts)
 *   3. Something is wrong     → the issue tracker, which is the whole channel
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
  const syncing = typeof localStorage !== 'undefined' && !!localStorage.getItem('bujo:sync')

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
            { label: 'account', value: profile ? profile.name : 'not set up' },
            { label: 'journal', value: syncing ? 'synced' : 'this device only' },
            { label: 'entries', value: String(data.entries.length) },
          ]}
        />
      }
      zone3={
        <CardGrid>
          <LocalAccountCard />
          <CloudSyncCard />
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
