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
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('This script needs Playwright, which is deliberately not a dependency')
  console.error('(CI installs it with --no-save to keep it out of the app tree).')
  console.error('Run:  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL || 'http://localhost:5173'

/**
 * The browser to drive. `CHROME_PATH` still wins, for CI images that ship a
 * system Chrome; otherwise this falls through to the Chromium Playwright
 * already installed, which is what `a11y-axe`, `clipped-text` and
 * `check-design-system` do — and why those three run everywhere and this one
 * did not.
 *
 * The default used to be the literal `/usr/bin/google-chrome-stable`, passed as
 * `executablePath` unconditionally, so on Windows the gate died at launch with
 * "Failed to launch chromium because executable doesn't exist". STATUS.md
 * carried the export-this-variable workaround for several sessions. A gate with
 * a documented manual workaround is a gate that does not run: nobody types the
 * incantation, and "smoke passes" quietly means "smoke was skipped".
 */
const CHROME = process.env.CHROME_PATH

/**
 * The ids, from the shared module `viewChrome.test.ts` checks against the app's
 * own registry. `program` and `nutrition` were missing from the list this
 * replaces — both are Body tabs, so the gate had never opened two of the pages
 * its "all views passed" line implied it had.
 */
const { VIEW_IDS: VIEWS } = await import('./view-ids.mjs')

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

/**
 * A failed resource load counts only when the resource is OURS.
 *
 * `account` renders a Supabase notice, so booting it on a machine with no route
 * to Supabase logs `Failed to load resource: net::ERR_NAME_NOT_RESOLVED` and
 * the gate went red. STATUS.md has called that "environmental, not a
 * regression" across at least two sessions — which is the tell. A gate that is
 * known to fail is a gate nobody runs, and its red is then indistinguishable
 * from a real one.
 *
 * Suppressing the string outright would be the wrong fix: the same error
 * against `/assets/…` is a genuinely broken lazy chunk, which is most of what
 * this gate exists to catch. So the test is the ORIGIN, not the message —
 * available on `m.location().url`, which the text alone does not carry.
 *
 * Third-party reachability is not what "does every view render" means.
 */
const OWN_ORIGIN = new URL(BASE).origin
const thirdPartyResource = (m) => {
  if (!/Failed to load resource/i.test(m.text())) return false
  const url = m.location()?.url ?? ''
  return Boolean(url) && !url.startsWith(OWN_ORIGIN)
}

const browser = await chromium.launch({
  // Spread, not `executablePath: CHROME` — passing `undefined` is not the same
  // as omitting the key to Playwright's launcher.
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const failures = []
let current = 'boot'
page.on('console', (m) => {
  if (m.type() !== 'error' || ignored(m.text()) || thirdPartyResource(m)) return
  const from = m.location()?.url ? ` (${m.location().url.slice(0, 120)})` : ''
  failures.push(`[${current}] console.error: ${m.text().slice(0, 200)}${from}`)
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
