import { ArrowCounterClockwise, Barbell, ChartBar, Check, Crosshair, Gauge, Plus, Stack, Trophy, Video, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, StatTile } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page } from '../components/shell/Page'
import { MuscleMap } from '../components/MuscleMap'
import { muscleNames, musclesForSplit } from '../lib/muscles'
import { notify } from '../lib/notify'
import { splitGlyph } from '../components/glyphs'
import { ExerciseDB } from '../components/ExerciseDB'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { ProgramTracker } from '../components/ProgramTracker'
import { VideoLink } from '../components/VideoLink'
import {
  CollapsibleSection, RepPRCard, MovementRadar, RecoveryMap, ExerciseFrequencyCard,
  MuscleVolumeBalance, BigThreeCard, RelativeStrengthCard, NeglectedMuscles, StalledLifts,
} from '../components/gym'
import { exerciseInfo } from '../lib/exerciseInfo'
import { cat, rechartsTooltip } from '../lib/colors'
import { todayISO } from '../lib/date'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, personalRecords, SPLITS, splitMeta, nextSplit,
  musclesForExercise, epley1RM, platesPerSide, barExceedsTarget, lastSetFor, parseSet,
  weeklyVolumeSeries, exerciseProgression, isNewPR, warmupRamp, sessionSummary,
  weeklySetsPerMuscle, e1rmProgression,
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
    const name = routineName.trim()
    addRoutine({ name, split, exercises })
    setRoutineName('')
    notify.success(`Routine “${name}” saved`, `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}.`)
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
      right={focusEx && <Button variant="secondary" onClick={() => setFocusEx(null)} className="press-3d inline-flex items-center gap-1.5 rounded-control"><AppIcon as={X} size="sm" /> Clear</Button>}
      collapsible
      defaultCollapsed
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
            <Button variant="secondary" onClick={() => { addRow(focusEx) }} className="press-3d inline-flex items-center gap-1.5 rounded-control">
              <AppIcon as={Plus} size="sm" /> Add to session
            </Button>
          )}
          {focusEx && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focusEx + ' exercise form')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-body text-red hover:underline"
            >
              <AppIcon as={Video} size="md" /> YouTube
            </a>
          )}
        </div>
      </div>

      <MuscleMap muscles={activeMuscles} />

      {focusEx && exerciseInfo(focusEx) && (
        <div className="mt-3 space-y-1 rounded-card border border-line bg-ink-0 p-2.5 text-label">
          <p className="text-fg-2"><span className="font-medium text-green">Cue:</span> {exerciseInfo(focusEx)!.cue}</p>
          <p className="text-fg-2"><span className="font-medium text-peach">Watch:</span> {exerciseInfo(focusEx)!.watch}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {activeMuscles.length === 0 ? (
          <span className="text-label text-fg-2">Type an exercise, pick a split, or tap a set row’s target.</span>
        ) : (
          muscleNames(activeMuscles).map((m) => (
            <Pill key={m} color={splitMeta(split).color} className="px-2.5">
              {m}
            </Pill>
          ))
        )}
      </div>
    </Card>
  )

  return (
    <Page
      aside={
        <>
          {/* Rest timer stays always-visible — used mid-session, surfaces inline on mobile. */}
          <Card title="Rest timer" subtitle="Between-sets countdown"><RestTimer /></Card>
          {/* On-demand tools / reference — collapsed by default. */}
          <PlateCalculator key={unit} unit={unit} />
          {anatomyCard}
          <PersonalRecords prs={prs} focusEx={focusEx} setFocusEx={setFocusEx} unit={unit} />
          <SavedRoutines routines={data.routines} onRemove={removeRoutine} onLoad={loadRoutine} />
          <Card title="Exercise database" subtitle="Search wger’s library, tap a card to view it, then add to your session" collapsible defaultCollapsed>
            <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
          </Card>
        </>
      }
    >
      {/* ── PR celebration · ephemeral, auto-dismissing (F2) ── */}
      {prParty && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] grid place-items-center px-4" role="status" aria-live="polite">
          <div className="celebrate-pop flex items-center gap-2 rounded-card border border-line-strong bg-ink-1/95 px-5 py-3 text-center shadow-2xl backdrop-blur">
            <AppIcon as={Trophy} size="lg" style={{ color: cat('yellow') }} />
            <p className="text-body font-medium text-fg-1">
              New PR · <span style={{ color: cat('yellow') }}>{prParty.exercise}</span>{' '}
              {prParty.weight}{unit}×{prParty.reps} 🎉
            </p>
          </div>
        </div>
      )}

      {/* ── Last session rollup · shown after Finish, until the next edit ── */}
      {summary && summary.sets > 0 && (
        <Card title="Session logged" subtitle="Your last finished workout at a glance" right={<Button variant="ghost" size="icon-sm" onClick={() => setSummary(null)} aria-label="Dismiss summary" className="text-fg-2 hover:text-fg-1"><AppIcon as={X} size="md" /></Button>}>
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={<AppIcon as={Barbell} size="md" />} color="mauve" value={summary.volume.toLocaleString()} label={`${unit} volume`} />
            <StatTile icon={<AppIcon as={Stack} size="md" />} color="blue" value={summary.sets} label={summary.sets === 1 ? 'working set' : 'working sets'} />
            <StatTile
              icon={<AppIcon as={Trophy} size="md" />}
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
        collapsible
        open={sessionOpen}
        onOpenChange={setSessionOpen}
      >
        <>
        <div className="mb-3 flex flex-wrap gap-2">
          {SPLITS.filter((s) => s.id !== 'other').map((s) => {
            const Icon = splitGlyph(s.id)
            return (
              <button
                key={s.id}
                onClick={() => setSplit(s.id)}
                className="inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-body"
                style={{
                  background: split === s.id ? cat(s.color) : cat('surface0'),
                  color: split === s.id ? cat('crust') : cat('subtext1'),
                }}
              >
                <AppIcon as={Icon} size="sm" /> {s.label}
              </button>
            )
          })}
        </div>

        <div className="mb-2 flex flex-wrap gap-2">
          <span className="text-label text-fg-2">Quick-load:</span>
          {PPL_PRESETS.map((p) => (
            <button key={p.name} onClick={() => loadRoutine(p.exercises, p.split)} className="text-label text-mauve hover:underline">
              {p.name}
            </button>
          ))}
          {data.routines.map((r) => (
            <button key={r.id} onClick={() => loadRoutine(r.exercises, r.split)} className="text-label text-sapphire hover:underline">
              {r.name}
            </button>
          ))}
        </div>

        <datalist id="exercise-library">
          {EXERCISE_LIBRARY.map((e) => <option key={e} value={e} />)}
        </datalist>

        <div className="space-y-2">
          <div className="grid grid-cols-[28px_1fr_52px_44px_40px_36px_28px] gap-2 text-label text-fg-2">
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
              <div key={i} className={`-ml-2 rounded-control border-l-2 pl-2 transition-colors ${complete ? 'border-green bg-green/5' : 'border-transparent'}`}>
                <div className="grid grid-cols-[28px_1fr_52px_44px_40px_36px_28px] items-center gap-2">
                <button
                  onClick={() => setFocusEx(focused ? null : row.exercise.trim() || null)}
                  disabled={!row.exercise.trim()}
                  aria-label="Focus muscle map on this exercise"
                  title="Show this exercise on the muscle map"
                  className="grid h-7 w-7 place-items-center rounded-control disabled:opacity-30"
                  style={{ background: focused ? cat('mauve') : cat('surface0'), color: focused ? cat('crust') : cat('overlay1') }}
                >
                  <AppIcon as={Crosshair} size="sm" />
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
                <button onClick={() => setRow(i, { kind: nextKind })} title={kindMeta.title} aria-label={`Set type: ${kindMeta.title}`} className="grid h-7 w-8 place-items-center rounded-control text-label font-medium" style={{ background: cat('surface0'), color: cat(kindMeta.color) }}>{kindMeta.label}</button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className="text-fg-2 hover:text-red"><AppIcon as={X} size="sm" /></Button>
                </div>
                {(prev || oneRM || row.exercise.trim()) && (
                  <div className="mt-0.5 ml-9 flex items-center gap-3 text-micro text-fg-2">
                    {prev && (
                      <button
                        type="button"
                        onClick={() => setRow(i, { weight: String(prev.weight ?? ''), reps: String(prev.reps ?? '') })}
                        title="Repeat last set, fill weight & reps"
                        className="inline-flex items-center gap-1 hover:text-mauve"
                      >
                        <AppIcon as={ArrowCounterClockwise} size="sm" /> last: {prev.weight}{unit}×{prev.reps}
                      </button>
                    )}
                    {oneRM && <span style={{ color: cat('mauve') }}>1RM ~{oneRM}{unit}</span>}
                    {complete && <span className="inline-flex items-center gap-0.5" style={{ color: cat('green') }}><AppIcon as={Check} size="sm" /> logged</span>}
                    {row.exercise.trim() && <VideoLink name={row.exercise.trim()} size="sm" className="text-micro" />}
                  </div>
                )}
                {/* Auto warm-up ramp · bar/40/60/80% of a working weight. Tap a rung to insert it as a warm-up set. */}
                {kind === 'working' && (() => {
                  const ramp = warmupRamp(Number(row.weight) || 0, defaultBar, warmStep)
                  if (!ramp.length) return null
                  return (
                    <div className="mt-1 ml-9 flex flex-wrap items-center gap-1.5 text-micro text-fg-2">
                      <span className="inline-flex items-center gap-1" title="Auto warm-up ramp to this working weight">
                        <AppIcon as={Stack} size="sm" style={{ color: cat('blue') }} /> Warm-up:
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
                          className="rounded-pill px-2 py-0.5 transition-colors hover:text-fg-1"
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
            <div className="mt-2 flex items-center gap-2 text-label">
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: cat('green') }}><AppIcon as={Check} size="sm" /> {done.length} set{done.length === 1 ? '' : 's'}</span>
              <span className="text-fg-2">·</span>
              <span className="text-fg-1">{vol.toLocaleString()}{unit} volume</span>
            </div>
          )
        })()}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => addRow()} className="press-3d rounded-control">+ Add set</Button>
          <Button variant="secondary" onClick={finish} className="press-3d">Finish session</Button>
          <div className="ml-auto flex gap-2">
            <Input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Save as routine…" className="max-w-[160px] py-1.5" />
            <Button variant="secondary" onClick={saveAsRoutine} className="press-3d">Save routine</Button>
          </div>
        </div>
        </>
      </Card>

      {/* ── Body weight · canonical bodyweight log/chart (Cardio tab merges here) ── */}
      <Card title="Body weight" subtitle="Faint = daily, bold = 7-day average" defer enlargeable collapsible defaultCollapsed>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={`Today's weight (${unit})`} className="max-w-[200px]" />
          <Button
            variant="secondary"
            className="press-3d"
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
                <Tooltip contentStyle={rechartsTooltip()} />
                <Line type="monotone" dataKey="weight" stroke={cat('overlay1')} dot={{ r: 1.5 }} strokeWidth={1} opacity={0.5} />
                <Line type="monotone" dataKey="avg" stroke={cat('mauve')} dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Program & progress · secondary inputs, folded below logging ── */}
      <CollapsibleSection
        title="Program & progress"
        subtitle="Training program, progress photos"
        icon={Stack}
        color="blue"
      >
        <ProgramTracker only="hyper12" onLoad={(exs) => loadRoutine(exs, 'other')} />
        <ProgressPhotos />
      </CollapsibleSection>

      {/* ── Training insights · volume + at-a-glance analytics (default collapsed) ── */}
      <CollapsibleSection
        title="Training insights"
        subtitle="Volume, muscle balance, movement & recovery, frequency, alerts"
        icon={Gauge}
        color="teal"
      >
        {/* Weekly working-set volume + per-exercise progression (focus-aware) */}
        <Card title="Training volume" subtitle={focusEx ? `Weekly volume · ${focusEx}` : 'Weekly working-set volume (weight × reps)'} defer enlargeable>
          <div className="h-48" role="img" aria-label={focusEx ? `Bar chart of weekly training volume for ${focusEx}` : 'Bar chart of weekly working-set volume (weight × reps)'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeSeries} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} />
                <YAxis stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={rechartsTooltip()} />
                <Bar dataKey="volume" fill={cat('mauve')} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {focusEx && progression.length > 1 && (
            <div className="mt-4 h-40 border-t border-line pt-3" role="img" aria-label={`Line chart of the heaviest ${focusEx} set per day (${unit})`}>
              <p className="mb-1 text-label text-fg-2">{focusEx} · heaviest set per day ({unit})</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progression} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={rechartsTooltip()} />
                  <Line type="monotone" dataKey="weight" stroke={cat('green')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {focusEx && e1rmProg.length > 1 && (
            <div className="mt-4 h-40 border-t border-line pt-3" role="img" aria-label={`Line chart of estimated 1-rep max for ${focusEx} per day (${unit})`}>
              <p className="mb-1 text-label text-fg-2">{focusEx} · estimated 1RM per day ({unit}) · credits rep PRs</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={e1rmProg} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={rechartsTooltip()} />
                  <Line type="monotone" dataKey="e1rm" stroke={cat('yellow')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Rep records for the focused lift · only renders when a lift is focused */}
        {focusEx && repRecords.length > 0 && <RepPRCard exercise={focusEx} records={repRecords} unit={unit} />}

        {/* Weekly volume balance · hard sets per muscle vs hypertrophy landmark */}
        <MuscleVolumeBalance counts={muscleSets} setFocusEx={setFocusEx} />

        {/* Movement-balance radar + muscle-recovery readiness */}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <MovementRadar data={categoryVolume} unit={unit} />
          <RecoveryMap recovery={recovery} setFocusEx={setFocusEx} />
        </div>

        {/* Exercise frequency + train/rest consistency */}
        <ExerciseFrequencyCard rows={frequency} ratio={trainRest} setFocusEx={setFocusEx} />

        {/* Actionable alerts · neglected muscles + stalled lifts */}
        <NeglectedMuscles muscles={neglected} setFocusEx={setFocusEx} />
        <StalledLifts lifts={stalled} unit={unit} setFocusEx={setFocusEx} />
      </CollapsibleSection>

      {/* ── Deep analytics · strength snapshots, alerts & effort trend
            (default COLLAPSED — drill-down stats, not daily-use) ── */}
      <CollapsibleSection
        title="Deep analytics"
        subtitle="Strength standards, plateau & neglect alerts, effort trend"
        icon={ChartBar}
        color="mauve"
      >
        {/* Strength snapshots · big-three total + relative strength */}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <BigThreeCard total={bigThree} unit={unit} setFocusEx={setFocusEx} />
          <RelativeStrengthCard rows={relStrength} unit={unit} setFocusEx={setFocusEx} />
        </div>

        {rpeSeries.length >= 2 && (
          <Card title="Effort trend (RPE)" subtitle="Perceived exertion per session, watch for over-reaching" defer enlargeable>
            <div className="h-44" role="img" aria-label={`Line chart of session RPE (1-10) over the last ${rpeSeries.length} workouts`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeSeries} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={rechartsTooltip()} />
                  <Line type="monotone" dataKey="rpe" stroke={cat('red')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </CollapsibleSection>
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
  const barOverTarget = barExceedsTarget(Number(target) || 0, Number(bar) || 0)
  return (
    <Card title="Plate calculator" subtitle="What to load on the bar" collapsible defaultCollapsed>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="block text-body text-fg-1">Target ({unit})<Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-28" /></label>
        <label className="block text-body text-fg-1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 w-24" /></label>
      </div>
      {barOverTarget ? (
        <p className="text-body text-yellow">Bar alone ({bar} {unit}) already exceeds target ({target} {unit}) — use a lighter bar.</p>
      ) : plates.length === 0 ? (
        <p className="text-body text-fg-2">Just the bar, no plates needed.</p>
      ) : (
        <>
          <p className="mb-2 text-label text-fg-2">Per side:</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {plates.map((p, i) => (
              <span key={i} className="grid h-9 min-w-9 place-items-center rounded-control px-2 text-body font-medium text-crust" style={{ background: plateColor(p) }}>{p}</span>
            ))}
          </div>
          <div className="mt-2"><PlateStack plates={plates} unit={unit} /></div>
          {loadable !== Number(target) && <p className="mt-2 text-label text-yellow">Closest loadable: {loadable} {unit}</p>}
        </>
      )}
    </Card>
  )
}

function PersonalRecords({ prs, focusEx, setFocusEx, unit }: { prs: import('../lib/fitness').PR[]; focusEx: string | null; setFocusEx: (e: string | null) => void; unit: string }) {
  return (
    <Card title="Personal records" subtitle="Heaviest logged lift per exercise" collapsible defaultCollapsed>
      {prs.length === 0 ? (
        <Empty>Log sets like “Bench 5x5 @ 60kg” to track PRs.</Empty>
      ) : (
        <ul className="space-y-1 text-body">
          {prs.map((pr) => (
            <li key={pr.exercise}>
              <button
                onClick={() => setFocusEx(focusEx === pr.exercise ? null : pr.exercise)}
                className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${focusEx === pr.exercise ? 'bg-ink-2' : 'hover:bg-ink-2/50'}`}
                title="Show this lift on the muscle map"
              >
                <span className="inline-flex items-center gap-1.5 text-fg-1"><AppIcon as={Trophy} size="sm" style={{ color: cat('yellow') }} /> {pr.exercise}</span>
                <span className="text-fg-2">
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
    <Card title="Saved routines" collapsible defaultCollapsed>
      {routines.length === 0 ? (
        <Empty>Build a session and “Save routine”. PPL presets are quick-loadable.</Empty>
      ) : (
        <ul className="space-y-1 text-body">
          {routines.map((r) => {
            const m = splitMeta(r.split)
            const Icon = splitGlyph(r.split)
            return (
              <li key={r.id} className="group flex items-center justify-between">
                <button onClick={() => onLoad(r.exercises, r.split)} className="inline-flex items-center gap-1.5 text-left text-fg-1 hover:text-fg-1" title="Load into session">
                  <AppIcon as={Icon} size="sm" style={{ color: cat(m.color) }} /> {r.name}
                  <span className="ml-1 text-fg-2">{r.exercises.length} exercises</span>
                </button>
                <Button variant="ghost" size="icon-sm" onClick={() => onRemove(r.id)} aria-label="Delete routine" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
