import type { JournalData } from './types'

/**
 * WHAT INSIGHTS SHOWS, AND WHAT IT HIDES.
 *
 * The page used to be two tabs (Insights | Stats) where the second one held
 * every chart in the app behind **seven folds that all shipped closed**. Two
 * mechanisms for "there is more below", neither of which told you what was
 * down there — so the charts were, in practice, unreachable. This replaces
 * both with one row of controls that names every domain up front.
 *
 * A domain is what a card is *about*, not which file it came from. The split
 * is the one a person makes when they arrive with a question:
 *
 * | Domain | The question it answers |
 * |---|---|
 * | `overview` | what changed this week, and what should I do next |
 * | `mood` | how have I felt, and what moves it |
 * | `habits` | am I keeping the streak, and when do I actually check in |
 * | `body` | how much did I train, and on what |
 * | `tasks` | where do my tasks end up |
 * | `records` | the lifetime totals and the badges |
 *
 * Pure and testable on purpose: the filter is the page's whole information
 * architecture now, so it is the thing that must not quietly stop working.
 */
export const DOMAINS = ['overview', 'mood', 'habits', 'body', 'tasks', 'records'] as const
export type Domain = (typeof DOMAINS)[number]

/**
 * One line per domain, shown under its heading in zone 3.
 *
 * The chips were the page's whole information architecture and they were
 * opt-in: with nothing selected — the default — you got all twenty-three
 * cards in one undifferentiated masonry, and the six words in the chip row
 * appeared nowhere else on the page. These are the same six words used as
 * section headings, so the filter and the layout finally agree.
 */
export const DOMAIN_BLURB: Record<Domain, string> = {
  overview: 'What changed this week, and what to do next',
  mood: 'How you have felt, and what moves it',
  habits: 'Whether the streak is holding, and when you actually check in',
  body: 'How much you trained, and on what',
  tasks: 'Where your tasks end up',
  records: 'Lifetime totals, pace and badges',
}

export const DOMAIN_LABEL: Record<Domain, string> = {
  overview: 'Overview',
  mood: 'Mood & sleep',
  habits: 'Habits',
  body: 'Body',
  tasks: 'Tasks',
  records: 'Records',
}

/**
 * One row per card on the page. `words` is what a search has to match to keep
 * the card — the title alone is not enough, because the useful query is
 * usually the *measure* ("sleep debt", "r", "streak") rather than the heading
 * someone chose for it.
 *
 * Kept as data rather than as a prop on each card so the count is countable.
 *
 * **`views/Insights.test.tsx` asserts every id here is rendered and every
 * rendered id is here.** This docstring claimed that test existed for two
 * releases and it did not — the only test in this file checked the registry
 * against itself, which cannot see the page. In that gap `TrackerVisuals`
 * shipped five habit grids with no id and no gate: unfilterable,
 * unsearchable, uncounted. It is `habitgrids` below now, and the test reads
 * `data-card` off the rendered DOM so a card dropped in a move fails rather
 * than vanishing. `views/Pullups.tsx` lost eleven workout formats to exactly
 * that, with every gate green.
 */
export interface CardMeta {
  id: string
  title: string
  domain: Domain
  words: string
}

