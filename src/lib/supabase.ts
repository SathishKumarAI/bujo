import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { JournalData } from './types'

// Optional Supabase backend: real login (guest/anonymous + email) and per-user
// storage. Disabled (null client) until VITE_SUPABASE_URL/ANON_KEY are set, so
// the local-first app works exactly as before with no backend.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  URL && ANON ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const supabaseEnabled = () => supabase != null

function client(): SupabaseClient {
  if (!supabase) throw new Error('Cloud account is not configured.')
  return supabase
}

/** Sign in as an anonymous guest (no email) — the default "just start" path. */
export async function signInGuest(): Promise<User | null> {
  const { data, error } = await client().auth.signInAnonymously()
  if (error) throw error
  return data.user
}

/** Upgrade a guest (or create an account) with email + password. */
export async function signUpEmail(email: string, password: string): Promise<void> {
  const sb = client()
  // If already a guest, attach the email to keep their data (account linking).
  const { data: sess } = await sb.auth.getSession()
  if (sess.session?.user?.is_anonymous) {
    const { error } = await sb.auth.updateUser({ email, password })
    if (error) throw error
    return
  }
  const { error } = await sb.auth.signUp({ email, password })
  if (error) throw error
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await client().auth.signOut()
}

export async function currentUser(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

/** Load this user's journal row, or null if none saved yet. */
export async function pullJournal(): Promise<JournalData | null> {
  const sb = client()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data, error } = await sb.from('journals').select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return (data?.data as JournalData) ?? null
}

/** Upsert this user's journal row (RLS restricts it to their own id). */
export async function pushJournal(journal: JournalData): Promise<void> {
  const sb = client()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not signed in.')
  const { error } = await sb.from('journals').upsert({ user_id: user.id, data: journal, updated_at: new Date().toISOString() })
  if (error) throw error
}
