import { useState, type ReactNode } from 'react'
import { useJournal } from '../store'
import { PageLayout, SectionRail, StatBar } from '../components/page'
import { CardGrid, SPAN_2 } from '../components/shell/CardGrid'
import { IndexCard } from '../components/collections/IndexBand'
import { InboxCard } from '../components/collections/InboxBand'
import { CollectionsCard } from '../components/collections/CustomCollections'
import { FutureLogCard, MemoriesCard } from '../components/collections/FutureAndMemories'
import { TagPagesCard } from '../components/collections/TagPages'
import { PeopleCard } from '../components/collections/People'
import { collectionBreakdown, inboxEntries, memoryBullets, tagIndex } from '../lib/bullets'
import {
  COLLECTIONS_CARDS, COLLECTIONS_DEFAULT_GROUP, COLLECTIONS_GROUPS,
  COLLECTIONS_GROUP_BLURB, COLLECTIONS_GROUP_LABEL, type CollectionsGroup,
} from '../lib/collectionsCards'
import { todayISO } from '../lib/date'

/**
 * COLLECTIONS · the journal's own pages — the Index, the inbox, your
 * collections, what is coming, what you tagged, and who you know.
 *
 * Six `mod/Band` sections in a fixed vertical order. `space-audit` read
 * **1.4 shipped / 1.5 open** at 1440 and **2.4 / 2.5** on a phone, with
 * **1 column** and **1 thin card** — the mildest of the three band pages by
 * the numbers, and the one with the clearest structural problem: **its first
 * band was an Index whose whole job was to jump you down to one of the bands
 * below it.** A page that needs a table of contents to navigate itself is a
 * page with no navigation.
 *
 * This is the last page on `components/mod/Band`, so this change retires the
 * primitive — the design world `DESIGN.md` declares anti-reference in its
 * first sentence is now gone from the app.
 *
 * ## The slot table
 *
 * | Zone | Holds |
 * |---|---|
 * | 1 · orient | Collections · tags · inbox · coming up |
 * | 2 · act | — |
 * | 3 · review | A rail over `index`, `inbox`, `pages`, `future`, `tags`, `people` |
 *
 * **There is no zone 2, and that is a statement rather than an omission.**
 * Every "act" on this page belongs to an object inside a card — name a
 * collection, add a bullet to one, save a contact — and the contract's act
 * zone is for *the one thing the page exists to do*. This page exists to be
 * read and navigated; lifting one of those six forms into a column beside the
 * rail would be picking a winner among equals. `PageLayout` renders a single
 * column when `zone2` is absent, which is the correct shape for a page whose
 * subject is a directory.
 *
 * **The Index survives and changed jobs.** The rail names six *sections*; the
 * Index names every individual collection and tag with its count, which is the
 * granularity a reader arrives with ("where did the reading-list page go").
 * What changed is what its links do: they used to `scrollIntoView` a band, and
 * they now select the rail row **and** open the item inside it. A jump link
 * that scrolls to a section the rail has hidden would land on nothing — the
 * kind of quiet breakage a restructure like this produces if the links are not
 * followed. `Collections.test.tsx` asserts both halves.
 */
export function Collections() {
  const { data, addCollection, removeCollection, addEntry } = useJournal()
  const [openCollection, setOpenCollection] = useState<string | null>(null)
  const [openTag, setOpenTag] = useState<string | null>(null)
  const [group, setGroup] = useState<CollectionsGroup>(COLLECTIONS_DEFAULT_GROUP)

  const today = todayISO()
  const tags = tagIndex(data.entries)
  const index = collectionBreakdown(data.entries, data.collections)
  const future = data.entries.filter((e) => e.date > today).sort((a, b) => (a.date < b.date ? -1 : 1))
  const inbox = inboxEntries(data.entries)

  const cards: Record<string, ReactNode> = {
    index: (
      <IndexCard
        collections={index}
        tags={tags.map((t) => ({ tag: t.tag, count: t.entries.length }))}
        /* Select the row, then open the item. The old version scrolled to a
           band; under a rail the target is not on screen to scroll to, so the
           jump has to move the rail first. */
        onOpenCollection={(id) => { setOpenCollection(id); setGroup('pages') }}
        onOpenTag={(tag) => { setOpenTag(tag); setGroup('tags') }}
      />
    ),
    inbox: <InboxCard entries={inbox} />,
    pages: (
      <CollectionsCard
        collections={data.collections}
        entries={data.entries}
        openId={openCollection}
        onOpen={setOpenCollection}
        onCreate={addCollection}
        onRemove={removeCollection}
        onAddEntry={(text, collectionId) => addEntry(today, text, collectionId)}
      />
    ),
    future: <FutureLogCard future={future} />,
    memories: <MemoriesCard memories={memoryBullets(data.entries)} />,
    tags: <TagPagesCard tags={tags} openTag={openTag} onOpen={setOpenTag} />,
    people: <PeopleCard />,
  }
  const shownIn = (g: CollectionsGroup) => COLLECTIONS_CARDS.filter((c) => c.group === g && cards[c.id])
  const shown = shownIn(group)

  return (
    <PageLayout
      tier={1180}
      zone1={
        <StatBar
          facts={[
            { label: 'Collections', value: data.collections.length },
            { label: 'Tags', value: tags.length },
            { label: 'Inbox', value: inbox.length },
            { label: 'Coming up', value: future.length },
          ]}
        />
      }
      zone3={
        <>
          {/* `@container/page` on the OUTER div and the grid on the inner one:
              an element cannot query itself. The phone column is spelled out
              because a grid with no `grid-template-columns` gets one implicit
              `auto` track sized to its widest item's min-content, and a chip
              row makes that wider than the viewport. Both in
              docs/PAGE-SHAPE.md. */}
          <div className="@container/page">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @2xl/page:grid-cols-[11rem_minmax(0,1fr)]">
              {/* No "All" row: the six groups do not overlap. */}
              <SectionRail
                label="Collections sections"
                groups={COLLECTIONS_GROUPS.map((g) => ({ id: g, label: COLLECTIONS_GROUP_LABEL[g], count: shownIn(g).length }))}
                value={group}
                onChange={(id) => setGroup((id as CollectionsGroup | null) ?? COLLECTIONS_DEFAULT_GROUP)}
              />
              <div className="min-w-0">
                <section data-domain={group}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="font-display text-heading font-medium text-fg-1">{COLLECTIONS_GROUP_LABEL[group]}</h2>
                    <p className="text-label text-fg-2">{COLLECTIONS_GROUP_BLURB[group]}</p>
                    <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                  </div>
                  <CardGrid className="2xl:grid-cols-2">
                    {shown.map((c) => (
                      <div key={c.id} data-card={c.id} className={c.wide ? `min-w-0 ${SPAN_2}` : 'min-w-0'}>
                        {cards[c.id]}
                      </div>
                    ))}
                  </CardGrid>
                </section>
              </div>
            </div>
          </div>
        </>
      }
    />
  )
}
