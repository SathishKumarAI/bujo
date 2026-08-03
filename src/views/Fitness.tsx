import { useMemo, useState } from 'react'
import { ArrowsClockwise, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { prettyDay, todayISO, dayDiff } from '../lib/date'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { useConfirm } from '../components/ConfirmDialog'
import {
  ActivityForm, CalendarHeatmap, EmptyFrame, PageLayout, StatBar, SummaryStrip,
  draftOf, emptyDraft, workoutOf, type ActivityDraft,
} from '../components/page'
import { isActivityKey, labelOf, MODE_COPY, MODES, modeOf, modeSegments, type Mode } from '../domain/activities'
import { readDeepLink } from '../lib/deepLink'
import { useNav } from '../components/shell/nav'
import { bestOf, sessionsInMode, totalTime } from '../domain/sessions'
import { displayDistance } from '../lib/units'
import { nextSplit, splitMeta, weeklyActiveMinutes } from '../lib/fitness'
import { useStickyState } from '../lib/useStickyState'
import type { Workout } from '../lib/types'
import type { ViewId } from '../components/shell/viewChrome'

/**
 * FITNESS · the reference implementation of the page contract.
 *
 * Zone 1  orient — mode toggle, this week against the target, what's next.
 * Zone 2  act    — the log form, and the page's only primary button.
 * Zone 3  review — summary strip, the training calendar, the session list.
 *
 * Every fact in zone 1 re-reads on mode change: cardio shows minutes against
 * the weekly minutes target, strength shows sessions completed and the next
 * split day. A mode switch that only moved a highlight was the bug this whole
 * pass exists to remove.
 *
 * What used to be here and is gone:
 *
 * - the six-tile "At a glance" card, in six different hues — one insight and
 *   five distractions competing for the same glance;
 * - the "Cardio analytics" accordion, which hid the training calendar (the
 *   single most useful thing on the page) behind a fold;
 * - the Nutrition accordion, which was a whole other subject wearing a
 *   collapsed section, and now has its own page;
 * - the 2×2 stepper grid, which rendered duration, distance, calories and RPE
 *   for every activity regardless of whether the activity had any use for them;
 * - the cardio-bests badge card, which returned `null` until you had earned a
 *   badge, so it was invisible to exactly the people it was meant to motivate.
 *
 * The weekly-target ring is gone rather than recoloured. The contract allows
 * one accent-filled control per page and spends it on "Log session"; a ring is
 * a fifth appearance even in neutral, and the ratio it drew ("90 / 150 min")
 * says the same thing in less space and more precisely.
 */
export function Fitness() {
  const { data, addWorkout, removeWorkout } = useJournal()
  // Arriving with `?activity=` (including via a retired /pullups-style link)
  // preselects that activity and takes the mode from it — never the other way
  // round, because the activity is the fact and the mode is derived from it.
  const linked = readDeepLink().activity
  const initialActivity = linked && isActivityKey(linked) ? linked : null
  const [mode, setMode] = useStickyState<Mode>('fitness.mode', initialActivity ? modeOf(initialActivity) : 'cardio', MODES)
  const [draft, setDraft] = useState<ActivityDraft>(() => {
    const base = emptyDraft(initialActivity ? modeOf(initialActivity) : mode)
    return initialActivity ? { ...base, activity: initialActivity } : base
  })
  const [editing, setEditing] = useState<Workout | null>(null)
  const [showAll, setShowAll] = useState(false)

  const unit = data.settings.distanceUnit
  const today = todayISO()
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))

  // Switching mode resets the activity to that mode's first entry — an
  // activity from the other mode would render the wrong fields.
  function switchMode(next: Mode) {
    setMode(next)
    setDraft(emptyDraft(next))
  }

  const sessions = useMemo(
    () => sessionsInMode(data, mode).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data, mode],
  )

  // ── Zone 1 facts, all of which re-read on mode change ─────────────────────
  const goal = data.settings.fitnessGoalMin ?? 150
  const minutes = useMemo(() => weeklyActiveMinutes(data), [data])
  const split = useMemo(() => splitMeta(nextSplit(data)), [data])
  const thisWeekSessions = sessions.filter((s) => {
    const d = dayDiff(s.date, today)
    return d >= 0 && d < 7
  }).length
  const last = sessions[0]

  // Keyed off the mode rather than branched on it, so the two are impossible to
  // let drift apart and a third mode would be one more entry, not one more
  // ternary at every fact.
  const sessionCount = `${thisWeekSessions} ${thisWeekSessions === 1 ? 'session' : 'sessions'}`
  const WEEK: Record<Mode, string> = {
    cardio: `${minutes} / ${goal} min`,
    strength: sessionCount,
    // A game is counted, not measured against a minutes target — you play when
    // there is a game, and a "you owe 40 minutes" nag would be nonsense.
    sport: thisWeekSessions === 1 ? '1 game' : `${thisWeekSessions} games`,
  }
  const NEXT: Record<Mode, string> = {
    cardio: minutes >= goal ? 'Target met — anything you like' : `${Math.max(0, goal - minutes)} min to go`,
    strength: `${split.label} day`,
    sport: 'Whenever the court is free',
  }
  const facts = [
    { label: MODE_COPY[mode].weekLabel, value: WEEK[mode] },
    { label: 'Next up', value: NEXT[mode] },
    { label: 'Last session', value: last ? `${labelOf(last.activity)} · ${prettyDay(last.date)}` : 'None yet' },
  ]

  // ── Zone 3 summary, keyed off the registry's `best` for this activity ─────
  const best = bestOf(sessions, draft.activity, unit)
  const time = totalTime(sessions)
  const heat = useMemo(
    () => sessions.map((s) => ({ date: s.date, value: s.durationMin ?? 0 })),
    [sessions],
  )

  function submit() {
    addWorkout(workoutOf(draft, unit))
    setDraft(emptyDraft(mode))
  }

  function repeatLast() {
    if (!last) return
    setDraft({ ...draftOf(last, unit), date: today, rpe: '', notes: '' })
  }

  const shown = showAll ? sessions : sessions.slice(0, 8)

  return (
    <PageLayout
      tier={1180}
      zone1={
        <StatBar
          mode={mode}
          onModeChange={switchMode}
          segments={modeSegments()}
          facts={facts}
        />
      }
      zone2={
        <>
        <ActivityForm
          mode={mode}
          draft={draft}
          onChange={patch}
          onSubmit={submit}
          unit={unit}
          submitLabel="Log session"
          right={last ? (
            <Button variant="ghost" onClick={repeatLast} className="inline-flex items-center gap-1 text-label">
              <Icon as={ArrowsClockwise} size="sm" /> Repeat last
            </Button>
          ) : undefined}
        />
        <CompanionTool activity={draft.activity} mode={mode} />
        </>
      }
      zone3={
        <>
          <SummaryStrip items={[
            { label: 'Sessions', value: sessions.length, empty: sessions.length === 0 },
            { label: 'Total time', value: time.value, empty: time.empty },
            { label: best.label, value: best.value, empty: best.empty },
          ]} />

          <section>
            <h2 className="mb-2 text-label text-fg-2">Training calendar</h2>
            <CalendarHeatmap weeks={12} data={heat} unit="min" />
          </section>

          <section>
            <div className="mb-1 flex items-baseline justify-between gap-2 border-b border-line pb-1">
              <h2 className="text-label text-fg-2">Sessions</h2>
              {sessions.length > 8 && (
                <Button variant="ghost" onClick={() => setShowAll((v) => !v)} className="h-auto p-0 text-label">
                  {showAll ? 'Show less' : `Show all (${sessions.length})`}
                </Button>
              )}
            </div>
            {sessions.length === 0 ? (
              <EmptyFrame>Log a session to start your history.</EmptyFrame>
            ) : (
              <ul>
                {shown.map((w) => (
                  <li key={w.id} className="group flex items-center justify-between gap-2 border-b border-line py-2 last:border-b-0">
                    <button onClick={() => setEditing(w)} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
                      <span className="truncate font-medium text-fg-1">{labelOf(w.activity)}</span>
                      <span className="shrink-0 text-label text-fg-2">{prettyDay(w.date)}</span>
                    </button>
                    <div className="num flex shrink-0 items-center gap-2 text-label text-fg-2">
                      {w.durationMin != null && <span>{w.durationMin}m</span>}
                      {w.distanceKm != null && <span>{displayDistance(w.distanceKm, unit)}{unit}</span>}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeWorkout(w.id)}
                        aria-label={`Delete ${labelOf(w.activity)} on ${prettyDay(w.date)}`}
                        className="text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red"
                      >×</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <EditDialog workout={editing} onClose={() => setEditing(null)} />
        </>
      }
    />
  )
}

/**
 * The one contextual door out of this page.
 *
 * Collapsing Pull-ups, Home workout and Pickleball off the tab row relocated
 * them; it did not delete the tools behind them. The pull-up program, the
 * bodyweight exercise library and the pickleball match record are real
 * surfaces with their own data — Pickleball's is a different type entirely —
 * and folding them into a log form would have lost them.
 *
 * So the *activity* is the relocation, and this is the door: one link, shown
 * only when the selected activity has a companion, inside zone 2 because
 * opening the pull-up program is part of acting on a pull-up session rather
 * than reviewing one. It is not a zone 4, and it is never more than one link.
 */
const COMPANION: Record<string, { view: ViewId; label: string }> = {
  pullups: { view: 'pullups', label: 'Pull-up program & progressions' },
  homeWorkout: { view: 'homeworkout', label: 'Bodyweight exercise library' },
  pickleball: { view: 'pickleball', label: 'Pickleball record & matchups' },
}
/** Every strength activity shares one workshop, so it is keyed by mode. */
const MODE_COMPANION: Partial<Record<Mode, { view: ViewId; label: string }>> = {
  strength: { view: 'gym', label: 'Strength tools · programs, anatomy, plates' },
}

function CompanionTool({ activity, mode }: { activity: string; mode: Mode }) {
  const navigate = useNav()
  const tool = COMPANION[activity] ?? MODE_COMPANION[mode]
  if (!tool) return null
  return (
    <Button variant="ghost" onClick={() => navigate(tool.view)} className="mt-2 h-auto justify-start p-0 text-label">
      {tool.label} ›
    </Button>
  )
}

/** In-place edit for a logged session, so correcting one costs no scrolling. */
function EditDialog({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const { updateWorkout, removeWorkout } = useJournal()
  return (
    <Dialog open={!!workout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit session</DialogTitle></DialogHeader>
        {workout && (
          <EditFields
            workout={workout}
            onSave={(p) => { updateWorkout(workout.id, p); onClose() }}
            onDelete={() => { removeWorkout(workout.id); onClose() }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditFields({ workout, onSave, onDelete }: {
  workout: Workout
  onSave: (p: Omit<Workout, 'id'>) => void
  onDelete: () => void
}) {
  const confirm = useConfirm()
  const { data } = useJournal()
  const unit = data.settings.distanceUnit
  const [draft, setDraft] = useState(() => draftOf(workout, unit))
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))
  // The session's own mode, not the page's: editing a push day should let you
  // correct it to a pull day, never silently reclassify it as a Run.
  return (
    <div className="space-y-3">
      <ActivityForm
        mode={modeOf(draft.activity)}
        draft={draft}
        onChange={patch}
        onSubmit={() => onSave(workoutOf(draft, unit))}
        unit={unit}
        submitLabel="Save session"
      />
      <Button
        variant="ghost"
        onClick={async () => {
          if (await confirm({
            title: 'Delete this session?',
            description: 'The session and its sets are removed from your history. This cannot be undone.',
            confirmLabel: 'Delete session',
            destructive: true,
          })) onDelete()
        }}
        className="inline-flex items-center gap-1.5 text-red hover:text-red"
      ><Icon as={Trash} size="sm" /> Delete</Button>
    </div>
  )
}
