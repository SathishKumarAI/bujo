import { useState } from 'react'
import { CalendarDot, CaretDown, Check, Clock, Gauge, SlidersHorizontal, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../../store'
import { useConfirm } from '../../ConfirmDialog'
import { notify } from '../../../lib/notify'
import { addDays, dayDiff, prettyDay, todayISO } from '../../../lib/date'
import { weeklyActiveMinutes } from '../../../lib/fitness'
import { cadence } from '../../../lib/fitnessReview'
import { fullLabelOf, labelOf, MODE_COPY, modeSegments, type Mode } from '../../../domain/activities'
import { draftIsEmpty, draftOf, workoutOf, type ActivityDraft } from '../../page/draft'
import type { DistanceUnit, Workout } from '../../../lib/types'
import { Cell, Cells } from '../../ui/cells'
import { Seg } from '../../ui/seg'
import { Sheet } from '../../ui/sheet'
import { StatTiles } from '../../ui/statTiles'
import { ActivityFieldsPhone } from './ActivityFieldsPhone'
import { carryOverWorkout, glyphOf } from './phoneHelpers'
import { cat, onAccent } from '../../../lib/colors'


/**
 * FITNESS ON A PHONE — the whole page, instead of the desktop's three zones
 * (COD-459). Same shape as Pickleball's phone page, because a person who has
 * learnt one has learnt both: the log first and nothing to scroll to log it;
 * the week as three numbers; recent sessions as rows that open an edit sheet;
 * no charts (a phone logs, a desktop reads — CLAUDE.md).
 *
 * OWNS: the phone order and the edit sheet. DOES NOT OWN: the draft shape,
 * `workoutOf`, the store, or which fields an activity asks for.
 */
export function FitnessPhone({ mode, onMode, sessions, unit }: {
  mode: Mode
  onMode: (m: Mode) => void
  /** This mode's sessions, newest first. */
  sessions: Workout[]
  unit: DistanceUnit
}) {
  const { data, addWorkout } = useJournal()
  const today = todayISO()
  const [draft, setDraft] = useState<ActivityDraft>(() => carryOverWorkout(sessions[0], mode, unit))
  const [more, setMore] = useState(false)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [all, setAll] = useState(false)
  const patch = (p: Partial<ActivityDraft>) => setDraft((c) => ({ ...c, ...p }))
  const yesterday = addDays(today, -1)
  const dayLabel = draft.date === today ? 'Today' : draft.date === yesterday ? 'Yesterday' : prettyDay(draft.date)

  // The parent renders this page with `key={mode}`, so a mode switch REMOUNTS
  // it and the draft carries over from that mode's own last session — not the
  // other mode's.
  const switchMode = (next: Mode | null) => { if (next && next !== mode) onMode(next) }
  function log() {
    if (draftIsEmpty(draft)) { notify.info('Nothing to log yet', 'Add minutes or a distance first.'); return }
    const w = workoutOf(draft, unit)
    addWorkout(w)
    setDraft(carryOverWorkout({ ...w, id: '' }, mode, unit))
  }

  const goal = data.settings.fitnessGoalMin ?? 150
  const minutes = weeklyActiveMinutes(data)
  const weekCount = sessions.filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < 7 }).length
  const pace = cadence(sessions, 8, today)
  const added = [draft.subActivity, draft.calories, draft.notes.trim()].filter(Boolean).length
  const shown = all ? sessions : sessions.slice(0, 5)
  const verb = mode === 'sport' ? 'Log game' : `Log ${labelOf(draft.activity).toLowerCase()}`

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="sr-only">Fitness</h1>

      <section aria-label={MODE_COPY[mode].formHeading} className="ios-form flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
            <Icon as={CalendarDot} size="sm" className="text-fg-2" />
            {dayLabel}
            <Icon as={CaretDown} size="sm" className="text-fg-2" />
            <input type="date" value={draft.date} max={today} onChange={(e) => e.target.value && patch({ date: e.target.value })} aria-label={`Date, ${dayLabel}`} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <Seg label="Mode" className="min-w-0 flex-1" value={mode} onChange={switchMode} options={modeSegments()} />
        </div>

        <ActivityFieldsPhone part="main" mode={mode} draft={draft} onChange={patch} unit={unit} />

        <Cells>
          <Cell icon={SlidersHorizontal} tone="mauve" title="Type, calories, notes" subtitle={added > 0 ? `${added} added` : 'Optional'} onPress={() => setMore(true)} />
        </Cells>

        <button type="button" className="cta" onClick={log}><Icon as={Check} size="md" />{verb}</button>

        <Sheet open={more} onOpenChange={setMore} title={`More about this ${mode === 'sport' ? 'game' : 'session'}`} description="All optional">
          <ActivityFieldsPhone part="more" mode={mode} draft={draft} onChange={patch} unit={unit} />
        </Sheet>
      </section>

      <StatTiles label="This week" tiles={[
        { k: 'All training', v: `${minutes}/${goal}`, icon: Timer, tone: minutes >= goal ? 'green' : 'sky' },
        { k: mode === 'sport' ? 'Games' : 'Sessions', v: String(weekCount), icon: Clock, tone: 'mauve' },
        { k: 'Cadence', v: pace.avgGap != null ? `${pace.avgGap}d` : '–', icon: Gauge, tone: 'teal' },
      ]} />

      {sessions.length > 0 && (
        <Cells title="Recent" aside={`${sessions.length} logged`}>
          {shown.map((w) => {
            const d = draftOf(w, unit)
            const meta = [w.durationMin ? `${w.durationMin} min` : '', d.distance ? `${d.distance} ${unit}` : '', w.rpe ? `effort ${w.rpe}` : ''].filter(Boolean).join(' · ')
            return (
              <Cell
                key={w.id}
                lead={(
                  <span aria-hidden className="cell-tile" style={{ background: cat('sky'), color: onAccent(cat('sky')) }}>
                    <Icon as={glyphOf(w.activity)} size="sm" />
                  </span>
                )}
                title={`${fullLabelOf(w.activity, w.subActivity)} · ${prettyDay(w.date)}`}
                subtitle={meta || 'No details'}
                label="Edit session"
                onPress={() => setEditing(w)}
              />
            )
          })}
          {sessions.length > 5 && <Cell title={all ? 'Show fewer' : `Show all ${sessions.length}`} onPress={() => setAll((x) => !x)} chevron={false} />}
        </Cells>
      )}

      {editing && <WorkoutSheet w={editing} mode={mode} unit={unit} onClose={() => setEditing(null)} />}
    </div>
  )
}

