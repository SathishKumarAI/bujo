import { useState } from 'react'
import { Pencil, Repeat, Trash2 } from 'lucide-react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO, dayDiff } from '../lib/date'
import { Button, Card, Empty, Input, Segmented, Textarea } from '../components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { pace, weeklyActiveMinutes, activeDayStreak, cardioPBs } from '../lib/fitness'
import type { Workout } from '../lib/types'

const ACTIVITIES = ['Run', 'Walk', 'Strength', 'Cycling', 'Yoga', 'Swim', 'HIIT', 'Sport', 'Other']
type Form = { date: string; activity: string; duration: string; distance: string; calories: string; rpe: string; sets: string; notes: string }
const emptyForm: Form = { date: todayISO(), activity: 'Run', duration: '', distance: '', calories: '', rpe: '', sets: '', notes: '' }
const formToPayload = (f: Form): Omit<Workout, 'id'> => ({
  date: f.date, activity: f.activity,
  durationMin: f.duration ? Number(f.duration) : undefined,
  distanceKm: f.distance ? Number(f.distance) : undefined,
  calories: f.calories ? Number(f.calories) : undefined,
  rpe: f.rpe ? Number(f.rpe) : undefined,
  sets: f.sets.split('\n').map((s) => s.trim()).filter(Boolean),
  notes: f.notes.trim(),
})
const workoutToForm = (w: Workout): Form => ({
  date: w.date, activity: w.activity,
  duration: w.durationMin?.toString() ?? '', distance: w.distanceKm?.toString() ?? '',
  calories: w.calories?.toString() ?? '', rpe: w.rpe?.toString() ?? '',
  sets: w.sets.join('\n'), notes: w.notes,
})

