import { useRef } from 'react'
import { Moon, Sun, Download, Upload, FileText, Sparkles, Trash2, AlertTriangle } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card } from '../components/ui'
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
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-sm text-subtext1">Theme</span>
          <div className="flex gap-2">
            <Button variant={s.theme === 'mocha' ? 'primary' : 'ghost'} onClick={() => setSettings({ theme: 'mocha' })} className="inline-flex items-center gap-1.5"><Moon size={14} /> Dark</Button>
            <Button variant={s.theme === 'latte' ? 'primary' : 'ghost'} onClick={() => setSettings({ theme: 'latte' })} className="inline-flex items-center gap-1.5"><Sun size={14} /> Light</Button>
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

      <Card title="Journal feel" subtitle="Make it look & behave like real paper">
        <div className="space-y-2">
          <Toggle label="Open-book frame (spine & page edges)" on={s.bookMode} onClick={() => setSettings({ bookMode: !s.bookMode })} />
          <Toggle label="Dot-grid paper texture" on={s.paperMode} onClick={() => setSettings({ paperMode: !s.paperMode })} />
          <Toggle label="Handwriting font" on={s.handwriting} onClick={() => setSettings({ handwriting: !s.handwriting })} />
          <Toggle label="Daily reflection prompt" on={s.reflectionPrompts} onClick={() => setSettings({ reflectionPrompts: !s.reflectionPrompts })} />
        </div>
      </Card>

      <Card title="Reminders & weather" subtitle="Opt-in — weather makes network calls">
        <div className="space-y-3">
          <Toggle label="Daily journaling reminder" on={s.reminderEnabled} onClick={() => setSettings({ reminderEnabled: !s.reminderEnabled })} />
          {s.reminderEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-subtext1">Remind me at</span>
              <input
                type="time"
                value={s.reminderTime}
                onChange={(e) => setSettings({ reminderTime: e.target.value })}
                className="rounded-lg border border-surface1 bg-base px-2 py-1.5 text-sm text-text"
              />
            </div>
          )}
          <div className="border-t border-surface0 pt-3">
            <Toggle label="Auto-log weather & location" on={s.weatherEnabled} onClick={() => setSettings({ weatherEnabled: !s.weatherEnabled })} />
            <p className="mt-1 text-xs text-overlay0">Uses open-meteo + your browser location. Off = zero network calls.</p>
          </div>
        </div>
      </Card>

      <Card title="Backup & data" subtitle="Your data lives only in this browser — back it up!" className="lg:col-span-2">
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

      <Card title="Demo & reset" subtitle="Try the app with sample data, or start fresh" className="lg:col-span-2">
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
