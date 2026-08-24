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
  ['Body', 'Program'],
  ['Body', 'Pickleball'],
  ['Body', 'Nutrition'],
  ['Body', 'Challenges'],
  ['Body', 'Recovery'],
  ['Body', 'Coaching'],
  ['Body', 'Tracking'], // was ['Insights', 'Trackers'] until it moved sections
  ['Mind', 'Mindset'],
  ['Mind', 'Reading'],
  ['Mind', 'Collections'],
  ['Mind', 'Focus'],
  ['Insights', null],
  // Stats was never on this list. It has therefore never been scanned, and
  // every "0 serious" this gate has ever printed excluded it — the same failure
  // the file's own header warns about, sitting inside the file that warns.
  ['Insights', 'Stats'],
]

/**
 * Today's three time-of-day surfaces, scanned as if they were views — because
 * they are: each shows a different set of cards, and axe can only see what is
 * rendered. Scanning "Today" alone would score whichever surface the clock
 * happened to pick and call the other two clean.
 */
const SURFACES = ['Morning', 'Day', 'Evening']

/**
 * COMPANIONS · views with no tab of their own.
 *
 * `VIEWS` above is `[section, tab]` pairs that this gate *clicks*, which means
 * it can only ever reach something the tab row names. Pull-ups and Home workout
 * are companions — reached from a link inside Fitness, deliberately not tabs —
 * so no amount of clicking section rows finds them, and they have never been
 * scanned. That is the same hole `Strength` and `Recovery` were in, and it is
 * invisible from the report: a page that is never visited cannot fail.
 *
 * They are reachable by URL again (their `VIEW_ALIASES` redirects were removed
 * once it turned out both pages held things the Fitness activity form does
 * not), so this pass navigates straight to `?view=<id>` rather than hunting a
 * control that by design does not exist.
 */
const COMPANIONS = [
  ['Pull-ups', 'pullups'],
  ['Home workout', 'homeworkout'],
]

/**
 * VIEWPORTS · this gate only ever saw a desktop.
 *
 * Every scan ran at 1280 wide, so the phone layout has never been checked —
 * and it is not the same page with narrower columns. Below `md` the rail is an
 * off-canvas drawer and a bottom tab bar appears; below `sm` card subtitles are
 * not rendered at all and the ⓘ popover that carries them *only exists there*.
 * Whole controls exist at 390 and nowhere else, which is precisely the shape of
 * thing that ships unchecked. Same class of hole as "only mocha was checked",
 * and it sat in a backlog file for the same reason: a manual step never happens.
 *
 * 390×844 is a small iPhone, the narrowest width the app claims to support.
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

const browser = await chromium.launch()
// An explicit context, not `browser.newPage()`: @axe-core/playwright refuses a
// page created straight off the browser ("Please use browser.newContext()").
const context = await browser.newContext({ viewport: VIEWPORTS[0] })
const page = await context.newPage()

/**
 * THEMES · contrast is a per-theme property, and this gate only ever saw one.
 *
 * "Only mocha was checked" sat in STATUS.md as an open item for several
 * sessions, which is the tell that a manual step never happens. Four themes
 * were shipping unverified — and contrast is exactly the class of bug that
 * differs between them, since the token values are what change.
 *
 * Do not hand-roll a contrast check to cover this. An ad-hoc pass written
 * during this session reported ~50 failures per theme that were all artefacts:
 * it read `rgba(r, g, b, 0.08)` tints as opaque and compared text against a
 * colour that is never painted. axe composites the stack properly. Use axe.
 *
 * `BUJO_THEMES=mocha` narrows it while iterating.
 */
const THEMES = (process.env.BUJO_THEMES ?? 'mocha,latte,neon,vscode,dawn').split(',')

/**
 * Themes to re-scan at phone width. Not all five, by default.
 *
 * Contrast is a per-theme property and the desktop pass covers all five of them.
 * What the phone pass adds is *structural*: controls that exist only below a
 * breakpoint, targets that shrink, a drawer and a tab bar that desktop never
 * renders. Those do not vary by theme, so running five themes at 390 would
 * roughly double the gate's runtime to re-prove the same structure five times.
 *
 * Mocha and latte — one dark, one light — because the handful of phone findings
 * that *would* be theme-dependent are contrast ones, and those split along that
 * axis. Widen with `BUJO_PHONE_THEMES` when touching theme tokens.
 */
const PHONE_THEMES = (process.env.BUJO_PHONE_THEMES ?? 'mocha,latte').split(',')

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
let theme = THEMES[0]
let viewport = VIEWPORTS[0].name

/**
 * Switch theme through the store the app actually reads, then assert the
 * attribute the stylesheets key on actually changed. Writing localStorage and
 * hoping is how you scan mocha five times and report five clean themes.
 */
