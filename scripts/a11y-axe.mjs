/**
 * Accessibility gate: run axe-core over the app's main views.
 *
 * The a11y work in this repo has been verified by hand — focus traps, heading
 * order, aria-labels on calendar cells, contrast ratios measured per theme.
 * None of it is protected. This is the automated floor underneath it.
 *
 *   BUJO_URL=http://localhost:4173 node scripts/a11y-axe.mjs
 *
 * Fails on **serious** and **critical** violations only. Moderate findings are
 * reported but not fatal: most are contrast inside chart internals, which needs
 * the data-viz palette decision rather than a blanket fix, and a gate that
 * always fails is a gate everyone learns to ignore.
 *
 * Navigation clicks the chrome rather than setting `?view=` and reloading —
 * this router reads the URL once at boot, and an earlier sweep that drove it by
 * URL silently re-measured Today twenty times and reported a clean sweep.
 *
 * The click target is `nav`, `aside` AND the section tab row, and matches
 * links as well as buttons. Both halves of that matter and both have already
 * bitten: the five-section rail moved most views out of the sidebar and into
 * tabs, and made the rail rows real `<a>` elements so ⌘-click works. A selector
 * of `nav button` alone silently stopped navigating anywhere — every view would
 * have been scored as Today, and the render-length assert below would not have
 * noticed, because Today renders plenty of text.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium, AxeBuilder
try {
  ;({ chromium } = require('playwright'))
  AxeBuilder = require('@axe-core/playwright').default
} catch {
  console.error('This script needs Playwright and @axe-core/playwright, which are')
  console.error('deliberately not dependencies (CI installs them with --no-save).')
  console.error('Run:  npm i -D --no-save playwright @axe-core/playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'
// The whole Body cluster, added with its restructure: a gate that does not
// visit a page cannot vouch for it.
//
// Recovery was left out at first on the reasoning that it sits behind an opt-in
// setting. That was wrong — `nofapEnabled` DEFAULTS to true, so the sidebar
// entry is there on a fresh journal and always was. Worth remembering as a
// shape of mistake: the exclusion was argued from the code's shape rather than
// checked against the rendered page, which is the same error the gate exists to
// prevent.
//
// `Strength` joined the list when it gained a Body tab: it had been a real view
// with no rail entry at all, reachable only from a conditional link inside
// Fitness, so nothing had ever scanned it.
//
// Each entry is `[section, view]` because a tab row only exists once you are in
// its section — Trackers is reachable from Insights and from nowhere else, and
// clicking straight for it from Plan finds nothing. `null` means the view is
// its own rail row.
const VIEWS = [
  ['Today', null],
  ['Plan', null],
  ['Plan', 'Goals'],
  ['Body', 'Fitness'],
  ['Body', 'Strength'],
  ['Body', 'Pickleball'],
  ['Body', 'Nutrition'],
  ['Body', 'Recovery'],
  ['Body', 'Coaching'],
  ['Mind', 'Reading'],
  ['Mind', 'Collections'],
  ['Insights', null],
  ['Insights', 'Trackers'],
]

/**
 * Today's three time-of-day surfaces, scanned as if they were views — because
 * they are: each shows a different set of cards, and axe can only see what is
 * rendered. Scanning "Today" alone would score whichever surface the clock
 * happened to pick and call the other two clean.
 */
const SURFACES = ['Morning', 'Day', 'Evening']

const browser = await chromium.launch()
// An explicit context, not `browser.newPage()`: @axe-core/playwright refuses a
// page created straight off the browser ("Please use browser.newContext()").
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

// Skip the first-run gate: pick local storage so the app boots into the shell.
await page.addInitScript(() => {
  localStorage.setItem('bujo:onboarded', '1')
  const existing = localStorage.getItem('bujo:data')
  if (!existing) {
    localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
  }
})

await page.goto(BASE, { waitUntil: 'networkidle' })

let serious = 0
const summary = []

/**
 * Click a destination by its visible name, anywhere in the shell chrome.
 * Returns false when nothing matched, which the caller treats as fatal — a view
 * the gate could not reach is a view the gate cannot vouch for, and quietly
 * scanning the previous page instead is how a clean report gets earned by
 * measuring the same screen twelve times.
 */
/**
 * Wait until nothing on the page is still animating.
 *
 * A fixed `waitForTimeout` is not enough and produced a false failure that cost
 * an hour: the entrance fade was still at ~0.68 opacity when axe measured, so a
 * `text-fg-2` line was reported at `#797d91` — a colour that appears in no
 * theme and on no screen — against a 4.25:1 threshold it clears comfortably
 * once opaque. The bug was in the gate, not the page.
 *
 * The same artefact can hide a real failure just as easily as invent one, which
 * is the worse direction. Wait for the animations, not for a guess about them.
 */
async function settle() {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null,
    { timeout: 5000 },
  ).catch(() => {}) // an infinite/looping animation must not hang the gate
  await page.waitForTimeout(120)
}

async function go(name) {
  const target = page
    // Rail rows and section tabs are links; the Today surface switcher is a
    // Radix ToggleGroup whose items are buttons inside `main`.
    .locator('nav a, nav button, aside a, aside button, main [data-slot="toggle-group"] button')
    .filter({ hasText: new RegExp(`^${name}$`) })
    .first()
  if (!(await target.count())) return false
  await target.click()
  await page.waitForTimeout(300)
  await settle()
  return true
}

/** Fail loudly rather than scanning whatever page happened to still be up. */
async function goOrDie(name, why) {
  if (await go(name)) return
  console.error(`\n[${name}] ${why}`)
  console.error('  Either the destination was renamed/retired, or it lost its door. Do not')
  console.error('  drop it from VIEWS to make this pass without checking which.')
  await browser.close()
  process.exit(1)
}

/** Scan whatever is on screen, under a label. */
async function scan(label) {
  await settle()
  // A clean result on a blank page is worse than no gate at all: it reads as
  // proof. Assert the view actually rendered before believing its score.
  const rendered = await page.evaluate(() => (document.querySelector('main')?.innerText ?? '').trim().length)
  if (rendered < 40) {
    console.error(`\n[${label}] rendered ${rendered} characters — the view did not load, so its result means nothing.`)
    await browser.close()
    process.exit(1)
  }
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const meh = results.violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor')
  serious += bad.length
  summary.push({ view: label, serious: bad.length, other: meh.length })

  for (const v of bad) {
    console.error(`\n[${label}] ${v.impact}: ${v.id} — ${v.help}`)
    console.error(`  ${v.helpUrl}`)
    for (const node of v.nodes.slice(0, 3)) console.error(`  ${node.html.slice(0, 120)}
    DATA ${JSON.stringify(node.any?.[0]?.data)}`)
  }
}

for (const [section, tab] of VIEWS) {
  await goOrDie(section, 'no rail row with that name — the gate could not reach it.')
  if (tab) await goOrDie(tab, `no tab with that name inside ${section}.`)
  const label = tab ? `${section} · ${tab}` : section
  await scan(label)

  // Today is three screens behind one name.
  if (section === 'Today') {
    for (const s of SURFACES) {
      await goOrDie(s, 'no surface control with that name on Today.')
      await scan(`Today · ${s}`)
    }
  }
}

await browser.close()

console.log('\nView            serious  other')
for (const s of summary) console.log(`  ${s.view.padEnd(14)} ${String(s.serious).padStart(5)} ${String(s.other).padStart(6)}`)

if (serious > 0) {
  console.error(`\n${serious} serious/critical accessibility violation(s).`)
  process.exit(1)
}
console.log('\nNo serious or critical violations.')
