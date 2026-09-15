/**
 * COLUMN AUDIT · how much of each page's width is actually painted, and where a
 * page is tall only because narrow content is stacked.
 *
 *     BUJO_URL=http://localhost:4173 node scripts/column-audit.mjs
 *
 * `page-census.mjs` answers "how tall is this page". This answers the other
 * half: **is it tall because it holds a lot, or because it is one column of
 * things that would sit side by side?** A 3-screen page whose content stops at
 * 45% of the row is not a long page; it is a narrow page with the scrolling
 * left in.
 *
 * ## Why bands, and not "blocks"
 *
 * The first draft walked the DOM for sections — descend single-child wrappers,
 * treat the page shell's children as blocks — and reported **Today as one block
 * and Gym as three at 4.7 screens**, which describes neither page. Card
 * structure varies too much across 25 views written over months for a
 * structural walk to find "the sections" reliably, and a walk that finds the
 * wrong ones reports confident nonsense. It was thrown away before anything was
 * built on it.
 *
 * Bands need no structure. Slice the page every 40px; for each slice take the
 * rightmost edge any *painting* element reaches. A run of slices that all stop
 * at 45% of the width is a column of narrow content, whatever markup made it —
 * and the height of that run is the scrolling a second column would remove.
 *
 * Two things it counts carefully:
 *
 * - **Only text a node owns.** A wrapper's `textContent` includes everything
 *   beneath it, so counting that would make every band look full to the right
 *   edge of the widest descendant.
 * - **Empty bands inherit the band above.** Pure spacing between two narrow
 *   cards is part of the narrow run, not a gap in it.
 *
 * It reports and fails nothing. Some blocks are wide on purpose — a 53-column
 * heatmap, a month grid, a multi-series chart — and those correctly show as
 * wide. The signal is a long *run*, not a single narrow band.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('Needs Playwright:  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL || 'http://localhost:4173'
const { VIEW_IDS } = await import('./view-ids.mjs')
const VIEWS = process.env.BUJO_VIEWS ? process.env.BUJO_VIEWS.split(',') : VIEW_IDS

/** A band painting less than this share of the row is narrow. */
const NARROW = 0.55
/** A run shorter than this is a caption or a button row, not a column. */
const MIN_RUN = 200

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('bujo:onboarded', '1')
    if (!localStorage.getItem('bujo:data')) {
      localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
    }
  } catch { /* private mode */ }
})
const page = await ctx.newPage()

await page.goto(`${BASE}?demo=1`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const boot = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
  return { title: document.title, entries: d.entries?.length ?? 0 }
})
if (!boot.title.startsWith('Cadence') || boot.entries === 0) {
  console.error(`Not measuring Cadence with data — title "${boot.title}", ${boot.entries} entries.`)
  process.exit(1)
}
console.log(`${boot.title} · ${boot.entries} entries · ${VIEWS.length} views at 1440\n`)

async function settle() {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null, { timeout: 5000 },
  ).catch(() => {})
  await page.waitForTimeout(120)
}

