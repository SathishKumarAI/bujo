const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * LEGACY DEEP LINKS · read-only, and on borrowed time.
 *
 * Before the router, this app addressed itself with `?view=x&day=y` and mirrored
 * that into the URL with `replaceState` — deliberately replace and not push,
 * because nothing listened for `popstate`, so pushed entries would have built a
 * Back button that silently did nothing.
 *
 * Every one of those is a real route now, so the writer is gone: the URL *is*
 * the state, and a second copy in the query string could only drift out of step
 * with it. What survives is the reader, used once by the `Landing` route in
 * `routes.tsx` to translate an old bookmark into its new path.
 *
 * Delete no earlier than one release after Stage 2 ships, along with the
 * `// legacy redirect` block that calls it.
 */
export function readDeepLink(search = typeof window === 'undefined' ? '' : window.location.search) {
  const params = new URLSearchParams(search)
  const day = params.get('day')
  return {
    view: params.get('view'),
    day: day && ISO_DAY.test(day) ? day : null,
  }
}
