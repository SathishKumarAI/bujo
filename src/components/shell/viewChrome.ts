export type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'gym' | 'pullups' | 'challenges' | 'focus'
  | 'plan' | 'collections' | 'insights' | 'stats' | 'cycle' | 'nofap' | 'help' | 'settings'

export interface ViewChrome {
  title: string
  subtitle?: string
  /** Which cursor the top bar's date-nav drives, if any. */
  dateNav?: 'day' | 'month'
}

export const VIEW_CHROME: Record<ViewId, ViewChrome> = {
  today: { title: 'Today', subtitle: 'Your daily log', dateNav: 'day' },
  monthly: { title: 'Monthly', subtitle: 'Events show as dots', dateNav: 'month' },
  trackers: { title: 'Trackers', subtitle: 'Tap a cell to mark the day', dateNav: 'month' },
  fitness: { title: 'Fitness', subtitle: 'Workout log & totals' },
  gym: { title: 'Gym', subtitle: 'Sessions & exercises' },
  pullups: { title: 'Pull-ups', subtitle: 'Ability, workouts & progressions' },
  challenges: { title: 'Challenges', subtitle: '75 Hard, 90-day & custom challenges' },
  focus: { title: 'Focus', subtitle: 'Coding time · flow · stress' },
  plan: { title: 'Plan', subtitle: 'Recurring tasks & routines' },
  collections: { title: 'Collections', subtitle: 'Future log & lists' },
  insights: { title: 'Insights', subtitle: 'Streaks, search & reflection' },
  stats: { title: 'Stats', subtitle: 'Charts at a glance' },
  cycle: { title: 'Cycle', subtitle: 'Temperature & phase', dateNav: 'month' },
  nofap: { title: 'Streak', subtitle: 'Abstinence journal' },
  help: { title: 'Help', subtitle: 'Guide & bullet legend' },
  settings: { title: 'Settings', subtitle: 'Theme, profile, data' },
}
