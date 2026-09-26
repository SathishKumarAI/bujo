import { cat } from '../../lib/colors'
import type { CyclePoint } from '../../lib/types'
import { FLAGS, FLAG_COLOR } from './flags'

/**
 * The month as a readable list — and now as a heatmap of where the period
 * fell, which is the one question a cycle calendar exists to answer from
 * across the room.
 *
 * Split into two columns at 1–15 / 16–end on purpose: one 31-row column makes
 * the reader scroll to compare the start of the month with the end of it, and
 * a whole cycle's shape (bleeding early, PMS late) is exactly that comparison.
 *
 * Each row also carries its **cycle day**, which the month view could not show
 * before. "The 14th" is a calendar fact; "day 9" is the one that means
 * something here, and the two drift apart every month by construction.
 */
export function MonthList({ days, entries, selected, today, cycleDayOf, onSelect }: {
  days: string[]
  entries: CyclePoint[]
  selected: string
  today: string
  /** 1-based cycle day for an ISO date, or null before the first period. */
  cycleDayOf: (date: string) => number | null
  onSelect: (date: string) => void
}) {
  const row = (d: string) => {
    const c = entries.find((x) => x.date === d)
    const isToday = d === today
    const isSel = d === selected
    const isPeriod = (c?.flags ?? []).includes('period')
    const cd = cycleDayOf(d)
    return (
      <li key={d}>
        <button
          onClick={() => onSelect(d)}
          aria-current={isToday ? 'date' : undefined}
          className="flex w-full items-center gap-3 border-b border-line px-2 py-1.5 text-left text-label hover:bg-ink-2"
          style={isSel ? { background: cat('mauve') + '22' } : isPeriod ? { background: cat('red') + '22' } : undefined}
        >
          <span className={`w-6 num ${isToday ? 'font-medium text-fg-1' : 'text-fg-2'}`}>{Number(d.slice(8))}</span>
          <span className="num w-10 text-fg-3" title={cd != null ? `Cycle day ${cd}` : undefined}>
            {cd != null ? `d${cd}` : ''}
          </span>
          <span className="num w-14 text-fg-1">{c?.temp != null ? `${c.temp}°` : ''}</span>
          <span className="flex items-center gap-1">
            {FLAGS.filter((f) => (c?.flags ?? []).includes(f)).map((f) => (
              <span key={f}>
                <span aria-hidden className="inline-block h-2 w-2 rounded-[2px]" style={{ background: cat(FLAG_COLOR[f]) }} />
                <span className="sr-only">{f}</span>
              </span>
            ))}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      <div>
        <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">Days 1–15</p>
        <ul>{days.slice(0, 15).map(row)}</ul>
      </div>
      <div>
        <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">Days 16–{days.length}</p>
        <ul>{days.slice(15).map(row)}</ul>
      </div>
    </div>
  )
}
