import { useState } from 'react'
import { CalendarDot, CaretDown, Check, CheckCircle, ListChecks } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { useProgram } from '../program/useProgram'
import { VideoLink } from '../VideoLink'
import { addDays, prettyDay, todayISO } from '../../lib/date'
import { notify } from '../../lib/notify'
import { setLines } from '../../lib/pullups'

/**
 * THE PULL-UP PROGRAM ON A PHONE — Starting From Zero, the page's main job.
 *
 * OWNS: the phone drawing of today's program day, Program's shape
 * (`program/phone/ProgramPhone`): Week and Day as one select bar, one row
 * per exercise with a tap-per-set counter, the row opening to "what you did"
 * and a how-to link, and a dock that logs the day.
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
export function PullupProgramDay() {
  const s = useProgram('pullup-zero')
  const { addWorkout } = useJournal()
  const k = `${s.week}:${s.cur.day}`
  // Taps per exercise, per day, for the visit — peeking at tomorrow keeps today.
  const [taps, setTaps] = useState<Record<string, number[]>>({})
  const [notes, setNotes] = useState<Record<string, Record<number, string>>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const count = (i: number) => taps[k]?.[i] ?? 0
  const setsOf = (i: number) => Math.max(1, Number.parseInt(s.cur.exercises[i].sets, 10) || 1)
  const did = (i: number) => notes[k]?.[i] ?? s.actuals[s.key(i)] ?? ''
  const bump = (i: number) => setTaps((t) => {
    const row = [...(t[k] ?? s.cur.exercises.map(() => 0))]
    row[i] = count(i) >= setsOf(i) ? 0 : count(i) + 1
    return { ...t, [k]: row }
  })
  const allDone = s.cur.exercises.every((_, i) => count(i) >= setsOf(i))
  const tickAll = () => setTaps((t) => ({ ...t, [k]: s.cur.exercises.map((_, i) => (allDone ? 0 : setsOf(i))) }))
  const started = s.cur.exercises.map((_, i) => i).filter((i) => count(i) > 0 || did(i).trim())
  const logged = s.dayComplete(s.week, s.cur.day)
  const today = todayISO()
  const dayLabel = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : prettyDay(date)
  const sameDay = (w: (typeof s.p.weeks)[number]) => w.days.find((d) => d.day === s.cur.day)?.day ?? w.days[0].day

  function log() {
    if (started.length === 0) { notify.info('Nothing ticked yet', 'Tick what you did, then log.'); return }
    s.logDay(started.map((i) => ({ i, actual: did(i).trim() || `${Math.min(count(i), setsOf(i))}/${setsOf(i)} sets` })))
    // The assessment's number is a pull-up set: store it, so the rest of the
    // page (History, this week, your training set) counts the day.
    const assess = s.cur.exercises.findIndex((e) => /assessment/i.test(e.name))
    const max = assess >= 0 ? Number.parseInt(did(assess), 10) : NaN
    if (max > 0) {
      addWorkout({ date, activity: 'pullups', sets: setLines([max]), notes: `${s.p.short} · week ${s.week}, day ${s.cur.day} · ${s.cur.focus}` })
    }
    setTaps((t) => { const n = { ...t }; delete n[k]; return n })
    setDate(todayISO())
    const at = s.days.findIndex((d) => d.week === s.week && d.day === s.cur.day)
    const next = s.days[at + 1]
    notify.success(`Week ${s.week} · day ${s.cur.day} logged`, next ? `Next up: week ${next.week}, day ${next.day} · ${next.focus}` : 'That was the last day of the program.')
    if (next) s.goTo(next.week, next.day)
  }

  return (
    <section aria-label={s.p.name} className="flex flex-col gap-3">
      <h2 className="sr-only">{s.p.name}</h2>
      <div className="select-bar" role="group" aria-label="Choose the day">
        <label className="select-pill">
          <span className="sr-only">Week</span>
          <select value={s.week} onChange={(e) => { const w = s.p.weeks.find((x) => x.week === Number(e.target.value)); if (w) s.goTo(w.week, sameDay(w)) }}>
            {s.p.weeks.map((w) => <option key={w.week} value={w.week}>Week {w.week}{s.weekComplete(w.week) ? ' ✓' : ''}</option>)}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
        <label className="select-pill">
          <span className="sr-only">Day</span>
          <select value={s.cur.day} onChange={(e) => s.goTo(s.week, Number(e.target.value))}>
            {s.curWeek.days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.focus}{s.dayComplete(s.week, d.day) ? ' ✓' : ''}</option>)}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
      </div>

      <div className="flex items-center gap-3 px-1">
        <div className="h-1 flex-1 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Program days done" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((s.doneCount / s.totalDays) * 100)}>
          <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${(s.doneCount / s.totalDays) * 100}%` }} />
        </div>
        <span className="shrink-0 text-label text-fg-2">
          {logged ? <span className="inline-flex items-center gap-1 font-semibold text-fg-1"><Icon as={CheckCircle} size="sm" />Logged</span> : `${s.doneCount}/${s.totalDays} days`}
          {s.browsing && <> · <button type="button" className="font-semibold text-brand-text" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Back to today</button></>}
        </span>
      </div>

      {/* ONE ROW PER EXERCISE: tap the counter after each set; the row opens
          to write what you did and to a how-to video. */}
      <div className="cells">
        {s.cur.exercises.map((e, i) => {
          const n = count(i)
          const total = setsOf(i)
          const all = n >= total
          const isOpen = open === `${k}:${i}`
          return (
            <div key={`${k}:${i}`} className="lift-row" data-done={all || undefined}>
              <div className="flex items-center gap-3 px-3">
                <button type="button" className="set-count" aria-pressed={all}
                  aria-label={all ? `${e.name}: all ${total} sets done, tap to clear` : `${e.name}: ${n}/${total} sets done, tap after set ${n + 1}`}
                  onClick={() => bump(i)}>
                  {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{total}</span>}
                </button>
                <button type="button" className="min-w-0 flex-1 py-1.5 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : `${k}:${i}`)}>
                  <span className={`block truncate text-body font-medium ${all ? 'text-fg-2' : 'text-fg-1'}`}>{e.name}</span>
                  <span className="block text-label text-fg-2">{e.qty} × {total}{did(i) && <span> · did {did(i)}</span>}</span>
                </button>
                <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              {isOpen && (
                <div className="ios-form flex flex-col gap-2 px-3 pb-3">
                  <label className="flex items-center gap-2">
                    <span className="flex-1 text-label text-fg-2">{/assessment/i.test(e.name) ? 'Your max — strict reps' : 'What you did'}</span>
                    <input
                      value={did(i)}
                      inputMode={/assessment/i.test(e.name) ? 'numeric' : 'text'}
                      placeholder={/assessment/i.test(e.name) ? 'reps' : e.qty}
                      onChange={(ev) => setNotes((m) => ({ ...m, [k]: { ...m[k], [i]: ev.target.value } }))}
                      aria-label={`${e.name}, what you did`}
                      className="w-32 rounded-[0.625rem] bg-ink-2 px-3 py-2 text-right text-body text-fg-1"
                    />
                  </label>
                  <VideoLink name={e.name} label="Watch how" size="sm" className="min-h-11 self-start" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="log-dock">
        <label className="dock-chip mr-auto">
          <Icon as={CalendarDot} size="sm" className="text-fg-2" />
          {dayLabel}
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={`Log on ${dayLabel}`} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <button type="button" className="round-btn" aria-pressed={allDone} aria-label={allDone ? 'Untick every set' : 'Tick every set'} onClick={tickAll}>
          <Icon as={ListChecks} size="md" />
        </button>
        <button type="button" className="cta cta-compact" onClick={log}>
          <Icon as={Check} size="md" />Log day {s.cur.day}{started.length ? ` · ${started.length}/${s.cur.exercises.length}` : ''}
        </button>
      </div>
    </section>
  )
}
