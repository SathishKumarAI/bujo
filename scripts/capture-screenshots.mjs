// Capture app screenshots for the README. Drives a running build with Playwright,
// bypasses the first-run gate ("This device only"), and saves desktop + mobile
// shots of a curated set of views to docs/screenshots/.
//
// Usage: BUJO_URL=http://localhost:4173 node scripts/capture-screenshots.mjs
// (the CI workflow starts `vite preview` first). Routing is ?view=<id>.
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

// Playwright may be a local devDep (CI) or globally installed (dev box); resolve
// either via createRequire rather than a static ESM import.
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = process.env.BUJO_URL || 'http://localhost:4173'
const OUT = 'docs/screenshots'
const VIEWS = ['today', 'trackers', 'fitness', 'stats', 'pickleball', 'goals']

mkdirSync(OUT, { recursive: true })

async function enter(page) {
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  try {
    await page.locator('button', { hasText: 'This device only' }).first().click({ timeout: 8000 })
  } catch { /* already past the gate */ }
  await page.waitForTimeout(2000)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined, // CI uses Playwright's chromium
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const desk = await browser.newContext({ viewport: { width: 1280, height: 860 } })
const dp = await desk.newPage()
await enter(dp)
for (const v of VIEWS) {
  await dp.goto(`${BASE}/?view=${v}`, { waitUntil: 'load' })
  await dp.waitForTimeout(1400)
  await dp.screenshot({ path: `${OUT}/${v}-desktop.png` })
  console.log('desktop', v)
}

const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })
const mp = await mob.newPage()
await enter(mp)
for (const v of ['today', 'trackers', 'fitness']) {
  await mp.goto(`${BASE}/?view=${v}`, { waitUntil: 'load' })
  await mp.waitForTimeout(1400)
  await mp.screenshot({ path: `${OUT}/${v}-mobile.png` })
  console.log('mobile', v)
}

await browser.close()
console.log('done →', OUT)
