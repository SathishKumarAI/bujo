// Does the app still SHOW its numbers, or has it gone back to printing them?
//
// ── Why this gate exists ───────────────────────────────────────────────────
//
// A visual audit at `bf8dbda` measured the app printing **1,414 numbers as
// plain text against 98 visual encodings — 14.43 to 1**, with five views
// encoding nothing at all. That ratio was the whole of "it looks like a plain
// HTML page and doesn't tell me anything".
//
// Every other property this repo cares about has a gate — `check-contrast`
// for the palette, `check-design-system` for hardcoded colour, `a11y` for the
// accessibility tree. This one is for the property those three cannot see:
// whether a number arrives with the range that makes it mean something.
//
// Without it the ratio drifts back on its own. Every new card prints a figure
// because printing a figure is the shortest thing to type, and nothing
// anywhere says otherwise.
//
// ── What it counts ─────────────────────────────────────────────────────────
//
//   text      a rendered run of digits that is NOT inside an encoding
//   shapes    Track / Spark / Ramp / Ring / recharts surfaces / heatmap cells
//
// Both from the live DOM, because the source cannot answer it: the same
// `<Stat>` prints a bare figure or draws a track depending on whether the
// caller had a range to give it, and that is the decision being measured.
//
// ── The baseline, and why it is a ratchet and not a target ────────────────
//
// `visual-density.baseline.json` records what each view scored when it was
// last improved. The gate fails when a view gets WORSE, not when it fails to
// be perfect — so a page nobody has reached yet is not a blocker, and a page
// that has been fixed cannot quietly regress. Re-baseline deliberately with
// `--update` and the diff shows up in review.
//
//   npm run density
//   BUJO_URL=http://localhost:5180 node scripts/check-visual-density.mjs --update
//
// Needs `playwright` + chromium, which are deliberately not in package.json —
// `.github/workflows/a11y.yml` installs them per job. See CLAUDE.md.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASELINE = join(HERE, 'visual-density.baseline.json')
const URL = process.env.BUJO_URL ?? 'http://localhost:4173'
const UPDATE = process.argv.includes('--update')

// The views the audit measured. Keep in step with `a11y-axe.mjs`'s VIEWS — a
// view absent from here is a view this gate cannot see, which is the
// "a page that is never visited cannot fail" trap one level up.
const VIEWS = [
  'today', 'plan', 'fitness', 'gym', 'mindset', 'insights',
  'nutrition', 'nofap', 'cycle', 'coaching', 'pickleball', 'collections', 'help',
]

/** Runs in the page. Returns the counts for one view. */
function measure() {
  const main = document.querySelector('#main')
  if (!main) return null

  // Anything that encodes a value as a shape. The data attribute is what the
  // primitives in `ui/Stat.tsx` set; the rest are the chart libraries and the
  // hand-rolled visualisations that predate them.
  const ENCODERS = [
    '[data-encodes]',
    '.recharts-surface',
    'svg circle[stroke-dasharray]',       // Ring
    '[data-heatmap] [data-cell]',
  ].join(',')

  const encodings = main.querySelectorAll(ENCODERS).length

  // A "printed number" is a run of digits in a leaf element that is not inside
  // an encoder and not a date. Dates are excluded because a date is not a
  // measurement — it has no range and giving it one would be nonsense.
  const DATE = /^\s*(\d{1,2}[:/.]\d{2}|\d{4}-\d{2}-\d{2})\s*$/
  let printed = 0
  for (const el of main.querySelectorAll('*')) {
    if (el.children.length > 0) continue
    const t = (el.textContent ?? '').trim()
    if (!t || !/\d/.test(t)) continue
    if (DATE.test(t)) continue
    if (el.closest(ENCODERS)) continue
    printed++
  }

  // Type rank: the largest rendered text in #main against the body size.
  let largest = 0
  for (const el of main.querySelectorAll('*')) {
    if (el.children.length > 0) continue
    if (!(el.textContent ?? '').trim()) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (Number.isFinite(px) && px > largest) largest = px
  }
  const body = parseFloat(getComputedStyle(document.body).fontSize) || 15

  return { printed, encodings, largest, body, rank: +(largest / body).toFixed(2) }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

// Seed once. Without it every view renders the Welcome screen and this gate
// measures an empty page as a clean one — the failure mode CLAUDE.md records
// the a11y gate shipping for its whole existence.
await page.goto(`${URL}/?demo=1`, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.setItem('bujo:onboarded', '1'))

const seeded = await page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('bujo:data') ?? '{}').entries ?? []).length } catch { return 0 }
})
if (seeded < 10) {
  console.error(`FAIL: the demo seed did not land (${seeded} entries). Every view would measure as empty.`)
  process.exit(1)
}

