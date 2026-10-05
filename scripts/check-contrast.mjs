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
 * On all four grounds an accent actually lands on: the page (`base`), the
 * raised surface (`surface0`), `mantle`, and the **card** — which is a
 * `color-mix()` with no literal to read, and so went unmeasured until COD-244.
 * See the `color-mix` section below for how it is resolved and what it covers.
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
 * `color-mix(in oklab, …)`, replicated — because `--card` is one (COD-244).
 *
 * The card is the ground most text in this app is painted on, and it was the
 * one ground this gate did not measure. The reason it was skipped is the
 * reason it mattered: `--card` has no literal anywhere for a static gate to
 * read, so the gate covered the three grounds that happen to be plain tokens,
 * which is not the same set as the three grounds that carry text.
 *
 * Replicated here rather than read from a browser. The ticket proposed a
 * computed read as the honest route, and it would be — but it turns a
 * sub-second static check into a browser gate, and the browser gates in this
 * repo are the ones that get cancelled and stop covering anything. A static
 * gate that runs inside `npm run verify` on every change is worth more than a
 * perfect one nobody can afford to run.
 *
 * The risk that trade buys is real and is the whole "arithmetically perfect
 * failure describing a pairing that exists nowhere" trap: if this maths
 * disagrees with the browser's, the gate measures a colour the app never
 * paints. So it was **checked against Chromium**, per theme, before being
 * trusted. Chromium returns a `color-mix` result as `oklab(L a b)`, so the
 * comparison is in OKLab with no sRGB round trip in the way:
 *
 *   theme    this file                    Chromium                     max |diff|
 *   mocha    0.252915  0.002555 -0.010988 0.252913  0.002566 -0.010982  1.13e-5
 *   neon     0.190894  0.005886 -0.025261 0.190892  0.005894 -0.025256  8.37e-6
 *   vscode   0.270825  0.000000  0.000000 0.270823  0.000012  0.000005  1.23e-5
 *   latte    0.944954 -0.000606 -0.001794 0.944948 -0.000563 -0.001775  4.30e-5
 *   dawn     0.934173  0.002864  0.017330 0.934169  0.002907  0.017348  4.27e-5
 *
 * Worst disagreement 4.3e-5, against an 8-bit step of 3.9e-3 — two orders of
 * magnitude of headroom. Re-check it if you touch this.
 *
 * ── What this does and does not catch, stated because it is not obvious ─────
 *
 * **`card` is not the binding ground in any theme today, and adding it changed
 * no number.** Resolved per theme it is `#212228` mocha, `#12121f` neon,
 * `#272727` vscode, `#ffffff` latte, `#fffdf8` dawn. In the dark themes it sits
 * between `base` and `surface0`, and accents are light on dark, so `surface0`
 * is already the worst case. In the light themes it is *identical to* `mantle`,
 * which was already measured.
 *
 * So this is not a hole that was leaking — the hand measurement in COD-244
 * (`text-teal` on card at 6.24 latte / 6.43 dawn) was right that nothing was
 * wrong. It is a hole that would leak the moment `--card` moves, and the whole
 * point of the elevation ladder is that it can. Armed by hand: changing the mix
 * from 95% to 70% turns this gate red with **18 failures** across mocha, neon
 * and vscode. A ground nobody measures is a ground that drifts silently.
 */
const okFwd = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)
function toOklab(hex) {
  const [r, g, b] = rgb(hex).map(lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s_,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s_,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s_,
  ]
}
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  const ch = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
  return '#' + ch.map((v) => {
    const n = Math.round(Math.min(255, Math.max(0, okFwd(v) * 255)))
    return n.toString(16).padStart(2, '0')
  }).join('')
}
/** `color-mix(in oklab, a <pct>%, b <100-pct>%)`. */
function mixOklab(a, b, pct) {
  const A = toOklab(a), B = toOklab(b), w = pct / 100
  return fromOklab([0, 1, 2].map((i) => A[i] * w + B[i] * (1 - w)))
}

/**
 * `--card` per theme, resolved the way `index.css` declares it.
 *
 * Two of the five themes do NOT use the mix — latte and dawn set
 * `--card: var(--color-mantle)` outright — so a single formula would have
 * measured a colour neither of them paints. The override list is spelled out
 * rather than derived: it is two lines of CSS, and a regex over them is a
 * second thing to keep in step with the first.
 */
const CARD_IS_MANTLE = new Set(['latte', 'dawn'])
const cardOf = (p, theme) =>
  CARD_IS_MANTLE.has(theme) ? p.mantle : (p.base && p.text ? mixOklab(p.base, p.text, 95) : null)

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
// `card` is resolved per theme by `cardOf`, not read as a token — see above.
const SURFACES = ['mantle', 'base', 'surface0', 'card']
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
    const grounds = SURFACES.map((s) => (s === 'card' ? cardOf(p, theme) : p[s]))
    const worst = Math.min(...grounds.map((g) => (g ? ratio(p[a], g) : Infinity)))
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
