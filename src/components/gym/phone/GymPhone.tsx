import { useState } from 'react'
import { ArrowsClockwise, Barbell, CalendarDot, CaretDown, Check, ClipboardText, Clock, Plus, Stack, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../../store'
import { useConfirm } from '../../ConfirmDialog'
import { addDays, dayDiff, prettyDay, todayISO } from '../../../lib/date'
import { SPLITS, splitMeta, PPL_PRESETS } from '../../../lib/fitness'
import { cat, onAccent } from '../../../lib/colors'
import type { JournalData, Split, Workout } from '../../../lib/types'
import { Cell, Cells } from '../../ui/cells'
import { Sheet } from '../../ui/sheet'
import { StatTiles } from '../../ui/statTiles'
import { newSetRow, type SetRow } from '../setRow'
import { SetCards } from './SetCards'
import { rowsOf, storedSets } from './strengthHelpers'

/**
 * STRENGTH ON A PHONE — the whole page, instead of the desktop's three zones
 * (COD-460). Same family as Pickleball's and Fitness's: the log first; the
 * week as three numbers; recent sessions as rows that open an edit sheet; no
 * charts (CLAUDE.md, a phone logs and a desktop reads).
 *
 * OWNS: the phone order, the add-exercise sheet and the edit sheet.
 * DOES NOT OWN: the session rows, `finish()` (PR detection, the summary), the
 * rest timer or the routines — all the view's, passed in, so the phone and the
 * desktop log a session through the same function.
 */
export function GymPhone({ data, split, setSplit, suggested, rows, setRows, date, setDate, onFinish, unit, recentExercises, onRest, onLoadRoutine, setsThisWeek, lastSession, rest }: {
  data: JournalData
  split: Split
  setSplit: (s: Split) => void
  suggested: Split
  rows: SetRow[]
  setRows: (r: SetRow[]) => void
  date: string
  setDate: (d: string) => void
  onFinish: () => void
  unit: string
  recentExercises: string[]
  onRest: (row: SetRow) => void
  onLoadRoutine: (exercises: string[], split: Split) => void
  setsThisWeek: number
  lastSession?: Workout
  /** The rest timer, rendered by the view so phone and desktop share it. */
  rest: React.ReactNode
}) {
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const dayLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : prettyDay(date)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [all, setAll] = useState(false)
  const filled = rows.filter((r) => r.exercise.trim())
  const workingSets = filled.filter((r) => r.kind !== 'warmup' && r.weight && r.reps).length
  const sessions = [...data.workouts].filter((w) => w.split).sort((a, b) => (a.date < b.date ? 1 : -1))
  const shown = all ? sessions : sessions.slice(0, 5)
  const lastGap = lastSession ? dayDiff(lastSession.date, today) : null

  function addExercise(name: string) {
    const n = name.trim()
    if (!n) return
    // Replace the single blank starter row rather than leaving it orphaned.
    const base = rows.filter((r) => r.exercise.trim())
    setRows([...base, newSetRow({ exercise: n })])
    setAdding(false)
  }
  function rested(r: SetRow) {
    setDone((d) => new Set(d).add(r.id))
    onRest(r)
  }
  function finish() {
    onFinish()
    setDone(new Set())
  }

  return (
    /* Extra room at the bottom while the rest timer is docked, so it can never
       sit permanently over the last card. */
    <div className={rest ? 'flex flex-col gap-6 pb-36' : 'flex flex-col gap-6 pb-4'}>
      <h1 className="sr-only">Strength</h1>

      <section aria-label="Today’s session" className="ios-form flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <label className="relative inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
            <Icon as={CalendarDot} size="sm" className="text-fg-2" />
            {dayLabel}
            <Icon as={CaretDown} size="sm" className="text-fg-2" />
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={`Date, ${dayLabel}`} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <span className="text-label text-fg-2">Next up: <span className="font-semibold text-fg-1">{splitMeta(suggested).label}</span></span>
        </div>

        {/* THE SPLIT, as tiles. The suggested one is pre-selected by the view
            (`nextSplit`), so most sessions start without touching this row. */}
        <div role="radiogroup" aria-label="Split" className="picker-row">
          {SPLITS.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={split === s.id} className="pick-tile" onClick={() => setSplit(s.id)}>
              <span aria-hidden className="stat-icon" style={{ background: cat(s.color), color: onAccent(cat(s.color)) }}><Icon as={Barbell} size="sm" /></span>
              {s.label}
            </button>
          ))}
        </div>

        {filled.length === 0 ? (
          <Cells>
            <Cell icon={Plus} tone="mauve" title="Add an exercise" subtitle="Your recent lifts are one tap away" onPress={() => setAdding(true)} />
            <Cell icon={ClipboardText} tone="teal" title="Start from a routine" subtitle={`${data.routines.length + PPL_PRESETS.length} ready to load`} onPress={() => setAdding(true)} />
          </Cells>
        ) : (
          <>
            <SetCards rows={rows} onChange={setRows} unit={unit} data={data} onRest={rested} done={done} />
            <button type="button" className="suggest inline-flex items-center justify-center gap-1.5" onClick={() => setAdding(true)}>
              <Icon as={Plus} size="sm" /> Add exercise
            </button>
          </>
        )}

        {/* Docked above the bottom nav while it runs: rendered in the flow it
            sat below every exercise card, off screen exactly when it counts. */}
        {rest && <div className="rest-dock">{rest}</div>}

        <button type="button" className="cta" onClick={finish}>
          <Icon as={Check} size="md" />{workingSets > 0 ? `Finish workout · ${workingSets} ${workingSets === 1 ? 'set' : 'sets'}` : 'Finish workout'}
        </button>
      </section>

      <StatTiles label="This week" tiles={[
        { k: 'Sets', v: String(setsThisWeek), icon: Stack, tone: 'mauve' },
        { k: 'Last', v: lastSession ? (lastGap === 0 ? 'Today' : lastGap === 1 ? '1d ago' : `${lastGap}d ago`) : '–', icon: Clock, tone: 'sky' },
        { k: 'Next', v: splitMeta(suggested).label, icon: Trophy, tone: 'green' },
      ]} />

      {sessions.length > 0 && (
        <Cells title="Recent" aside={`${sessions.length} logged`}>
          {shown.map((w) => {
            const m = splitMeta(w.split)
            const exercises = [...new Set((w.setRows ?? []).map((s) => s.exercise))]
            const n = (w.setRows ?? []).filter((s) => s.kind !== 'warmup').length || w.sets.length
            return (
              <Cell
                key={w.id}
                lead={<span aria-hidden className="cell-tile" style={{ background: cat(m.color), color: onAccent(cat(m.color)) }}><Icon as={Barbell} size="sm" /></span>}
                title={`${m.label} · ${prettyDay(w.date)}`}
                subtitle={`${n} ${n === 1 ? 'set' : 'sets'}${exercises.length ? ` · ${exercises.slice(0, 3).join(', ')}` : ''}`}
                label="Edit session"
                onPress={() => setEditing(w)}
              />
            )
          })}
          {sessions.length > 5 && <Cell title={all ? 'Show fewer' : `Show all ${sessions.length}`} onPress={() => setAll((x) => !x)} chevron={false} />}
        </Cells>
      )}

      <AddExerciseSheet
        open={adding}
        onClose={() => setAdding(false)}
        recent={recentExercises}
        routines={[...data.routines, ...PPL_PRESETS]}
        onAdd={addExercise}
        onRoutine={(exs, s) => { onLoadRoutine(exs, s); setAdding(false) }}
      />
      {editing && (
        <WorkoutSheet
          w={editing}
          unit={unit}
          data={data}
          onClose={() => setEditing(null)}
          onRepeat={(exs, s) => { onLoadRoutine(exs, s); setEditing(null) }}
        />
      )}
    </div>
  )
}

