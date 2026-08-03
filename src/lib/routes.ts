import type { ViewId } from '../components/shell/viewChrome'
import { todayISO, ymOf } from './date'

/**
 * ONE TABLE · every view, its path, and the section it belongs to.
 *
 * The nav used to be 17 sidebar destinations, split so finely that Pull-ups was
 * a peer of Fitness. Five sections now, and the split that matters is here in
 * data rather than in JSX: adding a view is a row, not an edit to a component.
 *
 * `id` is still the old `ViewId`, deliberately. `useNav()`, the command palette
 * and every in-app "jump to X" call site speak that language, so keeping it
 * means Stage 2 changes how a view is *reached* without touching what reaches
 * it. `pathFor` is the one translation point.
 */
export type SectionId = 'day' | 'plan' | 'body' | 'mind' | 'insights'

export interface RouteDef {
  id: ViewId
  /** Route pattern. `:date` / `:yearMonth` are filled by `pathFor`. */
  path: string
  /** Tab label on the section landing. Also the sidebar label for a section root. */
  label: string
  section: SectionId | 'system'
  /** Settings flag that has to be on for this view to exist at all. */
  gate?: 'cycle' | 'nofap'
}

export const ROUTES: RouteDef[] = [
  { id: 'today', path: '/day/:date', label: 'Today', section: 'day' },

  { id: 'plan', path: '/plan/tasks', label: 'Tasks', section: 'plan' },
  { id: 'monthly', path: '/plan/month/:yearMonth', label: 'Month', section: 'plan' },
  { id: 'goals', path: '/plan/goals', label: 'Goals', section: 'plan' },

  { id: 'fitness', path: '/body/fitness', label: 'Fitness', section: 'body' },
  { id: 'pullups', path: '/body/pullups', label: 'Pull-ups', section: 'body' },
  { id: 'homeworkout', path: '/body/home-workout', label: 'Home workout', section: 'body' },
  { id: 'pickleball', path: '/body/pickleball', label: 'Pickleball', section: 'body' },
  { id: 'coaching', path: '/body/coaching', label: 'Coaching', section: 'body' },
  { id: 'cycle', path: '/body/cycle', label: 'Cycle', section: 'body', gate: 'cycle' },
  { id: 'nofap', path: '/body/recovery', label: 'Recovery', section: 'body', gate: 'nofap' },

  { id: 'mindset', path: '/mind/mindset', label: 'Mindset', section: 'mind' },
  { id: 'reading', path: '/mind/reading', label: 'Reading', section: 'mind' },
  { id: 'collections', path: '/mind/collections', label: 'Collections', section: 'mind' },

  { id: 'insights', path: '/insights/overview', label: 'Overview', section: 'insights' },
  { id: 'stats', path: '/insights/stats', label: 'Stats', section: 'insights' },
  { id: 'trackers', path: '/insights/trackers', label: 'Trackers', section: 'insights' },
  { id: 'challenges', path: '/insights/challenges', label: 'Challenges', section: 'insights' },
  // Focus is a developer work tracker — a logging tool rather than analysis —
  // so it does not obviously belong anywhere. Filed under Insights by decision,
  // not by fit.
  { id: 'focus', path: '/insights/focus', label: 'Focus', section: 'insights' },

  { id: 'settings', path: '/settings', label: 'Settings', section: 'system' },
  { id: 'account', path: '/settings/account', label: 'Account', section: 'system' },
  { id: 'help', path: '/help', label: 'Help', section: 'system' },
  { id: 'kitchen-sink', path: '/kitchen-sink', label: 'Kitchen sink', section: 'system' },
]

/** Where a section's bare path lands. First non-gated route in that section. */
export const SECTION_ROOT: Record<SectionId, string> = {
  day: '/day',
  plan: '/plan',
  body: '/body',
  mind: '/mind',
  insights: '/insights',
}

const BY_ID = new Map(ROUTES.map((r) => [r.id, r]))

/**
 * The URL for a view. Params are filled from `opts`, falling back to now —
 * `useNav()('monthly')` means "the month I am looking at", and the caller
 * usually has it.
 */
export function pathFor(id: ViewId, opts: { day?: string; month?: string } = {}): string {
  const r = BY_ID.get(id)
  if (!r) return `/day/${opts.day ?? todayISO()}`
  return r.path
    .replace(':date', opts.day ?? todayISO())
    .replace(':yearMonth', opts.month ?? ymOf(opts.day ?? todayISO()))
}

/**
 * Which view a pathname is showing. Longest pattern first so `/settings/account`
 * is not swallowed by `/settings`, and so `/plan/month/2026-08` beats `/plan`.
 */
export function viewForPath(pathname: string): ViewId | null {
  const candidates = [...ROUTES].sort((a, b) => b.path.length - a.path.length)
  for (const r of candidates) {
    const prefix = r.path.replace(/\/:[^/]+$/, '')
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return r.id
  }
  return null
}

/**
 * The date context already in the URL, so switching views carries it along
 * instead of snapping back to today. Jumping from `/day/2026-07-04` to Monthly
 * should land on July, not on this month.
 */
export function dayInPath(pathname: string): string | undefined {
  const m = /^\/day\/(\d{4}-\d{2}-\d{2})/.exec(pathname)
  return m?.[1]
}

export function monthInPath(pathname: string): string | undefined {
  const m = /^\/plan\/month\/(\d{4}-\d{2})/.exec(pathname)
  if (m) return m[1]
  const day = dayInPath(pathname)
  return day ? ymOf(day) : undefined
}

/** Which of the five sections lights up in the sidebar for this pathname. */
export function sectionForPath(pathname: string): SectionId | 'system' | null {
  const id = viewForPath(pathname)
  return id ? (BY_ID.get(id)?.section ?? null) : null
}

/** The tabs on a section landing, in table order, minus anything gated off. */
export function tabsFor(section: SectionId, gates: { cycle: boolean; nofap: boolean }): RouteDef[] {
  return ROUTES.filter((r) => r.section === section && (!r.gate || gates[r.gate]))
}
