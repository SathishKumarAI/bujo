import { useEffect, useRef, useState } from 'react'

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Animate a number from 0 → target with an ease-out curve.
 *
 * Lives in `lib/` rather than beside its components on purpose: a file that
 * exports both a hook and components breaks Fast Refresh, which is what the
 * `react-refresh/only-export-components` error on the old `Counter.tsx` was
 * reporting. Splitting the hook out fixes the lint error and puts the primitive
 * where the rest of the app can reach it.
 */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(reduced ? target : 0)
  const ref = useRef(0)
  useEffect(() => {
    // Reduced motion: no animation, and no setState either — the value is
    // derived on the way out instead. Writing state here would be a
    // synchronous setState in an effect body, which renders twice for no gain.
    if (reduced) return
    const from = ref.current
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const v = from + (target - from) * easeOut(t)
      ref.current = v
      setVal(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  // Derived, not stored: with reduced motion the hook is a pass-through, so it
  // always reports the current target even if `target` changes after mount.
  return reduced ? target : val
}
