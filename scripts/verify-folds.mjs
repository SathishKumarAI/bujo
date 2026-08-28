/**
 * Any view, with every fold OPEN — `npm run a11y` walks the rendered page, so a
 * violation inside a closed `CollapsibleSection` is simply not scanned. That is
 * this repo's own trap and the reason a critical `select-name` shipped for
 * months: a gate that cannot see a region cannot vouch for it.
 *
 *   node scripts/verify-folds.mjs coaching
 *   BUJO_URL=http://localhost:5199 node scripts/verify-folds.mjs nofap
 *
 * Run it on any page whose folds a change closed. It opens in three passes,
 * because opening an outer fold mounts inner ones that were not in the DOM
 * before — `CollapsibleSection` unmounts its children rather than hiding them.
 *
 * Single-select disclosures (a technique list where opening one closes the
 * last) cannot all be open at once, so it reports how many are still shut
 * rather than pretending to full coverage. Read the axe result as "clean for
 * what could be opened".
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { AxeBuilder } = require('@axe-core/playwright')

const VIEW = process.argv[2]
if (!VIEW) {
  console.error('usage: node scripts/verify-folds.mjs <view-id>')
  process.exit(2)
}
const BASE = process.env.BUJO_URL || 'http://localhost:5199'
const fail = []
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fail.push(m) }

const browser = await chromium.launch()

for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(() => {
    navigator.serviceWorker?.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()))
    localStorage.setItem('bujo:onboarded', '1')
    if (!localStorage.getItem('bujo:data')) {
      localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
    }
  })
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.goto(`${BASE}/?view=${VIEW}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  // Open every collapsed disclosure inside the page body, twice over: opening
  // the five manual folds reveals the technique and drill folds beneath them,
  // which did not exist in the DOM on the first pass.
  for (let pass = 0; pass < 3; pass += 1) {
    const shut = await page.$$('#main [aria-expanded="false"]')
    for (const el of shut) await el.click().catch(() => {})
    await page.waitForTimeout(500)
  }

  const state = await page.evaluate(() => {
    const root = document.getElementById('main')
    const all = [...root.querySelectorAll('[aria-expanded]')]
    return {
      total: all.length,
      shut: all.filter((b) => b.getAttribute('aria-expanded') === 'false').length,
      height: document.documentElement.scrollHeight,
      sideways: document.documentElement.scrollWidth > window.innerWidth,
    }
  })

  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')

  console.log(`\n— ${width}px — ${state.total} disclosures, ${state.shut} still shut, ${(state.height / 900).toFixed(2)} screens`)
  ok(!state.sideways, `${width}: no sideways scroll`)
  ok(serious.length === 0, `${width}: axe with folds open — 0 serious/critical (got ${serious.length})`)
  for (const v of serious) {
    console.log(`      ${v.id}: ${v.nodes.length} × ${v.help}`)
    for (const n of v.nodes) {
      console.log(`        ${n.target.join(' ')}`)
      console.log(`          ${String(n.failureSummary || '').split('\n').join(' | ')}`)
    }
  }
  await context.close()
}

await browser.close()
console.log(fail.length ? `\n${fail.length} FAILED` : '\nAll passed')
process.exit(fail.length ? 1 : 0)
