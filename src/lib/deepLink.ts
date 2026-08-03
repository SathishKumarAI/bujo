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
export function readDeepLink(search = typeof window === 'undefined' ? '' : window.location.search) {
  const params = new URLSearchParams(search)
  const day = params.get('day')
  return {
    view: params.get('view'),
    day: day && ISO_DAY.test(day) ? day : null,
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
