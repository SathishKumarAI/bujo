import type { ReactNode } from 'react'
import { CountUp } from '../ui/ring'
import { Track, Spark, Ramp } from '../ui/Stat'

export interface SummaryItem {
  label: string
  /** Pass a number to get the count-up transition; strings render as-is. */
  value: ReactNode | number
  /** No data yet. Renders "—", never "0". */
  empty?: boolean
  suffix?: string
  /**
   * ── The three optional ranges, and why they are optional ────────────────
   *
   * Supplying one of these is what earns the tile a shape. Supplying none
   * leaves it exactly as it was, which is why all twelve existing call sites
   * kept working unchanged when this landed.
   *
   * The rule, from `ui/Stat.tsx`: **a number gets a shape when it has a range,
   * and not otherwise.** Decoration on a figure with nothing to compare
   * against is worse than plain text — it implies a scale the reader then
   * tries to read off.
   */
  /** A target or a total. Earns a track, which can overflow past its end. */
  of?: number | null
  /** A series. Earns a sparkline. Nulls in it are gaps, not zeros. */
  history?: readonly (number | null)[]
  /** A run of day states. Earns a ramp. */
  ramp?: readonly boolean[]
  /** Token name for the encoding. The figure stays neutral; the shape carries the hue. */
  tone?: 'mauve' | 'blue' | 'green' | 'peach' | 'red' | 'teal' | 'yellow' | 'pink' | 'fg-2'
}

/**
 * Zone 3's opening line: exactly three tiles, inset surface, no border.
 *
 * Not a `StatTile` row. `StatTile` is a bordered box that takes a per-tile
 * colour, and a row of six in six different hues is precisely the accent
 * violation the contract removes. These are one neutral surface, one type
 * treatment, three facts.
 *
 * Empty renders "—", not "0". Zero is a measurement — it says you trained and
 * covered no distance. An em dash says nobody has told us yet. Printing "0"
 * for the second is a small lie that makes an empty page look like a bad week.
 *
 * ── Why the encodings live HERE rather than in twelve views ───────────────
 *
 * Measured across 14 views: **1,414 numbers printed as text against 98 visual
 * encodings, 14.43 to 1**, with five views encoding nothing at all. This
 * component had twelve call sites and printed every one of them as a bare
 * figure, so it was both the largest single contributor to that ratio and the
 * cheapest place to move it. A view opts in by passing a range it already has
 * in hand; nothing else changes.
 *
 * The tile keeps one neutral type treatment and gains at most one shape. That
 * restraint is the same reason this was never a `StatTile` row: a row of six
 * figures in six hues is the accent violation the page contract removes, and
 * a row of six *shapes* would be the same mistake with more ink.
 */
export function SummaryStrip({ items }: { items: [SummaryItem, SummaryItem, SummaryItem] | SummaryItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.slice(0, 3).map((it) => (
        <div key={it.label} className="rounded-card bg-ink-2 px-3 py-2.5 text-center">
          <div className="num text-heading font-medium text-fg-1">
            {it.empty ? (
              <span className="text-fg-2">—</span>
            ) : typeof it.value === 'number' ? (
              <CountUp value={it.value} decimals={Number.isInteger(it.value) ? 0 : 1} suffix={it.suffix ?? ''} />
            ) : (
              it.value
            )}
          </div>
          {/* At most one shape, chosen by what the caller could supply. A
              target beats a trend because "where do I stand" is the question a
              summary tile is asked; the trend elaborates and can live in the
              card below. Empty tiles draw nothing — an encoding of no data is
              a drawing of a scale that does not exist. */}
          {!it.empty && (
            it.of != null && it.of > 0 && typeof it.value === 'number' ? (
              <div className="mt-1.5"><Track value={it.value} max={it.of} tone={it.tone} height={5} /></div>
            ) : it.ramp && it.ramp.length > 0 ? (
              <div className="mt-1.5"><Ramp days={it.ramp} tone={it.tone} height={7} /></div>
            ) : it.history && it.history.length > 1 ? (
              <div className="mt-1.5"><Spark values={it.history} tone={it.tone} height={18} /></div>
            ) : null
          )}
          <div className="mt-0.5 text-micro text-fg-2">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
