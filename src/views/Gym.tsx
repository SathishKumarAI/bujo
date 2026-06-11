import { useMemo, useState } from 'react'
import {
  ChevronsUp, ChevronsDown, Footprints, PersonStanding, MoveVertical, Flame,
  Activity, Trophy, Crosshair, X, Plus, Video, type LucideIcon,
} from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { MuscleMap, muscleNames, musclesForSplit } from '../components/MuscleMap'
import { ExerciseDB } from '../components/ExerciseDB'
import { cat } from '../lib/colors'
import { prettyDay, todayISO } from '../lib/date'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, personalRecords, SPLITS, splitMeta, nextSplit,
  musclesForExercise,
} from '../lib/fitness'
import { cachedMusclesForName } from '../lib/wger'
import type { Split } from '../lib/types'

interface SetRow {
  exercise: string
  weight: string
  reps: string
}

const SPLIT_ICONS: Record<string, LucideIcon> = {
  push: ChevronsUp, pull: ChevronsDown, legs: Footprints,
  upper: PersonStanding, lower: MoveVertical, full: Flame, other: Activity,
}

export function Gym() {
  const { data, addWorkout, addRoutine, removeRoutine, setBodyMetric } = useJournal()
  const suggested = useMemo(() => nextSplit(data), [data])
  const [split, setSplit] = useState<Split>(suggested)
  const [rows, setRows] = useState<SetRow[]>([{ exercise: '', weight: '', reps: '' }])
  const [routineName, setRoutineName] = useState('')

  // Body metrics quick entry.
  const [weight, setWeight] = useState('')
  const prs = personalRecords(data)
  const unit = data.settings.weightUnit

  // Muscle focus: a clicked PR/exercise overrides the session/split view.
  const [focusEx, setFocusEx] = useState<string | null>(null)
  const sessionMuscles = [...new Set(rows.flatMap((r) => (r.exercise.trim() ? musclesForExercise(r.exercise) : [])))]
  // For a focused exercise prefer wger's exact muscles (when the catalogue is
  // cached from a prior search); otherwise fall back to the keyword mapper.
  const activeMuscles = focusEx
    ? cachedMusclesForName(focusEx) ?? musclesForExercise(focusEx)
    : sessionMuscles.length
      ? sessionMuscles
      : musclesForSplit(split)
  const focusLabel = focusEx
    ? focusEx
    : sessionMuscles.length
      ? "today's exercises"
      : `${splitMeta(split).label} split`

  function setRow(i: number, patch: Partial<SetRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }
  function addRow(exercise = '') {
    setRows((r) => [...r, { exercise, weight: '', reps: '' }])
  }
  function loadRoutine(exs: string[], s: Split) {
    setSplit(s)
    setRows(exs.map((exercise) => ({ exercise, weight: '', reps: '' })))
  }

  function finish() {
    const sets = rows
      .filter((r) => r.exercise.trim())
      .map((r, i) => `${r.exercise.trim()} ${i + 1}x${r.reps || '?'} @ ${r.weight || '0'}${unit}`)
    if (sets.length === 0) return
    addWorkout({
      date: todayISO(),
      activity: `${splitMeta(split).label} day`,
      split,
      sets,
      notes: '',
    })
    setRows([{ exercise: '', weight: '', reps: '' }])
  }

  function saveAsRoutine() {
    const exercises = rows.map((r) => r.exercise.trim()).filter(Boolean)
    if (!routineName.trim() || exercises.length === 0) return
    addRoutine({ name: routineName.trim(), split, exercises })
    setRoutineName('')
  }

  // Body-weight chart.
  const weightSeries = [...data.bodyMetrics]
    .filter((b) => b.weight != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((b) => ({ date: b.date.slice(5), weight: b.weight }))

  return (
    <div className="space-y-4">
      {/* ── Session logger ─────────────────────────────────── */}
      <Card
        title="Today's session"
        subtitle={<span>Suggested next: <span style={{ color: cat(splitMeta(suggested).color) }}>{splitMeta(suggested).label}</span></span>}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {SPLITS.filter((s) => s.id !== 'other').map((s) => {
            const Icon = SPLIT_ICONS[s.id] ?? Activity
            return (
              <button
                key={s.id}
                onClick={() => setSplit(s.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
                style={{
                  background: split === s.id ? cat(s.color) : cat('surface0'),
                  color: split === s.id ? cat('crust') : cat('subtext1'),
                }}
              >
                <Icon size={15} /> {s.label}
              </button>
            )
          })}
        </div>

        <div className="mb-2 flex flex-wrap gap-2">
          <span className="text-xs text-overlay0">Quick-load:</span>
          {PPL_PRESETS.map((p) => (
            <button key={p.name} onClick={() => loadRoutine(p.exercises, p.split)} className="text-xs text-mauve hover:underline">
              {p.name}
            </button>
          ))}
          {data.routines.map((r) => (
            <button key={r.id} onClick={() => loadRoutine(r.exercises, r.split)} className="text-xs text-sapphire hover:underline">
              {r.name}
            </button>
          ))}
        </div>

        <datalist id="exercise-library">
          {EXERCISE_LIBRARY.map((e) => <option key={e} value={e} />)}
        </datalist>

        <div className="space-y-2">
          <div className="grid grid-cols-[28px_1fr_64px_64px_28px] gap-2 text-xs text-overlay0">
            <span /><span>Exercise</span><span>Weight</span><span>Reps</span><span />
          </div>
          {rows.map((row, i) => {
            const focused = !!row.exercise.trim() && focusEx === row.exercise
            return (
              <div key={i} className="grid grid-cols-[28px_1fr_64px_64px_28px] items-center gap-2">
                <button
                  onClick={() => setFocusEx(focused ? null : row.exercise.trim() || null)}
                  disabled={!row.exercise.trim()}
                  aria-label="Focus muscle map on this exercise"
                  title="Show this exercise on the muscle map"
                  className="grid h-7 w-7 place-items-center rounded-lg disabled:opacity-30"
                  style={{ background: focused ? cat('mauve') : cat('surface0'), color: focused ? cat('crust') : cat('overlay1') }}
                >
                  <Crosshair size={14} />
                </button>
                <input
                  list="exercise-library"
                  value={row.exercise}
                  onChange={(e) => setRow(i, { exercise: e.target.value })}
                  placeholder="Exercise"
                  className="rounded-lg border border-surface1 bg-base px-2 py-1.5 text-sm text-text"
                />
                <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder={unit} className="py-1.5" />
                <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" className="py-1.5" />
                <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className="grid h-7 w-7 place-items-center text-overlay0 hover:text-red"><X size={15} /></button>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => addRow()}>+ Add set</Button>
          <Button variant="primary" onClick={finish}>Finish session</Button>
          <div className="ml-auto flex gap-2">
            <Input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Save as routine…" className="max-w-[160px] py-1.5" />
            <Button onClick={saveAsRoutine}>Save routine</Button>
          </div>
        </div>
      </Card>

      {/* ── Single-exercise anatomy ──────────────────────────── */}
      <Card
        title={focusEx ? focusEx : 'Exercise anatomy'}
        subtitle={
          focusEx
            ? 'Muscles worked by this exercise'
            : <span>Showing your <span style={{ color: cat(splitMeta(split).color) }}>{focusLabel}</span> — or look up one below</span>
        }
        right={focusEx && <Button onClick={() => setFocusEx(null)} className="inline-flex items-center gap-1.5"><X size={14} /> Clear</Button>}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            list="exercise-library"
            value={focusEx ?? ''}
            onChange={(e) => setFocusEx(e.target.value || null)}
            placeholder="Look up any exercise (e.g. Bench Press, Squat)…"
            className="max-w-xs flex-1 rounded-lg border border-surface1 bg-base px-3 py-2 text-sm text-text"
          />
          {focusEx && musclesForExercise(focusEx).length > 0 && (
            <Button variant="primary" onClick={() => { addRow(focusEx); }} className="inline-flex items-center gap-1.5">
              <Plus size={14} /> Add to session
            </Button>
          )}
          {focusEx && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focusEx + ' exercise form')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-red hover:underline"
            >
              <Video size={16} /> Watch on YouTube
            </a>
          )}
        </div>

        <MuscleMap muscles={activeMuscles} />

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {activeMuscles.length === 0 ? (
            <span className="text-xs text-overlay0">Type an exercise above, pick a split, or tap a set row’s target.</span>
          ) : (
            muscleNames(activeMuscles).map((m) => (
              <span key={m} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: cat(splitMeta(split).color) + '33', color: cat(splitMeta(split).color) }}>
                {m}
              </span>
            ))
          )}
        </div>
      </Card>

      {/* ── Exercise database (wger) ─────────────────────────── */}
      <Card title="Exercise database" subtitle="Search wger’s library — tap a card to view it, then add to your session">
        <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Personal records ─────────────────────────────── */}
        <Card title="Personal records" subtitle="Heaviest logged lift per exercise">
          {prs.length === 0 ? (
            <Empty>Log sets like “Bench 5x5 @ 60kg” to track PRs.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {prs.map((pr) => (
                <li key={pr.exercise}>
                  <button
                    onClick={() => setFocusEx(focusEx === pr.exercise ? null : pr.exercise)}
                    className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${focusEx === pr.exercise ? 'bg-surface0' : 'hover:bg-surface0/50'}`}
                    title="Show this lift on the muscle map"
                  >
                    <span className="inline-flex items-center gap-1.5 text-subtext1"><Trophy size={14} style={{ color: cat('yellow') }} /> {pr.exercise}</span>
                    <span className="text-overlay0"><span style={{ color: cat('yellow') }}>{pr.weight}{unit}</span> · {prettyDay(pr.date)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Saved routines ───────────────────────────────── */}
        <Card title="Saved routines">
          {data.routines.length === 0 ? (
            <Empty>Build a session above and “Save routine”. PPL presets are quick-loadable.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.routines.map((r) => {
                const m = splitMeta(r.split)
                const Icon = SPLIT_ICONS[r.split] ?? Activity
                return (
                  <li key={r.id} className="group flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-subtext1">
                      <Icon size={14} style={{ color: cat(m.color) }} /> {r.name}
                      <span className="ml-1 text-overlay0">{r.exercises.length} exercises</span>
                    </span>
                    <button onClick={() => removeRoutine(r.id)} aria-label="Delete routine" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Body metrics ─────────────────────────────────── */}
      <Card title="Body weight" subtitle="Track the trend">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={`Today's weight (${unit})`} className="max-w-[200px]" />
          <Button
            variant="primary"
            onClick={() => { if (weight) { setBodyMetric(todayISO(), { weight: Number(weight) }); setWeight('') } }}
          >
            Log weight
          </Button>
        </div>
        {weightSeries.length < 2 ? (
          <Empty>Log your weight on a couple of days to see the trend.</Empty>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
                <Line type="monotone" dataKey="weight" stroke={cat('mauve')} dot={{ r: 2 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
