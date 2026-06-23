import { cat } from '../lib/colors'

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
 * Per-side plate visualiser: a horizontal stack of discs from platesPerSide()
 * output, heaviest (centre of the bar) first. Disc height scales with weight so
 * the loadout reads at a glance, like a real barbell loaded from the sleeve in.
 */
export function PlateStack({ plates, unit = 'kg' }: { plates: number[]; unit?: string }) {
  if (plates.length === 0) return null
  const max = Math.max(...plates)
  // Disc geometry: a thin bar sleeve on the left, discs growing rightward.
  const discW = 13
  const gap = 3
  const height = 64
  const sleeve = 10
  const width = sleeve + plates.length * (discW + gap)
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Per side: ${plates.map((p) => `${p}${unit}`).join(', ')}`}
      className="overflow-visible"
    >
      {/* bar sleeve */}
      <rect x={0} y={height / 2 - 3} width={sleeve} height={6} rx={2} fill={cat('overlay0')} />
      {plates.map((p, i) => {
        const h = Math.max(18, (p / max) * height)
        const x = sleeve + i * (discW + gap)
        return (
          <g key={i}>
            <rect
              x={x}
              y={(height - h) / 2}
              width={discW}
              height={h}
              rx={3}
              fill={plateColor(p)}
            />
            <text
              x={x + discW / 2}
              y={height / 2 + 3}
              textAnchor="middle"
              className="font-bold"
              fill="#11111b" /* Catppuccin Mocha crust — dark label on the colored disc */
              fontSize={8}
            >
              {p}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
