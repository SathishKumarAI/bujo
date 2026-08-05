/**
 * Solve for AA-passing accent values, per theme.
 *
 * An accent in this app has to clear 4.5:1 in TWO places, and the second is the
 * one that was failing:
 *
 *   1. as text on the page/card background;
 *   2. as text on a 13% wash of ITSELF (`Pill tone="wash"`, the dominant idiom
 *      — accent text on `accent + '22'`). Tinting the background with the same
 *      hue raises the background luminance toward the text, so this is always
 *      the tighter constraint for a mid-tone accent.
 *
 * The search walks the colour toward black in sRGB, which preserves hue and
 * saturation ratio well enough for these (all are already saturated mid-tones)
 * and is a far smaller change than re-picking the palette by hand. It reports
 * the first step that satisfies both, so the accents stay as close to the
 * designed colour as the requirement allows.
 *
 *   node scripts/solve-contrast.mjs
 */

const hex = (c) => {
  const h = c.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
/** `accent + '22'` is 13.3% alpha, composited over the card. */
const wash = (fg, bg, alpha = 0x22 / 255) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha))

/** Walk toward black until both constraints clear. Returns the first that does. */
function solve(accent, backgrounds, target = 4.5) {
  const start = hex(accent)
  for (let step = 0; step <= 100; step++) {
    const k = 1 - step / 100
    const c = start.map((v) => v * k)
    const ok = backgrounds.every((bgHex) => {
      const bg = hex(bgHex)
      return ratio(c, bg) >= target && ratio(c, wash(c, bg)) >= target
    })
    if (ok) return { hex: toHex(c), darkenedBy: step }
  }
  return null
}

// The surfaces an accent actually lands on, per theme: the page, the card, and
// the raised surface. Whichever is lightest dominates for a dark-on-light theme.
const THEMES = {
  latte: { bgs: ['#ffffff', '#f8f9fa', '#f1f3f4'], tokens: { blue: '#1a73e8', sapphire: '#1967d2', sky: '#1a73e8', teal: '#00897b', green: '#1e8e3e', red: '#d93025', maroon: '#c5221f', peach: '#e8710a', yellow: '#f29900', pink: '#d01884', mauve: '#6c4cf0', lavender: '#7c5cff' } },
  dawn: { bgs: ['#fffdf8', '#faf3e7', '#f4e9d6'], tokens: { mauve: '#b45309', lavender: '#7c3aed', blue: '#2563eb', sapphire: '#1e40af', sky: '#0369a1', teal: '#0f766e', green: '#15803d', red: '#dc2626', maroon: '#9f1239', peach: '#ea580c', yellow: '#ca8a04', pink: '#be185d' } },
}

for (const [theme, { bgs, tokens }] of Object.entries(THEMES)) {
  console.log(`\n${theme}:`)
  for (const [name, value] of Object.entries(tokens)) {
    const before = Math.min(...bgs.map((b) => Math.min(ratio(hex(value), hex(b)), ratio(hex(value), wash(hex(value), hex(b))))))
    if (before >= 4.5) { console.log(`  ${name.padEnd(10)} ${value}  ok (${before.toFixed(2)})`); continue }
    const s = solve(value, bgs)
    const after = s ? Math.min(...bgs.map((b) => Math.min(ratio(hex(s.hex), hex(b)), ratio(hex(s.hex), wash(hex(s.hex), hex(b)))))) : 0
    console.log(`  ${name.padEnd(10)} ${value} -> ${s?.hex}   ${before.toFixed(2)} -> ${after.toFixed(2)}  (-${s?.darkenedBy}%)`)
  }
}

// Muted greys are plain text on a surface — no wash involved.
const GREYS = {
  latte: { v: { overlay1: '#80868b', overlay2: '#9aa0a6' }, bgs: ['#ffffff', '#f8f9fa', '#f1f3f4', '#e8eaed'] },
  dawn: { v: { overlay1: '#9c8f7c', overlay2: '#8a7d6b' }, bgs: ['#fffdf8', '#faf3e7', '#f4e9d6', '#ecdcc4'] },
  vscode: { v: { overlay1: '#858585', overlay0: '#6e7681' }, bgs: ['#1f1f1f', '#181818', '#2a2a2e', '#333337'] },
}
console.log('\nmuted greys (text on surface, no wash):')
for (const [theme, { v, bgs }] of Object.entries(GREYS)) {
  for (const [name, value] of Object.entries(v)) {
    const dark = lum(hex(bgs[0])) < 0.2
    const before = Math.min(...bgs.map((b) => ratio(hex(value), hex(b))))
    if (before >= 4.5) { console.log(`  ${theme}.${name.padEnd(9)} ${value}  ok (${before.toFixed(2)})`); continue }
    // Light themes darken the grey; dark themes must LIGHTEN it instead.
    let out = null
    for (let step = 0; step <= 100; step++) {
      const k = step / 100
      const c = hex(value).map((x) => (dark ? x + (255 - x) * k : x * (1 - k)))
      if (bgs.every((b) => ratio(c, hex(b)) >= 4.5)) { out = { hex: toHex(c), step }; break }
    }
    const after = out ? Math.min(...bgs.map((b) => ratio(hex(out.hex), hex(b)))) : 0
    console.log(`  ${theme}.${name.padEnd(9)} ${value} -> ${out?.hex}   ${before.toFixed(2)} -> ${after.toFixed(2)}  (${dark ? '+' : '-'}${out?.step}%)`)
  }
}
