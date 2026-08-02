import { useState, useEffect } from 'react'
import { CloudCog, HardDrive, FolderOpen, ShieldCheck, Check, UserCircle2, LogIn } from 'lucide-react'
import { useJournal } from '../store'
// (the three choice cards below stay native buttons — card-shaped click targets)
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { generateDemoData } from '../lib/demo'
import { isSupported, loadFromFolder, pickFolder, saveToFolder } from '../lib/fscloud'
import { supabaseEnabled, providerEnabled, signInGoogle, signUpEmail, signInEmail, resetPassword, pullJournal, pushJournal } from '../lib/supabase'
import { authFormError, isValidEmail } from '../lib/validate'
import { useConfirm } from '../components/ConfirmDialog'

/**
 * First-run gate. The app is local-first; here the user chooses where their
 * journal lives: a cloud-synced folder they own (File System Access API) or
 * this device only. No accounts, no servers.
 */
export function Welcome() {
  const { data, setSettings, replaceAll } = useJournal()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const supported = isSupported()

  async function chooseFolder() {
    setBusy(true)
    try {
      const name = await pickFolder()
      const remote = await loadFromFolder()
      if (remote) {
        if (await confirm({
          title: 'Load the journal already in this folder?',
          description: 'This folder has an existing bujo.json. Loading it replaces the data currently on this device.',
          confirmLabel: 'Load it', destructive: true,
        })) {
          replaceAll(migrate(remote))
        } else {
          await saveToFolder(data)
        }
      } else {
        await saveToFolder(data) // seed the folder
      }
      setSettings({ storageMode: 'folder', folderName: name })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') alert('Could not use that folder: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // ── Account onboarding (when Supabase is configured) ──
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  // Only offer Google once we've confirmed the provider is enabled on Supabase —
  // otherwise the OAuth redirect dead-ends on a raw "provider not enabled" error.
  const [googleOk, setGoogleOk] = useState(false)
  useEffect(() => { providerEnabled('google').then(setGoogleOk) }, [])
  async function google() {
    setBusy(true); setErr('')
    try { await signInGoogle() } // redirects out to Google, returns to the app signed in
    catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  async function account(mode: 'signup' | 'login') {
    const ve = authFormError(email, pw)
    if (ve) { setErr(ve); return }
    setBusy(true); setErr(''); setNotice('')
    try {
      if (mode === 'signup') { await signUpEmail(email, pw); await pushJournal(data); setNotice('Account created. Check your email if a confirmation link was sent.') }
      else { await signInEmail(email, pw); const r = await pullJournal(); if (r) replaceAll(migrate(r)) }
      setSettings({ storageMode: 'local' })
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  async function forgot() {
    if (!isValidEmail(email)) { setErr('Enter a valid email above, then tap “Forgot password”.'); return }
    setBusy(true); setErr(''); setNotice('')
    try { await resetPassword(email); setNotice('Password-reset link sent, check your inbox.') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="aurora grid min-h-screen place-items-center p-6">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-9 text-center">
          <div className="rise mb-3 flex items-baseline justify-center gap-2">
            <span className="font-display text-display font-medium tracking-tight text-fg-1">bujo</span>
            <span className="text-title text-mauve">✦</span>
          </div>
          <p className="rise text-fg-2" style={{ animationDelay: '90ms' }}>A private bullet journal. Sign in to sync across your devices, or keep everything on this one.</p>
        </div>

        {/* Account · recommended when configured: guest now, or log in to sync. */}
        {supabaseEnabled() && (
          <div className="rise mb-5 rounded-2xl border border-line bg-ink-1/80 p-5 backdrop-blur" style={{ animationDelay: '120ms' }}>
            <div className="mb-3 flex items-center gap-2">
              <UserCircle2 size={22} style={{ color: cat('mauve') }} />
              <h2 className="font-display text-title text-fg-1">Sync with an account</h2>
            </div>
            {!showLogin ? (
              <div className="flex flex-wrap items-center gap-3">
                {googleOk && (
                  <Button onClick={google} disabled={busy} variant="default" className="press-3d gap-2">{busy ? 'Starting…' : 'Continue with Google'}</Button>
                )}
                {googleOk ? (
                  <button onClick={() => { setShowLogin(true); setErr('') }} className="inline-flex items-center gap-1.5 text-body text-mauve hover:underline"><LogIn size={14} /> Use email</button>
                ) : (
                  <Button onClick={() => { setShowLogin(true); setErr('') }} variant="default" className="press-3d gap-1.5"><LogIn size={14} /> Sign in with email</Button>
                )}
                <span className="text-label text-fg-2">Signing in creates your journal and keeps it in sync across devices.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-fg-1" />
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (min 6)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-fg-1" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => account('login')} disabled={busy} variant="default" className="press-3d">Log in</Button>
                  <Button onClick={() => account('signup')} disabled={busy} variant="outline" className="text-fg-1">Sign up</Button>
                  <button onClick={forgot} disabled={busy} className="ml-auto text-label text-fg-2 hover:text-fg-1">Forgot password?</button>
                  <button onClick={() => setShowLogin(false)} className="px-2 py-2 text-body text-fg-2">Back</button>
                </div>
              </div>
            )}
            {notice && <p className="mt-2 text-label text-green">{notice}</p>}
            {err && <p className="mt-2 text-label text-red">{err}</p>}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Own cloud · pick a folder */}
          <button
            onClick={chooseFolder}
            disabled={!supported || busy}
            className="card-3d rise group rounded-2xl border border-line bg-ink-1/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve disabled:opacity-50"
            style={{ animationDelay: '180ms' }}
          >
            <CloudCog size={28} style={{ color: cat('mauve') }} />
            <h2 className="mt-3 font-display text-title text-fg-1">Use my own cloud</h2>
            <p className="mt-1 text-body text-fg-2">
              Point bujo at a folder inside your Drive / Dropbox / OneDrive sync
              folder. Your existing cloud syncs it across devices.
            </p>
            <ul className="mt-3 space-y-1 text-label text-fg-2">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> No account, no sign-in</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Works with any cloud you already use</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Your files, your control</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-body font-medium text-mauve">
              <FolderOpen size={15} /> {busy ? 'Opening…' : 'Choose folder'}
            </span>
            {!supported && <p className="mt-2 text-label text-red">Requires Chrome or Edge. Choose “This device only” instead.</p>}
          </button>

          {/* Local only */}
          <button
            onClick={() => setSettings({ storageMode: 'local' })}
            className="card-3d rise group rounded-2xl border border-line bg-ink-1/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve"
            style={{ animationDelay: '260ms' }}
          >
            <HardDrive size={28} style={{ color: cat('blue') }} />
            <h2 className="mt-3 font-display text-title text-fg-1">This device only</h2>
            <p className="mt-1 text-body text-fg-2">
              Keep everything in this browser. Nothing leaves the device. You can
              connect a cloud folder later in Settings.
            </p>
            <ul className="mt-3 space-y-1 text-label text-fg-2">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Fastest, fully offline</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Export backups anytime</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-body font-medium text-blue">Continue on this device →</span>
          </button>
        </div>

        {/* Try & learn · seed a sample month so new users explore + learn by doing. */}
        <div className="rise mt-5 rounded-xl border border-dashed border-line-strong p-4 text-center" style={{ animationDelay: '320ms' }}>
          <p className="mb-2 text-body text-fg-1">Just looking? <strong className="text-fg-1">Explore with sample data</strong> · see every feature, no account. Sign up when you’re ready to keep your own journal.</p>
          <Button
            onClick={() => { replaceAll(generateDemoData()); setSettings({ storageMode: 'local', explore: true }) }}
            variant="secondary"
            className="press-3d hover:text-mauve"
          >
            Explore the demo →
          </Button>
          <p className="mt-2 text-label text-fg-2">
            Learn as you go: press <kbd className="rounded bg-ink-2 px-1">⌘K</kbd> to jump anywhere, tap the <strong>?</strong> on any page, or open <strong>Help</strong>.
            <br />Changed your mind? Reset or wipe the sample anytime in <strong>Settings → Data &amp; Cloud</strong>.
          </p>
        </div>

        <p className="rise mt-6 flex items-center justify-center gap-1.5 text-center text-label text-fg-2" style={{ animationDelay: '360ms' }}>
          <ShieldCheck size={13} /> No tracking. Your data stays yours.
        </p>
      </div>
    </div>
  )
}
