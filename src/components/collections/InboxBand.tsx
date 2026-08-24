import { Band, Eyebrow } from '../mod'
import { EntryRow } from '../EntryRow'
import type { Entry } from '../../lib/types'

/**
 * The brain-dump inbox: entries captured with no day and no collection.
 *
 * Owns the triage list. `EntryRow` owns an entry — it is the same row the
 * journal uses everywhere else, deliberately: an entry should not look like a
 * different kind of object depending on which page you found it on.
 */
export function InboxBand({ entries }: { entries: Entry[] }) {
  return (
    <Band className="py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-heading font-medium text-fg-1">Inbox</h2>
        <Eyebrow className="tracking-[0.1em]">
          {entries.length} dateless {entries.length === 1 ? 'item' : 'items'}
        </Eyebrow>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-label text-fg-2">Nothing dateless waiting. Rapid-captured items with no day land here.</p>
      ) : (
        <ul className="mt-3 border-t border-line">
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </Band>
  )
}
