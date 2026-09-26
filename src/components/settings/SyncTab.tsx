import { CloudStorage } from '../CloudStorage'
import { DriveSync } from '../DriveSync'
import { CardGrid } from '../shell/CardGrid'
import { CloudSyncCard } from '../account/CloudSyncCard'
import { Disclosure } from './shared'
import { PasscodeCard } from './PasscodeCard'
import { SelfHostCard } from './SelfHostCard'
import { ConnectionsCard } from './ConnectionsCard'
import { VoiceModelCard } from './VoiceModelCard'

/**
 * Does the journal leave this device, what else does the app talk to, and is
 * any of it readable if the device is taken?
 *
 * Four cards where there were two. The Reminders tab held the other two —
 * weather plus the food lookup, and the local model — under a docstring saying
 * it kept "everything that may reach outside this device in one place", which
 * was not true while cloud sync, the self-host API and Drive were on this tab.
 * Measured, the two tabs were **388px and 351px of content in a 743px
 * viewport**: two half-empty screens and two answers to one question. One tab
 * now, ~650px, and no tab in Settings is under half a screen except Profile.
 *
 * `CloudSyncCard` is the same component the Account page renders, not a copy of
 * it — see `views/Account.tsx` for why it lives in both places.
 */
export function SyncTab() {
  return (
    <>
          {/* In a grid, not a stack: full-bleed these gave a 1,160px-wide
              passphrase field and ~150-character paragraph lines, the widest
              measure anywhere in the app on the page that asks for a secret.

              `CardGrid` rather than `MasonryGrid`, deliberately: the reading
              order here is not arbitrary — sync and the lock come before the two
              optional outbound connections — and masonry is column-major. The
              cost is one aligned row, measured at ~70px of gap. */}
          <CardGrid>
            <CloudSyncCard />
            <PasscodeCard />
            <ConnectionsCard />
            <VoiceModelCard />
          </CardGrid>
          {/* Advanced · BYO-storage / self-host, collapsed to cut option
              overload. `Disclosure` defaults to OPEN, so this comment and the
              three below it described an intent the page never had: every fold
              on Settings shipped expanded, which is why Sync ran to 1,900px and
              Data to 3,000. */}
          <div className="mt-5">
            <Disclosure title="Advanced sync" subtitle="self-host & bring-your-own storage" defaultOpen={false}>
              <CardGrid>
                <SelfHostCard />
                <CloudStorage />
                <DriveSync />
              </CardGrid>
            </Disclosure>
          </div>
    </>
  )
}
