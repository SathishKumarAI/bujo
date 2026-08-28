import { Barbell, CheckCircle, Footprints, Heartbeat, PencilSimple, SlidersHorizontal } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'

import { SmartInput } from './SmartInput'
import { MicButton } from './MicButton'
import { Stepper } from './fields/Stepper'
import { EmojiScale } from './fields/EmojiScale'
import { parseTags } from '../lib/bullets'
import { parseCapture, type CaptureResult } from '../lib/capture'
import { labelOf } from '../domain/activities'
import { EXERCISE_LIBRARY } from '../lib/fitness'
import { washStyle } from '../lib/colors'
import type { DailyMetric } from '../lib/types'
import { Button } from './ui/button'

// One smart capture bar: type or speak anything and it routes to the right
// place · a gym set, a cardio session, a wellbeing metric, a habit tick, or a
// plain journal bullet. The parsing is deterministic and local (lib/capture.ts);
// this component only renders the preview and dispatches to existing mutators.

type KindMeta = { label: string; color: string; icon: typeof Barbell }
const KIND: Record<CaptureResult['kind'], KindMeta> = {
  gym: { label: 'Gym', color: 'mauve', icon: Barbell },
  cardio: { label: 'Cardio', color: 'peach', icon: Footprints },
  metric: { label: 'Wellbeing', color: 'green', icon: Heartbeat },
  habit: { label: 'Habit', color: 'blue', icon: CheckCircle },
  bullet: { label: 'Journal', color: 'subtext1', icon: PencilSimple },
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
        labelOf(r.activity),
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

/**
 * One example at a time, rotated by date. Each shows a different thing the
 * parser understands — a lift, a run, a metric, a tagged note, a task — so the
 * grammar is taught over a week instead of dumped in one line.
 */
/** Tiny stable hash of an ISO date, so the same day always picks the same hint. */
function hashDate(iso: string) {
  let h = 0
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) | 0
  return h
}

const CAPTURE_HINTS = [
  'Capture… e.g. t call mum',
  'Capture… e.g. ran 5k in 28min',
  'Capture… e.g. bench 80x5',
  'Capture… e.g. mood 7',
  'Capture… e.g. n coffee with Sam #friends',
  'Capture… e.g. water 6',
  'Capture… e.g. e dentist 3pm',
]

