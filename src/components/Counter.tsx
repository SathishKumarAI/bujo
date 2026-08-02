/**
 * Back-compat shim.
 *
 * `Ring` and `CountUp` moved to `components/ui/ring.tsx` (they are shared
 * primitives and every other primitive lives in `ui`), and `useCountUp` moved
 * to `lib/countUp.ts` (a file exporting both a hook and components breaks Fast
 * Refresh — that was this file's `react-refresh/only-export-components` error).
 *
 * Import from the new paths in new code. This shim exists so nothing breaks if
 * an import is missed; it can go once you're happy there are none.
 */
export { Ring, CountUp } from './ui/ring'
