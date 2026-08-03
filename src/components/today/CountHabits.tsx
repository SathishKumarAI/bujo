import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Pill } from '../ui'
import { Stepper } from '../fields/Stepper'
import { habitTarget, habitValueOn, habitDoneOn } from '../../lib/stats'
import { isScheduledOn } from '../../lib/habitStats'

/**
 * Count/timer habits scheduled on this day, each with a `Stepper` so progress
 * is logged without leaving the day — and, because the stepper keeps a real
 * number input, "8" can be typed in one go instead of tapping `+` eight times.
 *
 * The hand-rolled ± buttons this replaced carried a third `+{step}` button that
 * called `setHabitValue(val + step)` — byte-identical to what `+` beside it
 * already did. It was deleted rather than ported.
 */
export function CountHabits({ date }: { date: string }) {
  const { data, setHabitValue } = useJournal()
  const habits = data.habits.filter(
    (h) => !h.archived && !h.avoid && (h.type === 'count' || h.type === 'timer') && isScheduledOn(h, date),
  )
  if (habits.length === 0) return null
  return (
    <Card title="Count habits" subtitle="Tap −/+ or type today's tally">
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
          return (
            <li key={h.id} className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-ink-0 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-body text-fg-1">
                {h.emoji ? `${h.emoji} ` : ''}{h.name}
                {h.unit && <span className="text-fg-2"> ({h.unit})</span>}
              </span>
              <Pill color={met ? 'green' : undefined} tone={met ? 'wash' : 'muted'} className="tabular-nums">
                {met && <Icon as={Check} size="sm" />}
                {val}/{target}{h.type === 'timer' ? 'm' : ''}
              </Pill>
              <Stepper
                value={val}
                onChange={(v) => setHabitValue(date, h.id, Math.max(0, v ?? 0))}
                step={step}
                min={0}
                aria-label={h.name}
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
