// A card subtitle that renders nowhere and is reachable from nowhere (COD-238).
//
// Usage: BUJO_URL=http://localhost:4173 node scripts/subtitle-reach.mjs
//
// ── Why this is its own gate ────────────────────────────────────────────────
//
// Neither existing rendering gate can see this, and both are right to stay
// quiet. `a11y-axe` reads the accessibility tree, and a `display:none`
// subtitle is legitimately absent from it rather than mislabelled.
// `clipped-text` asks whether an element shows *less than it holds*, and an
// element showing *nothing* is skipped by its own 2px filter — the filter that
// exists so `sr-only` labels do not spam it.
//
// So this is the same structural blind spot as the closed fold and the empty
// journal, one level over: **a thing that does not render cannot fail.** The
// predicate here has no judgement in it — a sentence the card author wrote,
// that no user on a phone can reach by any route — which is exactly the kind
// of check worth automating.
//
// ── What it measures ───────────────────────────────────────────────────────
//
// At 390px, folds opened, for every `<section>` that is a Card: a subtitle
// `<p>` that computes to `display: none` AND no ⓘ button anywhere in the same
// card. The ⓘ is the documented escape hatch — `ui.tsx` says "keep the ⓘ on
// phones, where it is the only way to read the subtitle" — so a hidden
// subtitle with a reachable ⓘ is the design working, and a hidden subtitle
// with no ⓘ is the design broken.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch {
  console.error('This script needs Playwright, which is deliberately not a dependency.')
  console.error('Run:  npm i -D --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const BASE = process.env.BUJO_URL ?? 'http://localhost:4173'

// Same list as `clipped-text.mjs`. Kept in step by hand, which is the shape
// CLAUDE.md warns about — but a view missing here under-reports rather than
// passing something broken, and the total is printed so a drop is visible.
const VIEWS = [
  'today', 'monthly', 'trackers', 'fitness', 'nutrition', 'gym', 'pullups',
  'pickleball', 'homeworkout', 'challenges', 'focus', 'plan', 'collections',
  'reading', 'goals', 'insights', 'stats', 'cycle', 'nofap', 'mindset',
  'coaching', 'help', 'settings', 'account',
]

/**
 * The measured floor after COD-238's band fix, so a regression is a number
 * rather than a vibe. It is NOT zero and should not be set to zero yet.
 *
 * 81 → 24. The 24 that remain are all `hideInfo` cards: an author passed the
 * opt-out, which removes the ⓘ deliberately, and the subtitle below it is then
 * stranded on a phone by the same `hidden sm:block` rule. That is a different
 * decision from the band one — the band exclusion was a blanket contract rule
 * and could be fixed in one place; `hideInfo` is 80 deliberate per-card calls,
 * and the fix is COD-238's Option C: decide, per card, whether the sentence
 * belongs in the title or should be deleted. Copy work, not a mechanism.
 *
 * Lower this number as those are resolved. Raising it needs a reason.
 */
const BUDGET = Number(process.env.BUJO_SUBTITLE_BUDGET ?? 24)

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.addInitScript(() => {
  localStorage.setItem('bujo:onboarded', '1')
  if (!localStorage.getItem('bujo:data')) {
    localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
  }
})

const rows = []
let total = 0
let hiddenTotal = 0

for (const view of VIEWS) {
  await page.goto(`${BASE}/?view=${view}&demo=1`, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  // Open every fold, scoped to #main — the shell header carries four
  // `aria-expanded` menu buttons on every view, and a document-wide click
  // toggles those instead, which looks identical to having opened nothing.
  // Four passes because folds nest.
  for (let i = 0; i < 4; i++) {
    const shut = page.locator('#main [aria-expanded="false"]')
    if (await shut.count() === 0) break
    for (const el of await shut.all()) await el.click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(400)

  const r = await page.evaluate(() => {
    const out = { hidden: 0, unreachable: 0, samples: [] }
    for (const card of document.querySelectorAll('#main section')) {
      const h = card.querySelector('h2')
      if (!h) continue
      // Card's header is:
      //   <div class="title column">
      //     <div class="flex">  <h2/>  <button ⓘ/>  </div>
      //     <p class="hidden sm:block">subtitle</p>
      //   </div>
      // so the subtitle is a direct child of the title COLUMN and a sibling of
      // the row holding the h2 — not a sibling of the h2 itself. The first
      // draft of this script asked for the latter, matched nothing anywhere,
      // and printed a confident `0 hidden`. A sweep that finds nothing is
      // indistinguishable from a sweep that is broken, which is why the run
      // below is checked against a known non-zero baseline before it is
      // trusted to report a zero.
      const col = h.parentElement?.parentElement
      if (!col) continue
      const sub = [...col.children].find((el) => el.tagName === 'P')
      if (!sub || !sub.textContent.trim()) continue
      if (getComputedStyle(sub).display !== 'none') continue
      out.hidden++
      // Any ⓘ in this card is a route to the text.
      const info = card.querySelector('button[aria-label^="What is"]')
      const reachable = !!info && getComputedStyle(info).display !== 'none'
      if (!reachable) {
        out.unreachable++
        if (out.samples.length < 2) out.samples.push((h.textContent || '').trim().slice(0, 40))
      }
    }
    return out
  })

  total += r.unreachable
  hiddenTotal += r.hidden
  rows.push([view, r.hidden, r.unreachable, r.samples.join(' · ')])
}

await browser.close()

console.log('view            hidden  unreachable  e.g.')
for (const [v, h, u, s] of rows) {
  if (h === 0 && u === 0) continue
  console.log(`  ${v.padEnd(14)}${String(h).padStart(4)}${String(u).padStart(12)}   ${u ? s : ''}`)
}
console.log(`\n${hiddenTotal} subtitle(s) hidden at 390px · ${total} with no route to the text.`)

if (total > BUDGET) {
  console.error(`\nFAIL: ${total} unreachable subtitle(s), budget ${BUDGET}.`)
  console.error('A sentence the card author wrote that a phone reader cannot reach by any route.')
  process.exit(1)
}
console.log(total === 0 ? 'Every hidden subtitle is reachable.' : `Within budget (${BUDGET}).`)
