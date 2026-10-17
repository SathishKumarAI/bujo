import { CYCLE_MANUAL } from './cycleManual'
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
export const CYCLE_GROUPS = ['cycle', 'feelings', 'fertility', 'patterns', 'log', 'guide', 'manual'] as const
export type CycleGroup = (typeof CYCLE_GROUPS)[number]

export const GROUP_LABEL: Record<CycleGroup, string> = {
  cycle: 'This cycle',
  feelings: 'How you feel',
  fertility: 'Fertility',
  patterns: 'Patterns',
  log: 'Your log',
  guide: 'Guide',
  manual: 'Manual',
}

/**
 * One line per group, shown under its heading. The rail rows say the label;
 * this says what is in the row.
 *
 * Rewritten with the subtitles (COD-337). The old set described the SUBJECT
 * in the abstract — "Where you are, and how this cycle compares to the last
 * few" — which is a table of contents entry for a book rather than a list of
 * what three cards hold. Each one now names the cards.
 */
export const GROUP_BLURB: Record<CycleGroup, string> = {
  cycle: 'The phase ring, this phase’s food focus, and your cycle lengths',
  fertility: 'The window explained, your luteal lengths, and the temperature chart',
  feelings: 'Mood, energy, drive and cravings, each averaged by phase',
  patterns: 'Every cycle folded onto one axis — which day each symptom lands on',
  log: 'Every day you logged, with everything you put on it — tap one to correct it',
  guide: 'The four phases, food by phase, what you track for, and your data',
  manual: 'Nine short sections: how to log, how to read a chart, what this cannot tell you',
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
  /**
   * How many panels the reader meets inside this card, when it is not one.
   *
   * The rail's count is a promise about what the row holds, and `manual` is
   * one registered card containing a nine-card `CardDeck` — so the rail said
   * **1** while the deck under it said **1 of 9**. Both were true (one counts
   * registered cards, the other counts sections) and they read as a
   * contradiction, which is this page's oldest fault in miniature: figures
   * that are each correct under their own definition and name neither.
   *
   * Derived from the content rather than typed, so it cannot drift from it.
   */
  panels?: number
}

/** What the rail should count for a card — its panels, or itself. */
export const panelsIn = (c: CycleCardMeta): number => c.panels ?? 1

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
/**
 * `bbtrules` and `logging` were retired when the manual landed: both were
 * reference prose already written down in `BBT_RULES` and `TRACKING_TIPS`, and
 * the manual now renders those same modules in one readable column. Cards earn
 * their chrome when each is a separate INSTRUMENT you read on its own — the
 * ring, the charts, the grid. Seven cards of reference text is a card per
 * heading. `phases` and `food` stay: both carry cited NHS/ACOG content that the
 * manual only summarises, and a credited source has to stay reachable.
 */
export const CYCLE_CARDS: CycleCardMeta[] = [
  { id: 'wheel', title: 'Where you are', group: 'cycle' },
  { id: 'phasefood', title: 'This phase', group: 'cycle' },
  { id: 'length', title: 'Cycle length', group: 'cycle', wide: true },

  { id: 'feelings', title: 'Desire, mood, energy & cravings', group: 'feelings', wide: true },
  { id: 'drivephase', title: 'Drive through the cycle', group: 'feelings' },
  // Moved out of `patterns`: it is a feelings card by subject, and it was also
  // leaving `drivephase` alone on a two-column row with 381px of dead space
  // beside it. Measured at 1536 before the move.
  { id: 'moodphase', title: 'Mood & energy by phase', group: 'feelings' },

  { id: 'fertile', title: 'Ovulation & the fertile window', group: 'fertility' },
  { id: 'luteal', title: 'Your luteal length', group: 'fertility' },
  { id: 'bbt', title: 'Basal temperature', group: 'fertility', wide: true },

  { id: 'symptoms', title: 'Symptom pattern', group: 'patterns', wide: true },
  { id: 'grid', title: 'What lands on which day', group: 'patterns', wide: true },

  /**
   * THE RECORD ITSELF, which the page did not have.
   *
   * `CyclePoint` carries fourteen things a day can hold and the month list
   * drew four of them, so ten fields could be filled in and never seen again.
   * Every averaging card reads them — mood by phase, drive by phase, the
   * symptom grid — but an average is not the record, and the day itself was
   * unreachable once it left the month view. Reported as "other details, same
   * like logs, need to be maintained".
   *
   * Its own row rather than a card on an existing one: it is the only thing
   * on this page that is the LOG rather than a reading taken from it, and
   * `cycle` is the row the page opens on, which the same report asked to keep
   * simple.
   */
  { id: 'log', title: 'Your log', group: 'log', wide: true },

  { id: 'phases', title: 'The four phases', group: 'guide', wide: true },
  { id: 'food', title: 'Cravings & food, phase by phase', group: 'guide', wide: true },
  { id: 'goal', title: 'What you are tracking for', group: 'guide' },
  { id: 'data', title: 'Your cycle data', group: 'guide', wide: true },

  /**
   * ITS OWN ROW, because it was six phone screens inside somebody else's.
   *
   * Measured at `?demo=1`: the manual card was **3,483px at 1440 and 5,435px
   * on a phone** — the worst panel on the page by a factor of four — and the
   * Guide row holding it came to **11,050px / 13.09 phone screens** against
   * 2.9–3.8 for every other row. A rail row that is four times the page is not
   * a row; it is the wall the rail was built to remove, moved one level down.
   *
   * Registered, not just rendered: `views/Cycle.test.tsx` asserts the rendered
   * `data-card` set equals this list in BOTH directions, so a card that skips
   * the registry fails the suite rather than quietly becoming unfindable.
   */
  { id: 'manual', title: 'The manual', group: 'manual', wide: true, panels: CYCLE_MANUAL.length },
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

/**
 * THE ROWS THAT RENDER AS A DECK RATHER THAN A GRID.
 *
 * A per-row decision, and a measured one. With the act shut at `?demo=1`, by
 * phone screens: `This cycle` 2.23 · `Patterns` 2.21 · `Fertility` 2.48 ·
 * `How you feel` 3.11 · **`Guide` 5.98**. One row is twice the next, and it is
 * twice it for a reason that has nothing to do with card count: `phases` and
 * `food` are catalogues — four and five phases of prose each — so the row is
 * 4,158px of reading stacked under a heading.
 *
 * `CardDeck` (REUSABLE-PATTERNS §30) shows one and keeps the rest a swipe
 * away, which is the same reduction as sub-section chips without the hiding.
 * Its floor is two cards; `guide` has four.
 *
 * The other four rows stay grids. Their cards are instruments you compare —
 * the wheel against the phase, the symptom grid against the heatmap — and a
 * deck that shows one at a time is the wrong shape for a comparison. None of
 * them is over 3.2 phone screens, which is the number that would change that.
 */
export const DECK_GROUPS: CycleGroup[] = ['guide']
