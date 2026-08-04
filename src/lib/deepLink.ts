import { todayISO } from './date'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * DEEP LINKS · the URL as a bookmarkable pointer at "which view, which day".
 *
 * The app already *read* `?view=` once at boot but never wrote it back, so the
 * address bar drifted out of sync the moment you navigated and no day was ever
 * addressable. A journal whose days cannot be linked is a journal you cannot
 * point anyone (including future you) at.
 *
 * **This now pushes history.** It used to `replaceState` on purpose, because
 * nothing listened for `popstate` and a Back button that silently does nothing
 * is worse than no Back button. That listener exists now (`onRouteChange`,
 * wired in `shell/cursor.tsx`), so navigation pushes and Back walks it.
 *
 * The push is conditional on the URL actually changing, which is what makes the
 * round trip safe: `popstate` sets state, the sync effect re-runs, and finds
 * the URL already says what it is about to write — so it pushes nothing and the
 * entry it just walked back to is not immediately re-added.
 */
/**
 * Retired destinations → where they live now.
 *
 * Pull-ups, Home workout and Pickleball were nav entries sitting as peers of
 * Coaching and Recovery, which mixed two levels of taxonomy: the first three
 * are *activities* and the last two are *surfaces*. An activity is something
 * you choose inside Fitness, not somewhere you navigate to.
 *
 * This is the app's equivalent of a 301. There is no path router — navigation
 * is a `view` state plus a `?view=` parameter — so the rewrite happens on read,
 * and the query string survives it. Old bookmarks keep working and land on the
 * activity they meant.
 */
const VIEW_ALIASES: Record<string, { view: string; activity: string }> = {
  pullups: { view: 'fitness', activity: 'pullups' },
  homeworkout: { view: 'fitness', activity: 'homeWorkout' },
  'home-workout': { view: 'fitness', activity: 'homeWorkout' },
  pickleball: { view: 'fitness', activity: 'pickleball' },
  body: { view: 'fitness', activity: '' },
}

/**
 * Section ids are legal in `?view=` too, so a bookmark of a *section* resolves
 * to that section's first tab. `mind` and `insights` are not view ids; `body`
 * already had an alias above, which this leaves alone.
 *
 * // legacy redirect — safe to delete once no bookmark predates the five-section nav.
 */
const SECTION_ALIASES: Record<string, string> = {
  day: 'today',
  mind: 'mindset',
  review: 'insights',
}

/** The three surfaces `/day` splits into. Anything else falls back to the clock. */
export type Surface = 'morning' | 'day' | 'evening'
const SURFACES: Surface[] = ['morning', 'day', 'evening']

export function readDeepLink(search = typeof window === 'undefined' ? '' : window.location.search) {
  const params = new URLSearchParams(search)
  const day = params.get('day')
  const raw = params.get('view')
  const alias = raw ? VIEW_ALIASES[raw] : undefined
  const surface = params.get('surface')
  return {
    view: alias ? alias.view : raw ? (SECTION_ALIASES[raw] ?? raw) : null,
    day: day && ISO_DAY.test(day) ? day : null,
    /** Preselect this activity on arrival, and set the mode from `modeOf()`. */
    activity: alias?.activity || params.get('activity') || null,
    /** Which Today surface to open. Null → pick from the clock. */
    surface: surface && (SURFACES as string[]).includes(surface) ? (surface as Surface) : null,
  }
}

/**
 * Build the URL for a (view, day) pair without navigating — so the day chevrons
 * can be real `<a href>` and middle-click / ⌘-click open a day in a new tab.
 * Same omit-today rule as `writeDeepLink`.
 */
export function hrefFor(view: string, day?: string, extra?: Record<string, string | null>): string {
  if (typeof window === 'undefined') return '#'
  const params = new URLSearchParams(window.location.search)
  params.set('view', view)
  if (day && day !== todayISO()) params.set('day', day)
  else params.delete('day')
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v == null) params.delete(k)
    else params.set(k, v)
  }
  return `${window.location.pathname}?${params}${window.location.hash}`
}

/**
 * Mirror the current view (and the day cursor, when it isn't today) into the
 * URL. Today is omitted on purpose: `?view=today` should keep meaning "today"
 * tomorrow, and a link to the current day is the one link nobody needs.
 *
 * Pushes rather than replaces when the URL genuinely changes, so Back steps
 * through the days and views you visited.
 */
export function writeDeepLink(view: string, day: string, extra?: Record<string, string | null>) {
  if (typeof window === 'undefined') return
  const next = hrefFor(view, day, extra)
  const current = window.location.pathname + window.location.search + window.location.hash
  if (next === current) return
  window.history.pushState(null, '', next)
}

/**
 * Subscribe to Back/Forward. The callback receives the freshly parsed URL, so
 * the caller can put its state back where the entry says it was.
 */
export function onRouteChange(cb: (link: ReturnType<typeof readDeepLink>) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb(readDeepLink())
  window.addEventListener('popstate', handler)
  return () => window.removeEventListener('popstate', handler)
}
