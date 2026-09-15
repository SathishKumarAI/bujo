/**
 * Clipped-text gate: fail when the app hides text it has no other way to show.
 *
 *   BUJO_URL=http://localhost:4173 node scripts/clipped-text.mjs
 *
 * This exists because `npm run a11y` structurally cannot catch it. Clipped text
 * is not an accessibility violation — the string is still in the accessibility
 * tree and a screen reader reads it in full — so axe is right to stay quiet and
 * the defect sails through the one gate that looks at rendered pages. That is
 * how the family kept recurring: `M…` on Stats, `W.` and a nameless habit row on
 * Trackers, "First w…" / "Centur…" / "Unbro…" on Achievements, and most recently
 * six drill descriptions on Coaching losing a third of their sentence.
 *
 * The check is one line of DOM: an element whose `scrollWidth` exceeds its
 * `clientWidth` is showing less than it holds.
 *
 * Two filters keep the signal real, and both were learned by getting them wrong:
 *
 * 1. **Skip anything under 2px.** Screen-reader-only labels are sized
 *    `width: 1px` deliberately. Without this the raw count is 221 on Stats and
 *    110 on Fitness, every one of them noise — which is how a real finding gets
 *    buried in its own report.
 * 2. **Skip a deliberate `-webkit-line-clamp`.** A clamp is a designed truncation
 *    with the full text somewhere else; `white-space: nowrap` + `ellipsis` on a
 *    name or a sentence is not.
 *
 * A truncation that is genuinely wanted opts out with `data-clip-ok`, so the
 * exception is stated in the markup rather than argued for in a review.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('This script needs Playwright, which is deliberately not a')
  console.error('dependency (CI installs it with --no-save). Run:')
  console.error('  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'

// Every view in VIEW_CHROME. A page not on this list is not checked — the same
// rule, and the same failure mode, as `scripts/a11y-axe.mjs`.
const VIEWS = [
  'today', 'monthly', 'trackers', 'fitness', 'nutrition', 'gym', 'pullups',
  'pickleball', 'homeworkout', 'challenges', 'focus', 'plan', 'collections',
  'reading', 'goals', 'insights', 'stats', 'cycle', 'nofap', 'mindset',
  'coaching', 'help', 'settings',
  // Behind the account menu, so it has no tab and was never on this list.
  'account',
]

function findClipped() {
  const out = []
  for (const el of document.querySelectorAll('main *')) {
    if (el.children.length) continue
    const text = (el.textContent || '').trim()
    if (!text) continue
    if (el.closest('[data-clip-ok]')) continue

    const r = el.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) continue // sr-only, by design

    const cs = getComputedStyle(el)
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue // deliberate clamp

    if (el.scrollWidth > el.clientWidth + 1) {
      out.push({ text: text.slice(0, 60), shown: el.clientWidth, needed: el.scrollWidth })
    }
  }
  return out
}

/**
 * The other way to hide something that is present: push a *control* past the
 * edge of the page with nothing able to scroll to it. Not clipped — unreachable.
 *
 * `findClipped` cannot see this, and the distinction is the same blind spot the
 * header describes one level up. That check asks whether an element shows less
 * than it holds — `scrollWidth > clientWidth`. A button sitting at x=453 in a
 * 390px viewport shows *everything* it holds; its own box is fine. The clip
 * happens at an ancestor, and `document.body` still reports `scrollWidth` 390
 * because it happens above the body. So the page measures clean while a third
 * of a toolbar cannot be pressed.
 *
 * Deliberately controls only, not text. The first draft of this ran over every
 * leaf with text and reported 52 hits across 23 views — descenders of a
 * tooltip, SVG `path` nodes, sentences overhanging by 40px. All cosmetic, none
 * of them the defect, and a gate whose red is mostly noise is a gate nobody
 * reads. "You cannot press this" is unambiguous and worth failing a build for.
 *
 * The reachability walk is what keeps even that honest: wide content inside an
 * `overflow-x-auto` box is a design, not a defect — the month grid on Trackers
 * is 900px wide by intent, and every day cell in it is a button — so a control
 * only counts as lost when nothing between it and the document can scroll it
 * into view.
 */
