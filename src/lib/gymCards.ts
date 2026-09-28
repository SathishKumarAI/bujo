/**
 * WHAT THE GYM PAGE'S REVIEW ZONE HOLDS, AND UNDER WHICH NAME.
 *
 * Gym came to this pass already on the contract — three zones, a real act
 * column, a `StatBar` whose four facts were argued for in the file. What it
 * still had was the mechanism the rail replaces everywhere else: **five
 * `QuietSection` folds, four of them shipping shut**. `space-audit` read
 * **1.7 screens shipped against 3.4 opened** at 1440 and **3.2 against 7.2**
 * on a phone, and `page-census` read `5 folds · 1 open`. A page whose `open`
 * is double its `shipped` is a page that is mostly not on screen, and the
 * three review folds were identical grey bars — nothing on them said which
 * one had the squat PR in it.
 *
 * The file's own comment block above those folds is the argument for this
 * change, written by whoever last reduced eight folds to three:
 *
 * > Collapsed by default is right for reference; it is wrong for the answer
 * > you came back for.
 *
 * A group is what a card answers, not which file it came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `week` | what have I done this week, and what does the body still need |
 * | `strength` | am I getting stronger, and at what cost |
 * | `balance` | what am I neglecting, and what has stalled |
 * | `body` | how is my body changing |
 * | `anatomy` | what does this lift actually hit |
 * | `plates` | what goes on the bar |
 * | `routines` | what can I load instead of typing it again |
 * | `exercisedb` | what else could I do |
 *
 * **The four tools are rail rows and not a fold in zone 2**, which reverses a
 * decision this file previously argued for and is worth recording rather than
 * quietly flipping. The argument against putting tools in the review column
 * was measured and real: they once sat at the very *bottom* of it, so reaching
 * the plate calculator mid-workout meant scrolling past every chart on the
 * page. A rail row is not that. It is one click, in a fixed position, with no
 * scrolling at all — the same reason the rail exists for the other four
 * groups. The rest timer does *not* come with them: it runs between sets
 * rather than while a session is being built, so it stays in zone 2 where it
 * is visible without a click.
 *
 * And they are **four rows, not one `tools` row**. A single row was the fold
 * again in a thinner disguise: four unrelated instruments stacked in one
 * panel, so reaching the plate calculator still meant scrolling past an
 * anatomy diagram. These four do not answer one question — they are four
 * instruments — and the rail's whole argument is that a named destination
 * beats scrolling to find one. It is the only place in the app where a rail
 * row holds a single card, and that is the correct shape here: the row *is*
 * the tool.
 *
 * **`progression` is the card that did not exist before**, and it is why this
 * is a restructure rather than a reflow. The focused lift's two charts — its
 * heaviest set per day and its estimated 1RM per day — were rendered *inside*
 * the weekly-volume card, behind `focusEx &&`, under a heading about the
 * week's total load. Two questions in one box: "how much am I training" and
 * "is this particular lift going up". They are the whole subject of
 * `strength`, and nothing could count or reach them while they were a
 * conditional tail on another card.
 *
 * Kept as data rather than as a prop on each card so the count is countable
 * and so `views/Gym.test.tsx` can assert the rendered `data-card` set equals
 * this list **in both directions**. That test is the reason the registry is
 * worth having: `views/Pullups.tsx` lost eleven workout formats to a pass that
 * retyped a data module instead of moving it, with `tsc -b`, eslint, vitest
 * and the build all green, and a rail makes that failure *quieter* than a fold
 * did — a card no group reaches is simply never on screen.
 *
 * **No `words` field and no search box**, following `focusCards.ts` and
 * `cycleCards.ts` rather than `insightsFilter.ts`. Insights has twenty-four
 * cards and a journal search already in its act zone; sixteen cards behind eight
 * named rows do not earn one, and a `words` column nothing reads is the
 * dead-data trap this file's own docstring warns about.
 *
 * **No "All" row either.** The eight groups do not overlap and there is no
 * query to cross them, so All could only offer the 7.2-screen phone page this
 * replaces.
 */
