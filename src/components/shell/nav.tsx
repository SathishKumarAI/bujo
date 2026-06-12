import { createContext, useContext, type ReactNode } from 'react'
import type { ViewId } from './viewChrome'

/** Lets any view switch the active view (e.g. Monthly → Today on a clicked day). */
const Ctx = createContext<((id: ViewId) => void) | null>(null)

export function NavProvider({ navigate, children }: { navigate: (id: ViewId) => void; children: ReactNode }) {
  return <Ctx.Provider value={navigate}>{children}</Ctx.Provider>
}

export function useNav() {
  const n = useContext(Ctx)
  if (!n) throw new Error('useNav must be used within NavProvider')
  return n
}
