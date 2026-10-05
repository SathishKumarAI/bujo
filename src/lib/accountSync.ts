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
 * intact and merely unreadable by this device.** A wrong passphrase, a second
 * device with a different passphrase, and a just-switched account all look
 * identical from inside a push — "I have local data, the remote is not usable,
 * therefore mine must be the good copy" — and all three of them are wrong.
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
  /** Set when the row exists but this device's passphrase does not open it. */
  mismatch: boolean
}

export const initialState: AccountSyncState = { userId: null, verified: false, mismatch: false }

/**
 * May this device write the journal to the account row?
 *
 * Deliberately conservative: every unknown answers "no". Refusing to push
 * stalls a sync until the next change, which is recoverable; pushing over a
 * journal you could not read is not.
 */
export function mayPush(s: AccountSyncState, opts: { hasPassphrase: boolean; isDemo: boolean }): boolean {
  if (!s.userId) return false // not signed in
  if (!opts.hasPassphrase) return false // nothing to encrypt with
  if (opts.isDemo) return false // never push sample data into a real account
  if (s.mismatch) return false // the row is someone's, and not readable here
  return s.verified
}

/**
 * What a sign-in or account switch means for the journal already in memory.
 *
 * The case this exists for is COD-135, which shipped: switching accounts
 * merged the previous user's journal into the new one. The merge machinery is
 * right for "the same person on two devices" and catastrophically wrong for
 * "two people on one device" — it cannot tell them apart, so the caller has to.
 */
export function onAccountChange(prev: AccountSyncState, nextUserId: string | null): {
  state: AccountSyncState
  /** True when the local journal must NOT be merged into the incoming one. */
  discardLocal: boolean
} {
  const switched = prev.userId !== null && nextUserId !== null && prev.userId !== nextUserId
  return {
    state: { userId: nextUserId, verified: false, mismatch: false },
    discardLocal: switched,
  }
}

/**
 * Classify a failed pull.
 *
 * `decryptString` throws the same way for "wrong passphrase" and "this row was
 * written by a different passphrase", because they are the same event seen from
 * two sides. What matters is that neither may be read as "the remote is
 * broken, overwrite it" — so both produce `mismatch`, and only a genuinely
 * absent row produces a pushable state.
 */
export function afterPull(
  s: AccountSyncState,
  result: { row: 'empty' } | { row: 'read' } | { row: 'unreadable' },
): AccountSyncState {
  if (result.row === 'unreadable') return { ...s, verified: false, mismatch: true }
  return { ...s, verified: true, mismatch: false }
}

/** A journal that is the seeded demo must never reach a real account. */
export function isDemo(d: JournalData): boolean {
  return !!d.settings.demoSeeded || !!d.settings.explore
}

/**
 * The message for a mismatch, which has to say what actually happened.
 *
 * "Wrong passphrase" is a guess about the user; "this account's journal was
 * encrypted with a different passphrase" is a statement about the data, and it
 * is the one that tells someone with two devices what to do next.
 */
export const MISMATCH_MESSAGE =
  "This account's journal was encrypted with a different passphrase, so it cannot be opened here. " +
  'Enter the passphrase you used on your other device. Nothing has been overwritten.'
