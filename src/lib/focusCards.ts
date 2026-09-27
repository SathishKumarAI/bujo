/**
 * WHAT THE FOCUS PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Focus was the third-worst page in the app on `main`, and the shape of it was
 * unusual: `space-audit` read **3.5 screens shipped / 3.5 open** at 1440 and
 * **5.7 / 5.7** on a phone, `page-census` read **0 folds · 0 charts · 1 column**
 * at 1440. Nothing was hidden — there was nothing to hide behind. Six bands in a
 * fixed vertical order, in a single column on a 1440 screen, so every subject on
 * the page was reached by scrolling past every other one. `docs/NEXT-SESSION.md`
 * carried it for three stretches as "needs a decision, not a primitive", and the
 * decision it needed is which subjects the page is *about*.
 *
 * A group is what a card answers, not which file it came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `week` | how much have I done, and where is it heading |
 * | `rhythm` | which days do I do deep work, and which are any good |
 * | `depth` | what makes a session deep, and what breaks it |
 * | `subjects` | where do the hours go, and which work runs deepest |
 * | `typing` | the speed drills — goal, trend, recent runs |
 * | `log` | every block I logged, editable |
 *
 * **`depth` is the group that did not exist before**, and it is the reason this
 * is a restructure rather than a reflow. The page carried a Pomodoro timer
 * offering 15/25/50-minute blocks and had nothing whatsoever to say about which
 * of them works for the person using it, while `interruptionsTrend` plotted how
 * *often* interruptions happen with no reading on whether they matter. Those two
 * questions are one subject and it is the subject the page's primary control
 * belongs to.
 *
 * Kept as data rather than as a prop on each card so the count is countable and
 * so `views/Focus.test.tsx` can assert the rendered `data-card` set equals this
 * list **in both directions**. That test is the whole reason the registry is
 * worth having: on Insights five habit grids rendered with no card id, so
 * nothing could filter, find or count them, and `views/Pullups.tsx` lost eleven
 * workout formats to a pass that retyped a data module instead of moving it —
 * with `tsc -b`, eslint, vitest and the build all green.
 *
 * **No `words` field and no search box**, following `cycleCards.ts` rather than
 * `insightsFilter.ts`. Insights has twenty-four cards and a journal search
 * already in its act zone, so a query that crosses domains earns its place
 * there; thirteen cards behind six named rows do not, and a `words` column
 * nothing reads is the dead-data trap this file's own docstring warns about.
 *
 * **No "All" row either.** The six groups do not overlap and there is no query
 * to cross them, so All could only offer the 5.7-screen phone page this
 * replaces. Cycle and Coaching omit it for the same reason.
 */
export const FOCUS_GROUPS = ['week', 'rhythm', 'depth', 'subjects', 'typing', 'log'] as const
export type FocusGroup = (typeof FOCUS_GROUPS)[number]

export const FOCUS_GROUP_LABEL: Record<FocusGroup, string> = {
  week: 'This week',
  rhythm: 'Rhythm',
  depth: 'Depth',
  subjects: 'Projects & tools',
  typing: 'Typing',
  log: 'Sessions',
}

/** One line per group, shown under its heading. The rail rows say the same words. */
export const FOCUS_GROUP_BLURB: Record<FocusGroup, string> = {
  week: 'How much you have put in, and where the pace lands',
  rhythm: 'Which days you do deep work, and which ones are any good',
  depth: 'What makes a session deep, and what breaks it',
  subjects: 'Where the hours go, and which work runs deepest',
  typing: 'Speed drills — the goal, the trend, the recent runs',
  log: 'Every block you logged, editable in place',
}

export interface FocusCardMeta {
  id: string
  /** The card's own title, so a drifted heading is visible in one file. */
  title: string
  group: FocusGroup
  /**
   * Takes the whole row (`SPAN_2`) instead of one column.
   *
   * Declared here and not on the card, because **the grid item is the
   * `data-card` wrapper**, not the `Card` inside it — a span class on the card
   * itself resolves against nothing. Measured on Cycle before that was
   * understood: two cards that had asked for the row still came out 351px wide
   * in a 722px zone.
   *
   * The four that need it: the heatmap is 26 columns of 11px plus gaps and
   * already carries its own `overflow-x-auto`, so a 351px column would make the
   * page's signature visual a scrollbar; the findings list and the session
   * history are lines of prose, which wrap badly at 351; and the 12-week volume
   * chart shares an x-axis reading with the 14-day one directly above it, so
   * the two are read as a pair rather than side by side at different scales.
   */
  wide?: true
}

/**
 * The review zone, in render order within each group.
 *
 * `findings` leads `week` on purpose. It is the only card on the page that
 * states a conclusion rather than a series, and it replaces a band literally
 * titled *Worth knowing* that held two sentences computed inline in the view.
 */
export const FOCUS_CARDS: FocusCardMeta[] = [
  { id: 'findings', title: 'What the log says', group: 'week', wide: true },
  { id: 'days14', title: 'Coding minutes', group: 'week' },
  { id: 'cumulative', title: 'Cumulative hours', group: 'week' },
  { id: 'weeks12', title: 'Week by week', group: 'week', wide: true },

  { id: 'weekday', title: 'By weekday', group: 'rhythm' },
  { id: 'heatmap', title: 'Deep-work days', group: 'rhythm', wide: true },

  { id: 'duration', title: 'How long is a good block', group: 'depth' },
  { id: 'interruptions', title: 'Interruptions', group: 'depth' },

  { id: 'projects', title: 'By project', group: 'subjects' },
  { id: 'tags', title: 'Languages & tools', group: 'subjects' },

  { id: 'typingdrill', title: 'Typing practice', group: 'typing' },
  { id: 'typingstats', title: 'Speed & accuracy', group: 'typing' },

  { id: 'history', title: 'History', group: 'log', wide: true },
]

/**
 * The group the page opens on.
 *
 * Not the biggest and not the newest: `week` is what someone looks at once the
 * timer in zone 2 is running — "how much have I done" is the same question zone
 * 1 answers in four figures, and these are its pictures. `log` would be landing
 * on the raw data and `typing` on a different tracker entirely.
 *
 * The alternative considered and rejected: defaulting to `depth`, which holds
 * the two genuinely new charts and is the group that would change behaviour. It
 * is the more interesting landing and the less predictable one, and a rail that
 * opens somewhere a returning reader does not expect costs a click on every
 * visit to save one on the first.
 */
export const FOCUS_DEFAULT_GROUP: FocusGroup = 'week'
