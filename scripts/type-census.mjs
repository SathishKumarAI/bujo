/**
 * TYPE CENSUS · what the app's text actually measures, on the rendered page.
 *
 *     BUJO_URL=http://localhost:4173 node scripts/type-census.mjs
 *
 * The type system is written down twice — the seven-step scale in
 * `styles/tokens.css` and the class names at ~2,000 call sites — and nothing
 * has ever compared either one to what a browser paints. Tailwind v4 does not
 * fail on a stale utility: `text-sm` after the scale reset emits **nothing**,
 * so the element silently inherits and the source still reads as if it had a
 * size. That is invisible to `tsc`, eslint, vitest, the build and the design
 * gate, all of which are green right now. So this reads `getComputedStyle`.
 *
 * One theme (type is theme-independent) and two viewports, because measure and
 * wrapping are not: a line that is 74 characters at 1280 is 34 at 390.
 *
 * What it flags, and why each is a readability rule rather than a taste:
 *
 * | Rule | Threshold | Why |
 * |---|---|---|
 * | off-scale size | not in {10,11,13,15,17,22,32} | a size nobody chose, usually an inherit from a dead class |
 * | tiny prose | wrapped sentence under 13px | `micro`/`caption` are data chrome, "never for prose" — tokens.css says so itself |
 * | tight leading | wrapped prose under 1.4 | the eye loses the line return; the scale's own body ratio is 1.55 |
 * | long measure | over 90 characters per line | past ~90 the return sweep starts missing lines |
 * | weight sprawl | not 400/500 | `index.css` says the scale allows two weights |
 * | family sprawl | outside sans/display/mono/hand | four families is already three more than most apps need |
 *
 * Reports, does not gate. The thresholds above are where a human would start
 * arguing, and a gate whose red is arguable is a gate people learn to ignore —
 * see the 52-cosmetic-hits draft of `clipped-text.mjs`. Run it, read it, fix
 * what is real.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('This script needs Playwright, which is deliberately not a dependency.')
  console.error('Run:  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL || 'http://localhost:4173'
const { VIEW_IDS } = await import('./view-ids.mjs')
const VIEWS = process.env.BUJO_VIEWS ? process.env.BUJO_VIEWS.split(',') : VIEW_IDS

/** The seven steps, in px at font-scale 1. Anything else is unplanned. */
const SCALE = [10, 11, 13, 15, 17, 22, 32]
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: VIEWPORTS[0] })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('bujo:onboarded', '1')
    if (!localStorage.getItem('bujo:data')) {
      localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
    }
  } catch { /* private mode */ }
})
const page = await ctx.newPage()

// Seed, then assert BOTH that this is bujo and that the journal is not empty.
// Either one missing turns every number below into a measurement of something
// else — see the header of `smoke-views.mjs` for the time that actually
// happened, and COD-28 for the empty-journal half.
await page.goto(`${BASE}?demo=1`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const boot = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
  return { title: document.title, main: !!document.querySelector('#main'), entries: d.entries?.length ?? 0 }
})
if (!boot.title.startsWith('Cadence') || !boot.main) {
  console.error(`Not bujo: title "${boot.title}", #main ${boot.main}. Is something else on ${BASE}?`)
  process.exit(1)
}
if (boot.entries === 0) {
  console.error('Demo data did not seed — every page would be measured empty.')
  process.exit(1)
}
console.log(`Booted ${boot.title} · ${boot.entries} entries · ${VIEWS.length} views x ${VIEWPORTS.length} viewports\n`)

async function settle() {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null, { timeout: 5000 },
  ).catch(() => {})
  await page.waitForTimeout(100)
}

/** Folds and lazy mounts hide text from this the same way they hid it from axe. */
async function reveal() {
  await page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
  await settle()
  for (let pass = 0; pass < 4; pass++) {
    const n = await page.evaluate(() => {
      const shut = [...document.querySelectorAll('#main [aria-expanded="false"]:not([aria-haspopup])')]
      for (const el of shut) el.click()
      return shut.length
    })
    if (n === 0) break
    await settle()
  }
}

