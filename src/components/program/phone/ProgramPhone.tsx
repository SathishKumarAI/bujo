import { useEffect, useRef } from 'react'
import { ArrowRight, Check, CheckCircle, ListChecks } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cells } from '../../ui/cells'
import type { ProgramState } from '../useProgram'

/**
 * PROGRAM ON A PHONE — the training block as a day you tick off (COD-461).
 *
 * OWNS: the phone page: week and day as swipeable tiles, the day's lifts as
 * rows with a round check (ticking starts the rest timer) and an "actual"
 * field, "Log in Strength" and "Mark all done".
 * DOES NOT OWN: the program state (`useProgram`), the hand-off to Strength or
 * the rest timer — the view's, passed in. The body map is not here: it is
 * reference, not a step, and a phone logs (CLAUDE.md).
 */
export function ProgramPhone({ s, onLoad, onCheck, rest }: {
  s: ProgramState
  /** Hand today's lifts to the Strength logger and go there. */
  onLoad: () => void
  /** A lift was ticked — start its rest. */
  onCheck: (exercise: string, qty: string) => void
  rest: React.ReactNode
}) {
  const weeks = useRef<HTMLDivElement>(null)
  const daysRow = useRef<HTMLDivElement>(null)
  // The chosen week and day scroll into view — week 9 of 12 sat off screen.
  useEffect(() => {
    for (const r of [weeks.current, daysRow.current]) {
      const el = r?.querySelector<HTMLElement>('[aria-checked="true"]')
      if (el && r) r.scrollTo({ left: el.offsetLeft - r.clientWidth / 2 + el.clientWidth / 2 })
    }
  }, [s.week, s.day])
  const pct = s.cur.exercises.length ? Math.round((s.curDoneCount / s.cur.exercises.length) * 100) : 0

  return (
    <div className={rest ? 'flex flex-col gap-6 pb-36' : 'flex flex-col gap-6 pb-4'}>
      <h1 className="sr-only">Program</h1>

      <section aria-label="Choose the day" className="ios-form flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2 className="text-title font-bold text-fg-1">{s.unit} {s.week} · Day {s.day}</h2>
          {s.browsing && (
            <button type="button" className="sheet-done" onClick={() => s.goTo(s.resume.week, s.resume.day)}>Today</button>
          )}
        </div>
        <div ref={weeks} role="radiogroup" aria-label={`${s.unit}s`} className="picker-row">
          {s.p.weeks.map((w) => (
            <button key={w.week} type="button" role="radio" aria-checked={w.week === s.week} className="pick-tile pick-tile-sm"
              aria-label={`${s.unit} ${w.week}${s.weekComplete(w.week) ? ', complete' : ''}`}
              onClick={() => s.goTo(w.week, w.days[0]?.day ?? 1)}>
              <span className="text-label text-fg-2">{s.unit.slice(0, 1)}</span>
              <span className="text-heading font-bold">{w.week}</span>
              {s.weekComplete(w.week) && <Icon as={CheckCircle} size="sm" className="text-fg-2" />}
            </button>
          ))}
        </div>
        <div ref={daysRow} role="radiogroup" aria-label="Days" className="picker-row">
          {s.curWeek.days.map((d) => (
            <button key={d.day} type="button" role="radio" aria-checked={d.day === s.day} className="pick-tile"
              aria-label={`Day ${d.day}, ${d.focus}${s.dayComplete(s.week, d.day) ? ', complete' : ''}`}
              onClick={() => s.goTo(s.week, d.day)}>
              <span className="text-heading font-bold">{s.dayComplete(s.week, d.day) ? <Icon as={Check} size="md" /> : d.day}</span>
              <span className="max-w-[5.5rem] truncate">{d.focus}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label={`${s.cur.focus} · day ${s.day}`} className="ios-form flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="min-w-0 truncate text-heading font-semibold text-fg-1">{s.cur.focus}</h2>
            <span className="shrink-0 text-label text-fg-2">{s.curDoneCount}/{s.cur.exercises.length} done · {s.stats.sets} sets</span>
          </div>
          {/* Progress through THIS day — a status, not a chart. */}
          <div className="h-1.5 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Lifts done today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="cells">
          {s.cur.exercises.map((e, i) => {
            const checked = s.curDone[i]
            const k = s.key(i)
            return (
              <div key={k} className="cell">
                <button type="button" className="check-circle" aria-pressed={checked} aria-label={`Did ${e.name}`}
                  onClick={() => { s.toggleEx(i); if (!checked) onCheck(e.name, e.qty) }}>
                  <span aria-hidden><Icon as={Check} size="md" /></span>
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block text-body font-medium ${checked ? 'text-fg-2 line-through' : 'text-fg-1'}`}>{e.name}</span>
                  <span className="block text-label text-fg-2">{e.qty} × {e.sets}</span>
                </span>
                {/* What you actually did, committed on blur like the desktop's
                    `CommitField` — a settings write per keystroke would churn. */}
                <input
                  key={k}
                  defaultValue={s.actuals[k] ?? ''}
                  onBlur={(ev) => { if (ev.target.value !== (s.actuals[k] ?? '')) s.setActual(i, ev.target.value) }}
                  placeholder="Actual"
                  aria-label={`Actual for ${e.name} (target: ${e.qty} ×${e.sets})`}
                  className="actual-input"
                />
              </div>
            )
          })}
        </div>

        {rest && <div className="rest-dock">{rest}</div>}

        <button type="button" className="cta" onClick={onLoad}><Icon as={ArrowRight} size="md" />Log these in Strength</button>
        <Cells>
          <button type="button" className="cell" onClick={s.toggleAll}>
            <span aria-hidden className="cell-tile bg-ink-2 text-fg-1"><Icon as={ListChecks} size="sm" /></span>
            <span className="flex-1 text-body font-medium text-fg-1">{s.allCurDone ? 'Uncheck all' : 'Mark all done'}</span>
          </button>
        </Cells>
        {s.p.note && <p className="px-1 text-label text-fg-2">{s.p.note}</p>}
      </section>
    </div>
  )
}