function findUnreachable() {
  // Inline, not a module-level constant: `page.evaluate` ships the function
  // source and nothing it closes over, so a hoisted selector arrives undefined.
  const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"]'
  const out = []
  const limit = document.documentElement.clientWidth
  for (const el of document.querySelectorAll(`main :is(${CONTROLS})`)) {
    const r = el.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) continue // sr-only / not laid out
    if (r.right <= limit + 1 && r.left >= -1) continue
    if (el.closest('[data-clip-ok]')) continue

    let reachable = false
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ov = getComputedStyle(p).overflowX
      if ((ov === 'auto' || ov === 'scroll') && p.scrollWidth > p.clientWidth + 1) { reachable = true; break }
    }
    if (reachable) continue

    const label = ((el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim() || el.tagName.toLowerCase()).slice(0, 60)
    out.push({ text: label, left: Math.round(r.left), right: Math.round(r.right), limit })
  }
  return out
}

/**
 * A field showing less than it holds — the *vertical* case.
 *
 * `findClipped` asks `scrollWidth > clientWidth`, which is the right question
 * for a label and the wrong one for a textarea: a textarea is meant to wrap, so
 * it never overflows horizontally. It overflows *down*, silently, with no
 * scrollbar on a touch device to say there is more.
 *
 * Mindset shipped a cue field 87px wide in a three-across phone row, showing
 * 54px of a 147px note — 63% of what the user had typed, unreachable and
 * unsignposted. Both other rendering gates were green on it: its own box was
 * fine, and the accessibility tree was sound.
 *
 * Only fields that have a value, because an empty box at its minimum height is
 * the normal case and would be pure noise.
 */
function findOverflowingFields() {
  const out = []
  for (const el of document.querySelectorAll('main textarea, main input')) {
    if (!el.value || el.type === 'hidden') continue
    if (el.closest('[data-clip-ok]')) continue
    const r = el.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) continue
    if (el.scrollHeight <= el.clientHeight + 1) continue
    out.push({
      text: ((el.getAttribute('aria-label') || el.getAttribute('placeholder') || 'field').trim()).slice(0, 60),
      shown: el.clientHeight,
      needed: el.scrollHeight,
      chars: String(el.value).length,
    })
  }
  return out
}

/**
 * A scrollport too narrow to scroll in.
 *
 * `findUnreachable` treats "has a scrollable ancestor" as proof a control can
 * be reached, which is right almost always — the month grid is 900px wide by
 * design and every day cell in it is a button. It is wrong when the scrollport
 * itself has been squeezed to nothing by its siblings.
 *
 * Mindset's category filters sat in a `flex-1 overflow-x-auto` row beside a
 * fixed `basis-44` search box and a `flex-none` count. At 390px those two took
 * 314 of the band's 324px and left the scrollport **10px** — eight filters
 * "reachable" by dragging a strip narrower than a fingernail. The unreachable
 * check passed it because the ancestor scrolled; it never asked whether the
 * ancestor was usable.
 *
 * 96px is a judgement call: wide enough that a real horizontal strip (tabs, a
 * chip row, a wide table) clears it comfortably, narrow enough that a collapsed
 * flex child cannot. It is a floor on *usability*, not on content.
 */
function findCrushedScrollports() {
  const FLOOR = 96
  const out = []
  for (const el of document.querySelectorAll('main *')) {
    const ov = getComputedStyle(el).overflowX
    if (ov !== 'auto' && ov !== 'scroll') continue
    if (el.scrollWidth <= el.clientWidth + 1) continue
    if (el.clientWidth >= FLOOR) continue
    if (el.closest('[data-clip-ok]')) continue
    if (el.getBoundingClientRect().height <= 2) continue
    const first = el.querySelector('button, a[href], [role="tab"]')
    out.push({
      text: ((first?.textContent || el.textContent || 'scroll region').trim()).slice(0, 60),
      shown: el.clientWidth,
      needed: el.scrollWidth,
    })
  }
  return out
}


