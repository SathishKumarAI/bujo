import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { todayISO, ymOf } from '../../lib/date'
import { readDeepLink, writeDeepLink } from '../../lib/deepLink'

interface Cursor {
  /** ISO day for day-views (Today). */
  day: string
  setDay: (d: string) => void
  /** YYYY-MM for month-views (Monthly, Trackers, Cycle). */
  month: string
  setMonth: (m: string) => void
}

const Ctx = createContext<Cursor | null>(null)

/** Shared date cursor so the top bar can drive whichever date view is active. */
export function CursorProvider({ children }: { children: ReactNode }) {
  // `?day=` seeds the cursor, so a link to a specific day opens on that day
  // (and its month), not on today.
  const [day, setDay] = useState(() => readDeepLink().day ?? todayISO())
  const [month, setMonth] = useState(() => ymOf(readDeepLink().day ?? todayISO()))
  return <Ctx.Provider value={{ day, setDay, month, setMonth }}>{children}</Ctx.Provider>
}

/**
 * Keeps the address bar in step with where you are. Rendered inside the
 * provider so it can read the cursor; renders nothing itself.
 */
export function DeepLinkSync({ view }: { view: string }) {
  const { day } = useCursor()
  useEffect(() => { writeDeepLink(view, day) }, [view, day])
  return null
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching device.tsx/Page.tsx
export function useCursor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCursor must be used within CursorProvider')
  return c
}
