/**
 * PALETTE GATE · the accents must be legible, and there must only be one of them.
 *
 * Three checks, all static. None opens a browser, and that is the point: the
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
 *
 * ── 3 · Accents drawn in one scale must be separable ────────────────────────
 *
 * **Contrast ratio is the wrong metric for this and always was.** Two colours
 * of equal luminance have a ratio of 1.0 whatever their hue, so check 2 above
 * is blind to a scale collapsing into one colour. Separation is `dE` — the
 * Euclidean distance in CIE L*a*b*, which models how different two colours
 * *look* rather than how bright they are.
 *
 * The check is over **declared scales, not all pairs**. An all-pairs floor
 * fights the palette's own design: Catppuccin ships rosewater/flamingo/pink as
 * one family and sky/sapphire/blue as another, and those are meant to be
 * neighbours. What matters is the accents a single control paints *at the same
 * time*, where the reader has to tell one from another. So each scale below is
 * a place in the app where that happens, and adding a scale to the app means
 * adding it here.
 *
 * Floor is 15. Measured, the scales that are fine sit at 19.5–78.7 and the one
 * that was broken sat at **8.6** — dawn's gym set-kind markers, where `mauve`
 * is amber by design (`#974608`, dawn's primary accent is warm) and `peach` is
 * `#a13d08`, i.e. the same brown. 15 has headroom on both sides of that gap.
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

// CIE L*a*b* (D65) and CIE76 dE. Deliberately the simple 1976 distance rather
// than CIEDE2000: this is a floor with a wide margin either side of it, not a
// perceptual ranking, and a formula someone can read in eight lines is one they
// will trust when it goes red.
const fLab = (t) => (t > 216 / 24389 ? Math.cbrt(t) : t * (841 / 108) + 4 / 29)
function lab(hex) {
  const [r, g, b] = rgb(hex).map(lin)
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const [fx, fy, fz] = [fLab(X), fLab(Y), fLab(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) }

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

// 3 · scale separation.
//
// Each entry is a place in the app that paints several accents at once, where
// the reader has to tell them apart. Add a scale here when you add one there —
// this is a hand-written list resolved against another source, the shape this
// repo has been bitten by, so the file:line is named for each.
const SCALES = {
  'severity · Plan migration pill': ['red', 'peach', 'yellow'],
  'aging · Plan overdue buckets': ['yellow', 'peach', 'pink', 'red'],
  'set kind · gym SessionLogger': ['mauve', 'blue', 'maroon'],
  'strength bands · RelativeStrengthCard': ['mauve', 'blue', 'green', 'yellow', 'overlay0'],
}

/**
 * Scales that are known to fail and are not enforced yet, with the ticket that
 * will fix them.
 *
 * Printed loudly on every run rather than left out of `SCALES`, because
 * "not on the list" is exactly how this repo has lost coverage three times:
 * the a11y gate's `VIEWS`, its empty journal, and its closed folds. An
 * exemption you can see is a different thing from an omission you cannot.
 */
const UNENFORCED = {
  'urge tags · NoFap URGE_COLORS (COD-116)': ['mauve', 'teal', 'peach', 'sky', 'green', 'pink', 'yellow', 'lavender', 'sapphire', 'flamingo'],
}

const DE_FLOOR = 15
console.log(`\naccents drawn together, worst pair per scale — floor dE ${DE_FLOOR}\n`)
function worstPair(palette, members) {
  let worst = Infinity, pair = ''
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const [a, b] = [members[i], members[j]]
      if (!palette[a] || !palette[b]) continue // a theme that does not override it inherits mocha
      const d = dE(palette[a], palette[b])
      if (d < worst) { worst = d; pair = `${a}/${b}` }
    }
  }
  return { worst, pair }
}
for (const [name, members] of Object.entries(SCALES)) {
  const cells = []
  for (const theme of themes) {
    const p = { ...ts.mocha, ...ts[theme] }
    const { worst, pair } = worstPair(p, members)
    if (worst < DE_FLOOR) problems.push(`${theme} · ${name}: ${pair} are dE ${worst.toFixed(1)} apart — needs ${DE_FLOOR}`)
    cells.push(`${theme} ${worst.toFixed(1)}${worst < DE_FLOOR ? '!' : ''}`)
  }
  console.log(`  ${name.padEnd(40)} ${cells.join('  ')}`)
}
for (const [name, members] of Object.entries(UNENFORCED)) {
  const cells = themes.map((theme) => {
    const { worst, pair } = worstPair({ ...ts.mocha, ...ts[theme] }, members)
    return `${theme} ${worst.toFixed(1)} (${pair})`
  })
  console.log(`\n  NOT ENFORCED YET · ${name}\n    ${cells.join('\n    ')}`)
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`\nPalette check passed — ${themes.length} themes, ${ACCENTS.length} accents, both palettes agree.`)
