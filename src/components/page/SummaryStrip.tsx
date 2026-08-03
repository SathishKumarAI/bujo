import type { ReactNode } from 'react'
import { CountUp } from '../ui/ring'

export interface SummaryItem {
  label: string
  /** Pass a number to get the count-up transition; strings render as-is. */
  value: ReactNode | number
  /** No data yet. Renders "—", never "0". */
  empty?: boolean
  suffix?: string
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
          <div className="mt-0.5 text-micro text-fg-2">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
