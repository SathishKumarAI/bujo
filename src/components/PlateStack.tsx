import { cat } from '../lib/colors'

/**
 * A LOADED BARBELL, DRAWN LIKE A BARBELL · side elevation, real proportions.
 *
 * WHAT THIS FILE OWNS: how a loadout looks.
 * WHAT IT DOES NOT OWN: what to load (`platesPerSide` in `lib/fitness.ts`).
 *
 * ── What it was, and why it read as fake ──────────────────────────────────
 *
 * Nine flat `rx=3` rectangles, one per denomination, each a different accent
 * from the palette — red, peach, mauve, blue, green, teal, pink, yellow,
 * lavender — with the weight printed inside at 8px, and every disc the same
 * width with its height scaled by `p / max`. Reported, fairly, as looking like
 * slop. Three things were wrong and all three are about fidelity rather than
 * polish:
 *
 * | Was | Why it read wrong |
 * |---|---|
 * | Every disc the same thickness | A 2.5 and a 25 are the same object at different sizes; what tells them apart on a real bar is that the 25 is **three times thicker** as well as taller |
 * | Height from `p / max` | So a bar loaded with only 5s drew full-height discs. A plate's size is absolute — a 5kg is 250mm whatever else is on the bar |
 * | Nine palette accents | That is the whole palette on one widget, which is the six-colour stats row `DESIGN.md` argues against, and it means nothing: there is no convention where 10kg is teal |
 *
 * ── What it is now ────────────────────────────────────────────────────────
 *
 * **Real diameters and real thicknesses**, in millimetres, scaled once. A
 * 25/20kg plate is 450mm and a 1.25 is 160mm, so the stack steps down the way
 * it does on the rack, and a bar with three 5s is visibly a light bar.
 *
 * **The IWF colour code**, mapped onto the nearest palette token: red 25, blue
 * 20, yellow 15, green 10, white 5, red 2.5, chrome 1.25 — a convention any
 * lifter reads without a legend, instead of nine arbitrary hues. The pound
 * denominations follow the same standard where it exists and the US iron
 * convention where it does not.
 *
 * **Shading that implies a cylinder, not a sticker.** Each disc is a vertical
 * gradient (light at the top, its own colour in the middle, dark at the
 * bottom) plus a one-pixel specular edge where the rim catches the light and a
 * darker trailing edge. That is three SVG elements per plate and no dependency
 * — the ask was "make it look real", and a cylinder seen from the side is a
 * gradient with two edges.
 *
 * **The highlight is literally white and the shadow literally black**, not
 * `text` over `crust`. The first version used those tokens and was lit from
 * BELOW in every light theme, because `text` is near-black in latte and dawn
 * while `crust` is near-white — the `cat('crust')` trap in a new costume,
 * caught by screenshotting two themes side by side. The room's light is not a
 * palette entry.
 *
 * **The sleeve passes THROUGH the stack.** Shaft and sleeve are drawn first,
 * discs over them, then the collar clamp over the inner edge — which is the
 * order the real object is assembled in, and the reason the plates look
 * threaded rather than stacked beside a line.
 *
 * **No numbers on the discs.** Side-on you cannot see a plate's face, so a
 * number there is the one detail that gives away a drawing. The figures live
 * in the sentence under the card ("Per side: 25 · 10 · 2.5 = 100 kg loaded")
 * and in this SVG's `aria-label`, which is where a screen reader needs them.
 *
 * Each disc still slides on from the outside with a stagger (`plate-load` /
 * `plate-load-l`), keyed by the loadout so a changed target reads as
 * re-racking rather than as a cut.
 */

/**
 * Per denomination: the colour token, the diameter and the thickness.
 *
 * Diameters are the real ones in millimetres. Thickness is the real plate's
 * width where it is standardised (a 25kg competition disc is 65mm) and a
 * plausible iron equivalent where it is not. Both matter: height alone makes a
 * stack of small plates look like a stack of coins.
 */
const PLATE_SPEC: Record<number, { token: string; mm: number; thick: number }> = {
  // ── kilograms · IWF colour code ──
  25: { token: 'red', mm: 450, thick: 65 },
  20: { token: 'blue', mm: 450, thick: 56 },
  15: { token: 'yellow', mm: 400, thick: 48 },
  10: { token: 'green', mm: 350, thick: 40 },
  5: { token: 'text', mm: 250, thick: 34 },
  2.5: { token: 'maroon', mm: 190, thick: 28 },
  1.25: { token: 'overlay2', mm: 160, thick: 23 },
  // ── pounds · US iron ──
  45: { token: 'blue', mm: 450, thick: 62 },
  35: { token: 'yellow', mm: 432, thick: 52 },
  // 25lb is green in the IWF-derived sets and this keeps it distinct from 25kg
  // only by unit — which is correct, because they are different plates that
  // happen to share a number.
}

/**
 * Resolve a plate weight to its hex colour (stable per denomination).
 *
 * Kept exported: `lib/fitness.test.ts` asserts it is stable, distinct per
 * denomination and returns a hex, which is the contract the visual relies on.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure colour-map lookup co-located with its visualiser
export function plateColor(plate: number): string {
  return cat(PLATE_SPEC[plate]?.token ?? 'mauve')
}

/** Everything the renderer needs for one disc, with a fallback for an oddity. */
const specOf = (p: number) => PLATE_SPEC[p] ?? { token: 'mauve', mm: 300, thick: 36 }

/** 450mm — the biggest plate — becomes 96px tall. */
const MM = 96 / 450
/** Thickness is compressed harder than diameter, or a loaded bar is 600px wide. */
const THICK = 0.26

