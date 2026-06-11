import { createContext, useContext, useState, type ReactNode } from 'react'
import { todayISO, ymOf } from '../../lib/date'

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
  const [day, setDay] = useState(() => todayISO())
  const [month, setMonth] = useState(() => ymOf(todayISO()))
  return <Ctx.Provider value={{ day, setDay, month, setMonth }}>{children}</Ctx.Provider>
}

export function useCursor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCursor must be used within CursorProvider')
  return c
}
