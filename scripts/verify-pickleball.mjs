/**
 * Verifies the three Pickleball changes against the running preview build,
 * on the rendered page rather than by reading the source.
 *
 * Loads demo data first — `src/lib/demo.ts` is persisted, not regenerated, so a
 * fresh profile has no pickleball sessions and the heatmap would prove nothing.
 */
import { createRequire } from 'node:module'
// playwright and axe are dev deps installed by the a11y gate:
//   npm i -D --no-save playwright @axe-core/playwright && npx playwright install chromium
// Run against a live preview:  npx vite preview --port 4173
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { AxeBuilder } = require('@axe-core/playwright')

const BASE = 'http://localhost:4173'
const fail = []
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fail.push(msg) }

const browser = await chromium.launch()
// @axe-core/playwright refuses a page created straight off the browser.
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const page = await context.newPage()

// The preview server ships a service worker that will serve a stale bundle, and
// a fresh profile lands on the onboarding gate rather than any view — the same
// flag the a11y gate sets (scripts/a11y-axe.mjs:170).
await page.addInitScript(() => {
  navigator.serviceWorker?.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()))
  localStorage.setItem('bujo:onboarded', '1')
  // `bujo:onboarded` alone is not enough — the gate is the storage choice, so
  // without a `storageMode` the app boots to "Sync with an account" and no view
  // renders at all. Copied from scripts/a11y-axe.mjs:168-173.
  const existing = localStorage.getItem('bujo:data')
  if (!existing) localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
})

// Seed a journal with pickleball sessions spread over a year, straight into
// localStorage, so the heatmap and history have something to render.
await page.goto(BASE, { waitUntil: 'networkidle' })
const seeded = await page.evaluate(() => {
  // Named exactly. A loose /bujo/ match picks up `bujo:onboarded` first and
  // corrupts the flag instead of seeding the journal.
  const key = 'bujo:data'
  if (!localStorage.getItem(key)) return { key: null }
  const data = JSON.parse(localStorage.getItem(key))
  const iso = (back) => new Date(Date.now() - back * 864e5).toISOString().slice(0, 10)
  const sessions = []
  for (let i = 0; i < 340; i += 1) {
    if (i % 7 === 2 || i % 7 === 4 || i % 7 === 6) continue
    sessions.push({
      id: `verify-${i}`, date: iso(i), format: i % 5 === 0 ? 'singles' : 'doubles',
      gamesWon: i === 40 ? 9 : 1 + (i % 3), gamesLost: 1 + (i % 2),
      durationMin: 60, partner: ['Ravi', 'Meera', 'Dan'][i % 3], rpe: 5,
    })
  }
  data.pickleball = sessions
  localStorage.setItem(key, JSON.stringify(data))
  return { key, count: sessions.length }
})
console.log('seed:', JSON.stringify(seeded))

