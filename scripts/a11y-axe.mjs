/**
 * Accessibility gate: run axe-core over the app's main views.
 *
 * The a11y work in this repo has been verified by hand — focus traps, heading
 * order, aria-labels on calendar cells, contrast ratios measured per theme.
 * None of it is protected. This is the automated floor underneath it.
 *
 *   BUJO_URL=http://localhost:4173 node scripts/a11y-axe.mjs
 *
 * Fails on **serious** and **critical** violations only. Moderate findings are
 * reported but not fatal: most are contrast inside chart internals, which needs
 * the data-viz palette decision rather than a blanket fix, and a gate that
 * always fails is a gate everyone learns to ignore.
 *
 * Navigation clicks the sidebar rather than setting `?view=` and reloading —
 * this router reads the URL once at boot, and an earlier sweep that drove it by
 * URL silently re-measured Today twenty times and reported a clean sweep.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium, AxeBuilder
try {
  ;({ chromium } = require('playwright'))
  AxeBuilder = require('@axe-core/playwright').default
} catch {
  console.error('This script needs Playwright and @axe-core/playwright, which are')
  console.error('deliberately not dependencies (CI installs them with --no-save).')
  console.error('Run:  npm i -D --no-save playwright @axe-core/playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'
// The whole Body cluster, added with its restructure: a gate that does not
// visit a page cannot vouch for it.
//
// Recovery was left out at first on the reasoning that it sits behind an opt-in
// setting. That was wrong — `nofapEnabled` DEFAULTS to true, so the sidebar
// entry is there on a fresh journal and always was. Worth remembering as a
// shape of mistake: the exclusion was argued from the code's shape rather than
// checked against the rendered page, which is the same error the gate exists to
// prevent.
const VIEWS = ['Today', 'Plan', 'Trackers', 'Fitness', 'Nutrition', 'Recovery', 'Coaching', 'Collections', 'Reading', 'Insights', 'Goals']

const browser = await chromium.launch()
// An explicit context, not `browser.newPage()`: @axe-core/playwright refuses a
// page created straight off the browser ("Please use browser.newContext()").
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

// Skip the first-run gate: pick local storage so the app boots into the shell.
await page.addInitScript(() => {
  localStorage.setItem('bujo:onboarded', '1')
  const existing = localStorage.getItem('bujo:data')
  if (!existing) {
    localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
  }
})

await page.goto(BASE, { waitUntil: 'networkidle' })

let serious = 0
const summary = []

for (const view of VIEWS) {
  const nav = page.locator('nav button, aside button').filter({ hasText: new RegExp(`^${view}$`) }).first()
  if (await nav.count()) {
    await nav.click()
    await page.waitForTimeout(500)
  }

  // A clean result on a blank page is worse than no gate at all: it reads as
  // proof. Assert the view actually rendered before believing its score.
  const rendered = await page.evaluate(() => (document.querySelector('main')?.innerText ?? '').trim().length)
  if (rendered < 40) {
    console.error(`\n[${view}] rendered ${rendered} characters — the view did not load, so its result means nothing.`)
    await browser.close()
    process.exit(1)
  }
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const meh = results.violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor')
  serious += bad.length
  summary.push({ view, serious: bad.length, other: meh.length })

  for (const v of bad) {
    console.error(`\n[${view}] ${v.impact}: ${v.id} — ${v.help}`)
    console.error(`  ${v.helpUrl}`)
    for (const node of v.nodes.slice(0, 3)) console.error(`  ${node.html.slice(0, 120)}`)
  }
}

await browser.close()

console.log('\nView            serious  other')
for (const s of summary) console.log(`  ${s.view.padEnd(14)} ${String(s.serious).padStart(5)} ${String(s.other).padStart(6)}`)

if (serious > 0) {
  console.error(`\n${serious} serious/critical accessibility violation(s).`)
  process.exit(1)
}
console.log('\nNo serious or critical violations.')
