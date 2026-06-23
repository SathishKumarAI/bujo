import { useRef, useState, useEffect } from 'react'
import { Download, Upload, FileText, Sparkles, Trash2, AlertTriangle, SlidersHorizontal, UserRound, Palette, Bell, Database } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Input, Segmented, StatTile } from '../components/ui'
import { cat } from '../lib/colors'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Page } from '../components/shell/Page'
import { DriveSync } from '../components/DriveSync'
import { CloudStorage } from '../components/CloudStorage'
import { emptyJournal, exportJSON, exportMarkdown, importJSON, migrate } from '../lib/storage'
import { pushJournalToServer, pullJournalFromServer, serverConfigured } from '../lib/serverSync'
import { pushCloud, pullCloud } from '../lib/bujocloud'
import { supabaseEnabled, currentUser, signInGuest, signUpEmail, signInEmail, signOut, pullJournal, pushJournal, resetPassword, updatePassword, onPasswordRecovery } from '../lib/supabase'
import { generateDemoData } from '../lib/demo'
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv, parseMetricsCsv } from '../lib/csv'
import { inlineImages } from '../lib/imageStore'
import { todayISO } from '../lib/date'
import type { Gender } from '../lib/types'

function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Settings() {
  const { data, setSettings, replaceAll, setMetric } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  function onMetricsCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseMetricsCsv(String(reader.result))
      rows.forEach((r) => setMetric(r.date, r.patch))
      alert(`Imported metrics for ${rows.length} day${rows.length === 1 ? '' : 's'}.`)
    }
    reader.readAsText(file)
    if (csvRef.current) csvRef.current.value = ''
  }
  const s = data.settings

  function setGender(gender: Gender) {
    // Auto-surface the relevant wellbeing tool, but let the user override after.
    setSettings({
      gender,
      cycleTrackerEnabled: gender === 'female' ? true : s.cycleTrackerEnabled,
      nofapEnabled: gender === 'male' ? true : s.nofapEnabled,
    })
  }

  async function doExport() {
    // Inline IndexedDB-stored photos so the backup is self-contained.
    const full = await inlineImages(data)
    download(`bujo-backup-${todayISO()}.json`, exportJSON(full))
    setSettings({ lastBackup: todayISO() })
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceAll(importJSON(String(reader.result)), { stamp: true })
        alert('Backup imported successfully.')
      } catch {
        alert('Could not read that file · is it a valid bujo backup?')
      }
    }
    reader.readAsText(file)
  }

  const tabClass = 'gap-1.5 whitespace-nowrap lg:w-full lg:justify-start lg:py-2'
  return (
    <Page>
      {/* Designed header · sets the page apart from a plain card stack. */}
      <div className="mb-6 flex items-center gap-3 border-b border-surface0 pb-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>
          <SlidersHorizontal size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-text">Settings</h1>
          <p className="text-sm text-overlay0">Profile, appearance, reminders, and your data · organised in one place.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="lg:flex lg:items-start lg:gap-6">
        {/* Sidebar rail on desktop; a scrollable row on mobile. */}
        <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary lg:sticky lg:top-4 lg:mb-0 lg:w-52 lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-1 lg:bg-transparent lg:p-0">
          <TabsTrigger value="profile" className={tabClass}><UserRound size={15} /> Profile</TabsTrigger>
          <TabsTrigger value="feel" className={tabClass}><Palette size={15} /> Journal feel</TabsTrigger>
          <TabsTrigger value="reminders" className={tabClass}><Bell size={15} /> Reminders</TabsTrigger>
          <TabsTrigger value="data" className={tabClass}><Database size={15} /> Data &amp; Cloud</TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
        <TabsContent value="profile" className="max-w-2xl">
      <Card title="Profile" subtitle="Tailors the wellbeing tools shown">
        <Row label="Gender">
          <select
            value={s.gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-text"
          >
            <option value="prefer-not">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
          </select>
        </Row>
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <Toggle label="Cycle / fertility tracker" on={s.cycleTrackerEnabled} onChange={(v) => setSettings({ cycleTrackerEnabled: v })} />
          <Toggle label="Abstinence / NoFap journal" on={s.nofapEnabled} onChange={(v) => setSettings({ nofapEnabled: v })} />
        </div>
        <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-border pt-3 sm:grid-cols-2">
          <Row label="Weight">
            <Segmented value={s.weightUnit} onChange={(v) => setSettings({ weightUnit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
          </Row>
          <Row label="Distance">
            <Segmented value={s.distanceUnit} onChange={(v) => setSettings({ distanceUnit: v })} options={[{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }]} />
          </Row>
          <Row label="Week starts">
            <Segmented value={s.weekStart ?? 0} onChange={(v) => setSettings({ weekStart: v })} options={[{ value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }]} />
          </Row>
          <Row label="Temperature">
            <Segmented value={s.tempUnit} onChange={(v) => setSettings({ tempUnit: v })} options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} />
          </Row>
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="feel" className="max-w-2xl">
      <Card title="Journal feel" subtitle="Make it look & behave like real paper">
        <div className="space-y-2">
          <Toggle label="Open-book frame (spine & page edges)" on={s.bookMode} onChange={(v) => setSettings({ bookMode: v })} />
          <Toggle label="Dot-grid paper texture" on={s.paperMode} onChange={(v) => setSettings({ paperMode: v })} />
          <Toggle label="Handwriting font" on={s.handwriting} onChange={(v) => setSettings({ handwriting: v })} />
          <Toggle label="Daily reflection prompt" on={s.reflectionPrompts} onChange={(v) => setSettings({ reflectionPrompts: v })} />
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <Row label="Penalty difficulty">
            <Segmented
              value={s.penaltyLevel ?? 'beginner'}
              onChange={(v) => setSettings({ penaltyLevel: v })}
              options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Inter' }, { value: 'hard', label: 'Hard' }]}
            />
          </Row>
          <p className="mt-1 text-xs text-overlay0">Scales the training-penalty drills to a doable level.</p>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-sm text-subtext1">Today dashboard cards</p>
          <div className="space-y-2">
            {([['plan', "Today's plan"], ['habits', "Today's habits"], ['penalty', 'Training penalty'], ['onThisDay', 'On this day']] as const).map(([key, label]) => {
              const hidden = s.hideToday ?? []
              return (
                <Toggle
                  key={key}
                  label={label}
                  on={!hidden.includes(key)}
                  onChange={(v) => setSettings({ hideToday: v ? hidden.filter((k) => k !== key) : [...hidden, key] })}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-sm text-subtext1">Accent color</p>
          <div className="flex flex-wrap gap-2">
            {['mauve', 'blue', 'green', 'pink', 'peach', 'teal', 'sky', 'lavender'].map((c) => {
              const active = (s.accent ?? 'mauve') === c
              return (
                <button key={c} onClick={() => setSettings({ accent: c })} aria-label={c} title={c} className="h-7 w-7 rounded-full transition-transform hover:scale-110" style={{ background: cat(c), outline: active ? `2px solid ${cat('text')}` : 'none', outlineOffset: 2 }} />
              )
            })}
          </div>
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="reminders" className="max-w-2xl">
      <Card title="Reminders & weather" subtitle="Opt-in · weather makes network calls">
        <div className="space-y-3">
          <Toggle label="Daily journaling reminder" on={s.reminderEnabled} onChange={(v) => setSettings({ reminderEnabled: v })} />
          {s.reminderEnabled && (
            <Row label="Remind me at">
              <input
                type="time"
                value={s.reminderTime}
                onChange={(e) => setSettings({ reminderTime: e.target.value })}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-text"
              />
            </Row>
          )}
          <div className="border-t border-border pt-3">
            <Toggle label="Auto-log weather & location" on={s.weatherEnabled} onChange={(v) => setSettings({ weatherEnabled: v })} />
            <p className="mt-1 text-xs text-overlay0">Uses open-meteo + your browser location. Off = zero network calls.</p>
          </div>
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card title="Your data at a glance" subtitle="Everything stored on this device" className="mb-5">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <StatTile compact label="Entries" value={data.entries.length} color="mauve" />
              <StatTile compact label="Habits" value={data.habits.filter((h) => !h.archived).length} color="green" />
              <StatTile compact label="Workouts" value={data.workouts.length} color="peach" />
              <StatTile compact label="Memories" value={data.memories.length} color="sky" />
              <StatTile compact label="Photos" value={(data.progressPhotos?.length ?? 0) + data.memories.filter((m) => m.photo).length} color="pink" />
              <StatTile compact label="KB stored" value={Math.round((JSON.stringify(data).length / 1024))} color="teal" />
            </div>
            {(() => {
              // localStorage budget is ~5 MB; photos are the main consumer.
              const bytes = JSON.stringify(data).length
              const budget = 5 * 1024 * 1024
              const pct = Math.min(100, Math.round((bytes / budget) * 100))
              const warn = pct >= 80
              return (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-overlay0">Browser storage used</span>
                    <span style={{ color: warn ? cat('peach') : cat('subtext1') }}>{pct}% of ~5 MB</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat(warn ? 'peach' : 'green') }} />
                  </div>
                  {warn && (
                    <p className="mt-1.5 text-xs text-peach">
                      Getting full · photos use the most space. Export a backup, and remove old progress photos if needed.
                    </p>
                  )}
                </div>
              )
            })()}
          </Card>
          <div className="grid auto-rows-fr gap-5 lg:grid-cols-2">
      <Card title="Backup & data" subtitle="Back it up regularly">
        {!s.lastBackup && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-yellow/30 bg-base p-2 text-xs text-yellow">
            <AlertTriangle size={14} /> You haven't backed up yet. Browsers can clear local storage · export a copy.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={doExport} className="inline-flex items-center gap-1.5"><Download size={14} /> Export JSON</Button>
          <Button onClick={() => download(`bujo-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')} className="inline-flex items-center gap-1.5"><FileText size={14} /> Export Markdown</Button>
          <Button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        {s.lastBackup && <p className="mt-2 text-xs text-overlay0">Last backup: {s.lastBackup}</p>}
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs text-overlay0">Export a section as CSV (for spreadsheets):</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download(`bujo-entries-${todayISO()}.csv`, entriesCsv(data), 'text/csv')}>Entries</Button>
            <Button onClick={() => download(`bujo-habits-${todayISO()}.csv`, habitsCsv(data), 'text/csv')}>Habits</Button>
            <Button onClick={() => download(`bujo-metrics-${todayISO()}.csv`, metricsCsv(data), 'text/csv')}>Metrics</Button>
            <Button onClick={() => download(`bujo-workouts-${todayISO()}.csv`, workoutsCsv(data), 'text/csv')}>Workouts</Button>
          </div>
          <div className="mt-2">
            <Button onClick={() => csvRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Import metrics CSV</Button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onMetricsCsv} className="hidden" />
          </div>
          <p className="mt-3 text-xs text-overlay0">Or open any view and <button onClick={() => window.print()} className="text-mauve hover:underline">print / save as PDF</button> · the app chrome is hidden automatically.</p>
        </div>
      </Card>

      <Card title="Demo & reset" subtitle="Sample data, or start fresh">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (data.entries.length === 0 || confirm('Load demo data? This replaces your current journal.')) {
                replaceAll(generateDemoData())
              }
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Load demo data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Erase everything and start fresh? Export a backup first if unsure.')) {
                replaceAll(emptyJournal())
              }
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Clear all data
          </Button>
          <Button
            onClick={() => { if (confirm('Return to the start screen? Your data is kept · you can pick guest / account / device again.')) setSettings({ storageMode: undefined }) }}
            className="inline-flex items-center gap-1.5"
          >
            Back to start screen
          </Button>
        </div>
        <p className="mt-2 text-xs text-overlay0">
          Demo data fills ~30 days of correlated entries so charts have something to show. <strong>Back to start screen</strong> keeps your data and lets you re-pick how it's stored; <strong>Clear all data</strong> wipes everything.
        </p>
      </Card>
          </div>
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium tracking-wide text-overlay0 uppercase">Account, sync & privacy</p>
            <div className="space-y-5">
              <AccountCard />
              <BujoCloudCard />
              <PasscodeCard />
              <CloudStorage />
              <DriveSync />
              <SelfHostCard />
            </div>
          </div>
        </TabsContent>
        </div>
      </Tabs>
    </Page>
  )
}

/** A labeled settings row: label on the left, control on the right. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-subtext1">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between text-sm text-subtext1">
      <span>{label}</span>
      <Switch checked={on} onCheckedChange={onChange} />
    </label>
  )
}

/** Supabase account: guest (anonymous) by default, optional email login + per-user DB sync. */
function AccountCard() {
  const { data, replaceAll, setSettings } = useJournal()
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [recovery, setRecovery] = useState(false)
  const [newPw, setNewPw] = useState('')
  useEffect(() => { if (supabaseEnabled()) currentUser().then(setUser) }, [])
  useEffect(() => onPasswordRecovery(() => setRecovery(true)), [])
  if (!supabaseEnabled()) return null

  function share() {
    navigator.clipboard?.writeText(window.location.origin).then(() => setMsg('✓ App link copied · share it; each friend signs up for their own journal.'), () => setMsg(window.location.origin))
  }

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true); setMsg('')
    try { await fn(); setUser(await currentUser()); setMsg(ok) }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy(false) }
  }
  const guest = !!user?.is_anonymous
  const signedIn = !!user && !guest
  // Return to the first-run gate (keeps local data; lets them switch/log in).
  async function leave() {
    if (!confirm('Log out and return to the start screen? Your data stays on this device · sign in afterward to save it to an account.')) return
    setBusy(true)
    try { if (user) await import('../lib/supabase').then((m) => m.signOut()) } catch { /* ignore */ }
    localStorage.removeItem('bujo:sync')
    setSettings({ storageMode: undefined })
    setBusy(false)
  }

  return (
    <Card title="Account" subtitle="Sign in to sync across devices · guest works too" right={<Button onClick={share}>Share app</Button>}>
      {recovery && (
        <div className="mb-3 rounded-lg border border-mauve/40 bg-base p-3">
          <p className="mb-2 text-sm text-subtext1">Set a new password:</p>
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (min 6)" />
          <Button variant="primary" className="mt-2" onClick={() => run(async () => { await updatePassword(newPw); setRecovery(false); setNewPw('') }, '✓ Password updated.')}>Update password</Button>
        </div>
      )}
      <p className="mb-1 text-sm text-subtext1">
        {signedIn ? <>Signed in as <span className="text-text">{user!.email}</span> · synced to your account.</>
          : guest ? <span className="text-peach">Guest · data is on <strong>this device only</strong>, not in any account.</span>
            : <span className="text-peach">On this device only · <strong>no account</strong>, nothing is stored online.</span>}
      </p>
      {!signedIn && <p className="mb-3 text-xs text-overlay0">Sign in below to save & sync across devices (with recovery). Or log out to switch.</p>}
      {!signedIn && (
        <div className="space-y-2">
          {!user && <Button onClick={() => run(async () => { await signInGuest() }, 'Guest session started.')} className="w-full">Continue as guest</Button>}
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" />
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (min 6)" autoComplete="current-password" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => run(async () => { await signUpEmail(email, pw); await pushJournal(data) }, guest ? 'Account claimed · your data is saved.' : 'Account created.')}>{guest ? 'Save to an account' : 'Sign up'}</Button>
            <Button onClick={() => run(async () => { await signInEmail(email, pw); const r = await pullJournal(); if (r && confirm('Load your cloud data onto this device?')) replaceAll(migrate(r)) }, 'Signed in.')}>Log in</Button>
            <button onClick={() => { if (!email) { setMsg('Enter your email above first.'); return } run(async () => { await resetPassword(email) }, 'Reset link sent · check your email.') }} className="text-xs text-mauve hover:underline">Forgot password?</button>
            <button onClick={leave} className="ml-auto text-xs text-overlay0 hover:text-red">Log out / switch</button>
          </div>
        </div>
      )}
      {signedIn && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => run(async () => { await pushJournal(data) }, '✓ Saved to your account.')}>Save now</Button>
          <Button onClick={() => run(async () => { const r = await pullJournal(); if (r && confirm('Replace this device with your cloud data?')) replaceAll(migrate(r)) }, '✓ Loaded.')}>Load</Button>
          <Button variant="danger" onClick={() => run(async () => { await signOut() }, 'Signed out.')}>Sign out</Button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-subtext1">{busy ? '…' : msg}</p>}
      <p className="mt-2 text-xs text-overlay0">Guest data lives on this device until you add an email. With an account, your journal syncs from a private row only you can read. <strong>Share app</strong> copies the link · each friend signs up for their own journal.</p>
    </Card>
  )
}

/** One-passphrase, end-to-end-encrypted cloud sync (Vercel Blob via /api/sync). */
function BujoCloudCard() {
  const { data, replaceAll } = useJournal()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function push() {
    if (pass.length < 6) { setMsg('Use a passphrase of at least 6 characters.'); return }
    setBusy('push'); setMsg('')
    try { await pushCloud(pass, data); setMsg('✓ Pushed to cloud.') }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy('') }
  }
  async function pull() {
    if (pass.length < 6) { setMsg('Enter your passphrase first.'); return }
    setBusy('pull'); setMsg('')
    try {
      const remote = await pullCloud(pass)
      if (!remote) { setMsg('Nothing stored for that passphrase yet.'); return }
      if (confirm('Replace this device’s data with the cloud copy?')) { replaceAll(migrate(remote)); setMsg('✓ Pulled from cloud.') }
    } catch (e) { setMsg(/wrong|decrypt|operation/i.test((e as Error).message) ? 'Wrong passphrase, or corrupt data.' : (e as Error).message) }
    finally { setBusy('') }
  }

  const [auto, setAuto] = useState(() => !!localStorage.getItem('bujo:sync'))
  function toggleAuto(on: boolean) {
    if (on) {
      if (pass.length < 6) { setMsg('Enter a passphrase first, then enable auto-sync.'); return }
      localStorage.setItem('bujo:sync', pass); setAuto(true); push()
    } else { localStorage.removeItem('bujo:sync'); setAuto(false); setMsg('Auto-sync off.') }
  }

  return (
    <Card title="Cloud sync" subtitle="One passphrase, end-to-end encrypted · sync across devices">
      <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Sync passphrase" autoComplete="off" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={push} className="inline-flex items-center gap-1.5"><Upload size={14} /> {busy === 'push' ? 'Pushing…' : 'Push to cloud'}</Button>
        <Button onClick={pull} className="inline-flex items-center gap-1.5"><Download size={14} /> {busy === 'pull' ? 'Pulling…' : 'Pull from cloud'}</Button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-subtext1">
        <span>Auto-sync on this device <span className="text-xs text-overlay0">(pull on open · push on change)</span></span>
        <Switch checked={auto} onCheckedChange={toggleAuto} />
      </label>
      {msg && <p className="mt-2 text-xs text-subtext1">{msg}</p>}
      <p className="mt-2 text-xs text-overlay0">Your journal is encrypted in this browser before upload · the server only stores ciphertext. Same passphrase on another device = your data. No accounts. Lost passphrase = no recovery.</p>
    </Card>
  )
}

/** Encrypt the journal at rest behind a passcode (Web Crypto, local-only). */
function PasscodeCard() {
  const { setPasscode, encrypted } = useJournal()
  const [pc, setPc] = useState('')
  const [pc2, setPc2] = useState('')
  const [err, setErr] = useState('')
  function enable() {
    if (pc.length < 4) { setErr('Use at least 4 characters.'); return }
    if (pc !== pc2) { setErr('Passcodes don’t match.'); return }
    setPasscode(pc); setPc(''); setPc2(''); setErr('')
  }
  return (
    <Card title="Passcode lock" subtitle="Encrypt this journal at rest (Web Crypto · stays on this device)">
      {encrypted ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-green/30 bg-green/10 px-3 py-1.5 text-sm text-green">🔒 Journal is encrypted</span>
          <Button variant="danger" onClick={() => { if (confirm('Remove the passcode and store the journal unencrypted?')) setPasscode(null) }}>Remove passcode</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="password" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="New passcode" aria-label="New passcode" />
            <Input type="password" value={pc2} onChange={(e) => setPc2(e.target.value)} placeholder="Confirm passcode" aria-label="Confirm passcode" />
          </div>
          {err && <p className="text-xs text-red">{err}</p>}
          <Button variant="primary" onClick={enable}>Encrypt journal</Button>
          <p className="text-xs text-overlay0">There’s no recovery · if you forget the passcode, the data can’t be decrypted. Keep a JSON export as backup.</p>
        </div>
      )}
    </Card>
  )
}

/** Self-host sync: point at the Docker stack's now-SECURED PostgREST API. The
 *  journal is pulled on load and pushed on every change + on tab close (see
 *  ServerSync). The API requires HTTPS + a Bearer JWT (role=bujo_user,
 *  sub=<this device id>); mint one with the helper in
 *  docs/security/postgrest-hardening.md. */
function SelfHostCard() {
  const { data, setSettings, replaceAll } = useJournal()
  const s = data.settings
  const [msg, setMsg] = useState('')
  const configured = serverConfigured(s.selfHostUrl, s.selfHostToken)

  async function test() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const ok = await pushJournalToServer(s.selfHostUrl ?? '', data, s.selfHostToken)
    setMsg(ok ? '✓ Pushed to the server.' : '✗ Could not reach the server (check URL, token, and TLS cert).')
  }
  async function pull() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const r = await pullJournalFromServer(s.selfHostUrl ?? '', s.selfHostToken)
    if (r && confirm('Load the server copy onto this device? (replaces current data)')) { replaceAll(migrate(r)); setMsg('✓ Loaded from server.') }
    else setMsg(r ? 'Cancelled.' : 'Nothing on the server yet (or auth failed).')
  }

  return (
    <Card title="Self-host sync" subtitle="Sync your journal with your own secured PostgREST API (the Docker stack)">
      <div className="space-y-2">
        <label className="block text-sm text-subtext1">API URL
          <Input value={s.selfHostUrl ?? ''} onChange={(e) => setSettings({ selfHostUrl: e.target.value || undefined })} placeholder="https://localhost:8443" className="mt-1" />
        </label>
        <label className="block text-sm text-subtext1">Bearer token <span className="text-overlay0">(HS256 JWT · required)</span>
          <Input value={s.selfHostToken ?? ''} onChange={(e) => setSettings({ selfHostToken: e.target.value || undefined })} placeholder="paste your minted JWT (role=bujo_user, sub=device id)" className="mt-1" />
        </label>
        <div className="flex gap-2">
          <Button variant="primary" onClick={test}>Test / Push now</Button>
          <Button onClick={pull}>Pull from server</Button>
        </div>
        {msg && <p className="text-xs text-overlay0">{msg}</p>}
        <p className="text-xs text-overlay0">The API is secured: use the <code>https://…:8443</code> origin and paste a minted JWT (see docs/security/postgrest-hardening.md). Once set, the journal auto-syncs on change, on tab close, and pulls on load. Run the stack with <code>docker compose up -d</code>.</p>
      </div>
    </Card>
  )
}
