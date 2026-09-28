/**
 * iPhone 13 Pro probe — 390x844, DPR 3, isMobile, hasTouch.
 *
 * Measures, per view: touch targets under 44x44, horizontal overflow,
 * inputs under 16px (iOS focus zoom), page height in screens, and what
 * sits under the simulated safe-area insets.
 *
 * Reuses a11y-axe's navigation shape (click the chrome, never ?view=) and
 * its fold/lazy passes, so it sees the same DOM the a11y gate sees.
 *
 *   BUJO_URL=http://localhost:4181 node phone-probe.mjs [--json out.json]
 */
import { chromium, devices } from 'playwright'

const BASE = process.env.BUJO_URL ?? 'http://localhost:4181'
const THEME = process.env.BUJO_THEME ?? 'mocha'

const VIEWS = [
  ['Today', null],
  ['Plan', null],
  ['Plan', 'Goals'],
  ['Body', 'Fitness'],
  ['Body', 'Strength'],
  ['Body', 'Program'],
  ['Body', 'Pickleball'],
  ['Body', 'Pull-ups'],
  ['Body', 'Nutrition'],
  ['Body', 'Challenges'],
  ['Body', 'Recovery'],
  ['Body', 'Coaching'],
  ['Mind', 'Mindset'],
  ['Mind', 'Reading'],
  ['Mind', 'Collections'],
  ['Mind', 'Focus'],
  ['Insights', null],
]
const COMPANIONS = [
  ['Home workout', 'homeworkout'],
  ['Settings', 'settings'],
  ['Cycle', 'cycle'],
  ['Account', 'account'],
  ['Help', 'help'],
]

const NAV_SELECTOR = 'nav a, nav button, aside a, aside button, header a, header button, main a[role="tab"], main button[role="tab"], main [role="radio"]'

// iPhone 13 Pro: the home indicator is 34 CSS px, the notch 47 in portrait.
// Chrome on iOS in browser mode reports 0 for both (its own toolbar occupies
// that band); installed to the home screen it reports the real values. Both
// matter, so both are simulated.
const INSET_TOP = 47
const INSET_BOTTOM = 34

async function settle(page) {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null, { timeout: 5000 },
  ).catch(() => {})
  await page.waitForTimeout(120)
}

async function onScreen(page, locator) {
  const vp = page.viewportSize()
  const n = await locator.count()
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i)
    const box = await el.boundingBox().catch(() => null)
    if (!box) continue
    if (box.x + box.width <= 0 || box.x >= vp.width) continue
    return el
  }
  return null
}