const measure = () => page.evaluate(({ NARROW, MIN_RUN }) => {
  const main = document.querySelector('#main')
  if (!main) return null
  const shell = main.querySelector('.page-shell') ?? main.firstElementChild ?? main
  const shellBox = shell.getBoundingClientRect()
  const pageTop = window.scrollY + shellBox.top
  const height = Math.max(shell.scrollHeight, Math.round(shellBox.height))
  const BAND = 40
  const bands = new Array(Math.max(1, Math.ceil(height / BAND))).fill(0)
  const labels = new Array(bands.length).fill('')

  const paints = (el) => {
    const tag = el.tagName.toLowerCase()
    if (['svg', 'img', 'input', 'canvas', 'select', 'textarea', 'video'].includes(tag)) return true
    return [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0)
  }

  for (const el of shell.querySelectorAll('*')) {
    if (!paints(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
    const used = r.right - shellBox.left
    const from = Math.floor((window.scrollY + r.top - pageTop) / BAND)
    const to = Math.floor((window.scrollY + r.bottom - pageTop) / BAND)
    for (let i = Math.max(0, from); i <= Math.min(bands.length - 1, to); i++) {
      if (used > bands[i]) {
        bands[i] = used
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim()
        if (own) labels[i] = own.replace(/\s+/g, ' ').slice(0, 34)
      }
    }
  }

  const filled = bands.map((v, i) => (v > 0 ? v : (bands[i - 1] ?? 0)))
  const share = filled.map((v) => v / shellBox.width)

  const runs = []
  let run = null
  share.forEach((sh, i) => {
    if (sh > 0 && sh < NARROW) {
      if (!run) run = { from: i, to: i, worst: sh, label: labels[i] }
      else { run.to = i; run.worst = Math.min(run.worst, sh); if (!run.label) run.label = labels[i] }
    } else if (run) { runs.push(run); run = null }
  })
  if (run) runs.push(run)

  const narrowBands = share.filter((v) => v > 0 && v < NARROW).length
  const sorted = [...share].filter((v) => v > 0).sort((a, b) => a - b)
  return {
    shellWidth: Math.round(shellBox.width),
    pageHeight: height,
    viewport: window.innerHeight,
    narrowPx: narrowBands * BAND,
    medianShare: +(sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(2),
    runs: runs
      .map((r) => ({ px: (r.to - r.from + 1) * BAND, worst: +r.worst.toFixed(2), label: r.label }))
      .filter((r) => r.px >= MIN_RUN)
      .sort((a, b) => b.px - a.px),
  }
}, { NARROW, MIN_RUN })

const report = []
for (const view of VIEWS) {
  await page.goto(`${BASE}?view=${view}&demo=1`, { waitUntil: 'networkidle' })
  const landed = await page.evaluate(() => new URLSearchParams(location.search).get('view'))
  if (landed !== view) { console.error(`  !! ${view} redirected to ${landed}`); continue }
  await settle()
  // Folds and lazy mounts hide content from this exactly as they hid it from
  // the a11y gate and the type census.
  await page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
  await settle()
  for (let i = 0; i < 3; i++) {
    const n = await page.evaluate(() => {
      const shut = [...document.querySelectorAll('#main [aria-expanded="false"]:not([aria-haspopup])')]
      for (const el of shut) el.click()
      return shut.length
    })
    if (n === 0) break
    await settle()
  }
  const m = await measure()
  if (!m) continue
  report.push({ view, ...m })
  console.log(
    `  ${view.padEnd(12)} ${(m.pageHeight / m.viewport).toFixed(1).padStart(4)} screens · ` +
    `median ${String(Math.round(m.medianShare * 100)).padStart(3)}% used · ` +
    `${String(m.narrowPx).padStart(5)}px narrow` +
    (m.runs.length ? ` · longest run ${m.runs[0].px}px at ${Math.round(m.runs[0].worst * 100)}%` : ''),
  )
}
await browser.close()

console.log(`\n${'='.repeat(78)}\nWORTH COLUMNS — most narrow vertical space first\n${'='.repeat(78)}`)
const worth = [...report].sort((a, b) => b.narrowPx - a.narrowPx)
console.log('  view          screens  median  narrow px  longest runs')
for (const r of worth) {
  console.log(
    `  ${r.view.padEnd(13)} ${(r.pageHeight / r.viewport).toFixed(1).padStart(6)} ` +
    `${String(Math.round(r.medianShare * 100)).padStart(6)}% ${String(r.narrowPx).padStart(10)}  ` +
    r.runs.slice(0, 2).map((x) => `${x.px}px@${Math.round(x.worst * 100)}%`).join(', '),
  )
}

console.log(`\n${'='.repeat(78)}\nRUNS · consecutive narrow bands, longest first\n${'='.repeat(78)}`)
for (const r of worth) {
  if (r.runs.length === 0) continue
  console.log(`\n${r.view} · shell ${r.shellWidth}px · ${(r.pageHeight / r.viewport).toFixed(1)} screens`)
  for (const run of r.runs.slice(0, 6)) {
    console.log(`   ${String(run.px).padStart(5)}px tall · widest content ${String(Math.round(run.worst * 100)).padStart(3)}% of the row · "${run.label}"`)
  }
}
console.log()