/**
 * Every element inside `#main` that paints text of its own.
 *
 * Direct text children only: counting an ancestor's `innerText` would score the
 * card wrapper's font for its heading's words, and every wrapper in the tree
 * again for the same sentence.
 */
const collect = () => page.evaluate(() => {
  const rows = []
  // `#main` normally, but the Account view's signed-out state replaces the
  // whole shell — no header, no nav, no `<main>` at all — so scoping to #main
  // measured **zero text nodes** on it and the report showed a clean page that
  // had simply not been read. Fall back to the body when #main holds nothing.
  const root = (document.querySelector('#main')?.innerText ?? '').trim().length > 0
    ? document.querySelector('#main')
    : document.body
  for (const el of root.querySelectorAll('*')) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) continue // hidden or zero-box
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
    const declared = parseFloat(cs.fontSize)
    // **An SVG's font-size is not the size it paints.** A viewBox scales its
    // contents, so PlateStack's `fontSize={8}` renders a 24px-tall label — the
    // first draft of this script reported those ten nodes as the app's smallest
    // text when they are among its largest. Scale by the box the text actually
    // occupies: `getBBox` is in user units, the client rect is in CSS pixels,
    // and their ratio is the transform.
    let fs = declared
    if (el.ownerSVGElement && typeof el.getBBox === 'function') {
      try {
        const bb = el.getBBox()
        if (bb.height > 0) fs = Math.round(declared * (rect.height / bb.height) * 100) / 100
      } catch { /* getBBox throws on a detached or display:none node */ }
    }
    const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight)
    rows.push({
      text: text.slice(0, 70),
      len: text.length,
      fs: Math.round(fs * 100) / 100,
      declared: Math.round(declared * 100) / 100,
      svg: !!el.ownerSVGElement,
      isField: ['input', 'textarea', 'select'].includes(el.tagName.toLowerCase()),
      lh: Math.round(lh * 100) / 100,
      lines: Math.max(1, Math.round(rect.height / lh)),
      weight: Number(cs.fontWeight),
      family: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
      tag: el.tagName.toLowerCase(),
      cls: String(el.className?.baseVal ?? el.className ?? '').slice(0, 70),
    })
  }
  return rows
})

const all = []
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height })
  for (const view of VIEWS) {
    await page.goto(`${BASE}?view=${view}&demo=1`, { waitUntil: 'networkidle' })
    const landed = await page.evaluate(() => new URLSearchParams(location.search).get('view'))
    if (landed !== view) {
      console.error(`  !! asked for ?view=${view}, landed on ?view=${landed} — skipped`)
      continue
    }
    await settle()
    await reveal()
    const rows = await collect()
    for (const r of rows) all.push({ ...r, view, vp: vp.name })
    process.stdout.write(`  ${vp.name} · ${view.padEnd(12)} ${String(rows.length).padStart(4)} text nodes\n`)
  }
}
await browser.close()

// ── Report ──────────────────────────────────────────────────────────────────
const onScale = (fs) => SCALE.some((s) => Math.abs(s - fs) < 0.51)
const prose = (r) => r.len >= 60 && r.lines >= 2
const perLine = (r) => Math.round(r.len / r.lines)
const FAMILIES = ['Instrument Sans Variable', 'Fraunces Variable', 'JetBrains Mono Variable', 'Caveat Variable']

