// Does each Settings section fit one screen?
//
// Drives a real Chromium over `?view=settings&tab=…` at three viewports and
// answers three questions per section: how many screen-widths of columns it
// needs, whether anything scrolls vertically inside it, and whether the PAGE
// moves at all. The layout's whole promise is "one section, one screen", and
// that promise is a measurement, not a look.
//
// ── This file printed "OK" for twelve rows it had not measured ────────────
//
// The first version skipped seeding `localStorage`. `App.tsx` returns
// <Welcome /> with no storage mode set, so the view under test never mounted,
// `.section-screen` was never found, every row came back null — and the
// summary line read `OK: no page scroll, no vertical overflow, anywhere`.
//
// That is this repo's oldest trap (`a scan that silently matches nothing
// passes`) committed by the script written to stop people quoting unmeasured
// numbers. Both halves of the fix are below and both matter: the seed, so
// there is something to measure; and an explicit failure when a row produced
// nothing, so the next person to break the seed gets a red rather than a
// reassuring green.
//
//   BUJO_URL=http://localhost:4173 node scripts/probe-settings.mjs
import { chromium } from 'playwright'

const URL = process.env.BUJO_URL ?? 'http://localhost:4173'
const SECTIONS = ['account', 'feel', 'sync', 'data']
const SIZES = [
  ['desktop', 1440, 900],
  ['laptop', 1280, 800],
  ['phone', 390, 844],
]

const browser = await chromium.launch()
const rows = []

for (const [name, width, height] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()

  for (const tab of SECTIONS) {
    // Seed BEFORE the measured load. `App.tsx` returns <Welcome /> when no
    // storage mode is set and `store.tsx` returns <LockScreen /> when a
    // passcode is — either replaces the whole tree, so the view never mounts.
    await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.setItem('bujo:onboarded', '1')
      localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
    })
    await page.goto(`${URL}/?view=settings&tab=${tab}`, { waitUntil: 'networkidle' })

    // `networkidle` is NOT "the app is ready" — it resolves when the last
    // chunk arrives, not when React has rendered with it. Settings is a lazy
    // import, so without this wait the measurement races the mount and reads
    // an empty page as a passing one.
    await page
      .waitForFunction(() => !!document.querySelector('.section-screen'), null, { timeout: 15000 })
      .catch(() => {})
    await page.waitForTimeout(400)

    const m = await page.evaluate(() => {
      const box = document.querySelector('.section-screen')
      if (!box) return null
      window.scrollTo(0, 5000)
      const pageScroll = window.scrollY
      window.scrollTo(0, 0)
      return {
        screensWide: +(box.scrollWidth / box.clientWidth).toFixed(2),
        verticalOverflow: box.scrollHeight - box.clientHeight,
        pageScroll: Math.round(pageScroll),
        cards: box.children.length,
      }
    })

    rows.push({ size: name, viewport: `${width}x${height}`, tab, ...(m ?? { error: 'no .section-screen' }) })
  }

  await ctx.close()
}
await browser.close()

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('size', 9), pad('viewport', 10), pad('section', 9), pad('screens', 8), pad('v-over', 7), pad('page', 5), 'cards')
for (const r of rows) {
  console.log(
    pad(r.size, 9), pad(r.viewport, 10), pad(r.tab, 9),
    pad(r.screensWide ?? '—', 8), pad(r.verticalOverflow ?? '—', 7),
    pad(r.pageScroll ?? '—', 5), r.cards ?? r.error,
  )
}

// The tripwire. Not paranoia: the first run of this file printed OK for twelve
// rows it had failed to measure at all.
const missing = rows.filter((r) => r.error)
if (missing.length) {
  console.error(`\nFAIL: ${missing.length} of ${rows.length} rows found no .section-screen — this measured NOTHING.`)
  process.exit(1)
}

// A phone is MEANT to scroll down. Below 64rem the column packing does not
// apply at all — there is no spare width to fill at 390px, and forcing it
// there cost 3.16 screens of sideways swiping for Account and 7.41 for Data,
// measured. So the no-scroll promise is asserted where it was made: on the
// wide layout. The phone rows are still printed, because "how long is this
// page on a phone" is worth watching even when it is allowed to exceed a
// screen.
const wideRows = rows.filter((r) => r.size !== 'phone')
const scrolled = wideRows.filter((r) => r.pageScroll > 0 || r.verticalOverflow > 0)
if (scrolled.length) {
  console.error(`\nFAIL: ${scrolled.length} wide row(s) scroll when they should not`)
  process.exit(1)
}

// Sideways is allowed and is the designed overflow direction, so it is
// reported rather than failed — but a section needing a second screen of
// columns is a section with too much in it, and that should be visible.
const wide = wideRows.filter((r) => r.screensWide > 1.05)
console.log(`\nOK: ${rows.length} rows measured — on the wide layout, no page scroll and no vertical overflow`)
console.log(wide.length
  ? `${wide.length} section(s) need more than one screen of columns: ${wide.map((r) => `${r.tab}@${r.size} ${r.screensWide}`).join(', ')}`
  : 'Every section fits one screen at every viewport.')
