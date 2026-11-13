import { Seg } from '../../ui/seg'
import { useState } from 'react'
import { ArrowLineUp, CaretDown, Check, CheckCircle, ListChecks, Minus, Plus, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { plain } from '../../../lib/plain'
import { useJournal } from '../../../store'
import { activityForSplit } from '../../../domain/activities'
import { isNewPR, lastSetFor } from '../../../lib/fitness'
import { todayISO } from '../../../lib/date'
import { notify } from '../../../lib/notify'
import type { SetRow } from '../../gym/setRow'
import { SetCards } from '../../gym/phone/SetCards'
import { VideoLink } from '../../VideoLink'
import { DayStrip } from '../../ui/dayStrip'
import { Sheet } from '../../ui/sheet'
import { HoldTimer } from '../../HoldTimer'
import { secondsIn } from '../../../lib/holdTime'
import { storedSets } from '../../gym/phone/strengthHelpers'
import type { ProgramState } from '../useProgram'
import { actualOf, followOn, planRows, splitForFocus, suggestWeight, weightStep } from './programLog'

/**
 * PROGRAM ON A PHONE — pick the day, log it, here (COD-461, COD-464).
 *
 * OWNS: the phone page: the program and one Day select (COD-596), the day
 * as ONE ROW-CARD PER LIFT — a set counter you tap after each set, weight
 * − / +, Strength's set cards in a sheet behind the weight (COD-588) — and "Log workout", which saves a real Strength session
 * AND ticks the program day. Owner ask: the selection on one bar, the whole
 * day in one screen.
 * DOES NOT OWN: the program state (`useProgram`), the rest timer (the view's),
 * the set-row anatomy (`gym/phone/SetCards`), the stored shape (`storedSets`).
 *
 * Before this, logging meant "Log these in Strength" — leave the page, find
 * the lifts again, type every set. A program already says what you are doing;
 * the phone's job is only to confirm it, one tick per set.
 *
 * Only TICKED sets are logged: every row arrives filled from the plan, so
 * "filled" no longer means "done". Drafts live per day for the visit, so
 * stepping to peek at tomorrow does not throw away half a session.
 */
export function ProgramPhone({ s, onCheck, rest }: {
  s: ProgramState
  /** A set was ticked — start its rest. */
  onCheck: (exercise: string, qty: string) => void
  rest: React.ReactNode
}) {
  const { data, addWorkout } = useJournal()
  const unit = data.settings.weightUnit
  const [drafts, setDrafts] = useState<Record<string, { rows: SetRow[]; done: string[] }>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [timing, setTiming] = useState<string | null>(null)
  /** Seconds held per timed exercise this visit, from the big timer. */
  const [held, setHeld] = useState<Record<string, number[]>>({})
  // Which day the session is logged ON — today unless you are catching up a
  // missed one. Picked in the shared `DayStrip`, which sits in the phone bar;
  // it is not reset after a log, because the bar always shows the day.
  const [date, setDate] = useState(todayISO())
  const k = `${s.pid}:${s.week}:${s.cur.day}`
  const draft = drafts[k]
  // Seeded during render, once per day — computing it per render would mint
  // new row ids every time and remount every input under your thumb.
  if (!draft) setDrafts((d) => ({ ...d, [k]: { rows: planRows(s.cur, data), done: [] } }))
  const rows = draft?.rows ?? []
  const done = new Set(draft?.done ?? [])
  const ticked = rows.filter((r) => done.has(r.id))
  const pct = rows.length ? Math.round((ticked.length / rows.length) * 100) : 0

  const at = s.days.findIndex((d) => d.week === s.week && d.day === s.cur.day)

  const patch = (p: Partial<{ rows: SetRow[]; done: string[] }>) =>
    setDrafts((d) => ({ ...d, [k]: { rows, done: [...done], ...p } }))
  function tick(r: SetRow) {
    if (done.has(r.id)) { patch({ done: [...done].filter((id) => id !== r.id) }); return }
    // A blank number on a ticked set means "same as the set above", the way
    // the field reads — saving it as an empty weight logged "@ 0lb".
    const above = rows.slice(0, rows.indexOf(r)).reverse().find((x) => x.exercise === r.exercise && (x.weight || x.reps))
    const filled = above && (!r.weight || !r.reps) ? rows.map((x) => (x.id === r.id ? { ...x, weight: x.weight || above.weight, reps: x.reps || above.reps } : x)) : rows
    patch({ rows: filled, done: [...done, r.id] })
    onCheck(r.exercise, s.cur.exercises.find((e) => e.name === r.exercise)?.qty ?? '')
  }
  /** One lift's rows edited in its open card, put back where they were. */
  function replaceLift(name: string, edited: SetRow[]) {
    const at0 = rows.findIndex((r) => r.exercise === name)
    const old = rows.filter((r) => r.exercise === name)
    const others = rows.filter((r) => r.exercise !== name)
    patch({ rows: [...others.slice(0, at0), ...followOn(old, edited), ...others.slice(at0)] })
  }
  /** Every set of a lift not yet ticked, to one weight — the − / + buttons. */
  function setLiftWeight(name: string, w: number) {
    const v = String(Math.max(0, Math.round(w * 10) / 10))
    patch({ rows: rows.map((r) => (r.exercise === name && !done.has(r.id) ? { ...r, weight: v } : r)) })
  }
  const allTicked = rows.length > 0 && ticked.length === rows.length

  function log() {
    const { sets, setRows } = storedSets(ticked, unit, data.settings)
    if (sets.length === 0) { notify.info('Nothing ticked yet', 'Tick the sets you did, then log.'); return }
    const pr = ticked.find((r) => r.kind !== 'warmup' && isNewPR(data, r.exercise.trim(), Number(r.weight), Number(r.reps)))
    const split = splitForFocus(s.cur.focus)
    addWorkout({ date, activity: activityForSplit(split), split, sets, setRows, notes: `${s.p.name} · ${s.unit} ${s.week}, day ${s.cur.day}` })
    // A timed row (a plank, the treadmill) has no reps or weight, so
    // `actualOf` says nothing; its held seconds, or its ticked count, does.
    // Without this a ticked "Finisher: Treadmill" never marked the day done.
    s.logDay(s.cur.exercises
      .map((e, i) => {
        const mine = ticked.filter((r) => r.exercise === e.name)
        const actual = actualOf(mine, unit) || held[e.name]?.map((x) => `${x} s`).join(', ') || (mine.length ? `${mine.length} ${mine.length === 1 ? 'set' : 'sets'}` : '')
        return { i, actual }
      })
      .filter((x) => x.actual))
    setHeld({})
    setDrafts((d) => { const n = { ...d }; delete n[k]; return n })
    const next = s.days[at + 1]
    notify.success(
      pr ? `New PR · ${pr.exercise} ${pr.weight}${unit} × ${pr.reps}` : `${s.cur.focus} logged · ${sets.length} ${sets.length === 1 ? 'set' : 'sets'}`,
      next ? `Next up: day ${at + 2} of ${s.days.length}, ${next.focus}` : 'That was the last day of the program.',
    )
    // Land on the next day: the one thing you will open this page for next time.
    if (next) s.goTo(next.week, next.day)
  }

  const logged = s.dayComplete(s.week, s.cur.day)
  const today = todayISO()
  /* What this program logged on a day: its sets. The program's own sessions
     only (`notes` starts with its name, written by `log()` above), so a run on
     the same day is not read as a lift. */
  const setsOn = (d: string) => data.workouts.filter((w) => w.date === d && w.notes?.startsWith(s.p.name)).reduce((a, w) => a + w.sets.length, 0)
  return (
    <div className="flex flex-col gap-3 pb-4">
      <h1 className="sr-only">Program</h1>
      {/* THE DAY TO LOG — page level, so on a phone it portals into the top
          bar. It replaced a date chip in the dock (COD-558). */}
      <DayStrip value={date} onChange={setDate} today={today} label="Day to log"
        mark={(d) => { const n = setsOn(d); return n ? <>{n}<span className="sr-only"> sets</span></> : null }} />

      {/* THE SELECTION BAR — week and day side by side in one 44px row.
          Native selects: on iOS they open the system wheel, the picker people
          already know, and they cost no sheet of our own. */}
      {s.programs.length > 1 && (
        <Seg label="Program" value={s.pid} onChange={(v) => { if (v) s.pickProgram(v) }} options={s.programs.map((x) => ({ value: x.id, label: x.short, name: x.name }))} />
      )}
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

      <section aria-label={`${s.cur.focus} · day ${s.cur.day}`} className="flex flex-col gap-3">
        {/* The Day select above already says "Day 1 · Push", so the focus is
            a heading for screen readers only and the row is just progress. */}
        <div className="flex items-center gap-3 px-1">
          <h2 className="sr-only">{s.cur.focus}</h2>
          <div className="h-1 flex-1 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Sets ticked" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-label text-fg-2">
            {logged ? <span className="inline-flex items-center gap-1 font-semibold text-fg-1"><Icon as={CheckCircle} size="sm" />Logged</span> : `${ticked.length}/${rows.length} sets`}
            {s.browsing && <> · <button type="button" className="font-semibold text-brand-text" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Back to today</button></>}
          </span>
        </div>

        {/* ONE CARD PER LIFT, nothing folded, one row each (COD-588). */}
        <ol className="flex flex-col gap-3">
          {s.cur.exercises.map((e) => {
            const mine = rows.filter((r) => r.exercise === e.name)
            const n = mine.filter((r) => done.has(r.id)).length
            const all = mine.length > 0 && n === mine.length
            const first = mine[0]
            const reps = /rep/i.test(e.qty)
            // Last time you did this lift, and what that says to lift today.
            const prev = reps ? lastSetFor(data, e.name) : null
            const target = Number.parseInt(first?.reps || '', 10) || 0
            const next = suggestWeight(prev, target, unit)
            const cur = Number(first?.weight) || 0
            return (
              <li key={e.name} className="ex-card flex items-center gap-2" data-done={all || undefined}>
                {/* ONE ROW, Pull-ups' shape (owner, 2026-11-13: "fit all in
                    the one card"): a set counter — tap after each set, tap a
                    full one to clear —, the name with plan, last time and
                    Watch, then the weight. Tapping the weight opens the sheet
                    for set-by-set numbers. Was a pill per set on a second row. */}
                <button type="button" className="set-count" aria-pressed={all}
                  aria-label={all ? `${e.name}: all ${mine.length} sets done, tap to clear` : `${e.name}: ${n}/${mine.length} sets done, tap after set ${n + 1}`}
                  onClick={() => {
                    if (all) { patch({ done: [...done].filter((id) => !mine.some((r) => r.id === id)) }); return }
                    const nextSet = mine.find((r) => !done.has(r.id))
                    if (nextSet) tick(nextSet)
                  }}>
                  {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{mine.length}</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-body font-semibold leading-snug ${all ? 'text-fg-2' : 'text-fg-1'}`}>{e.name}</h3>
                  <p className="text-label text-fg-2">
                    {mine.length} × {first?.reps || e.qty}
                    {prev && <span>, last {prev.weight > 0 ? `${prev.weight}×${prev.reps}` : `${prev.reps} reps`}</span>}{' '}
                    <VideoLink name={e.name} label="Watch" size="sm" className="-my-3 py-3" />
                  </p>
                  {next != null && next !== cur && (
                    <button type="button" className="suggest mt-1 inline-flex items-center gap-1" onClick={() => setLiftWeight(e.name, next)}>
                      <Icon as={ArrowLineUp} size="sm" />Try {next} {unit}
                    </button>
                  )}
                </div>
                {reps && (
                  <div className="ex-weight" role="group" aria-label={`${e.name}, weight for every set`}>
                    <button type="button" className="round-btn" aria-label={`${e.name}: ${weightStep(unit)} ${unit} lighter`} onClick={() => setLiftWeight(e.name, cur - weightStep(unit))}><Icon as={Minus} size="sm" /></button>
                    <button type="button" className="min-h-11 min-w-[3.25rem] text-center text-label font-semibold tabular-nums text-fg-1" aria-haspopup="dialog"
                      aria-label={`${cur ? `${cur} ${unit}` : `No weight`}: edit ${e.name} sets`} onClick={() => setEditing(e.name)}>
                      {cur ? `${cur} ${unit}` : `– ${unit}`}
                    </button>
                    <button type="button" className="round-btn" aria-label={`${e.name}: ${weightStep(unit)} ${unit} heavier`} onClick={() => setLiftWeight(e.name, cur + weightStep(unit))}><Icon as={Plus} size="sm" /></button>
                  </div>
                )}
                {secondsIn(e.qty) != null && (
                  <button type="button" className="round-btn shrink-0" aria-haspopup="dialog" aria-label={`Timer for ${e.name}`} onClick={() => setTiming(e.name)}>
                    <Icon as={Timer} size="md" />
                  </button>
                )}
              </li>
            )
          })}
        </ol>
        {timing && (
          <HoldTimer name={timing} target={secondsIn(s.cur.exercises.find((e) => e.name === timing)?.qty ?? '')} onClose={() => setTiming(null)}
            onSave={(secs) => {
              setHeld((h) => ({ ...h, [timing]: [...(h[timing] ?? []), secs] }))
              const next = rows.find((r) => r.exercise === timing && !done.has(r.id))
              if (next) tick(next)
            }} />
        )}
        {editing && (
          <Sheet open onOpenChange={(o) => { if (!o) setEditing(null) }} title={editing} description="Weight and reps, set by set">
            <div className="ios-form">
              <SetCards bare rows={rows.filter((r) => r.exercise === editing)} onChange={(r) => replaceLift(editing, r)} unit={unit} data={data} onRest={tick} done={done} />
            </div>
          </Sheet>
        )}

        {/* Docked above the bottom nav, so Log is always one thumb away however
            many lifts are open — and the rest timer docks INSIDE it, above
            the buttons, rather than as a second fixed layer on top of them. */}
        <div className="log-dock">
          {rest && <div className="w-full">{rest}</div>}
          <button type="button" className="round-btn ml-auto" aria-pressed={allTicked} aria-label={allTicked ? 'Untick every set' : 'Tick every set'}
            onClick={() => patch({ done: allTicked ? [] : rows.map((r) => r.id) })}>
            <Icon as={ListChecks} size="md" />
          </button>
          <button type="button" className="cta cta-compact" onClick={log}>
            <Icon as={Check} size="md" />{ticked.length ? `Log ${ticked.length} ${ticked.length === 1 ? 'set' : 'sets'}` : 'Log workout'}
          </button>
        </div>
        {/* The block's standing guidance, one row per point, open — a fold
            here was a subpart (COD-588). */}
        {s.p.note && <WeekNotes notes={s.p.note} />}
      </section>
    </div>
  )
}


function WeekNotes({ notes }: { notes: string[] }) {
  return (
    <section aria-label="Block notes" className="cells">
      <h2 className="cell text-body text-fg-1">Notes</h2>
      <ul className="border-t border-line">
        {notes.map((n) => <li key={n} className="note-row">{n}</li>)}
      </ul>
    </section>
  )
}