/**
 * Edit or delete one logged session — the whole session, in a sheet. Done
 * saves; Delete asks first and names what it removes (docs/USER-CONTROL.md).
 */
function WorkoutSheet({ w, mode, unit, onClose }: { w: Workout; mode: Mode; unit: DistanceUnit; onClose: () => void }) {
  const { updateWorkout, removeWorkout } = useJournal()
  const confirm = useConfirm()
  const [d, setD] = useState<ActivityDraft>(() => draftOf(w, unit))
  const patch = (p: Partial<ActivityDraft>) => setD((c) => ({ ...c, ...p }))
  const what = `${fullLabelOf(w.activity, w.subActivity)} · ${prettyDay(w.date)}${w.durationMin ? ` · ${w.durationMin} min` : ''}`
  async function remove() {
    if (await confirm({ title: 'Delete this session?', description: `${what}. This cannot be undone.`, confirmLabel: 'Delete session', destructive: true })) {
      removeWorkout(w.id)
      onClose()
    }
  }
  return (
    <Sheet open onOpenChange={(o) => { if (!o) { updateWorkout(w.id, workoutOf(d, unit)); onClose() } }} title="Edit session" description={what}>
      <div className="flex flex-col gap-4">
        <Cells>
          <label className="cell">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Date</span>
            <input type="date" value={d.date} max={todayISO()} onChange={(e) => e.target.value && patch({ date: e.target.value })} className="cell-input" aria-label="Date" />
          </label>
        </Cells>
        <ActivityFieldsPhone part="main" mode={mode} draft={d} onChange={patch} unit={unit} />
        <ActivityFieldsPhone part="more" mode={mode} draft={d} onChange={patch} unit={unit} />
        <button type="button" onClick={remove} className="h-12 rounded-[0.875rem] bg-danger-wash text-body font-semibold text-danger-text">Delete session</button>
      </div>
    </Sheet>
  )
}
