import { useEffect, useMemo, useState } from 'react'
import {
  ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, Footprints, PersonStanding, MoveVertical, Flame,
  Activity, Trophy, Crosshair, X, Plus, Video, RotateCcw, Check, Layers, Dumbbell,
  Scale, TrendingDown, AlertTriangle, Repeat, CalendarCheck, HeartPulse, type LucideIcon,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, StatTile } from '../components/ui'
import { Page } from '../components/shell/Page'
import { MuscleMap, muscleNames, musclesForSplit } from '../components/MuscleMap'
import { ExerciseDB } from '../components/ExerciseDB'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { ProgramTracker } from '../components/ProgramTracker'
import { VideoLink } from '../components/VideoLink'
import { exerciseInfo } from '../lib/exerciseInfo'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, personalRecords, SPLITS, splitMeta, nextSplit,
  musclesForExercise, epley1RM, platesPerSide, barExceedsTarget, lastSetFor, parseSet,
  weeklyVolumeSeries, exerciseProgression, isNewPR, warmupRamp, sessionSummary,
  weeklySetsPerMuscle, e1rmProgression, MUSCLE_SET_LANDMARK,
  bigThreeTotal, relativeStrength, neglectedMuscles, stalledLifts,
  repPRs, volumeByCategory, muscleRecovery, exerciseFrequency, trainRestRatio,
} from '../lib/fitness'
import { PlateStack, plateColor } from '../components/PlateStack'
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
  // Ephemeral PR celebration after a set is saved (local state, auto-dismisses).
  const [prParty, setPrParty] = useState<{ exercise: string; weight: number; reps: number } | null>(null)
  // Post-finish session rollup (volume · sets · top set), shown until the next edit.
  const [summary, setSummary] = useState<ReturnType<typeof sessionSummary> | null>(null)

  // Body metrics quick entry.
  const [weight, setWeight] = useState('')
  const prs = personalRecords(data)
  const unit = data.settings.weightUnit
  // Bar + smallest-plate step default per unit, for the auto warm-up generator.
  const defaultBar = unit === 'lb' ? 45 : 20
  const warmStep = unit === 'lb' ? 5 : 2.5

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
  // Collapse the session logger by default on phones to keep the view compact.
  const [sessionOpen, setSessionOpen] = useState(typeof window === 'undefined' || window.innerWidth >= 640)
  const progression = focusEx ? exerciseProgression(data, focusEx) : []
  // Estimated-1RM trend for the focused lift (credits rep PRs, not just top weight).
  const e1rmProg = focusEx ? e1rmProgression(data, focusEx) : []
  // Weekly hard-sets per muscle — hypertrophy volume balance (read-only).
  const muscleSets = useMemo(() => weeklySetsPerMuscle(data), [data])
  // Strength snapshots (all read-only, derived from logged PRs / bodyweight).
  const bigThree = useMemo(() => bigThreeTotal(data), [data])
  const relStrength = useMemo(() => relativeStrength(data), [data])
  const neglected = useMemo(() => neglectedMuscles(data), [data])
  const stalled = useMemo(() => stalledLifts(data), [data])
  // Movement-balance radar + recovery readiness + frequency/consistency (read-only).
  const categoryVolume = useMemo(() => volumeByCategory(data), [data])
  const recovery = useMemo(() => muscleRecovery(data), [data])
  const frequency = useMemo(() => exerciseFrequency(data), [data])
  const trainRest = useMemo(() => trainRestRatio(data), [data])
  // Rep records for the focused lift (best reps at each weight).
  const repRecords = focusEx ? repPRs(data, focusEx) : []
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

  // Auto-dismiss the PR celebration (~3s), mirroring MilestoneToast's timing.
  useEffect(() => {
    if (!prParty) return
    const t = setTimeout(() => setPrParty(null), 3000)
    return () => clearTimeout(t)
  }, [prParty])

  function setRow(i: number, patch: Partial<SetRow>) {
    setSummary(null) // editing a new session dismisses the previous rollup
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
    // Legacy "NxM @ w" set-string: parseSet() reads M (the number after `x`)
    // as reps. One row = one set, so N = 1 (set count) and M = actual reps —
    // previously N held the loop index, leaving the rep slot wrong.
    const sets = valid.map((r) => `${r.exercise.trim()} 1x${r.reps || '?'} @ ${r.weight || '0'}${unit}`)
    if (sets.length === 0) return
    // Structured rows for analytics (volume / progression / previous-session).
    const structured: WorkoutSet[] = valid.map((r) => ({
      exercise: r.exercise.trim(),
      weight: r.weight ? Number(r.weight) : undefined,
      reps: r.reps ? Number(r.reps) : undefined,
      rpe: r.rpe ? Number(r.rpe) : undefined,
      kind: r.kind ?? 'working',
    }))
    // Detect a fresh PR *before* this session is committed (compare vs prior data).
    // The biggest 1RM-improving set wins the celebration.
    let pr: { exercise: string; weight: number; reps: number } | null = null
    let prGain = 0
    for (const r of valid) {
      if (r.kind === 'warmup') continue
      const w = Number(r.weight), reps = Number(r.reps)
      if (!(w > 0) || !(reps > 0)) continue
      if (isNewPR(data, r.exercise.trim(), w, reps)) {
        const gain = epley1RM(w, reps)
        if (gain >= prGain) { prGain = gain; pr = { exercise: r.exercise.trim(), weight: w, reps } }
      }
    }
    addWorkout({
      date: todayISO(),
      activity: `${splitMeta(split).label} day`,
      split,
      sets,
      setRows: structured,
      notes: '',
    })
    setSummary(sessionSummary(structured))
    setRows([{ exercise: '', weight: '', reps: '' }])
    if (pr) setPrParty(pr)
  }

  function saveAsRoutine() {
    const exercises = rows.map((r) => r.exercise.trim()).filter(Boolean)
    if (!routineName.trim() || exercises.length === 0) return
    addRoutine({ name: routineName.trim(), split, exercises })
    setRoutineName('')
  }

  // Body-weight chart.
  const weightRaw = [...data.bodyMetrics]
    .filter((b) => b.weight != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  // Session RPE over time (perceived exertion trend).
  const rpeSeries = [...data.workouts]
    .filter((w) => w.rpe != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-20)
    .map((w) => ({ date: w.date.slice(5), rpe: w.rpe }))

  // 7-point trailing moving average smooths daily fluctuation.
  const weightSeries = weightRaw.map((b, i) => {
    const win = weightRaw.slice(Math.max(0, i - 6), i + 1)
    const avg = win.reduce((s, x) => s + (x.weight ?? 0), 0) / win.length
    return { date: b.date.slice(5), weight: b.weight, avg: Math.round(avg * 10) / 10 }
  })

  // Anatomy lookup · lives in the right rail (aside) so it stays visible while logging.
  const anatomyCard = (
    <Card
      title={focusEx ? focusEx : 'Exercise anatomy'}
      subtitle={
        focusEx
          ? 'Muscles worked by this exercise'
          : <span>Showing your <span style={{ color: cat(splitMeta(split).color) }}>{focusLabel}</span> · or look one up</span>
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
      {/* ── PR celebration · ephemeral, auto-dismissing (F2) ── */}
      {prParty && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] grid place-items-center px-4" role="status" aria-live="polite">
          <div className="celebrate-pop flex items-center gap-2 rounded-2xl border border-surface1 bg-mantle/95 px-5 py-3 text-center shadow-2xl backdrop-blur">
            <Trophy size={20} style={{ color: cat('yellow') }} />
            <p className="text-sm font-medium text-text">
              New PR · <span style={{ color: cat('yellow') }}>{prParty.exercise}</span>{' '}
              {prParty.weight}{unit}×{prParty.reps} 🎉
            </p>
          </div>
        </div>
      )}

      {/* ── Last session rollup · shown after Finish, until the next edit ── */}
      {summary && summary.sets > 0 && (
        <Card title="Session logged" subtitle="Your last finished workout at a glance" right={<button onClick={() => setSummary(null)} aria-label="Dismiss summary" className="text-overlay0 hover:text-text"><X size={16} /></button>}>
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={<Dumbbell size={16} />} color="mauve" value={summary.volume.toLocaleString()} label={`${unit} volume`} />
            <StatTile icon={<Layers size={16} />} color="blue" value={summary.sets} label={summary.sets === 1 ? 'working set' : 'working sets'} />
            <StatTile
              icon={<Trophy size={16} />}
              color="yellow"
              value={summary.topSet ? `${summary.topSet.weight}${unit}` : '—'}
              label={summary.topSet ? `top · ${summary.topSet.exercise}` : 'top set'}
              title={summary.topSet ? `${summary.topSet.exercise} ${summary.topSet.weight}${unit}×${summary.topSet.reps}` : undefined}
            />
          </div>
        </Card>
      )}

      {/* ── Session logger ─────────────────────────────────── */}
      <Card
        title="Today's session"
        subtitle={<span>Suggested next: <span style={{ color: cat(splitMeta(suggested).color) }}>{splitMeta(suggested).label}</span></span>}
        right={
          <button onClick={() => setSessionOpen((o) => !o)} aria-expanded={sessionOpen} aria-label={sessionOpen ? 'Collapse session' : 'Expand session'} className="text-overlay0 hover:text-text">
            {sessionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        }
      >
        {sessionOpen && (<>
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
            // Strong-style "completed set" · a filled weight+reps row reads as done (green accent).
            const complete = !!(row.weight.trim() && row.reps.trim())
            return (
              <div key={i} className={`-ml-2 rounded-lg border-l-2 pl-2 transition-colors ${complete ? 'border-green bg-green/5' : 'border-transparent'}`}>
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
                {(prev || oneRM || row.exercise.trim()) && (
                  <div className="mt-0.5 ml-9 flex items-center gap-3 text-[10px] text-overlay0">
                    {prev && (
                      <button
                        type="button"
                        onClick={() => setRow(i, { weight: String(prev.weight ?? ''), reps: String(prev.reps ?? '') })}
                        title="Repeat last set · fill weight & reps"
                        className="inline-flex items-center gap-1 hover:text-mauve"
                      >
                        <RotateCcw size={10} /> last: {prev.weight}{unit}×{prev.reps}
                      </button>
                    )}
                    {oneRM && <span style={{ color: cat('mauve') }}>1RM ~{oneRM}{unit}</span>}
                    {complete && <span className="inline-flex items-center gap-0.5" style={{ color: cat('green') }}><Check size={11} /> logged</span>}
                    {row.exercise.trim() && <VideoLink name={row.exercise.trim()} size={10} className="text-[10px]" />}
                  </div>
                )}
                {/* Auto warm-up ramp · bar/40/60/80% of a working weight. Tap a rung to insert it as a warm-up set. */}
                {kind === 'working' && (() => {
                  const ramp = warmupRamp(Number(row.weight) || 0, defaultBar, warmStep)
                  if (!ramp.length) return null
                  return (
                    <div className="mt-1 ml-9 flex flex-wrap items-center gap-1.5 text-[10px] text-overlay0">
                      <span className="inline-flex items-center gap-1" title="Auto warm-up ramp to this working weight">
                        <Layers size={11} style={{ color: cat('blue') }} /> Warm-up:
                      </span>
                      {ramp.map((r, ri) => (
                        <button
                          key={ri}
                          type="button"
                          onClick={() =>
                            setRows((rs) => {
                              const next = [...rs]
                              next.splice(i, 0, { exercise: row.exercise, weight: String(r.weight), reps: '', kind: 'warmup' })
                              return next
                            })
                          }
                          title={`Add ${r.weight}${unit} warm-up set`}
                          className="rounded-full px-2 py-0.5 transition-colors hover:text-text"
                          style={{ background: cat('blue') + '22', color: cat('blue') }}
                        >
                          {r.pct === 0 ? 'bar' : `${r.pct}%`} · {r.weight}{unit}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {(() => {
          // Strong-style live session tally: sets completed + total volume.
          const done = rows.filter((r) => r.weight.trim() && r.reps.trim())
          if (!done.length) return null
          const vol = Math.round(done.reduce((s, r) => s + Number(r.weight) * Number(r.reps), 0))
          return (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: cat('green') }}><Check size={12} /> {done.length} set{done.length === 1 ? '' : 's'}</span>
              <span className="text-overlay0">·</span>
              <span className="text-subtext1">{vol.toLocaleString()}{unit} volume</span>
            </div>
          )
        })()}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => addRow()}>+ Add set</Button>
          <Button variant="primary" onClick={finish}>Finish session</Button>
          <div className="ml-auto flex gap-2">
            <Input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Save as routine…" className="max-w-[160px] py-1.5" />
            <Button onClick={saveAsRoutine}>Save routine</Button>
          </div>
        </div>
        </>)}
      </Card>

      {/* ── Training program ─────────────────────────────────── */}
      <ProgramTracker only="hyper12" onLoad={(exs) => loadRoutine(exs, 'other')} />

      {/* ── Exercise database (wger) ─────────────────────────── */}
      <Card title="Exercise database" subtitle="Search wger’s library · tap a card to view it, then add to your session" collapsible defaultCollapsed>
        <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
      </Card>

      {/* ── Body weight + training volume, side by side ──────── */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card title="Body weight" subtitle="Faint = daily · bold = 7-day average" defer enlargeable>
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
                <Line type="monotone" dataKey="weight" stroke={cat('overlay1')} dot={{ r: 1.5 }} strokeWidth={1} opacity={0.5} />
                <Line type="monotone" dataKey="avg" stroke={cat('mauve')} dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Training volume + per-exercise progression ───────── */}
      <Card title="Training volume" subtitle={focusEx ? `Weekly volume · ${focusEx}` : 'Weekly working-set volume (weight × reps)'} defer enlargeable>
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
            <p className="mb-1 text-xs text-overlay0">{focusEx} · heaviest set per day ({unit})</p>
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
        {focusEx && e1rmProg.length > 1 && (
          <div className="mt-4 h-40 border-t border-surface0 pt-3" role="img" aria-label={`Line chart of estimated 1-rep max for ${focusEx} per day (${unit})`}>
            <p className="mb-1 text-xs text-overlay0">{focusEx} · estimated 1RM per day ({unit}) · credits rep PRs</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rmProg} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
                <Line type="monotone" dataKey="e1rm" stroke={cat('yellow')} dot={{ r: 2 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      </div>

      {/* ── Rep records for the focused lift · best reps at each weight ── */}
      {focusEx && repRecords.length > 0 && <RepPRCard exercise={focusEx} records={repRecords} unit={unit} />}

      {/* ── Weekly volume balance · hard sets per muscle vs hypertrophy landmark ── */}
      <MuscleVolumeBalance counts={muscleSets} setFocusEx={setFocusEx} />

      {/* ── Movement-balance radar + muscle-recovery readiness ── */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <MovementRadar data={categoryVolume} unit={unit} />
        <RecoveryMap recovery={recovery} setFocusEx={setFocusEx} />
      </div>

      {/* ── Exercise frequency + train/rest consistency ── */}
      <ExerciseFrequencyCard rows={frequency} ratio={trainRest} setFocusEx={setFocusEx} />

      {/* ── Strength snapshots · big-three total + relative strength ── */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <BigThreeCard total={bigThree} unit={unit} setFocusEx={setFocusEx} />
        <RelativeStrengthCard rows={relStrength} unit={unit} setFocusEx={setFocusEx} />
      </div>

      {/* ── Neglected-muscle alert + stalled-lift detector ── */}
      <NeglectedMuscles muscles={neglected} setFocusEx={setFocusEx} />
      <StalledLifts lifts={stalled} unit={unit} setFocusEx={setFocusEx} />

      {rpeSeries.length >= 2 && (
        <Card title="Effort trend (RPE)" subtitle="Perceived exertion per session · watch for over-reaching" defer enlargeable>
          <div className="h-44" role="img" aria-label={`Line chart of session RPE (1-10) over the last ${rpeSeries.length} workouts`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rpeSeries} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
                <Line type="monotone" dataKey="rpe" stroke={cat('red')} dot={{ r: 2 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Progress photos ──────────────────────────────────── */}
      <ProgressPhotos />
    </Page>
  )
}

/**
 * Rep records for the focused lift: the most reps ever done at each weight, so
 * high-rep gains register as PRs even when the bar weight is unchanged. Read-only
 * — derived from logged sets via repPRs.
 */
function RepPRCard({ exercise, records, unit }: { exercise: string; records: import('../lib/fitness').RepPR[]; unit: string }) {
  return (
    <Card title="Rep records" subtitle={<span>Best reps at each weight · <span className="text-mauve">{exercise}</span></span>} defer>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {records.slice(0, 9).map((r) => (
          <li key={r.weight} className="rounded-xl border border-surface0 bg-base px-3 py-2" title={`${r.reps} reps at ${r.weight}${unit} · set ${prettyDay(r.date)}`}>
            <p className="text-lg font-bold" style={{ color: cat('green') }}>{r.reps}<span className="ml-0.5 text-xs font-normal text-overlay0">reps</span></p>
            <p className="text-xs text-subtext1">@ {r.weight}{unit}</p>
            <p className="text-[10px] text-overlay0">{prettyDay(r.date)}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/**
 * Push/Pull/Legs/Core volume radar: this week's working-set volume by movement
 * category, so imbalances jump out as a lopsided shape. Read-only — derived via
 * volumeByCategory.
 */
function MovementRadar({ data, unit }: { data: import('../lib/fitness').CategoryVolume[]; unit: string }) {
  const total = data.reduce((s, c) => s + c.volume, 0)
  return (
    <Card title="Movement balance" subtitle="Weekly volume by push / pull / legs / core" defer>
      {total === 0 ? (
        <Empty>Log some working sets this week to see your movement balance.</Empty>
      ) : (
        <>
          <div className="h-56" role="img" aria-label={`Radar chart of weekly working-set volume by movement category (${unit}): ${data.map((c) => `${c.category} ${c.volume}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <PolarGrid stroke={cat('surface0')} />
                <PolarAngleAxis dataKey="category" tick={{ fill: cat('subtext0'), fontSize: 12 }} />
                <Radar dataKey="volume" stroke={cat('mauve')} fill={cat('mauve')} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-overlay0">
            {data.map((c) => (
              <span key={c.category}>{c.category} <span className="text-subtext1">{c.volume.toLocaleString()}{unit}</span></span>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

/**
 * Muscle-recovery readiness map: how long since each muscle was last trained,
 * coloured by readiness (fatigued today/yesterday → green when rested). Tap a
 * muscle to focus the anatomy map. Read-only — derived via muscleRecovery.
 */
function RecoveryMap({ recovery, setFocusEx }: { recovery: import('../lib/fitness').MuscleRecovery[]; setFocusEx: (e: string | null) => void }) {
  const named = recovery
    .map((r) => ({ ...r, name: muscleNames([r.muscle])[0] }))
    .filter((r) => r.name)
  const stateColor: Record<string, string> = { fresh: 'green', recovering: 'yellow', fatigued: 'red' }
  const stateLabel: Record<string, string> = { fresh: 'ready', recovering: 'recovering', fatigued: 'fatigued' }
  return (
    <Card title="Recovery readiness" subtitle="Time since each muscle was last trained · green = ready" defer right={<HeartPulse size={16} style={{ color: cat('green') }} />}>
      {named.length === 0 ? (
        <Empty>Log some working sets to see what's recovered and ready.</Empty>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {named.map((r) => {
            const color = stateColor[r.state]
            return (
              <button
                key={r.muscle}
                onClick={() => setFocusEx(r.name)}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                style={{ background: cat(color) + '22', color: cat(color) }}
                title={`${r.name}: ${r.daysSince == null ? 'never trained' : `last trained ${r.daysSince}d ago`} · ${stateLabel[r.state]}`}
              >
                {r.name}
                <span className="text-[10px] text-overlay0">{r.daysSince == null ? 'fresh' : `${r.daysSince}d`}</span>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/**
 * Exercise frequency (most-trained movements in the last 4 weeks) alongside a
 * train-vs-rest consistency readout. Tap an exercise to focus the muscle map.
 * Read-only — derived via exerciseFrequency + trainRestRatio.
 */
function ExerciseFrequencyCard({ rows, ratio, setFocusEx }: { rows: import('../lib/fitness').ExerciseFreq[]; ratio: import('../lib/fitness').TrainRestRatio; setFocusEx: (e: string | null) => void }) {
  if (rows.length === 0) return null
  const maxDays = Math.max(...rows.map((r) => r.days), 1)
  return (
    <Card title="Exercise frequency" subtitle={`Most-trained movements · last ${ratio.window} days`} defer>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-surface0 bg-base px-3 py-2 text-sm">
        <CalendarCheck size={16} style={{ color: cat('teal') }} />
        <span className="text-subtext1">
          <span className="font-semibold text-text">{ratio.trainDays}</span> train ·{' '}
          <span className="font-semibold text-text">{ratio.restDays}</span> rest
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-overlay0" title="Share of days trained in the window">
          <Repeat size={13} /> {Math.round(ratio.ratio * 100)}% active
        </span>
      </div>
      <ul className="space-y-2 text-sm">
        {rows.slice(0, 8).map((r) => (
          <li key={r.exercise} className="flex items-center gap-2">
            <button
              onClick={() => setFocusEx(r.exercise)}
              className="w-28 shrink-0 truncate text-left text-subtext1 hover:text-text"
              title={`Focus the muscle map on ${r.exercise}`}
            >
              {r.exercise}
            </button>
            <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-surface0">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.days / maxDays) * 100}%`, background: cat('blue') }} />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-overlay0">
              {r.days}d · {r.sets} set{r.sets === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
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
  const barOverTarget = barExceedsTarget(Number(target) || 0, Number(bar) || 0)
  return (
    <Card title="Plate calculator" subtitle="What to load on the bar">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="block text-sm text-subtext1">Target ({unit})<Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-28" /></label>
        <label className="block text-sm text-subtext1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 w-24" /></label>
      </div>
      {barOverTarget ? (
        <p className="text-sm text-yellow">Bar alone ({bar} {unit}) already exceeds target ({target} {unit}) — use a lighter bar.</p>
      ) : plates.length === 0 ? (
        <p className="text-sm text-overlay0">Just the bar · no plates needed.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-overlay0">Per side:</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {plates.map((p, i) => (
              <span key={i} className="grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm font-bold text-crust" style={{ background: plateColor(p) }}>{p}</span>
            ))}
          </div>
          <div className="mt-2"><PlateStack plates={plates} unit={unit} /></div>
          {loadable !== Number(target) && <p className="mt-2 text-xs text-yellow">Closest loadable: {loadable} {unit}</p>}
        </>
      )}
    </Card>
  )
}

/**
 * Weekly hard-sets per muscle vs the 10–20 hypertrophy landmark. Each muscle is
 * a horizontal bar coloured by zone (under / in-range / over), so imbalances and
 * under-trained groups jump out at a glance. Read-only — derived from this
 * week's logged working sets via weeklySetsPerMuscle.
 */
function MuscleVolumeBalance({ counts, setFocusEx }: { counts: import('../lib/fitness').MuscleSetCount[]; setFocusEx: (e: string | null) => void }) {
  const { min, max } = MUSCLE_SET_LANDMARK
  const named = counts
    .map((c) => ({ ...c, name: muscleNames([c.muscle])[0] }))
    .filter((c) => c.name) // skip ids without a display name
  const scaleMax = Math.max(max, ...named.map((c) => c.sets), 1)
  const zone = (sets: number) => (sets < min ? 'peach' : sets > max ? 'red' : 'green')
  const zoneLabel = (sets: number) => (sets < min ? 'below 10' : sets > max ? 'over 20' : 'in range')
  return (
    <Card title="Muscle volume balance" subtitle="Hard sets per muscle this week · target 10–20" defer>
      {named.length === 0 ? (
        <Empty>Log some working sets this week to see your per-muscle volume.</Empty>
      ) : (
        <ul className="space-y-2">
          {named.map((c) => {
            const color = zone(c.sets)
            return (
              <li key={c.muscle} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setFocusEx(c.name)}
                  className="w-20 shrink-0 truncate text-left text-subtext1 hover:text-text"
                  title={`Focus the muscle map on ${c.name}`}
                >
                  {c.name}
                </button>
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface0">
                  {/* landmark band (10–20 sets) shaded behind the bar */}
                  <div className="absolute inset-y-0" style={{ left: `${(min / scaleMax) * 100}%`, width: `${((max - min) / scaleMax) * 100}%`, background: cat('green') + '22' }} />
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (c.sets / scaleMax) * 100)}%`, background: cat(color) }} />
                </div>
                <span className="w-7 shrink-0 text-right font-medium" style={{ color: cat(color) }}>{c.sets}</span>
              </li>
            )
          })}
        </ul>
      )}
      {named.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-overlay0">
          <span style={{ color: cat('peach') }}>● {zoneLabel(0)}</span>
          <span style={{ color: cat('green') }}>● {zoneLabel(min)}</span>
          <span style={{ color: cat('red') }}>● {zoneLabel(max + 1)}</span>
        </p>
      )}
    </Card>
  )
}

/**
 * Big-three powerlifting total: best squat + bench + deadlift, with each lift's
 * PR and the running sum. Missing lifts show a dash and a hint to log them.
 * Read-only — derived from logged PRs via bigThreeTotal.
 */
function BigThreeCard({ total, unit, setFocusEx }: { total: import('../lib/fitness').BigThreeTotal; unit: string; setFocusEx: (e: string | null) => void }) {
  const liftColor: Record<string, string> = { Squat: 'green', Bench: 'red', Deadlift: 'blue' }
  return (
    <Card title="Big-three total" subtitle="Squat + bench + deadlift · your powerlifting number" defer>
      {total.total === 0 ? (
        <Empty>Log a squat, bench, and deadlift to build your total.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {total.lifts.map((l) => (
              <button
                key={l.lift}
                onClick={() => l.weight > 0 && setFocusEx(l.lift)}
                disabled={l.weight === 0}
                className="rounded-xl border border-surface0 bg-base px-3 py-2.5 text-left disabled:cursor-default"
                title={l.weight > 0 ? `Best ${l.lift}: ${l.weight}${unit}${l.date ? ` on ${l.date}` : ''}` : `No ${l.lift} logged yet`}
              >
                <p className="text-xs text-subtext1">{l.lift}</p>
                <p className="text-lg font-bold" style={{ color: l.weight > 0 ? cat(liftColor[l.lift]) : cat('overlay0') }}>
                  {l.weight > 0 ? `${l.weight}${unit}` : '—'}
                </p>
                {l.date && <p className="text-[10px] text-overlay0">{prettyDay(l.date)}</p>}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-surface0 pt-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-subtext1"><Trophy size={15} style={{ color: cat('yellow') }} /> Total</span>
            <span className="text-2xl font-bold" style={{ color: cat('yellow') }}>{total.total}{unit}</span>
          </div>
          {!total.complete && <p className="mt-1 text-[11px] text-overlay0">Log all three for your true total.</p>}
        </>
      )}
    </Card>
  )
}

/**
 * Relative strength: each PR as a multiple of the latest logged bodyweight, with
 * a strength-standard band. Hidden until a bodyweight is logged. Read-only.
 */
function RelativeStrengthCard({ rows, unit, setFocusEx }: { rows: import('../lib/fitness').RelativeStrength[]; unit: string; setFocusEx: (e: string | null) => void }) {
  const bandColor: Record<string, string> = { Elite: 'mauve', Advanced: 'blue', Intermediate: 'green', Novice: 'yellow', Beginner: 'overlay0' }
  return (
    <Card title="Relative strength" subtitle="Best lift ÷ bodyweight · with strength standard" defer>
      {rows.length === 0 ? (
        <Empty>Log your bodyweight and some PRs to see strength-to-weight ratios.</Empty>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.slice(0, 8).map((r) => (
            <li key={r.exercise}>
              <button
                onClick={() => setFocusEx(r.exercise)}
                className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-surface0/50"
                title={`${r.exercise}: ${r.weight}${unit} = ${r.ratio}× bodyweight`}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-subtext1">
                  <Scale size={14} style={{ color: cat('teal') }} /> <span className="truncate">{r.exercise}</span>
                </span>
                <span className="shrink-0 text-overlay0">
                  <span className="font-semibold" style={{ color: cat('text') }}>{r.ratio}×</span>
                  <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: cat(bandColor[r.band] ?? 'overlay0') + '22', color: cat(bandColor[r.band] ?? 'overlay0') }}>{r.band}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/**
 * Neglected-muscle alert: groups with zero working sets in the last 10 days, so
 * the user can rebalance. Shows days since each was last trained. Read-only.
 */
function NeglectedMuscles({ muscles, setFocusEx }: { muscles: import('../lib/fitness').NeglectedMuscle[]; setFocusEx: (e: string | null) => void }) {
  const named = muscles
    .map((m) => ({ ...m, name: muscleNames([m.muscle])[0] }))
    .filter((m) => m.name)
  if (named.length === 0) return null // every muscle trained recently → nothing to nudge
  return (
    <Card title="Needs attention" subtitle="No hard sets in the last 10 days · tap to focus the map" defer>
      <div className="flex flex-wrap gap-1.5">
        {named.map((m) => (
          <button
            key={m.muscle}
            onClick={() => setFocusEx(m.name)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
            style={{ background: cat('peach') + '22', color: cat('peach') }}
            title={m.daysSince == null ? `${m.name}: never trained` : `${m.name}: last trained ${m.daysSince} days ago`}
          >
            <AlertTriangle size={12} /> {m.name}
            <span className="text-[10px] text-overlay0">{m.daysSince == null ? 'never' : `${m.daysSince}d`}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

/**
 * Stalled-lift detector: exercises whose top weight hasn't improved across the
 * last few sessions, with the plateau length, nudging a deload/variation.
 * Read-only — derived from exercise progression.
 */
function StalledLifts({ lifts, unit, setFocusEx }: { lifts: import('../lib/fitness').StalledLift[]; unit: string; setFocusEx: (e: string | null) => void }) {
  if (lifts.length === 0) return null // nothing plateaued → hide
  return (
    <Card title="Stalled lifts" subtitle="No new top set in the last 3+ sessions · time for a reset or variation" defer>
      <ul className="space-y-1.5 text-sm">
        {lifts.slice(0, 6).map((l) => (
          <li key={l.exercise}>
            <button
              onClick={() => setFocusEx(l.exercise)}
              className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-surface0/50"
              title={`${l.exercise} stuck at ${l.top}${unit} across ${l.sessions} sessions (last ${l.lastDate})`}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5 text-subtext1">
                <TrendingDown size={14} style={{ color: cat('red') }} /> <span className="truncate">{l.exercise}</span>
              </span>
              <span className="shrink-0 text-overlay0">
                <span className="font-semibold" style={{ color: cat('peach') }}>{l.top}{unit}</span>
                <span className="ml-1.5 text-[10px]">{l.sessions} sessions</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
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
