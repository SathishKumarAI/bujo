// Catppuccin Mocha hex values, keyed by token name — the static fallback used in
// tests / SSR and before the live theme palette is read. For inline styles where
// Tailwind's static scanner can't see runtime-built class names.
export const CAT: Record<string, string> = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
}

// Per-theme palettes (mirrors the `--color-*` blocks in index.css). Charts need
// concrete colors, not `var()`, so `cat()` resolves against the active theme's
// map. Mocha is the base/fallback (`CAT`); the rest override it.
const THEME_PALETTES: Record<string, Record<string, string>> = {
  mocha: CAT,
  latte: {
    text: '#202124', subtext1: '#3c4043', subtext0: '#5f6368', overlay2: '#9aa0a6', overlay1: '#656a6e', overlay0: '#5f6368',
    surface2: '#dadce0', surface1: '#e8eaed', surface0: '#f1f3f4', base: '#f8f9fa', mantle: '#ffffff', crust: '#f1f3f4',
    mauve: '#6c4cf0', lavender: '#7c5cff', blue: '#165fc1', sapphire: '#1967d2', sky: '#165fc1', teal: '#006d62',
    green: '#187232', red: '#b8291f', maroon: '#c5221f', peach: '#9b4c07', yellow: '#f29900', pink: '#d01884',
  },
  neon: {
    text: '#e6e6ff', subtext1: '#c4c4e8', subtext0: '#9d9dce', overlay2: '#8585b8', overlay1: '#6f6fa0', overlay0: '#585883',
    surface2: '#2e2e52', surface1: '#20203c', surface0: '#15152a', base: '#0a0a16', mantle: '#0c0c1c', crust: '#050509',
    mauve: '#c77dff', lavender: '#a78bfa', blue: '#4cc9f0', sapphire: '#36c5f0', sky: '#7df9ff', teal: '#2ee6c8',
    green: '#5dff9d', red: '#ff5d8f', maroon: '#ff7eb6', peach: '#ffb86c', yellow: '#ffe66d', pink: '#ff8ad8',
  },
  vscode: {
    text: '#d4d4d4', subtext1: '#cccccc', subtext0: '#b5b5b5', overlay2: '#9d9d9d', overlay1: '#9b9b9b', overlay0: '#979ca4',
    surface2: '#3e3e42', surface1: '#333337', surface0: '#2a2a2e', base: '#1f1f1f', mantle: '#181818', crust: '#141414',
    mauve: '#c586c0', lavender: '#b5a4e0', blue: '#569cd6', sapphire: '#4fc1ff', sky: '#9cdcfe', teal: '#4ec9b0',
    green: '#89d185', red: '#f14c4c', maroon: '#f48771', peach: '#ce9178', yellow: '#dcdcaa', pink: '#d16d9e',
  },
  dawn: {
    text: '#3a322a', subtext1: '#574d40', subtext0: '#6f6354', overlay2: '#8a7d6b', overlay1: '#6a6154', overlay0: '#6f6354',
    surface2: '#ddc9ad', surface1: '#ecdcc4', surface0: '#f4e9d6', base: '#faf3e7', mantle: '#fffdf8', crust: '#f1e6d2',
    mauve: '#974608', lavender: '#7c3aed', blue: '#2563eb', sapphire: '#1e40af', sky: '#0369a1', teal: '#0d6962',
    green: '#126c33', red: '#b21f1f', maroon: '#9f1239', peach: '#a13d08', yellow: '#ca8a04', pink: '#be185d',
  },
}

let activePalette: Record<string, string> = CAT

/** Select the palette `cat()` resolves against. Called synchronously from the
 *  store during render (resolving `system` → mocha/latte) so children — and the
 *  charts they render — pick up theme colors with no post-render flash. */
export function setActiveTheme(theme: string): void {
  activePalette = THEME_PALETTES[theme] ?? CAT
}

export function cat(name: string): string {
  return activePalette[name] || CAT[name] || CAT.mauve
}

// ── Contrast helpers ────────────────────────────────────────────────────────
//
// The `Pill` doc predicted this: "Now that every pill reads its colour from
// here, that is a one-file fix when I1 is decided, instead of thirty." This is
// that fix, and it is here rather than in `Pill` because the accent-on-its-own-
// wash pairing is not unique to pills.
//
// The problem is structural, not a bad palette. Tinting a background with 13%
// of the SAME hue pulls the background luminance toward the text, so a mid-tone
// accent that clears 4.5:1 on the card can fail on its own wash. Darkening
// every accent until it clears would also darken every chart fill, and a
// non-text graphic only needs 3:1 — so the adjustment belongs at the point of
// use, on text, not in the palette.

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number]
}
const chan = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
const relLum = (c: [number, number, number]) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2])
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [l1, l2] = [relLum(a), relLum(b)]
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/**
 * An accent adjusted to be legible as TEXT on `bg`, at AA (4.5:1).
 *
 * Walks toward black on a light background and toward white on a dark one, so
 * it stays the same hue and only moves as far as the requirement demands.
 * Returns the accent untouched when it already passes, which is the common case
 * in the dark themes — this is almost entirely a light-theme correction.
 */
export function readableOn(accentHex: string, bgHex: string, target = 4.5): string {
  const bg = rgb(bgHex)
  const start = rgb(accentHex)
  if (contrast(start, bg) >= target) return accentHex
  const towardWhite = relLum(bg) < 0.18
  for (let step = 1; step <= 100; step++) {
    const k = step / 100
    const c = start.map((v) => (towardWhite ? v + (255 - v) * k : v * (1 - k))) as [number, number, number]
    if (contrast(c, bg) >= target) return toHex(c)
  }
  return towardWhite ? '#ffffff' : '#000000'
}

/** Composite `hex` at `alpha` over `bgHex` — what a wash actually paints. */
export function over(hex: string, bgHex: string, alpha: number): string {
  const [f, b] = [rgb(hex), rgb(bgHex)]
  return toHex(f.map((v, i) => v * alpha + b[i] * (1 - alpha)))
}

/**
 * Text colour for a SOLID accent fill. Picks whichever of the theme's darkest
 * and lightest neutrals contrasts better, instead of always reaching for
 * `crust` — which is near-white in the light themes and gave 2.02:1 on latte's
 * yellow.
 */
export function onAccent(accentHex: string, target = 4.6): string {
  // 4.6, not 4.5: `toHex` rounds each channel, so the colour actually painted
  // is a hair lighter than the one the loop measured — it landed on 4.48.
  const a = rgb(accentHex)
  const dark = cat('crust')
  const light = cat('text')
  const best = contrast(a, rgb(dark)) >= contrast(a, rgb(light)) ? dark : light
  // Picking the better of the two is not always enough. Dawn's yellow
  // (`#ca8a04`) beats BOTH its neutrals — its darkest is `#3a322a` at 4.28:1 —
  // so the winner still has to be pushed the rest of the way. `readableOn`
  // moves it toward black or white depending on which side of the accent it is
  // on, so the result stays the theme's neutral rather than jumping to pure
  // black on every mid-tone fill.
  return readableOn(best, accentHex, target)
}

/** Theme-aware recharts `<Tooltip contentStyle>`. A function (not a const) so it
 *  reads the live palette each render — otherwise it freezes on load-time Mocha. */
export function rechartsTooltip() {
  return {
    background: cat('mantle'),
    border: `1px solid ${cat('surface0')}`,
    borderRadius: 8,
    color: cat('text'),
  }
}

export const HABIT_COLORS = [
  'mauve', 'pink', 'red', 'peach', 'yellow', 'green', 'teal', 'sky', 'blue', 'lavender',
]

