import { supabaseEnabled, currentUser, pullJournal, signOut } from './supabase'
import { migrate } from './storage'
import { resolveIncoming } from './conflict'
import type { JournalData } from './types'

/**
 * One-time rescue for journals left behind in a Supabase account.
 *
 * Accounts were removed on 2026-09-11 (`docs/AUTH.md`). Removing the sign-in UI
 * does not touch the `journals` table — the row is still there, and anyone whose
 * session token is still in `localStorage` is one `pullJournal()` away from it.
 * Anyone already signed out is not, and cannot be helped from inside the app;
 * that loss is documented rather than pretended away.
 *
 * **Deliberately a boot check and not a Settings route.** A hidden "restore my
 * old account" page would be a second, permanent auth surface that someone has
 * to remember exists and keep testing — the half-migrated-behind-a-flag state
 * the house rules warn about. This runs once and retires itself.
 *
 * Three properties it has to have, each of which has a way of going wrong:
 *
 * - **Idempotent.** Gated on `settings.legacyAccountChecked`, so reloading
 *   mid-flow cannot re-prompt or double-merge.
 * - **Never a silent replace.** The remote goes through {@link resolveIncoming},
 *   the same union-and-ask path every other sync uses. A raw `replaceAll` here
 *   would drop everything this device has that the account never saw.
 * - **Fails loud, and does not mark itself done.** If the pull throws (offline,
 *   expired token, RLS), the flag stays unset so the next boot tries again.
 *   Swallowing the error and setting the flag would be exactly the silent data
 *   loss this function exists to prevent.
 */
export type LegacyAccountFound = {
  email: string
  /**
   * Pull the account copy, merge it into `local`, then sign the session out.
   * Takes the journal rather than closing over one: on a slow network the
   * user keeps typing, and the merge must use what is on screen now.
   */
  adopt: (local: JournalData) => Promise<JournalData | null>
  /** Sign out without taking the data. */
  dismiss: () => Promise<void>
}

/**
 * Returns the leftover account if there is one to rescue, else `null`.
 *
 * `null` covers every uninteresting case — no backend configured, no session,
 * already handled — so the caller has one branch, not five.
 */
export async function findLegacyAccount(alreadyChecked: boolean): Promise<LegacyAccountFound | null> {
  if (alreadyChecked || !supabaseEnabled()) return null
  let user: Awaited<ReturnType<typeof currentUser>>
  try {
    user = await currentUser()
  } catch {
    return null // no session, or the project is gone. Nothing to rescue.
  }
  if (!user || user.is_anonymous) {
    // A guest session is not an account and holds nothing worth migrating, but
    // it is still a live session — close it so the client stops refreshing it.
    if (user) await signOut().catch(() => {})
    return null
  }

  return {
    email: user.email ?? 'your old account',
    async adopt(local: JournalData) {
      // Throws on failure, deliberately — the caller must not mark the
      // migration done for a pull that did not happen.
      const remote = await pullJournal()
      // `() => true` is the conflict answer, not a shortcut: the user has
      // already said yes to taking the account copy, and `resolveIncoming`
      // unions local-only items in either case, so nothing here is dropped.
      const merged = remote ? await resolveIncoming(local, migrate(remote), () => true) : null
      await signOut().catch(() => {})
      return merged
    },
    async dismiss() {
      await signOut().catch(() => {})
    },
  }
}
