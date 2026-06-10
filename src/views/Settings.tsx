import { useRef } from 'react'
import { useJournal } from '../store'
import { Button, Card } from '../components/ui'
import { exportJSON, exportMarkdown, importJSON } from '../lib/storage'
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
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-sm text-subtext1">Theme</span>
          <div className="flex gap-2">
            <Button variant={s.theme === 'mocha' ? 'primary' : 'ghost'} onClick={() => setSettings({ theme: 'mocha' })}>🌙 Dark</Button>
            <Button variant={s.theme === 'latte' ? 'primary' : 'ghost'} onClick={() => setSettings({ theme: 'latte' })}>☀️ Light</Button>
          </div>
        </div>
      </Card>

      <Card title="Profile" subtitle="Tailors the wellbeing tools shown">
        <div className="flex items-center justify-between">
          <span className="text-sm text-subtext1">Gender</span>
          <select
            value={s.gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="rounded-lg border border-surface1 bg-base px-2 py-1.5 text-sm text-text"
          >
            <option value="prefer-not">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
          </select>
        </div>
        <div className="mt-3 space-y-2 border-t border-surface0 pt-3">
          <Toggle label="Cycle / fertility tracker" on={s.cycleTrackerEnabled} onClick={() => setSettings({ cycleTrackerEnabled: !s.cycleTrackerEnabled })} />
          <Toggle label="Abstinence / NoFap journal" on={s.nofapEnabled} onClick={() => setSettings({ nofapEnabled: !s.nofapEnabled })} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-surface0 pt-3">
          <span className="text-sm text-subtext1">Temperature unit</span>
          <div className="flex gap-2">
            <Button variant={s.tempUnit === 'F' ? 'primary' : 'ghost'} onClick={() => setSettings({ tempUnit: 'F' })}>°F</Button>
            <Button variant={s.tempUnit === 'C' ? 'primary' : 'ghost'} onClick={() => setSettings({ tempUnit: 'C' })}>°C</Button>
          </div>
        </div>
      </Card>

      <Card title="Backup & data" subtitle="Your data lives only in this browser — back it up!" className="lg:col-span-2">
        {!s.lastBackup && (
          <p className="mb-3 rounded-lg border border-yellow/30 bg-base p-2 text-xs text-yellow">
            ⚠ You haven't backed up yet. Browsers can clear local storage — export a copy.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={doExport}>⬇ Export JSON</Button>
          <Button onClick={() => download(`bujo-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')}>⬇ Export Markdown</Button>
          <Button onClick={() => fileRef.current?.click()}>⬆ Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        {s.lastBackup && <p className="mt-2 text-xs text-overlay0">Last backup: {s.lastBackup}</p>}
      </Card>
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between text-sm text-subtext1">
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-mauve' : 'bg-surface1'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-crust transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
