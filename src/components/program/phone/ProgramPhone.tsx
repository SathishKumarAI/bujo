import { Seg } from '../../ui/seg'
import { useState } from 'react'
import { ArrowLineUp, CaretDown, Check, CheckCircle, ListChecks, Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
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
import { storedSets } from '../../gym/phone/strengthHelpers'
import type { ProgramState } from '../useProgram'
import { actualOf, followOn, planRows, splitForFocus, suggestWeight, weightStep } from './programLog'

/**
 * PROGRAM ON A PHONE — pick the day, log it, here (COD-461, COD-464).
 *
 * OWNS: the phone page: Week and Day as one selection bar (two native
 * selects side by side), the day as ONE CARD PER LIFT — weight − / +, one
 * pill per set you tap after it, Strength's set cards in a sheet for a
 * single set (COD-588) — and "Log workout", which saves a real Strength session
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
    s.logDay(s.cur.exercises
      .map((e, i) => ({ i, actual: actualOf(ticked.filter((r) => r.exercise === e.name), unit) }))
      .filter((x) => x.actual))
    setDrafts((d) => { const n = { ...d }; delete n[k]; return n })
    const next = s.days[at + 1]
    notify.success(
      pr ? `New PR · ${pr.exercise} ${pr.weight}${unit} × ${pr.reps}` : `${s.cur.focus} logged · ${sets.length} ${sets.length === 1 ? 'set' : 'sets'}`,
      next ? `Next up: day ${next.day} · ${next.focus}` : 'That was the last day of the block.',
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
  const sameDay = (w: (typeof s.p.weeks)[number]) => w.days.find((d) => d.day === s.cur.day)?.day ?? w.days[0].day
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
      <div className="select-bar" role="group" aria-label="Choose the day">
        <label className="select-pill">
          <span className="sr-only">{s.unit}</span>
          <select value={s.week} onChange={(e) => { const w = s.p.weeks.find((x) => x.week === Number(e.target.value)); if (w) s.goTo(w.week, sameDay(w)) }}>
            {s.p.weeks.map((w) => (
              <option key={w.week} value={w.week}>{s.unit} {w.week}{s.weekComplete(w.week) ? ' ✓' : ''}</option>
            ))}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
        <label className="select-pill">
          <span className="sr-only">Day</span>
          <select value={s.cur.day} onChange={(e) => s.goTo(s.week, Number(e.target.value))}>
            {s.curWeek.days.map((d) => (
              <option key={d.day} value={d.day}>Day {d.day} · {d.focus}{s.dayComplete(s.week, d.day) ? ' ✓' : ''}</option>
            ))}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
      </div>

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

        {/* ONE CARD PER LIFT, nothing folded (owner, 2026-11-13: "only
            cards … no subparts"). Each card: name + Watch, what last time
            was, the weight for every set (− / +), and one pill per set — tap
            it after the set. Changing a single set's numbers is the sheet
            behind "Edit sets"; the card itself never opens. COD-588. */}
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
              <li key={e.name} className="ex-card" data-done={all || undefined}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-body font-semibold ${all ? 'text-fg-2' : 'text-fg-1'}`}>{e.name}</h3>
                    <p className="text-label text-fg-2">
                      {mine.length} × {first?.reps || e.qty}
                      {prev && <span> · last {prev.weight > 0 ? `${prev.weight}×${prev.reps}` : `${prev.reps} reps`}</span>}
                    </p>
                  </div>
                  <VideoLink name={e.name} label="Watch" size="sm" className="min-h-11 shrink-0" />
                </div>
                {reps && (
                  <div className="ex-weight">
                    <span className="min-w-0 flex-1 text-label text-fg-2">Weight, every set</span>
                    <button type="button" className="round-btn" aria-label={`${e.name}: ${weightStep(unit)} ${unit} lighter`} onClick={() => setLiftWeight(e.name, cur - weightStep(unit))}><Icon as={Minus} size="sm" /></button>
                    <span className="min-w-[4.5rem] text-center text-body font-semibold tabular-nums text-fg-1" aria-live="polite">{cur ? `${cur} ${unit}` : `– ${unit}`}</span>
                    <button type="button" className="round-btn" aria-label={`${e.name}: ${weightStep(unit)} ${unit} heavier`} onClick={() => setLiftWeight(e.name, cur + weightStep(unit))}><Icon as={Plus} size="sm" /></button>
                  </div>
                )}
                {next != null && next !== cur && (
                  <button type="button" className="suggest mt-2 inline-flex w-full items-center justify-center gap-1.5" onClick={() => setLiftWeight(e.name, next)}>
                    <Icon as={ArrowLineUp} size="sm" />
                    {prev && next > prev.weight ? `All ${prev.reps} reps last time — try ${next} ${unit}` : `Same as last time — ${next} ${unit}`}
                  </button>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={`${e.name} sets`}>
                  {mine.map((r, j) => {
                    const on = done.has(r.id)
                    const what = r.weight ? `${r.weight}×${r.reps || '?'}` : (r.reps || e.qty)
                    return (
                      <button key={r.id} type="button" className="set-pill" aria-pressed={on} onClick={() => tick(r)}>
                        {on && <Icon as={Check} size="sm" />}<span className="sr-only">Set {j + 1} </span>{what}
                      </button>
                    )
                  })}
                  {reps && <button type="button" className="ml-auto min-h-11 text-label font-semibold text-brand-text" aria-haspopup="dialog" onClick={() => setEditing(e.name)}>Edit sets</button>}
                </div>
              </li>
            )
          })}
        </ol>
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
            <Icon as={Check} size="md" />{ticked.length ? `Log workout · ${ticked.length} ${ticked.length === 1 ? 'set' : 'sets'}` : 'Log workout'}
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
      <h2 className="cell text-body text-fg-1">Every week</h2>
      <ul className="border-t border-line">
        {notes.map((n) => <li key={n} className="note-row">{n}</li>)}
      </ul>
    </section>
  )
}
