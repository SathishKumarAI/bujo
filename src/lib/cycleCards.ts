/**
 * WHAT THE CYCLE PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Zone 3 was ten things in four shapes: an unlabelled `CardGrid` of four, two
 * loose full-width cards, and a "Guide" shelf of **four `CollapsibleSection`s
 * that all shipped closed**. Measured on `main`: `page-census` said `cycle
 * folds 4 · open 0` where the modernised Insights says `folds 0`, and
 * `space-audit` said **4.4 screens shipped / 10.6 open** on a phone — a
 * 6.2-screen gap, i.e. content that exists on the page and is not on the page.
 * COD-230 is open on exactly that.
 *
 * So the four fold titles become four rail rows, the same move #270 made on
 * Insights and Coaching made on its manual. A group is what a card is *about*:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `cycle` | where am I, and is this cycle like the last few |
 * | `fertility` | when is the window, and did the temperature confirm it |
 * | `patterns` | what tends to happen to me, and on which cycle day |
 * | `guide` | the reference shelf — phases, food, technique, what to log |
 *
 * Kept as data rather than as a prop on each card so the count is countable
 * and so `views/Cycle.test.tsx` can assert the rendered `data-card` set equals
 * this list **in both directions**. That test is the whole reason the registry
 * is worth having: on Insights five habit grids rendered with no card id, so
 * nothing could filter, find or count them, and `views/Pullups.tsx` lost
 * eleven workout formats to a pass that retyped a data module instead of
 * moving it — with `tsc`, eslint, vitest and the build all green.
 *
 * **No `words` field and no search box, unlike `insightsFilter.ts`.** Insights
 * has twenty-four cards and a journal search already in its act zone, so a
 * query that crosses domains earns its place there. Ten cards behind four
 * named rows do not need one, and a `words` column nothing reads is the
 * dead-data trap this file's own docstring warns about one paragraph up.
 * Coaching's rail is the precedent: same component, no search, no "All" row.
 *
 * **No "All" row either**, for the same reason Coaching omits it — the groups
 * do not overlap and there is no query to cross them, so "All" would only
 * offer the 10.6-screen page this replaces.
 */
export const CYCLE_GROUPS = ['cycle', 'fertility', 'patterns', 'guide'] as const
export type CycleGroup = (typeof CYCLE_GROUPS)[number]

export const GROUP_LABEL: Record<CycleGroup, string> = {
  cycle: 'This cycle',
  fertility: 'Fertility',
  patterns: 'Patterns',
  guide: 'Guide',
}

/** One line per group, shown under its heading. The rail rows say the same words. */
export const GROUP_BLURB: Record<CycleGroup, string> = {
  cycle: 'Where you are, and how this cycle compares to the last few',
  fertility: 'The window, the two signals, and the shift that confirms it',
  patterns: 'What tends to happen, and on which cycle day',
  guide: 'Phases, food, technique, and what each flag buys you',
}

export interface CycleCardMeta {
  id: string
  /** The card's own title, so a drifted heading is visible in one file. */
  title: string
  group: CycleGroup
  /**
   * Takes the whole row (`SPAN_2`) instead of one column.
   *
   * Here and not on the card, because **the grid item is the `data-card`
   * wrapper**, not the `Card` inside it — a span class on the card itself
   * resolves against nothing and does nothing, measured: the temperature chart
   * and the symptom grid both still came out 351px in a 722px zone. The four
   * that need the row are the two that had the full page width before the rail
   * (the chart plots ~30 cycle days; `SymptomPattern`'s grid carries a computed
   * `minWidth` of `96 + days * 15`) and the two guide cards that are a
   * two-column grid and a block of prose.
   */
  wide?: true
}

/**
 * The review zone, in render order within each group.
 *
 * `guide` is one row rather than four, which was the conservative of the two
 * calls available: four rail rows of static reference would push the three
 * rows about *your own log* below the fold of the rail itself on a phone. The
 * alternative — `bbtrules` moved next to the temperature chart it makes
 * readable, in `fertility` — is the better product argument and is a separate
 * decision, because it moves content between subjects rather than changing how
 * it is reached.
 */
export const CYCLE_CARDS: CycleCardMeta[] = [
  { id: 'wheel', title: 'Where you are', group: 'cycle' },
  { id: 'length', title: 'Cycle length', group: 'cycle' },

  { id: 'fertile', title: 'Ovulation & the fertile window', group: 'fertility' },
  { id: 'bbt', title: 'Basal temperature', group: 'fertility', wide: true },

  { id: 'symptoms', title: 'Symptom pattern', group: 'patterns', wide: true },
  { id: 'drive', title: 'Drive by phase', group: 'patterns' },

  { id: 'phases', title: 'The four phases', group: 'guide', wide: true },
  { id: 'food', title: 'Cravings & food, phase by phase', group: 'guide', wide: true },
  { id: 'bbtrules', title: 'Basal temperature, done right', group: 'guide' },
  { id: 'logging', title: 'What to log & why', group: 'guide' },
]

/**
 * The group the page opens on.
 *
 * Not the first row for its own sake and not the biggest: `cycle` is what
 * someone opens this page for once the day editor in zone 2 is dealt with —
 * "where am I in this cycle" is the same question zone 1 answers in four
 * numbers, and the wheel is its picture. `guide` is reading matter and would
 * be landing on the manual.
 */
export const DEFAULT_GROUP: CycleGroup = 'cycle'