const group = (rows, key) => {
  const m = new Map()
  for (const r of rows) {
    const k = key(r)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(r)
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
}

const show = (title, rows, note, fmt) => {
  console.log(`\n-- ${title} ${'-'.repeat(Math.max(0, 60 - title.length))}`)
  if (rows.length === 0) { console.log('   none'); return }
  if (note) console.log(`   ${note}`)
  for (const [k, rs] of group(rows, fmt).slice(0, 14)) {
    const ex = rs[0]
    console.log(`   ${String(rs.length).padStart(4)}x  ${k}`)
    console.log(`         ${ex.vp} · ${ex.view} · <${ex.tag} class="${ex.cls}">  "${ex.text}"`)
  }
}

console.log(`\n${'='.repeat(72)}\nTYPE CENSUS · ${all.length} text nodes across ${VIEWS.length} views\n${'='.repeat(72)}`)

/**
 * A phone form field at 16px is deliberate, not drift: iOS zooms the page when
 * a field under 16px takes focus, and `index.css` forces 16px under 640px for
 * exactly that reason. Flagging it would put a permanent, unfixable red in the
 * report — which is how a gate stops being read.
 */
const iosFieldFloor = (r) => r.vp === 'phone' && r.isField && Math.abs(r.fs - 16) < 0.51
/**
 * Chart text is not on the DOM scale and is not meant to be: recharts sizes its
 * own axis ticks and radar labels, and a viewBox then scales them by whatever
 * the container is. Holding them to the seven steps would put ~28 permanent
 * entries in this report that nobody can act on without forking recharts. They
 * get their own line below instead, which asks the only question that matters
 * for them — is it big enough to read.
 */
const chartText = (r) => r.svg

console.log('\n-- sizes in use ' + '-'.repeat(48))
for (const [size, rs] of group(all, (r) => r.fs).sort((a, b) => b[0] - a[0])) {
  const exempt = rs.every((r) => iosFieldFloor(r) || chartText(r))
  const mark = onScale(Number(size)) ? ' ' : exempt ? '~' : '!'
  console.log(`  ${mark} ${String(size).padStart(6)}px  ${String(rs.length).padStart(5)} nodes  ${[...new Set(rs.map((r) => r.view))].slice(0, 6).join(' ')}`)
}

show('OFF-SCALE SIZES', all.filter((r) => !onScale(r.fs) && !iosFieldFloor(r) && !chartText(r)),
  'a size the scale does not contain — usually a dead utility class, so the element inherits',
  (r) => `${r.fs}px / ${r.lh}px${r.svg ? ` (svg, declared ${r.declared}px)` : ''}`)

show('CHART TEXT UNDER 10px PAINTED', all.filter((r) => chartText(r) && r.fs < 10),
  'declared size x the viewBox scale — what the eye actually gets',
  (r) => `${r.fs}px painted (declared ${r.declared}px)`)

show('TINY PROSE (wrapped sentence under 13px)', all.filter((r) => prose(r) && r.fs < 13),
  'tokens.css: micro is "reserved for data chrome - never for prose"',
  (r) => `${r.fs}px · ${perLine(r)} chars/line`)

show('TIGHT LEADING (wrapped prose under 1.4)', all.filter((r) => prose(r) && r.lh / r.fs < 1.4),
  'the scale gives body 1.55; under 1.4 the eye loses the line return',
  (r) => `${r.fs}px / ${r.lh}px = ${(r.lh / r.fs).toFixed(2)}`)

show('LONG MEASURE (over 90 characters per line)', all.filter((r) => prose(r) && perLine(r) > 90),
  'past ~90 characters the return sweep starts landing on the wrong line',
  (r) => `${perLine(r)} chars/line at ${r.fs}px`)

show('WEIGHT SPRAWL (not 400 or 500)', all.filter((r) => r.weight !== 400 && r.weight !== 500),
  'index.css: "The scale allows two weights, 400 and 500."',
  (r) => `weight ${r.weight} at ${r.fs}px`)

show('FAMILY SPRAWL', all.filter((r) => !FAMILIES.includes(r.family)),
  'four families are loaded; anything else is a fallback that rendered',
  (r) => r.family)

const proseRows = all.filter(prose)
const measures = proseRows.map(perLine).sort((a, b) => a - b)
const pct = (p) => measures[Math.floor((measures.length - 1) * p)] ?? 0
console.log(`\n-- measure distribution (${proseRows.length} wrapped prose blocks) ${'-'.repeat(14)}`)
console.log(`   p10 ${pct(0.1)}  ·  median ${pct(0.5)}  ·  p90 ${pct(0.9)}  ·  max ${measures[measures.length - 1] ?? 0} chars/line`)
console.log('   45-90 is the readable band; a long tail here is a container that never caps its width.\n')
