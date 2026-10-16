/**
 * PANEL GATE · axe over every row of a page's `SectionRail`, per theme.
 *
 *   BUJO_URL=http://localhost:4173 npm run a11y:panels
 *   BUJO_CANARY=1 ... — plant a violation and prove the run can go red
 *
 * **Pickleball, Fitness and Strength today, and the list is meant to grow.** COD-237
 * names six pages whose rails make `npm run a11y` cover less than it did as
 * folds: Insights, Coaching, Pickleball, Pull-ups, Help and Recovery. Adding
 * one is a `PAGES` entry — do it in the same change as the rail, or the page's
 * numbers describe a fraction of it.
 *
 * COD-237: `openFolds()` finds content by `[aria-expanded="false"]` and a
 * `SectionRail` row carries no such attribute, so `npm run a11y` scans
 * whichever group the page opens on and never sees the other three. This
 * drives each row and scans what it reveals — the "drive it per group with a
 * throwaway probe and say what you measured" the trap asks for.
 *
 * Copies the gate's own waits: theme through the store then assert the root
 * attribute, folds opened to four passes, lazy content revealed, and a settle
 * immediately before axe (a mid-fade blend reports an arithmetically perfect
 * failure describing no token in the app).
 */
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'

/**
 * ONE ENTRY PER RAIL PAGE. Adding a page is a `PAGES` entry, in the same
 * change as its rail — COD-237 names six pages whose other rows no gate
 * reaches, and a page whose numbers describe one of four rows is worse than a
 * page with no numbers, because the green looks like coverage.
 *
 * `rows` are the rail's labels as DRAWN. They are matched against the text of
 * the buttons inside `#main nav`, which is where `SectionRail` renders them —
 * not against every button on the page. `button:has-text()` is a substring
 * match, and a probe that clicked a *different* button whose label merely
 * contained the word has already cost this repo a wrong "feature broken"
 * report.
 */
const PAGES = [
  { view: 'pickleball', rows: ['Sessions', 'Competition', 'Results', 'Activity', 'Matchups'] },
  /**
   * FITNESS IS LISTED TWICE, because its mode toggle is sticky UI state and
   * not a URL parameter, so a run that only clears `bujo.ui.*` scans the
   * cardio half five times and never renders the sport half at all. That is
   * the tab-shell blindness of COD-232 wearing a `Segmented`: whatever a gate
   * walks, ask what is NOT in the DOM while it walks it. `ui` is written into
   * localStorage beside the theme, in the same shape `useStickyState` stores
   * (a bare string, never JSON).
   */
  { view: 'fitness', label: 'fitness·cardio', rows: ['Volume', 'Sessions', 'Bests', 'Mix'], ui: { 'fitness.mode': 'cardio' } },
  { view: 'fitness', label: 'fitness·sport', rows: ['Volume', 'Sessions', 'Bests', 'Mix'], ui: { 'fitness.mode': 'sport' } },
  { view: 'gym', rows: ['Week', 'Sessions', 'Strength', 'Balance', 'Body', 'Load', 'Lookup'] },
]
const DESKTOP_THEMES = (process.env.BUJO_THEMES ?? 'mocha,latte,neon,vscode,dawn').split(',')
const PHONE_THEMES = (process.env.BUJO_PHONE_THEMES ?? 'mocha,latte').split(',')

const settle = async (page) => {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null, { timeout: 5000 },
  ).catch(() => {})
  await page.waitForTimeout(120)
}