await page.goto(`${BASE}/?view=pickleball`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// ── 1 · the heatmap is a real table, not a div grid ──────────────────────────
const heat = await page.evaluate(() => {
  const cap = [...document.querySelectorAll('table caption')]
    .find((c) => /pickleball games per day/i.test(c.textContent))
  if (!cap) return { found: false }
  const table = cap.closest('table')
  // Intensity is carried by OPACITY over a single hue, not by background —
  // `day-grid.tsx` picks one colour and steps `RAMP[level]`. Measuring
  // backgroundColor here reports 2 fills and looks like a broken ramp.
  const ops = new Map()
  for (const td of table.querySelectorAll('tbody td')) {
    const el = td.firstElementChild
    if (!el) continue
    const o = getComputedStyle(el).opacity
    ops.set(o, (ops.get(o) ?? 0) + 1)
  }
  const wrapper = table.closest('[tabindex]')
  const labels = [...table.querySelectorAll('tbody .sr-only')].map((s) => s.textContent)
  return {
    found: true,
    caption: cap.textContent.trim(),
    colHeaders: table.querySelectorAll('thead th[scope="col"]').length,
    rowHeaders: table.querySelectorAll('tbody th[scope="row"]').length,
    // Cells are deliberately NOT tab stops (day-grid.tsx:161 — 84 of them would
    // be a focus trap). The scroll region is the focusable thing.
    wrapperTabIndex: wrapper?.getAttribute('tabindex') ?? null,
    opacitySteps: [...ops.keys()].length,
    opacityBuckets: [...ops.entries()].sort((a, b) => Number(b[0]) - Number(a[0])),
    spokenSample: labels.find((l) => /: \d+ games/.test(l)) ?? null,
    spokenRest: labels.find((l) => /rest day/.test(l)) ?? null,
  }
})
console.log('heatmap:', JSON.stringify(heat))
ok(heat.found, 'heatmap renders as a <table> with a caption')
ok(heat.rowHeaders === 7, `7 weekday row headers (got ${heat.rowHeaders})`)
ok(heat.colHeaders > 10, `week column headers present (got ${heat.colHeaders})`)
ok(heat.wrapperTabIndex === '0', `the scroll region is focusable (got ${heat.wrapperTabIndex})`)
// The point of quartiles: an outlier day must not flatten every ordinary day to
// one step. More than one non-rest step means the ramp survived the outlier.
ok(heat.opacitySteps >= 3, `intensity has >=3 steps, i.e. buckets survive the outlier (got ${heat.opacitySteps}: ${JSON.stringify(heat.opacityBuckets)})`)
ok(!!heat.spokenSample && !!heat.spokenRest,
  `cells speak their value, not just colour (${heat.spokenSample} / ${heat.spokenRest})`)

const divGrid = await page.evaluate(() =>
  document.body.innerHTML.includes('grid-flow-col') ? 'present' : 'absent')
ok(divGrid === 'absent', 'the old grid-flow-col div stack is gone')

const literalDollar = await page.evaluate(() => /\$\{?heatWeeks/.test(document.body.innerText))
ok(!literalDollar, 'no literal ${heatWeeks} rendered as text')

// ── 2 · accent audit: one wide log control, two behind "+" ───────────────────
const accents = await page.evaluate(() => {
  const wide = [...document.querySelectorAll('button')]
    .filter((b) => b.offsetParent && b.getBoundingClientRect().width > 250 && /^(log|save)\b/i.test(b.textContent.trim()))
    .map((b) => b.textContent.trim())
  const plus = [...document.querySelectorAll('button[aria-label]')]
    .filter((b) => /^Log (a DUPR rating|an event)$/.test(b.getAttribute('aria-label')))
    .map((b) => ({ label: b.getAttribute('aria-label'), expanded: b.getAttribute('aria-expanded') }))
  const duprFields = document.querySelector('input[aria-label="DUPR rating"]') ? 'visible' : 'hidden'
  const eventFields = document.querySelector('input[aria-label="Event name"]') ? 'visible' : 'hidden'
  return { wide, plus, duprFields, eventFields }
})
console.log('accents:', JSON.stringify(accents))
ok(accents.wide.length === 1 && /log session/i.test(accents.wide[0]),
  `exactly one wide log control, and it is "Log session" (got ${JSON.stringify(accents.wide)})`)
ok(accents.plus.length === 2, `two "+" reveal buttons in card headers (got ${accents.plus.length})`)
ok(accents.plus.every((p) => p.expanded === 'false'), 'both start collapsed, carrying aria-expanded=false')
ok(accents.duprFields === 'hidden' && accents.eventFields === 'hidden', 'neither form is open on load')

// Click both "+" and confirm the fields actually appear.
for (const label of ['Log a DUPR rating', 'Log an event']) {
  await page.click(`button[aria-label="${label}"]`)
  await page.waitForTimeout(250)
}
const revealed = await page.evaluate(() => ({
  dupr: !!document.querySelector('input[aria-label="DUPR rating"]'),
  event: !!document.querySelector('input[aria-label="Event name"]'),
  duprExpanded: document.querySelector('button[aria-label="Log a DUPR rating"]').getAttribute('aria-expanded'),
  eventExpanded: document.querySelector('button[aria-label="Log an event"]').getAttribute('aria-expanded'),
  saveButtons: [...document.querySelectorAll('button')]
    .filter((b) => b.offsetParent && /^Save (rating|event)$/.test(b.textContent.trim()))
    .map((b) => ({ text: b.textContent.trim(), width: Math.round(b.getBoundingClientRect().width) })),
}))
console.log('revealed:', JSON.stringify(revealed))
ok(revealed.dupr && revealed.event, '"+" reveals both forms')
ok(revealed.duprExpanded === 'true' && revealed.eventExpanded === 'true', 'aria-expanded flips to true')
ok(revealed.saveButtons.length === 2 && revealed.saveButtons.every((b) => b.width < 250),
  `both saves are narrow, not wide CTAs (got ${JSON.stringify(revealed.saveButtons)})`)

// ── 3 · a11y INSIDE the now-open folds, which the gate cannot reach ──────────
// `npm run a11y` walks the rendered page, so a form behind a shut "+" is simply
// not scanned. This is the re-run the CLAUDE.md trap asks for.
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
const bad = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
console.log('axe (folds open):', bad.length ? JSON.stringify(bad.map((v) => `${v.id}:${v.nodes.length}`)) : 'none')
ok(bad.length === 0, 'no serious/critical axe violations with both revealed forms open')

// ── 4 · history at overflow, and its inline edit ─────────────────────────────
const history = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^Show all \d+$/.test(x.textContent.trim()))
  return { showAll: b?.textContent.trim() ?? null, rowsBefore: document.querySelectorAll('button[aria-label="Edit session"]').length }
})
console.log('history:', JSON.stringify(history))
ok(history.rowsBefore === 8, `history shows 8 rows before expanding (got ${history.rowsBefore})`)
ok(/^Show all \d+$/.test(history.showAll ?? ''), `overflow control present (got ${history.showAll})`)

await page.screenshot({ path: process.argv[2] ?? 'pickleball.png', fullPage: true })
await browser.close()

console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL PASSED')
process.exit(fail.length ? 1 : 0)
