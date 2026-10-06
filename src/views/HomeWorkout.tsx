import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { Button } from '../components/ui/button'
import { PageLayout, StatBar, SummaryStrip, CalendarHeatmap, EmptyFrame } from '../components/page'
import { ExerciseLibrary, Manual, SessionCard, type SessionItem } from '../components/homeworkout'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import { HOME_EXERCISES, type HomeExercise } from '../lib/homeExercises'
import { notify } from '../lib/notify'

/**
 * HOME WORKOUT · an 83-movement training library, and the place a home session
 * is recorded.
 *
 * On the three-zone contract (`docs/PAGE-SHAPE.md`):
 * - ORIENT · what you have done this week against the public-health floor, and
 *   what is in the session you are building. Facts that change the next thirty
 *   seconds; totals-all-time belong in zone 3 and are there.
 * - ACT    · build the session and log it. One primary button.
 * - REVIEW · the summary, the calendar, the history, then the library and the
 *   manual as reference at the bottom.
 *
 * It was a flat three-card `CardGrid` on the legacy `shell/Page`: a session
 * builder, a history list and a catalogue, all peers, with the catalogue — the
 * widest and least urgent of the three — spanning the row. Nothing was broken;
 * the page just had no shape, which is the fault `PAGE-SHAPE.md` was written
 * about.
 *
 * A session is stored as a plain `Workout` with `activity: 'homeWorkout'` —
 * unchanged, because the existing analytics, CSV export, achievements and search
 * already read it and none of them needs to know this page was rebuilt. The
 * library, the manual and the programming live in `lib/homeExercises.ts`,
 * `lib/homeManual.ts` and `lib/homeProgramming.ts`; **this view imports them and
 * does not restate them**, which is the whole lesson of 531596f.
 */
export function HomeWorkout() {
  const { data, addWorkout, removeWorkout } = useJournal()
  const today = todayISO()

  const [items, setItems] = useState<SessionItem[]>([])
  const [dur, setDur] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(today)
  const [openId, setOpenId] = useState<string | null>(null)

  const sessions = useMemo(
    () => (data.workouts ?? []).filter((w) => w.activity === 'homeWorkout').sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.workouts],
  )

  /* Distinct DAYS, not sessions. The guideline is "two or more days a week",
     so two sessions on one Saturday is one day against it — counting sessions
     would quietly mark the week complete on a day it was not. */
  const weekDays = useMemo(() => new Set(
    sessions.filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < 7 }).map((s) => s.date),
  ).size, [sessions, today])

  const last = sessions[0]
  const totalExercises = sessions.reduce((a, s) => a + s.sets.length, 0)
  const heat = useMemo(() => sessions.map((s) => ({ date: s.date, value: s.sets.length })), [sessions])

  function add(ex: HomeExercise) {
    setItems((cur) => (cur.some((i) => i.id === ex.id) ? cur : [...cur, { id: ex.id, name: ex.name, reps: ex.reps }]))
  }

  function logSession() {
    if (items.length === 0) { notify.info('Nothing in this session', 'Pick a routine, or tap Add on an exercise.'); return }
    addWorkout({
      date,
      activity: 'homeWorkout',
      durationMin: dur ? Number(dur) : undefined,
      sets: items.map((i) => `${i.name} ${i.reps}`),
      notes: notes.trim(),
    })
    setItems([]); setDur(''); setNotes(''); setDate(today)
  }

  return (
    <PageLayout
      tier={1180}
      zone1={<StatBar facts={[
        { label: 'Trained this week', value: `${weekDays} day${weekDays === 1 ? '' : 's'}` },
        { label: 'Guideline', value: weekDays >= 2 ? 'Met — 2+ days' : `${2 - weekDays} more to reach 2`, prose: true },
        { label: 'In this session', value: items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'}` : 'Empty', prose: true },
        { label: 'Last session', value: last ? `${last.sets.length} exercises · ${prettyDay(last.date)}` : 'None yet', prose: true },
      ]} />}
      zone2={
        <SessionCard
          items={items}
          onReps={(id, reps) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, reps } : i)))}
          onDrop={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
          onLoadRoutine={setItems}
          date={date} onDate={setDate} today={today}
          dur={dur} onDur={setDur}
          notes={notes} onNotes={setNotes}
          onLog={logSession}
        />
      }
      zone3={
        <>
          <section>
            <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Analytics</h2>
            <SummaryStrip items={[
              { label: 'Sessions', value: sessions.length, empty: sessions.length === 0 },
              { label: 'Exercises logged', value: totalExercises, empty: sessions.length === 0 },
              { label: 'Movements available', value: HOME_EXERCISES.length },
            ]} />
            <div className="mt-3">
              <CalendarHeatmap weeks={26} fluid data={heat} unit="exercises" label="Home-workout exercises per day over the last twenty-six weeks" />
            </div>
          </section>

          <section>
            <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">History</h2>
            {sessions.length === 0 ? (
              <EmptyFrame>Log a session and it appears here, newest first.</EmptyFrame>
            ) : (
              <ul>
                {sessions.slice(0, 12).map((w) => {
                  const open = openId === w.id
                  return (
                    <li key={w.id} className="group border-b border-line py-2 text-body last:border-b-0">
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => setOpenId(open ? null : w.id)} aria-expanded={open} className="min-w-0 flex-1 text-left hover:text-fg-1">
                          <span className="text-fg-1">{prettyDay(w.date)}</span>
                          <span className="text-fg-2"> · {w.sets.length} exercise{w.sets.length === 1 ? '' : 's'}{w.durationMin ? ` · ${w.durationMin}m` : ''}</span>
                          <span className="caret-turn caret-turn-quarter ml-1 inline-block text-micro text-fg-2" data-open={open}>▸</span>
                        </button>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeWorkout(w.id)} aria-label={`Delete home workout on ${prettyDay(w.date)}`} className="shrink-0 text-fg-2 reveal hover:text-red">×</Button>
                      </div>
                      {open && (
                        <ul className="collapse-in mt-1.5 ml-1 space-y-0.5">
                          {w.sets.map((s, i) => <li key={i} className="text-label text-fg-2">• {s}</li>)}
                          {w.notes && <li className="mt-1 text-label text-fg-2 italic">“{w.notes}”</li>}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <ExerciseLibrary onAdd={add} />
          <Manual />
        </>
      }
    />
  )
}
