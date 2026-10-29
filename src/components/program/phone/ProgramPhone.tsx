import { useState } from 'react'
import { CaretLeft, CaretRight, Check, CheckCircle, ListChecks } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../../store'
import { activityForSplit } from '../../../domain/activities'
import { isNewPR } from '../../../lib/fitness'
import { dayStats } from '../../../lib/programs'
import { todayISO } from '../../../lib/date'
import { notify } from '../../../lib/notify'
import { Cell, Cells } from '../../ui/cells'
import { Sheet } from '../../ui/sheet'
import type { SetRow } from '../../gym/setRow'
import { SetCards } from '../../gym/phone/SetCards'
import { storedSets } from '../../gym/phone/strengthHelpers'
import type { ProgramState } from '../useProgram'
import { actualOf, planRows, splitForFocus } from './programLog'

/**
 * PROGRAM ON A PHONE — pick the day, log it, here (COD-461, COD-464).
 *
 * OWNS: the phone page: Week and Day as two steppers side by side (arrows to
 * step, the face opens a picker sheet), the day's prescription as Strength's
 * set cards pre-filled from the plan and from last time, and "Log workout",
 * which saves a real Strength session AND ticks the program day.
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
  const [picking, setPicking] = useState<'week' | 'day' | null>(null)
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
  const step = (by: number) => {
    const d = s.days[at + by]
    if (d) s.goTo(d.week, d.day)
  }
  const weekAt = s.p.weeks.findIndex((w) => w.week === s.week)
  const stepWeek = (by: number) => {
    const w = s.p.weeks[weekAt + by]
    // Same day number in the new week when it has one — Day 3 stays Day 3.
    if (w) s.goTo(w.week, w.days.find((d) => d.day === s.cur.day)?.day ?? w.days[0].day)
  }

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
  return (
    <div className={rest ? 'flex flex-col gap-5 pb-36' : 'flex flex-col gap-5 pb-4'}>
      <h1 className="sr-only">Program</h1>

      <section aria-label="Choose the day" className="flex flex-col gap-2">
        <div className="flex min-h-[2.75rem] items-center justify-between gap-2 px-1">
          <span className="min-w-0 truncate text-label text-fg-2">{s.p.name}</span>
          {s.browsing
            ? <button type="button" className="sheet-done" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Back to today</button>
            : <span className="shrink-0 text-label font-semibold text-fg-1">{s.totalDays - s.doneCount} days left</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stepper
            what={s.unit.toLowerCase()} value={`${s.unit} ${s.week}`}
            sub={s.weekComplete(s.week) ? 'Complete' : (span(s.curWeek.label) ?? `of ${s.p.weeks.length}`)}
            onPrev={weekAt > 0 ? () => stepWeek(-1) : undefined}
            onNext={weekAt < s.p.weeks.length - 1 ? () => stepWeek(1) : undefined}
            onOpen={() => setPicking('week')}
          />
          <Stepper
            what="day" value={`Day ${s.cur.day}`} sub={s.cur.focus}
            onPrev={at > 0 ? () => step(-1) : undefined}
            onNext={at < s.days.length - 1 ? () => step(1) : undefined}
            onOpen={() => setPicking('day')}
          />
        </div>
      </section>

      <section aria-label={`${s.cur.focus} · day ${s.cur.day}`} className="ios-form flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="min-w-0 truncate text-title font-bold text-fg-1">{s.cur.focus}</h2>
            <span className="shrink-0 text-label text-fg-2">
              {logged ? <span className="inline-flex items-center gap-1 font-semibold text-fg-1"><Icon as={CheckCircle} size="sm" />Logged</span> : `${ticked.length}/${rows.length} sets`}
            </span>
          </div>
          {/* Progress through THIS session — a status, not a chart. */}
          <div className="h-1.5 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Sets ticked" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <SetCards rows={rows} onChange={(r) => patch({ rows: r })} unit={unit} data={data} onRest={tick} done={done} />

        {rest && <div className="rest-dock">{rest}</div>}

        <div className="grid grid-cols-[auto_1fr] gap-2">
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

      <Sheet open={picking === 'week'} onOpenChange={(o) => { if (!o) setPicking(null) }} title={`Choose a ${s.unit.toLowerCase()}`} description={`${s.p.weeks.length} in the block`}>
        <div role="radiogroup" aria-label={`${s.unit}s`} className={`grid gap-2 ${s.p.weeks.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {s.p.weeks.map((w) => (
            <button key={w.week} type="button" role="radio" aria-checked={w.week === s.week} className="pick-tile"
              onClick={() => { s.goTo(w.week, w.days.find((d) => d.day === s.cur.day)?.day ?? w.days[0].day); setPicking(null) }}>
              <span className="text-heading font-bold">{w.week}</span>
              {s.weekComplete(w.week) ? <><Icon as={CheckCircle} size="sm" className="text-fg-2" /><span className="sr-only">complete</span></> : <span className="text-label text-fg-2">{span(w.label) ?? s.unit}</span>}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={picking === 'day'} onOpenChange={(o) => { if (!o) setPicking(null) }} title={`${s.unit} ${s.week}`} description="Choose a day">
        <Cells>
          {s.curWeek.days.map((d) => {
            const st = dayStats(s.p, s.week, d.day)
            const isDone = s.dayComplete(s.week, d.day)
            return (
              <Cell
                key={d.day}
                lead={<span aria-hidden className={`set-badge ${d.day === s.cur.day ? 'ring-2 ring-brand' : ''}`}>{isDone ? <Icon as={Check} size="sm" /> : d.day}</span>}
                title={`Day ${d.day} · ${d.focus}`}
                subtitle={`${st.exercises} lifts · ${st.sets} sets${isDone ? ' · logged' : ''}`}
                onPress={() => { s.goTo(s.week, d.day); setPicking(null) }}
                chevron={false}
              />
            )
          })}
        </Cells>
      </Sheet>
    </div>
  )
}

/** "Phase 2 · Weeks 5–8" → "Weeks 5–8": the part a 170px stepper has room for. */
const span = (label?: string) => label?.split('·').pop()?.trim()

/**
 * ‹ value › — one tap steps, the face opens the full picker. Two of these
 * side by side replace two stacked rows of tiles.
 */
function Stepper({ what, value, sub, onPrev, onNext, onOpen }: {
  what: string
  value: string
  sub: string
  onPrev?: () => void
  onNext?: () => void
  onOpen: () => void
}) {
  return (
    <div className="stepper">
      <button type="button" className="stepper-arrow" aria-label={`Previous ${what}`} disabled={!onPrev} onClick={onPrev}>
        <Icon as={CaretLeft} size="sm" />
      </button>
      <button type="button" className="stepper-face" onClick={onOpen}>
        <span className="sr-only">Choose {what}: </span>
        <span className="block text-heading font-bold text-fg-1">{value}</span>
        <span className="block truncate text-label text-fg-2">{sub}</span>
      </button>
      <button type="button" className="stepper-arrow" aria-label={`Next ${what}`} disabled={!onNext} onClick={onNext}>
        <Icon as={CaretRight} size="sm" />
      </button>
    </div>
  )
}
