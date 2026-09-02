import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useJournal } from '../store'
import { migrate } from './storage'
import { authFormError, isValidEmail, passwordError } from './validate'
import {
  supabaseEnabled, providerEnabled, currentUser, onAuthChange, onPasswordRecovery,
  signInGoogle, signUpEmail, signInEmail, signInGuest, signOut,
  resetPassword, updatePassword, pullJournal, pushJournal,
} from './supabase'

export type AuthMode = 'login' | 'signup'

/**
 * The one auth flow, shared by its three hosts (Account, Welcome, Settings'
 * AccountCard). Owns the async logic and its state; hosts own their markup.
 * Exists because three hand-rolled copies drifted: only one wired password
 * recovery, and two overwrote local data on login without asking.
 */
export function useAuthForm(opts: {
  /** Asked before local data is replaced by the account copy on login/load. */
  confirmReplace: () => Promise<boolean>
  /** Runs after a successful login / signup / guest start (nav, settings). */
  onDone?: (kind: AuthMode | 'guest') => void
}) {
  const { data, replaceAll } = useJournal()
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [googleOk, setGoogleOk] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabaseEnabled()) return
    providerEnabled('google').then(setGoogleOk)
    return onAuthChange(() => { currentUser().then(setUser).catch(() => {}) })
  }, [])
  useEffect(() => onPasswordRecovery(() => setRecovery(true)), [])

  async function run(fn: () => Promise<void>, ok = '') {
    setBusy(true); setErr(''); setMsg('')
    try { await fn(); if (ok) setMsg(ok) }
    catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  function google() {
    // Redirects away to Google on success — only re-enable the form on failure.
    setBusy(true); setErr('')
    signInGoogle().catch((e) => { setErr((e as Error).message); setBusy(false) })
  }

  async function submit(mode: AuthMode) {
    const ve = authFormError(email, pw)
    if (ve) { setErr(ve); return }
    await run(async () => {
      if (mode === 'signup') {
        await signUpEmail(email, pw)
        await pushJournal(data)
        setMsg('Account created — check your inbox to confirm your email.')
      } else {
        await signInEmail(email, pw)
        const r = await pullJournal()
        // Never silently clobber this device: declining keeps local data,
        // which re-pushes on the next change.
        if (r && await opts.confirmReplace()) replaceAll(migrate(r))
        setPw('')
      }
      opts.onDone?.(mode)
    })
  }

  async function forgot() {
    if (!isValidEmail(email)) { setErr('Enter a valid email first, then tap “Forgot password”.'); return }
    await run(() => resetPassword(email), 'Password-reset link sent — check your inbox.')
  }

  async function guest() {
    await run(async () => { await signInGuest(); opts.onDone?.('guest') })
  }

  const out = () => run(() => signOut(), 'Signed out.')

  const pushNow = () => run(() => pushJournal(data), 'Saved to your account.')

  async function loadNow() {
    await run(async () => {
      const r = await pullJournal()
      if (!r) { setMsg('Nothing stored in your account yet.'); return }
      if (await opts.confirmReplace()) { replaceAll(migrate(r)); setMsg('Loaded.') }
    })
  }

  async function changePw(newPw: string): Promise<boolean> {
    const ve = passwordError(newPw)
    if (ve) { setErr(ve); return false }
    let ok = false
    await run(async () => { await updatePassword(newPw); setRecovery(false); ok = true }, 'Password updated.')
    return ok
  }

  const signedIn = !!user && !user.is_anonymous
  const isGuest = !!user?.is_anonymous

  return {
    user, signedIn, isGuest,
    email, setEmail, pw, setPw, busy, err, setErr, msg, setMsg, googleOk,
    recovery, setRecovery,
    google, submit, forgot, guest, out, pushNow, loadNow, changePw,
  }
}
