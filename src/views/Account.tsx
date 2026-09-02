import { ArrowsClockwise, Check, Cloud, Envelope, Eye, EyeSlash, Lock, ShieldCheck, SignOut, UserCircle } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Button } from '../components/ui/button'
import { useNav } from '../components/shell/nav'
import { useConfirm } from '../components/ConfirmDialog'
import { suggestEmailFix } from '../lib/validate'
import { useAuthForm } from '../lib/useAuthForm'
import { supabaseEnabled } from '../lib/supabase'

/**
 * Dedicated, real-login-page-style account screen · a centred, branded auth
 * card (not the buried Settings form). Reached from the top-bar account menu.
 * All auth logic lives in useAuthForm — this file owns only the page markup.
 */
export function Account() {
  const { setSettings } = useJournal()
  const nav = useNav()
  const confirm = useConfirm()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPw, setShowPw] = useState(false)
  const [changing, setChanging] = useState(false)
  const [newPw, setNewPw] = useState('')

  const auth = useAuthForm({
    confirmReplace: () => confirm({
      title: 'Load your account data onto this device?',
      description: 'This replaces what is currently on this device with the copy stored in your account.',
      confirmLabel: 'Load account copy', destructive: true,
    }),
    onDone: (kind) => {
      setSettings(kind === 'guest' ? { storageMode: 'local' } : { storageMode: 'local', explore: false })
      if (kind !== 'signup') nav('today') // signed in → lift the gate, drop into the journal
    },
  })
  const { email, setEmail, pw, setPw, busy, err, msg, googleOk, signedIn, isGuest, user } = auth

  // A recovery link signs the user in with a temporary session — derive the
  // form open so the link actually lands somewhere visible (no mirror state).
  const changeOpen = changing || auth.recovery

  async function changePw() {
    if (await auth.changePw(newPw)) { setNewPw(''); setChanging(false) }
  }

  // ── Not configured: honest fallback ──
  if (!supabaseEnabled()) {
    return (
      <Hero>
        <div className="text-center">
          <AppIcon as={Cloud} size="lg" className="mx-auto text-fg-2" />
          <h2 className="mt-3 font-display text-title text-foreground">Accounts aren’t configured</h2>
          <p className="mt-2 text-body text-fg-2">
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
          <div className="grid h-12 w-12 place-items-center rounded-none bg-secondary">
            <AppIcon as={UserCircle} size="lg" className={signedIn ? 'text-green' : 'text-yellow'} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-heading text-foreground">{signedIn ? user!.email : 'Guest session'}</p>
            <p className="text-label text-fg-2">{signedIn ? 'Synced across your devices' : 'On this device · not yet synced'}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={auth.pushNow} disabled={busy} variant="primary" className="press-3d flex-1 gap-1.5">
            <AppIcon as={ArrowsClockwise} size="sm" /> {busy ? 'Saving…' : 'Save now'}
          </Button>
          <Button onClick={auth.out} disabled={busy} variant="secondary" className="gap-1.5 text-red hover:text-red">
            <AppIcon as={SignOut} size="sm" /> Sign out
          </Button>
        </div>
        {signedIn && (
          <div className="mt-4 border-t border-line pt-4">
            {!changeOpen ? (
              <button onClick={() => { setChanging(true); auth.setErr(''); auth.setMsg('') }} className="text-label text-fg-2 hover:text-fg-1">Change password</button>
            ) : (
              <div className="space-y-2.5">
                <Field icon={Lock}>
                  <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={newPw} onChange={(e) => { setNewPw(e.target.value); auth.setErr('') }}
                    onKeyDown={(e) => e.key === 'Enter' && changePw()} placeholder="New password (min 6)"
                    className="w-full bg-transparent text-body text-foreground outline-none placeholder:text-fg-2" />
                  <Button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} variant="ghost" size="icon-sm" className="text-fg-2 hover:text-fg-1">
                    {showPw ? <AppIcon as={EyeSlash} size="sm" /> : <AppIcon as={Eye} size="sm" />}
                  </Button>
                </Field>
                <div className="flex gap-2">
                  <Button onClick={changePw} disabled={busy} variant="primary" size="sm" className="press-3d flex-1">
                    {busy ? 'Updating…' : 'Update password'}
                  </Button>
                  <Button onClick={() => { setChanging(false); auth.setRecovery(false); setNewPw(''); auth.setErr('') }} disabled={busy} variant="secondary" size="sm" className="text-fg-2">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}
        {isGuest && <p className="mt-4 rounded-none bg-secondary/50 p-3 text-label text-fg-2">Exploring as a guest. Sign out, then create an account to keep your data safe and synced.</p>}
        {msg && <p className="mt-3 text-center text-label text-green">{msg}</p>}
        {err && <p className="mt-3 text-center text-label text-red">{err}</p>}
      </Hero>
    )
  }

  const fix = suggestEmailFix(email)

  // ── Signed-out: the real login page ──
  return (
    <Hero>
      {/* Segmented Sign in / Sign up control */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-none bg-secondary/60 p-1">
        {(['login', 'signup'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); auth.setErr(''); auth.setMsg('') }}
            className={`rounded-none py-2 text-body font-medium transition-colors ${mode === m ? 'bg-card text-foreground shadow-sm' : 'text-fg-2 hover:text-fg-1'}`}>
            {m === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      {googleOk && (
        <>
          <Button onClick={auth.google} disabled={busy} variant="secondary" className="press-3d w-full gap-2 hover:border-primary">
            <GoogleMark /> Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-label text-fg-2">
            <span className="h-px flex-1 bg-border" /> or {mode === 'login' ? 'sign in' : 'sign up'} with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <div className="space-y-2.5">
        <Field icon={Envelope}>
          <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); auth.setErr('') }} placeholder="you@email.com"
            className="w-full bg-transparent text-body text-foreground outline-none placeholder:text-fg-2" />
        </Field>
        {fix && <button type="button" onClick={() => setEmail(fix)} className="text-label text-yellow hover:underline">Did you mean <strong>{fix}</strong>?</button>}
        <Field icon={Lock}>
          <input type={showPw ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && auth.submit(mode)} placeholder="Password (min 6)"
            className="w-full bg-transparent text-body text-foreground outline-none placeholder:text-fg-2" />
          <Button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} variant="ghost" size="icon-sm" className="text-fg-2 hover:text-fg-1">
            {showPw ? <AppIcon as={EyeSlash} size="sm" /> : <AppIcon as={Eye} size="sm" />}
          </Button>
        </Field>
      </div>

      <Button onClick={() => auth.submit(mode)} disabled={busy} variant="primary" className="press-3d mt-4 w-full gap-1.5">
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>

      {mode === 'login' && (
        <div className="mt-3 text-center">
          <button onClick={auth.forgot} disabled={busy} className="text-label text-fg-2 hover:text-fg-1">Forgot password?</button>
        </div>
      )}

      {err && <p className="mt-3 text-center text-label text-red">{err}</p>}
      {msg && <p className="mt-3 text-center text-label text-green">{msg}</p>}

      <div className="mt-5 space-y-2 border-t border-line pt-4 text-center">
        <button onClick={auth.guest} disabled={busy} className="inline-flex items-center gap-1.5 text-label text-fg-2 hover:text-foreground disabled:opacity-50">
          <AppIcon as={Check} size="sm" className="text-green" /> Just explore as a guest · no email needed
        </button>
        <div>
          <button onClick={() => { setSettings({ storageMode: 'local' }); nav('today') }} className="text-label text-fg-2 hover:text-fg-1">
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
            <span className="font-display text-display font-medium tracking-tight text-foreground">bujo</span>
            <span className="text-title text-primary">✦</span>
          </div>
          <p className="rise mt-2 text-body text-fg-2" style={{ animationDelay: '90ms' }}>Sign in to sync your journal everywhere.</p>
        </div>
        <div className="card-3d rise rounded-none border border-line bg-card/80 p-6 backdrop-blur" style={{ animationDelay: '140ms' }}>
          {children}
        </div>
        <p className="rise mt-5 flex items-center justify-center gap-1.5 text-center text-label text-fg-2" style={{ animationDelay: '200ms' }}>
          <AppIcon as={ShieldCheck} size="sm" /> No tracking. Your data is yours.
        </p>
      </div>
    </div>
  )
}

function Field({ icon: Icon, children }: { icon: typeof Envelope; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-none border border-input bg-background px-3 py-2.5 focus-within:border-primary">
      <AppIcon as={Icon} size="sm" className="shrink-0 text-fg-2" />
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
