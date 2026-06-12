import { useRef, useState } from 'react'
import { Download, Upload, FileText, Sparkles, Trash2, AlertTriangle } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Input, Segmented } from '../components/ui'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Page } from '../components/shell/Page'
import { DriveSync } from '../components/DriveSync'
import { CloudStorage } from '../components/CloudStorage'
import { emptyJournal, exportJSON, exportMarkdown, importJSON } from '../lib/storage'
import { generateDemoData } from '../lib/demo'
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
  const { data, setSettings, replaceAll } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const s = data.settings

  function setGender(gender: Gender) {
    // Auto-surface the relevant wellbeing tool, but let the user override after.
    setSettings({
      gender,
      cycleTrackerEnabled: gender === 'female' ? true : s.cycleTrackerEnabled,
      nofapEnabled: gender === 'male' ? true : s.nofapEnabled,
    })
  }

  function doExport() {
    download(`bujo-backup-${todayISO()}.json`, exportJSON(data))
    setSettings({ lastBackup: todayISO() })
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceAll(importJSON(String(reader.result)))
        alert('Backup imported successfully.')
      } catch {
        alert('Could not read that file — is it a valid bujo backup?')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Page>
      <Tabs defaultValue="profile">
        <TabsList className="bg-secondary">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="feel">Journal feel</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="data">Data &amp; Cloud</TabsTrigger>
        </TabsList>

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
        <div className="mt-3 border-t border-border pt-3"><Row label="Weight unit">
          <Segmented value={s.weightUnit} onChange={(v) => setSettings({ weightUnit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
        </Row></div>
        <div className="mt-3 border-t border-border pt-3"><Row label="Distance unit">
          <Segmented value={s.distanceUnit} onChange={(v) => setSettings({ distanceUnit: v })} options={[{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }]} />
        </Row></div>
        <div className="mt-3 border-t border-border pt-3"><Row label="Week starts on">
          <Segmented value={s.weekStart ?? 0} onChange={(v) => setSettings({ weekStart: v })} options={[{ value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }]} />
        </Row></div>
        <div className="mt-3 border-t border-border pt-3"><Row label="Temperature unit">
          <Segmented value={s.tempUnit} onChange={(v) => setSettings({ tempUnit: v })} options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} />
        </Row></div>
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
      </Card>
        </TabsContent>

        <TabsContent value="reminders" className="max-w-2xl">
      <Card title="Reminders & weather" subtitle="Opt-in — weather makes network calls">
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
          <div className="grid auto-rows-fr gap-5 lg:grid-cols-2">
      <Card title="Backup & data" subtitle="Back it up regularly">
        {!s.lastBackup && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-yellow/30 bg-base p-2 text-xs text-yellow">
            <AlertTriangle size={14} /> You haven't backed up yet. Browsers can clear local storage — export a copy.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={doExport} className="inline-flex items-center gap-1.5"><Download size={14} /> Export JSON</Button>
          <Button onClick={() => download(`bujo-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')} className="inline-flex items-center gap-1.5"><FileText size={14} /> Export Markdown</Button>
          <Button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><Upload size={14} /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        {s.lastBackup && <p className="mt-2 text-xs text-overlay0">Last backup: {s.lastBackup}</p>}
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
        </div>
        <p className="mt-2 text-xs text-overlay0">
          Demo data fills ~30 days of correlated entries, habits, moods, workouts and memories so charts and insights have something to show.
        </p>
      </Card>
          </div>
          <div className="mt-5 space-y-5">
            <PasscodeCard />
            <CloudStorage />
            <DriveSync />
          </div>
        </TabsContent>
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
          <p className="text-xs text-overlay0">There’s no recovery — if you forget the passcode, the data can’t be decrypted. Keep a JSON export as backup.</p>
        </div>
      )}
    </Card>
  )
}