async function go(page, name) {
  const items = page.locator(NAV_SELECTOR)
  await items.filter({ hasText: new RegExp(`^${name}([,·]|$)`) }).first()
    .waitFor({ state: 'attached', timeout: 15000 }).catch(() => {})
  // Scroll to the top first: the bottom nav and the header fold hide on
  // scroll-down (COD-202), so a control can be present and one pixel off screen.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(250)
  const target =
    (await onScreen(page, items.filter({ hasText: new RegExp(`^${name}$`) }))) ??
    (await onScreen(page, items.filter({ hasText: new RegExp(`^${name}[,·]`) })))
  if (!target) return false
  await target.click({ timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(300)
  await settle(page)
  return true
}

async function openFolds(page) {
  for (let pass = 0; pass < 4; pass++) {
    const n = await page.evaluate(() => {
      const shut = [...document.querySelectorAll('#main [aria-expanded="false"]:not([aria-haspopup])')]
      for (const el of shut) el.click()
      return shut.length
    })
    if (n === 0) break
    await settle(page)
  }
}

/** The measurement. Runs in the page. */
const MEASURE = (insets) => {
  const FLOOR = 44
  const vw = window.innerWidth
  const vh = window.innerHeight

  const name = (el) =>
    (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) || '(unnamed)'

  const where = (el) => {
    const card = el.closest('[data-card]')
    if (card) return `card:${card.getAttribute('data-card')}`
    const nav = el.closest('nav[aria-label]')
    if (nav) return `nav:${nav.getAttribute('aria-label')}`
    if (el.closest('header')) return 'header'
    return el.closest('#main') ? 'main' : 'shell'
  }

  // A stable-ish identity for the component: the longest Tailwind-ish class run.
  const sig = (el) => {
    const c = (el.className && typeof el.className === 'string' ? el.className : '')
    return c.split(/\s+/).filter((x) => /^(h-|w-|min-h|min-w|size-|p[xy]?-|text-)/.test(x)).slice(0, 5).join(' ')
  }

  const INTERACTIVE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="radio"], [role="checkbox"], [role="menuitem"], [tabindex="0"]'

  const visible = (el) => {
    const st = getComputedStyle(el)
    if (st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') return false
    if (Number(st.opacity) === 0) return false
    const b = el.getBoundingClientRect()
    return b.width > 0 && b.height > 0
  }

  const els = [...document.querySelectorAll(INTERACTIVE)].filter(visible)

  const small = []
  for (const el of els) {
    const b = el.getBoundingClientRect()
    // The *hit* area, not the ink: a padded parent or an ::after expansion
    // counts. Only the element's own box is measurable here, which is what a
    // finger actually lands on for these.
    const w = Math.round(b.width), h = Math.round(b.height)
    if (w >= FLOOR && h >= FLOOR) continue
    small.push({ w, h, name: name(el), where: where(el), tag: el.tagName.toLowerCase(), sig: sig(el) })
  }

  // Inputs under 16px computed font-size: iOS zooms the viewport on focus.
  const zoomers = []
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
    if (!visible(el)) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs < 16) zoomers.push({ fs: Math.round(fs * 100) / 100, tag: el.tagName.toLowerCase(), type: el.getAttribute('type') ?? '', name: name(el), where: where(el) })
  }

  // Horizontal overflow at the document level.
  const docW = document.documentElement.scrollWidth
  const bodyW = document.body.scrollWidth

  // Anything under the simulated insets. A fixed/sticky element whose box
  // intersects the top `insets.top` px or the bottom `insets.bottom` px band.
  const underNotch = []
  const underIndicator = []
  for (const el of document.querySelectorAll('*')) {
    const st = getComputedStyle(el)
    if (st.position !== 'fixed' && st.position !== 'sticky') continue
    if (!visible(el)) continue
    const b = el.getBoundingClientRect()
    if (b.height === 0) continue
    const id = `${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}${el.id ? `#${el.id}` : ''}`
    if (b.top < insets.top && b.bottom > 0) underNotch.push({ id, top: Math.round(b.top), bottom: Math.round(b.bottom), pos: st.position, pt: st.paddingTop })
    if (b.bottom > vh - insets.bottom && b.top < vh) underIndicator.push({ id, top: Math.round(b.top), bottom: Math.round(b.bottom), pos: st.position, pb: st.paddingBottom })
  }

  // How far the page scrolls, in screens.
  const pageH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)

  // Where is the page's primary action?
  const primary = [...document.querySelectorAll('#main [data-variant="primary"]')].filter(visible).map((el) => {
    const b = el.getBoundingClientRect()
    return { name: name(el), absY: Math.round(b.top + window.scrollY), h: Math.round(b.height), w: Math.round(b.width) }
  })

  return {
    vw, vh, docW, bodyW, pageH,
    screens: Math.round((pageH / vh) * 100) / 100,
    interactive: els.length,
    small, zoomers, underNotch, underIndicator, primary,
  }
}

const out = []

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ...devices['iPhone 13 Pro'],
  // Playwright's iPhone 13 Pro descriptor is WebKit-flavoured UA on Chromium;
  // the geometry is what we need and it matches: 390x844, dsf 3.
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  viewport: { width: 390, height: 844 },
  baseURL: BASE,
})
const page = await ctx.newPage()

