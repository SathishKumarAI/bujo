import { Card } from '../ui'
import { EntryRow } from '../EntryRow'
import { prettyDay } from '../../lib/date'
import type { Entry } from '../../lib/types'

/**
 * Two reference lists side by side: what is coming, and what is worth keeping.
 *
 * The future log is dated ahead of today; memories are the ▲ bullets, gathered
 * automatically. They share a band because they are the same kind of thing —
 * read-only views over entries you filed elsewhere — and because each alone is
 * a half-empty column.
 */
/**
 * Two cards, not two `BandCell`s.
 *
 * The docstring above records why they shared a band: "each alone is a
 * half-empty column". That is a layout reason, not a subject reason — and
 * under a rail the grid decides the packing, so a card that would have been a
 * half-empty column is simply a card the grid makes narrower.
 */
export function FutureLogCard({ future }: { future: Entry[] }) {
  return (
    <Card band title="Future log" subtitle="Tasks and events dated ahead of today">
      {future.length === 0 ? (
        <p className="text-label text-fg-2">Nothing scheduled. Add a future-dated entry from any day.</p>
      ) : (
        <ul>
          {future.map((e) => (
            <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-3 border-t border-line py-2 text-label first:border-t-0">
              <span className="text-fg-3">{prettyDay(e.date)}</span>
              <span className="text-fg-1">
                <span aria-hidden className="mr-1.5 text-fg-3">{e.type === 'event' ? '○' : '·'}</span>
                {e.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function MemoriesCard({ memories }: { memories: Entry[] }) {
  return (
    <Card band title="Memories" subtitle="Every ▲ bullet, newest first">
      {memories.length === 0 ? (
        <p className="text-label text-pretty text-fg-2">Mark a bullet with ▲ (or capture with “^ …”) to start the reel.</p>
      ) : (
        <ul>
          {memories.map((e) => <EntryRow key={e.id} entry={e} />)}
        </ul>
      )}
    </Card>
  )
}
