import { Barbell, Plus, Stack, Trophy, Video, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { clearPendingSession, peekPendingSession } from '../lib/pendingSession'
import { Card, Empty, Input, Pill, StatTile } from '../components/ui'
import { Button } from '../components/ui/button'
import { PageLayout, StatBar, SummaryStrip, DisclosureRow } from '../components/page'
import { MuscleMap } from '../components/MuscleMap'
import { muscleNames, musclesForSplit } from '../lib/muscles'
import { notify } from '../lib/notify'
import { ExerciseDB } from '../components/ExerciseDB'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { QuietSection } from '../components/CollapsibleSection'
import { splitGlyph } from '../components/glyphs'
import {
  RepPRCard, MovementRadar, RecoveryMap, ExerciseFrequencyCard,
  MuscleVolumeBalance, RelativeStrengthCard, NeglectedMuscles, StalledLifts,
  SessionLogger, type SetRow,
} from '../components/gym'
import { activityForSplit } from '../domain/activities'
import { exerciseInfo } from '../lib/exerciseInfo'
import { cat, rechartsTooltip } from '../lib/colors'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import {
  EXERCISE_LIBRARY, personalRecords, splitMeta, nextSplit,
  musclesForExercise, epley1RM, platesPerSide, barExceedsTarget, parseSet,
  weeklyVolumeSeries, exerciseProgression, isNewPR, sessionSummary,
  weeklySetsPerMuscle, e1rmProgression,
  bigThreeTotal, relativeStrength, neglectedMuscles, stalledLifts,
  repPRs, volumeByCategory, muscleRecovery, exerciseFrequency, trainRestRatio,
} from '../lib/fitness'
import { Barbell as BarbellViz } from '../components/PlateStack'
import { cachedMusclesForName } from '../lib/wger'
import type { Routine, Split, WorkoutSet } from '../lib/types'

/**
 * Strength · the Body cluster's log-a-lifting-session page, on the three-zone
 * contract.
 *
 * It was the last page in the cluster still laid out as `Page` + `aside`, and
 * it showed: 4.67 screens at 1440 and 6.89 at 390, with ten folds of which ten
 * were open — including two whose own comments said "default COLLAPSED".
 *
 * Two things the census could not see, and that moving to zones fixes:
 *
 * - **The act was folded and the review was not.** `sessionOpen` defaulted to
 *   `false` below 640px, so a phone landed on Strength with the set logger shut
 *   and four charts plus twelve analytics cards open. The one thing the page
 *   exists for was the only thing hidden.
 * - **The rest timer sat ~4,700px down on a phone.** It lived in the rail, and
 *   the rail appends under `main` below `xl`; its comment claimed it "surfaces
 *   inline on mobile", which was true and useless — it surfaced below every
 *   analytic. It is used *between sets*, so it belongs in zone 2 beside the
 *   logger at every width.
 *
 * Zone 1 · suggested split, last session, sets this week, stalled lifts.
 * Zone 2 · the set logger and the rest timer. One primary button: Finish.
 * Zone 3 · summary strip, the volume-balance signature, then folded analytics.
 */
export function Gym() {
  const { data, addWorkout, addRoutine, removeRoutine, setBodyMetric } = useJournal()
  const suggested = useMemo(() => nextSplit(data), [data])
  // "Load into session" on the Program tab stashes the day's lifts and
  // navigates here — the logger's rows are local state, so there is nothing it
  // could call across the view switch. Seeded into the initialisers rather than
  // applied from an effect: the logger paints already filled, and no `setState`
  // runs during mount. Cleared below, once it has been read.
  const handoff = peekPendingSession()
  const [split, setSplit] = useState<Split>(handoff ? 'other' : suggested)
  const [rows, setRows] = useState<SetRow[]>(
    handoff?.length
      ? handoff.map((exercise) => ({ exercise, weight: '', reps: '' }))
      : [{ exercise: '', weight: '', reps: '' }],
  )
  useEffect(() => clearPendingSession(), [])
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

  // ── Zone 1 · the four facts ───────────────────────────────────────────────
  // The last lifting session, and the working sets logged in the seven days
  // ending today. Sets rather than volume: `MuscleVolumeBalance` — the page's
  // signature visual — is calibrated in hard sets against the 10–20 landmark,
  // and two "this week" facts measuring the same week two ways is the trap this
  // page already walked into with its lift lists.
  const { lastSession, setsThisWeek } = useMemo(() => {
    const today = todayISO()
    const sorted = [...data.workouts].filter((w) => w.split).sort((a, b) => (a.date < b.date ? 1 : -1))
    const last = sorted[0]
    let sets = 0
    for (const w of data.workouts) {
      const d = dayDiff(w.date, today)
      if (d < 0 || d >= 7) continue
      const structured = w.setRows ?? []
      sets += structured.length
        ? structured.filter((r) => r.kind !== 'warmup' && r.exercise.trim()).length
        : w.sets.length
    }
    return { lastSession: last, setsThisWeek: sets }
  }, [data.workouts])

  // Zone 3's strip: the same week measured the other way. `weeklyVolumeSeries`
  // buckets by week and the last bucket is the current one.
  const volumeThisWeek = volumeSeries.length ? volumeSeries[volumeSeries.length - 1].volume : 0
  const sessionsThisWeek = data.workouts.filter((w) => {
    const d = dayDiff(w.date, todayISO())
    return d >= 0 && d < 7
  }).length

  const lastGap = lastSession ? dayDiff(lastSession.date, todayISO()) : null
  const facts = [
    { label: 'Train next', value: splitMeta(suggested).label },
    {
      label: 'Last session',
      value: lastSession
        ? `${splitMeta(lastSession.split).label} · ${lastGap === 0 ? 'today' : lastGap === 1 ? 'yesterday' : prettyDay(lastSession.date)}`
        : 'None yet',
      prose: true,
    },
    { label: 'Sets this week', value: setsThisWeek },
    // Surfaced from four folds down. A lift with no new top set in three
    // sessions is the one thing on this page that should change what you load
    // today, and it was the least reachable thing on it.
    { label: 'Stalled lifts', value: stalled.length },
  ]

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
      activity: activityForSplit(split),
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

  return (
    <>
      {/* ── PR celebration · ephemeral, auto-dismissing (F2) ── */}
      {prParty && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] grid place-items-center px-4" role="status" aria-live="polite">
          <div className="celebrate-pop flex items-center gap-2 rounded-none border border-line-strong bg-ink-1/95 px-5 py-3 text-center shadow-2xl backdrop-blur">
            <AppIcon as={Trophy} size="lg" style={{ color: cat('yellow') }} />
            <p className="text-body font-medium text-fg-1">
              New PR · <span style={{ color: cat('yellow') }}>{prParty.exercise}</span>{' '}
              {prParty.weight}{unit}×{prParty.reps} 🎉
            </p>
          </div>
        </div>
      )}

      <PageLayout
        tier={1180}
        zone1={<StatBar facts={facts} />}
        zone2={
          <>
            {/* The act. No fold — it used to collapse itself below 640px, which
                hid the only thing the page is for while leaving every chart
                open. Compactness comes from folding the review instead. */}
            <section>
              <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">
                Today’s session · <span style={{ color: cat(splitMeta(suggested).color) }}>{splitMeta(suggested).label}</span> suggested
              </h2>
              <SessionLogger
                data={data}
                split={split}
                setSplit={setSplit}
                rows={rows}
                setRows={setRows}
                setRow={setRow}
                addRow={addRow}
                onLoadRoutine={loadRoutine}
                focusEx={focusEx}
                setFocusEx={setFocusEx}
                recentExercises={recentExercises}
                unit={unit}
                defaultBar={defaultBar}
                warmStep={warmStep}
                onFinish={finish}
              />
              {/* The page's one disclosure, at the bottom of the form. Naming a
                  routine is done once and then never again for that routine —
                  the definition of an optional field. */}
              <div className="mt-3">
                <DisclosureRow label="Save this as a routine">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      placeholder="Push day A"
                      aria-label="Routine name"
                      className="max-w-[220px]"
                    />
                    <Button variant="secondary" onClick={saveAsRoutine} className="press-3d">Save routine</Button>
                  </div>
                </DisclosureRow>
              </div>
            </section>

            {/* Between-sets countdown. Zone 2 because it is used *during* the
                act — in the rail it landed ~4,700px down a phone, under every
                chart on the page. */}
            <section className="mt-4">
              <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Rest timer</h2>
              <RestTimer />
            </section>

            {/* Tools, beside the logger rather than under nine folds of review.
                Everything in here is used *while building a session* — load a
                routine, check what a lift hits, work out the plates, pull an
                exercise from wger — which is the rest timer's argument again:
                it sat at the very bottom of the review column, after every
                chart, so using it meant scrolling past the entire page's
                analytics mid-workout. Folded, because the act column is sticky
                only while it is shorter than the viewport and four open cards
                would cost that. */}
            <div className="mt-4">
              <QuietSection title="Look up & tools" subtitle="Anatomy, plate maths, saved routines, wger’s library" defaultOpen={false} stickyKey="gym.reference">
                <AnatomyCard
                  focusEx={focusEx}
                  setFocusEx={setFocusEx}
                  focusLabel={focusLabel}
                  split={split}
                  activeMuscles={activeMuscles}
                  recentExercises={recentExercises}
                  addRow={addRow}
                />
                <PlateCalculator key={unit} unit={unit} />
                <SavedRoutines routines={data.routines} onRemove={removeRoutine} onLoad={loadRoutine} />
                <Card band title="Exercise database" subtitle="Search wger’s library, tap a card to view it, then add to your session">
                  <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
                </Card>
              </QuietSection>
            </div>
          </>
        }
        zone3={
          <>
            {/* Fired by Finish, dismissed by the next edit. Above the summary
                strip because it is about the session you just did, not the week. */}
            {summary && summary.sets > 0 && (
              <Card
                band
                title="Session logged"
                subtitle="Your last finished workout at a glance"
                right={<Button variant="ghost" size="icon-sm" onClick={() => setSummary(null)} aria-label="Dismiss summary" className="text-fg-2 hover:text-fg-1"><AppIcon as={X} size="md" /></Button>}
              >
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

            <section>
              <h2 className="mb-2 border-b border-line pb-1 text-label text-fg-2">This week</h2>
              {/* Deliberately NOT the set count. Zone 1 already prints "Sets
                  this week", and a strip that repeats a fact from the orient
                  bar is the same mistake this page made with its three lift
                  lists — it looks like more information and is not. Volume is
                  the other half of the same week: sets are the stimulus, volume
                  is the load. */}
              <SummaryStrip items={[
                { label: `${unit} volume`, value: volumeThisWeek, empty: volumeThisWeek === 0, suffix: '' },
                { label: 'Sessions', value: sessionsThisWeek, empty: sessionsThisWeek === 0 },
                { label: 'Personal records', value: prs.length, empty: prs.length === 0 },
              ]} />
              {/* The signature visual: hard sets per muscle against the 10–20
                  hypertrophy landmark. It is the one chart here that says what
                  to do next rather than what happened. */}
              <div className="mt-3">
                <MuscleVolumeBalance counts={muscleSets} setFocusEx={setFocusEx} />
              </div>
            </section>

            <QuietSection title="Personal records" subtitle="Heaviest logged lift per exercise" defaultOpen={false} stickyKey="gym.prs">
              <PersonalRecords prs={prs} focusEx={focusEx} setFocusEx={setFocusEx} unit={unit} />
            </QuietSection>

            <QuietSection title="Training volume" subtitle="Weekly working sets, and a focused lift's progression" defaultOpen={false} stickyKey="gym.volume">
              <Card band title="Training volume" subtitle={focusEx ? `Weekly volume · ${focusEx}` : 'Weekly working-set volume (weight × reps)'} defer enlargeable>
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
              {focusEx && repRecords.length > 0 && <RepPRCard exercise={focusEx} records={repRecords} unit={unit} />}
            </QuietSection>

            <QuietSection title="Movement & recovery" subtitle="Push/pull/legs balance and what is rested" defaultOpen={false} stickyKey="gym.movement">
              <div className="grid items-start gap-5 lg:grid-cols-2">
                <MovementRadar data={categoryVolume} unit={unit} />
                <RecoveryMap recovery={recovery} setFocusEx={setFocusEx} />
              </div>
            </QuietSection>

            <QuietSection title="Frequency & alerts" subtitle="Most-trained movements, neglected muscles, stalled lifts" defaultOpen={false} stickyKey="gym.frequency">
              <ExerciseFrequencyCard rows={frequency} ratio={trainRest} setFocusEx={setFocusEx} />
              <NeglectedMuscles muscles={neglected} setFocusEx={setFocusEx} />
              <StalledLifts lifts={stalled} unit={unit} setFocusEx={setFocusEx} />
            </QuietSection>

            <QuietSection title="Strength standards" subtitle="Big-three total, bodyweight ratios, effort trend" defaultOpen={false} stickyKey="gym.standards">
              {/* One card, not two side by side. The big-three tiles were
                  `Personal records` a second time — see COD-89. */}
              <RelativeStrengthCard rows={relStrength} total={bigThree} unit={unit} setFocusEx={setFocusEx} />
              {rpeSeries.length >= 2 && (
                <Card band title="Effort trend (RPE)" subtitle="Perceived exertion per session, watch for over-reaching" defer enlargeable>
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
            </QuietSection>

            <QuietSection title="Body weight" subtitle="Faint = daily, bold = 7-day average" defaultOpen={false} stickyKey="gym.bodyweight">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={`Today's weight (${unit})`} aria-label={`Today's weight in ${unit}`} className="max-w-[200px]" />
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
            </QuietSection>

            <QuietSection title="Progress photos" subtitle="Dated shots, side by side" defaultOpen={false} stickyKey="gym.photos">
              <ProgressPhotos />
            </QuietSection>

            {/* "Look up & tools" lived here, at the very bottom of the review
                column — the same mistake this file records fixing for the rest
                timer. It is in zone 2 with the logger now: tools are used
                while building a session, and review is for reading. */}
          </>
        }
      />
    </>
  )
}

/** Anatomy lookup — the muscle map plus a picker to point it at any lift. */
function AnatomyCard({
  focusEx, setFocusEx, focusLabel, split, activeMuscles, recentExercises, addRow,
}: {
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  focusLabel: string
  split: Split
  activeMuscles: number[]
  recentExercises: string[]
  addRow: (exercise?: string) => void
}) {
  return (
    <Card
      band
      title={focusEx ? focusEx : 'Exercise anatomy'}
      subtitle={
        focusEx
          ? 'Muscles worked by this exercise'
          : <span>Showing your <span style={{ color: cat(splitMeta(split).color) }}>{focusLabel}</span> · or look one up</span>
      }
      right={focusEx && <Button variant="secondary" onClick={() => setFocusEx(null)} className="press-3d inline-flex items-center gap-1.5 rounded-none"><AppIcon as={X} size="sm" /> Clear</Button>}
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
            <Button variant="secondary" onClick={() => { addRow(focusEx) }} className="press-3d inline-flex items-center gap-1.5 rounded-none">
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
        <div className="mt-3 space-y-1 rounded-none border border-line bg-ink-0 p-2.5 text-label">
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
}

/** Greedy plate-loading helper: target weight → a loaded, animated barbell. */
function PlateCalculator({ unit }: { unit: string }) {
  const [target, setTarget] = useState('100')
  const [bar, setBar] = useState(unit === 'lb' ? '45' : '20')
  // Plate denominations differ by unit (kg gym plates vs lb).
  const denoms = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
  // One stepper click = the smallest plate on each side, the smallest change a
  // real bar can make. Thumb-sized, because this is used standing at a rack.
  const step = denoms[denoms.length - 1] * 2
  const plates = platesPerSide(Number(target) || 0, Number(bar) || 0, denoms)
  const loadable = plates.reduce((a, p) => a + p, 0) * 2 + (Number(bar) || 0)
  const barOverTarget = barExceedsTarget(Number(target) || 0, Number(bar) || 0)
  const bump = (d: number) => setTarget(String(Math.max(0, (Number(target) || 0) + d)))
  return (
    <Card band title="Plate calculator" subtitle="What to load on the bar">
      {/* One row, always: Target's stepper trio plus Bar come to ~230px, and
          the act column never goes below 324. `max-w-*`, not `w-*` — Input's
          base `w-full` wins the width fight against a bare `w-24`, which is
          why these two stacked full-width before. */}
      <div className="mb-3 flex items-end gap-3">
        <label className="block text-body text-fg-1">
          Target ({unit})
          <span className="mt-1 flex items-center gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => bump(-step)} aria-label={`Target down ${step} ${unit}`} className="h-9 w-9 shrink-0">−</Button>
            {/* Inline widths, not utilities: `.zone-act :is(input)` (0-1-1)
                out-specifies any single-class width, which is how two earlier
                attempts (`w-24`, `max-w-20`) silently lost. */}
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={`Target weight (${unit})`} className="text-center" style={{ width: 84 }} />
            <Button variant="secondary" size="icon-sm" onClick={() => bump(step)} aria-label={`Target up ${step} ${unit}`} className="h-9 w-9 shrink-0">+</Button>
          </span>
        </label>
        <label className="block text-body text-fg-1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 text-center" style={{ width: 72 }} /></label>
      </div>
      {barOverTarget ? (
        <p className="text-body text-yellow">Bar alone ({bar} {unit}) already exceeds target ({target} {unit}) — use a lighter bar.</p>
      ) : (
        <>
          <BarbellViz plates={plates} unit={unit} bar={Number(bar) || 0} />
          {/* The sentence to read off at the rack. Keyed so a change re-enters —
              the number moves with the discs. */}
          <p key={loadable} className="collapse-in mt-2 text-body text-fg-1">
            {plates.length === 0
              ? 'Just the bar, no plates needed.'
              : <>Per side: <span className="font-medium">{plates.join(' · ')}</span> = {loadable} {unit} loaded</>}
            {plates.length > 0 && loadable !== Number(target) && <span className="ml-1 text-yellow">(closest loadable to {target})</span>}
          </p>
        </>
      )}
    </Card>
  )
}

function PersonalRecords({ prs, focusEx, setFocusEx, unit }: { prs: import('../lib/fitness').PR[]; focusEx: string | null; setFocusEx: (e: string | null) => void; unit: string }) {
  if (prs.length === 0) return <Empty>Log sets like “Bench 5x5 @ 60kg” to track PRs.</Empty>
  return (
    <ul className="space-y-1 text-body">
      {prs.map((pr) => (
        <li key={pr.exercise}>
          <button
            onClick={() => setFocusEx(focusEx === pr.exercise ? null : pr.exercise)}
            className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${focusEx === pr.exercise ? 'bg-ink-2' : 'hover:bg-ink-2/50'}`}
            title="Show this lift on the muscle map"
          >
            <span className="inline-flex items-center gap-1.5 text-fg-1"><AppIcon as={Trophy} size="sm" style={{ color: cat('yellow') }} /> {pr.exercise}</span>
            {/* A weightless set (dips, pull-ups logged without added load) used
                to print "0lb · 1RM ~0lb" — a data artifact dressed as a record.
                Bodyweight is the honest name, and Epley of 0 is not a 1RM. */}
            <span className="text-fg-2">
              {pr.weight > 0
                ? <span style={{ color: cat('yellow') }}>{pr.weight}{unit}</span>
                : <span style={{ color: cat('yellow') }}>bodyweight{pr.reps > 1 ? ` ×${pr.reps}` : ''}</span>}
              {pr.weight > 0 && pr.reps > 1 && <span className="ml-1" title="estimated 1-rep max">· 1RM ~{epley1RM(pr.weight, pr.reps)}{unit}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function SavedRoutines({ routines, onRemove, onLoad }: { routines: Routine[]; onRemove: (id: string) => void; onLoad: (exs: string[], split: Split) => void }) {
  return (
    <Card band title="Saved routines" subtitle="Load one into today's session">
      {routines.length === 0 ? (
        <Empty>Build a session and “Save this as a routine”. PPL presets are quick-loadable.</Empty>
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
