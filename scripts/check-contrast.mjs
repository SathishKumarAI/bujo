/**
 * PALETTE GATE · the accents must be legible, and there must only be one of them.
 *
 * Two checks, both static. Neither opens a browser, and that is the point: the
 * rendering gates in this repo can only fail on what the demo journal happens
 * to render, and this project has now been bitten by that three times —
 * `npm run a11y` against an empty journal (COD-28), axe never opening a
 * collapsed fold, and, found while writing this, **a ternary branch the demo
 * data never takes**. Plan's migration pill picks `red / peach / yellow` by
 * migration count and the seed only ever produces counts of 2, 3 and 4, so the
 * yellow arm has never once been painted in CI. A token check has no such
 * blind spot: it grades the palette, not the screenshot.
 *
 *   node scripts/check-contrast.mjs
 *
 * ── 1 · The two palettes must agree ─────────────────────────────────────────
 *
 * Every theme is written down twice: as `--color-*` custom properties in
 * `src/index.css` (which Tailwind utilities and CSS resolve) and as a literal
 * map in `src/lib/colors.ts` (which `cat()` resolves for inline styles and
 * chart libraries that need a concrete value). Nothing kept them in step, and
 * they had drifted: vscode's `red` was solved by hand in #157 and applied to
 * `colors.ts` only, so `text-red` painted `#f14c4c` and `cat('red')` painted
 * `#f57979` **on the same screen**, depending only on whether the call site
 * used a class or an inline style.
 *
 * ── 2 · Every accent clears 4.5:1 as text ───────────────────────────────────
 *
 * On all three surfaces an accent actually lands on: the card (`mantle`), the
 * page (`base`), and the raised surface (`surface0`).
 *
 * 4.5 rather than 3.0 for everything, including tokens currently used only as
 * fills, because the palette does not know how it will be used and the next
 * call site is a `style={{ color: cat(x) }}` away. The two light-theme yellows
 * were at **2.02 and 2.44**, which fails the 3.0 non-text floor as well — they
 * were not merely bad as text, they were bad as bands on a chart.
 *
 * This does NOT check the accent-on-its-own-wash idiom. That one is answered at
 * the point of use by `washStyle()` in `lib/colors.ts`, because the answer
 * depends on the surface underneath and a palette value cannot know it.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

const rgb = (h) => {
  let s = h.replace('#', '')
  if (s.length === 3) s = s.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const ratio = (a, b) => { const L = [lum(rgb(a)), lum(rgb(b))]; return (Math.max(...L) + 0.05) / (Math.min(...L) + 0.05) }

/**
 * `@theme { … }` carries mocha; `:root[data-theme='x'] { … }` carries the rest.
 * Bare `:root` blocks hold semantic aliases (`--background: var(--color-base)`)
 * and contribute no literals, so they fall through harmlessly.
 */
function parseCss(css) {
  const out = {}
  for (const b of css.matchAll(/(?:@theme|:root(?:\[data-theme='([a-z]+)'\])?)\s*\{([\s\S]*?)\n\}/g)) {
    const theme = (out[b[1] ?? 'mocha'] ??= {})
    for (const m of b[2].matchAll(/--color-([a-z0-9]+):\s*(#[0-9a-fA-F]{3,8})\b/g)) theme[m[1]] = m[2].toLowerCase()
  }
  return out
}

/** `CAT` is mocha; `THEME_PALETTES` holds the overrides, one object per theme. */
function parseTs(ts) {
  const out = {}
  const cat = ts.slice(ts.indexOf('export const CAT'), ts.indexOf('THEME_PALETTES'))
  out.mocha = {}
  for (const m of cat.matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)) out.mocha[m[1]] = m[2].toLowerCase()
  const body = ts.slice(ts.indexOf('THEME_PALETTES'), ts.indexOf('let activePalette'))
  for (const b of body.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    const t = {}
    for (const m of b[2].matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)) t[m[1]] = m[2].toLowerCase()
    if (Object.keys(t).length) out[b[1]] = t
  }
  return out
}

const css = parseCss(readFileSync(join(SRC, 'index.css'), 'utf8'))
const ts = parseTs(readFileSync(join(SRC, 'lib', 'colors.ts'), 'utf8'))

const ACCENTS = ['rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender']
const SURFACES = ['mantle', 'base', 'surface0']
const FLOOR = 4.5

const problems = []

// 1 · divergence
for (const [theme, tokens] of Object.entries(ts)) {
  const c = css[theme]
  if (!c) { problems.push(`no \`--color-*\` block in index.css for theme "${theme}"`); continue }
  for (const [name, value] of Object.entries(tokens)) {
    if (c[name] && c[name] !== value) {
      problems.push(`${theme}.${name}: index.css has ${c[name]}, lib/colors.ts has ${value} — one token, two colours`)
    }
  }
}

// 2 · contrast floor. Resolved the way the app resolves it: a theme inherits
// mocha for anything it does not override, which is exactly what `cat()` does.
console.log(`accent as text, worst of ${SURFACES.join(' / ')} — floor ${FLOOR}\n`)
const themes = Object.keys(ts)
process.stdout.write(''.padEnd(9))
for (const a of ACCENTS) process.stdout.write(a.slice(0, 6).padStart(8))
console.log()
for (const theme of themes) {
  const p = { ...ts.mocha, ...ts[theme] }
  process.stdout.write(theme.padEnd(9))
  for (const a of ACCENTS) {
    if (!p[a]) { process.stdout.write('    -   '); continue }
    const worst = Math.min(...SURFACES.map((s) => (p[s] ? ratio(p[a], p[s]) : Infinity)))
    if (worst < FLOOR) problems.push(`${theme}.${a} (${p[a]}) is ${worst.toFixed(2)}:1 as text — needs ${FLOOR}`)
    process.stdout.write((worst.toFixed(2) + (worst < FLOOR ? '!' : ' ')).padStart(8))
  }
  console.log()
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`\nPalette check passed — ${themes.length} themes, ${ACCENTS.length} accents, both palettes agree.`)
