import { useState } from 'react'
import { Play, Search, Plus, Dumbbell } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Textarea } from '../components/ui'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import { HOME_EXERCISES, demoUrl, searchUrl, type HomeExercise, type Muscle } from '../lib/homeExercises'

const MUSCLES: (Muscle | 'all')[] = ['all', 'chest', 'shoulders', 'arms', 'back', 'core', 'glutes', 'legs', 'cardio', 'full body']

interface SessionItem { id: string; name: string; reps: string }

/**
 * Home Workout · a no-equipment training hub. Browse a curated bodyweight
 * library (each with form cues + a professional YouTube demo and a search
 * fallback), build a session, and log it as a Workout (activity='Home') so it
 * lands in the journal store → localStorage + account sync, and the Fitness stats.
 */
export function HomeWorkout() {
  const { data, addWorkout, removeWorkout } = useJournal()
  const today = todayISO()
  const [filter, setFilter] = useState<Muscle | 'all'>('all')
  const [items, setItems] = useState<SessionItem[]>([])
  const [dur, setDur] = useState('')
  const [notes, setNotes] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const lib = filter === 'all' ? HOME_EXERCISES : HOME_EXERCISES.filter((e) => e.muscle === filter)
  const sessions = (data.workouts ?? []).filter((w) => w.activity === 'Home').sort((a, b) => (a.date < b.date ? 1 : -1))

  function add(ex: HomeExercise) {
    setItems((cur) => (cur.some((i) => i.id === ex.id) ? cur : [...cur, { id: ex.id, name: ex.name, reps: ex.reps }]))
  }
  function setReps(id: string, reps: string) { setItems((cur) => cur.map((i) => (i.id === id ? { ...i, reps } : i))) }
  function drop(id: string) { setItems((cur) => cur.filter((i) => i.id !== id)) }

  function logSession() {
    if (items.length === 0) return
    addWorkout({
      date: today,
      activity: 'Home',
      durationMin: dur ? Number(dur) : undefined,
      sets: items.map((i) => `${i.name} ${i.reps}`),
      notes: notes.trim(),
    })
    setItems([]); setDur(''); setNotes('')
  }

  return (
    <Page>
      {/* PRIMARY: build & log today's session first, before the library/history (UX IA pass) */}
      <Card title={<span className="inline-flex items-center gap-2"><Dumbbell size={18} className="text-mauve" /> Today’s session</span>} subtitle={items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'}` : 'Add exercises from the library'}>
        {items.length === 0 ? (
          <Empty>Tap “Add” on an exercise to build your session.</Empty>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-subtext1">{i.name}</span>
                <Input value={i.reps} onChange={(e) => setReps(i.id, e.target.value)} aria-label={`${i.name} sets/reps`} className="w-24 py-1 text-right text-xs" />
                <button onClick={() => drop(i.id)} aria-label={`Remove ${i.name}`} className="text-overlay0 hover:text-red">×</button>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Input type="number" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="Minutes" aria-label="Duration minutes" />
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" rows={2} />
            <Button variant="primary" onClick={logSession} className="w-full">Log workout</Button>
          </div>
        )}
      </Card>

      <Card title="Exercise library" subtitle="No equipment · tap a demo to watch proper form">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className="rounded-full border px-2.5 py-1 text-xs capitalize transition-colors"
              style={{ borderColor: filter === m ? cat('mauve') : cat('surface1'), background: filter === m ? cat('mauve') + '22' : 'transparent', color: filter === m ? cat('text') : cat('subtext0') }}
            >{m}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {lib.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-surface0 bg-base p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">{ex.emoji}</span>
                <span className="text-sm font-medium text-text">{ex.name}</span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] capitalize" style={{ background: cat('surface1'), color: cat('subtext0') }}>{ex.muscle}</span>
              </div>
              <p className="text-xs text-overlay1">{ex.how}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href={demoUrl(ex)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-red hover:underline"><Play size={11} /> Watch demo</a>
                <a href={searchUrl(ex)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-overlay0 hover:text-blue hover:underline"><Search size={11} /> More on YouTube</a>
                <button onClick={() => add(ex)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-surface1 px-2 py-0.5 text-xs text-subtext1 hover:border-mauve hover:text-text"><Plus size={11} /> {ex.reps}</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Recent home workouts" subtitle="Tap a day to see exercises & reps">
        {sessions.length === 0 ? (
          <Empty>No home workouts logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-surface0">
            {sessions.slice(0, 12).map((w) => {
              const open = openId === w.id
              return (
                <li key={w.id} className="group py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => setOpenId(open ? null : w.id)} className="min-w-0 flex-1 text-left hover:text-text">
                      <span className="text-subtext1">{prettyDay(w.date)}</span>
                      <span className="text-overlay0"> · {w.sets.length} exercise{w.sets.length === 1 ? '' : 's'}{w.durationMin ? ` · ${w.durationMin}m` : ''}</span>
                      <span className="ml-1 text-[10px] text-overlay0">{open ? '▾' : '▸'}</span>
                    </button>
                    <button onClick={() => removeWorkout(w.id)} aria-label="Remove" className="shrink-0 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </div>
                  {open && (
                    <ul className="mt-1.5 ml-1 space-y-0.5">
                      {w.sets.map((s, i) => <li key={i} className="text-xs text-subtext0">• {s}</li>)}
                      {w.notes && <li className="mt-1 text-xs text-overlay0 italic">“{w.notes}”</li>}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
