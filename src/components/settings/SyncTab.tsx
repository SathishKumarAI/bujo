import { CloudStorage } from '../CloudStorage'
import { DriveSync } from '../DriveSync'
import { CloudSyncCard } from '../account/CloudSyncCard'
import { Disclosure } from './shared'
import { PasscodeCard } from './PasscodeCard'
import { SelfHostCard } from './SelfHostCard'
import { ConnectionsCard } from './ConnectionsCard'
import { VoiceModelCard } from './VoiceModelCard'
import { SecurityCard } from '../account/SecurityCard'
import { SyncStatusBar } from './SyncStatusBar'

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
          {/* Zone 1, which this view had nowhere: the tab row was the only
              orientation on the page that answers "does my journal leave".
              Four facts, each of which changes what you do in the next thirty
              seconds — see `SyncStatusBar` for why "what is withheld" is
              deliberately not one of them. */}
          {/* Spans both desktop columns: four facts read across, not wrapped. */}
          <div className="settings-span"><SyncStatusBar /></div>
          {/* No grid of its own any more. `SectionScreen` packs this whole
              section into height-filling columns, so a grid here would be a
              second layout competing with it — and the thing a grid was for
              (stopping a full-bleed 1,160px passphrase field and
              150-character lines) is handled better by a 21rem column.

              The reading order this used to protect is preserved by source
              order: sync and the lock come before the two optional outbound
              connections. `column-fill: auto` is column-major, so that order
              now reads down-then-right rather than across. */}
          <CloudSyncCard />
          <PasscodeCard />
          <ConnectionsCard />
          <VoiceModelCard />
          {/* Advanced · BYO-storage / self-host, collapsed to cut option
              overload. `Disclosure` defaults to OPEN, so this comment and the
              three below it described an intent the page never had: every fold
              on Settings shipped expanded, which is why Sync ran to 1,900px and
              Data to 3,000. */}
          {/* The two halves of "how is this protected", moved from the retired
              Account page (COD-297). They belong beside the mechanisms they
              describe: the passcode, the passphrase and the egress boundary are
              all on this tab, and the cards explaining them were one page away
              with no link between them. The second card is not optional — a
              page that lists only the protections is marketing. */}
          <SecurityCard />
          <Disclosure title="Advanced sync" subtitle="self-host & bring-your-own storage" defaultOpen={false}>
            <SelfHostCard />
            <CloudStorage />
            <DriveSync />
          </Disclosure>
    </>
  )
}
