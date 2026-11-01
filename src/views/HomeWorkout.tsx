import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { PageLayout, StatBar, ActStrip, useActColumn } from '../components/page'
import { ProgressionNudge, Review, SessionCard, type SessionItem } from '../components/homeworkout'
import { SessionPhone } from '../components/homeworkout/SessionPhone'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import { homeSetRows, type HomeExercise } from '../lib/homeExercises'
import { readyToProgress } from '../lib/homeProgress'
import { notify } from '../lib/notify'
import { useCappedList } from '../lib/useCappedList'
import { useDevice } from '../components/shell/device'
import { DayStrip } from '../components/ui/dayStrip'

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
  const { data, addWorkout, updateWorkout, removeWorkout } = useJournal()
  const today = todayISO()

  const [items, setItems] = useState<SessionItem[]>([])
  const [dur, setDur] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(today)
  /* The act column's fold lives HERE, not in the card: shut, the page grid
     turns the act into a 40px rail and hands its width to the review. Default
     open — `npm run a11y` walks the rendered page, so a panel that ships
     collapsed is one the gate never scans (COD-93). */
  /* `useActColumn`, not a bare `useStickyState`.
     The two are the same line until you reach a phone. The hook adds the one
     rule a hand-rolled copy cannot have: **shut by default when the page
     STACKS**, which it learns from the shell through `onSplitChange` because
     the split is a container query on the 900px shell and no viewport test can
     answer it. Without it this page opened its form on a phone and put the
     record below it — measured at 390 before this change: the act column was
     **752px**, against the 41px strip every page using the hook collapses to.
     `useActColumn`'s own docstring carries the three measurements that decided
     the default. */
  const logCol = useActColumn('homeworkout')
  const phone = useDevice() === 'mobile'

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

  /** `sel`: the phone logs only the exercises you ticked, when you ticked any. */
  function logSession(sel: SessionItem[] = items) {
    if (sel.length === 0) { notify.info('Nothing in this session', 'Pick a routine, or tap Add on an exercise.'); return }
    addWorkout({
      date,
      activity: 'homeWorkout',
      durationMin: dur ? Number(dur) : undefined,
      sets: sel.map((i) => `${i.name} ${i.reps}`),
      /* The strings stay exactly as they were — the history list below renders
         them verbatim and three counters on this page read `sets.length` as an
         exercise count, so expanding them into one line per set would silently
         relabel "exercises" as "sets". `setRows` is the structured path every
         analytic in `lib/fitness.ts` prefers, and this logger was the only one
         in the app writing neither it nor a weight-bearing line. */
      setRows: homeSetRows(sel),
      notes: notes.trim(),
    })
    // The day stays picked: the strip always shows it, so a second session
    // caught up for the same missed day does not silently jump to today.
    setItems([]); setDur(''); setNotes('')
  }

  /* THE DAY TO LOG (COD-558): the shared strip, bound to the date the log
     writes. On a phone it portals into the top bar, so it is drawn even when
     the act is shut; on a desktop it heads the open act column. The mark is
     that day's exercise count. */
  const strip = (
    <DayStrip value={date} onChange={setDate} today={today} label="Day to log"
      mark={(d) => {
        const n = sessions.filter((s) => s.date === d).reduce((a, s) => a + s.sets.length, 0)
        return n ? <>{n}<span className="sr-only"> exercises</span></> : null
      }} />
  )

  return (
    <PageLayout
      tier={1180}
      zone1={phone ? (
        /* One line on a phone: the week against the guideline and the last
           session. "In this session" is the session itself, right below. */
        <p className="px-1 text-label text-fg-2">
          <b className="text-fg-1">{weekDays} day{weekDays === 1 ? '' : 's'}</b> this week · {weekDays >= 2 ? 'guideline met' : `${2 - weekDays} more for the guideline`}
          {last && <> · last {prettyDay(last.date)}</>}
        </p>
      ) : <StatBar facts={[
        { label: 'Trained this week', value: `${weekDays} day${weekDays === 1 ? '' : 's'}` },
        { label: 'Guideline', value: weekDays >= 2 ? 'Met — 2+ days' : `${2 - weekDays} more to reach 2`, prose: true },
        { label: 'In this session', value: items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'}` : 'Empty', prose: true },
        { label: 'Last session', value: last ? `${last.sets.length} exercises · ${prettyDay(last.date)}` : 'None yet', prose: true },
      ]} />}
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut}
      zone2={logCol.shut ? (
        <>
        {phone && strip}
        <ActStrip
          label="Today’s session"
          summary={items.length ? `${items.length} exercise${items.length === 1 ? '' : 's'} ready to log` : 'Empty'}
          onOpen={logCol.open}
        />
        </>
      ) : (
        <>
        {/* On a desktop the column stacks its cards flush; the strip is not a
            card, so it gets 12px before the one below it. On a phone it
            portals into the bar, and a wrapper would be an empty box. */}
        {phone ? strip : <div className="pb-3">{strip}</div>}
        {/* Above the builder: "what should I do today" is the question you
            arrive with, and this is the only thing on the page that answers it
            from your own history. The builder below is where you act on it, and
            it keeps the one primary button — these are secondary. */}
        {!phone && <ProgressionNudge rows={progress} onAdd={add} />}
        {phone ? (
          <SessionPhone
            items={items}
            onReps={(id, reps) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, reps } : i)))}
            onDrop={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
            onLoadRoutine={setItems}
            dur={dur} onDur={setDur}
            notes={notes} onNotes={setNotes}
            onLog={logSession}
          />
        ) : <SessionCard
          items={items}
          onReps={(id, reps) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, reps } : i)))}
          onDrop={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
          onLoadRoutine={setItems}
          dur={dur} onDur={setDur}
          notes={notes} onNotes={setNotes}
          onLog={() => logSession()}
          onShut={logCol.close}
        />}
        {/* A phone logs first (COD-468): the nudges were 452px between the
            page top and the session builder. Same card, one slot lower. */}
        {phone && <ProgressionNudge rows={progress} onAdd={add} />}
        </>
      )}
      zone3={
        <Review
          sessions={sessions}
          history={history}
          heat={heat}
          totalExercises={totalExercises}
          onAdd={add}
          onRemove={removeWorkout}
          onEdit={updateWorkout}
        />
      }
    />
  )
}
