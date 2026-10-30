import type { ReactNode } from 'react'
import { CaretLeft, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { dayDiff, WEEKDAYS } from '../../lib/date'
import { stepWeek, stripDays } from '../../lib/dayStrip'

const short = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/**
 * THE PHONE'S DAY PICKER — seven days in one row, a week arrow either side.
 *
 * OWNS: the strip's look (`.day-chip` in `styles/phone.css`), which seven days
 * show (`lib/dayStrip.ts`), the arrows, and that a day outside [min, max] is
 * drawn but cannot be picked.
 * DOES NOT OWN: what a day's mark says — each page passes `mark(day)`: Plan
 * its open tasks, Nutrition its calories, Challenges its rules, Habits its
 * done count. One shape, one meaning per page.
 *
 * It was three hand-copied grids (Plan, Nutrition, Challenges) before it was a
 * component; the arrows came with the merge, so any past day is two taps away
 * on every page that has one.
 */
export function DayStrip({ value, onChange, today, mode = 'trailing', weekStart = 0, min, max, label, title, mark }: {
  value: string
  onChange: (day: string) => void
  today: string
  /** `week`: the calendar week (planning ahead). `trailing`: seven days ending today (logging). */
  mode?: 'week' | 'trailing'
  weekStart?: 0 | 1
  /** First and last pickable day. A trailing strip stops at today unless told otherwise. */
  min?: string
  max?: string
  /** The radiogroup's name, e.g. "Day to log". */
  label: string
  /** Replaces the date range between the arrows. */
  title?: string
  /** The third line of a chip; include an `sr-only` word if it is a glyph. */
  mark: (day: string) => ReactNode
}) {
  const hi = max ?? (mode === 'trailing' ? today : undefined)
  const days = stripDays(value, today, mode, weekStart)
  const inRange = (d: string) => (!min || dayDiff(min, d) >= 0) && (!hi || dayDiff(d, hi) >= 0)
  const canBack = !min || dayDiff(min, days[0]) > 0
  const canOn = !hi || dayDiff(days[6], hi) > 0
  const heading = title ?? (mode === 'trailing' && days[6] === today ? 'This week' : `${short(days[0])} – ${short(days[6])}`)

  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="round-btn" aria-label="Previous week" disabled={!canBack} onClick={() => onChange(stepWeek(value, -1, min, hi))}>
          <Icon as={CaretLeft} size="sm" />
        </button>
        <span className="text-body font-semibold text-fg-1">{heading}</span>
        <button type="button" className="round-btn" aria-label="Next week" disabled={!canOn} onClick={() => onChange(stepWeek(value, 1, min, hi))}>
          <Icon as={CaretRight} size="sm" />
        </button>
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const dt = new Date(d + 'T00:00')
          const ok = inRange(d)
          return (
            <button key={d} type="button" role="radio" aria-checked={d === value} className="day-chip" disabled={!ok}
              data-today={d === today || undefined} onClick={() => onChange(d)}>
              <span className="text-label text-fg-2">{WEEKDAYS[dt.getDay()]}</span>
              <span className="text-heading font-bold">{dt.getDate()}</span>
              <span className="text-micro text-fg-2 tabular-nums">{ok ? mark(d) : <span aria-hidden>·</span>}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
