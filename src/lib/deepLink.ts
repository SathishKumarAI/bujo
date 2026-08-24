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
 * Retired spellings → where they live now.
 *
 * This is the app's equivalent of a 301. There is no path router — navigation
 * is a `view` state plus a `?view=` parameter — so the rewrite happens on read,
 * and the query string survives it. Old bookmarks keep working.
 *
 * **The table has been wrong three times in the same way, so the test is worth
 * stating once.** An id belongs here only when the page it names no longer
 * exists. It does NOT belong here merely because the thing is an *activity* you
 * pick inside Fitness rather than a nav destination — that is an argument about
 * the tab row, and it says nothing about whether the id should resolve.
 *
 * Ask instead: does the target hold anything the Fitness activity form does
 * not? Every time the answer was yes, the redirect was deleting a page rather
 * than relocating it.
 *
 * - **Pickleball** — a session is a `PickleballSession` (format, games won and
 *   lost, scoring, partner, points), not a `Workout`. The sport form asks for
 *   `durationMin` and nothing else, so the alias made every one of those fields
 *   unreachable from a link. Removed; it is a Body tab again.
 * - **Pull-ups** — `views/Pullups.tsx` holds the "Starting From Zero" program
 *   tracker, the ability/training-set calculator, the ability ladder, the
 *   workout-format library and the progression exercises. Removed.
 * - **Home workout** — `views/HomeWorkout.tsx` holds the bodyweight library and
 *   its demos. Removed.
 *
 * The last two were doubly wrong, because the app never agreed with them:
 * `Fitness`'s companion links, `Goals`'s program row and `TodayPlanCard`'s chip
 * all navigate to `pullups` and `homeworkout` in-app — and that works, because
 * in-app navigation sets state and never consults this table. Only the URL
 * disagreed, so those pages rendered perfectly until you reloaded or shared the
 * link, and then bounced to Fitness. A page you can open but cannot link to is
 * the shape of bug that survives every click-through test.
 *
 * Neither is a tab, and neither needs to be: both stay companions reached from
 * Fitness, and `MEMBERS` in `shell/sections.ts` already maps them to Body so
 * the rail lights correctly when you land on one.
 *
 * `home-workout` (hyphenated) stays: a genuine legacy spelling with no view id
 * of its own, so it still needs somewhere to land — now the view it meant.
 *
 * **An alias is now just `id → view`.** It used to carry an `activity` to
 * preselect, which existed solely for the two entries above; with those gone
 * every remaining alias set it to `''`, so both the field and the branches
 * reading it were dead. An explicit `?activity=` still works and is untouched —
 * that is the documented way to land on a Fitness activity.
 */
const VIEW_ALIASES: Record<string, string> = {
  'home-workout': 'homeworkout',
  body: 'fitness',
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
    view: alias ?? (raw ? (SECTION_ALIASES[raw] ?? raw) : null),
    day: day && ISO_DAY.test(day) ? day : null,
    /** Preselect this activity on arrival, and set the mode from `modeOf()`. */
    activity: params.get('activity') || null,
    /** Which Today surface to open. Null → pick from the clock. */
    surface: surface && (SURFACES as string[]).includes(surface) ? (surface as Surface) : null,
  }
}

/**
 * Finish the redirect: rewrite a retired `?view=` into its canonical form, once,
 * before anything else reads or writes the URL.
 *
 * Collapses the two spellings into one, so there is a single shape of URL
 * downstream rather than every reader having to resolve the alias again.
 *
 * `replaceState`, not push — a 301 should not leave the retired URL in history
 * for Back to land on, where it would redirect forward again.
 *
 * This used to also write the alias's `activity` into the URL, and the reason
 * is worth keeping even though the code is gone: resolving an activity in the
 * parsed *result* was not enough. `Fitness` is a `lazy()` chunk, so by the time
 * it mounted and read `activity`, `DeepLinkSync` had already rewritten the
 * address bar — and an activity that lives only in a parsed object, never in
 * the URL, is gone by then. If an alias ever needs to carry a parameter again,
 * it has to be written here, not returned from `readDeepLink`.
 */
export function canonicalizeDeepLink() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('view')
  const alias = raw ? VIEW_ALIASES[raw] : undefined
  if (!alias) return
  params.set('view', alias)
  window.history.replaceState(null, '', `${window.location.pathname}?${params}${window.location.hash}`)
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
