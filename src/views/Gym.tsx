import { useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { MuscleMap, targetMuscles } from '../components/MuscleMap'
import { ExerciseDB } from '../components/ExerciseDB'
import { cat } from '../lib/colors'
import { prettyDay, todayISO } from '../lib/date'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, personalRecords, SPLITS, splitMeta, nextSplit,
} from '../lib/fitness'
import type { Split } from '../lib/types'

interface SetRow {
  exercise: string
  weight: string
  reps: string
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
      .map((r, i) => `${r.exercise.trim()} ${i + 1}x${r.reps || '?'} @ ${r.weight || '0'}kg`)
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
        subtitle={<span>Suggested next: <span style={{ color: cat(splitMeta(suggested).color) }}>{splitMeta(suggested).icon} {splitMeta(suggested).label}</span></span>}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {SPLITS.filter((s) => s.id !== 'other').map((s) => (
            <button
              key={s.id}
              onClick={() => setSplit(s.id)}
              className="rounded-lg px-3 py-1.5 text-sm"
              style={{
                background: split === s.id ? cat(s.color) : cat('surface0'),
                color: split === s.id ? cat('crust') : cat('subtext1'),
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
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
          <div className="grid grid-cols-[1fr_70px_70px_28px] gap-2 text-xs text-overlay0">
            <span>Exercise</span><span>Weight</span><span>Reps</span><span />
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_70px_28px] gap-2">
              <input
                list="exercise-library"
                value={row.exercise}
                onChange={(e) => setRow(i, { exercise: e.target.value })}
                placeholder="Exercise"
                className="rounded-lg border border-surface1 bg-base px-2 py-1.5 text-sm text-text"
              />
              <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder="kg" className="py-1.5" />
              <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" className="py-1.5" />
              <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className="text-overlay0 hover:text-red">×</button>
            </div>
          ))}
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

      {/* ── Exercise database (wger) ─────────────────────────── */}
      <Card title="Exercise database" subtitle="Search wger’s library and tap to add to today’s session">
        <ExerciseDB onPick={(name) => addRow(name)} />
      </Card>

      {/* ── Muscle map: where the pressure goes ──────────────── */}
      <Card
        title="Target muscles"
        subtitle={<span>What today's <span style={{ color: cat(splitMeta(split).color) }}>{splitMeta(split).label}</span> session works</span>}
      >
        <MuscleMap split={split} color={splitMeta(split).color} />
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {targetMuscles(split).length === 0 ? (
            <span className="text-xs text-overlay0">Pick a split to see the worked muscles.</span>
          ) : (
            targetMuscles(split).map((m) => (
              <span key={m} className="rounded-full px-2.5 py-0.5 text-xs capitalize" style={{ background: cat(splitMeta(split).color) + '33', color: cat(splitMeta(split).color) }}>
                {m}
              </span>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Personal records ─────────────────────────────── */}
        <Card title="Personal records" subtitle="Heaviest logged lift per exercise">
          {prs.length === 0 ? (
            <Empty>Log sets like “Bench 5x5 @ 60kg” to track PRs.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {prs.map((pr) => (
                <li key={pr.exercise} className="flex items-center justify-between">
                  <span className="text-subtext1">🏆 {pr.exercise}</span>
                  <span className="text-overlay0"><span style={{ color: cat('yellow') }}>{pr.weight}kg</span> · {prettyDay(pr.date)}</span>
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
                return (
                  <li key={r.id} className="group flex items-center justify-between">
                    <span className="text-subtext1">
                      <span style={{ color: cat(m.color) }}>{m.icon}</span> {r.name}
                      <span className="ml-2 text-overlay0">{r.exercises.length} exercises</span>
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
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Today's weight (kg)" className="max-w-[200px]" />
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
