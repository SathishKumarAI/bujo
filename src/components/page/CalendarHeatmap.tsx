import { useMemo } from 'react'
import { DayGrid, type DayCell } from '../ui/day-grid'
import { addDays, fromISODay, prettyDay, todayISO } from '../../lib/date'
import { quartileLevels } from '../../lib/viz'
import { useStickyState } from '../../lib/useStickyState'
import { Segmented } from '../ui'

export interface HeatDatum {
  date: string
  value: number
}

/**
 * Zone 3's signature visual: N weeks of training days, one cell per day.
 *
 * Two things distinguish it from the grids it replaces.
 *
 * It renders its FRAME AT ZERO DATA. The old cards returned `null` when nothing
 * had been logged, so a new user could not see that the page even had a
 * training calendar — the feature was invisible until it was populated, which
 * is exactly backwards. An empty grid says "this is where your history will
 * be" and is worth more than the space it costs.
 *
 * And its intensity is QUARTILE-BUCKETED over the trailing window's non-zero
 * days, not scaled against the maximum. See `quartileLevels` for why: one long
 * ride otherwise flattens every other day to the lightest step.
 */
export function CalendarHeatmap({
  weeks = 12,
  data,
  label,
  unit = '',
  today = todayISO(),
  size,
  fluid = false,
  color = 'mauve',
  ranges = false,
  storageKey,
}: {
  weeks?: number
  data: HeatDatum[]
  /** Sentence describing the grid as a whole, for the table caption. */
  label?: string
  /** Appended to each cell's spoken value, e.g. "min". */
  unit?: string
  today?: string
  /** Cell edge in px. Defaults to `DayGrid`'s 11 — the Body cluster's size,
   *  which is tuned for a grid sharing its column with a form. A band that
   *  gives the grid a column of its own (Mindset) passes a larger cell rather
   *  than leaving 300px of empty space beside a postage stamp. */
  size?: number
  /** Divide the container's width instead of taking `size` px — see `DayGrid`.
   *  Use it wherever the grid has a column to itself; `size` cannot be right at
   *  both a 708px review column and a 358px phone, and this needs no number. */
  fluid?: boolean
  /**
   * Palette name for filled cells. `mauve` (the app's accent) is right while a
   * filled cell means *you showed up* — every caller before Recovery.
   *
   * It is wrong when a filled cell means the opposite. Recovery's per-addiction
   * calendar fills a day because the thing happened, so it draws `red` — the
   * hue `RiskiestDaysCard` and `LapseCountCard` already use for a lapse on this
   * page. A mauve grid there would read as a record of good days.
   *
   * One hue with a four-step intensity ramp either way: sequential, never
   * categorical. Nothing here colours a series by which addiction it is.
   */
  color?: string
  /**
   * Offer a range switch, and open on THIS MONTH.
   *
   * ── Why the default shrank ─────────────────────────────────────────────
   *
   * Call sites asked for 26 and 53 weeks. On Fitness that drew half a year of
   * cells of which eight were filled — a grid that is overwhelmingly empty
   * does not read as "you rested", it reads as a page that failed to load,
   * and it spends the most horizontal space on the page to say the least.
   *
   * Reported directly: *"why should I focus on yearly? I want to focus on
   * this month and this week."* That is also the right instinct — a month is
   * the window you can still act on, and the year answers a different
   * question ("is this a habit yet") that you ask occasionally rather than
   * every time you open the page.
   *
   * `storageKey` persists the choice, so someone who does want the year gets
   * the year every visit instead of re-picking it.
   */
  ranges?: boolean
  /** Where the chosen range is remembered. Give each grid its own. */
  storageKey?: string
}) {
  /**
   * Weeks per range.
   *
   * A "month" is 5 weeks, not 4: the grid winds back to the Sunday on or
   * before the window, so four weeks of columns can show as few as 22 days
   * once that alignment is paid for. Five always covers a calendar month.
   * "Week" is 2, for the same reason — a single column is a stripe, not a
   * grid, and you want last week beside this one to see a change.
   */
  const RANGE_WEEKS = { week: 2, month: 5, year: 53 } as const
  type Range = keyof typeof RANGE_WEEKS
  const [range, setRange] = useStickyState<Range>(
    `heat.range.${storageKey ?? 'default'}`,
    'month',
    ['week', 'month', 'year'] as const,
  )
  // With `ranges` off the caller still owns the window, so every existing call
  // site renders exactly as it did until it opts in.
  const shownWeeks = ranges ? RANGE_WEEKS[range] : weeks

  const days = useMemo<DayCell[]>(() => {
    const byDate = new Map<string, number>()
    for (const d of data) byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.value)

    // Wind back to the Sunday on or before the start of the window, so every
    // column is a whole week and the weekday rows line up.
    const start = addDays(today, -(shownWeeks * 7 - 1))
    const gridStart = addDays(start, -fromISODay(start).getDay())

    const dates: string[] = []
    for (let i = 0; ; i++) {
      const date = addDays(gridStart, i)
      if (date > today) break
      dates.push(date)
    }

    const level = quartileLevels(dates.map((d) => byDate.get(d) ?? 0))
    return dates.map((date) => {
      const value = byDate.get(date) ?? 0
      return {
        date,
        level: level(value),
        title: value > 0 ? `${prettyDay(date)}: ${round(value)}${unit && ` ${unit}`}` : `${prettyDay(date)}: rest day`,
        // The spoken label carries the actual number. Colour alone never
        // conveys the data — that is the whole reason the grid is a table.
        srLabel: value > 0 ? `${prettyDay(date)}: ${round(value)}${unit && ` ${unit}`}` : `${prettyDay(date)}: rest day`,
      }
    })
  }, [data, shownWeeks, today, unit])

  const trained = days.filter((d) => d.level > 0).length

  const grid = (
    // Focusable, because it scrolls. A `overflow-x-auto` box that no control
    // inside can be tabbed to is unreachable by keyboard — axe `serious:
    // scrollable-region-focusable`, and true: the grid is a table of static
    // cells, so without this the right-hand weeks simply cannot be reached
    // without a mouse. It only overflowed once Mindset asked for a larger cell,
    // which is how a phone-width scan caught a primitive that had shipped for
    // months.
    //
    // A `fluid` grid cannot overflow — its cells divide whatever width it is
    // given — so it is neither scrollable nor a tab stop. Leaving `tabIndex={0}`
    // on it would put a focus stop on a static table between the summary and
    // the next control, which is the cost the rule above is paying to avoid.
    <div
      className={fluid ? undefined : 'overflow-x-auto'}
      tabIndex={fluid ? undefined : 0}
      role="group"
      aria-label={label ?? 'Activity grid'}
    >
      <DayGrid
        days={days}
        size={size}
        fluid={fluid}
        months
        color={color}
        label={label ?? `Training calendar: ${trained} active ${trained === 1 ? 'day' : 'days'} in the last ${shownWeeks} weeks`}
      />
    </div>
  )

  // No switch means no wrapper: a caller that has not opted in renders exactly
  // the markup it did before, so the `fluid` width maths that divides the
  // container is untouched.
  if (!ranges) return grid

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Segmented
          tone="neutral"
          value={range}
          onChange={setRange}
          options={[
            { value: 'week' as Range, label: 'Week' },
            { value: 'month' as Range, label: 'Month' },
            { value: 'year' as Range, label: 'Year' },
          ]}
        />
      </div>
      {grid}
    </div>
  )
}

const round = (v: number) => Math.round(v * 10) / 10
