import { useState } from 'react'
import { Dumbbell, Footprints, HeartPulse, CheckCircle2, PenLine } from 'lucide-react'
import { useJournal } from '../store'
import { Button } from './ui'
import { SmartInput } from './SmartInput'
import { MicButton } from './MicButton'
import { parseTags } from '../lib/bullets'
import { parseCapture, type CaptureResult } from '../lib/capture'
import { EXERCISE_LIBRARY } from '../lib/fitness'
import { cat } from '../lib/colors'
import type { DailyMetric } from '../lib/types'

// One smart capture bar: type or speak anything and it routes to the right
// place — a gym set, a cardio session, a wellbeing metric, a habit tick, or a
// plain journal bullet. The parsing is deterministic and local (lib/capture.ts);
// this component only renders the preview and dispatches to existing mutators.

type KindMeta = { label: string; color: string; icon: typeof Dumbbell }
const KIND: Record<CaptureResult['kind'], KindMeta> = {
  gym: { label: 'Gym', color: 'mauve', icon: Dumbbell },
  cardio: { label: 'Cardio', color: 'peach', icon: Footprints },
  metric: { label: 'Wellbeing', color: 'green', icon: HeartPulse },
  habit: { label: 'Habit', color: 'blue', icon: CheckCircle2 },
  bullet: { label: 'Journal', color: 'subtext1', icon: PenLine },
}

/** Human summary of what a parsed result will create. */
function describe(r: CaptureResult): string {
  switch (r.kind) {
    case 'gym':
      return [
        r.exercise,
        r.weight != null ? `${r.weight}${r.unit}` : null,
        r.reps != null ? `×${r.reps}` : null,
        r.rpe != null ? `@${r.rpe}` : null,
      ].filter(Boolean).join(' ')
    case 'cardio':
      return [
        r.activity,
        r.distanceKm != null ? `${r.distanceKm}km` : null,
        r.durationMin != null ? `${r.durationMin}min` : null,
      ].filter(Boolean).join(' · ')
    case 'metric':
      return [
        r.mood != null ? `mood ${r.mood}` : null,
        r.sleep != null ? `sleep ${r.sleep}h` : null,
        r.stress != null ? `stress ${r.stress}` : null,
      ].filter(Boolean).join(' · ')
    case 'habit':
      return r.value != null ? `${r.habit} ${r.value}` : `${r.habit} ✓`
    case 'bullet':
      return r.raw
  }
}

export function CaptureBar({ date, onAdded }: { date: string; onAdded?: () => void }) {
  const { data, addEntry, addWorkout, setMetric, setHabitValue, toggleHabit, setSettings } = useJournal()
  const [val, setVal] = useState('')
  const templates = data.settings.quickTemplates ?? []

  // Completion corpus (shared with the old quick-add behaviour).
  const tags = [...new Set(data.entries.flatMap((e) => parseTags(e.text)))]
  const recents = data.entries.slice(-40).reverse().map((e) => e.text).filter(Boolean)
  const habitNames = data.habits.map((h) => h.name)
  const dupItems = data.entries
    .filter((e) => e.date === date && !e.collection && e.text)
    .map((e) => ({ id: e.id, text: e.text }))

  // Recent exercise names sharpen gym-name matching beyond the static library.
  const recentExercises = [...new Set(
    data.workouts.flatMap((w) => (w.setRows ?? []).map((s) => s.exercise)).filter(Boolean),
  )]
  const captureCtx = {
    exercises: [...new Set([...EXERCISE_LIBRARY, ...recentExercises])],
    habits: habitNames,
    unit: data.settings.weightUnit,
  }

  const parsed = val.trim() ? parseCapture(val, captureCtx) : null

  function commit(r: CaptureResult) {
    switch (r.kind) {
      case 'gym': {
        const line = describe(r)
        addWorkout({
          date,
          activity: 'Strength',
          sets: [line],
          setRows: [{ exercise: r.exercise, weight: r.weight, reps: r.reps, rpe: r.rpe, kind: 'working' }],
          rpe: r.rpe,
          notes: '',
        })
        break
      }
      case 'cardio':
        addWorkout({ date, activity: r.activity, distanceKm: r.distanceKm, durationMin: r.durationMin, sets: [], notes: '' })
        break
      case 'metric': {
        const patch: Partial<DailyMetric> = {}
        if (r.mood != null) patch.mood = r.mood
        if (r.sleep != null) patch.sleep = r.sleep
        if (r.stress != null) patch.stress = r.stress
        setMetric(date, patch)
        break
      }
      case 'habit': {
        const h = data.habits.find((x) => x.name === r.habit)
        if (h) {
          if (r.value != null) setHabitValue(date, h.id, r.value)
          else toggleHabit(date, h.id)
        }
        break
      }
      case 'bullet':
        addEntry(date, r.raw)
        break
    }
  }

  function add(text: string) {
    const t = text.trim()
    if (!t) return
    commit(parseCapture(t, captureCtx))
    setVal('')
    onAdded?.()
  }

  function saveTemplate() {
    const t = val.trim()
    if (!t || templates.includes(t)) return
    setSettings({ quickTemplates: [...templates, t].slice(-12) })
  }
  function removeTemplate(t: string) {
    setSettings({ quickTemplates: templates.filter((x) => x !== t) })
  }

  const meta = parsed ? KIND[parsed.kind] : null
  const Icon = meta?.icon

  return (
    <div>
      <div className="flex items-start gap-2">
        <SmartInput
          value={val}
          onChange={setVal}
          onSubmit={add}
          suggestCtx={{ tags, recents, habits: habitNames }}
          dupItems={dupItems}
          placeholder="Capture… e.g. bench 80x5 · ran 5k 28min · mood 7 · water 6 · t call mom"
          aria-label="Smart capture"
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

      {/* Live routed preview: which view it lands in + the parsed values. */}
      {parsed && meta && Icon && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-overlay0">
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={{ background: cat(meta.color) + '22', color: cat(meta.color) }}>
            <Icon size={11} /> {meta.label}
          </span>
          <span className="text-subtext1">{describe(parsed) || '…'}</span>
        </p>
      )}
    </div>
  )
}