export const GYM_GROUPS = [
  'week', 'strength', 'balance', 'body',
  'anatomy', 'plates', 'routines', 'exercisedb',
] as const
export type GymGroup = (typeof GYM_GROUPS)[number]

export const GYM_GROUP_LABEL: Record<GymGroup, string> = {
  week: 'This week',
  strength: 'Strength',
  balance: 'Balance',
  body: 'Body',
  anatomy: 'Anatomy',
  plates: 'Plate calculator',
  routines: 'Saved routines',
  exercisedb: 'Exercise database',
}

export const GYM_GROUP_BLURB: Record<GymGroup, string> = {
  week: 'Hard sets per muscle against the landmark, and the load behind them',
  strength: 'Records, standards, effort, and whether a lift is moving',
  balance: 'Push/pull/legs, what is rested, what you skip, what has stalled',
  body: 'Weight trend and dated photos',
  anatomy: 'What today’s split — or any lift — actually works',
  plates: 'What to load on the bar, per side',
  routines: 'Load a saved session instead of typing it again',
  exercisedb: 'Search wger’s library and add a lift to your session',
}

export interface GymCardMeta {
  id: string
  title: string
  group: GymGroup
  /** Takes the full row of the grid — charts with an axis, and wide tables. */
  wide?: boolean
}

/**
 * One row per card in the review zone.
 *
 * `musclevolume` leads `week` because it is the page's signature visual and
 * the one chart here that says what to do *next* rather than what happened:
 * hard sets per muscle against the 10–20 hypertrophy landmark. `volume` is
 * the other half of the same week — sets are the stimulus, volume is the load.
 *
 * `reppr` and `progression` render only with a focused lift, which is a state
 * the page enters by clicking a lift anywhere on it. They are registered
 * anyway and the view filters them out when there is no focus, so the rail's
 * count stays a true statement about what the row is currently holding rather
 * than a promise it cannot keep.
 */
export const GYM_CARDS: GymCardMeta[] = [
  { id: 'musclevolume', title: 'Muscle volume balance', group: 'week', wide: true },
  { id: 'volume', title: 'Training volume', group: 'week', wide: true },

  { id: 'lifts', title: 'Lifts, records and standards', group: 'strength', wide: true },
  { id: 'progression', title: 'Is this lift moving', group: 'strength', wide: true },
  { id: 'rpe', title: 'Effort trend', group: 'strength', wide: true },
  { id: 'reppr', title: 'Rep records', group: 'strength' },

  { id: 'movement', title: 'Movement balance', group: 'balance' },
  { id: 'recovery', title: 'What is rested', group: 'balance' },
  { id: 'frequency', title: 'How often you train each lift', group: 'balance', wide: true },
  { id: 'neglected', title: 'Neglected muscles', group: 'balance' },
  { id: 'stalled', title: 'Stalled lifts', group: 'balance' },

  { id: 'weight', title: 'Weight trend', group: 'body', wide: true },
  { id: 'photos', title: 'Progress photos', group: 'body', wide: true },

  { id: 'anatomy', title: 'Exercise anatomy', group: 'anatomy', wide: true },
  { id: 'plates', title: 'Plate calculator', group: 'plates', wide: true },
  { id: 'routines', title: 'Saved routines', group: 'routines', wide: true },
  { id: 'exercisedb', title: 'Exercise database', group: 'exercisedb', wide: true },
]

/**
 * The group the page opens on.
 *
 * `week` is what someone looks at with the logger open beside them — zone 1
 * says the split to train and the sets logged in seven days, and this is that
 * week's picture. `strength` is the payoff group and the tempting default, but
 * it answers a question you ask once a month; `balance` and `body` are both
 * diagnostics you go looking for.
 */
export const GYM_DEFAULT_GROUP: GymGroup = 'week'
