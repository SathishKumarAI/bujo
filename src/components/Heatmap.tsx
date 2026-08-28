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

  // `fluid`: this grid owns a band cell, and at DayGrid's fixed 11px cell it
  // measured **384px inside 580px** on Stats — a third of the cell empty to its
  // right, with ~290px more below it before the next block. It is also the one
  // grid in the app whose window is user-controlled (3mo/6mo/1yr), so no fixed
  // cell size can be right for all three: at 1yr a fixed cell overflows and
  // scrolls, at 3mo it strands. Dividing the container handles every window.
  //
  // The legend keeps its fixed 11px swatches on purpose — it is a key, not the
  // data, and a legend whose swatches grow with the viewport reads as a chart.
  return (
    <div>
      <DayGrid days={days} fluid label={`Activity heatmap, ${days.length} days`} />
      <DayGridLegend />
    </div>
  )
}
