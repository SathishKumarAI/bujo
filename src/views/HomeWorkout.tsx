import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { PageLayout, StatBar } from '../components/page'
import { ProgressionNudge, Review, SessionCard, type SessionItem } from '../components/homeworkout'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import { homeSetRows, type HomeExercise } from '../lib/homeExercises'
import { readyToProgress } from '../lib/homeProgress'
import { notify } from '../lib/notify'
import { useCappedList } from '../lib/useCappedList'

/**
 * HOME WORKOUT · an 83-movement training library, and the place a home session
 * is recorded.
 *
 * On the three-zone contract (`docs/PAGE-SHAPE.md`):
 * - ORIENT · what you have done this week against the public-health floor, and
 *   what is in the session you are building. Facts that change the next thirty
 *   seconds; totals-all-time belong in zone 3 and are there.
 * - ACT    · build the session and log it. One primary button.
 * - REVIEW · one bar, five panels: History, Movements, How to train, Equipment,
 *   Sources. It was four peer sections, the last of which carried a rail of its
 *   own twelve rows — see `components/homeworkout/Review.tsx` for why two
 *   navigations on one page is the fault and where the other nine rows went.
 *
 * It was a flat three-card `CardGrid` on the legacy `shell/Page`: a session
 * builder, a history list and a catalogue, all peers, with the catalogue — the
 * widest and least urgent of the three — spanning the row. Nothing was broken;
 * the page just had no shape, which is the fault `PAGE-SHAPE.md` was written
 * about.
 *
 * A session is stored as a plain `Workout` with `activity: 'homeWorkout'`, so
 * the CSV export, achievements and search read it without knowing this page
 * exists. The *analytics* did not: this docstring used to claim they already
 * read it, and they did not, because the session carried only free-text `sets`
 * lines and `fitness.parseSet` cannot read one without an `@ <weight>`. It now
 * writes `setRows` through `homeSetRows` as well — see that helper for why one
 * row per set and why zero load.
 *
 * The library, the manual and the programming live in `lib/homeExercises.ts`,
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
  // Was `slice(0, 12)` with no affordance — row 13 was unreachable, and
  // nothing on screen said so (COD-303).
  const history = useCappedList(sessions)

  const heat = useMemo(() => sessions.map((s) => ({ date: s.date, value: s.sets.length })), [sessions])

  /* Read from the whole journal rather than from `sessions`, because the window
     and the activity filter both belong to the function that makes the claim —
     a caller pre-filtering by its own rule is how two places come to disagree
     about what counts. */
  const progress = useMemo(() => readyToProgress(data, today), [data, today])

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
      /* The strings stay exactly as they were — the history list below renders
         them verbatim and three counters on this page read `sets.length` as an
         exercise count, so expanding them into one line per set would silently
         relabel "exercises" as "sets". `setRows` is the structured path every
         analytic in `lib/fitness.ts` prefers, and this logger was the only one
         in the app writing neither it nor a weight-bearing line. */
      setRows: homeSetRows(items),
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
        <>
        {/* Above the builder: "what should I do today" is the question you
            arrive with, and this is the only thing on the page that answers it
            from your own history. The builder below is where you act on it, and
            it keeps the one primary button — these are secondary. */}
        <ProgressionNudge rows={progress} onAdd={add} />
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
        </>
      }
      zone3={
        <Review
          sessions={sessions}
          history={history}
          heat={heat}
          totalExercises={totalExercises}
          onAdd={add}
          onRemove={removeWorkout}
        />
      }
    />
  )
}