/** Recent lifts as one-tap rows, a field for a new one, and routines to load. */
function AddExerciseSheet({ open, onClose, recent, routines, onAdd, onRoutine }: {
  open: boolean
  onClose: () => void
  recent: string[]
  routines: { name: string; split: Split; exercises: string[] }[]
  onAdd: (name: string) => void
  onRoutine: (exercises: string[], split: Split) => void
}) {
  const [name, setName] = useState('')
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }} title="Add an exercise" description="Tap a recent lift, type a new one, or load a routine">
      <div className="flex flex-col gap-5">
        <Cells>
          <div className="cell gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Exercise name" aria-label="Exercise name" className="cell-input cell-input-left" onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(name); setName('') } }} />
            <button type="button" className="round-btn round-btn-primary" aria-label="Add this exercise" onClick={() => { onAdd(name); setName('') }}><Icon as={Plus} size="md" /></button>
          </div>
        </Cells>
        {recent.length > 0 && (
          <Cells title="Recent">
            {recent.map((ex) => <Cell key={ex} icon={Barbell} tone="sky" title={ex} onPress={() => onAdd(ex)} />)}
          </Cells>
        )}
        <Cells title="Routines">
          {routines.map((r) => (
            <Cell key={`${r.name}-${r.split}`} icon={ClipboardText} tone={splitMeta(r.split).color} title={r.name} subtitle={`${r.exercises.length} exercises · ${splitMeta(r.split).label}`} onPress={() => onRoutine(r.exercises, r.split)} />
          ))}
        </Cells>
      </div>
    </Sheet>
  )
}

