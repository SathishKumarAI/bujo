import { Card } from '../ui'
import { EntryRow } from '../EntryRow'
import type { Entry } from '../../lib/types'

/**
 * The brain-dump inbox: entries captured with no day and no collection.
 *
 * Owns the triage list. `EntryRow` owns an entry — it is the same row the
 * journal uses everywhere else, deliberately: an entry should not look like a
 * different kind of object depending on which page you found it on.
 */
export function InboxCard({ entries }: { entries: Entry[] }) {
  return (
    /* The count moved into the card's subtitle and lost its
       `tracking-[0.1em]`. `mod/Eyebrow` retired the letter-spaced micro label
       as "the house style of a 2015 analytics dashboard"; four call sites in
       this cluster had typed the tracking back in by hand. A style rule each
       author must retype is one that gets forgotten. */
    <Card band subtitle={`${entries.length} dateless ${entries.length === 1 ? 'item' : 'items'}`}>
      {entries.length === 0 ? (
        <p className="text-label text-fg-2">Nothing dateless waiting. Rapid-captured items with no day land here.</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </Card>
  )
}
