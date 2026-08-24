import { useState } from 'react'
import { useJournal } from '../store'
import { Page } from '../components/shell/Page'
import { IndexBand } from '../components/collections/IndexBand'
import { InboxBand } from '../components/collections/InboxBand'
import { CustomCollections } from '../components/collections/CustomCollections'
import { FutureAndMemories } from '../components/collections/FutureAndMemories'
import { TagPages } from '../components/collections/TagPages'
import { People } from '../components/collections/People'
import { collectionBreakdown, inboxEntries, memoryBullets, tagIndex } from '../lib/bullets'
import { todayISO } from '../lib/date'

/**
 * Collections — the journal's own pages: the Index, the inbox, your collections,
 * what is coming, what you tagged, and who you know.
 *
 * Composition and cross-band state only. Two pieces of state live here rather
 * than in a band because the Index jumps *into* another band: which collection
 * is open, and which tag is open.
 *
 * The People and Auto-pages sections used to be collapsed folds. They are bands
 * now — `npm run a11y` walks the rendered page, so a fold is also a section
 * that never gets scanned, and this page had two of them.
 */
export function Collections() {
  const { data, addCollection, removeCollection, addEntry } = useJournal()
  const [openCollection, setOpenCollection] = useState<string | null>(null)
  const [openTag, setOpenTag] = useState<string | null>(null)

  const today = todayISO()
  const tags = tagIndex(data.entries)
  const index = collectionBreakdown(data.entries, data.collections)
  const future = data.entries.filter((e) => e.date > today).sort((a, b) => (a.date < b.date ? -1 : 1))

  const scrollTo = (id: string) =>
    // Deferred a frame: the target band may have just been given content by the
    // same click (an opened collection), and scrolling to it before React has
    // laid it out lands short of it.
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      <IndexBand
        collections={index}
        tags={tags.map((t) => ({ tag: t.tag, count: t.entries.length }))}
        onOpenCollection={(id) => {
          setOpenCollection(id)
          scrollTo('bujo-collections')
        }}
        onOpenTag={(tag) => {
          setOpenTag(tag)
          scrollTo('bujo-tags')
        }}
      />

      <InboxBand entries={inboxEntries(data.entries)} />

      <CustomCollections
        collections={data.collections}
        entries={data.entries}
        openId={openCollection}
        onOpen={setOpenCollection}
        onCreate={addCollection}
        onRemove={removeCollection}
        onAddEntry={(text, collectionId) => addEntry(today, text, collectionId)}
      />

      <FutureAndMemories future={future} memories={memoryBullets(data.entries)} />

      <TagPages tags={tags} openTag={openTag} onOpen={setOpenTag} />

      <People />
    </Page>
  )
}
