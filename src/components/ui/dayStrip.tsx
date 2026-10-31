import type { ReactNode } from 'react'
import { CaretLeft, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { dayDiff, WEEKDAYS } from '../../lib/date'
import { stepWeek, stripDays } from '../../lib/dayStrip'

/**
 * THE PHONE'S DAY PICKER — seven days and a week arrow at each end, one row.
 *
 * OWNS: the strip's look (`.day-chip` in `styles/phone.css`), which seven days
 * show (`lib/dayStrip.ts`), the arrows, and that a day outside [min, max] is
 * drawn but cannot be picked.
 * DOES NOT OWN: what a day's mark says — each page passes `mark(day)`: Plan
 * its open tasks, Nutrition its calories, Challenges its rules, Habits its
 * done count. One shape, one meaning per page.
 *
 * ON THE TOP BAR: on a phone it pins under the header (`.day-strip` in
 * `styles/phone.css`) with the bar's own ground, so the day you are on stays
 * in reach while you scroll — owner ask, 2026-10-31: "the log-a-day calendar
 * should be placed on the top nav bar". Sticky only works against the
 * element's parent, so a page puts it at PAGE level, never inside a card.
 *
 * It was three hand-copied grids (Plan, Nutrition, Challenges) before it was a
 * component; the arrows came with the merge, so any past day is two taps away
 * on every page that has one.
 */
export function DayStrip({ value, onChange, today, mode = 'trailing', weekStart = 0, min, max, label, mark }: {
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
  /** The third line of a chip; include an `sr-only` word if it is a glyph. */
  mark: (day: string) => ReactNode
}) {
  const hi = max ?? (mode === 'trailing' ? today : undefined)
  const days = stripDays(value, today, mode, weekStart)
  const inRange = (d: string) => (!min || dayDiff(min, d) >= 0) && (!hi || dayDiff(d, hi) >= 0)
  const canBack = !min || dayDiff(min, days[0]) > 0
  const canOn = !hi || dayDiff(days[6], hi) > 0

  return (
    /* ONE ROW: the arrows are the strip's two ends, not a header above it.
       A "This week" line between two round buttons was 52px saying nothing
       the chips do not — reported as "a waste of space" (120px → 56px). */
    <section aria-label={label} className="day-strip grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))_1.75rem] gap-1">
      <button type="button" className="strip-arrow" aria-label="Previous week" disabled={!canBack} onClick={() => onChange(stepWeek(value, -1, min, hi))}>
        <Icon as={CaretLeft} size="sm" />
      </button>
      <div role="radiogroup" aria-label={label} className="col-span-7 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const dt = new Date(d + 'T00:00')
          const ok = inRange(d)
          return (
            <button key={d} type="button" role="radio" aria-checked={d === value} className="day-chip" disabled={!ok}
              data-today={d === today || undefined} onClick={() => onChange(d)}>
              <span className="text-micro text-fg-2">{WEEKDAYS[dt.getDay()]}</span>
              <span className="text-body font-bold leading-tight">{dt.getDate()}</span>
              <span className="text-micro leading-tight text-fg-2 tabular-nums">{ok ? mark(d) : <span aria-hidden>·</span>}</span>
            </button>
          )
        })}
      </div>
      <button type="button" className="strip-arrow" aria-label="Next week" disabled={!canOn} onClick={() => onChange(stepWeek(value, 1, min, hi))}>
        <Icon as={CaretRight} size="sm" />
      </button>
    </section>
  )
}
