/**
 * WHAT RECOVERY SHOWS, AND WHAT IT USED TO HIDE.
 *
 * Zone 3 was three `CollapsibleSection`s — "Setup", "Deep analytics",
 * "Reference" — and **all three shipped shut**. Measured on `main`:
 * `npm run space -- nofap` said **1.9 shipped against 4.8 open** on desktop
 * and 4.8 against 8.2 on a phone, across 17 cards. Nearly three screens of
 * content existed on the page and was not on the page. `page-census.mjs` put
 * it at `folds 3 · open 0` beside Insights' `folds 0`, which is the number the
 * user's report — "the right-hand side looks like it's not modernised" —
 * translates into.
 *
 * This is the same instrument #270 used on Insights: the group names become
 * navigation, one group renders at a time, and the registry — not the order
 * the JSX happens to be in — decides what is in which group.
 *
 * A group is the **question you arrived with**, not the file a card came from:
 *
 * | Group | The question it answers |
 * |---|---|
 * | `progress` | where the streak stands, and what it has bought me |
 * | `patterns` | when urges hit, and what runs up to a reset |
 * | `plan` | what I committed to, and my if-then responses |
 * | `reference` | the techniques, the ladder ahead, and every reset behind |
 *
 * `plan` and `reference` are the "Setup" and "Reference" folds one-for-one —
 * same panels, same subtitles, reachable in a click instead of hidden behind a
 * caret. That is deliberate: a restructure that also re-sorts the content it
 * moves cannot be diffed. The two analytics groups are where the regrouping
 * happened, and only there.
 *
 * **Deliberately NOT a shared abstraction with `insightsFilter.ts`.** The two
 * registries mirror each other's *shape* and share no code: Insights carries
 * result sorting this page has no use for, its filter is a multi-select `Set`
 * where this rail is single-select, and two call sites is not a reason to
 * invent a third module both must agree with. Mirror, do not extract.
 */
export const GROUPS = ['progress', 'patterns', 'plan', 'reference'] as const
export type Group = (typeof GROUPS)[number]

export const GROUP_LABEL: Record<Group, string> = {
  progress: 'Progress',
  patterns: 'Patterns',
  plan: 'Plan',
  reference: 'Reference',
}

/**
 * One line per group, shown under its heading in zone 3 — the same words the
 * rail offers, because a page that names six things in a control row and
 * structures itself around nine others is the fault this instrument exists to
 * fix (`docs/PAGE-SHAPE.md`).
 *
 * `plan` and `reference` keep the retired folds' own subtitles verbatim.
 */
export const GROUP_BLURB: Record<Group, string> = {
  progress: 'Where the streak stands, and what it has bought you',
  patterns: 'When urges hit, and what runs up to a reset',
  plan: 'Your commitment contract & if-then trigger plans',
  reference: 'Coping techniques, recovery ladder & reset history',
}

/**
 * The group the page opens on.
 *
 * Not "All" — landing on everything is landing on the 4.8-screen page the rail
 * replaces — and not the first row for its own sake. Someone opens Recovery to
 * see where the streak stands; the analytics that explain *why* are one click
 * away, the way Coaching opens on Drills rather than its shot library.
 */
export const DEFAULT_GROUP: Group = 'progress'

/**
 * One row per panel in zone 3. `words` is what the filter has to match to keep
 * the panel — the title alone is not enough, because the query someone types
 * is usually the *measure* ("money", "hours", "HALT") rather than the heading
 * somebody chose for it.
 *
 * Kept as data rather than as a prop on each card so the count is countable,
 * and so `views/NoFap.test.tsx` can assert the rendered `data-card` set equals
 * this list in both directions. That test is the whole point: on Insights five
 * habit grids shipped with no card id, so the rail could not filter them, the
 * filter could not find them and no count included them — and nothing failed.
 */
export interface CardMeta {
  id: string
  title: string
  group: Group
  words: string
}

