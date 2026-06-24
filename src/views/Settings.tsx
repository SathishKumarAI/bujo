import { useRef, useState, useEffect } from 'react'
import { Download, Upload, FileText, Sparkles, Trash2, AlertTriangle, SlidersHorizontal, UserRound, Palette, Bell, Database, ChevronDown, ChevronRight, RefreshCw, Cloud } from 'lucide-react'
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
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv, parseMetricsCsv, stripSyncSecrets, daysSinceBackup, habitLogCsv, pickleballCsv, recoveryCsv, personalRecordsCsv, collectionCsv, redactSensitive, devSessionsCsv, dataSummary, verifyChecksum, withChecksum } from '../lib/csv'
import { journalToICS, habitRemindersToICS, tasksToICS, completionsToICS } from '../lib/ics'
import { CalendarDays } from 'lucide-react'
import { inlineImages } from '../lib/imageStore'
import { todayISO } from '../lib/date'
import type { Gender, ThemeName } from '../lib/types'

/** Selectable themes (swatch = base / surface / accent) for the Settings picker. */
const THEMES: { value: ThemeName; label: string; hint: string; swatch: [string, string, string] }[] = [
  { value: 'mocha', label: 'Mocha', hint: 'Dark · default', swatch: ['#1e1e2e', '#313244', '#cba6f7'] },
  { value: 'vscode', label: 'VS Code', hint: 'Dark · editor', swatch: ['#1f1f1f', '#2a2a2e', '#c586c0'] },
  { value: 'neon', label: 'Neon', hint: 'Dark · vivid', swatch: ['#0a0a16', '#20203c', '#c77dff'] },
  { value: 'latte', label: 'Latte', hint: 'Light · crisp', swatch: ['#f8f9fa', '#e8eaed', '#6c4cf0'] },
  { value: 'dawn', label: 'Dawn', hint: 'Light · warm', swatch: ['#faf3e7', '#ecdcc4', '#b45309'] },
  { value: 'system', label: 'System', hint: 'Match OS', swatch: ['#1e1e2e', '#f8f9fa', '#89b4fa'] },
]

function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Self-managed collapsible settings section (SET-5) — one disclosure primitive
 *  instead of the three ad-hoc toggle buttons this page used to repeat. */
function Disclosure({ title, subtitle, defaultOpen = false, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:text-text"
      >
        <span className="text-overlay0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <span className="font-display text-base font-medium text-subtext1">{title}</span>
        {subtitle && <span className="text-xs text-overlay0">· {subtitle}</span>}
        {!open && <span className="ml-auto text-[10px] tracking-wide text-overlay0 uppercase">show</span>}
      </button>
      {open && children}
    </section>
  )
}

