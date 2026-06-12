import { useMemo, useState } from 'react'
import {
  ChevronsUp, ChevronsDown, Footprints, PersonStanding, MoveVertical, Flame,
  Activity, Trophy, Crosshair, X, Plus, Video, type LucideIcon,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { Page } from '../components/shell/Page'
import { MuscleMap, muscleNames, musclesForSplit } from '../components/MuscleMap'
import { ExerciseDB } from '../components/ExerciseDB'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { ProgramTracker } from '../components/ProgramTracker'
import { exerciseInfo } from '../lib/exerciseInfo'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, personalRecords, SPLITS, splitMeta, nextSplit,
  musclesForExercise, epley1RM, platesPerSide, lastSetFor, parseSet,
  weeklyVolumeSeries, exerciseProgression,
} from '../lib/fitness'
import { cachedMusclesForName } from '../lib/wger'
import type { Routine, Split, WorkoutSet } from '../lib/types'

interface SetRow {
  exercise: string
  weight: string
  reps: string
  rpe?: string
  kind?: 'warmup' | 'working' | 'drop'
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

  // Recently-logged exercise names (newest first) for the quick picker.
  const recentExercises = useMemo(() => {
    const names: string[] = []
    for (const w of [...data.workouts].sort((a, b) => (a.date < b.date ? 1 : -1))) {
      for (const r of w.setRows ?? []) if (r.exercise) names.push(r.exercise)
      for (const line of w.sets) { const p = parseSet(line); if (p) names.push(p.exercise) }
    }
    return [...new Set(names)].slice(0, 12)
  }, [data.workouts])

  const volumeSeries = useMemo(() => weeklyVolumeSeries(data), [data])

