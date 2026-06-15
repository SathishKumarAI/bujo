import type { JournalData } from './types'

/**
 * Decide whether an incoming cloud snapshot should replace the local journal.
 *
 * Silent in the common case: the remote is newer (expected multi-device sync) or
 * neither side is stamped (legacy data). Prompts ONLY on a real conflict — this
 * device holds edits *newer* than the cloud copy, so blindly applying the remote
 * would clobber unsynced local work (the "last-write-wins" footgun).
 *
 * Returns the data to adopt, or `null` to keep the local journal untouched.
 * `confirm` is injectable so the logic is unit-testable without a DOM.
 */
export function resolveIncoming(
  local: JournalData,
  remote: JournalData,
  ask: (msg: string) => boolean = (m) => (typeof confirm === 'function' ? confirm(m) : true),
): JournalData | null {
  const l = local.updatedAt
  const r = remote.updatedAt
  // Local has unsynced edits newer than the cloud copy → ask before overwriting.
  if (l && (!r || l > r)) {
    const useCloud = ask(
      'Sync conflict: this device has changes newer than the cloud copy.\n\n' +
        'OK = replace this device with the cloud version\n' +
        'Cancel = keep this device’s changes (they sync up on the next change)',
    )
    return useCloud ? remote : null
  }
  return remote
}
