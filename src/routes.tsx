import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import App from './App.tsx'
import { isISODay, todayISO } from './lib/date.ts'
import { readDeepLink } from './lib/deepLink.ts'

/**
 * ROUTING · the day lives in the URL.
 *
 * `HashRouter` (mounted in `main.tsx`), not `BrowserRouter`, and the reason is
 * deployment rather than taste. This app ships to GitHub **project** Pages at
 * `/bujo/`, which is why `vite.config.ts` sets `base: './'`. Clean paths would
 * need a per-host `base`, a router `basename`, a `404.html` redirect shim
 * (static Pages has no SPA rewrite, so `/bujo/day/2026-07-04` is a hard 404 on
 * refresh) and a PWA `navigateFallback`. The hash needs none of them, and every
 * behaviour that matters is identical: direct load, Back, middle-click,
 * cmd-click.
 *
 * Only the day is a route so far. Which *view* is showing is still `?view=`
 * query state owned by `App`; Stage 2 of the IA pass moves that here too.
 */
export function DayRoute() {
  const { date } = useParams()
  // A trust boundary: `:date` is whatever sits in the address bar. Anything
  // that is not a real calendar day redirects to today rather than throwing —
  // a stale bookmark or a fat-fingered URL should open the journal, not a
  // crash. `isISODay` round-trips through the formatter, so "2026-13-45" is
  // caught even though `new Date` would happily roll it to 2027-02-14.
  if (!isISODay(date)) return <Navigate to={`/day/${todayISO()}`} replace />
  return <App />
}

/**
 * Anything that is not a day route lands on today. `?day=` links predate the
 * router — the app kept the day in the query string — and are honoured here so
 * old bookmarks open the day they name instead of silently opening today.
 */
export function Landing() {
  const legacy = readDeepLink().day
  return <Navigate to={`/day/${isISODay(legacy) ? legacy : todayISO()}`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/day/:date" element={<DayRoute />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
