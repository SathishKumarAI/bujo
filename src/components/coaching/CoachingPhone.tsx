import { useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, Barbell, CalendarDot, CaretDown, Check, Clock, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { onRaised } from '../../lib/colors'
import { WEEKDAYS } from '../../lib/date'
import { ACADEMY_TOTAL_WEEKS, SESSION_TEMPLATE, TWELVE_WEEK, WEEKLY_TEMPLATE } from '../../lib/pickleballAcademy'
import { PracticeTick } from './PracticeTick'

/**
 * THE 12-WEEK PROGRAM ON A PHONE — the Pull-ups program day's shape.
 *
 * OWNS: the phone drawing of the program section. Week is one native select
 * (each week's focus, ✓ when done); today's slot is one line; the week is its
 * instruction, one row per drill with the drill's tick, and the goal; the
 * session template, the start date and Reset are rows (the template opens a
 * sheet); the week's record and note are the view's (`record`); a dock marks
 * the week done and then offers the next one.
 * DOES NOT OWN: any program state (`views/Coaching.tsx` holds start, the done
 * weeks and the notes) or the manual chapters, which stay behind the section
 * select above this.
 *
 * Measured before: 1,685px — a weekday chip strip, the roadmap card with its
 * own week stepper, a session template of six timed paragraphs, the record,
 * then the start date and Reset, all open.
 */
export function CoachingPhone({ started, current, done, week, onWeek, onToggle, onStart, onRestart, start, onStartDate, today, dow, record }: {
  started: boolean
  /** The week the calendar says you are in (0 before starting). */
  current: number
  done: number[]
  /** The week on screen. */
  week: number
  onWeek: (w: number) => void
  onToggle: (w: number) => void
  onStart: () => void
  onRestart: () => void
  start: string | undefined
  onStartDate: (d: string) => void
  today: string
  dow: number
  record: (week: number) => ReactNode
}) {
  const [template, setTemplate] = useState(false)
  const w = TWELVE_WEEK.find((x) => x.week === week) ?? TWELVE_WEEK[0]
  const slot = WEEKLY_TEMPLATE[(dow + 6) % 7]
  const isDone = done.includes(w.week)
  const pct = Math.round((done.length / ACADEMY_TOTAL_WEEKS) * 100)

  return (
    <section aria-label="The 12-week program" className="flex flex-col gap-3">
      {/* Where you are, in one line — the three facts the desktop's StatBar says. */}
      <div className="cells px-4 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-title font-bold text-fg-1 tabular-nums">
            {started ? <>Week {current} <span className="text-body font-medium text-fg-2">of {ACADEMY_TOTAL_WEEKS}</span></> : <span className="text-body font-medium text-fg-2">Not started</span>}
          </span>
          <span className="text-label text-fg-2">{done.length} done · {pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Weeks done" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="h-full rounded-pill bg-green" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!started && (
        <Cells>
          <Cell icon={Target} tone="green" title="Start the program" subtitle="Fundamentals → dinks → drops → resets → hands → match play" onPress={onStart} />
        </Cells>
      )}

      <label className="select-pill">
        <span className="sr-only">Week</span>
        <select value={w.week} onChange={(e) => onWeek(Number(e.target.value))}>
          {TWELVE_WEEK.map((x) => (
            <option key={x.week} value={x.week}>Week {x.week} · {x.focus}{done.includes(x.week) ? ' ✓' : ''}{started && x.week === current ? ' · now' : ''}</option>
          ))}
        </select>
        <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
      </label>

      <p className="px-1 text-label text-fg-2">
        <b className="text-fg-1">Today · {WEEKDAYS[dow]}: {slot.focus}.</b> {slot.detail}
      </p>

      <div className="cells">
        <p className="cell text-body text-fg-1">{w.doThis}</p>
        {w.drills.map((d) => (
          <div key={d} className="cell gap-2">
            <Icon as={Barbell} size="sm" className="shrink-0 text-fg-2" />
            <span className="min-w-0 flex-1 text-body text-fg-1">{d}</span>
            <PracticeTick kind="drill" name={d} />
          </div>
        ))}
        <p className="cell gap-2 text-label" style={{ color: onRaised('green') }}>
          <Icon as={Target} size="sm" className="shrink-0" />Goal: {w.goal}
        </p>
      </div>

      {started && record(w.week)}

      <Cells>
        <Cell icon={Clock} tone="teal" title="A 45–60 min session" subtitle="How to split the hour on a court day" onPress={() => setTemplate(true)} />
        {started && (
          <label className="cell">
            <span className="cell-tile" aria-hidden><Icon as={CalendarDot} size="sm" /></span>
            <span className="flex-1 text-body text-fg-1">Started</span>
            <input type="date" value={start} max={today} onChange={(e) => { if (e.target.value) onStartDate(e.target.value) }}
              aria-label="Program start date" className="cell-input" />
          </label>
        )}
        {started && isDone && (
          <Cell icon={ArrowCounterClockwise} tone="overlay1" title={`Mark week ${w.week} not done`} chevron={false} onPress={() => onToggle(w.week)} />
        )}
        {started && <Cell icon={ArrowCounterClockwise} tone="red" title="Reset program" subtitle="Asks first — your logged games stay" chevron={false} onPress={onRestart} />}
      </Cells>

      {started && (
        <div className="log-dock">
          {/* Done is a state: it offers the next week instead of unticking
              this one (that is the row above — the Challenges lesson). */}
          {isDone ? (
            <button type="button" className="cta cta-compact" disabled={w.week >= ACADEMY_TOTAL_WEEKS} onClick={() => onWeek(w.week + 1)}>
              <Icon as={Check} size="md" />Week {w.week} done · next
            </button>
          ) : (
            <button type="button" className="cta cta-compact" onClick={() => onToggle(w.week)}>
              <Icon as={Check} size="md" />Mark week {w.week} done
            </button>
          )}
        </div>
      )}

      <Sheet open={template} onOpenChange={setTemplate} title="A 45–60 min session" description="Minutes, and what goes in them">
        <div className="cells">
          {SESSION_TEMPLATE.map((b) => (
            <div key={b.mins} className="cell items-start gap-3">
              <span className="w-14 shrink-0 text-label font-semibold tabular-nums text-fg-1">{b.mins}</span>
              <span className="min-w-0 flex-1 text-body text-fg-1">{b.activity}</span>
            </div>
          ))}
        </div>
      </Sheet>
    </section>
  )
}