export function Settings() {
  const { data, setSettings, replaceAll, setMetric } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const verifyRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState('profile')

  function onVerifyBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const r = verifyChecksum(String(reader.result))
      if (!r.ok) {
        alert('✗ This backup failed its integrity check — it looks truncated or corrupted. Do not rely on it; keep an older copy.')
      } else if (!r.stamped) {
        alert('This file has no integrity checksum (an older or plain export). It looks readable, but can’t be verified.')
      } else {
        alert('✓ Integrity check passed — this backup is intact.')
      }
    }
    reader.readAsText(file)
    if (verifyRef.current) verifyRef.current.value = ''
  }

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
    // Inline IndexedDB-stored photos so the backup is self-contained, then strip
    // device-/account-specific sync secrets so the file is safe to share/move.
    const full = await inlineImages(data)
    download(`bujo-backup-${todayISO()}.json`, exportJSON(stripSyncSecrets(full)))
    setSettings({ lastBackup: todayISO() })
  }

  async function doRedactedExport() {
    // Privacy-safe share copy (BUJO-308): inline photos, strip sync secrets, then
    // redact the sensitive domains (Recovery, Cycle) and free-text entry bodies.
    const full = await inlineImages(data)
    download(`bujo-shared-${todayISO()}.json`, exportJSON(redactSensitive(stripSyncSecrets(full))))
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

  const tabClass = 'gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3.5 py-2 text-sm text-subtext0 hover:text-text data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm'
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

      <Tabs value={tab} onValueChange={setTab}>
        {/* Horizontal pill bar — every section visible at once, wraps on narrow
            screens. No sidebar rail, no clipped scroller. */}
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
          <TabsTrigger value="profile" className={tabClass}><UserRound size={15} /> Profile</TabsTrigger>
          <TabsTrigger value="feel" className={tabClass}><Palette size={15} /> Appearance</TabsTrigger>
          <TabsTrigger value="reminders" className={tabClass}><Bell size={15} /> Reminders</TabsTrigger>
          <TabsTrigger value="sync" className={tabClass}><Cloud size={15} /> Sync &amp; privacy</TabsTrigger>
          <TabsTrigger value="data" className={tabClass}><Database size={15} /> Data</TabsTrigger>
        </TabsList>

        <div className="min-w-0">
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
        <div className="mb-3 border-b border-border pb-3">
          <p className="mb-2 text-sm text-subtext1">Theme</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((t) => {
              const active = (s.theme ?? 'mocha') === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setSettings({ theme: t.value })}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${active ? 'border-primary bg-secondary/50' : 'border-border hover:border-surface2'}`}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-md border border-border" aria-hidden>
                    {t.swatch.map((c, i) => <span key={i} className="h-7 w-2.5" style={{ background: c }} />)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text">{t.label}</span>
                    <span className="block text-[11px] text-overlay0">{t.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mb-3 border-b border-border pb-3">
          <p className="mb-2 text-sm text-subtext1">Text size</p>
          <Segmented
            value={s.fontScale ?? 1}
            onChange={(v) => setSettings({ fontScale: v })}
            options={[{ value: 0.9, label: 'S' }, { value: 1, label: 'M' }, { value: 1.1, label: 'L' }, { value: 1.25, label: 'XL' }]}
          />
          <p className="mt-1 text-xs text-overlay0">Scales all text & controls across every screen. Charts and figures keep their natural size.</p>
        </div>
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
        <div className="mt-3 border-t border-border pt-3">
          {/* SET-4: one-tap return to the default look. */}
          <Button
            onClick={() => { if (confirm('Reset appearance to defaults? (theme, accent, paper & dashboard toggles — your data is untouched.)')) setSettings({ theme: 'mocha', accent: undefined, fontScale: 1, bookMode: false, paperMode: false, handwriting: false, reflectionPrompts: true, penaltyLevel: 'beginner', hideToday: [] }) }}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Reset appearance to defaults
          </Button>
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

        <TabsContent value="sync">
          {/* Recommended path: account + E2E cloud sync, plus at-rest passcode. */}
          <div className="space-y-5">
            <AccountCard />
            <BujoCloudCard />
            <PasscodeCard />
          </div>
          {/* Advanced · BYO-storage / self-host, collapsed to cut option overload. */}
          <div className="mt-5">
            <Disclosure title="Advanced sync" subtitle="self-host & bring-your-own storage">
              <div className="space-y-5">
                <SelfHostCard />
                <CloudStorage />
                <DriveSync />
              </div>
            </Disclosure>
          </div>
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
        {(() => {
          const stale = daysSinceBackup(s.lastBackup, todayISO())
          if (stale == null) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-yellow/30 bg-base p-2 text-xs text-yellow">
                <AlertTriangle size={14} /> You haven't backed up yet. Browsers can clear local storage · export a copy.
              </p>
            )
          }
          if (stale >= 7) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-yellow/30 bg-base p-2 text-xs text-yellow">
                <AlertTriangle size={14} /> Not backed up in {stale} day{stale === 1 ? '' : 's'} · export a fresh copy to be safe.
              </p>
            )
          }
          return null
        })()}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={doExport} className="inline-flex items-center gap-1.5"><Download size={14} /> Export JSON</Button>
          <Button onClick={() => download(`bujo-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')} className="inline-flex items-center gap-1.5"><FileText size={14} /> Export Markdown</Button>
          <Button onClick={() => download(`bujo-calendar-${todayISO()}.ics`, journalToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Export calendar</Button>
          <Button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        <p className="mt-1.5 text-xs text-overlay0">JSON backups omit your sync tokens so the file is safe to share. Calendar export gives an .ics of your events &amp; birthdays.</p>
        <div className="mt-2">
          <Button onClick={doRedactedExport} className="inline-flex items-center gap-1.5"><Download size={14} /> Export shareable (redacted) JSON</Button>
          <p className="mt-1 text-xs text-overlay0">A privacy-safe copy that omits Recovery &amp; Cycle data and blanks your entry text — for handing to a coach or support tool.</p>
        </div>
        {s.lastBackup && <p className="mt-2 text-xs text-overlay0">Last backup: {s.lastBackup}</p>}
        {/* SET-2: power-user exports fold away so Export/Import JSON stays the hero. */}
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <Disclosure title="Export for spreadsheets (CSV)" subtitle="one file per section">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => download(`bujo-entries-${todayISO()}.csv`, entriesCsv(data), 'text/csv')}>Entries</Button>
              <Button onClick={() => download(`bujo-habits-${todayISO()}.csv`, habitsCsv(data), 'text/csv')}>Habits</Button>
              <Button onClick={() => download(`bujo-habit-log-${todayISO()}.csv`, habitLogCsv(data), 'text/csv')}>Habit log</Button>
              <Button onClick={() => download(`bujo-metrics-${todayISO()}.csv`, metricsCsv(data), 'text/csv')}>Metrics</Button>
              <Button onClick={() => download(`bujo-workouts-${todayISO()}.csv`, workoutsCsv(data), 'text/csv')}>Workouts</Button>
              {(data.devSessions?.length ?? 0) > 0 && <Button onClick={() => download(`bujo-focus-${todayISO()}.csv`, devSessionsCsv(data), 'text/csv')}>Focus sessions</Button>}
              <Button onClick={() => download(`bujo-pickleball-${todayISO()}.csv`, pickleballCsv(data), 'text/csv')}>Pickleball</Button>
              <Button onClick={() => download(`bujo-records-${todayISO()}.csv`, personalRecordsCsv(data), 'text/csv')}>PR leaderboard</Button>
              {s.nofapEnabled && <Button onClick={() => download(`bujo-recovery-${todayISO()}.csv`, recoveryCsv(data), 'text/csv')}>Recovery</Button>}
            </div>
            {data.collections.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-overlay0">Export one collection's entries as CSV:</p>
                <div className="flex flex-wrap gap-2">
                  {data.collections.map((c) => (
                    <Button key={c.id} onClick={() => download(`bujo-collection-${c.name.replace(/[^\w-]+/g, '-').toLowerCase()}-${todayISO()}.csv`, collectionCsv(data, c.id), 'text/csv')}>
                      {c.icon} {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2">
              <Button onClick={() => csvRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Import metrics CSV</Button>
              <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onMetricsCsv} className="hidden" />
            </div>
          </Disclosure>
          <Disclosure title="Calendar feeds (.ics)" subtitle="habits, tasks & wins in any calendar">
            <div className="space-y-2">
              <div>
                <Button onClick={() => download(`bujo-habit-reminders-${todayISO()}.ics`, habitRemindersToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Habit reminders (.ics)</Button>
                <p className="mt-1 text-xs text-overlay0">Adds each active habit to your calendar as a recurring reminder at {s.reminderTime || '09:00'}.</p>
              </div>
              <div>
                <Button onClick={() => download(`bujo-tasks-${todayISO()}.ics`, tasksToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Open tasks (.ics)</Button>
                <p className="mt-1 text-xs text-overlay0">Puts your open, dated to-dos on the calendar as all-day deadlines.</p>
              </div>
              <div>
                <Button onClick={() => download(`bujo-completions-${todayISO()}.ics`, completionsToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Completions feed (.ics)</Button>
                <p className="mt-1 text-xs text-overlay0">Every completed habit and logged workout as an all-day “✓” event — see your wins in any external calendar.</p>
              </div>
            </div>
          </Disclosure>
          <Disclosure title="Backup integrity" subtitle="checksum & verify a file">
            <div className="flex flex-wrap gap-2">
              <Button onClick={async () => { const full = await inlineImages(data); download(`bujo-verified-${todayISO()}.json.txt`, withChecksum(exportJSON(stripSyncSecrets(full)))) }} className="inline-flex items-center gap-1.5"><Download size={14} /> Export checksummed backup</Button>
              <Button onClick={() => verifyRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Verify a backup file</Button>
              <input ref={verifyRef} type="file" accept=".txt,.json,application/json,text/plain" onChange={onVerifyBackup} className="hidden" />
            </div>
            <p className="mt-1 text-xs text-overlay0">Stamps an export with a checksum so you can later confirm the file wasn’t truncated or corrupted in storage. Verify reports intact / corrupted without changing your data.</p>
          </Disclosure>
          <p className="text-xs text-overlay0">Or open any view and <button onClick={() => window.print()} className="text-mauve hover:underline">print / save as PDF</button> · the app chrome is hidden automatically.</p>
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
          {/* Journal summary · read-only coverage analytics, collapsed at the bottom. */}
          {(() => {
            const sum = dataSummary(data)
            if (sum.totalRecords === 0) return null
            return (
              <section className="mt-6 space-y-5">
                <Disclosure title="Journal summary" subtitle="the span and shape of everything you've tracked">
                  <Card title="Journal summary" subtitle="The span and shape of everything you've tracked">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <StatTile compact label="First day" value={sum.firstDay ?? '—'} color="lavender" />
                      <StatTile compact label="Latest day" value={sum.lastDay ?? '—'} color="lavender" />
                      <StatTile compact label="Days span" value={sum.spanDays} color="blue" />
                      <StatTile compact label="Active days" value={sum.activeDays} color="green" />
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-overlay0">Days with data (coverage)</span>
                        <span style={{ color: cat('subtext1') }}>{sum.coveragePct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface0">
                        <div className="h-full rounded-full" style={{ width: `${sum.coveragePct}%`, background: cat('teal') }} />
                      </div>
                    </div>
                    {sum.counts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {sum.counts.map((c) => (
                          <span key={c.label} className="inline-flex items-center gap-1 rounded-full border border-surface0 bg-base px-2 py-0.5 text-xs text-subtext1">
                            {c.label} <span className="font-medium text-text">{c.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-overlay0">{sum.totalRecords} records across {sum.counts.length} {sum.counts.length === 1 ? 'domain' : 'domains'} · coverage is how many days in your tracked span have at least one record.</p>
                  </Card>
                </Disclosure>
              </section>
            )
          })()}
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
