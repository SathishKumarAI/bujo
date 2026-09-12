import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { externalizeImages } from './imageStore'
import type { JournalData } from './types'

/**
 * What is left of the Supabase backend: **a read path for a retired feature.**
 *
 * bujo had accounts — email/password and Google, across three copies of the
 * same form — and they were removed on 2026-09-11. `docs/AUTH.md` records why:
 * an email address is a liability with no matching benefit in a local-first
 * app, the passphrase in `bujocloud.ts` already syncs across devices without
 * anyone learning who you are, and the login screen was the first thing a new
 * user saw on a product that had explicitly chosen not to be that.
 *
 * This file keeps exactly three functions, for exactly one purpose: someone
 * whose session token is still in `localStorage` has a journal row that is
 * otherwise now unreachable, and `lib/legacyAccount.ts` offers to bring it
 * across, once, before signing them out. Nothing else imports this.
 *
 * **Delete this file, and its dependency, once that migration has had long
 * enough to run.** Keeping a write path for a feature that no longer exists is
 * how a system ends up with two sources of truth; this one is read-and-close
 * only, which is why it is safe to leave for now and not safe to leave
 * forever. Anyone already signed out before the change cannot be helped from
 * inside the app — that is documented rather than pretended away.
 *
 * Everything that used to live here — `signInGuest`, `signUpEmail`,
 * `signInEmail`, `signInGoogle`, `resetPassword`, `updatePassword`,
 * `onPasswordRecovery`, `onAuthChange`, `subscribeJournal`, `pushJournal`,
 * `providerEnabled` — was deleted in the same change as its last caller, not
 * left behind commented out. An export nobody imports is not a build error,
 * which is exactly how a dead module survives a green pipeline.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  URL && ANON ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const supabaseEnabled = () => supabase != null

/** The signed-in user, or null when there is no session (or no backend). */
export async function currentUser(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

/**
 * Load this user's journal row, or null if none was ever saved.
 *
 * Throws on a real failure rather than returning null, so the migration can
 * tell "there was nothing there" from "we could not reach it" — the second one
 * must be retried, and treating it as the first would silently drop a journal.
 */
export async function pullJournal(): Promise<JournalData | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('journals').select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  if (!data?.data) return null
  return externalizeImages(data.data as JournalData)
}

/** End the session. There is no way to start a new one. */
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
