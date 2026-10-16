import { cat } from '../../lib/colors'

/**
 * THE HOUSE STYLE FOR A RECHARTS AXIS · so a chart stops looking like a chart
 * library's default.
 *
 * WHAT THIS FILE OWNS: grid, axis and tick appearance, and how a big number is
 * drawn on an axis.
 * WHAT IT DOES NOT OWN: which chart to draw, its colours, or its data.
 *
 * Reported as *"some of the charts are looking like not great, they are
 * looking like just a generic slop"* — correctly, and the four on Strength
 * were the clearest case: a full dashed grid in both directions
 * (`strokeDasharray="3 3"`), a visible axis line AND tick marks on both axes,
 * default tick text, and `12000` written out in full on a 60px gutter. Six
 * decorations around a trend you then have to find.
 *
 * What the house style is, and why each part:
 *
 * | Rule | Why |
 * |---|---|
 * | Horizontal gridlines only, solid, one pixel | A vertical rule repeats the x labels under them. The dash was texture, and texture at 11px reads as noise |
 * | No axis line, no tick marks | The gridline already says where the value is; the axis line is a second edge beside the card's own border |
 * | `subtext0` for tick text | `overlay0` on a card is **2.57:1** — one of the sixteen violations the armed a11y gate found |
 * | Compact figures (`12k`) | `12,000` needs ~56px of gutter, which is 8% of a 678px panel spent on zeroes |
 * | A reference line where the chart has a THRESHOLD | A trend with no reference is a shape; with one it is a verdict |
 *
 * **Functions, not constants.** `cat()` resolves against the theme at render
 * time (`setActiveTheme`), so a frozen object would paint mocha's surfaces in
 * latte — the inline-style theme trap in CLAUDE.md, which has produced a
 * contrast reading wrong by 3.5x before.
 *
 * Applied to Strength's four charts first. There are **39 `CartesianGrid`
 * call sites** in this app and most already pass `vertical={false}`; the rest
 * are a migration, not a rewrite, and doing them in this change would bury a
 * measured fix under a sweep.
 */

/** `<CartesianGrid {...chartGrid()} />` */
export const chartGrid = () => ({
  stroke: cat('surface0'),
  vertical: false,
})

/** `<XAxis dataKey="x" {...chartAxis()} />` — and the same for `YAxis`. */
export const chartAxis = () => ({
  stroke: cat('surface1'),
  tickLine: false as const,
  axisLine: false as const,
  tick: { fill: cat('subtext0'), fontSize: 11 },
  /*
    Twenty dated points on a 600px axis is twenty labels at 11px with nothing
    between them — measured on the effort trend, where `10-05 … 10-14` ran
    together into one grey band. Recharts drops labels to honour this gap, so a
    dense series thins itself and a sparse one is unaffected.
  */
  minTickGap: 16,
})

/**
 * `12,480` → `12.5k`, `980` → `980`.
 *
 * Axis gutters are paid for in panel width: the left margin on these charts is
 * negative precisely because the full number does not fit, which clips the
 * first tick instead of shortening it.
 */
export const compactNum = (n: number): string => {
  const abs = Math.abs(n)
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`
  if (abs >= 1_000) return `${Math.round(n / 100) / 10}k`
  return String(Math.round(n))
}
