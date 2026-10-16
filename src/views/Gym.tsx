import { CaretRight, Trophy } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useEffect, useMemo, useState } from 'react'
import { useJournal } from '../store'
import { clearPendingSession, peekPendingSession } from '../lib/pendingSession'
import { Input } from '../components/ui'
import { Button } from '../components/ui/button'
import { ActStrip, PageLayout, StatBar, DisclosureRow, useActColumn } from '../components/page'
import { musclesForSplit } from '../lib/muscles'
import { notify } from '../lib/notify'
import { RestTimer } from '../components/RestTimer'
import {
  SessionLogger, newSetRow, setLineOf, type SetRow,
  GymReview, GymTools, GYM_PANELS,
} from '../components/gym'
import { activityForSplit } from '../domain/activities'
import { onRaised } from '../lib/colors'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import {
  splitMeta, nextSplit, musclesForExercise, epley1RM, parseSet, isNewPR,
  sessionSummary, stalledLifts,
} from '../lib/fitness'
import { cachedMusclesForName } from '../lib/wger'
import { useStickyState } from '../lib/useStickyState'
import type { Split, WorkoutSet } from '../lib/types'

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
  const { data, addWorkout, addRoutine, removeRoutine } = useJournal()
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
      ? handoff.map((exercise) => newSetRow({ exercise }))
      : [newSetRow()],
  )
  useEffect(() => clearPendingSession(), [])
  const [routineName, setRoutineName] = useState('')
  /** A session you did yesterday and log today. Was hardcoded to `todayISO()`. */
  const [date, setDate] = useState(todayISO)
  // Ephemeral PR celebration after a set is saved (local state, auto-dismisses).
  const [prParty, setPrParty] = useState<{ exercise: string; weight: number; reps: number } | null>(null)
  // Post-finish session rollup (volume · sets · top set), shown until the next edit.
  const [summary, setSummary] = useState<ReturnType<typeof sessionSummary> | null>(null)
  /* Which review row is open, and the act column's open/shut. Both sticky, and
     both owned here: the rail row because zone 1's facts point into it, the
     column because `PageLayout` has to know (shut, zone 2 becomes a 40px rail
     and the review takes its width). */
  const [panel, setPanel] = useStickyState<string>('gym.panel', 'week', GYM_PANELS.map((p) => p.id))
  const logCol = useActColumn('gym')

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


  // Muscle focus: a clicked PR/exercise overrides the session/split view.
  const [focusEx, setFocusEx] = useState<string | null>(null)
  const stalled = useMemo(() => stalledLifts(data), [data])
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
        // `w.sets.length` counts LINES, and a line is "Squat 5x5 @ 100kg" —
        // five sets. This fact sat beside a muscle-balance chart calibrated
        // in hard sets that counted the same thing the same wrong way, so
        // the two agreed with each other and with nothing else.
        : w.sets.reduce((n, line) => n + (parseSet(line)?.sets ?? 1), 0)
    }
    return { lastSession: last, setsThisWeek: sets }
  }, [data.workouts])

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
    setRows((r) => [...r, newSetRow({ exercise })])
  }
  function loadRoutine(exs: string[], s: Split) {
    setSplit(s)
    setRows(exs.map((exercise) => newSetRow({ exercise })))
  }

  function finish() {
    const valid = rows.filter((r) => r.exercise.trim())
    // Legacy "NxM @ w" set-string: parseSet() reads M (the number after `x`)
    // as reps. One row = one set, so N = 1 (set count) and M = actual reps —
    // previously N held the loop index, leaving the rep slot wrong.
    const sets = valid.map((r) => setLineOf(r, unit))
    if (sets.length === 0) { notify.info('No sets to finish', 'Add a weight and reps to at least one row.'); return }
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
      // Was `todayISO()`, so a session could only ever be logged on the day
      // it happened — the one workout form in the app with no date at all.
      date,
      activity: activityForSplit(split),
      split,
      sets,
      setRows: structured,
      notes: '',
    })
    setSummary(sessionSummary(structured))
    setRows([newSetRow()])
    setDate(todayISO())
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

  return (
    <>
      {/* ── PR celebration · ephemeral, auto-dismissing (F2) ── */}
      {prParty && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] grid place-items-center px-4" role="status" aria-live="polite">
          <div className="celebrate-pop flex items-center gap-2 rounded-card border border-line-strong bg-ink-1/95 px-5 py-3 text-center shadow-2xl backdrop-blur">
            <AppIcon as={Trophy} size="lg" style={{ color: onRaised('yellow') }} />
            <p className="text-body font-medium text-fg-1">
              New PR · <span style={{ color: onRaised('yellow') }}>{prParty.exercise}</span>{' '}
              {prParty.weight}{unit}×{prParty.reps} 🎉
            </p>
          </div>
        </div>
      )}

      <PageLayout
        /* The dashboard tier, and it fixes a documented workaround rather
           than adding a new one. At 1180 the review column measures **722px**
           — 46px under `MasonryGrid`'s `@3xl` container step — so every group
           in it resolved to a single column, and the note below records
           reaching for `CardGrid` because of it. At 1440 the column clears
           768 and the packing works as designed. It also halves the dead
           space beside the act column, which was measured at 442 × 896px:
           the logger is 604px tall and the review is 1,500. */
        tier={1440}
        zone1={<StatBar facts={facts} />}
        onSplitChange={logCol.onSplitChange}
        actShut={logCol.shut}
        zone2={logCol.shut ? (
          /* THE ACT COLUMN, PUT AWAY. Measured before this: **3001px** of act
             at 1440 — the logger, last session, the rest timer and a tools
             fold — beside a 678px review, and 2998px of it above the record on
             a phone. `useActColumn` also carries the rule nobody guesses:
             stacked, it starts SHUT, so a 1152px window opens on the record
             with the logger one tap away rather than a screen down. */
          <ActStrip
            label="Today’s session"
            summary={lastSession ? `${splitMeta(suggested).label} next · last ${lastGap === 0 ? 'today' : lastGap === 1 ? 'yesterday' : prettyDay(lastSession.date)}` : `${splitMeta(suggested).label} suggested`}
            onOpen={logCol.open}
          />
        ) : (
          <>
            {/* The act. No fold — it used to collapse itself below 640px, which
                hid the only thing the page is for while leaving every chart
                open. Compactness comes from folding the review instead. */}
            <section>
              <h2 className="mb-1 flex items-center justify-between gap-2 border-b border-line pb-1 text-label text-fg-2">
                <span>
                  Today’s session · <span style={{ color: onRaised(splitMeta(suggested).color) }}>{splitMeta(suggested).label}</span> suggested
                </span>
                {/* Shutting it lives on the thing itself; the strip that comes
                    back is the way in, so the way out belongs here. */}
                <Button variant="ghost" size="icon-sm" onClick={logCol.close} aria-label="Hide the logger" title="Hide the logger — the review takes the width">
                  <AppIcon as={CaretRight} size="sm" />
                </Button>
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
                date={date}
                setDate={setDate}
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

            {/* THE ONE TOOL THAT DID NOT MOVE TO THE BAR. Everything else in
                the old "Look up & tools" fold is a lookup between DECISIONS and
                is now a rail row; a rest timer is used between SETS, it is
                80px, and a timer you have to navigate to is a timer you do not
                start. It sits directly under the logger now that the
                last-session card has gone to the Sessions row, where every
                session carries its own Load. */}
            <section className="mt-4">
              <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Rest timer</h2>
              <RestTimer />
            </section>

          </>
        )}
        zone3={
          <GymReview
            panel={panel}
            onPanel={setPanel}
            focusEx={focusEx}
            setFocusEx={setFocusEx}
            summary={summary}
            onDismissSummary={() => setSummary(null)}
            unit={unit}
            onLoadSession={(exercises, s) => loadRoutine(exercises, s ?? 'other')}
            tools={
              <GymTools
                focusEx={focusEx}
                setFocusEx={setFocusEx}
                focusLabel={focusLabel}
                split={split}
                activeMuscles={activeMuscles}
                recentExercises={recentExercises}
                addRow={addRow}
                routines={data.routines}
                onRemoveRoutine={removeRoutine}
                onLoadRoutine={loadRoutine}
                unit={unit}
              />
            }
          />
        }
      />
    </>
  )
}
