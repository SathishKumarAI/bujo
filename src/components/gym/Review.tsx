import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { X } from '@/components/icons'
import { useJournal } from '../../store'
import { Card, Empty, Input, StatTile } from '../ui'
import { Button } from '../ui/button'
import { ShowMore } from '../ShowMore'
import { ProgressPhotos } from '../ProgressPhotos'
import { SectionRail, StatGrid, SummaryStrip } from '../page'
import { onRaised } from '../../lib/colors'
import { dayDiff, todayISO } from '../../lib/date'
import { useCappedList } from '../../lib/useCappedList'
import type { Workout } from '../../lib/types'
import {
  bigThreeTotal, exerciseFrequency, exerciseProgression, e1rmProgression, muscleRecovery,
  neglectedMuscles, personalRecords, relativeStrength, repPRs, stalledLifts, trainRestRatio,
  volumeByCategory, weeklyMuscleLoad, weeklyVolumeSeries, sessionSummary,
} from '../../lib/fitness'
import { GYM_PANELS } from './panels'
import { GymHistory } from './History'
import { LiftTable } from './LiftTable'
import { MovementRadar } from './MovementRadar'
import { MuscleVolumeBalance } from './MuscleVolumeBalance'
import { RecoveryMap } from './RecoveryMap'
import { RepPRCard } from './RepPRCard'
import { ExerciseFrequencyCard } from './ExerciseFrequencyCard'
import { NeglectedMuscles } from './NeglectedMuscles'
import { StalledLifts } from './StalledLifts'
import { EffortTrendCard, VolumeTrendCard, WeightTrendCard } from './Charts'

/**
 * ZONE 3 · everything Strength has recorded, behind ONE bar.
 *
 * WHAT THIS FILE OWNS: which row is on screen and which cards it holds.
 * WHAT IT DOES NOT OWN: the arithmetic (`lib/fitness.ts`), the record
 * (`History.tsx`), any card's internals, or the act column.
 *
 * It was four `QuietSection` folds — measured at `?demo=1` before the pass:
 * **1.7 desktop screens shipped and 3.6 open; 3.6 → 8.6 on a phone**, with a
 * **3016px** review column and **28** `aria-expanded` controls on the page.
 * Three of the four started shut, so what you landed on was a form and four
 * identical grey bars, and the answer you came back for was behind whichever
 * one you guessed right.
 *
 * Five rows now, the same instrument as Pickleball, Pull-ups, Home Workout and
 * Fitness: `railAt="never"`, a bar above the panel at every width.
 *
 * **It reads the store rather than taking twenty aggregates as props.** Each is
 * one pass over the session list, and a twenty-prop signature is a second place
 * for two components to disagree about what a number means — the reasoning
 * `components/pickleball/Review.tsx` records. The view keeps only what the ACT
 * also needs: the focused lift, the just-finished summary, and the unit.
 */
