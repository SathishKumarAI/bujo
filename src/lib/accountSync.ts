import type { JournalData } from './types'

/**
 * The decisions behind account sync, as pure functions.
 *
 * They live here rather than inside the effect that calls them because every
 * one of them is a data-loss question, and a question you can only answer by
 * driving a browser is a question that goes untested. `conflict.ts` made the
 * same move with its injectable `ask`.
 *
 * The whole module is about ONE failure: **overwriting a journal that is
 * intact and merely not usable by this device right now.** A transport error, a
 * row written by a different design, and a just-switched account all look
 * identical from inside a push — "I have local data, the remote is not usable,
 * therefore mine must be the good copy" — and all three of them are wrong.
 *
 * COD-309 removed the passphrase from this path, which removed one of the four
 * gates below and NOT the reason the rest exist. The commonest way to lose a
 * journal was never bad crypto; it was a push that ran before a pull finished.
 * That race is unchanged, and so is `verified`.
 */

/** Where the account's own sync state lives, in memory, for one session. */
export interface AccountSyncState {
  /** The signed-in user id, or null. */
  userId: string | null
  /**
   * Has this device established that it can safely write to this account's row?
   *
   * False until a pull has either decrypted successfully or found the row
   * empty. **Nothing may push while this is false.** This single latch is what
   * stands between a mistyped passphrase and a destroyed journal.
   */
  verified: boolean
  /**
   * Set when the row exists and this build cannot use what is in it.
   *
   * Under COD-271 this meant "the passphrase does not open it". It now means a
   * row holding something that is not a journal — most concretely, ciphertext
   * left behind by that older design. Either way the rule is the same and it is
   * the whole point of the flag: **a row we cannot read is not a row we may
   * overwrite.**
   */
  unusable: boolean
}

export const initialState: AccountSyncState = { userId: null, verified: false, unusable: false }

/**
 * May this device write the journal to the account row?
 *
 * Deliberately conservative: every unknown answers "no". Refusing to push
 * stalls a sync until the next change, which is recoverable; pushing over a
 * journal you could not read is not.
 */
export function mayPush(s: AccountSyncState, opts: { isDemo: boolean }): boolean {
  if (!s.userId) return false // not signed in
  if (opts.isDemo) return false // never push sample data into a real account
  if (s.unusable) return false // the row holds something we could not read
  return s.verified
}

/** Where the last account to own this device's journal is remembered. */
export const OWNER_KEY = 'bujo:account.owner'

/**
 * The account this device's journal last belonged to, across reloads.
 *
 * In-memory state cannot answer this. `prev.userId` is null after a sign-out
 * and null again on a fresh page load, so both of the dangerous sequences look
 * identical to a first-ever sign-in.
 */
export function lastOwner(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

/** Remember who this journal belongs to. Called once a pull has settled. */
export function rememberOwner(userId: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (userId) localStorage.setItem(OWNER_KEY, userId)
    else localStorage.removeItem(OWNER_KEY)
  } catch { /* storage blocked — the sync still runs, it just cannot remember */ }
}

/**
 * What a sign-in or account switch means for the journal already in memory.
 *
 * The case this exists for is COD-135, which shipped: switching accounts
 * merged the previous user's journal into the new one. The merge machinery is
 * right for "the same person on two devices" and catastrophically wrong for
 * "two people on one device" — it cannot tell them apart, so the caller has to.
 *
 * ── COD-135 was only half closed, and this is the other half ──────────────
 *
 * The original fix compared `prev.userId` with the incoming id, which is
 * in-memory and therefore blind to the two sequences that actually happen:
 *
 *   alice -> bob            caught      (prev.userId is 'alice')
 *   alice -> null -> bob    MISSED      sign out, then sign in as someone else
 *   alice -> reload -> bob  MISSED      no in-memory prev at all
 *
 * Both misses end the same way: alice's journal is merged into bob's account
 * and pushed there. The second is not exotic — signing out is the obvious
 * thing to do before handing someone your laptop.
 *
 * `remembered` is the persisted owner, so the comparison survives a sign-out
 * and a reload. It is passed in rather than read here to keep this function
 * pure: every one of these decisions is a data-loss question, and a question
 * you can only answer by driving a browser is a question that goes untested.
 */
export function onAccountChange(
  prev: AccountSyncState,
  nextUserId: string | null,
  remembered: string | null = null,
): {
  state: AccountSyncState
  /** True when the local journal must NOT be merged into the incoming one. */
  discardLocal: boolean
} {
  // The last account known to own this journal: whatever is live in memory,
  // else whatever survived the last reload.
  const previousOwner = prev.userId ?? remembered
  const switched = previousOwner !== null && nextUserId !== null && previousOwner !== nextUserId
  return {
    state: { userId: nextUserId, verified: false, unusable: false },
    discardLocal: switched,
  }
}

/**
 * Classify a finished pull.
 *
 * Three outcomes and only two verdicts, because the distinction that matters is
 * not "did we get data" but **"do we know what is in that row"**. An absent row
 * and a row we read are both known, and both allow a push. Anything else — a
 * network failure, a row in a shape this build does not understand — is the
 * same verdict: do not write.
 *
 * `unreadable` must never be collapsed into `empty` by a caller's `catch`. They
 * are one keystroke apart and one of them destroys a journal.
 */
export function afterPull(
  s: AccountSyncState,
  result: { row: 'empty' } | { row: 'read' } | { row: 'unreadable' },
): AccountSyncState {
  if (result.row === 'unreadable') return { ...s, verified: false, unusable: true }
  return { ...s, verified: true, unusable: false }
}

/** A journal that is the seeded demo must never reach a real account. */
export function isDemo(d: JournalData): boolean {
  return !!d.settings.demoSeeded || !!d.settings.explore
}

/**
 * The message for an unusable row, which has to say what actually happened.
 *
 * Two jobs, and the second is the load-bearing one. It names the state — the
 * row could not be read — and then it says **nothing has been overwritten**,
 * because the reasonable fear on seeing a sync error is that the error *was*
 * the data being lost. Here the error is precisely the opposite: the refusal
 * to write is what kept the row intact.
 */
export const UNUSABLE_MESSAGE =
  "This account's journal could not be read, so nothing has been overwritten. " +
  'That is deliberate — a row this app cannot read is a row it must not write over. ' +
  'Your entries on this device are untouched.'
