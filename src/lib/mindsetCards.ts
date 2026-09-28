/**
 * WHAT THE MINDSET PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Mindset was the worst page in this app by the only number that measures the
 * problem: `space-audit` read **4.2 screens shipped / 4.2 open** at 1440 and
 * **8.8 / 8.8** on a phone, `page-census` read `0 folds · 0 charts · 1 column`
 * at 1440. Nothing was hidden — there was nothing to hide behind. Six bands in
 * a fixed vertical order in a single column on a 1440 screen, so every subject
 * on the page was reached by scrolling past every other one, and the library's
 * forty-six principles sat at the bottom of all of it.
 *
 * It was also the last place the app's *superseded* design world lived. The
 * page was built on `components/mod/Band` — "2px between sections, 1px between
 * cells, zero radius, no surface fill" — which `DESIGN.md` declares
 * anti-reference in its first sentence. So this is two changes in one, and
 * they are the same change: a page with no shape, rendered in a world the repo
 * had already written down as wrong.
 *
 * A group is what a card answers, not which file it came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `practice` | am I actually doing this, and how often |
 * | `balance` | which kinds of principle do I reach for, and which do I avoid |
 * | `library` | what else is there, and what should I take on next |
 *
 * **Three groups and not twelve, which was the tempting mistake.** The library
 * already filters by nine categories, and those nine are *right there* as a
 * scrolling filter row — it would be easy to promote them to rail rows and
 * call the page done. That mixes two kinds of thing in one nav, which is the
 * IA failure the page contract names directly: the rail chooses which subject
 * you are looking at, and a category chooses which principles are listed
 * inside one of them. Different axes. The category filter stays where it is,
 * inside `library`.
 *
 * **No `words` field and no search box in zone 2**, following `focusCards.ts`
 * and `gymCards.ts`. The library owns a search because it is a catalogue of
 * forty-six things; the page does not need a second one crossing three groups.
 *
 * **No "All" row.** The three groups do not overlap, and All could only offer
 * the 8.8-screen phone page this replaces.
 */
export const MINDSET_GROUPS = ['practice', 'balance', 'library'] as const
export type MindsetGroup = (typeof MINDSET_GROUPS)[number]

export const MINDSET_GROUP_LABEL: Record<MindsetGroup, string> = {
  practice: 'Practice',
  balance: 'Balance',
  library: 'Library',
}

export const MINDSET_GROUP_BLURB: Record<MindsetGroup, string> = {
  practice: 'How often you have marked a principle practised',
  balance: 'Which kinds of principle you reach for',
  library: 'Every principle, by category — pick the next one to work',
}

export interface MindsetCardMeta {
  id: string
  title: string
  group: MindsetGroup
  /** Takes the full row of the grid — the calendar and the catalogue. */
  wide?: boolean
}

/**
 * One row per card in the review zone.
 *
 * `streak` is the card that did not exist. `lib/mindsetPractice.ts` has
 * exported `currentStreak` and `daysWithMarks` for as long as the page has
 * existed and **nothing on screen read either of them** — the page showed a
 * 26-week grid and left the reader to count. A grid answers "when"; it does
 * not answer "am I on a run right now", which is the question that decides
 * whether you open the app tomorrow.
 */
export const MINDSET_CARDS: MindsetCardMeta[] = [
  { id: 'streak', title: 'Your run', group: 'practice' },
  { id: 'heatmap', title: 'Practice, last 26 weeks', group: 'practice', wide: true },

  { id: 'categories', title: 'Category balance', group: 'balance', wide: true },

  { id: 'library', title: 'The library', group: 'library', wide: true },
]

/**
 * The group the page opens on.
 *
 * `practice` is what someone looks at with the focus slots open beside them —
 * zone 2 is "mark today", and this is the record that makes marking it feel
 * like anything. `library` is the obvious alternative and it is wrong for the
 * same reason the old page was: landing on forty-six things is landing on the
 * wall this replaces.
 */
export const MINDSET_DEFAULT_GROUP: MindsetGroup = 'practice'
