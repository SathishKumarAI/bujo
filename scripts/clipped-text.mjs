/**
 * Clipped-text gate: fail when the app hides text it has no other way to show.
 *
 *   BUJO_URL=http://localhost:4173 node scripts/clipped-text.mjs
 *
 * This exists because `npm run a11y` structurally cannot catch it. Clipped text
 * is not an accessibility violation — the string is still in the accessibility
 * tree and a screen reader reads it in full — so axe is right to stay quiet and
 * the defect sails through the one gate that looks at rendered pages. That is
 * how the family kept recurring: `M…` on Stats, `W.` and a nameless habit row on
 * Trackers, "First w…" / "Centur…" / "Unbro…" on Achievements, and most recently
 * six drill descriptions on Coaching losing a third of their sentence.
 *
 * The check is one line of DOM: an element whose `scrollWidth` exceeds its
 * `clientWidth` is showing less than it holds.
 *
 * Two filters keep the signal real, and both were learned by getting them wrong:
 *
 * 1. **Skip anything under 2px.** Screen-reader-only labels are sized
 *    `width: 1px` deliberately. Without this the raw count is 221 on Stats and
 *    110 on Fitness, every one of them noise — which is how a real finding gets
 *    buried in its own report.
 * 2. **Skip a deliberate `-webkit-line-clamp`.** A clamp is a designed truncation
 *    with the full text somewhere else; `white-space: nowrap` + `ellipsis` on a
 *    name or a sentence is not.
 *
 * A truncation that is genuinely wanted opts out with `data-clip-ok`, so the
 * exception is stated in the markup rather than argued for in a review.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('This script needs Playwright, which is deliberately not a')
  console.error('dependency (CI installs it with --no-save). Run:')
  console.error('  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'

// Every view in VIEW_CHROME. A page not on this list is not checked — the same
// rule, and the same failure mode, as `scripts/a11y-axe.mjs`.
const VIEWS = [
  'today', 'monthly', 'trackers', 'fitness', 'nutrition', 'gym', 'pullups',
  'pickleball', 'homeworkout', 'challenges', 'focus', 'plan', 'collections',
  'reading', 'goals', 'insights', 'stats', 'cycle', 'nofap', 'mindset',
  'coaching', 'help', 'settings',
]

function findClipped() {
  const out = []
  for (const el of document.querySelectorAll('main *')) {
    if (el.children.length) continue
    const text = (el.textContent || '').trim()
    if (!text) continue
    if (el.closest('[data-clip-ok]')) continue

    const r = el.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) continue // sr-only, by design

    const cs = getComputedStyle(el)
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue // deliberate clamp

    if (el.scrollWidth > el.clientWidth + 1) {
      out.push({ text: text.slice(0, 60), shown: el.clientWidth, needed: el.scrollWidth })
    }
  }
  return out
}

/**
 * Both widths. This gate only ever ran at 1440 — the width at which text is
 * least likely to be clipped — and never at the one where it is most likely.
 * A pass at desktop says nothing about a phone: the columns are a third as
 * wide and the strings are identical.
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VIEWPORTS[0] })

// A fresh profile lands on the storage-mode start screen, which swallows
// `?view=` entirely and leaves every page unmeasured. "Explore the demo" both
// picks a mode and seeds the journal — and the journal matters: half the
// defects this repo has found were invisible on an empty one.
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const explore = page.locator('button', { hasText: /Explore the demo/ })
if (await explore.count()) {
  await explore.first().click()
  await page.waitForTimeout(1500)
}

const bytes = await page.evaluate(() => (localStorage['bujo:data'] ?? '').length)
if (bytes < 20000) {
  console.error(`Journal is ${bytes} bytes — demo data did not load, so this would`)
  console.error('be a clean report measured on an empty app. Refusing to pass.')
  await browser.close()
  process.exit(1)
}

let failures = 0
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height })
  for (const view of VIEWS) {
    await page.goto(`${BASE}/?view=${view}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const clipped = await page.evaluate(findClipped)
    if (clipped.length) {
      failures += clipped.length
      console.error(`\n${vp.name} · ${view} — ${clipped.length} clipped`)
      for (const c of clipped) console.error(`  "${c.text}"  ${c.shown}px shown, ${c.needed}px needed`)
    }
  }
}

await browser.close()

if (failures) {
  console.error(`\n${failures} clipped strings across ${VIEWS.length} views.`)
  console.error('Let the text wrap, give its column the space, or mark the element')
  console.error('`data-clip-ok` if the truncation is genuinely intended.')
  process.exit(1)
}
console.log(`No clipped text across ${VIEWS.length} views at ${VIEWPORTS.map((v) => v.width).join('px and ')}px.`)