/**
 * Two things in the header drawn on top of each other · the shell's own overflow.
 *
 * Separate from `findUnreachable`, and it has to be, because the failure it
 * catches never leaves the window. When the centring grid gave the tool
 * cluster a column narrower than its contents, the cluster did not clip and did
 * not scroll — a flex row justified to the end overflows **backwards**, so the
 * streak strip was drawn to the LEFT of its own box, straight across the
 * section nav. Measured before the fix: 47px of overlap at 1180, 87px at 1100,
 * **125px at 1024**, on every view. `document.body.scrollWidth` was exactly the
 * window the whole time, every box was inside the viewport, and both rendering
 * gates were green.
 *
 * Text over text is never a design. That makes this the rare geometric check
 * with no judgement in it and no noise to tune away — unlike a general spill
 * check, which reported 52 cosmetic hits the first time it was pointed at this
 * app.
 *
 * Two traps this has to dodge, both of which produce confident phantoms:
 *
 * 1 · **A closed `<details>` still gives its children a box.** Chrome reports a
 *     real rect for content inside a shut fold, so a naive pass "found" 94
 *     overlaps across Coaching that no one can see. `checkVisibility` knows.
 * 2 · **An inline box that wraps has a bounding rect covering both lines**, so
 *     two neighbours on one line read as overlapping. `getClientRects()` gives
 *     the per-line boxes, which is what is actually painted.
 */
