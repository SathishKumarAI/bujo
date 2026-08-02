import type { HeatCell } from '../lib/viz'
import { prettyDay } from '../lib/date'
import { DayGrid, DayGridLegend, type DayCell } from './ui/day-grid'

/**
 * GitHub-style activity grid. Columns are weeks, rows are weekdays.
 *
 * A thin adapter over the shared `DayGrid` primitive: this file turns
 * `HeatCell[][]` into day cells and owns the legend. The grid, intensity ramp
 * and sizing now live in one place with the Trackers per-habit heatmap.
 *
 * `buildHeatmap` already starts its first column on a Sunday, so the columns
 * flatten straight into the grid with no padding.
 *
 * (The old `colorFor` escape hatch is gone — it had no call site, and keeping
 * it meant the adapter had to invent a `count` to satisfy the signature.)
 */
export function Heatmap({ cols }: { cols: HeatCell[][] }) {
  const days: DayCell[] = cols.flat().map((c) => ({
    date: c.date,
    level: c.level,
    title: `${prettyDay(c.date)}, ${c.count} item${c.count === 1 ? '' : 's'}`,
  }))

  return (
    <div className="overflow-x-auto">
      <DayGrid days={days} label={`Activity heatmap, ${days.length} days`} />
      <DayGridLegend />
    </div>
  )
}
