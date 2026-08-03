import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import App from './App.tsx'
import { isISODay, todayISO, ymOf } from './lib/date.ts'
import { readDeepLink } from './lib/deepLink.ts'
import { ROUTES, SECTION_ROOT, pathFor, tabsFor, type SectionId } from './lib/routes.ts'
import type { ViewId } from './components/shell/viewChrome.ts'

/**
 * ROUTING · every view has a URL.
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
 * The paths themselves live in `lib/routes.ts`, as data. This file only turns
 * that table into `<Route>`s and handles the two things a table cannot: param
 * validation, and where a bare section path lands.
 */
function DayRoute() {
  const { date } = useParams()
  // A trust boundary: `:date` is whatever sits in the address bar. Anything
  // that is not a real calendar day redirects to today rather than throwing —
  // a stale bookmark or a fat-fingered URL should open the journal, not a
  // crash. `isISODay` round-trips through the formatter, so "2026-13-45" is
  // caught even though `new Date` would happily roll it to 2027-02-14.
  if (!isISODay(date)) return <Navigate to={`/day/${todayISO()}`} replace />
  return <App />
}

/** `/plan/month/:yearMonth` — same trust boundary, one field shorter. */
function MonthRoute() {
  const { yearMonth } = useParams()
  if (!yearMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return <Navigate to={`/plan/month/${ymOf(todayISO())}`} replace />
  }
  return <App />
}

/**
 * LEGACY REDIRECTS · `?view=x&day=y` was how this app addressed itself before
 * Stage 2, and those links are in bookmarks, notes and the address bars of
 * anyone mid-session across the upgrade. Every old view id resolves through the
 * same `pathFor` the app now uses, so there is no second mapping to keep in
 * step.
 *
 * Delete no earlier than one release after Stage 2 ships.
 */
function Landing() {
  const { view, day } = readDeepLink()
  const target = isISODay(day) ? day : todayISO()
  // legacy redirect — `?view=gym` was FitnessHub opened on its Strength tab,
  // never a screen of its own, so it resolves to Fitness rather than a route.
  const id = (view === 'gym' ? 'fitness' : view) as ViewId | null
  const known = id && ROUTES.some((r) => r.id === id)
  return <Navigate to={known ? pathFor(id, { day: target }) : `/day/${target}`} replace />
}

/** A bare `/body` lands on that section's first tab. */
function SectionRoot({ section }: { section: SectionId }) {
  // Gates are a settings read and this component cannot reach the store, so it
  // aims at the first *ungated* tab. A gated-off view is unreachable by URL
  // anyway — its route is not registered.
  const first = tabsFor(section, { cycle: false, nofap: false })[0]
  return <Navigate to={first ? pathFor(first.id) : `/day/${todayISO()}`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/day/:date" element={<DayRoute />} />
      <Route path="/plan/month/:yearMonth" element={<MonthRoute />} />

      {ROUTES
        .filter((r) => !r.path.includes(':'))
        .map((r) => <Route key={r.path} path={r.path} element={<App />} />)}

      {(Object.keys(SECTION_ROOT) as SectionId[])
        .filter((s) => s !== 'day')
        .map((s) => <Route key={s} path={SECTION_ROOT[s]} element={<SectionRoot section={s} />} />)}

      <Route path="/day" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
