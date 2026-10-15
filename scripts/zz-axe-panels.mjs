/**
 * Throwaway probe: axe every Pull-ups panel, not just the one the bar opens on.
 *
 * `npm run a11y` reaches this page by URL and scans whatever mounted, and a
 * single-select bar holds ONE panel in the DOM — so the gate grades `program`
 * and has never seen the other seven (COD-237). This drives each panel and runs
 * axe on it, at every desktop theme and both phone themes.
 */
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'
const SHARDS = [
  { vp: { width: 1440, height: 900 }, themes: ['mocha', 'latte', 'neon', 'vscode', 'dawn'] },
  { vp: { width: 390, height: 844 }, themes: ['mocha', 'latte'] },
]

const browser = await chromium.launch({ args: ['--no-sandbox'] })
let bad = 0
const rows = []

for (const shard of SHARDS) {
  for (const theme of shard.themes) {
    const ctx = await browser.newContext({ viewport: shard.vp })
    const page = await ctx.newPage()
    await page.addInitScript(() => localStorage.setItem('bujo:onboarded', '1'))
    await page.goto(`${BASE}/?demo=1&view=pullups`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => (document.querySelector('#main')?.textContent ?? '').length > 400, null, { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(1200)

    // Switch theme the way the app does — write the setting, clear the sticky
    // UI keys, reload — not by stamping `data-theme`. The CSS variables would
    // repaint either way, but anything resolved in JS at render time keeps the
    // value React last wrote, which measures the new ground against the old
    // foreground (CLAUDE.md). Mirrors `setTheme` in `scripts/a11y-axe.mjs`.
    await page.evaluate((t) => {
      const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
      d.settings = { ...(d.settings ?? {}), storageMode: 'local', theme: t }
      localStorage.setItem('bujo:data', JSON.stringify(d))
      for (const k of Object.keys(localStorage)) if (k.startsWith('bujo.ui.')) localStorage.removeItem(k)
    }, theme)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme, { timeout: 20000 })
      .catch(async () => {
        // Say what was FOUND, not what was asked for. An empty root is a page
        // that has not rendered; the wrong theme is a bug worth stopping on.
        const got = await page.evaluate(() => document.documentElement.dataset.theme ?? '')
        throw new Error(`[${theme}] theme did not apply — the root says "${got}"`)
      })
    await page.waitForTimeout(1200)

    const panels = await page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Pull-up sections"] button')].map((b) => b.textContent.trim()))

    for (const p of panels) {
      await page.getByRole('navigation', { name: 'Pull-up sections' }).getByRole('button', { name: p, exact: true }).click()
      // Settle BEFORE axe: the panel swap starts a fresh `page-enter` fade and
      // axe reads colour from a mid-fade blend otherwise.
      await page.waitForTimeout(700)
      const r = await new AxeBuilder({ page }).include('#main').analyze()
      const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      bad += serious.length
      rows.push(`${String(shard.vp.width).padStart(4)} · ${theme.padEnd(7)} · ${p.padEnd(13)} ${serious.length ? `✗ ${serious.map((v) => `${v.impact}: ${v.id} (${v.nodes.length})`).join(', ')}` : '·'}`)
      for (const v of serious) {
        for (const n of v.nodes.slice(0, 2)) {
          rows.push(`      ${n.html.slice(0, 120)}`)
          rows.push(`      ${JSON.stringify(n.any?.[0]?.data ?? {}).slice(0, 180)}`)
        }
      }
    }
    await ctx.close()
  }
}

console.log(rows.join('\n'))
console.log(`\n${rows.filter((r) => r.includes('·') && !r.startsWith('   ')).length} panel scans · ${bad} serious/critical`)
await browser.close()