function findHeaderCollisions() {
  const header = document.querySelector('header')
  if (!header) return []

  const shown = (el) =>
    el.checkVisibility?.({ checkVisibilityCSS: true, contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true }) ?? true

  // A tab row is a scroller by design; what sits past its edge is clipped by it
  // rather than drawn over the neighbour. Clip every box to the scrollports
  // above it before comparing, or the tabs scrolled out of view "collide" with
  // the date label on the far side of the bar.
  const clipToAncestors = (el, box) => {
    for (let a = el.parentElement; a; a = a.parentElement) {
      const s = getComputedStyle(a)
      const r = a.getBoundingClientRect()
      if (/auto|scroll|hidden|clip/.test(s.overflowX)) { box.l = Math.max(box.l, r.left); box.r = Math.min(box.r, r.right) }
      if (/auto|scroll|hidden|clip/.test(s.overflowY)) { box.t = Math.max(box.t, r.top); box.b = Math.min(box.b, r.bottom) }
    }
    box.l = Math.max(box.l, 0); box.t = Math.max(box.t, 0)
    box.r = Math.min(box.r, window.innerWidth); box.b = Math.min(box.b, window.innerHeight)
    return box
  }

  const marks = []
  for (const el of header.querySelectorAll('*')) {
    if (el.children.length > 0) continue
    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim()
    if (!text || !shown(el)) continue
    for (const line of el.getClientRects()) {
      const box = clipToAncestors(el, { l: line.left, t: line.top, r: line.right, b: line.bottom })
      if (box.r - box.l > 1 && box.b - box.t > 1) marks.push({ el, text: text.slice(0, 28), box })
    }
  }

  const out = []
  for (let i = 0; i < marks.length; i++) {
    for (let j = i + 1; j < marks.length; j++) {
      const a = marks[i], b = marks[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const x = Math.min(a.box.r, b.box.r) - Math.max(a.box.l, b.box.l)
      const y = Math.min(a.box.b, b.box.b) - Math.max(a.box.t, b.box.t)
      if (x > 4 && y > 4) out.push({ a: a.text, b: b.text, x: Math.round(x), y: Math.round(y) })
    }
  }
  return out
}

/**
 * Three widths, and the middle one is the lesson.
 *
 * This gate ran at 1440 — the width at which text is least likely to be
 * clipped — then learned to run at 390 as well. Both passed green while the
 * top bar's tool cluster hung **56px outside its own column on every view**
 * between about 768 and 1100: at 1440 there was room for it, and at 390 the
 * header is a different layout entirely (flex, not the centring grid). The bug
 * lived in the gap between the two widths anyone had thought to measure.
 *
 * 1024 is not arbitrary — it is where a three-column header with a five-item
 * nav runs out of room, and it is a laptop. **A responsive layout fails
 * between breakpoints, not at them.**
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 800 },
  { name: 'phone', width: 390, height: 844 },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VIEWPORTS[0] })

// A fresh profile lands on the storage-mode start screen, which swallows
// `?view=` entirely and leaves every page unmeasured. "Explore the demo" both
// picks a mode and seeds the journal — and the journal matters: half the
// defects this repo has found were invisible on an empty one.
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const explore = page.locator('button', { hasText: /Explore the demo/ })
if (await explore.count()) {
  await explore.first().click()
  await page.waitForTimeout(1500)
}

const bytes = await page.evaluate(() => (localStorage['bujo:data'] ?? '').length)
if (bytes < 20000) {
  console.error(`Journal is ${bytes} bytes — demo data did not load, so this would`)
  console.error('be a clean report measured on an empty app. Refusing to pass.')
  await browser.close()
  process.exit(1)
}

let failures = 0
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height })
  for (const view of VIEWS) {
    await page.goto(`${BASE}/?view=${view}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    // Arm every LazyMount first: lazily-mounted sections do not exist in the
    // DOM until their IntersectionObserver fires, and an unmounted element
    // cannot be measured — the closed-fold trap in a new shape.
    await page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
    await page.waitForTimeout(200)
    const clipped = await page.evaluate(findClipped)
    if (clipped.length) {
      failures += clipped.length
      console.error(`\n${vp.name} · ${view} — ${clipped.length} clipped`)
      for (const c of clipped) console.error(`  "${c.text}"  ${c.shown}px shown, ${c.needed}px needed`)
    }
    const lost = await page.evaluate(findUnreachable)
    if (lost.length) {
      failures += lost.length
      console.error(`\n${vp.name} · ${view} — ${lost.length} controls off-screen and unreachable`)
      for (const c of lost) console.error(`  "${c.text}"  spans ${c.left}–${c.right}px, page is ${c.limit}px`)
    }
    const overflowing = await page.evaluate(findOverflowingFields)
    if (overflowing.length) {
      failures += overflowing.length
      console.error(`
${vp.name} · ${view} — ${overflowing.length} ${overflowing.length === 1 ? 'field' : 'fields'} hiding what was typed in`)
      for (const c of overflowing) console.error(`  "${c.text}"  ${c.shown}px shown of ${c.needed}px (${c.chars} chars)`)
    }
    const collisions = await page.evaluate(findHeaderCollisions)
    if (collisions.length) {
      failures += collisions.length
      console.error(`
${vp.name} · ${view} — ${collisions.length} ${collisions.length === 1 ? 'pair' : 'pairs'} of header text drawn on top of each other`)
      for (const c of collisions) console.error(`  "${c.a}"  over  "${c.b}"  — ${c.x}x${c.y}px`)
    }
    const crushed = await page.evaluate(findCrushedScrollports)
    if (crushed.length) {
      failures += crushed.length
      console.error(`
${vp.name} · ${view} — ${crushed.length} scroll ${crushed.length === 1 ? 'region' : 'regions'} too narrow to scroll in`)
      for (const c of crushed) console.error(`  "${c.text}"  ${c.shown}px wide, holds ${c.needed}px`)
    }
  }
}

await browser.close()

if (failures) {
  console.error(`\n${failures} things hidden from the reader across ${VIEWS.length} views.`)
  console.error('Let the text wrap, give its column the space, let the row wrap so')
  console.error('it stays on the page, let the field grow to its content, or give the')
  console.error('scroll region a width its siblings cannot take. Mark an element')
  console.error('`data-clip-ok` only if the truncation is genuinely intended.')
  process.exit(1)
}
console.log(`No clipped or off-screen text across ${VIEWS.length} views at ${VIEWPORTS.map((v) => v.width).join('px and ')}px.`)
