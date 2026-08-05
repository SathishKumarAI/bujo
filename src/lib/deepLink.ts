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
 * Deliberately `replaceState`, not `pushState`: this router does not listen for
 * `popstate` (see TASKS.md — an earlier verification sweep was invalidated by
 * assuming it did), so pushing entries would build a Back button that silently
 * does nothing. Replace keeps the URL truthful and shareable without promising
 * history semantics the app does not implement.
 */
/**
 * Retired destinations → where they live now.
 *
 * Pull-ups, Home workout and Pickleball were nav entries sitting as peers of
 * Coaching and Recovery, which mixed two levels of taxonomy: the first three
 * are *activities* and the last two are *surfaces*. An activity is something
 * you choose inside Fitness, not somewhere you navigate to.
 *
 * This is the app's equivalent of a 301. There is no router to issue a real
 * one — navigation is a `view` state plus a `?view=` parameter written with
 * `replaceState` — so the rewrite happens on read, and the query string
 * survives it. Old bookmarks keep working and land on the activity they meant.
 */
const VIEW_ALIASES: Record<string, { view: string; activity: string }> = {
  pullups: { view: 'fitness', activity: 'pullups' },
  homeworkout: { view: 'fitness', activity: 'homeWorkout' },
  'home-workout': { view: 'fitness', activity: 'homeWorkout' },
  pickleball: { view: 'fitness', activity: 'pickleball' },
  body: { view: 'fitness', activity: '' },
}

export function readDeepLink(search = typeof window === 'undefined' ? '' : window.location.search) {
  const params = new URLSearchParams(search)
  const day = params.get('day')
  const raw = params.get('view')
  const alias = raw ? VIEW_ALIASES[raw] : undefined
  return {
    view: alias ? alias.view : raw,
    day: day && ISO_DAY.test(day) ? day : null,
    /** Preselect this activity on arrival, and set the mode from `modeOf()`. */
    activity: alias?.activity || params.get('activity') || null,
  }
}

/**
 * Mirror the current view (and the day cursor, when it isn't today) into the
 * URL. Today is omitted on purpose: `?view=today` should keep meaning "today"
 * tomorrow, and a link to the current day is the one link nobody needs.
 */
export function writeDeepLink(view: string, day: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('view', view)
  if (day && day !== todayISO()) params.set('day', day)
  else params.delete('day')
  const next = `${window.location.pathname}?${params}${window.location.hash}`
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', next)
  }
}
