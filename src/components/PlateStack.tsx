import { cat, onAccent } from '../lib/colors'

/**
 * Per-denomination plate → Catppuccin token, so each weight reads the same color
 * everywhere it's drawn. Covers both kg and lb gym denominations; unknown values
 * fall back to mauve (matching cat()'s own default).
 */
const PLATE_TOKEN: Record<number, string> = {
  45: 'red', // lb "big" plate
  35: 'peach',
  25: 'mauve',
  20: 'blue',
  15: 'green',
  10: 'teal',
  5: 'pink',
  2.5: 'yellow',
  1.25: 'lavender',
}

/** Resolve a plate weight to its hex color (stable per denomination). */
// eslint-disable-next-line react-refresh/only-export-components -- pure color-map lookup co-located with its visualiser
export function plateColor(plate: number): string {
  return cat(PLATE_TOKEN[plate] ?? 'mauve')
}

/**
 * Full symmetric barbell: shaft, two sleeves, and the per-side loadout mirrored
 * onto both, heaviest at the collar — drawn the way the bar looks on the rack,
 * not as an abstract per-side list. Recomputes on every keystroke of the
 * calculator above it, and each disc slides onto its sleeve from the outside
 * with a small stagger (`plate-load` / `plate-load-l` in index.css), so a
 * changed target reads as re-racking rather than a cut. The animation re-runs
 * because the group is keyed by the loadout — same plates, same key, no reflow.
 *
 * Disc height scales with weight within the fixed viewBox; the SVG itself
 * scales to its container (max 420px), so it works in the 340px act column and
 * on a phone without a scrollbar.
 */
export function Barbell({ plates, unit = 'kg', bar }: { plates: number[]; unit?: string; bar?: number }) {
  const max = Math.max(...plates, 1)
  const discW = 13
  const gap = 3
  const height = 72
  const sleeveLen = Math.max(26, plates.length * (discW + gap) + 10)
  const shaft = 84
  const width = 2 * sleeveLen + shaft
  const midY = height / 2
  const loadKey = plates.join(',')

  const disc = (p: number, i: number, side: 'l' | 'r') => {
    const h = Math.max(20, (p / max) * (height - 8))
    // Heaviest sits at the collar (shaft end) on both sides.
    const offset = i * (discW + gap)
    const x = side === 'l' ? sleeveLen - discW - offset : sleeveLen + shaft + offset
    return (
      <g
        key={`${side}-${i}`}
        className={side === 'l' ? 'plate-load-l' : 'plate-load'}
        style={{ animationDelay: `${i * 45}ms` }}
      >
        <rect x={x} y={midY - h / 2} width={discW} height={h} rx={3} fill={plateColor(p)} />
        <text x={x + discW / 2} y={midY + 3} textAnchor="middle" className="font-medium" fill={onAccent(plateColor(p))} fontSize={8}>
          {p}
        </text>
      </g>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: 420 }}
      role="img"
      aria-label={
        plates.length
          ? `Barbell${bar ? `, ${bar}${unit} bar` : ''}: ${plates.map((p) => `${p}${unit}`).join(', ')} per side`
          : `Empty bar${bar ? `, ${bar}${unit}` : ''}`
      }
      className="overflow-visible"
    >
      {/* sleeves */}
      <rect x={0} y={midY - 4} width={sleeveLen} height={8} rx={2} fill={cat('overlay0')} />
      <rect x={sleeveLen + shaft} y={midY - 4} width={sleeveLen} height={8} rx={2} fill={cat('overlay0')} />
      {/* shaft, slightly thinner, with collars at each end */}
      <rect x={sleeveLen} y={midY - 2.5} width={shaft} height={5} fill={cat('overlay1')} />
      <rect x={sleeveLen - 2} y={midY - 7} width={4} height={14} rx={1} fill={cat('overlay1')} />
      <rect x={sleeveLen + shaft - 2} y={midY - 7} width={4} height={14} rx={1} fill={cat('overlay1')} />
      {bar != null && (
        <text x={sleeveLen + shaft / 2} y={midY - 8} textAnchor="middle" fill={cat('overlay1')} fontSize={8}>
          {bar}{unit}
        </text>
      )}
      <g key={loadKey}>
        {plates.map((p, i) => disc(p, i, 'l'))}
        {plates.map((p, i) => disc(p, i, 'r'))}
      </g>
    </svg>
  )
}
