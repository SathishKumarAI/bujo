import { useEffect, useState } from 'react'
import { UserCircle2, LogOut, Mail, Lock, Eye, EyeOff, ShieldCheck, Cloud, RefreshCw, Check } from 'lucide-react'
import { useJournal } from '../store'
import { useNav } from '../components/shell/nav'
import { migrate } from '../lib/storage'
import { authFormError, isValidEmail, suggestEmailFix } from '../lib/validate'
import {
  supabaseEnabled, providerEnabled, currentUser,
  signInGoogle, signUpEmail, signInEmail, signInGuest, signOut,
  resetPassword, pullJournal, pushJournal,
} from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Dedicated, real-login-page-style account screen · a centred, branded auth
 * card (not the buried Settings form). Reached from the top-bar account menu.
 */
export function Account() {
  const { data, setSettings, replaceAll } = useJournal()
  const nav = useNav()
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [googleOk, setGoogleOk] = useState(false)

  const refresh = () => currentUser().then(setUser).catch(() => {})
  useEffect(() => { if (supabaseEnabled()) { refresh(); providerEnabled('google').then(setGoogleOk) } }, [])

  const signedIn = !!user && !user.is_anonymous
  const isGuest = !!user?.is_anonymous

  async function google() {
    setBusy(true); setErr('')
    try { await signInGoogle() } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  async function submit() {
    const ve = authFormError(email, pw)
    if (ve) { setErr(ve); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      if (mode === 'signup') {
        await signUpEmail(email, pw); await pushJournal(data)
        setMsg('Account created · check your inbox to confirm your email, then sign in.')
      } else {
        await signInEmail(email, pw)
        const r = await pullJournal(); if (r) replaceAll(migrate(r))
        setSettings({ storageMode: 'local', explore: false }); setPw(''); await refresh()
        nav('today') // signed in → lift the gate, drop into the journal
        return
      }
      setSettings({ storageMode: 'local', explore: false }); setPw(''); await refresh()
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  async function forgot() {
    if (!isValidEmail(email)) { setErr('Enter a valid email first, then tap “Forgot password”.'); return }
    setBusy(true); setErr(''); setMsg('')
    try { await resetPassword(email); setMsg('Password-reset link sent · check your inbox.') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  async function guest() {
    setBusy(true); setErr('')
    try { await signInGuest(); setSettings({ storageMode: 'local' }); await refresh(); nav('today') }
    catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  async function out() {
    setBusy(true)
    try { await signOut() } finally { await refresh(); setBusy(false) }
  }

  // ── Not configured: honest fallback ──
  if (!supabaseEnabled()) {
    return (
      <Hero>
        <div className="text-center">
          <Cloud size={30} className="mx-auto text-overlay1" />
          <h2 className="mt-3 font-display text-xl text-foreground">Accounts aren’t configured</h2>
          <p className="mt-2 text-sm text-subtext0">
            This build has no cloud backend, so the app is fully local. You can still back up and
            sync via a cloud folder, gist, or self-host in{' '}
            <button className="text-primary hover:underline" onClick={() => nav('settings')}>Settings → Data &amp; Cloud</button>.
          </p>
        </div>
      </Hero>
    )
  }

  // ── Signed-in / guest status ──
  if (signedIn || isGuest) {
    return (
      <Hero>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <UserCircle2 size={30} className={signedIn ? 'text-green' : 'text-yellow'} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-foreground">{signedIn ? user!.email : 'Guest session'}</p>
            <p className="text-xs text-overlay0">{signedIn ? 'Synced across your devices' : 'On this device · not yet synced'}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => { setBusy(true); pushJournal(data).then(() => setMsg('Saved to your account.')).catch((e) => setErr((e as Error).message)).finally(() => setBusy(false)) }}
            disabled={busy} className="press-3d inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-crust disabled:opacity-50">
            <RefreshCw size={14} /> {busy ? 'Saving…' : 'Save now'}
          </button>
          <button onClick={out} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-red disabled:opacity-50">
            <LogOut size={14} /> Sign out
          </button>
        </div>
        {isGuest && <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-subtext0">Exploring as a guest. Sign out, then create an account to keep your data safe and synced.</p>}
        {msg && <p className="mt-3 text-center text-xs text-green">{msg}</p>}
        {err && <p className="mt-3 text-center text-xs text-red">{err}</p>}
      </Hero>
    )
  }

  const fix = suggestEmailFix(email)

  // ── Signed-out: the real login page ──
  return (
    <Hero>
      {/* Segmented Sign in / Sign up control */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">
        {(['login', 'signup'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setErr(''); setMsg('') }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${mode === m ? 'bg-card text-foreground shadow-sm' : 'text-overlay1 hover:text-subtext1'}`}>
            {m === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      {googleOk && (
        <>
          <button onClick={google} disabled={busy} className="press-3d inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary disabled:opacity-50">
            <GoogleMark /> Continue with Google
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-overlay0">
            <span className="h-px flex-1 bg-border" /> or {mode === 'login' ? 'sign in' : 'sign up'} with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <div className="space-y-2.5">
        <Field icon={Mail}>
          <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="you@email.com"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-overlay0" />
        </Field>
        {fix && <button type="button" onClick={() => setEmail(fix)} className="text-xs text-yellow hover:underline">Did you mean <strong>{fix}</strong>?</button>}
        <Field icon={Lock}>
          <input type={showPw ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Password (min 6)"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-overlay0" />
          <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="text-overlay0 hover:text-subtext1">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </Field>
      </div>

      <button onClick={submit} disabled={busy} className="press-3d mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-crust disabled:opacity-50">
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      {mode === 'login' && (
        <div className="mt-3 text-center">
          <button onClick={forgot} disabled={busy} className="text-xs text-overlay1 hover:text-subtext1">Forgot password?</button>
        </div>
      )}

      {err && <p className="mt-3 text-center text-xs text-red">{err}</p>}
      {msg && <p className="mt-3 text-center text-xs text-green">{msg}</p>}

      <div className="mt-5 space-y-2 border-t border-border pt-4 text-center">
        <button onClick={guest} disabled={busy} className="inline-flex items-center gap-1.5 text-xs text-subtext0 hover:text-foreground disabled:opacity-50">
          <Check size={13} className="text-green" /> Just explore as a guest · no email needed
        </button>
        <div>
          <button onClick={() => { setSettings({ storageMode: 'local' }); nav('today') }} className="text-xs text-overlay0 hover:text-subtext1">
            Continue on this device without an account →
          </button>
        </div>
      </div>
    </Hero>
  )
}

/** Full-height, centred, branded auth shell · the "real login page" frame. */
function Hero({ children }: { children: React.ReactNode }) {
  return (
    <div className="aurora grid min-h-[calc(100vh-9rem)] place-items-center px-4 py-8">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="rise flex items-baseline justify-center gap-2">
            <span className="font-display text-4xl font-semibold tracking-tight text-foreground">bujo</span>
            <span className="text-2xl text-primary">✦</span>
          </div>
          <p className="rise mt-2 text-sm text-subtext0" style={{ animationDelay: '90ms' }}>Sign in to sync your journal everywhere.</p>
        </div>
        <div className="card-3d rise rounded-2xl border border-border bg-card/80 p-6 backdrop-blur" style={{ animationDelay: '140ms' }}>
          {children}
        </div>
        <p className="rise mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-overlay0" style={{ animationDelay: '200ms' }}>
          <ShieldCheck size={13} /> No tracking. Your data is yours.
        </p>
      </div>
    </div>
  )
}

function Field({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2.5 focus-within:border-primary">
      <Icon size={15} className="shrink-0 text-overlay1" />
      {children}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