export function CaptureBar({ date, onAdded }: { date: string; onAdded?: () => void }) {
  // Keyed off the day being logged, not the clock: the hint must not change
  // under the cursor while someone is mid-sentence.
  const hintIndex = Math.abs(hashDate(date)) % CAPTURE_HINTS.length
  const { data, addEntry, addWorkout, setMetric, setHabitValue, toggleHabit, setSettings } = useJournal()
  const [val, setVal] = useState('')
  // A frozen, hand-editable copy of the current parse (the "edit fields" panel).
  const [draft, setDraft] = useState<CaptureResult | null>(null)
  const templates = data.settings.quickTemplates ?? []

  function setText(next: string) {
    setVal(next)
    if (draft) setDraft(null) // typing re-parses; drop any stale draft
  }

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
          activity: 'strength',
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
          // Numeric habits (count/timer/rating) are scored from habitValues, so
          // toggleHabit (which writes habitLog) would never register them as done.
          // Route them through setHabitValue; only plain 'check' habits toggle.
          const numeric = h.type === 'count' || h.type === 'timer' || h.type === 'rating'
          if (r.value != null) setHabitValue(date, h.id, r.value)
          else if (numeric) setHabitValue(date, h.id, h.target ?? 1)
          else toggleHabit(date, h.id)
        }
        break
      }
      case 'bullet':
        addEntry(date, r.raw)
        break
    }
  }

  function commitAndClear(r: CaptureResult) {
    commit(r)
    setVal('')
    setDraft(null)
    onAdded?.()
  }
  function add(text: string) {
    const t = text.trim()
    if (!t) return
    commitAndClear(draft ?? parseCapture(t, captureCtx))
  }
  /** Patch one numeric field of the current draft, keeping its kind. */
  function patchDraft(patch: Record<string, number | undefined>) {
    setDraft((d) => (d ? ({ ...d, ...patch } as CaptureResult) : d))
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
          onChange={setText}
          onSubmit={add}
          suggestCtx={{ tags, recents, habits: habitNames }}
          dupItems={dupItems}
          // One example, not five. The old placeholder listed a comma-run of
          // bench/run/mood/water/task in three different grammars, which reads
          // as a spec sheet and truncates on a phone. Rotating by day keeps the
          // teaching without the wall — and stays stable while you type.
          placeholder={CAPTURE_HINTS[hintIndex]}
          aria-label="Smart capture"
        />
        <MicButton onText={(t) => { setVal((v) => (v ? `${v} ${t}` : t)); setDraft(null) }} />
        <Button type="button" variant="secondary" onClick={() => add(val)} className="press-3d rounded-control">
          Add
        </Button>
      </div>

      {/* Saved templates · tap to insert; ✕ to forget. */}
      {(templates.length > 0 || val.trim()) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {templates.map((t) => (
            <span key={t} className="group inline-flex items-center gap-1 rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-1">
              <button onClick={() => setVal(t)} className="hover:text-fg-1">{t}</button>
              <button onClick={() => removeTemplate(t)} aria-label={`Forget template ${t}`} className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
            </span>
          ))}
          {val.trim() && !templates.includes(val.trim()) && (
            <Button variant="secondary" size="sm" onClick={saveTemplate} className="h-auto rounded-pill border-dashed px-2 py-0.5 text-label text-fg-2">+ save as template</Button>
          )}
        </div>
      )}

      {/* Live routed preview: which view it lands in + the parsed values. */}
      {parsed && meta && Icon && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-label text-fg-2">
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={washStyle(meta.color)}>
            <AppIcon as={Icon} size="sm" /> {meta.label}
          </span>
          <span className="text-fg-1">{describe(draft ?? parsed) || '…'}</span>
          {canEdit(parsed) && (
            <button
              type="button"
              onClick={() => setDraft((d) => d ?? parsed)}
              className="inline-flex items-center gap-1 text-fg-2 hover:text-mauve"
            >
              <AppIcon as={SlidersHorizontal} size="sm" /> edit fields
            </button>
          )}
        </p>
      )}

      {/* Structured editor · pre-filled from the parse, tap to adjust, no typing. */}
      {draft && (
        <div className="mt-2 rounded-card border border-line bg-ink-0 p-3">
          <div className="flex flex-wrap items-end gap-3">
            {draft.kind === 'gym' && (
              <>
                <Stepper label="Weight" suffix={draft.unit} value={draft.weight} onChange={(v) => patchDraft({ weight: v })} step={2.5} min={0} />
                <Stepper label="Reps" value={draft.reps} onChange={(v) => patchDraft({ reps: v })} step={1} min={0} />
                <Stepper label="RPE" value={draft.rpe} onChange={(v) => patchDraft({ rpe: v })} step={1} min={1} max={10} />
              </>
            )}
            {draft.kind === 'cardio' && (
              <>
                <Stepper label="Distance" suffix="km" value={draft.distanceKm} onChange={(v) => patchDraft({ distanceKm: v })} step={0.5} min={0} />
                <Stepper label="Duration" suffix="min" value={draft.durationMin} onChange={(v) => patchDraft({ durationMin: v })} step={1} min={0} />
              </>
            )}
            {draft.kind === 'metric' && (
              <>
                <EmojiScale label="Mood" value={draft.mood} onChange={(v) => patchDraft({ mood: v })} />
                <Stepper label="Sleep" suffix="h" value={draft.sleep} onChange={(v) => patchDraft({ sleep: v })} step={0.5} min={0} max={24} />
                <Stepper label="Stress" value={draft.stress} onChange={(v) => patchDraft({ stress: v })} step={1} min={0} max={10} />
              </>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => commitAndClear(draft)} className="press-3d rounded-control">Add</Button>
            <Button variant="secondary" onClick={() => setDraft(null)} className="press-3d rounded-control">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Only kinds with numeric fields are worth the structured editor. */
function canEdit(r: CaptureResult): boolean {
  return r.kind === 'gym' || r.kind === 'cardio' || r.kind === 'metric'
}
