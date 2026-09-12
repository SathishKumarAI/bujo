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
  // The three surfaces are the app's, not Catppuccin's — `index.css` deepened
  // them and this map was not updated, so `cat('mantle')` returned `#181825`
  // while the card it sat on painted `#141419`. A recharts tooltip is
  // positioned over a card and coloured from here, which is where you could
  // see it. `scripts/check-contrast.mjs` now fails on any such divergence.
  base: '#1a1a1f',
  mantle: '#141419',
  crust: '#0e0e12',
}

// Per-theme palettes (mirrors the `--color-*` blocks in index.css). Charts need
// concrete colors, not `var()`, so `cat()` resolves against the active theme's
// map. Mocha is the base/fallback (`CAT`); the rest override it.
const THEME_PALETTES: Record<string, Record<string, string>> = {
  mocha: CAT,
  latte: {
    text: '#202124', subtext1: '#3c4043', subtext0: '#5f6368', overlay2: '#9aa0a6', overlay1: '#656a6e', overlay0: '#5f6368',
    surface2: '#dadce0', surface1: '#e8eaed', surface0: '#f1f3f4', base: '#f8f9fa', mantle: '#ffffff', crust: '#f1f3f4',
    mauve: '#6c4cf0', lavender: '#7053e6', blue: '#165fc1', sapphire: '#1967d2', sky: '#165fc1', teal: '#006d62',
    green: '#187232', red: '#b8291f', maroon: '#c5221f', peach: '#9b4c07', yellow: '#816c03', pink: '#d01884',
    rosewater: '#985f4b', flamingo: '#b54a58',
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
    // `red` was VS Code's own `#f14c4c`, which is the one accent in this theme
    // that fails the app's dominant idiom — accent text on a 13% wash of
    // itself. Measured 3.97 on Plan's migration pill and 4.00 on the Stats
    // habit chips, against a 4.5 floor. Lightened 25% toward white: 4.65 on the
    // wash, 5.35 on `surface0`, 5.73 on the card.
    //
    // It was applied HERE ONLY for two sessions, so `text-red` (which resolves
    // `--color-red` in index.css) kept painting the original while `cat('red')`
    // painted this. `npm run contrast` fails on that now — edit both files.
    green: '#89d185', red: '#f57979', maroon: '#f48771', peach: '#ce9178', yellow: '#dcdcaa', pink: '#d374a3',
  },
  dawn: {
    text: '#3a322a', subtext1: '#574d40', subtext0: '#6f6354', overlay2: '#8a7d6b', overlay1: '#6a6154', overlay0: '#6f6354',
    surface2: '#ddc9ad', surface1: '#ecdcc4', surface0: '#f4e9d6', base: '#faf3e7', mantle: '#fffdf8', crust: '#f1e6d2',
    mauve: '#974608', lavender: '#7c3aed', blue: '#235edf', sapphire: '#1e40af', sky: '#0369a1', teal: '#0d6962',
    green: '#126c33', red: '#b21f1f', maroon: '#9f1239', peach: '#a13d08', yellow: '#7c6803', pink: '#be185d',
    rosewater: '#8c5d45', flamingo: '#ac4654',
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

/**
 * The accent-on-its-own-wash chip, as one inline style.
 *
 * `{ background: cat(x) + '22', color: cat(x) }` is the app's most-copied
 * idiom and its most-repeated bug: painting the background with 13% of the
 * text's own hue pulls the two together, so a mid-tone accent that clears 4.5
 * on the card fails on its wash. `Pill tone="wash"` has derived its foreground
 * from the composited background since I1; eight call sites still hand-wrote
 * the pair and did not.
 *
 * Whether they *failed* depended entirely on which token the call site happened
 * to pass — `cat(color)` in a loop over a habit palette is a different answer
 * per row — which is why this belongs in one function rather than in a review
 * checklist.
 *
 * Takes a token name or a resolved hex, because half the call sites hold one
 * and half the other — `TodayHabits` computes `h.avoid ? cat('red') :
 * cat(h.color)` before it knows it wants a wash. Requiring the token name
 * would have meant threading it through, and a helper you have to refactor
 * around is a helper people write around instead.
 *
 * `bg` is the surface the chip sits on. Passing it is always better than not;
 * what the DEFAULT should be is the interesting part, and it changed.
 *
 * It used to be `base`, on the argument that the page is the conservative one
 * of page-vs-card. That held only while the card was *darker* than the page,
 * which it was in every dark theme — and which was itself the elevation bug the
 * Layered Depth pass fixed. Chips now sit on `ink-2` (`surface0`) as often as
 * on the page, and `surface0` is a rung ABOVE both, so an accent solved for
 * `base` is solved against a ground darker than the one it lands on. Measured
 * after the fix: twenty axe violations, every one a wash pill, none of them
 * new markup — `#f38ba8` on `#4b3e51` at 4.3:1, which is `red@13%` over
 * `surface0` rather than over `base`.
 *
 * There is no single conservative ground, because the answer flips with the
 * theme's polarity: on a dark theme the *lighter* surface is harder for a
 * light accent, on a light theme the *darker* one is. So solve for both and
 * keep whichever demands more. Two `readableOn` walks instead of one, on a
 * function that runs per chip render — cheap, and it cannot be got wrong by a
 * call site that forgets to pass its surface.
 */
export function washStyle(accentOrToken: string, bg?: string): { background: string; color: string } {
  const accent = accentOrToken.startsWith('#') ? accentOrToken : cat(accentOrToken)
  const alpha = 0x22 / 255
  // Solved for BOTH plausible grounds when the call site does not say which.
  const painted = (bg ? [bg] : [cat('base'), cat('surface0')]).map((g) => rgb(over(accent, g, alpha)))
  const start = rgb(accent)
  const passes = (c: [number, number, number]) => painted.every((p) => contrast(c, p) >= 4.6)
  if (passes(start)) return { background: accent + '22', color: accent }
  // Same walk as `readableOn`, with the pass test widened to every ground. The
  // direction is decided by the darkest ground, so a light accent on a dark
  // theme still walks toward white rather than splitting the difference.
  const towardWhite = Math.min(...painted.map(relLum)) < 0.18
  for (let step = 1; step <= 100; step++) {
    const k = step / 100
    const c = start.map((v) => (towardWhite ? v + (255 - v) * k : v * (1 - k))) as [number, number, number]
    if (passes(c)) return { background: accent + '22', color: toHex(c) }
  }
  return { background: accent + '22', color: towardWhite ? '#ffffff' : '#000000' }
}

/**
 * HABIT CHIP · the one place that decides what a habit chip looks like in each
 * of its three states. DESIGN.md, "Colour discipline": **hue is identity, fill
 * is state.**
 *
 * The chips used to get this backwards. Every one of them was a 1px outline in
 * its own saturated hue at full strength, on a transparent ground — so nine
 * habits shouted equally, an untouched chip looked exactly as urgent as a
 * completed one, and the only difference between "clean" and "slipped" was
 * which loud colour the outline happened to be. A row of them read as a
 * colour-coded toolbar from 1997, which is not the information the strip
 * exists to give.
 *
 * | State | Surface | Text | Border |
 * |---|---|---|---|
 * | `off`  | neutral, one rung up | secondary | none |
 * | `on`   | the hue at a wash | the hue, tuned readable | none |
 * | `slip` | the danger hue at a wash | danger, tuned readable | 1px in the hue |
 *
 * `slip` is the only state in the system where a border carries meaning, which
 * is exactly why it still reads at a glance once nothing else has one. The
 * consequence, and the point: an untouched day is grey and a completed one
 * lights up.
 *
 * Text colour comes from `washStyle`, so it is measured against the wash the
 * chip actually lands on rather than assumed — the mistake that cost this
 * pairing AA in both light themes.
 */
export function habitChipStyle(
  state: 'off' | 'on' | 'slip',
  colorToken: string,
  bg = cat('base'),
): { background: string; color: string; borderColor: string } {
  if (state === 'off') {
    return {
      background: cat('surface0'),
      color: readableOn(cat('subtext0'), cat('surface0')),
      borderColor: 'transparent',
    }
  }
  const hue = state === 'slip' ? cat('red') : cat(colorToken)
  return { ...washStyle(hue, bg), borderColor: state === 'slip' ? hue : 'transparent' }
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

