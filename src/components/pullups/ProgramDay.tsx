import { useState } from 'react'
import { CaretDown, Check, CheckCircle, ListChecks, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { plain } from '../../lib/plain'
import { useJournal } from '../../store'
import { useProgram } from '../program/useProgram'
import { VideoLink } from '../VideoLink'
import { HoldTimer } from '../HoldTimer'
import { RestClock } from '../RestClock'
import { IntervalTimer } from '../IntervalTimer'
import { intervalsIn, secondsIn } from '../../lib/holdTime'
import { notify } from '../../lib/notify'
import { setLines } from '../../lib/pullups'

/**
 * THE PULL-UP PROGRAM ON A PHONE — Starting From Zero, the page's main job.
 *
 * OWNS: the phone drawing of today's program day, Program's shape
 * (`program/phone/ProgramPhone`): Week and Day as one select bar, one CARD
 * per exercise carrying everything (tap-per-set counter, "what you did", a
 * how-to link — nothing opens, COD-585), and a dock that logs the day.
 * DOES NOT OWN: where you are or what is done (`useProgram('pullup-zero')`,
 * the same state the desktop's `ProgramTracker` draws), nor the free-form
 * session log (`QuickLog`).
 *
 * Not `ProgramPhone` itself: that one is built for loaded lifts — weights,
 * plate steps, set cards — and this program is bodyweight, seconds and
 * Tabata rounds. What carries over is the shape.
 *
 * Log writes the day to the program (ticks + "what you did", one `logDay`)
 * and, when you entered your max on the assessment, a pull-up session with
 * that set — so History, the week's reps and your training set see it.
 *
 * Owner ask, 2026-10-30: "the main focus should be on the Starting From Zero
 * pull-up program … that is the main program I need to save and do."
 */
export function PullupProgramDay({ date }: {
  /** The day the session is logged on — the page's `DayStrip` (COD-558). */
  date: string
}) {
  const s = useProgram('pullup-zero')
  const { addWorkout } = useJournal()
  const k = `${s.week}:${s.cur.day}`
  // Taps per exercise, per day, for the visit — peeking at tomorrow keeps today.
  const [taps, setTaps] = useState<Record<string, number[]>>({})
  const [timing, setTiming] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<string, Record<number, string>>>({})
  const count = (i: number) => taps[k]?.[i] ?? 0
  const setsOf = (i: number) => Math.max(1, Number.parseInt(s.cur.exercises[i].sets, 10) || 1)
  const did = (i: number) => notes[k]?.[i] ?? s.actuals[s.key(i)] ?? ''
  const setCount = (i: number, n: number) => setTaps((t) => {
    const row = [...(t[k] ?? s.cur.exercises.map(() => 0))]
    row[i] = n
    return { ...t, [k]: row }
  })
  const bump = (i: number) => setCount(i, count(i) >= setsOf(i) ? 0 : count(i) + 1)
  // The rest since your last set, counted up: Starting From Zero gives no
  // rest time, so the clock says how long, not how long to go.
  /** Which rest this is (a remount key), or null for none. */
  const [rest, setRest] = useState<number | null>(null)
  const tapSet = (i: number) => { setRest((r) => (count(i) >= setsOf(i) ? null : (r ?? 0) + 1)); bump(i) }
  const ivOf = (i: number) => intervalsIn(s.cur.exercises[i].name, s.cur.exercises[i].qty, setsOf(i))
  const allDone = s.cur.exercises.every((_, i) => count(i) >= setsOf(i))
  const tickAll = () => setTaps((t) => ({ ...t, [k]: s.cur.exercises.map((_, i) => (allDone ? 0 : setsOf(i))) }))
  const started = s.cur.exercises.map((_, i) => i).filter((i) => count(i) > 0 || did(i).trim())
  const logged = s.dayComplete(s.week, s.cur.day)

  function log() {
    if (started.length === 0) { notify.info('Nothing ticked yet', 'Tick what you did, then log.'); return }
    const results = started.map((i) => ({ i, actual: did(i).trim() || `${Math.min(count(i), setsOf(i))}/${setsOf(i)} sets` }))
    s.logDay(results)
    const at = s.days.findIndex((d) => d.week === s.week && d.day === s.cur.day)
    // EVERY logged day is a session in History, with what you did line by
    // line — the timer's "8 rounds of 20 s" included (owner, 2026-11-13:
    // "saving them into the history"). Only the assessment's number is a
    // pull-up set; the rest are notes, so the rep totals stay pull-ups.
    const assess = s.cur.exercises.findIndex((e) => /assessment/i.test(e.name))
    const max = assess >= 0 ? Number.parseInt(did(assess), 10) : NaN
    addWorkout({
      date, activity: 'pullups', sets: max > 0 ? setLines([max]) : [],
      notes: [`${s.p.short}, day ${at + 1} of ${s.days.length}, ${s.cur.focus}`, ...results.map((r) => `${s.cur.exercises[r.i].name}: ${r.actual}`)].join('\n'),
    })
    setTaps((t) => { const n = { ...t }; delete n[k]; return n })
    const next = s.days[at + 1]
    notify.success(`Day ${at + 1} logged`, next ? `Next up: day ${at + 2} of ${s.days.length}, ${next.focus}` : 'That was the last day of the program.')
    if (next) s.goTo(next.week, next.day)
  }

  return (
    <section aria-label={s.p.name} className="flex flex-col gap-3">
      <h2 className="sr-only">{s.p.name.replace(' — ', ': ')}</h2>
      {/* ONE PICKER, the day of the program — no week or block on a phone
          (owner, 2026-11-13: "I don't want to see week"). COD-596. */}
      <label className="select-pill">
        <span className="sr-only">Day of the program</span>
        <select value={s.days.findIndex((d) => d.week === s.week && d.day === s.cur.day)}
          onChange={(e) => { const d = s.days[Number(e.target.value)]; if (d) s.goTo(d.week, d.day) }}>
          {s.days.map((d, n) => (
            <option key={`${d.week}:${d.day}`} value={n}>Day {n + 1} of {s.days.length}: {plain(d.focus)}{s.dayComplete(d.week, d.day) ? ', done' : ''}</option>
          ))}
        </select>
        <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
      </label>

      <div className="flex items-center gap-3 px-1">
        <div className="h-1 flex-1 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Program days done" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((s.doneCount / s.totalDays) * 100)}>
          <div className="h-full rounded-pill bg-green" style={{ width: `${(s.doneCount / s.totalDays) * 100}%` }} />
        </div>
        <span className="shrink-0 text-label text-fg-2">
          {logged ? <span className="inline-flex items-center gap-1 font-semibold text-fg-1"><Icon as={CheckCircle} size="sm" />Logged</span> : `${s.doneCount}/${s.totalDays} days`}
          {s.browsing && <> · <button type="button" className="font-semibold text-brand-text" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Back to today</button></>}
        </span>
      </div>

      {/* ONE CARD PER EXERCISE, everything on it (owner, 2026-11-13: "only
          cards with all the exercises planned … no subparts"): the plan, the
          set counter, what you did and the how-to — nothing opens. */}
      <ol className="flex flex-col gap-3" aria-label={`Today's exercises, ${s.cur.focus}`}>
        {s.cur.exercises.map((e, i) => {
          const n = count(i)
          const total = setsOf(i)
          const all = n >= total
          const assess = /assessment/i.test(e.name)
          const iv = ivOf(i)
          return (
            <li key={`${k}:${i}`} className="ex-card flex items-center gap-2" data-done={all || undefined}>
              {/* ONE ROW (owner, 2026-11-13: "all the cards … in one page"):
                  counter, name and plan with Watch under it, the timer when
                  the plan is timed, and what you did. Five cards were 1.5
                  screens as three rows each. */}
              <button type="button" className="set-count" aria-pressed={all}
                aria-label={all ? `${e.name}: all ${total} sets done, tap to clear` : `${e.name}: ${n}/${total} sets done, tap after set ${n + 1}`}
                onClick={() => tapSet(i)}>
                {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{total}</span>}
              </button>
              <div className="min-w-0 flex-1">
                <h3 className={`text-body font-semibold leading-snug ${all ? 'text-fg-2' : 'text-fg-1'}`}>{e.name}</h3>
                <p className="text-label text-fg-2">
                  {/* Say what the clock will do: "8 rounds, 20 s on, 10 s off",
                      not "20s work, 8 sets". */}
                  {iv && !iv.manual ? `${total} rounds, ${iv.steps[0].secs} s on, ${iv.steps[1]?.secs ?? 0} s off`
                    : iv ? `${total} ${total === 1 ? 'set' : 'sets'}, hold ${iv.steps.map((x) => x.secs).join(', ')} s`
                    : `${e.qty}, ${total} ${total === 1 ? 'set' : 'sets'}`}{' '}
                  <VideoLink name={e.name} label="Watch" size="sm" className="-my-3 py-3" />
                </p>
              </div>
              {secondsIn(e.qty) != null && (
                <button type="button" className="round-btn shrink-0" aria-haspopup="dialog" aria-label={`Timer for ${e.name}`} onClick={() => setTiming(i)}>
                  <Icon as={Timer} size="md" />
                </button>
              )}
              <span className="ios-form shrink-0"><input
                value={did(i)}
                inputMode={assess ? 'numeric' : 'text'}
                placeholder={iv && !iv.manual ? 'rounds' : secondsIn(e.qty) != null ? 'secs' : 'reps'}
                onChange={(ev) => setNotes((m) => ({ ...m, [k]: { ...m[k], [i]: ev.target.value } }))}
                aria-label={`${e.name}, what you did`}
                className="w-20 rounded-[0.625rem] bg-ink-2 px-2 py-2 text-right text-body text-fg-1"
              /></span>
            </li>
          )
        })}
      </ol>

      {timing != null && s.cur.exercises[timing] && ivOf(timing) && (
        <IntervalTimer name={s.cur.exercises[timing].name} plan={ivOf(timing)!} onClose={() => setTiming(null)}
          onSave={(worked) => {
            const i = timing
            const tabata = !ivOf(i)!.manual
            // Tabata: each round is a set. Holds: the run is one set.
            const text = tabata ? `${worked.length} ${worked.length === 1 ? 'round' : 'rounds'} of ${worked[0]} s` : `${worked.join(', ')} s`
            setNotes((m) => ({ ...m, [k]: { ...m[k], [i]: did(i).trim() ? `${did(i).trim()}; ${text}` : text } }))
            if (tabata) setCount(i, Math.min(setsOf(i), Math.max(count(i), worked.length)))
            else if (count(i) < setsOf(i)) bump(i)
          }} />
      )}
      {timing != null && s.cur.exercises[timing] && !ivOf(timing) && (
        <HoldTimer name={s.cur.exercises[timing].name} target={secondsIn(s.cur.exercises[timing].qty)} onClose={() => setTiming(null)}
          onSave={(secs) => {
            // The hold goes into "what you did" and ticks one set.
            const i = timing
            setNotes((m) => ({ ...m, [k]: { ...m[k], [i]: did(i).trim() ? `${did(i).trim()}, ${secs} s` : `${secs} s` } }))
            if (count(i) < setsOf(i)) bump(i)
          }} />
      )}
      <div className="log-dock">
        {rest != null && <RestClock key={rest} target={null} onDismiss={() => setRest(null)} />}
        <button type="button" className="round-btn ml-auto" aria-pressed={allDone} aria-label={allDone ? 'Untick every set' : 'Tick every set'} onClick={tickAll}>
          <Icon as={ListChecks} size="md" />
        </button>
        <button type="button" className="cta cta-compact" onClick={log}>
          <Icon as={Check} size="md" />Log day {s.cur.day}{started.length ? ` · ${started.length}/${s.cur.exercises.length}` : ''}
        </button>
      </div>
    </section>
  )
}