export function Barbell({ plates, unit = 'kg', bar }: { plates: number[]; unit?: string; bar?: number }) {
  const height = 108
  const midY = height / 2
  const widths = plates.map((p) => Math.max(5, Math.round(specOf(p).thick * THICK)))
  const stack = widths.reduce((a, w) => a + w + 1, 0)
  const sleeveLen = Math.max(30, stack + 16)
  const shaft = 92
  const width = 2 * sleeveLen + shaft
  const loadKey = plates.join(',')

  /** Offsets so the heaviest disc sits against the collar on both sides. */
  const offsets: number[] = []
  let run = 0
  for (const w of widths) { offsets.push(run); run += w + 1 }

  const disc = (p: number, i: number, side: 'l' | 'r') => {
    const { token } = specOf(p)
    const w = widths[i]
    const h = Math.max(22, Math.round(specOf(p).mm * MM))
    const x = side === 'l' ? sleeveLen - w - offsets[i] : sleeveLen + shaft + offsets[i]
    const y = midY - h / 2
    return (
      <g
        key={`${side}-${i}`}
        className={side === 'l' ? 'plate-load-l' : 'plate-load'}
        style={{ animationDelay: `${i * 45}ms` }}
      >
        {/* The body: a vertical gradient per colour, so the disc reads as a
            cylinder lit from above rather than as a flat tag. */}
        <rect x={x} y={y} width={w} height={h} rx={Math.min(3, w / 2)} fill={`url(#plate-${token})`} />
        {/* The rim catching the light, and the trailing edge in shadow. One
            pixel each: more than that and it is a border, not a highlight. */}
        <rect x={x} y={y} width={1} height={h} rx={0.5} fill="#fff" opacity={0.2} />
        <rect x={x + w - 1} y={y} width={1} height={h} rx={0.5} fill="#000" opacity={0.35} />
        {/* The hub, where the disc meets the sleeve — a real plate is thicker
            there, and this is what stops a tall disc looking like a domino. */}
        <rect x={x} y={midY - 7} width={w} height={14} fill="#000" opacity={0.12} />
      </g>
    )
  }

  // One gradient per colour actually on the bar, not one per disc.
  const tokens = [...new Set(plates.map((p) => specOf(p).token))]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: 440 }}
      role="img"
      aria-label={
        plates.length
          ? `Barbell${bar ? `, ${bar}${unit} bar` : ''}: ${plates.map((p) => `${p}${unit}`).join(', ')} per side`
          : `Empty bar${bar ? `, ${bar}${unit}` : ''}`
      }
      className="overflow-visible"
    >
      <defs>
        {tokens.map((t) => (
          /*
            LIGHT IS WHITE AND SHADOW IS BLACK, LITERALLY — not `text` over
            `crust`.
            The first version shaded with those two tokens and it was upside
            down in every light theme: `text` is near-BLACK in latte and dawn
            and `crust` is near-white, so the top of each plate went dark and
            the bottom went pale — a disc lit from below. Measured by
            screenshotting mocha and latte side by side, which is the only way
            this class of bug has ever been caught here (`cat('crust')` is not
            a foreground, CLAUDE.md). A specular highlight does not belong to
            the palette; it is the room's light, and it is the same colour in
            every theme.
          */
          <linearGradient key={t} id={`plate-${t}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.22} />
            <stop offset="9%" stopColor={cat(t)} stopOpacity={0.97} />
            <stop offset="62%" stopColor={cat(t)} stopOpacity={1} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.3} />
          </linearGradient>
        ))}
        {/* Steel: brightest just above the centre line, which is where a round
            bar reflects the room. */}
        <linearGradient id="plate-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cat('overlay0')} />
          <stop offset="35%" stopColor={cat('overlay2')} />
          <stop offset="60%" stopColor={cat('overlay1')} />
          <stop offset="100%" stopColor={cat('surface1')} />
        </linearGradient>
      </defs>

      {/* Sleeves and shaft FIRST, so the discs sit on them. */}
      <rect x={0} y={midY - 5.5} width={sleeveLen} height={11} rx={2} fill="url(#plate-steel)" />
      <rect x={sleeveLen + shaft} y={midY - 5.5} width={sleeveLen} height={11} rx={2} fill="url(#plate-steel)" />
      <rect x={sleeveLen} y={midY - 3} width={shaft} height={6} fill="url(#plate-steel)" />
      {/* Knurling, as four quiet ticks rather than a texture: at this scale a
          hatch pattern is noise, and the grip is the one part of the bar a
          lifter actually recognises. */}
      {[0.22, 0.34, 0.66, 0.78].map((f) => (
        <rect key={f} x={sleeveLen + shaft * f} y={midY - 3} width={7} height={6} fill={cat('surface2')} opacity={0.75} />
      ))}

      <g key={loadKey}>
        {plates.map((p, i) => disc(p, i, 'l'))}
        {plates.map((p, i) => disc(p, i, 'r'))}
      </g>

      {/* The collars, over the inner edge of each stack — the order the real
          thing is assembled in, and what makes the plates look threaded. */}
      <rect x={sleeveLen - 3} y={midY - 10} width={6} height={20} rx={1.5} fill="url(#plate-steel)" />
      <rect x={sleeveLen + shaft - 3} y={midY - 10} width={6} height={20} rx={1.5} fill="url(#plate-steel)" />

      {bar != null && (
        <text x={sleeveLen + shaft / 2} y={midY - 14} textAnchor="middle" fill={cat('subtext0')} fontSize={9}>
          {bar}{unit} bar
        </text>
      )}
    </svg>
  )
}