  // Muscle focus: a clicked PR/exercise overrides the session/split view.
  const [focusEx, setFocusEx] = useState<string | null>(null)
  const progression = focusEx ? exerciseProgression(data, focusEx) : []
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
    const valid = rows.filter((r) => r.exercise.trim())
    const sets = valid.map((r, i) => `${r.exercise.trim()} ${i + 1}x${r.reps || '?'} @ ${r.weight || '0'}${unit}`)
    if (sets.length === 0) return
    // Structured rows for analytics (volume / progression / previous-session).
    const structured: WorkoutSet[] = valid.map((r) => ({
      exercise: r.exercise.trim(),
      weight: r.weight ? Number(r.weight) : undefined,
      reps: r.reps ? Number(r.reps) : undefined,
      rpe: r.rpe ? Number(r.rpe) : undefined,
      kind: r.kind ?? 'working',
    }))
    addWorkout({
      date: todayISO(),
      activity: `${splitMeta(split).label} day`,
      split,
      sets,
      setRows: structured,
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

  // Anatomy lookup — lives in the right rail (aside) so it stays visible while logging.
  const anatomyCard = (
    <Card
      title={focusEx ? focusEx : 'Exercise anatomy'}
      subtitle={
        focusEx
          ? 'Muscles worked by this exercise'
          : <span>Showing your <span style={{ color: cat(splitMeta(split).color) }}>{focusLabel}</span> — or look one up</span>
      }
      right={focusEx && <Button onClick={() => setFocusEx(null)} className="inline-flex items-center gap-1.5"><X size={14} /> Clear</Button>}
    >
      <div className="mb-3 space-y-2">
        <ExercisePicker
          value={focusEx ?? ''}
          onPick={(name) => setFocusEx(name || null)}
          library={EXERCISE_LIBRARY}
          recents={recentExercises}
        />
        <div className="flex flex-wrap items-center gap-2">
          {focusEx && musclesForExercise(focusEx).length > 0 && (
            <Button variant="primary" onClick={() => { addRow(focusEx) }} className="inline-flex items-center gap-1.5">
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
              <Video size={16} /> YouTube
            </a>
          )}
        </div>
      </div>

      <MuscleMap muscles={activeMuscles} />

      {focusEx && exerciseInfo(focusEx) && (
        <div className="mt-3 space-y-1 rounded-lg border border-surface0 bg-base p-2.5 text-xs">
          <p className="text-subtext0"><span className="font-medium text-green">Cue:</span> {exerciseInfo(focusEx)!.cue}</p>
          <p className="text-subtext0"><span className="font-medium text-peach">Watch:</span> {exerciseInfo(focusEx)!.watch}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {activeMuscles.length === 0 ? (
          <span className="text-xs text-overlay0">Type an exercise, pick a split, or tap a set row’s target.</span>
        ) : (
          muscleNames(activeMuscles).map((m) => (
            <span key={m} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: cat(splitMeta(split).color) + '33', color: cat(splitMeta(split).color) }}>
              {m}
            </span>
          ))
        )}
      </div>
    </Card>
  )

  return (
    <Page
      aside={
        <>
          {anatomyCard}
          <Card title="Rest timer" subtitle="Between-sets countdown"><RestTimer /></Card>
          <PlateCalculator key={unit} unit={unit} />
          <PersonalRecords prs={prs} focusEx={focusEx} setFocusEx={setFocusEx} unit={unit} />
          <SavedRoutines routines={data.routines} onRemove={removeRoutine} onLoad={loadRoutine} />
        </>
      }
    >
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
          <div className="grid grid-cols-[28px_1fr_52px_44px_40px_36px_28px] gap-2 text-xs text-overlay0">
            <span /><span>Exercise</span><span>Weight</span><span>Reps</span><span>RPE</span><span>Type</span><span />
          </div>
          {rows.map((row, i) => {
            const focused = !!row.exercise.trim() && focusEx === row.exercise
            const prev = row.exercise.trim() ? lastSetFor(data, row.exercise) : null
            const oneRM = row.weight && row.reps ? epley1RM(Number(row.weight), Number(row.reps)) : null
            const kind = row.kind ?? 'working'
            const kindMeta = { working: { label: '•', color: 'mauve', title: 'Working set' }, warmup: { label: 'W', color: 'blue', title: 'Warm-up' }, drop: { label: 'D', color: 'peach', title: 'Drop set' } }[kind]
            const nextKind = { working: 'warmup', warmup: 'drop', drop: 'working' }[kind] as SetRow['kind']
            return (
              <div key={i}>
                <div className="grid grid-cols-[28px_1fr_52px_44px_40px_36px_28px] items-center gap-2">
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
                <ExercisePicker
                  value={row.exercise}
                  onPick={(name) => setRow(i, { exercise: name })}
                  library={EXERCISE_LIBRARY}
                  recents={recentExercises}
                />
                <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder={unit} className="py-1.5" />
                <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" className="py-1.5" />
                <Input type="number" value={row.rpe ?? ''} onChange={(e) => setRow(i, { rpe: e.target.value })} placeholder="—" aria-label="RPE" className="py-1.5" />
                <button onClick={() => setRow(i, { kind: nextKind })} title={kindMeta.title} aria-label={`Set type: ${kindMeta.title}`} className="grid h-7 w-8 place-items-center rounded-lg text-xs font-bold" style={{ background: cat('surface0'), color: cat(kindMeta.color) }}>{kindMeta.label}</button>
                <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className="grid h-7 w-7 place-items-center text-overlay0 hover:text-red"><X size={15} /></button>
                </div>
                {(prev || oneRM) && (
                  <div className="mt-0.5 ml-9 flex gap-3 text-[10px] text-overlay0">
                    {prev && <span>last: {prev.weight}{unit}×{prev.reps}</span>}
                    {oneRM && <span style={{ color: cat('mauve') }}>1RM ~{oneRM}{unit}</span>}
                  </div>
                )}
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

      {/* ── Training program ─────────────────────────────────── */}
      <ProgramTracker only="hyper12" onLoad={(exs) => loadRoutine(exs, 'other')} />

      {/* ── Exercise database (wger) ─────────────────────────── */}
      <Card title="Exercise database" subtitle="Search wger’s library — tap a card to view it, then add to your session">
        <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
      </Card>

      {/* ── Body weight + training volume, side by side ──────── */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
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
          <div className="h-56" role="img" aria-label={`Line chart of body weight over ${weightSeries.length} logged days (${unit})`}>
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

      {/* ── Training volume + per-exercise progression ───────── */}
      <Card title="Training volume" subtitle={focusEx ? `Weekly volume · ${focusEx}` : 'Weekly working-set volume (weight × reps)'}>
        <div className="h-48" role="img" aria-label={focusEx ? `Bar chart of weekly training volume for ${focusEx}` : 'Bar chart of weekly working-set volume (weight × reps)'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeSeries} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} />
              <YAxis stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
              <Bar dataKey="volume" fill={cat('mauve')} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {focusEx && progression.length > 1 && (
          <div className="mt-4 h-40 border-t border-surface0 pt-3" role="img" aria-label={`Line chart of the heaviest ${focusEx} set per day (${unit})`}>
            <p className="mb-1 text-xs text-overlay0">{focusEx} — heaviest set per day ({unit})</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
                <Line type="monotone" dataKey="weight" stroke={cat('green')} dot={{ r: 2 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      </div>

      {/* ── Progress photos ──────────────────────────────────── */}
      <ProgressPhotos />
    </Page>
  )
}

/** Greedy plate-loading helper: target weight → plates per side. */
function PlateCalculator({ unit }: { unit: string }) {
  const [target, setTarget] = useState('100')
  const [bar, setBar] = useState(unit === 'lb' ? '45' : '20')
  // Plate denominations differ by unit (kg gym plates vs lb).
  const denoms = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
  const plates = platesPerSide(Number(target) || 0, Number(bar) || 0, denoms)
  const loadable = plates.reduce((a, p) => a + p, 0) * 2 + (Number(bar) || 0)
  return (
    <Card title="Plate calculator" subtitle="What to load on the bar">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="block text-sm text-subtext1">Target ({unit})<Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-28" /></label>
        <label className="block text-sm text-subtext1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 w-24" /></label>
      </div>
      {plates.length === 0 ? (
        <p className="text-sm text-overlay0">Just the bar — no plates needed.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-overlay0">Per side:</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {plates.map((p, i) => (
              <span key={i} className="grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm font-bold text-crust" style={{ background: cat(['mauve', 'blue', 'green', 'peach', 'teal', 'pink'][i % 6]) }}>{p}</span>
            ))}
          </div>
          {loadable !== Number(target) && <p className="mt-2 text-xs text-yellow">Closest loadable: {loadable} {unit}</p>}
        </>
      )}
    </Card>
  )
}

function PersonalRecords({ prs, focusEx, setFocusEx, unit }: { prs: import('../lib/fitness').PR[]; focusEx: string | null; setFocusEx: (e: string | null) => void; unit: string }) {
  return (
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
                <span className="text-overlay0">
                  <span style={{ color: cat('yellow') }}>{pr.weight}{unit}</span>
                  {pr.reps > 1 && <span className="ml-1" title="estimated 1-rep max">· 1RM ~{epley1RM(pr.weight, pr.reps)}{unit}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function SavedRoutines({ routines, onRemove, onLoad }: { routines: Routine[]; onRemove: (id: string) => void; onLoad: (exs: string[], split: Split) => void }) {
  return (
    <Card title="Saved routines">
      {routines.length === 0 ? (
        <Empty>Build a session and “Save routine”. PPL presets are quick-loadable.</Empty>
      ) : (
        <ul className="space-y-1 text-sm">
          {routines.map((r) => {
            const m = splitMeta(r.split)
            const Icon = SPLIT_ICONS[r.split] ?? Activity
            return (
              <li key={r.id} className="group flex items-center justify-between">
                <button onClick={() => onLoad(r.exercises, r.split)} className="inline-flex items-center gap-1.5 text-left text-subtext1 hover:text-text" title="Load into session">
                  <Icon size={14} style={{ color: cat(m.color) }} /> {r.name}
                  <span className="ml-1 text-overlay0">{r.exercises.length} exercises</span>
                </button>
                <button onClick={() => onRemove(r.id)} aria-label="Delete routine" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
