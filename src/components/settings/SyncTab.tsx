import { CloudStorage } from '../CloudStorage'
import { DriveSync } from '../DriveSync'
import { CardGrid } from '../shell/CardGrid'
import { CloudSyncCard } from '../account/CloudSyncCard'
import { Disclosure } from './shared'
import { PasscodeCard } from './PasscodeCard'
import { SelfHostCard } from './SelfHostCard'

/**
 * Does the journal leave this device, and is it readable if the device is
 * taken? `CloudSyncCard` is the same component the Account page renders, not a
 * copy of it — see `views/Account.tsx` for why it lives in both places.
 */
export function SyncTab() {
  return (
    <>
          {/* Recommended path: account + E2E cloud sync, plus at-rest passcode.
              In a grid, not a stack: full-bleed these gave a 1,160px-wide
              passphrase field and ~150-character paragraph lines, the widest
              measure anywhere in the app on the page that asks for a secret. */}
          <CardGrid>
            <CloudSyncCard />
            <PasscodeCard />
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