async function openFolds(page) {
  let opened = 0
  for (let pass = 0; pass < 4; pass++) {
    const n = await page.evaluate(() => {
      const shut = [...document.querySelectorAll('#main [aria-expanded="false"]:not([aria-haspopup])')]
      for (const el of shut) el.click()
      return shut.length
    })
    if (n === 0) break
    opened += n
    await settle(page)
  }
  return opened
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
let serious = 0
console.log('viewport · theme · page/row            folds  violations')

for (const vp of [
  { name: 'desktop', width: 1440, height: 900, themes: DESKTOP_THEMES },
  { name: 'phone', width: 390, height: 844, themes: PHONE_THEMES },
]) {
  for (const theme of vp.themes) {
   for (const { view, rows, ui = {}, label: pageLabel } of PAGES) {
    const page_id = pageLabel ?? view
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/?demo=1&view=${view}`, { waitUntil: 'networkidle' })
    await page.evaluate(([t, uiState]) => {
      localStorage.setItem('bujo:onboarded', '1')
      const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
      d.settings = { ...(d.settings ?? {}), storageMode: 'local', theme: t }
      localStorage.setItem('bujo:data', JSON.stringify(d))
      // Cleared FIRST, then written: the page's UI state has to meet every
      // shard in the same place, and the one key this run is about has to
      // survive the clear.
      for (const k of Object.keys(localStorage)) if (k.startsWith('bujo.ui.')) localStorage.removeItem(k)
      for (const [k, v] of Object.entries(uiState)) localStorage.setItem(`bujo.ui.${k}`, v)
    }, [theme, ui])
    await page.reload({ waitUntil: 'networkidle' })
    const landed = await page.waitForFunction(
      (t) => document.documentElement.getAttribute('data-theme') === t, theme, { timeout: 8000 },
    ).then(() => true).catch(() => false)
    if (!landed) {
      const got = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
      console.log(`${vp.name} · ${theme} · ${page_id}: theme did not apply — the root says "${got}"`)
      await ctx.close()
      continue
    }

    for (const label of rows) {
      const clicked = await page.evaluate((want) => {
        const hit = [...document.querySelectorAll('#main nav button')].find((b) => (b.textContent ?? '').trim().startsWith(want))
        if (!hit) return false
        hit.click()
        return true
      }, label)
      if (!clicked) {
        const names = await page.evaluate(() => [...document.querySelectorAll('#main nav button')].map((b) => (b.textContent ?? '').trim().slice(0, 30)))
        console.log(`${vp.name} · ${theme} · ${page_id}/${label}: RAIL ROW NOT FOUND — rail buttons: ${JSON.stringify(names.slice(0, 12))}`)
        continue
      }
      await settle(page)
      await page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
      await settle(page)
      const folds = await openFolds(page)
      const chars = await page.evaluate(() => (document.querySelector('#main')?.textContent ?? '').length)
      if (chars < 400) { console.log(`${vp.name} · ${theme} · ${page_id}/${label}: rendered ${chars} characters — the panel did not load`); continue }
      /* CANARY · `BUJO_CANARY=1` plants an unlabelled select in `#main`
         before the scan. A scan that silently matches nothing passes, and this
         probe is the only evidence that four groups were ever looked at — so
         it gets armed against a known violation before its green is quoted. */
      if (process.env.BUJO_CANARY) {
        await page.evaluate(() => {
          const s = document.createElement('select')
          s.innerHTML = '<option>planted</option>'
          document.querySelector('#main')?.appendChild(s)
        })
      }
      await settle(page) // the fold clicks above each started a fresh fade
      const res = await new AxeBuilder({ page }).include('#main').analyze()
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      serious += bad.length
      console.log(
        `${vp.name.padEnd(8)} ${theme.padEnd(7)} ${`${page_id}/${label}`.padEnd(22)} ${String(folds).padStart(3)}   ` +
        (bad.length === 0 ? 'clean' : bad.map((v) => `${v.impact} ${v.id} ×${v.nodes.length} · ${v.nodes[0]?.failureSummary?.split('\n')[1] ?? ''}`).join(' | ')),
      )
    }
    await ctx.close()
   }
  }
}
console.log(`\n${serious === 0 ? 'ALL CLEAN' : `${serious} serious/critical`} across every panel`)
await browser.close()
