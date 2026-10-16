/**
 * BAR HEIGHTS FOR THE PAIRED SPARKLINE, in pixels.
 *
 * Its own module because `PairedSparkline.tsx` exports a component and
 * eslint's `react-refresh/only-export-components` is right that a file should
 * not be both — and because the reason these are px rather than per cent is
 * worth reading before anyone "tidies" them back.
 */
/**
 * The band's height in px, and the tallest a bar may be inside it.
 *
 * **Both in px, and that is the fix.** The bars used to be sized as a
 * PERCENTAGE — `height: ${(count / max) * 100}%` — against a column that is a
 * flex child with no height of its own, so the percentage had no containing
 * block to resolve against and every real bar computed to **0px**. The only
 * marks that drew were the empty weeks, which used an absolute `6px` stub.
 *
 * So the page's signature visual was showing bars exactly where there was no
 * data and nothing where there was: measured on the demo journal, the five
 * weeks holding 1, 2, 2, 1, 3 and 5 urges all rendered at `h: 0` while the two
 * zero-weeks rendered at 6. It reads as a chart that failed to draw, which is
 * how it survived a screenshot — and CLAUDE.md's "a chart is not empty because
 * a screenshot says so" is what sent me to count the DOM instead.
 *
 * Absolute units need no containing block, so this cannot come back.
 */
export const BAND_PX = 96
/** Leaves room for the reset dot above the tallest bar. */
const BAR_MAX_PX = 84
/** A zero week, drawn as a visible stub rather than as nothing. */
const STUB_PX = 6

/** The bar height for a week, in px. */
export function barHeight(count: number, max: number): number {
  if (count <= 0) return STUB_PX
  return Math.max(STUB_PX, Math.round((count / Math.max(1, max)) * BAR_MAX_PX))
}
