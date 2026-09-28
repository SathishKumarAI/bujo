import { Card } from '../ui'
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
export function StalledCard({ items }: { items: { book: Book; idleDays: number }[] }) {
  return (
    /* It used to `return null` when nothing was stalled, which is the one
       thing a rail cannot tolerate: a card that renders nothing makes its rail
       row's count a lie, and a group of one disappears entirely, leaving a
       heading over an empty grid. The contract says it anyway — a visual that
       vanishes until it has data is invisible to exactly the people who have
       not started. "Nothing stalled" is also the best news on this page and
       worth printing. */
    <Card band title="Stalled" subtitle={items.length ? `${items.length} not moving` : 'Started, and not moving'}>
      {items.length === 0 ? (
        <p className="py-2 text-label text-fg-2">Nothing stalled — every started book has moved in the last fortnight.</p>
      ) : (
        <ul>
          {items.map(({ book, idleDays }) => (
            <li key={book.id} className="flex items-center gap-4 border-t border-line py-2 text-label first:border-t-0">
              <span className="min-w-0 flex-1 truncate text-fg-1">{book.title}</span>
              <span className="num shrink-0 text-fg-2">{progressPct(book)}%</span>
              <span className="num shrink-0 text-fg-2">idle {idleDays}d</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
