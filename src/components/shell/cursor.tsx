import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isISODay, todayISO, ymOf } from '../../lib/date'
import { writeDeepLink } from '../../lib/deepLink'

interface Cursor {
  /** ISO day for day-views (Today). Owned by the route, never by a component. */
  day: string
  setDay: (d: string) => void
  /** YYYY-MM for month-views (Monthly, Trackers, Cycle). */
  month: string
  setMonth: (m: string) => void
}

const Ctx = createContext<Cursor | null>(null)

/**
 * Shared date cursor so the top bar can drive whichever date view is active.
 *
 * The day used to be `useState`, seeded once from `?day=`. That made a day
 * unlinkable and unreachable by the Back button — `deepLink.ts` deliberately
 * used `replaceState` precisely because nothing listened for `popstate`, so
 * pushing history would have built a Back button that silently did nothing.
 *
 * The route owns it now. `setDay` is a navigation, which means every existing
 * caller — the top-bar chevrons, the date picker, Monthly's day cells,
 * Insights' drill-through — gets real history for free, without any of them
 * changing. The month cursor is still component state: no route carries it yet
 * (that is Stage 2's `/plan/month/:yearMonth`).
 */
export function CursorProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { date } = useParams()
  // The route is validated by `DayRoute` before this ever renders; the fallback
  // is here because the provider also mounts under the account gate, which is
  // not a day route.
  const day = isISODay(date) ? date : todayISO()
  const setDay = useCallback((d: string) => navigate(`/day/${d}`), [navigate])
  const [month, setMonth] = useState(() => ymOf(day))
  return <Ctx.Provider value={{ day, setDay, month, setMonth }}>{children}</Ctx.Provider>
}

/**
 * Keeps the address bar in step with where you are. Rendered inside the
 * provider so it can read the cursor; renders nothing itself.
 */
export function DeepLinkSync({ view }: { view: string }) {
  useEffect(() => { writeDeepLink(view) }, [view])
  return null
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching device.tsx/Page.tsx
export function useCursor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCursor must be used within CursorProvider')
  return c
}

/**
 * The day currently being viewed, from the route. The one way to read it —
 * no card keeps its own copy.
 */
// eslint-disable-next-line react-refresh/only-export-components -- see above
export function useToday(): string {
  return useCursor().day
}
