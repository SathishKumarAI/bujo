import { Band, BandCell, BandRow } from '../mod'
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
export function FutureAndMemories({ future, memories }: { future: Entry[]; memories: Entry[] }) {
  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[22rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Future log</h2>
          <p className="mt-1 mb-3 text-label text-fg-2">Tasks and events dated ahead of today.</p>
          {future.length === 0 ? (
            <p className="text-label text-fg-3">Nothing scheduled. Add a future-dated entry from any day.</p>
          ) : (
            <ul>
              {future.map((e) => (
                <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-3 border-t border-line py-2 text-label">
                  <span className="text-fg-3">{prettyDay(e.date)}</span>
                  <span className="text-fg-1">
                    <span aria-hidden className="mr-1.5 text-fg-3">{e.type === 'event' ? '○' : '·'}</span>
                    {e.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </BandCell>

        <BandCell className="basis-[22rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Memories</h2>
          <p className="mt-1 mb-3 text-label text-fg-2">Every ▲ bullet, newest first.</p>
          {memories.length === 0 ? (
            <p className="text-label text-fg-3">Mark a bullet with ▲ (or capture with “^ …”) to start the reel.</p>
          ) : (
            <ul className="border-t border-line">
              {memories.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
