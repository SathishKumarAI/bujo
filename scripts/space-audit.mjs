/**
 * SPACE AUDIT · how much of a page is doing work, measured.
 *
 *   npm run space -- <view> [view…]      one or more `?view=` ids
 *   npm run space -- --all               every id in the shared registry
 *
 * Answers three questions per viewport, and nothing else. Every one of them is
 * a number you can put in a PR body:
 *
 * | Column | Question | Bad looks like |
 * |---|---|---|
 * | `screens` | how far must I scroll | > 3 on desktop |
 * | `cols` | how many columns does the layout actually use | `1` on a 1440 page |
 * | `fill` | of each card's box, how much holds content | < 45% |
 *
 * **Why `fill` is measured from DIRECT CHILDREN and not from text.** The first
 * draft took the bounding box of every text leaf and called the rest empty.
 * That is wrong for wrapped prose: the last line of a paragraph ends mid-way
 * across, so a perfectly packed 282px card of drill instructions reported
 * "254px unused to the right" and ranked as the worst offender on the page. It
 * sent me chasing a gap that did not exist. A card's direct children are its
 * real layout boxes — they are what the author placed, and their union is what
 * the author filled.
 *
 * **What this cannot see.** It measures boxes, not meaning. A page can score
 * well and still be badly organised — the summary card at the *bottom*, the
 * primary action below three screens of analytics. `npm run a11y` and
 * `npm run clipped` answer different questions again (see CLAUDE.md). Read a
 * good score as "this page is packed", never as "this page is good".
 */
import { chromium } from 'playwright'

/**
 * `BUJO_URL` first — this script was the one holdout on `BASE_URL`.
 *
 * Every other script in this directory reads `BUJO_URL`, so a run that exported
 * it once and then invoked several gates pointed this one at the default port
 * instead: a different worktree's preview server, or another project's dev
 * server entirely. That is the `npm run smoke` disaster in miniature (CLAUDE.md
 * — three PRs quoted a pass from **a different application**), and the tell is
 * the same: a browser gate whose target is decided by something other than what
 * you set. `BASE_URL` still works so nothing that already exports it breaks.
 */
const BASE = process.env.BUJO_URL ?? process.env.BASE_URL ?? 'http://localhost:4173'
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

/** Over 3 screens of desktop is a page you cannot hold in your head. */
const SCREEN_BUDGET = 3
/** Under this, the card's box is mostly air. */
const FILL_FLOOR = 0.45

const args = process.argv.slice(2)
let views = args.filter((a) => !a.startsWith('--'))
if (args.includes('--all')) {
  const { VIEW_IDS } = await import('./view-ids.mjs')
  views = VIEW_IDS
}
if (!views.length) {
  console.error('usage: npm run space -- <view> [view…] | --all')
  process.exit(1)
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
let failures = 0

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  console.log(`\n═══ ${vp.name} · ${vp.width}×${vp.height}\n`)

  for (const view of views) {
    await page.goto(`${BASE}/?demo=1&view=${view}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1800)

    // AS SHIPPED, then OPEN.
    //
    // Measuring only the opened page punishes a disclosure for existing: fold
    // four optional fields away and the page is shorter for every user, while
    // this tool — which opens everything before it measures — reports no change
    // at all. Measuring only the shipped page rewards hiding content, which is
    // the trap the a11y gate already documents. So both, and the gap between
    // them is what the folds are worth.
    const shippedH = await page.evaluate(() => Math.round(document.querySelector('#main')?.getBoundingClientRect().height ?? 0))

    // Folds hide content, and content is what we are measuring. Same reasoning
    // as the a11y gate's openFolds: a collapsed page is not a short page.
    for (let pass = 0; pass < 3; pass++) {
      const n = await page.evaluate(() => {
        const shut = [...document.querySelectorAll('#main [aria-expanded="false"]')]
        shut.forEach((b) => b.click())
        return shut.length
      })
      if (!n) break
      await page.waitForTimeout(350)
    }
    await page.waitForTimeout(400)

    const r = await page.evaluate(() => {
      const main = document.querySelector('#main')
      if (!main) return null
      // A CARD IS A LEAF `<section>`.
      //
      // Both primitives render `<section>`: `Card` is one, and
      // `CollapsibleSection` is one wrapping the cards inside it. Taking the
      // OUTERMOST section therefore counts a group as a single card and hides
      // every card it holds — Pickleball read as 4 cards instead of 41, and
      // its thin ones vanished behind the wrapper. Taking the innermost is
      // wrong the other way, because a card's inner chips also carry
      // `rounded-card`. "A section with no section inside it" needs no
      // knowledge of either component's classes and survives both being
      // restyled.
      const sections = [...main.querySelectorAll('section')]
      const tops = sections.filter((c) => {
        const b = c.getBoundingClientRect()
        return b.width > 120 && b.height > 60 && !sections.some((o) => o !== c && c.contains(o))
      })
      const groups = sections.length - tops.length

      const fill = tops.map((c) => {
        const cb = c.getBoundingClientRect()
        const kids = [...c.children].map((k) => k.getBoundingClientRect()).filter((b) => b.width * b.height > 0)
        const used = kids.reduce((sum, b) => sum + b.width * b.height, 0)
        return {
          title: (c.querySelector('h2, h3')?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 26) || '(untitled)',
          w: Math.round(cb.width),
          h: Math.round(cb.height),
          ratio: Math.min(1, used / (cb.width * cb.height)),
        }
      })

      // How many columns the layout actually uses: distinct left edges among
      // the top-level cards, which is the question "is this a single stack?".
      const cols = new Set(tops.map((c) => Math.round(c.getBoundingClientRect().x / 8) * 8)).size

      return { pageH: Math.round(main.getBoundingClientRect().height), cards: tops.length, groups, cols, fill }
    })

    if (!r) {
      console.log(`  ${view.padEnd(14)} — no #main; the view did not render, so its numbers mean nothing`)
      failures++
      continue
    }

    const screens = Math.round((r.pageH / vp.height) * 10) / 10
    const shipped = Math.round((shippedH / vp.height) * 10) / 10
    const thin = r.fill.filter((f) => f.ratio < FILL_FLOOR).sort((a, b) => a.ratio - b.ratio)
    const overBudget = vp.name === 'desktop' && screens > SCREEN_BUDGET
    if (overBudget) failures++

    console.log(
      `  ${view.padEnd(14)} ${String(shipped).padStart(4)} shipped · ${String(screens).padStart(4)} open${overBudget ? ' ⚠' : '  '}` +
        ` · ${String(r.cards).padStart(3)} cards in ${r.groups} group(s) · ${r.cols} column${r.cols === 1 ? ' ⚠' : 's'}` +
        ` · ${thin.length} thin`,
    )
    for (const f of thin.slice(0, 4)) {
      console.log(`      ${String(Math.round(f.ratio * 100)).padStart(3)}% full  ${f.w}×${f.h}  ${f.title}`)
    }
  }
  await ctx.close()
}

await browser.close()
console.log(
  failures
    ? `\n${failures} page(s) over ${SCREEN_BUDGET} desktop screens or not rendering. Not a gate — a list to work through.`
    : '\nEvery page inside budget.',
)
