import { useState } from 'react'
import { useJournal } from '../store'
import { Button } from './ui'
import { SmartInput } from './SmartInput'
import { MicButton } from './MicButton'
import { parseTags, parseQuickCapture } from '../lib/bullets'
import { cat } from '../lib/colors'

/**
 * Quick-capture input. Prefixes: t=task, e=event, n=note, *=important, ^=memory.
 * Default kind is task. Enter to add. Now backed by SmartInput for completion
 * (#tags, recent entries) and same-day duplicate detection.
 */
export function QuickAdd({ date, onAdded }: { date: string; onAdded?: () => void }) {
  const { data, addEntry, setSettings } = useJournal()
  const [val, setVal] = useState('')
  const templates = data.settings.quickTemplates ?? []

  function saveTemplate() {
    const t = val.trim()
    if (!t || templates.includes(t)) return
    setSettings({ quickTemplates: [...templates, t].slice(-12) })
  }
  function removeTemplate(t: string) {
    setSettings({ quickTemplates: templates.filter((x) => x !== t) })
  }

  // Completion corpus + duplicate set (same-day, non-collection entries).
  const tags = [...new Set(data.entries.flatMap((e) => parseTags(e.text)))]
  const recents = data.entries.slice(-40).reverse().map((e) => e.text).filter(Boolean)
  const habits = data.habits.map((h) => h.name)
  const dupItems = data.entries
    .filter((e) => e.date === date && !e.collection && e.text)
    .map((e) => ({ id: e.id, text: e.text }))

  function add(text: string) {
    if (!text.trim()) return
    addEntry(date, text)
    setVal('')
    onAdded?.()
  }

  const preview = val.trim() ? parseQuickCapture(val) : null

  return (
    <div>
      <div className="flex items-start gap-2">
        <SmartInput
          value={val}
          onChange={setVal}
          onSubmit={add}
          suggestCtx={{ tags, recents, habits }}
          dupItems={dupItems}
          placeholder="Add… (t task · e event · n note · * important · ^ memory)"
          aria-label="Quick add entry"
        />
        <MicButton onText={(t) => setVal((v) => (v ? `${v} ${t}` : t))} />
        <Button type="button" variant="primary" onClick={() => add(val)}>
          Add
        </Button>
      </div>

      {/* Saved templates — tap to insert; ✕ to forget. */}
      {(templates.length > 0 || val.trim()) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {templates.map((t) => (
            <span key={t} className="group inline-flex items-center gap-1 rounded-full bg-surface0 px-2 py-0.5 text-xs text-subtext1">
              <button onClick={() => setVal(t)} className="hover:text-text">{t}</button>
              <button onClick={() => removeTemplate(t)} aria-label={`Forget template ${t}`} className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
            </span>
          ))}
          {val.trim() && !templates.includes(val.trim()) && (
            <button onClick={saveTemplate} className="rounded-full border border-dashed border-surface2 px-2 py-0.5 text-xs text-overlay1 hover:text-mauve">+ save as template</button>
          )}
        </div>
      )}

      {/* Live preview: shows exactly what the grammar will create. */}
      {preview && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-overlay0">
          Adds a
          <span className="rounded px-1.5 py-0.5 font-medium" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>{preview.type}</span>
          {preview.important && <span className="rounded px-1.5 py-0.5" style={{ background: cat('yellow') + '22', color: cat('yellow') }}>important</span>}
          {preview.memory && <span className="rounded px-1.5 py-0.5" style={{ background: cat('pink') + '22', color: cat('pink') }}>memory</span>}
          {preview.tags.map((t) => <span key={t} className="text-blue">#{t}</span>)}
          <span className="text-subtext1">: {preview.text || '…'}</span>
        </p>
      )}
    </div>
  )
}
