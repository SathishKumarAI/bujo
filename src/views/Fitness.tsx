import { useState } from 'react'
import { Repeat, Trash2 } from 'lucide-react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO, dayDiff } from '../lib/date'
import { Button, Card, Empty, Input, Segmented, StatTile, Textarea } from '../components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { pace, weeklyActiveMinutes, activeDayStreak, cardioPBs } from '../lib/fitness'
import { FOODS, SAMPLE_DAY, sumFoods, type Food } from '../lib/foods'
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

  const shown = showAll ? workouts : workouts.slice(0, 6)

  return (
    <Page
      asideFirst
      aside={
        <>
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

        <Card
          title="History"
          subtitle="Tap a workout to edit"
          right={workouts.length > 6 ? <Button onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show less' : `Show all (${workouts.length})`}</Button> : undefined}
        >
          {workouts.length === 0 ? (
            <Empty>No workouts logged yet.</Empty>
          ) : (
            <ul className="divide-y divide-surface0">
              {shown.map((w) => {
                const p = pace(w.distanceKm, w.durationMin, dist)
                return (
                  <li key={w.id} className="group flex items-center justify-between gap-2 py-2">
                    <button onClick={() => setEditing(w)} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
                      <span className="truncate font-medium text-text group-hover:text-mauve">{w.activity}</span>
                      <span className="shrink-0 text-xs text-overlay0">{prettyDay(w.date)}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-subtext0">
                      {w.durationMin != null && <span>{w.durationMin}m</span>}
                      {w.distanceKm != null && <span>{w.distanceKm}{dist}</span>}
                      {p && <span className="text-sky">{p}</span>}
                      <button onClick={() => removeWorkout(w.id)} aria-label="Delete workout" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        </>
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

      {/* Totals + bests in one compact 6-tile card — no scrolling to read them. */}
      <Card title="At a glance" right={<Segmented value={range} onChange={setRange} options={[{ value: 'week', label: 'Wk' }, { value: 'all', label: 'All' }]} />}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat label="Workouts" value={inRange.length} color="teal" />
          <Stat label="Minutes" value={totalMin} color="peach" />
          <Stat label={dist === 'mi' ? 'Miles' : 'Km'} value={Math.round(totalKm * 10) / 10} color="sky" />
          <Stat label={dist === 'mi' ? 'Best mi' : 'Best km'} value={Math.round((dist === 'mi' ? pbs.longestKm / 1.60934 : pbs.longestKm) * 10) / 10} color="green" />
          <Stat label="Best kcal" value={pbs.mostCalories} color="red" />
          <Stat label="Best min" value={pbs.mostMinutes} color="lavender" />
        </div>
      </Card>

      <NutritionCard date={f.date} />
      <CalorieTrendCard today={today} />

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
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0" role="img" aria-label={`Weekly active-minutes goal: ${pct}% complete`}>
      <circle cx="38" cy="38" r={r} fill="none" stroke={cat('surface0')} strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={cat(pct >= 100 ? 'green' : 'mauve')} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 38 38)" />
      <text x="38" y="42" textAnchor="middle" className="fill-text font-bold" fontSize="16">{pct}%</text>
    </svg>
  )
}

/** 14-day calorie trend with a 7-day average line — momentum, not just today. */
function CalorieTrendCard({ today }: { today: string }) {
  const { data } = useJournal()
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, -(13 - i))
    return { date, kcal: data.metrics.find((x) => x.date === date)?.calories ?? 0 }
  })
  if (days.every((d) => d.kcal === 0)) return null
  const logged = days.filter((d) => d.kcal > 0)
  const avg = logged.length ? Math.round(logged.reduce((a, d) => a + d.kcal, 0) / logged.length) : 0
  const max = Math.max(avg, ...days.map((d) => d.kcal), 1)
  return (
    <Card title="Calorie trend" subtitle={`Last 14 days · avg ${avg} kcal on logged days`}>
      <div className="flex items-end gap-1" style={{ height: 90 }} role="img" aria-label={`Bar chart of daily calories over 14 days, averaging ${avg} on logged days`}>
        {days.map((d) => (
          <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.kcal || '—'} kcal`}>
            <div className="rounded-t" style={{ height: `${Math.max(2, (d.kcal / max) * 100)}%`, background: d.date === today ? cat('peach') : cat('surface2') }} />
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[10px] text-overlay0">peach = today</p>
    </Card>
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

  // Add a food's macros to the running day total.
  function addFood(food: Food) {
    setMetric(date, {
      calories: (m?.calories ?? 0) + food.kcal,
      protein: (m?.protein ?? 0) + food.protein,
      carbs: (m?.carbs ?? 0) + food.carbs,
      fat: (m?.fat ?? 0) + food.fat,
    })
  }
  function fillSample() {
    const t = sumFoods(SAMPLE_DAY)
    setMetric(date, t)
  }

  return (
    <Card
      title="Nutrition"
      subtitle="Calories & macros — add foods or type your own"
      right={<Button onClick={fillSample} title="Fill a typical ~1800 kcal day">Sample day</Button>}
    >
      {/* Quick-add from the food DB (American + Indian staples). */}
      <div className="mb-3">
        <select
          value=""
          onChange={(e) => { const f = FOODS.find((x) => x.name === e.target.value); if (f) addFood(f) }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text"
          aria-label="Add a food"
        >
          <option value="">+ Add a food…</option>
          <optgroup label="Indian">
            {FOODS.filter((f) => f.cuisine === 'indian').map((f) => (
              <option key={f.name} value={f.name}>{f.name} · {f.serving} ({f.kcal} kcal)</option>
            ))}
          </optgroup>
          <optgroup label="American">
            {FOODS.filter((f) => f.cuisine === 'american').map((f) => (
              <option key={f.name} value={f.name}>{f.name} · {f.serving} ({f.kcal} kcal)</option>
            ))}
          </optgroup>
        </select>
        <a
          href="https://www.google.com/search?q=calories+macros+"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs text-overlay0 hover:text-mauve"
        >Food not listed? Look it up online ↗</a>
      </div>
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
      {/* Macro-target rings vs a balanced default (protein 120 · carbs 200 · fat 60 g). */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-surface0 pt-3">
        {macros.map((mac) => {
          const target = mac.k === 'protein' ? 120 : mac.k === 'carbs' ? 200 : 60
          const pct = Math.min(100, Math.round(((mac.val ?? 0) / target) * 100))
          const r = 20, circ = 2 * Math.PI * r
          return (
            <div key={mac.k} className="flex flex-col items-center" title={`${mac.val ?? 0} of ${target}g ${mac.label}`}>
              <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`${mac.label}: ${pct}% of ${target} grams`}>
                <circle cx="28" cy="28" r={r} fill="none" stroke={cat('surface0')} strokeWidth="6" />
                <circle cx="28" cy="28" r={r} fill="none" stroke={cat(mac.color)} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 28 28)" />
                <text x="28" y="32" textAnchor="middle" className="fill-text text-[11px] font-bold">{pct}%</text>
              </svg>
              <span className="text-[10px] text-overlay0">{mac.label}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <StatTile label={label} value={value} color={color} compact />
}
