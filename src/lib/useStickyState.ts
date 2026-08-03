import { useCallback, useState } from 'react'

const PREFIX = 'bujo.ui.'

/**
 * STICKY UI STATE · a `useState` that remembers its last value across reloads.
 *
 * For *view* state only — which tab was open, which range was selected. It
 * writes to `localStorage` under `bujo.ui.*`, deliberately **not** into the
 * journal store:
 *
 * - the journal syncs (cloud, folder, server), and "which tab I had open on
 *   this laptop" is not something another device should inherit;
 * - the store carries an undo stack, and ⌘Z stepping back through tab
 *   switches instead of edits would be worse than not persisting at all.
 *
 * `allowed` guards against a stale or hand-edited key resurrecting a value the
 * component no longer understands (a renamed tab, a removed range) — anything
 * unrecognised falls back to the default.
 *
 * ```ts
 * const [tab, setTab] = useStickyState('fitness.tab', 'cardio', ['cardio', 'strength'])
 * ```
 */
export function useStickyState<T extends string | number>(
  /** `null` opts out of persistence entirely, for components where stickiness
   *  is a caller's choice (a shared section header used in many places). */
  key: string | null,
  fallback: T,
  allowed: readonly T[],
) {
  const [value, setValue] = useState<T>(() => {
    if (key == null) return fallback
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw == null) return fallback
      // Numbers survive the round-trip as strings; match them back by value.
      const restored = allowed.find((a) => String(a) === raw)
      return restored ?? fallback
    } catch {
      return fallback // private mode / storage disabled
    }
  })

  const set = useCallback(
    (next: T) => {
      setValue(next)
      if (key == null) return
      try {
        localStorage.setItem(PREFIX + key, String(next))
      } catch { /* private mode — the choice still applies for this session */ }
    },
    [key],
  )

  return [value, set] as const
}
