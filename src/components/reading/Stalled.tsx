import { Band, Eyebrow } from '../mod'
import { progressPct } from '../../lib/reading'
import type { Book } from '../../lib/types'

/**
 * Books on the Reading shelf that have not moved in a while.
 *
 * A nudge, not a chart: it sits directly under the shelves because the fix is
 * one row up — pick it back up, or move it to Want. Renders nothing when
 * nothing is stalled, which is the one case where an empty frame would be
 * worse than absence: an always-present "Stalled (0)" trains you to ignore it.
 */
export function Stalled({ items }: { items: { book: Book; idleDays: number }[] }) {
  if (items.length === 0) return null

  return (
    <Band className="py-5">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-heading font-medium text-fg-1">Stalled</h2>
        <Eyebrow className="tracking-[0.1em]">{items.length} not moving</Eyebrow>
      </div>
      <ul className="mt-3">
        {items.map(({ book, idleDays }) => (
          <li key={book.id} className="flex items-center gap-4 border-t border-line py-2 text-label">
            <span className="min-w-0 flex-1 truncate text-fg-1">{book.title}</span>
            <span className="num shrink-0 text-fg-2">{progressPct(book)}%</span>
            <span className="num shrink-0 text-fg-2">idle {idleDays}d</span>
          </li>
        ))}
      </ul>
    </Band>
  )
}