/**
 * Edit, repeat or delete one logged session. Done saves through the same
 * `storedSets` the log uses; Delete asks first and names what it removes
 * (docs/USER-CONTROL.md).
 */
function WorkoutSheet({ w, unit, data, onClose, onRepeat }: {
  w: Workout
  unit: string
  data: JournalData
  onClose: () => void
  onRepeat: (exercises: string[], split: Split) => void
}) {
  const { updateWorkout, removeWorkout } = useJournal()
  const confirm = useConfirm()
  const [rows, setRows] = useState<SetRow[]>(() => rowsOf(w))
  const [d, setD] = useState(w.date)
  const m = splitMeta(w.split)
  const what = `${m.label} · ${prettyDay(w.date)} · ${rows.length} ${rows.length === 1 ? 'set' : 'sets'}`
  async function remove() {
    if (await confirm({ title: 'Delete this session?', description: `${what}. This cannot be undone.`, confirmLabel: 'Delete session', destructive: true })) {
      removeWorkout(w.id)
      onClose()
    }
  }
  function save() {
    updateWorkout(w.id, { date: d, ...storedSets(rows, unit, data.settings) })
    onClose()
  }
  return (
    <Sheet open onOpenChange={(o) => { if (!o) save() }} title="Edit session" description={what}>
      <div className="flex flex-col gap-4">
        <Cells>
          <label className="cell">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Date</span>
            <input type="date" value={d} max={todayISO()} onChange={(e) => e.target.value && setD(e.target.value)} className="cell-input" aria-label="Date" />
          </label>
          <Cell icon={ArrowsClockwise} tone="green" title="Do this again" subtitle="Load these exercises into today’s session" onPress={() => {
            // Save first: an edit made just before "Do this again" must not be
            // dropped by the sheet closing on the way out.
            updateWorkout(w.id, { date: d, ...storedSets(rows, unit, data.settings) })
            onRepeat([...new Set(rows.map((r) => r.exercise).filter(Boolean))], w.split ?? 'other')
          }} />
        </Cells>
        <SetCards rows={rows} onChange={setRows} unit={unit} data={data} />
        <button type="button" onClick={remove} className="h-12 rounded-[0.875rem] bg-danger-wash text-body font-semibold text-danger-text">Delete session</button>
      </div>
    </Sheet>
  )
}
