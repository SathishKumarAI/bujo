/**
 * WHAT THE COLLECTIONS PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Collections was six `mod/Band` sections in a fixed vertical order.
 * `space-audit` read **1.4 shipped / 1.5 open** at 1440 and **2.4 / 2.5** on a
 * phone with **1 column** and **1 thin card** — the mildest of the three band
 * pages by the numbers, and the one with the clearest structural problem: its
 * first band was an *Index* whose entire job was to jump you down to one of
 * the bands below it.
 *
 * A page that needs a table of contents to navigate itself is a page with no
 * navigation. That is what a rail is, so the Index changed jobs rather than
 * being deleted — see below.
 *
 * This is the last page on `components/mod/Band`, so this change retires the
 * primitive: "2px between sections, 1px between cells, zero radius, no surface
 * fill", which `DESIGN.md` declares anti-reference in its first sentence.
 *
 * A group is what a card answers, not which file it came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `index` | what is in this journal, and how much of it |
 * | `inbox` | what did I capture without filing |
 * | `pages` | my own collection pages |
 * | `future` | what is coming, and what is worth keeping |
 * | `tags` | what did I tag, and what is under each tag |
 * | `people` | who do I know |
 *
 * **The Index survives and it is not redundant.** The rail names six
 * *sections*; the Index names every individual collection and tag with its
 * count. Different granularity, and the one a reader actually arrives with
 * ("where did the reading-list page go"). What changed is what its links do:
 * they used to `scrollIntoView` a band, and now they select the rail row AND
 * open the item inside it. A jump link that scrolls to a section a rail has
 * hidden would land on nothing, which is the kind of quiet breakage a
 * restructure like this produces if the links are not followed.
 *
 * **No "All" row.** The six groups do not overlap.
 */
export const COLLECTIONS_GROUPS = ['index', 'inbox', 'pages', 'future', 'tags', 'people'] as const
export type CollectionsGroup = (typeof COLLECTIONS_GROUPS)[number]

export const COLLECTIONS_GROUP_LABEL: Record<CollectionsGroup, string> = {
  index: 'Index',
  inbox: 'Inbox',
  pages: 'Collections',
  future: 'Future & memories',
  tags: 'Tags',
  people: 'People',
}

export const COLLECTIONS_GROUP_BLURB: Record<CollectionsGroup, string> = {
  index: "The journal's table of contents",
  inbox: 'Captured with no date, waiting to be filed',
  pages: 'Your own pages — lists, logs, anything',
  future: 'Dated ahead of today, and every ▲ bullet',
  tags: 'Every tag, and what is under it',
  people: 'Friends and contacts',
}

export interface CollectionsCardMeta {
  id: string
  title: string
  group: CollectionsGroup
  wide?: boolean
}

/**
 * One row per card in the review zone.
 *
 * `future` and `memories` were two `BandCell`s in one band, put there because
 * "each alone is a half-empty column" — a layout reason, not a subject reason.
 * Under a rail the grid decides the packing, so they are two cards and the
 * half-empty-column problem does not arise.
 */
export const COLLECTIONS_CARDS: CollectionsCardMeta[] = [
  { id: 'index', title: 'Index', group: 'index', wide: true },
  { id: 'inbox', title: 'Inbox', group: 'inbox', wide: true },
  { id: 'pages', title: 'Collections', group: 'pages', wide: true },
  { id: 'future', title: 'Future log', group: 'future' },
  { id: 'memories', title: 'Memories', group: 'future' },
  { id: 'tags', title: 'Tag pages', group: 'tags', wide: true },
  { id: 'people', title: 'People', group: 'people', wide: true },
]

/**
 * The group the page opens on.
 *
 * `index` — because it is the one card that tells you what the other five
 * hold, and because that is what it was doing at the top of the old page. The
 * difference is that it is now one row among six rather than a wall you scroll
 * past.
 */
export const COLLECTIONS_DEFAULT_GROUP: CollectionsGroup = 'index'