export function GymReview({ panel, onPanel, focusEx, setFocusEx, summary, onDismissSummary, unit, load, lookup, onLoadSession }: {
  panel: string
  onPanel: (id: string) => void
  /**
   * The lift every card can point at. Owned by the view because the logger in
   * zone 2 sets it too — tapping a PR here aims the anatomy map there.
   */
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  /** The rollup from the session just finished, until the next edit. */
  summary: ReturnType<typeof sessionSummary> | null
  onDismissSummary: () => void
  unit: string
  /**
   * The Load and Lookup rows, passed as SLOTS rather than as eleven props.
   *
   * Everything in them (the anatomy map, saved routines, the library) reads
   * state the ACT owns — the focused lift, the selected split, the active
   * muscles, `addRow`. Threading those through here would make this component
   * know what a set row is, which is exactly the twenty-prop signature its
   * docstring argues against; a slot keeps the ownership where it is and still
   * puts the rows on the bar.
   */
  load?: ReactNode
  lookup?: ReactNode
  /** Load a logged session's exercises back into the logger. */
  onLoadSession?: (exercises: string[], split: Workout['split']) => void
}) {
  const { data, setBodyMetric } = useJournal()
  const today = todayISO()

  // One pass each over the session list — see the no-`useMemo` note in
  // `lib/fitnessReview.ts`; the same reasoning applies to these.
  const prs = personalRecords(data)
  const relStrength = relativeStrength(data)
  const bigThree = bigThreeTotal(data)
  /* `weeklyMuscleLoad`, not `weeklySetsPerMuscle`: the card grades against a
     landmark stated in direct sets, and the old count gave every muscle a
     lift touches a whole set each — see COD-330 and the card's docstring. */
  const muscle = weeklyMuscleLoad(data, today)
  const volumeSeries = weeklyVolumeSeries(data)
  const categoryVolume = volumeByCategory(data)
  const recovery = muscleRecovery(data)
  const frequency = exerciseFrequency(data)
  const trainRest = trainRestRatio(data)
  const neglected = neglectedMuscles(data)
  const stalled = stalledLifts(data)
  const progression = focusEx ? exerciseProgression(data, focusEx) : []
  const e1rmProg = focusEx ? e1rmProgression(data, focusEx) : []
  const repRecords = focusEx ? repPRs(data, focusEx) : []

  /* Lifting sessions only. `data.workouts` holds runs, yoga and pickleball too;
     a `split` is what makes a row a lifting session, which is the same test
     zone 1's "last session" fact uses. */
  const sessions = [...data.workouts].filter((w) => w.split).sort((a, b) => (a.date < b.date ? 1 : -1))
  const history = useCappedList(sessions)

  const volumeThisWeek = volumeSeries.length ? volumeSeries[volumeSeries.length - 1].volume : 0
  const sessionsThisWeek = sessions.filter((w) => {
    const d = dayDiff(w.date, today)
    return d >= 0 && d < 7
  }).length

  // Body weight, 7-point trailing average over the logged days.
  const weightRaw = [...data.bodyMetrics].filter((b) => b.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1))
  const weightSeries = weightRaw.map((b, i) => {
    const win = weightRaw.slice(Math.max(0, i - 6), i + 1)
    return {
      date: b.date.slice(5),
      weight: b.weight,
      avg: Math.round((win.reduce((s, x) => s + (x.weight ?? 0), 0) / win.length) * 10) / 10,
    }
  })
  const rpeSeries = [...data.workouts]
    .filter((w) => w.rpe != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-20)
    .map((w) => ({ date: w.date.slice(5), rpe: w.rpe }))

  const current = GYM_PANELS.find((p) => p.id === panel) ?? GYM_PANELS[0]

  return (
    <section className="mt-2">
      {/* `sr-only`: the bar names every row, so a grey heading above it is
          furniture — 1110px of it with the logger hidden. */}
      <h2 className="sr-only">The record</h2>
      <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            label="Strength record"
            groups={GYM_PANELS.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => onPanel(id ?? 'week')}
            railAt="never"
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
                <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
                {current.label}
              </h3>
              <p className="text-label text-fg-2">{current.blurb}</p>
              {panel === 'sessions' && <span className="ml-auto"><ShowMore list={history} /></span>}
            </div>

            {panel === 'week' && (<>
              {/* Fired by Finish, dismissed by the next edit — about the
                  session you just did rather than the week, so it sits above
                  the week's own figures. */}
              {summary && summary.sets > 0 && (
                <Card
                  band
                  title="Session logged"
                  subtitle="Your last finished workout at a glance"
                  right={<Button variant="ghost" size="icon-sm" onClick={onDismissSummary} aria-label="Dismiss summary" className="text-fg-2 hover:text-fg-1"><Icon as={X} size="md" /></Button>}
                  className="mb-4"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <StatTile compact value={summary.volume.toLocaleString()} label={`${unit} volume`} />
                    <StatTile compact value={summary.sets} label={summary.sets === 1 ? 'working set' : 'working sets'} />
                    <StatTile
                      compact
                      value={summary.topSet ? `${summary.topSet.weight}${unit}` : '—'}
                      label={summary.topSet ? `top · ${summary.topSet.exercise}` : 'top set'}
                      title={summary.topSet ? `${summary.topSet.exercise} ${summary.topSet.weight}${unit}×${summary.topSet.reps}` : undefined}
                    />
                  </div>
                </Card>
              )}
              {/* Deliberately NOT the set count: zone 1 already prints "Sets
                  this week", and a strip repeating a fact from the orient bar
                  looks like more information and is not. Sets are the stimulus,
                  volume is the load. */}
              <SummaryStrip items={[
                { label: `${unit} volume`, value: volumeThisWeek, empty: volumeThisWeek === 0 },
                { label: 'Sessions', value: sessionsThisWeek, empty: sessionsThisWeek === 0 },
                { label: 'Personal records', value: prs.length, empty: prs.length === 0 },
              ]} />
              {/* The signature visual: hard sets per muscle against the 10–20
                  hypertrophy landmark. The one chart here that says what to do
                  next rather than what happened. */}
              <div className="mt-4">
                <MuscleVolumeBalance load={muscle.rows} sets={muscle.sets} unroled={muscle.unroled} setFocusEx={setFocusEx} />
              </div>
              <div className="mt-4">
                <VolumeTrendCard
                  series={volumeSeries}
                  unit={unit}
                  focusEx={focusEx}
                  progression={progression}
                  e1rm={e1rmProg}
                />
              </div>
            </>)}

            {panel === 'sessions' && <GymHistory list={history} unit={unit} onLoad={onLoadSession} />}

            {panel === 'strength' && (<>
              <StatGrid>
                {/* ONE card, not two. `Personal records` and `Strength
                    standards` stood side by side listing the same lifts —
                    eight of nine names appeared twice on one horizontal band,
                    360px apart. */}
                <LiftTable
                  prs={prs}
                  relative={relStrength}
                  total={bigThree}
                  unit={unit}
                  focusEx={focusEx}
                  setFocusEx={setFocusEx}
                />
                {focusEx && repRecords.length > 0 && <RepPRCard exercise={focusEx} records={repRecords} unit={unit} />}
                {rpeSeries.length >= 2 && <EffortTrendCard series={rpeSeries} />}
              </StatGrid>
              {prs.length === 0 && (
                <p className="mt-3 text-label text-fg-2">Finish a session with a weight and reps on it and your records start here.</p>
              )}
            </>)}

            {panel === 'balance' && (
              <StatGrid>
                <MovementRadar data={categoryVolume} unit={unit} />
                <RecoveryMap recovery={recovery} setFocusEx={setFocusEx} />
                <ExerciseFrequencyCard rows={frequency} ratio={trainRest} setFocusEx={setFocusEx} />
                <NeglectedMuscles muscles={neglected} setFocusEx={setFocusEx} />
                <StalledLifts lifts={stalled} unit={unit} setFocusEx={setFocusEx} />
              </StatGrid>
            )}

            {panel === 'load' && load}
            {panel === 'lookup' && lookup}

            {panel === 'body' && (<>
              <WeightEntry unit={unit} onLog={(kg) => setBodyMetric(today, { weight: kg })} />
              {weightSeries.length < 2 ? (
                <Empty>Log your weight on a couple of days to see the trend.</Empty>
              ) : (
                <WeightTrendCard series={weightSeries} unit={unit} />
              )}
              <div className="mt-4">
                <ProgressPhotos />
              </div>
            </>)}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Today's weight, in the row above the trend it moves. */
function WeightEntry({ unit, onLog }: { unit: string; onLog: (value: number) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Today's weight (${unit})`}
        aria-label={`Today's weight in ${unit}`}
        className="max-w-[200px]"
      />
      <Button
        variant="secondary"
        className="press-3d"
        onClick={() => { if (value) { onLog(Number(value)); setValue('') } }}
      >Log weight</Button>
    </div>
  )
}