const results = {}
for (const view of VIEWS) {
  await page.goto(`${URL}/?demo=1&view=${view}`, { waitUntil: 'networkidle' })
  // `networkidle` is not "React has rendered" — it resolves when the last
  // chunk arrives. Wait for content, or a lazy view measures as zero.
  await page
    .waitForFunction(() => (document.querySelector('#main')?.textContent ?? '').length > 120, null, { timeout: 15000 })
    .catch(() => {})
  await page.waitForTimeout(350)
  const m = await page.evaluate(measure)
  if (!m) { console.error(`FAIL: ${view} has no #main — did the view mount?`); process.exit(1) }
  results[view] = m
}
await browser.close()

const totals = Object.values(results).reduce(
  (a, r) => ({ printed: a.printed + r.printed, encodings: a.encodings + r.encodings }),
  { printed: 0, encodings: 0 },
)
const ratio = (p, e) => (e === 0 ? Infinity : +(p / e).toFixed(2))

if (UPDATE) {
  writeFileSync(BASELINE, `${JSON.stringify(results, null, 2)}\n`)
  console.log(`Baseline written: ${Object.keys(results).length} views.`)
  console.log(`Overall ${totals.printed} printed : ${totals.encodings} encoded = ${ratio(totals.printed, totals.encodings)} : 1`)
  process.exit(0)
}

if (!existsSync(BASELINE)) {
  console.error(`FAIL: no baseline at ${BASELINE}. Create one with --update and commit it.`)
  process.exit(1)
}
const base = JSON.parse(readFileSync(BASELINE, 'utf8'))

// Tripwire. A gate whose view list silently emptied would pass with nothing
// measured, which is this repo's oldest failure mode.
const checked = Object.keys(results).filter((v) => base[v])
if (checked.length < VIEWS.length - 1) {
  console.error(`FAIL: only ${checked.length} of ${VIEWS.length} views had a baseline — this compared almost nothing.`)
  process.exit(1)
}

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('view', 13), pad('printed', 9), pad('encoded', 9), pad('ratio', 9), pad('was', 9), 'rank')
const worse = []
for (const [view, r] of Object.entries(results)) {
  const b = base[view]
  const now = ratio(r.printed, r.encodings)
  const then = b ? ratio(b.printed, b.encodings) : null
  // A ratio is only "worse" if it rose by more than a rounding wobble. Content
  // changes move these by fractions and a gate that fires on noise is a gate
  // people switch off.
  const regressed = then != null && now > then * 1.15 + 0.2
  if (regressed) worse.push(`${view}: ${then} -> ${now}`)
  console.log(
    pad(view, 13), pad(r.printed, 9), pad(r.encodings, 9),
    pad(now === Infinity ? 'none' : now, 9), pad(then ?? '—', 9),
    `${r.rank}x${regressed ? '   WORSE' : ''}`,
  )
}

console.log(`\nOverall ${totals.printed} printed : ${totals.encodings} encoded = ${ratio(totals.printed, totals.encodings)} : 1`)

const silent = Object.entries(results).filter(([v, r]) => r.encodings === 0 && (base[v]?.encodings ?? 0) > 0)
for (const [v] of silent) worse.push(`${v}: encoded something before, encodes nothing now`)

if (worse.length) {
  console.error(`\nFAIL: ${worse.length} regression(s)\n  ${worse.join('\n  ')}`)
  console.error('\nA number with a range should carry its range. If this is deliberate, re-baseline with --update and say why in the commit.')
  process.exit(1)
}
console.log('\nVisual density OK — no view prints more than it did.')
