// Smoke-test every view: boot the app, bypass the first-run gate, navigate to
// each ?view=<id>, and fail if any view logs a console error, throws, or renders
// an empty/blank main. Guards the large view surface (and the lazy-load split)
// against render-time breakage that unit tests can't catch.
//
// Usage:
//   BUJO_URL=http://localhost:5173 node scripts/smoke-views.mjs
//   (point at a running `vite dev` or `vite preview`)
// Exits non-zero if any view fails.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = process.env.BUJO_URL || 'http://localhost:5173'
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable'

// Every routable view id (from App.tsx VIEWS), incl. gated cycle/nofap + account.
const VIEWS = [
  'today', 'plan', 'trackers', 'fitness', 'gym', 'pullups', 'pickleball',
  'coaching', 'homeworkout', 'challenges', 'focus', 'cycle', 'nofap',
  'monthly', 'collections', 'reading', 'goals', 'mindset', 'insights',
  'stats', 'account', 'help', 'settings',
]

// Dev-mode noise we don't want to fail on (HMR, React DevTools hint, etc.).
const IGNORE = [
  /Download the React DevTools/i,
  /\[vite\]/i,
  /React Router Future Flag/i,
  /favicon/i,
  // Sequential full-page navigation against the service-worker-controlled prod
  // site aborts the previous view's in-flight lazy-chunk fetches. Chrome surfaces
  // those as resource-load console errors (ERR_FAILED/ERR_ABORTED) — they are
  // navigation-cancellation noise, not app errors. Real JS failures still arrive
  // via 'pageerror' or as a blank render, which we DO fail on.
  /Failed to load resource:.*(ERR_FAILED|ERR_ABORTED)/i,
]
const ignored = (t) => IGNORE.some((re) => re.test(t))

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const failures = []
let current = 'boot'
page.on('console', (m) => {
  if (m.type() === 'error' && !ignored(m.text())) failures.push(`[${current}] console.error: ${m.text().slice(0, 200)}`)
})
page.on('pageerror', (e) => failures.push(`[${current}] pageerror: ${String(e).slice(0, 200)}`))

// Enter: dismiss the first-run gate ("This device only") if present.
await page.goto(BASE, { waitUntil: 'load' })
await page.waitForTimeout(2000)
try { await page.locator('button', { hasText: 'This device only' }).first().click({ timeout: 6000 }) } catch { /* already in */ }
await page.waitForTimeout(1500)

const results = []
for (const v of VIEWS) {
  current = v
  const before = failures.length
  try {
    await page.goto(`${BASE}/?view=${v}`, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle').catch(() => {}) // let lazy chunks settle before the next nav
    await page.waitForTimeout(800) // + Suspense resolve
    const text = (await page.locator('main, #root').first().innerText().catch(() => '')) || ''
    const blank = text.trim().length < 5
    if (blank) failures.push(`[${v}] rendered blank/empty main`)
    const ok = failures.length === before && !blank
    results.push({ v, ok })
    console.log(`${ok ? '✓' : '✗'} ${v}`)
  } catch (e) {
    failures.push(`[${v}] navigation threw: ${String(e).slice(0, 160)}`)
    results.push({ v, ok: false })
    console.log(`✗ ${v} (threw)`)
  }
}

await browser.close()

const passed = results.filter((r) => r.ok).length
console.log(`\nSmoke: ${passed}/${VIEWS.length} views OK`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log('  - ' + f)
  process.exit(1)
}
console.log('All views rendered clean.')
