import { Check, Minus, Plus, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { prettyDay, todayISO } from '../../lib/date'
import { habitDoneOn, habitTarget, habitValueOn, isNumericHabit, isSteppableHabit, limitStatus, nextHabitValue } from '../../lib/stats'
import { cat, onAccent, onRaised } from '../../lib/colors'
import { HABIT_KEY } from '../../lib/recordKeys'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import type { Habit, JournalData } from '../../lib/types'

/**
 * TODAY'S HABITS ON A PHONE, AS CARDS — two to a row (owner, 2026-11-13:
 * "make them this all in mobile version into cards … animation").
 *
 * OWNS: the phone drawing of `HabitRows`. A yes/no habit is ONE card you tap
 * anywhere; done, it takes the habit's colour as its border and the check
 * pops in once. A counted habit (water, minutes, a limit) has − value + at
 * full 44px size. No week squares: a phone shows no week or month (owner,
 * 2026-11-14, COD-590), and figures are words ("8 of 8"). No "●" before a name.
 * DOES NOT OWN: what a tap writes — `HabitRows`' props, the same helpers.
 *
 * Accessible names keep `HabitRows`' wording ("Read — mark done today"),
 * which contains the card's only visible text, the name (axe 2.5.3).
 * Motion: `.habit-card` styles in `styles/phone.css`, off under
 * prefers-reduced-motion.
 */
export function HabitCards({ habits, data, today, onToggle, onSetValue }: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
}) {
  const justCaptured = useJustCaptured()
  const when = today === todayISO() ? 'today' : `on ${prettyDay(today)}`

  return (
    <ul className="habit-cards">
      {habits.map((h) => {
        const type = h.type ?? 'check'
        const target = habitTarget(h)
        const val = habitValueOn(data, h, today)
        const on = habitDoneOn(data, h, today)
        const limit = limitStatus(data, h, today)
        const accent = cat(h.color ?? 'mauve')
        const fresh = justCaptured.has(HABIT_KEY(today, h.id))
        const fill = h.avoid ? cat('red') : accent
        const name = <span className="habit-name">{h.emoji && <span aria-hidden className="mr-1">{h.emoji}</span>}{h.name}</span>

        if (isSteppableHabit(h) && !h.avoid) {
          const step = type === 'timer' && target >= 20 ? 5 : 1
          return (
            <li key={h.id} {...justCapturedProps(fresh)} className="habit-card habit-count" data-on={on || undefined} style={{ ['--habit' as string]: accent }}>
              {name}
              <div className="flex items-center justify-between gap-1">
                <button type="button" className="round-btn" disabled={val <= 0} aria-label={`Decrease ${h.name}`} onClick={() => onSetValue(today, h.id, Math.max(0, val - step))}><Icon as={Minus} size="sm" /></button>
                <span className="whitespace-nowrap font-sans text-label font-semibold tabular-nums" style={{ color: limit === 'over' ? onRaised('peach') : undefined }}>
                  {val} of {target}{type === 'timer' ? ' min' : type === 'limit' ? ' max' : ''}
                </span>
                <button type="button" className="round-btn" aria-label={`Increase ${h.name}`} onClick={() => onSetValue(today, h.id, val + step)}><Icon as={Plus} size="sm" /></button>
              </div>
            </li>
          )
        }

        return (
          <li key={h.id} {...justCapturedProps(fresh)} className="flex">
            <button
              type="button"
              className="habit-card"
              aria-pressed={on}
              data-on={on || undefined}
              style={{ ['--habit' as string]: fill }}
              aria-label={h.avoid ? `${h.name} — mark a slip ${when}` : `${h.name} — mark done ${when}`}
              onClick={() => (isNumericHabit(h) ? onSetValue(today, h.id, nextHabitValue(type, target, val)) : onToggle(today, h.id))}
            >
              <span className="flex w-full items-start gap-2">
                {name}
                {/* Done: the check pops in on the habit's colour. A habit you
                    avoid shows a plain check while clean, a warning on a slip. */}
                <span aria-hidden className="habit-tick" style={on ? { background: fill, color: onAccent(fill) } : undefined}>
                  {on ? <Icon as={h.avoid ? Warning : Check} size="sm" /> : h.avoid && <Icon as={Check} size="sm" />}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
