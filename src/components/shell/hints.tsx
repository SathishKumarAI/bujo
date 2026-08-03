import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * INLINE HINTS · one switch for the whole page, instead of an ⓘ per card.
 *
 * Every titled card used to carry an always-visible ⓘ popover. On Today that
 * was nine of them, and nine help affordances is nine labels that failed —
 * each one is the card admitting its own title and subtitle did not land. Worse,
 * the explanation was two taps away and behind a popover, so it helped nobody
 * skimming.
 *
 * The labels were rewritten to stand on their own, and what remains lives
 * behind a single `?` in the top bar: flip it and every card on the page shows
 * its explainer inline, as text, where it can actually be read. Flip it back and
 * the page is quiet again.
 *
 * Deliberately not persisted. This is a "explain this screen to me" mode, not a
 * preference — you want it for a minute, not forever, and a sticky version
 * would leave the app permanently verbose for anyone who forgot they turned it
 * on.
 */
const Ctx = createContext<{ on: boolean; toggle: () => void } | null>(null)

export function HintsProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false)
  return <Ctx.Provider value={{ on, toggle: () => setOn((v) => !v) }}>{children}</Ctx.Provider>
}

/**
 * Safe outside the provider: cards render in tests, dialogs and the onboarding
 * tour without a shell around them, and a missing provider should mean "hints
 * off", not a crash.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching cursor.tsx/device.tsx
export function useHints(): { on: boolean; toggle: () => void } {
  return useContext(Ctx) ?? { on: false, toggle: () => {} }
}
