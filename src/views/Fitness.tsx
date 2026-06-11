import { useState } from 'react'
import { useJournal } from '../store'
import { prettyDay, todayISO } from '../lib/date'
import { Button, Card, Empty, Input, Textarea } from '../components/ui'
import { cat } from '../lib/colors'

const ACTIVITIES = ['Run', 'Walk', 'Strength', 'Cycling', 'Yoga', 'Swim', 'HIIT', 'Sport', 'Other']

export function Fitness() {
  const { data, addWorkout, removeWorkout } = useJournal()
  const [date, setDate] = useState(todayISO())
  const [activity, setActivity] = useState('Run')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [calories, setCalories] = useState('')
  const [rpe, setRpe] = useState('')
  const [sets, setSets] = useState('')
  const [notes, setNotes] = useState('')

  const dist = data.settings.distanceUnit
  const workouts = [...data.workouts].sort((a, b) => (a.date < b.date ? 1 : -1))
  const totalMin = data.workouts.reduce((s, w) => s + (w.durationMin ?? 0), 0)
  const totalKm = data.workouts.reduce((s, w) => s + (w.distanceKm ?? 0), 0)

  function log() {
    if (!activity) return
    addWorkout({
      date,
      activity,
      durationMin: duration ? Number(duration) : undefined,
      distanceKm: distance ? Number(distance) : undefined,
      calories: calories ? Number(calories) : undefined,
      rpe: rpe ? Number(rpe) : undefined,
      sets: sets.split('\n').map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
    })
    setDuration(''); setDistance(''); setCalories(''); setRpe(''); setSets(''); setNotes('')
  }

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-5 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card title="Log a workout">
          <div className="space-y-3">
            <label className="block text-sm text-subtext1">
              Date
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </label>
            <label className="block text-sm text-subtext1">
              Activity
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-surface1 bg-base px-3 py-2 text-sm text-text"
              >
                {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Min" aria-label="Duration minutes" />
              <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder={dist === 'mi' ? 'Mi' : 'Km'} aria-label="Distance" />
              <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Kcal" aria-label="Calories" />
              <Input type="number" value={rpe} onChange={(e) => setRpe(e.target.value)} placeholder="RPE 1–10" aria-label="RPE" />
            </div>
            <Textarea value={sets} onChange={(e) => setSets(e.target.value)} placeholder={'Sets, one per line\nBench 5x5 @ 60kg\nSquat 3x8 @ 80kg'} rows={3} />
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" rows={2} />
            <Button variant="primary" onClick={log} className="w-full">Log workout</Button>
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card title="Totals" subtitle="All time">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Workouts" value={data.workouts.length} color="teal" />
            <Stat label="Minutes" value={totalMin} color="peach" />
            <Stat label={dist === 'mi' ? 'Miles' : 'Kilometers'} value={Math.round(totalKm * 10) / 10} color="sky" />
          </div>
        </Card>

        <NutritionCard date={date} />

        <Card title="History">
          {workouts.length === 0 ? (
            <Empty>No workouts logged yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {workouts.map((w) => (
                <li key={w.id} className="group rounded-lg border border-surface0 bg-base p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">
                      {w.activity}
                      <span className="ml-2 text-xs text-overlay0">{prettyDay(w.date)}</span>
                    </span>
                    <button
                      onClick={() => removeWorkout(w.id)}
                      aria-label="Delete workout"
                      className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"
                    >×</button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-subtext0">
                    {w.durationMin != null && <span>{w.durationMin} min</span>}
                    {w.distanceKm != null && <span>{w.distanceKm} {dist}</span>}
                    {w.calories != null && <span>{w.calories} kcal</span>}
                    {w.rpe != null && <span>RPE {w.rpe}</span>}
                  </div>
                  {w.sets.length > 0 && (
                    <ul className="mt-1 text-xs text-subtext1">
                      {w.sets.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  )}
                  {w.notes && <p className="mt-1 text-xs text-overlay1 italic">{w.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
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
