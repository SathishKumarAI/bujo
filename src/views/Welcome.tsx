import { useState, useEffect } from 'react'
import { CloudCog, HardDrive, FolderOpen, ShieldCheck, Check, UserCircle2, LogIn } from 'lucide-react'
import { useJournal } from '../store'
// (Welcome uses native buttons)
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { generateDemoData } from '../lib/demo'
import { isSupported, loadFromFolder, pickFolder, saveToFolder } from '../lib/fscloud'
import { supabaseEnabled, providerEnabled, signInGoogle, signUpEmail, signInEmail, resetPassword, pullJournal, pushJournal } from '../lib/supabase'
import { authFormError, isValidEmail } from '../lib/validate'

/**
 * First-run gate. The app is local-first; here the user chooses where their
 * journal lives: a cloud-synced folder they own (File System Access API) or
 * this device only. No accounts, no servers.
 */
export function Welcome() {
  const { data, setSettings, replaceAll } = useJournal()
  const [busy, setBusy] = useState(false)
  const supported = isSupported()

  async function chooseFolder() {
    setBusy(true)
    try {
      const name = await pickFolder()
      const remote = await loadFromFolder()
      if (remote) {
        if (confirm('Found an existing bujo.json in this folder. Load it? (replaces this device’s current data)')) {
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
    try { await resetPassword(email); setNotice('Password-reset link sent — check your inbox.') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="aurora grid min-h-screen place-items-center p-6">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-9 text-center">
          <div className="rise mb-3 flex items-baseline justify-center gap-2">
            <span className="font-display text-5xl font-semibold tracking-tight text-text">bujo</span>
            <span className="text-2xl text-mauve">✦</span>
          </div>
          <p className="rise text-subtext0" style={{ animationDelay: '90ms' }}>A private bullet journal. Sign in to sync everywhere, or stay on this device.</p>
        </div>

        {/* Account — recommended when configured: guest now, or log in to sync. */}
        {supabaseEnabled() && (
          <div className="rise mb-5 rounded-2xl border border-surface0 bg-mantle/80 p-5 backdrop-blur" style={{ animationDelay: '120ms' }}>
            <div className="mb-3 flex items-center gap-2">
              <UserCircle2 size={22} style={{ color: cat('mauve') }} />
              <h2 className="font-display text-xl text-text">Sync with an account</h2>
            </div>
            {!showLogin ? (
              <div className="flex flex-wrap items-center gap-3">
                {googleOk && (
                  <button onClick={google} disabled={busy} className="press-3d inline-flex items-center gap-2 rounded-lg bg-mauve px-4 py-2 text-sm font-medium text-crust disabled:opacity-50">{busy ? 'Starting…' : 'Continue with Google'}</button>
                )}
                <button onClick={() => { setShowLogin(true); setErr('') }} className={`inline-flex items-center gap-1.5 text-sm ${googleOk ? 'text-mauve hover:underline' : 'press-3d rounded-lg bg-mauve px-4 py-2 font-medium text-crust'}`}><LogIn size={14} /> {googleOk ? 'Use email' : 'Sign in with email'}</button>
                <span className="text-xs text-overlay0">Sign in to create your journal and sync it across devices.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text" />
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (min 6)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text" />
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => account('login')} disabled={busy} className="press-3d rounded-lg bg-mauve px-4 py-2 text-sm font-medium text-crust disabled:opacity-50">Log in</button>
                  <button onClick={() => account('signup')} disabled={busy} className="rounded-lg border border-surface1 px-4 py-2 text-sm text-subtext1">Sign up</button>
                  <button onClick={forgot} disabled={busy} className="ml-auto text-xs text-overlay1 hover:text-subtext1">Forgot password?</button>
                  <button onClick={() => setShowLogin(false)} className="px-2 py-2 text-sm text-overlay0">Back</button>
                </div>
              </div>
            )}
            {notice && <p className="mt-2 text-xs text-green">{notice}</p>}
            {err && <p className="mt-2 text-xs text-red">{err}</p>}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Own cloud — pick a folder */}
          <button
            onClick={chooseFolder}
            disabled={!supported || busy}
            className="card-3d rise group rounded-2xl border border-surface0 bg-mantle/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve disabled:opacity-50"
            style={{ animationDelay: '180ms' }}
          >
            <CloudCog size={28} style={{ color: cat('mauve') }} />
            <h2 className="mt-3 font-display text-xl text-text">Use my own cloud</h2>
            <p className="mt-1 text-sm text-subtext0">
              Point bujo at a folder inside your Drive / Dropbox / OneDrive sync
              folder. Your existing cloud syncs it across devices.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-overlay1">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> No account, no sign-in</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Works with any cloud you already use</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Your files, your control</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-mauve">
              <FolderOpen size={15} /> {busy ? 'Opening…' : 'Choose folder'}
            </span>
            {!supported && <p className="mt-2 text-xs text-red">Needs Chrome / Edge. Use “this device” instead.</p>}
          </button>

          {/* Local only */}
          <button
            onClick={() => setSettings({ storageMode: 'local' })}
            className="card-3d rise group rounded-2xl border border-surface0 bg-mantle/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve"
            style={{ animationDelay: '260ms' }}
          >
            <HardDrive size={28} style={{ color: cat('blue') }} />
            <h2 className="mt-3 font-display text-xl text-text">This device only</h2>
            <p className="mt-1 text-sm text-subtext0">
              Keep everything in this browser. Nothing leaves the device. You can
              connect a cloud folder later in Settings.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-overlay1">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Fastest, fully offline</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Export backups anytime</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue">Continue on this device →</span>
          </button>
        </div>

        {/* Try & learn — seed a sample month so new users explore + learn by doing. */}
        <div className="rise mt-5 rounded-xl border border-dashed border-surface1 p-4 text-center" style={{ animationDelay: '320ms' }}>
          <p className="mb-2 text-sm text-subtext1">Just looking? <strong className="text-text">Explore with sample data</strong> — see every feature, no account. Sign up when you’re ready to keep your own journal.</p>
          <button
            onClick={() => { replaceAll(generateDemoData()); setSettings({ storageMode: 'local', explore: true }) }}
            className="press-3d rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-text hover:text-mauve"
          >
            Explore the demo →
          </button>
          <p className="mt-2 text-xs text-overlay0">
            Learn as you go: press <kbd className="rounded bg-surface0 px-1">⌘K</kbd> to jump anywhere, tap the <strong>?</strong> on any page, or open <strong>Help</strong>.
            <br />Changed your mind? Reset or wipe the sample anytime in <strong>Settings → Data &amp; Cloud</strong>.
          </p>
        </div>

        <p className="rise mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-overlay0" style={{ animationDelay: '360ms' }}>
          <ShieldCheck size={13} /> No servers, no tracking. Your data is yours.
        </p>
      </div>
    </div>
  )
}