export const CARDS: CardMeta[] = [
  { id: 'streakvsbest', title: 'Streak vs best', group: 'progress', words: 'streak best record pace comeback days clean ahead behind' },
  { id: 'selfefficacy', title: 'Self-efficacy', group: 'progress', words: 'conversion resisted rate urges won confidence percent' },
  { id: 'streakssaved', title: 'Streaks saved', group: 'progress', words: 'saved streaks resisted rescue near miss' },
  { id: 'timereclaimed', title: 'Time reclaimed', group: 'progress', words: 'time hours reclaimed days back given hours per day' },
  { id: 'moneysaved', title: 'Money saved', group: 'progress', words: 'money cost per day saved currency spend' },
  { id: 'calmstretch', title: 'Calm stretch', group: 'progress', words: 'calm quiet stretch days since last urge craving' },
  { id: 'addictions', title: 'Per-addiction streaks', group: 'progress', words: 'addiction separate streak sugar smoking scrolling best resets cost add remove' },

  /* The paired "urges logged vs resets" sparkline is NOT here. It is zone 3's
     signature visual and sits above the rail, on screen whichever group is
     selected — `docs/PAGE-SHAPE.md`: "Summary, the signature visual, then the
     list". A registry row for it would put the page's one always-visible chart
     inside a group you have to pick. */
  { id: 'urgetrend', title: 'Urge trend', group: 'patterns', words: 'urge frequency trend per week rising falling bars' },
  { id: 'intensity', title: 'Urge intensity', group: 'patterns', words: 'intensity strength 1 5 rated average distribution' },
  { id: 'cleanrollup', title: 'Clean rollup', group: 'patterns', words: 'clean weeks rollup perfect window run' },
  { id: 'riskhours', title: 'High-risk hours', group: 'patterns', words: 'hour time of day heatmap peak late night risk when' },
  { id: 'riskdays', title: 'Riskiest days', group: 'patterns', words: 'weekday day of week relapse reset pattern saturday risk' },
  /* One id for the whole set, the way Insights registers `habitgrids`: there
     is one card per counted streak and the number of them is the user's data,
     not the registry's. A per-streak id would make the registry disagree with
     the page the moment somebody adds an addiction. */
  { id: 'lapsecounts', title: 'How many, by weekday', group: 'patterns', words: 'how many count quantity weekday average lapse times per day' },
  { id: 'triggers', title: 'Trigger patterns', group: 'patterns', words: 'trigger reason cause pattern top gap between resets' },
  { id: 'urgemix', title: 'Urges by addiction', group: 'patterns', words: 'urges by type addiction mix what you resist most bar' },

  { id: 'commitment', title: 'My commitment', group: 'plan', words: 'commitment contract quit date reason why promise' },
  { id: 'triggerplans', title: 'Trigger plans', group: 'plan', words: 'trigger plan if then coping response when i will' },

  { id: 'techniques', title: 'Beat the urge', group: 'reference', words: 'technique surf delay halt play forward remove cue reach out coping' },
  { id: 'ladder', title: 'Recovery ladder', group: 'reference', words: 'ladder milestone benefit days clears next 7 14 30 90' },
  { id: 'resets', title: 'Reset history', group: 'reference', words: 'reset history relapse log reason reflection past' },
]

/**
 * Which panels survive the current rail row and filter query.
 *
 * `active` is one group or `null` for All — the rail is single-select, so this
 * takes a `Group | null` rather than Insights' `Set`. Every whitespace-separated
 * term has to hit something (AND, not OR): "urge hour" should not return every
 * panel that mentions an urge.
 */
export function visibleCards(active: Group | null, query: string): Set<string> {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const keep = new Set<string>()
  for (const c of CARDS) {
    if (active && c.group !== active) continue
    const hay = `${c.title} ${c.words}`.toLowerCase()
    if (terms.every((t) => hay.includes(t))) keep.add(c.id)
  }
  return keep
}