export const CARDS: CardMeta[] = [
  { id: 'digest', title: 'Weekly digest', domain: 'overview', words: 'week digest summary streak tasks mood win slip' },
  { id: 'coach', title: 'Coach digest', domain: 'overview', words: 'coach next focus advice tip recommendation' },
  { id: 'patterns', title: 'Patterns', domain: 'overview', words: 'correlation r pattern link relationship' },
  { id: 'matrix', title: 'Correlation matrix', domain: 'overview', words: 'correlation matrix heatmap r mood stress sleep' },
  { id: 'momentum', title: 'Momentum', domain: 'overview', words: 'momentum trend direction vs last week delta' },
  { id: 'entryvolume', title: 'Journal volume', domain: 'overview', words: 'entries per week volume writing cadence bar' },

  { id: 'moodcal', title: 'Mood calendar', domain: 'mood', words: 'mood calendar month year pixels tint daily' },
  { id: 'moodanalytics', title: 'Mood analytics', domain: 'mood', words: 'mood weekday stability best worst variance' },
  { id: 'sleepmood', title: 'Sleep vs mood', domain: 'mood', words: 'sleep mood scatter correlation dots' },
  { id: 'sleepdebt', title: 'Sleep debt', domain: 'mood', words: 'sleep debt deficit hours 8h running' },
  { id: 'focussleep', title: 'Focus vs sleep', domain: 'mood', words: 'focus deep work sleep correlation r' },
  { id: 'weekradar', title: 'This week at a glance', domain: 'mood', words: 'radar week average mood stress sleep habits' },

  { id: 'activity', title: 'Activity', domain: 'habits', words: 'activity heatmap showed up days grid calendar' },
  { id: 'checkin', title: 'Check-in times', domain: 'habits', words: 'check in time of day habit when hour' },
  { id: 'habitanalytics', title: 'Habit analytics', domain: 'habits', words: 'habit consistency trend mood impact completion' },
  { id: 'consistency', title: 'Habit consistency', domain: 'habits', words: 'habit consistency 30 day rate bar ranking' },
  /* `TrackerVisuals` — the five grids that came over from Today. It had **no
     id and no `show()` gate**, so it rendered whatever the chips said and was
     invisible to this registry and to the test below. Registered rather than
     deleted: its overlap with `activity` and `habitanalytics` is real and
     wants a consolidation pass, and deleting a chart on the suspicion that
     another covers it is how a feature goes quiet. */
  { id: 'habitgrids', title: 'Habit grids', domain: 'habits', words: 'habit heatmap streak leaderboard perfect days monthly trend weekday grid' },

  { id: 'workoutmin', title: 'Workout minutes', domain: 'body', words: 'workout minutes week training volume bar' },
  { id: 'workoutsplit', title: 'Workout split', domain: 'body', words: 'workout split type distribution donut push pull legs' },

  { id: 'tasks', title: 'Task breakdown', domain: 'tasks', words: 'task done migrated open cancelled breakdown donut' },
  { id: 'taskstrend', title: 'Task completion trend', domain: 'tasks', words: 'task completion rate per week trend line' },

  { id: 'pace', title: 'Pace', domain: 'records', words: 'pace days left month year week remaining' },
  { id: 'lifetime', title: 'Lifetime', domain: 'records', words: 'lifetime total year in review personal records month index' },
  { id: 'achievements', title: 'Achievements', domain: 'records', words: 'achievement badge trophy unlocked' },
]

/**
 * Which cards survive the current controls.
 *
 * An empty `active` set means "all" rather than "none" — a filter row where
 * deselecting everything blanks the page teaches people not to touch it. The
 * query is matched against the title AND the keyword list, lowercased, every
 * whitespace-separated term having to hit something (AND, not OR): "sleep
 * debt" should not return every card that mentions sleep.
 */
export function visibleCards(active: Set<Domain>, query: string): Set<string> {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const keep = new Set<string>()
  for (const c of CARDS) {
    if (active.size > 0 && !active.has(c.domain)) continue
    const hay = `${c.title} ${c.words}`.toLowerCase()
    if (terms.every((t) => hay.includes(t))) keep.add(c.id)
  }
  return keep
}

/** Sort orders offered for the journal search results. */
export const SORTS = ['newest', 'oldest', 'kind'] as const
export type Sort = (typeof SORTS)[number]

export interface SearchRow {
  date?: string
  kind: string
  text: string
}

/**
 * Order the search hits.
 *
 * `search()` returns them in whatever order it walked the store, which is
 * neither chronological nor grouped — reading twenty results meant reading
 * twenty dates. Rows with no date sort last in both directions rather than
 * jumping to one end, because "undated" is not "oldest".
 */
export function sortResults<T extends SearchRow>(rows: T[], sort: Sort): T[] {
  const out = [...rows]
  if (sort === 'kind') {
    out.sort((a, b) => a.kind.localeCompare(b.kind) || (b.date ?? '').localeCompare(a.date ?? ''))
    return out
  }
  out.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  })
  return out
}

/** Entries written per ISO week, for the journal-volume bar chart. */
export function entriesPerWeek(data: JournalData, weeks = 12, today: string): { week: string; entries: number }[] {
  const out: { week: string; entries: number }[] = []
  const end = new Date(today + 'T00:00')
  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(end)
    start.setDate(start.getDate() - end.getDay() - w * 7)
    const stop = new Date(start)
    stop.setDate(stop.getDate() + 7)
    const a = start.toISOString().slice(0, 10)
    const b = stop.toISOString().slice(0, 10)
    out.push({
      week: a.slice(5),
      entries: data.entries.filter((e) => e.date && e.date >= a && e.date < b).length,
    })
  }
  return out
}
