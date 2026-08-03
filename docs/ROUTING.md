# Routing and information architecture

How a screen is reached. Companion to `LAYOUT-WEIGHT-ALIGNMENT.md`, which
decides what a screen looks like once you are on it.

Before this pass the app had **no router**. `App.tsx` held `useState<ViewId>`
and `lib/deepLink.ts` mirrored it into `?view=`/`?day=` with `replaceState` —
deliberately replace and not push, because nothing listened for `popstate`, so
pushed entries would have built a Back button that silently did nothing. A day
could not be linked, bookmarked, or reached with Back.

## Why HashRouter

`#/day/2026-08-03`, not `/day/2026-08-03`. This is a deployment constraint, not
a preference.

| | Clean paths | Hash |
|---|---|---|
| GitHub **project** Pages at `/bujo/` | needs `base` per host, a router `basename`, a `404.html` redirect shim (static Pages has no SPA rewrite, so a refresh on a deep link is a hard 404), and a PWA `navigateFallback` | works as-is |
| `vite.config.ts` `base: './'` | must change | unchanged |
| Direct load · Back · middle-click · cmd-click | ✅ | ✅ |

Four moving parts to keep one deploy alive, versus none. Everything that
matters behaves identically; only the URL shape differs.

Vercel is **paused** (`vercel.json` → `git.deploymentEnabled: false`), so Pages
is the only live target and the decision above is the whole picture. Re-enabling
Vercel does not change it — Vercel is happy with the hash too.

## The table is the source of truth

Paths live in `src/lib/routes.ts` as data, not in JSX. Adding a view is a row.

```
/day/:date                          Day
/plan/tasks                         Plan
/plan/month/:yearMonth
/plan/goals
/body/fitness                       Body
/body/pullups · home-workout · pickleball · coaching · cycle · recovery
/mind/mindset · reading · collections     Mind
/insights/overview                  Insights
/insights/stats · trackers · challenges · focus
/settings · /settings/account · /help · /kitchen-sink
```

`pathFor(id, {day, month})` and `viewForPath(pathname)` are the only translation
between a URL and the old `ViewId`. **The ids were kept on purpose**: ~30
`useNav()('trackers')` call sites, the command palette and the leader keys all
speak that language, so the pass changed how a view is reached without touching
what reaches it.

Two traps the tests guard (`src/lib/routes.test.ts`):

- **Longest pattern wins.** Otherwise `/settings` swallows `/settings/account`
  and `/plan` swallows `/plan/month/2026-08`.
- **Every view in `VIEW_CHROME` has a route.** `gym` is the one exception: it
  was never a screen, only FitnessHub opened on its Strength tab, so it lives on
  as a legacy redirect.

## Placement decisions

Five sections, chosen so the rail needs no group headers. Seventeen visible
destinations is what made headers necessary in the first place.

| View | Section | Why |
|---|---|---|
| Focus | Insights | A developer work *tracker* — a logging tool, not analysis. Filed by decision, not by fit. |
| Cycle, Recovery | Body | Health tracking; both are settings-gated. |
| Account | `/settings/account` | Not a peer of the five. |
| Help, Kitchen sink | unlisted | Top bar and dev-only respectively. |

**`/plan/week/:isoWeek` was dropped.** No week view exists — `Plan` is task
migration, `Monthly` is the month grid. A route to a screen nobody has written
is a 404 with extra steps.

## Legacy redirects

`?view=x&day=y` bookmarks resolve through the same `pathFor` the app uses, so
there is no second mapping to drift out of step. Marked `// legacy redirect` in
`routes.tsx`.

**Delete no earlier than one release after this ships**, along with
`readDeepLink`.

`writeDeepLink` is already gone. The URL *is* the state now; a copy of it in the
query string could only fall behind.

## What owns the date

- **Day** — the route (`/day/:date`). `useToday()` is the one way to read it; no
  card keeps a copy. `setDay` navigates, so the chevrons, the date picker,
  Monthly's day cells and Insights' drill-through all got real history for free.
- **Month** — the route on Monthly only (`/plan/month/:yearMonth`). Trackers and
  Cycle also carry a month cursor but have no month route, so they keep
  component state. **This asymmetry is real**: stepping months on Monthly is in
  history, stepping them on Trackers is not.

`:date` and `:yearMonth` are trust boundaries — whatever is in the address bar.
`isISODay` round-trips through the formatter rather than trusting a regex,
because `new Date(2026, 12, 45)` silently rolls `2026-13-45` forward to
2027-02-14. Anything unparseable redirects to today rather than throwing.

## Today's three surfaces

`/day/:date?view=morning|day|evening`. The clock picks the opening surface
(Morning before 11:00, Day until 18:00, Evening after); the override rides in
the URL so a refresh keeps it, and is **not** persisted across days — which
surface you want tomorrow is a question tomorrow's clock answers better.

`?view=` here is a hash-side query and never collides with the pre-router
`?view=` in `location.search`, which is a different string entirely.
