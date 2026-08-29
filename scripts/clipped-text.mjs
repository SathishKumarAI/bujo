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
 * The other way to hide something that is present: push a *control* past the
 * edge of the page with nothing able to scroll to it. Not clipped — unreachable.
 *
 * `findClipped` cannot see this, and the distinction is the same blind spot the
 * header describes one level up. That check asks whether an element shows less
 * than it holds — `scrollWidth > clientWidth`. A button sitting at x=453 in a
 * 390px viewport shows *everything* it holds; its own box is fine. The clip
 * happens at an ancestor, and `document.body` still reports `scrollWidth` 390
 * because it happens above the body. So the page measures clean while a third
 * of a toolbar cannot be pressed.
 *
 * Deliberately controls only, not text. The first draft of this ran over every
 * leaf with text and reported 52 hits across 23 views — descenders of a
 * tooltip, SVG `path` nodes, sentences overhanging by 40px. All cosmetic, none
 * of them the defect, and a gate whose red is mostly noise is a gate nobody
 * reads. "You cannot press this" is unambiguous and worth failing a build for.
 *
 * The reachability walk is what keeps even that honest: wide content inside an
 * `overflow-x-auto` box is a design, not a defect — the month grid on Trackers
 * is 900px wide by intent, and every day cell in it is a button — so a control
 * only counts as lost when nothing between it and the document can scroll it
 * into view.
 */
function findUnreachable() {
  // Inline, not a module-level constant: `page.evaluate` ships the function
  // source and nothing it closes over, so a hoisted selector arrives undefined.
  const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"]'
  const out = []
  const limit = document.documentElement.clientWidth
  for (const el of document.querySelectorAll(`main :is(${CONTROLS})`)) {
    const r = el.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) continue // sr-only / not laid out
    if (r.right <= limit + 1 && r.left >= -1) continue
    if (el.closest('[data-clip-ok]')) continue

    let reachable = false
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ov = getComputedStyle(p).overflowX
      if ((ov === 'auto' || ov === 'scroll') && p.scrollWidth > p.clientWidth + 1) { reachable = true; break }
    }
    if (reachable) continue

    const label = ((el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim() || el.tagName.toLowerCase()).slice(0, 60)
    out.push({ text: label, left: Math.round(r.left), right: Math.round(r.right), limit })
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
    const lost = await page.evaluate(findUnreachable)
    if (lost.length) {
      failures += lost.length
      console.error(`\n${vp.name} · ${view} — ${lost.length} controls off-screen and unreachable`)
      for (const c of lost) console.error(`  "${c.text}"  spans ${c.left}–${c.right}px, page is ${c.limit}px`)
    }
  }
}

await browser.close()

if (failures) {
  console.error(`\n${failures} hidden strings across ${VIEWS.length} views.`)
  console.error('Let the text wrap, give its column the space, let the row wrap so')
  console.error('it stays on the page, or mark the element `data-clip-ok` if the')
  console.error('truncation is genuinely intended.')
  process.exit(1)
}
console.log(`No clipped or off-screen text across ${VIEWS.length} views at ${VIEWPORTS.map((v) => v.width).join('px and ')}px.`)