async function setTheme(next) {
  await page.evaluate((t) => {
    const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
    d.settings = { ...(d.settings ?? {}), storageMode: 'local', theme: t }
    localStorage.setItem('bujo:data', JSON.stringify(d))
  }, next)
  await page.reload({ waitUntil: 'networkidle' })
  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme') ?? document.documentElement.className)
  if (!String(applied).includes(next)) {
    console.error(`\n[${next}] theme did not apply — the root says "${applied}".`)
    console.error('  Every result for this theme would actually be the previous one.')
    await browser.close()
    process.exit(1)
  }
  theme = next
}

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

/**
 * Pick the copy of a control that is actually on screen.
 *
 * At phone width the rail is still in the DOM — it is a drawer, parked
 * off-canvas with `-translate-x-full` — so every section name matches twice,
 * once in the hidden drawer and once in the bottom tab bar. `.first()` picks
 * the drawer copy and the click times out.
 *
 * Playwright's `visible` filter does **not** exclude it: the element has a box
 * and is not `display:none` or `visibility:hidden`, so by that definition it is
 * visible. It is merely at `x: -288`. The only thing that separates the two
 * copies is where they are, so that is what this tests — the failure message
 * said `element is outside of the viewport`, and that is the predicate.
 */
async function onScreen(locator) {
  const vp = page.viewportSize()
  const n = await locator.count()
  const offscreen = []
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i)
    const box = await el.boundingBox()
    if (!box) continue // detached or display:none
    const out = box.x + box.width <= 0 || box.x >= vp.width || box.y + box.height <= 0 || box.y >= vp.height
    if (out) { offscreen.push(el); continue }
    return el
  }
  // Nothing on screen, but something exists. That is not automatically the
  // parked drawer: at 390px the Body tab row is 571px of tabs in a 358px row,
  // so Recovery and Cycle sit off the *right* edge and a user reaches them by
  // scrolling the row. Refusing to scroll would have dropped two real views
  // from the phone pass and reported the rest as complete coverage.
  //
  // `scrollIntoViewIfNeeded` scrolls the nearest scrollable ancestor, which is
  // the tab row for a tab and the whole page for nothing else — the drawer has
  // no scrollable ancestor that can bring it in, so it stays rejected below.
  for (const el of offscreen) {
    await el.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {})
    const box = await el.boundingBox()
    if (!box) continue
    const out = box.x + box.width <= 0 || box.x >= vp.width || box.y + box.height <= 0 || box.y >= vp.height
    if (!out) return el
  }
  return null
}

async function go(name) {
  const target = await onScreen(
    page
      // Rail rows and section tabs are links; the Today surface switcher is a
      // Radix ToggleGroup whose items are buttons inside `main`.
      .locator('nav a, nav button, aside a, aside button, main [data-slot="toggle-group"] button')
      .filter({ hasText: new RegExp(`^${name}$`) }),
  )
  if (!target) return false
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
  summary.push({ view: `${viewport} · ${theme} · ${label}`, serious: bad.length, other: meh.length })

  for (const v of bad) {
    console.error(`\n[${viewport} · ${theme} · ${label}] ${v.impact}: ${v.id} — ${v.help}`)
    console.error(`  ${v.helpUrl}`)
    for (const node of v.nodes.slice(0, 3)) console.error(`  ${node.html.slice(0, 120)}
    DATA ${JSON.stringify(node.any?.[0]?.data)}`)
  }
}

for (const vp of VIEWPORTS) {
  viewport = vp.name
  await page.setViewportSize({ width: vp.width, height: vp.height })
  // Reload rather than trusting a resize. The shell reads its breakpoint on
  // mount as well as through media queries, and a bottom tab bar that only
  // appears after a re-render is a bar this gate would scan the absence of.
  await page.reload({ waitUntil: 'networkidle' })
  const themes = vp.name === 'phone' ? PHONE_THEMES : THEMES
  for (const t of themes) {
    await setTheme(t)
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

    // Companion views, reached by URL because they have no tab to click.
    // `setTheme` persists to the journal in localStorage, which survives the
    // navigation, so these are scanned under the theme of the current pass.
    for (const [label, view] of COMPANIONS) {
      await page.goto(`${BASE}?view=${view}`, { waitUntil: 'networkidle' })
      // The alias table used to bounce these to Fitness. If that ever comes
      // back, the URL will silently be a different page and `scan` would
      // happily grade Fitness under this label — so check where we landed.
      const landed = await page.evaluate(() => new URLSearchParams(location.search).get('view'))
      if (landed !== view) {
        console.error(`\n[${label}] asked for ?view=${view} and landed on ?view=${landed}.`)
        console.error('  Something is redirecting it — see VIEW_ALIASES in lib/deepLink.ts.')
        await browser.close()
        process.exit(1)
      }
      await scan(label)
    }
  }
}

await browser.close()

console.log('\nView            serious  other')
for (const s of summary) console.log(`  ${s.view.padEnd(30)} ${String(s.serious).padStart(5)} ${String(s.other).padStart(6)}`)

if (serious > 0) {
  console.error(`\n${serious} serious/critical accessibility violation(s).`)
  process.exit(1)
}
console.log('\nNo serious or critical violations.')
