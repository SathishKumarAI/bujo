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
 * Mirror the current view into the URL.
 *
 * The day is no longer written here — it lives in the hash route (`#/day/…`)
 * and `CursorProvider` reads it from there. Writing it in both places would be
 * two sources of truth for one value, and the query-string copy would go stale
 * the moment the router navigated. `readDeepLink().day` survives for exactly
 * one purpose: honouring `?day=` bookmarks made before the router existed.
 *
 * Still `replaceState`, and now for a smaller reason than before: the view is
 * not yet a route (Stage 2), so pushing an entry per view switch would build
 * history the Back button could not honour. The day *is* a route and gets real
 * pushed history through `navigate()`.
 */
export function writeDeepLink(view: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('view', view)
  // The router owns the day now; drop any stale copy a pre-router session left.
  params.delete('day')
  const next = `${window.location.pathname}?${params}${window.location.hash}`
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', next)
  }
}
