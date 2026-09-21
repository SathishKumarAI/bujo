/**
 * Option builders for `quickpick`'s chip groups.
 *
 * A separate module because `quickpick.tsx` exports components, and a file
 * that exports both a component and a plain function breaks fast refresh —
 * `react-refresh/only-export-components`, which `npm run verify` treats as an
 * error. Same reason `components/gym/setRow.ts` exists.
 */
/**
 * Duration chips, labelled like a person says them.
 *
 * Written inline at the first call site as
 * `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}`, which renders 90 minutes as
 * **"1.5h 30m"** — the hours are not floored, so the remainder is counted
 * twice. It reached a pushed branch because the expression reads as obviously
 * right; it took clicking the chip in a test to see it.
 *
 * Shared rather than fixed twice: the second caller was already copying the
 * broken line when this was written, which is how a third would have got it.
 */
export function durationOptions(mins: readonly number[]): { value: number; label: string }[] {
  return mins.map((m) => {
    const h = Math.floor(m / 60)
    const rest = m % 60
    return { value: m, label: h ? (rest ? `${h}h ${rest}m` : `${h}h`) : `${rest}m` }
  })
}
