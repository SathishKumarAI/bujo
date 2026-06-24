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
    text: '#202124', subtext1: '#3c4043', subtext0: '#5f6368', overlay2: '#9aa0a6', overlay1: '#80868b', overlay0: '#5f6368',
    surface2: '#dadce0', surface1: '#e8eaed', surface0: '#f1f3f4', base: '#f8f9fa', mantle: '#ffffff', crust: '#f1f3f4',
    mauve: '#6c4cf0', lavender: '#7c5cff', blue: '#1a73e8', sapphire: '#1967d2', sky: '#1a73e8', teal: '#00897b',
    green: '#1e8e3e', red: '#d93025', maroon: '#c5221f', peach: '#e8710a', yellow: '#f29900', pink: '#d01884',
  },
  neon: {
    text: '#e6e6ff', subtext1: '#c4c4e8', subtext0: '#9d9dce', overlay2: '#8585b8', overlay1: '#6f6fa0', overlay0: '#585883',
    surface2: '#2e2e52', surface1: '#20203c', surface0: '#15152a', base: '#0a0a16', mantle: '#0c0c1c', crust: '#050509',
    mauve: '#c77dff', lavender: '#a78bfa', blue: '#4cc9f0', sapphire: '#36c5f0', sky: '#7df9ff', teal: '#2ee6c8',
    green: '#5dff9d', red: '#ff5d8f', maroon: '#ff7eb6', peach: '#ffb86c', yellow: '#ffe66d', pink: '#ff8ad8',
  },
  vscode: {
    text: '#d4d4d4', subtext1: '#cccccc', subtext0: '#b5b5b5', overlay2: '#9d9d9d', overlay1: '#858585', overlay0: '#6e7681',
    surface2: '#3e3e42', surface1: '#333337', surface0: '#2a2a2e', base: '#1f1f1f', mantle: '#181818', crust: '#141414',
    mauve: '#c586c0', lavender: '#b5a4e0', blue: '#569cd6', sapphire: '#4fc1ff', sky: '#9cdcfe', teal: '#4ec9b0',
    green: '#89d185', red: '#f14c4c', maroon: '#f48771', peach: '#ce9178', yellow: '#dcdcaa', pink: '#d16d9e',
  },
  dawn: {
    text: '#3a322a', subtext1: '#574d40', subtext0: '#6f6354', overlay2: '#8a7d6b', overlay1: '#9c8f7c', overlay0: '#6f6354',
    surface2: '#ddc9ad', surface1: '#ecdcc4', surface0: '#f4e9d6', base: '#faf3e7', mantle: '#fffdf8', crust: '#f1e6d2',
    mauve: '#b45309', lavender: '#7c3aed', blue: '#2563eb', sapphire: '#1e40af', sky: '#0369a1', teal: '#0f766e',
    green: '#15803d', red: '#dc2626', maroon: '#9f1239', peach: '#ea580c', yellow: '#ca8a04', pink: '#be185d',
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

