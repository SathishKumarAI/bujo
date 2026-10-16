import { cat } from '../../lib/colors'
import { MACROS, type Targets } from '../../lib/nutritionReview'

/**
 * The day's macro bar.
 *
 * WHAT THIS FILE OWNS: the two-bar macro split against target.
 * WHAT IT DOES NOT OWN: what a food is (`lib/foods.ts`), the targets
 * (`lib/nutritionReview.ts`), or where either is placed.
 *
 * Lifted out of `views/Nutrition.tsx` when the page went onto the bar: the view
 * was 531 lines of which these were 200, and the workspace rule is that
 * changing one thing means opening one small file. `MacroBar` also takes its
 * targets as a prop now rather than reading a module constant, because the
 * constant is gone — they are `settings.nutritionTargets`.
 */

/**
 * One cuisine's foods as a row of action chips, each carrying its calorie
 * weight as a dot and its number as text.
 *
 * Two channels, deliberately: the dot is what makes "which of these is the
 * expensive one" answerable at a glance, and the kcal is what makes it
 * answerable exactly. Colour alone would fail anyone who cannot separate the
 * three hues — and the band names are spelled out in the legend beneath the
 * rows, so the dot is never the only place a band is stated.
 *
 * `tone` differs per cuisine only to separate the two rows from each other; it
 * carries no meaning about the food. The calorie meaning is the dot.
 */
/**
 * Two stacked bars: the day's ratio, and the target ratio beneath it. Reading
 * one against the other is the comparison; a single bar would only say what you
 * ate, which the numbers already do.
 */
export function MacroBar({ metric, totalG, targets }: { metric?: { protein?: number; carbs?: number; fat?: number }; totalG: number; targets: Targets }) {
  const targetTotal = targets.protein + targets.carbs + targets.fat
  /**
   * ONE denominator for both bars, or the comparison the card is named for
   * cannot happen.
   *
   * Each bar used to be normalised against its own total, so both were always
   * exactly full width. Eat a third of your target of everything and the two
   * bars render *identically* — the card said "against target" and drew a
   * picture in which hitting the target and missing it by 200g look the same.
   * Only the split was comparable, and the split is the thing that survives a
   * bad day unchanged.
   *
   * Scaling both to `max(today, target)` makes length mean amount again: short
   * bar means under, equal-length means on it, and the longer bar is whichever
   * is bigger. The segment proportions still carry the split, so nothing is
   * lost — the axis was simply missing.
   */
  const scale = Math.max(totalG, targetTotal) || 1
  const pct = (v: number) => (v / scale) * 100
  return (
    <div className="space-y-2">
      <Bar
        label="Today"
        segments={MACROS.map((mac) => ({
          key: mac.key,
          label: mac.label,
          grams: metric?.[mac.key] ?? 0,
          width: pct(metric?.[mac.key] ?? 0),
          color: mac.color,
        }))}
        empty={totalG === 0}
      />
      <Bar
        label="Target"
        segments={MACROS.map((mac) => ({
          key: mac.key,
          label: mac.label,
          grams: targets[mac.key],
          width: pct(targets[mac.key]),
          color: mac.color,
        }))}
        muted
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-2">
        {MACROS.map((mac) => (
          <li key={mac.key}>
            <span className="mr-1 inline-block h-2 w-2 rounded-control align-middle" style={{ background: cat(mac.color) }} />
            {mac.label} {metric?.[mac.key] ?? 0} / {targets[mac.key]} g
          </li>
        ))}
      </ul>
    </div>
  )
}

function Bar({ label, segments, empty = false, muted = false }: {
  label: string
  segments: { key: string; label: string; grams: number; width: number; color: string }[]
  empty?: boolean
  muted?: boolean
}) {
  return (
    <div>
      <p className="mb-0.5 text-micro text-fg-3">{label}</p>
      {/* The frame draws at zero data — an empty track still says "this is
          where the ratio goes", where a hidden bar says nothing at all. */}
      {/* Grams, not the rendered percentage. Now that both bars share one
          denominator, a segment's width is its share of whichever total is
          larger — a number that means nothing said out loud. Grams are what the
          legend below states and what the reader actually wants. */}
      <div className="flex h-4 overflow-hidden rounded-pill bg-ink-2" role="img" aria-label={
        empty ? `${label}: nothing logged yet`
          : `${label}: ${segments.map((s) => `${s.label} ${Math.round(s.grams)} g`).join(', ')}`
      }>
        {!empty && segments.map((s) => (
          <div key={s.key} style={{ width: `${s.width}%`, background: cat(s.color), opacity: muted ? 0.35 : 1 }} />
        ))}
      </div>
    </div>
  )
}
