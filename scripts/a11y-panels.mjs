/**
 * PANEL GATE · axe over every row of a page's `SectionRail`, per theme.
 *
 *   BUJO_URL=http://localhost:4173 npm run a11y:panels
 *   BUJO_CANARY=1 ... — plant a violation and prove the run can go red
 *
 * **Pickleball, Fitness, Strength, Nutrition, Recovery and Cycle today, and
 * the list is meant to grow.** COD-237
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
  { view: 'nutrition', rows: ['Today', 'Trend', 'Patterns'] },
  /**
   * RECOVERY, which COD-237 named as one of the six pages a rail made less
   * visible to `npm run a11y` — and which stayed unarmed through its own rail
   * pass, so five groups have been graded by the one the page opens on.
   *
   * Its `patterns` row also carries sub-section chips now; those are inside
   * the row, so opening the row reaches them, and the chips default to All.
   */
  { view: 'nofap', label: 'recovery', rows: ['Win or loss', 'Progress', 'Patterns', 'Plan', 'Reference'] },
  /**
   * CYCLE, the last of the six pages COD-237 named and the one with the most
   * to hide: six rail rows, of which `npm run a11y` has only ever scanned
   * `This cycle`. Its `Manual` row is a `CardDeck` of nine sections, so
   * `stepDecks` below is doing real work here — without it the gate would see
   * one of nine and call the row covered.
   */
  { view: 'cycle', rows: ['This cycle', 'How you feel', 'Fertility', 'Patterns', 'Your log', 'Guide', 'Manual'] },
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


/**
 * STEP EVERY CARD OF EVERY DECK, because a deck shows one at a time.
 *
 * `CardDeck` is a snap scroller: nine cards exist in the DOM but only one is
 * in view, and the eight others are scrolled out of the clip rect. axe reads
 * the rendered tree, so they ARE scanned — but anything that depends on being
 * ON SCREEN is not, and the page's own "is this reachable" assertions are not
 * either. More to the point, this is exactly the COD-237 shape one level down:
 * a control that shows one of N and a gate that looks at whichever one it
 * opened on.
 *
 * So the gate drives it. Each "Next card" press is followed by a settle and
 * a scan, and the count returned goes in the table beside the fold count —
 * a deck that stops stepping is then visible as a number that stopped moving.
 */
async function deckCards(page) {
  return await page.evaluate(() => {
    const decks = [...document.querySelectorAll('#main [role="group"][aria-label$="cards"]')]
    return decks.reduce((n, d) => n + d.children.length, 0)
  })
}

async function stepDecks(page, onEach) {
  const next = () => page.evaluate(() => {
    const b = [...document.querySelectorAll('#main button[aria-label^="Next card"]')].find((x) => !x.disabled)
    if (!b) return false
    b.click()
    return true
  })
  // A hard cap, because a deck that never disables its Next button would
  // otherwise spin this gate forever — the failure mode is a hang, which is
  // worse than a red.
  for (let i = 0; i < 20; i++) {
    if (!(await next())) return i
    await settle(page)
    await onEach()
  }
  return 20
}

/**
 * OPEN A ROW'S FIRST RECORD WINDOW, because axe cannot see inside a dialog
 * that nobody opened.
 *
 * Same blind spot as a closed fold (COD-93) and an unselected rail row
 * (COD-237), one mechanism further on: Cycle's `Your log` rows each open the
 * day in a Radix dialog, and everything in it — the temperature input, nine
 * chip groups, the note — is absent from the DOM until one is pressed.
 *
 * One row, not all of them: every row opens the same two components with a
 * different date, so the thirtieth adds nothing the first did not. Escape
 * closes it again so the next scan starts from the page, not from a modal.
 */
async function openRecordWindow(page) {
  const opened = await page.evaluate(() => {
    const row = document.querySelector('#main [data-card="log"] button[aria-pressed]')
    if (!row) return false
    row.click()
    return true
  })
  if (!opened) return 0
  await settle(page)
  return await page.evaluate(() => (document.querySelector('[role="dialog"]') ? 1 : 0))
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
console.log('viewport · theme · page/row            folds  cards  violations')

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
      // A record window holds a whole editor and is not in the DOM until a
      // row is pressed. Opened after the folds so its own folds are reached
      // by the pass below.
      const win = await openRecordWindow(page)
      if (win) { await openFolds(page); await settle(page) }
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

      /* AND EVERY OTHER CARD OF THE DECK. See `stepDecks` — a row that shows
         one of nine is the COD-237 blind spot wearing a scroller. */
      const cards = await deckCards(page)
      if (win) { await page.keyboard.press('Escape'); await settle(page) }
      const stepped = await stepDecks(page, async () => {
        const r = await new AxeBuilder({ page }).include('#main').analyze()
        const b = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
        serious += b.length
        for (const v of b) bad.push(v)
      })
      console.log(
        `${vp.name.padEnd(8)} ${theme.padEnd(7)} ${`${page_id}/${label}`.padEnd(22)} ${String(folds).padStart(3)} ${String(cards ? `${stepped + 1}/${cards}` : '–').padStart(5)}   ` +
        (bad.length === 0 ? 'clean' : bad.map((v) => `${v.impact} ${v.id} ×${v.nodes.length} · ${v.nodes[0]?.failureSummary?.split('\n')[1] ?? ''}`).join(' | ')),
      )
    }
    await ctx.close()
   }
  }
}
console.log(`\n${serious === 0 ? 'ALL CLEAN' : `${serious} serious/critical`} across every panel`)
await browser.close()
