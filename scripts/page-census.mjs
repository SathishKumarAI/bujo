/**
 * PAGE CENSUS · for every routable view: how tall it is, how many folds it has,
 * how many are open, and how many charts render before you touch anything.
 *
 * Not a gate — it fails nothing and asserts nothing. It exists because the
 * numbers in `docs/pages/README.md` were being *quoted* rather than measured,
 * and had drifted far enough to send work at the wrong pages: the heights table
 * said Coaching was 1.5 screens when it is 5.8, and Today 3.5 when it is 1.2.
 * A number in a doc is a claim with a date on it. This is how you re-date it.
 *
 *   node scripts/page-census.mjs
 *   BUJO_URL=http://localhost:5199 node scripts/page-census.mjs   # dev server
 *
 * Two widths, because `CardGrid` is two columns to 1535px and three above, so a
 * height measured at one is not a height at the other — and the table it
 * replaces never said which it used. Pickleball differs by 0.77 screens between
 * them; Stats by 0.83.
 *
 * Navigation is `?view=<id>` with a full load, the same way `scripts/
 * a11y-axe.mjs` reaches its companion views: this router ignores `popstate`, so
 * a same-document URL change silently re-measures whatever is already mounted.
 *
 * Reads `VIEW_IDS` rather than a list of its own — a hand-written id list
 * resolved against another source is the shape this repo has been bitten by
 * twice (see that file's header).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { VIEW_IDS } = await import('./view-ids.mjs')

const BASE = process.env.BUJO_URL || 'http://localhost:5199'

const browser = await chromium.launch()
// Both grid breakpoints. `CardGrid` is two columns to 1535px and three above,
// so a height measured at one width is not a height at the other — and the
// README's table does not say which it used.
const WIDTHS = [1440, 1600]
const context = await browser.newContext({ viewport: { width: WIDTHS[0], height: 900 } })
const page = await context.newPage()

await page.addInitScript(() => {
  navigator.serviceWorker?.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()))
  localStorage.setItem('bujo:onboarded', '1')
  const existing = localStorage.getItem('bujo:data')
  if (!existing) localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
})
await page.goto(`${BASE}/?demo=1`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const rows = []
for (const id of VIEW_IDS) {
  const px = {}
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(`${BASE}/?view=${id}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    px[w] = await page.evaluate(() => document.documentElement.scrollHeight)
  }
  const m = await page.evaluate(() => {
    // Name a fold the way a screen reader does: `aria-label` first, text
    // second. Filtering on `textContent` alone silently dropped every
    // `Card collapsible` — its toggle holds a caret glyph and nothing else, so
    // its name lives entirely in `aria-label`. That undercounted Coaching by
    // six and reported the page's card folds as absent rather than open.
    const name = (b) => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ')
    // Scope to `<main>`. The shell's header carries four `aria-expanded`
    // menu buttons on every view ("Help and 2 suggestions", "Send feedback",
    // "Account", "More options"); counting document-wide added a flat 4 to
    // every page and made the column useless for comparing pages.
    const root = document.getElementById('main') || document.body
    const folds = [...root.querySelectorAll('[aria-expanded]')]
      // A fold is a disclosure, not a combobox or a menu button.
      .filter((b) => !b.getAttribute('role') || b.getAttribute('role') === 'button')
      .filter((b) => name(b).length > 2)
    return {
      folds: folds.length,
      open: folds.filter((b) => b.getAttribute('aria-expanded') === 'true').length,
      shut: folds.filter((b) => b.getAttribute('aria-expanded') === 'false')
        .map((b) => name(b).slice(0, 28)),
      charts: document.querySelectorAll('.recharts-surface').length,
    }
  })
  rows.push({ id, ...m, px })
}

console.log('view          folds  open  charts   @1440   @1600   shut')
for (const r of rows) {
  console.log(
    `${r.id.padEnd(13)} ${String(r.folds).padStart(4)}  ${String(r.open).padStart(4)}  ${String(r.charts).padStart(5)}  ${(r.px[1440] / 900).toFixed(2).padStart(6)}  ${(r.px[1600] / 900).toFixed(2).padStart(6)}   ${r.shut.join(' · ')}`,
  )
}
await browser.close()
