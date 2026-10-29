import { useState } from 'react'
import { CaretDown, Check, CheckCircle, ListChecks } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../../store'
import { activityForSplit } from '../../../domain/activities'
import { isNewPR } from '../../../lib/fitness'
import { todayISO } from '../../../lib/date'
import { notify } from '../../../lib/notify'
import type { SetRow } from '../../gym/setRow'
import { SetCards } from '../../gym/phone/SetCards'
import { storedSets } from '../../gym/phone/strengthHelpers'
import type { ProgramState } from '../useProgram'
import { actualOf, followOn, planRows, splitForFocus } from './programLog'

/**
 * PROGRAM ON A PHONE — pick the day, log it, here (COD-461, COD-464).
 *
 * OWNS: the phone page: Week and Day as one selection bar (two native
 * selects side by side), the day as ONE ROW PER LIFT — a round counter you
 * tap after each set, the row opening to Strength's set cards to change
 * weight and reps — and "Log workout", which saves a real Strength session
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
  const allTicked = rows.length > 0 && ticked.length === rows.length

  function log() {
    const { sets, setRows } = storedSets(ticked, unit, data.settings)
    if (sets.length === 0) { notify.info('Nothing ticked yet', 'Tick the sets you did, then log.'); return }
    const pr = ticked.find((r) => r.kind !== 'warmup' && isNewPR(data, r.exercise.trim(), Number(r.weight), Number(r.reps)))
    const split = splitForFocus(s.cur.focus)
    addWorkout({ date: todayISO(), activity: activityForSplit(split), split, sets, setRows, notes: `${s.p.name} · ${s.unit} ${s.week}, day ${s.cur.day}` })
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
  const sameDay = (w: (typeof s.p.weeks)[number]) => w.days.find((d) => d.day === s.cur.day)?.day ?? w.days[0].day
  return (
    <div className="flex flex-col gap-3 pb-4">
      <h1 className="sr-only">Program</h1>

      {/* THE SELECTION BAR — week and day side by side in one 44px row.
          Native selects: on iOS they open the system wheel, the picker people
          already know, and they cost no sheet of our own. */}
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
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="min-w-0 truncate text-heading font-bold text-fg-1">{s.cur.focus}</h2>
            <span className="shrink-0 text-label text-fg-2">
              {logged ? <span className="inline-flex items-center gap-1 font-semibold text-fg-1"><Icon as={CheckCircle} size="sm" />Logged</span> : `${ticked.length}/${rows.length} sets`}
              {s.browsing && <> · <button type="button" className="font-semibold text-brand-text" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Back to today</button></>}
            </span>
          </div>
          {/* Progress through THIS session — a status, not a chart. */}
          <div className="h-1 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Sets ticked" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* ONE ROW PER LIFT. The round counter is tapped after each set; the
            row opens to change weight and reps. Twenty-two set rows were four
            phone screens; seven lift rows are one. */}
        <div className="cells">
          {s.cur.exercises.map((e) => {
            const mine = rows.filter((r) => r.exercise === e.name)
            const n = mine.filter((r) => done.has(r.id)).length
            const all = mine.length > 0 && n === mine.length
            const open = editing === e.name
            const first = mine[0]
            return (
              <div key={e.name} className="lift-row" data-done={all || undefined}>
                <div className="flex items-center gap-3 px-3">
                  <button
                    type="button"
                    className="set-count"
                    aria-pressed={all}
                    aria-label={all ? `${e.name}: all ${mine.length} sets done, tap to clear` : `${e.name}: ${n}/${mine.length} sets done, tap after set ${n + 1}`}
                    onClick={() => {
                      if (all) { patch({ done: [...done].filter((id) => !mine.some((r) => r.id === id)) }); return }
                      const next = mine.find((r) => !done.has(r.id))
                      if (next) tick(next)
                    }}
                  >
                    {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{mine.length}</span>}
                  </button>
                  <button type="button" className="min-w-0 flex-1 py-1.5 text-left" aria-expanded={open} onClick={() => setEditing(open ? null : e.name)}>
                    <span className={`block truncate text-body font-medium ${all ? 'text-fg-2' : 'text-fg-1'}`}>{e.name}</span>
                    <span className="block text-label text-fg-2">
                      {mine.length} × {first?.reps || e.qty} · {first?.weight ? `${first.weight} ${unit}` : 'add weight'}
                    </span>
                  </button>
                  <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
                {open && (
                  <div className="ios-form pb-1">
                    <SetCards bare rows={mine} onChange={(r) => replaceLift(e.name, r)} unit={unit} data={data} onRest={tick} done={done} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Docked above the bottom nav, so Log is always one thumb away however
            many lifts are open — and the rest timer docks INSIDE it, above
            the buttons, rather than as a second fixed layer on top of them. */}
        <div className="log-dock grid grid-cols-[auto_1fr] gap-2">
          {rest && <div className="col-span-2">{rest}</div>}
          <button type="button" className="round-btn h-[3.25rem] w-[3.25rem]" aria-pressed={allTicked} aria-label={allTicked ? 'Untick every set' : 'Tick every set'}
            onClick={() => patch({ done: allTicked ? [] : rows.map((r) => r.id) })}>
            <Icon as={ListChecks} size="md" />
          </button>
          <button type="button" className="cta" onClick={log}>
            <Icon as={Check} size="md" />{ticked.length ? `Log workout · ${ticked.length} ${ticked.length === 1 ? 'set' : 'sets'}` : 'Log workout'}
          </button>
        </div>
        {s.p.note && <p className="px-1 text-label text-fg-2">{s.p.note}</p>}
      </section>
    </div>
  )
}