export function Fitness() {
  const { data, addWorkout, removeWorkout, setSettings } = useJournal()
  const [f, setF] = useState(emptyForm)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [range, setRange] = useState<'week' | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const set = (p: Partial<Form>) => setF((cur) => ({ ...cur, ...p }))

  const dist = data.settings.distanceUnit
  const today = todayISO()
  const workouts = [...data.workouts].sort((a, b) => (a.date < b.date ? 1 : -1))
  const inRange = range === 'week' ? data.workouts.filter((w) => { const d = dayDiff(w.date, today); return d >= 0 && d < 7 }) : data.workouts
  const totalMin = inRange.reduce((s, w) => s + (w.durationMin ?? 0), 0)
  const totalKm = inRange.reduce((s, w) => s + (w.distanceKm ?? 0), 0)
  const goal = data.settings.fitnessGoalMin ?? 150
  const weekMin = weeklyActiveMinutes(data, today)
  const streak = activeDayStreak(data, today)
  const pbs = cardioPBs(data)

  // Weekly-minutes sparkline: last 8 weeks (whole numbers).
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(today, -7 * i)
    const mins = data.workouts
      .filter((w) => { const d = dayDiff(w.date, end); return d >= 0 && d < 7 })
      .reduce((s, w) => s + (w.durationMin ?? 0), 0)
    return mins
  }).reverse()
  const maxWeek = Math.max(goal, ...weeks, 1)

  function submit() {
    if (!f.activity) return
    addWorkout(formToPayload(f))
    setF(emptyForm)
  }

  function repeatLast() {
    const last = workouts[0]
    if (!last) return
    setF({ ...workoutToForm(last), date: today, rpe: '', notes: '' })
  }

  return (
    <Page
      aside={
        <Card title="Log a workout" right={workouts.length > 0 ? <Button onClick={repeatLast} className="inline-flex items-center gap-1"><Repeat size={13} /> Repeat last</Button> : undefined}>
          <div className="space-y-3">
            <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
            <label className="block text-sm text-subtext1">Activity
              <select value={f.activity} onChange={(e) => set({ activity: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text">
                {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={f.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="Min" aria-label="Duration minutes" />
              <Input type="number" value={f.distance} onChange={(e) => set({ distance: e.target.value })} placeholder={dist === 'mi' ? 'Mi' : 'Km'} aria-label="Distance" />
              <Input type="number" value={f.calories} onChange={(e) => set({ calories: e.target.value })} placeholder="Kcal" aria-label="Calories" />
              <Input type="number" value={f.rpe} onChange={(e) => set({ rpe: e.target.value })} placeholder="RPE 1–10" aria-label="RPE" />
            </div>
            {f.distance && f.duration && <p className="text-xs text-overlay0">Pace: {pace(Number(f.distance) * (dist === 'mi' ? 1.60934 : 1), Number(f.duration), dist)}</p>}
            <Textarea value={f.sets} onChange={(e) => set({ sets: e.target.value })} placeholder={'Sets, one per line\nBench 5x5 @ 60kg'} rows={3} />
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it feel?" rows={2} />
            <Button variant="primary" onClick={submit} className="w-full">Log workout</Button>
          </div>
        </Card>
      }
    >
      <Card title="This week" subtitle="Active-minutes goal">
        <div className="flex items-center gap-5">
          <GoalRing value={weekMin} goal={goal} />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-subtext1">Weekly goal</span>
              <span className="inline-flex items-center gap-1">
                <Input type="number" value={goal} onChange={(e) => setSettings({ fitnessGoalMin: e.target.value ? Number(e.target.value) : undefined })} className="w-20 py-1 text-right" />
                <span className="text-xs text-overlay0">min</span>
              </span>
            </div>
            <p className="text-sm text-subtext0">{weekMin} of {goal} min this week</p>
            <p className="text-sm text-peach">🔥 {streak}-day active streak</p>
          </div>
        </div>
        {/* 8-week sparkline (whole-number minutes) */}
        <div className="mt-4 flex items-end gap-1" style={{ height: 56 }} title="Active minutes per week (last 8 weeks)">
          {weeks.map((m, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(2, (m / maxWeek) * 100)}%`, background: m >= goal ? cat('green') : cat('surface2') }} />
          ))}
        </div>
        <p className="mt-1 text-center text-[10px] text-overlay0">last 8 weeks · green = goal hit</p>
      </Card>

      <Card title="Totals" right={<Segmented value={range} onChange={setRange} options={[{ value: 'week', label: 'This week' }, { value: 'all', label: 'All time' }]} />}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Workouts" value={inRange.length} color="teal" />
          <Stat label="Minutes" value={totalMin} color="peach" />
          <Stat label={dist === 'mi' ? 'Miles' : 'Kilometers'} value={Math.round(totalKm * 10) / 10} color="sky" />
        </div>
      </Card>

      <Card title="Personal bests" subtitle="All-time cardio">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label={dist === 'mi' ? 'Longest (mi)' : 'Longest (km)'} value={Math.round((dist === 'mi' ? pbs.longestKm / 1.60934 : pbs.longestKm) * 10) / 10} color="green" />
          <Stat label="Most kcal" value={pbs.mostCalories} color="red" />
          <Stat label="Longest (min)" value={pbs.mostMinutes} color="peach" />
        </div>
      </Card>

      <NutritionCard date={f.date} />

      <Card
        title="History"
        subtitle="Tap a workout to edit"
        right={workouts.length > 6 ? <Button onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show recent' : `Show all (${workouts.length})`}</Button> : undefined}
      >
        {workouts.length === 0 ? (
          <Empty>No workouts logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-surface0">
            {(showAll ? workouts : workouts.slice(0, 6)).map((w) => {
              const p = pace(w.distanceKm, w.durationMin, dist)
              return (
                <li key={w.id} className="group flex items-center justify-between gap-3 py-2">
                  <button onClick={() => setEditing(w)} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
                    <span className="truncate font-medium text-text group-hover:text-mauve">{w.activity}</span>
                    <span className="shrink-0 text-xs text-overlay0">{prettyDay(w.date)}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2.5 text-xs text-subtext0">
                    {w.durationMin != null && <span>{w.durationMin}m</span>}
                    {w.distanceKm != null && <span>{w.distanceKm}{dist}</span>}
                    {p && <span className="text-sky">{p}</span>}
                    <button onClick={() => setEditing(w)} aria-label="Edit workout" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-mauve"><Pencil size={13} /></button>
                    <button onClick={() => removeWorkout(w.id)} aria-label="Delete workout" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <WorkoutEditDialog workout={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}

/** In-place edit window for a logged workout (no scrolling to the form). */
function WorkoutEditDialog({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const { updateWorkout, removeWorkout } = useJournal()
  return (
    <Dialog open={!!workout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit workout</DialogTitle></DialogHeader>
        {workout && <EditFields workout={workout} onSave={(p) => { updateWorkout(workout.id, p); onClose() }} onDelete={() => { removeWorkout(workout.id); onClose() }} />}
      </DialogContent>
    </Dialog>
  )
}

function EditFields({ workout, onSave, onDelete }: { workout: Workout; onSave: (p: Omit<Workout, 'id'>) => void; onDelete: () => void }) {
  const [f, setF] = useState<Form>(() => workoutToForm(workout))
  const set = (p: Partial<Form>) => setF((cur) => ({ ...cur, ...p }))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
        <label className="block text-sm text-subtext1">Activity
          <select value={f.activity} onChange={(e) => set({ activity: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text">
            {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" value={f.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="Min" aria-label="Duration minutes" />
        <Input type="number" value={f.distance} onChange={(e) => set({ distance: e.target.value })} placeholder="Distance" aria-label="Distance" />
        <Input type="number" value={f.calories} onChange={(e) => set({ calories: e.target.value })} placeholder="Kcal" aria-label="Calories" />
        <Input type="number" value={f.rpe} onChange={(e) => set({ rpe: e.target.value })} placeholder="RPE 1–10" aria-label="RPE" />
      </div>
      <Textarea value={f.sets} onChange={(e) => set({ sets: e.target.value })} placeholder="Sets, one per line" rows={3} />
      <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Notes" rows={2} />
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => onSave(formToPayload(f))} className="flex-1">Save</Button>
        <Button variant="danger" onClick={() => { if (confirm('Delete this workout?')) onDelete() }} className="inline-flex items-center gap-1.5"><Trash2 size={14} /> Delete</Button>
      </div>
    </div>
  )
}

/** A circular progress ring (whole-number percent). */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, goal)) * 100))
  const r = 30
  const circ = 2 * Math.PI * r
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke={cat('surface0')} strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={cat(pct >= 100 ? 'green' : 'mauve')} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 38 38)" />
      <text x="38" y="42" textAnchor="middle" className="fill-text font-bold" fontSize="16">{pct}%</text>
    </svg>
  )
}

function NutritionCard({ date }: { date: string }) {
  const { data, setMetric } = useJournal()
  const m = data.metrics.find((x) => x.date === date)
  const macros = [
    { k: 'protein' as const, label: 'Protein', color: 'red', val: m?.protein },
    { k: 'carbs' as const, label: 'Carbs', color: 'yellow', val: m?.carbs },
    { k: 'fat' as const, label: 'Fat', color: 'sky', val: m?.fat },
  ]
  const totalG = macros.reduce((s, x) => s + (x.val ?? 0), 0)

  return (
    <Card title="Nutrition" subtitle="Calories & macros for the day">
      <label className="mb-3 block text-sm text-subtext1">
        Calories
        <Input
          type="number"
          value={m?.calories ?? ''}
          onChange={(e) => setMetric(date, { calories: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="kcal"
          className="mt-1"
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {macros.map((mac) => (
          <label key={mac.k} className="block text-xs text-subtext1">
            {mac.label} (g)
            <Input
              type="number"
              value={mac.val ?? ''}
              onChange={(e) => setMetric(date, { [mac.k]: e.target.value ? Number(e.target.value) : undefined })}
              className="mt-1 py-1.5"
            />
          </label>
        ))}
      </div>
      {totalG > 0 && (
        <div className="mt-3">
          <div className="flex h-3 overflow-hidden rounded-full">
            {macros.map((mac) => (
              <div key={mac.k} style={{ width: `${((mac.val ?? 0) / totalG) * 100}%`, background: cat(mac.color) }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-overlay0">
            {macros.map((mac) => (
              <span key={mac.k} style={{ color: cat(mac.color) }}>● {mac.label} {mac.val ?? 0}g</span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-surface0 bg-base py-3">
      <div className="text-2xl font-bold" style={{ color: cat(color) }}>{value}</div>
      <div className="text-xs text-overlay0">{label}</div>
    </div>
  )
}
