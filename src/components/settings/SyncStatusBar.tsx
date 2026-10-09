import { useJournal } from '../../store'
import { StatBar } from '../page/StatBar'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy, syncedAgo } from '../../lib/account'
import { autoSyncEnabled } from '../../lib/syncSecret'

/**
 * Zone 1 for the Sync tab — the four facts that decide what you do next.
 *
 * ── Why this exists (COD-297) ──────────────────────────────────────────────
 *
 * Settings had **no orient bar at all**: the tab row was the only orientation
 * on a page that answers "who am I, does my journal leave, and can anyone read
 * it". Meanwhile the sync *phase* — the thing COD-291 built — surfaced in
 * exactly two places, the header avatar menu and a card on the retired Account
 * page, neither of which is where you go to change it.
 *
 * ── Why these four, and not the obvious fifth ───────────────────────────────
 *
 * The contract's test is whether a fact changes what you do in the next thirty
 * seconds. All four here do: no account → sign in; not syncing → set a
 * passphrase; last synced days ago → check why; no passcode → decide whether
 * you want one.
 *
 * What is deliberately NOT here is "what gets withheld" (the cycle log, the
 * other services' tokens, oversized photos). It is the single most reassuring
 * thing this app can say and it is **review**, not orientation — nobody acts on
 * it in thirty seconds. It lives in `SecurityCard`, in full sentences, further
 * down the same tab. A fact bar that grows to hold the reassuring things is how
 * a page ends up with a zone 4.
 *
 * ── The account answer beats the passphrase answer ─────────────────────────
 *
 * There are two sync mechanisms: the account row (Google identity, COD-271) and
 * the passphrase blob (`bujocloud`, no accounts). When signed in, the phase is
 * the truthful answer and `autoSyncEnabled()` is a detail of it — reading the
 * passphrase flag first is how the header spent COD-291 reporting "This device
 * only" at a signed-in user.
 */
export function SyncStatusBar() {
  const { encrypted } = useJournal()
  const { user } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)
  const passphrase = autoSyncEnabled()

  const sync = user
    ? phaseCopy(status.phase, status.lastSyncedAt).short
    : passphrase ? 'passphrase only' : 'off'

  return (
    <StatBar
      facts={[
        {
          label: 'account',
          // The local profile is NOT offered as a fallback here. On the Account
          // tab it is, because there the question is "what do we call you"; here
          // the question is "is there a row in the cloud with your name on it",
          // and a nickname is not an answer to it.
          value: who?.name ?? 'not signed in',
          prose: true,
        },
        { label: 'sync', value: sync, prose: true },
        {
          label: 'last synced',
          // An em dash, not "never" and certainly not a zero: the contract's
          // empty-state rule. "Never" reads as a failure on a journal that has
          // deliberately never left the device.
          value: status.lastSyncedAt == null ? '—' : syncedAgo(status.lastSyncedAt),
          prose: true,
        },
        {
          // `encrypted` is the live store flag — a passcode that exists AND has
          // been unlocked this session. `data.settings` holds no passcode, by
          // design, so there is nothing else to read.
          label: 'this device',
          value: encrypted ? 'locked at rest' : 'not locked',
          prose: true,
        },
      ]}
    />
  )
}
