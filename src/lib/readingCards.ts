/**
 * WHAT THE READING PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Reading was six `mod/Band` sections in a fixed vertical order — the same
 * shape as Mindset, one third the length. `space-audit` read **1.7 shipped /
 * 1.9 open** at 1440 and **3.1 / 3.9** on a phone, `page-census` read
 * `3 folds · 0 charts · 1 column` at 1440: one column on a 1440 screen, so the
 * year's chart was reached by scrolling past all three shelves.
 *
 * It was also, with Collections, the last place `components/mod/Band` lived —
 * "2px between sections, 1px between cells, zero radius, no surface fill",
 * which `DESIGN.md` declares anti-reference in its first sentence.
 *
 * A group is what a card answers, not which file it came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `shelves` | what do I have, and where is each book up to |
 * | `year` | how has the year gone |
 * | `stalled` | what have I stopped reading without deciding to |
 * | `notes` | what did I take from it, and what have I saved to read |
 *
 * **Each shelf is its own card, not one "Shelves" card with three columns.**
 * The three were `BandCell`s in a row, which is the Modernist grid deciding
 * the layout rather than the content: a shelf is a list with its own count and
 * its own emptiness, and three of them in one box share a scroll and a
 * heading they do not share a subject with. As separate cards the grid packs
 * them at whatever width there is, and an empty shelf says so in its own frame
 * instead of leaving a third of a card blank.
 *
 * **No "All" row.** The four groups do not overlap and there is no page-wide
 * search to cross them.
 */
export const READING_GROUPS = ['shelves', 'year', 'stalled', 'notes'] as const
export type ReadingGroup = (typeof READING_GROUPS)[number]

export const READING_GROUP_LABEL: Record<ReadingGroup, string> = {
  shelves: 'Shelves',
  year: 'This year',
  stalled: 'Stalled',
  notes: 'Notes & links',
}

export const READING_GROUP_BLURB: Record<ReadingGroup, string> = {
  shelves: 'Reading, want to read, finished',
  year: 'What you finished, and what it added up to',
  stalled: 'Started, and not moving',
  notes: 'What you took from a book, and what you saved to read',
}

export interface ReadingCardMeta {
  id: string
  title: string
  group: ReadingGroup
  /** Takes the full row of the grid — charts and the scrolling feed. */
  wide?: boolean
}

/**
 * One row per card in the review zone.
 *
 * **`stalled` and `learnings` used to return `null`**, and under a rail that
 * is no longer a cosmetic choice — a card that renders nothing makes its rail
 * row's count a lie, and a group of one can disappear entirely, leaving a
 * heading over an empty grid. Both render an empty frame now, which is the
 * contract's rule anyway: "a visual that disappears until it has data is
 * invisible to exactly the people who have not started".
 */
export const READING_CARDS: ReadingCardMeta[] = [
  { id: 'shelf-reading', title: 'Reading', group: 'shelves' },
  { id: 'shelf-want', title: 'Want to read', group: 'shelves' },
  { id: 'shelf-finished', title: 'Finished', group: 'shelves' },

  { id: 'bymonth', title: 'Finished by month', group: 'year', wide: true },
  { id: 'wrapped', title: 'The year in books', group: 'year', wide: true },

  { id: 'stalled', title: 'Stalled', group: 'stalled', wide: true },

  { id: 'learnings', title: 'Learnings', group: 'notes', wide: true },
  { id: 'later', title: 'Read later', group: 'notes', wide: true },
]

/**
 * The group the page opens on.
 *
 * `shelves` is the page's subject — what you have and where each book is up
 * to. `year` is the more impressive landing and it answers a question you ask
 * in December.
 */
export const READING_DEFAULT_GROUP: ReadingGroup = 'shelves'