await page.goto(`${BASE}/?demo=1`, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate((t) => {
  const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
  d.settings = { ...(d.settings ?? {}), storageMode: 'local', theme: t }
  localStorage.setItem('bujo:data', JSON.stringify(d))
  localStorage.setItem('bujo:onboarded', '1')
  for (const k of Object.keys(localStorage)) if (k.startsWith('bujo.ui.')) localStorage.removeItem(k)
}, THEME)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForFunction(() => document.querySelector('#main')?.innerText?.length > 40, null, { timeout: 20000 }).catch(() => {})
await settle(page)

// Simulate the safe-area insets. Chromium has no env() inset emulation, so
// define the four variables as fallbacks the same way a notched device would.
await page.addStyleTag({ content: `:root { --probe-inset-top: ${INSET_TOP}px; --probe-inset-bottom: ${INSET_BOTTOM}px; }` })

async function visit(label, nav) {
  try {
    if (!(await nav())) return { label, error: 'could not reach it' }
    await openFolds(page)
    await page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
    await settle(page)
    await openFolds(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(200)
    await settle(page)
    const r = await page.evaluate(MEASURE, { top: INSET_TOP, bottom: INSET_BOTTOM })
    return { label, ...r }
  } catch (e) {
    return { label, error: String(e).slice(0, 160) }
  }
}

for (const [section, tab] of VIEWS) {
  const label = tab ? `${section} · ${tab}` : section
  out.push(await visit(label, async () => {
    if (!(await go(page, section))) return false
    if (tab && !(await go(page, tab))) return false
    return true
  }))
  process.stderr.write(`. ${label}\n`)
}
for (const [label, id] of COMPANIONS) {
  out.push(await visit(label, async () => {
    await page.goto(`${BASE}/?view=${id}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForFunction(() => document.querySelector('#main')?.innerText?.length > 40, null, { timeout: 20000 }).catch(() => {})
    await settle(page)
    return true
  }))
  process.stderr.write(`. ${label}\n`)
}

await browser.close()

// ── report ───────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n)
const num = (s, n) => String(s).padStart(n)

console.log(`\niPhone 13 Pro · 390x844 · dpr3 · ${THEME} · ${BASE}\n`)
console.log(`${pad('view', 22)} ${num('scrn', 5)} ${num('ctrls', 6)} ${num('<44', 5)} ${num('<16px', 6)} ${num('docW', 5)}  notch/ind`)
console.log('-'.repeat(78))
for (const r of out) {
  if (r.error) { console.log(`${pad(r.label, 22)} ERROR ${r.error}`); continue }
  console.log(
    `${pad(r.label, 22)} ${num(r.screens, 5)} ${num(r.interactive, 6)} ${num(r.small.length, 5)} ${num(r.zoomers.length, 6)} ${num(r.docW, 5)}  ${r.underNotch.length}/${r.underIndicator.length}`,
  )
}

// Aggregate the small targets by signature, worst first.
const bySig = new Map()
for (const r of out) for (const s of r.small ?? []) {
  const k = `${s.where}|${s.tag}|${s.w}x${s.h}|${s.sig}`
  const e = bySig.get(k) ?? { ...s, n: 0, views: new Set(), names: new Set() }
  e.n++; e.views.add(r.label); e.names.add(s.name)
  bySig.set(k, e)
}
console.log(`\n── touch targets under 44x44, by shape (total ${[...bySig.values()].reduce((a, b) => a + b.n, 0)}) ──\n`)
const rows = [...bySig.values()].sort((a, b) => b.n - a.n).slice(0, 45)
for (const e of rows) {
  console.log(`${num(e.n, 4)}x  ${pad(`${e.w}x${e.h}`, 8)} ${pad(e.tag, 7)} ${pad(e.where, 26)} ${pad([...e.views].length + ' views', 9)} ${[...e.names].slice(0, 3).join(' / ')}`)
  if (e.sig) console.log(`        ${e.sig}`)
}

const zoom = out.flatMap((r) => (r.zoomers ?? []).map((z) => ({ ...z, view: r.label })))
console.log(`\n── inputs under 16px (iOS focus zoom): ${zoom.length} ──`)
const zSig = new Map()
for (const z of zoom) {
  const k = `${z.tag}|${z.type}|${z.fs}`
  zSig.set(k, (zSig.get(k) ?? 0) + 1)
}
for (const [k, n] of [...zSig].sort((a, b) => b[1] - a[1])) console.log(`  ${num(n, 4)}x  ${k}`)
if (zoom.length) console.log(`  examples: ${zoom.slice(0, 5).map((z) => `${z.view}:${z.name}`).join(' | ')}`)

console.log(`\n── safe area ──`)
for (const r of out.slice(0, 3)) {
  if (r.error) continue
  console.log(`  ${r.label}:`)
  for (const u of r.underNotch) console.log(`    notch: ${u.id} top=${u.top} bottom=${u.bottom} ${u.pos} pt=${u.pt}`)
  for (const u of r.underIndicator) console.log(`    indicator: ${u.id} top=${u.top} bottom=${u.bottom} ${u.pos} pb=${u.pb}`)
}

console.log(`\n── primary action, absolute Y on the page ──`)
for (const r of out) {
  if (r.error || !r.primary?.length) continue
  console.log(`  ${pad(r.label, 22)} ${r.primary.map((p) => `${p.name} @y${p.absY} (${p.w}x${p.h})`).join(' | ')}`)
}
const noPrimary = out.filter((r) => !r.error && !r.primary?.length).map((r) => r.label)
console.log(`  no primary rendered: ${noPrimary.join(', ') || '(none)'}`)

const jsonArg = process.argv.indexOf('--json')
if (jsonArg > -1) {
  const fs = await import('node:fs')
  fs.writeFileSync(process.argv[jsonArg + 1], JSON.stringify(out, null, 1))
}
