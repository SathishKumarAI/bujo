import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { todayISO, ymOf } from '../../lib/date'
import { onRouteChange, readDeepLink, writeDeepLink, type Surface } from '../../lib/deepLink'
import { surfaceForHour } from '../../lib/surface'

interface Cursor {
  /** ISO day for day-views (Today). */
  day: string
  setDay: (d: string) => void
  /** YYYY-MM for month-views (Monthly, Trackers, Cycle). */
  month: string
  setMonth: (m: string) => void
  /**
   * Which Today surface is showing. Defaults from the clock and is overridable;
   * the override lives in the URL so it survives a refresh, and is dropped when
   * the day changes so it does not follow you into tomorrow.
   */
  surface: Surface
  setSurface: (s: Surface) => void
  /** True while the surface is still whatever the clock said. */
  surfaceIsAuto: boolean
}

const Ctx = createContext<Cursor | null>(null)

/** Shared date cursor so the top bar can drive whichever date view is active. */
export function CursorProvider({ children }: { children: ReactNode }) {
  // `?day=` seeds the cursor, so a link to a specific day opens on that day
  // (and its month), not on today.
  const [day, setDay] = useState(() => readDeepLink().day ?? todayISO())
  const [month, setMonth] = useState(() => ymOf(readDeepLink().day ?? todayISO()))
  const [override, setOverride] = useState<Surface | null>(() => readDeepLink().surface)

  // Back / Forward: put the cursor back where the history entry says it was.
  useEffect(
    () =>
      onRouteChange((link) => {
        const d = link.day ?? todayISO()
        setDay(d)
        setMonth(ymOf(d))
        setOverride(link.surface)
      }),
    [],
  )

  /** Moving to another day drops the surface override — see the field doc. */
  const goDay = (d: string) => {
    if (d !== day) setOverride(null)
    setDay(d)
  }

  return (
    <Ctx.Provider
      value={{
        day,
        setDay: goDay,
        month,
        setMonth,
        surface: override ?? surfaceForHour(new Date().getHours()),
        setSurface: setOverride,
        surfaceIsAuto: override == null,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

/**
 * Keeps the address bar in step with where you are. Rendered inside the
 * provider so it can read the cursor; renders nothing itself.
 */
export function DeepLinkSync({ view }: { view: string }) {
  const { day, surface, surfaceIsAuto } = useCursor()
  useEffect(() => {
    // Only a deliberate override goes in the URL. Writing the clock's answer
    // there would freeze "morning" into a link opened at 7am and shared at 8pm.
    writeDeepLink(view, day, { surface: surfaceIsAuto || view !== 'today' ? null : surface })
  }, [view, day, surface, surfaceIsAuto])
  return null
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching device.tsx/Page.tsx
export function useCursor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCursor must be used within CursorProvider')
  return c
}
