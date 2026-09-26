/**
 * Accessibility gate: run axe-core over the app's main views.
 *
 * The a11y work in this repo has been verified by hand — focus traps, heading
 * order, aria-labels on calendar cells, contrast ratios measured per theme.
 * None of it is protected. This is the automated floor underneath it.
 *
 *   BUJO_URL=http://localhost:4173 node scripts/a11y-axe.mjs
 *
 * Every scan runs with the view's folds forced open (`openFolds`), because axe
 * cannot see inside a closed disclosure and folding a section used to remove it
 * from this gate silently.
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
 *
 * ── CONCURRENCY ───────────────────────────────────────────────────────────────
 *
 * This ran on one page, strictly serial, and took **8m07s** for ~166 scans. That
 * is long enough that people stop running it before a commit, and this file's own
 * trap list is mostly about what happens when a gate stops being run.
 *
 * The shard is the `viewport · theme` pair — `UNITS` below — because a theme
 * already needs its own reload and the themes are independent of each other.
 * Each worker owns a browser **context** (so its own localStorage, its own demo
 * seed, its own theme) and pulls units off one queue. Nothing is dropped: the
 * same themes, views, viewports and receipt scans, the same fold-opening, the
 * same assertions.
 *
 *   BUJO_A11Y_WORKERS=1   reproduces the old serial walk exactly — reach for it
 *                         when a failure smells like a race, because a loaded
 *                         machine makes every wait in here tighter, not looser.
 *   BUJO_THEMES=mocha     narrows the sweep while iterating.
 *
 * Two consequences worth knowing:
 *
 * 1. **Output is buffered per unit and flushed in `UNITS` order**, not in the
 *    order work finishes. A summary table whose row order changes run to run is
 *    one nobody can diff, and a red scrolling past between two other workers'
 *    green is one nobody can read.
 * 2. **A failure no longer kills the process where it happens.** It aborts the
 *    queue, lets the in-flight workers finish, and then prints the partial
 *    table, what did not run, and the evidence — COD-208 was this gate dying on
 *    a bare "Target crashed" with no summary and no idea which view it was on.
 *    A partial result is printed as a partial result and still exits 1.
 */
import { createRequire } from 'node:module'
import os from 'node:os'

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
  // Stats was never on this list. It has therefore never been scanned, and
  // every "0 serious" this gate ever printed excluded it — the same failure the
  // file's own header warns about, sitting inside the file that warns. It is no
  // longer a tab: its panels moved into Insights behind the domain filter
  // (COD-201), so `['Insights', null]` above now reaches all of them. Removed
  // rather than left to fail, which is the case this file's own error message
  // names: "the destination was renamed/retired".
]

/**
 * Today's three time-of-day surfaces, scanned as if they were views — because
 * they are: each shows a different set of cards, and axe can only see what is
 * rendered. Scanning "Today" alone would score whichever surface the clock
 * happened to pick and call the other two clean.
 */
// 'Habits' is the whole of what was `Body → Tracking` — the month grid, the
// five layouts and the analytics fold. It moved onto Today as a fourth
// surface, so it is scanned here rather than as a tab that no longer exists.
// Dropping it from VIEWS without adding it here would have been the exact
// move this file's own error message warns against.

/**
 * COMPANIONS · views with no tab of their own.
 *
 * `VIEWS` above is `[section, tab]` pairs that this gate *clicks*, which means
 * it can only ever reach something the tab row names. Home workout is a
 * companion — reached from a link inside Fitness, deliberately not a tab — so
 * no amount of clicking section rows finds it, and it was never scanned. That
 * is the same hole `Strength` and `Recovery` were in, and it is invisible from
 * the report: a page that is never visited cannot fail.
 *
 * It is reachable by URL (its `VIEW_ALIASES` redirect was removed once it
 * turned out the page held things the Fitness activity form does not), so this
 * pass navigates straight to `?view=<id>` rather than hunting a control that by
 * design does not exist.
 *
 * Pull-ups was on this list until it became a Body tab; it is clicked through
 * `VIEWS` now. Both passes reach the page, so keeping it here as well would
 * only scan it twice.
 *
 * Both passes now open folds before scanning — see `openFolds` below. This
 * paragraph used to say neither did, and that the Pull-ups manual's six
 * collapsed sections had to be expanded by hand.
 */
const COMPANIONS = [
  ['Home workout', 'homeworkout'],
  // Settings is not in the rail or any tab row — it is behind the account menu
  // — so it had never been scanned, and every "0 serious" this gate printed
  // excluded the page that holds most of the app's form controls. Adding it
  // immediately failed on an unnamed `<select>` (COD-94).
  ['Settings', 'settings'],
  // The kitchen sink renders every component in every state. It is excluded
  // from `scripts/view-ids.mjs` as a development surface, and that exemption
  // was quietly inherited here — so **the page whose whole job is to display
  // the design system had never been checked by the design system's gate**. It
  // is exactly the page a contrast bug shows up on first, and it did: `fg-2` on
  // `ink-3` measured 4.09:1 (COD-58). Not shipped to users is not a reason to
  // leave it unmeasured; it is a reason the measurement is cheap.
  ['Kitchen sink', 'kitchen-sink'],
  // Cycle sits behind an opt-off gate (`cycleEnabled` defaults false), so no
  // tab exists to click on a fresh journal — but the view renders by URL for
  // anyone who has turned it on, and it had never been scanned. Recovery's
  // lesson, from the other side of the default.
  ['Cycle', 'cycle'],
  // Account has no tab either — it is behind the account menu, like Settings,
  // and like Settings it had never been scanned. It was a full-screen auth card
  // for most of this gate's life: two text inputs, a password reveal toggle and
  // an OAuth button, none of them ever checked. It is now the local-account
  // page, which is the moment to notice the hole rather than inherit it.
  ['Account', 'account'],
  // The guide. Behind the top bar's "?", so no tab clicks to it and it had
  // never been scanned — the page a user opens *because they are already
  // stuck* was the one page with no accessibility evidence behind it. It is
  // now a search field over twenty-four folded cards, which is to say it is
  // mostly interactive controls, which is to say it is exactly the kind of
  // page this gate exists for.
  ['Help', 'help'],
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

/**
 * How many pages scan at once.
 *
 * Clamped to 4 on purpose, not to the core count. This is a browser gate, not a
 * compiler: past a handful of pages they starve each other's render loop, and
 * every timing assertion in this file — the theme attribute, the nav row, the
 * 40-character render floor — gets *tighter* when the machine is loaded, which
 * is exactly how the four red runs in CLAUDE.md's table happened. 16 cores buy
 * nothing here beyond the point where Chromium is the bottleneck.
 *
 * `BUJO_A11Y_WORKERS=1` is the serial walk, byte for byte. Use it to get a
 * clean reading when a failure looks like a race.
 */
const WORKERS = (() => {
  const asked = Number(process.env.BUJO_A11Y_WORKERS)
  if (Number.isFinite(asked) && asked >= 1) return Math.floor(asked)
  return Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length))
})()

/**
 * The work list, in the order the serial walk produced it.
 *
 * One entry per shard: a `viewport · theme` pair that scans every view and
 * companion, or a single receipt capture. Built once and never reordered, so
 * the summary table reads the same whatever order the workers finish in.
 */
const UNITS = [
  ...VIEWPORTS.flatMap((vp) =>
    (vp.name === 'phone' ? PHONE_THEMES : THEMES).map((theme) => ({
      kind: 'views',
      vp,
      theme,
      label: `${vp.name} · ${theme}`,
      scans: VIEWS.length + COMPANIONS.length,
    })),
  ),
  // The receipt pass is desktop-only and always was — see `scanReceipt`.
  ...THEMES.map((theme) => ({
    kind: 'receipt',
    vp: VIEWPORTS[0],
    theme,
    label: `receipt · ${theme}`,
    scans: 1,
  })),
]
const TOTAL_SCANS = UNITS.reduce((n, u) => n + u.scans, 0)

/**
 * A failure that must stop the gate, carrying the evidence with it.
 *
 * Every one of these was a `process.exit(1)` from inside the walk. That is fine
 * when there is one page; with several in flight it throws away the other
 * workers' results and prints no table at all, which is COD-208. So they throw,
 * the worker records which unit and which view it died on, and the run prints a
 * table marked partial.
 *
 * The message lines are the ones the old `console.error` calls wrote, unchanged
 * — "a gate's failure message must say what it did find" is the whole point.
 */
class GateError extends Error {
  constructor(lines) {
    super(lines[0])
    this.lines = lines
  }
}
const fail = (...lines) => {
  throw new GateError(lines.flat())
}

const browser = await chromium.launch()

/**
 * Switch theme through the store the app actually reads, then assert the
 * attribute the stylesheets key on actually changed. Writing localStorage and
 * hoping is how you scan mocha five times and report five clean themes.
 */
async function setTheme(w, next) {
  await w.page.evaluate((t) => {
    const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
    d.settings = { ...(d.settings ?? {}), storageMode: 'local', theme: t }
    localStorage.setItem('bujo:data', JSON.stringify(d))
    /**
     * Start every shard from the same folds · `bujo.ui.*` is sticky.
     *
     * `CollapsibleSection` persists its open state through `useStickyState`, so
     * in the old single-page walk the folds `openFolds` clicked open under
     * **mocha** were still open under latte, neon, vscode and dawn — the content
     * was scanned either way, but the fold column counted clicks, so the first
     * theme reported 2 and the rest reported 0 for the same page. Sharded across
     * contexts that number would instead depend on which worker happened to pick
     * up which theme, which is worse: a count nobody can compare.
     *
     * So clear it. Every shard then meets the page in its authored state, which
     * is what the first theme of the old walk measured, and the column means the
     * same thing on all 166 rows. Only fold state lives under this prefix in
     * practice — nothing in this gate clicks the sticky tab controls — so this
     * changes what is *counted*, not what is scanned.
     */
    for (const k of Object.keys(localStorage)) if (k.startsWith('bujo.ui.')) localStorage.removeItem(k)
  }, next)
  await w.page.reload({ waitUntil: 'networkidle' })
  /**
   * Wait for the theme to land before deciding it never will.
   *
   * This read `data-theme` the instant `networkidle` resolved — and
   * `networkidle` fires when the last chunk has arrived, not when React has
   * rendered with it. The attribute is written during that first render, so
   * the check was racing it and usually won by luck.
   *
   * It lost on `main` twice in a row, thirteen minutes into a walk, on the
   * fifth theme: `[dawn] theme did not apply — the root says ""`. The empty
   * string is the tell — not the WRONG theme, which would be a real bug, but
   * NO theme, which is a page that has not rendered yet.
   *
   * Exactly COD-202 one function over: the assertion is right and worth
   * keeping, it just has to be made after giving the app a chance, or
   * "not yet" reads as "not ever". The `catch` is deliberate — a timeout here
   * falls through to the assertion below, which prints what it actually found.
   *
   * The timeout is generous *because* several pages now render at once: a
   * loaded machine is slower to first paint, and this wait is the one place
   * that difference shows up as a verdict.
   */
  await w.page
    .waitForFunction(
      (t) => {
        const r = document.documentElement
        return String(r.getAttribute('data-theme') ?? r.className ?? '').includes(t)
      },
      next,
      { timeout: 15000 },
    )
    .catch(() => {})
  const applied = await w.page.evaluate(() => document.documentElement.getAttribute('data-theme') ?? document.documentElement.className)
  if (!String(applied).includes(next)) {
    fail(
      `\n[${next}] theme did not apply — the root says "${applied}".`,
      '  Every result for this theme would actually be the previous one.',
    )
  }
  w.theme = next
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
async function settle(w) {
  await w.page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle'),
    null,
    { timeout: 5000 },
  ).catch(() => {}) // an infinite/looping animation must not hang the gate
  await w.page.waitForTimeout(120)
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
async function onScreen(w, locator) {
  const vp = w.page.viewportSize()
  const outside = (box) =>
    box.x + box.width <= 0 || box.x >= vp.width || box.y + box.height <= 0 || box.y >= vp.height

  /** One pass over the candidates: the first on screen wins; the rest are returned. */
  async function sweep() {
    const n = await locator.count()
    const off = []
    for (let i = 0; i < n; i++) {
      const el = locator.nth(i)
      const box = await el.boundingBox()
      if (!box) continue // detached or display:none
      if (outside(box)) { off.push(el); continue }
      return { hit: el, off }
    }
    return { hit: null, off }
  }

  let { hit, off: offscreen } = await sweep()
  if (hit) return hit

  /**
   * Nothing on screen — so put the page back at the top and look again.
   *
   * **The phone's only navigation hides itself on scroll-down.** `BottomNav`
   * and the top bar's section fold share `useHideOnScroll`, so after the gate
   * has scrolled — opening folds, or scrolling a tab row into view — the bar it
   * is about to look for has slid out: measured at `y 845` in an `844` viewport,
   * one pixel below the fold, which is indistinguishable from "that destination
   * no longer exists". That is COD-202, and it read as intermittent because it
   * depended on how far the previous surface had been scrolled; adding Habits
   * (the tallest) to `SURFACES` made it reliable.
   *
   * A user meets this every day and solves it without thinking: scroll up. So
   * does the gate. Cheap, because it only runs once nothing was found — and it
   * must come before `scrollIntoViewIfNeeded` below, which scrolls *down* to a
   * tab and would re-hide the bar it just revealed.
   */
  await w.page.evaluate(() => window.scrollTo(0, 0))
  await settle(w)
  ;({ hit, off: offscreen } = await sweep())
  if (hit) return hit
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
    if (!outside(box)) return el
  }
  return null
}

/** Every control `go` will click, as one selector — shared with the failure dump. */
const NAV_SELECTOR =
  'nav a, nav button, aside a, aside button, header [data-slot="toggle-group"] button, main [data-slot="toggle-group"] button'

async function go(w, name) {
  // Rail rows and section tabs are links; the Today surface switcher is a
  // Radix ToggleGroup whose items are buttons.
  //
  // `header` as well as `main`, because the surface switcher moved into the
  // header's second row. Scoped to `main` alone this selector found nothing the
  // moment it moved, and `goOrDie` would have reported "no surface control with
  // that name on Today" — a gate reading a relocation as a deletion. Both are
  // listed rather than dropping `main`: a ToggleGroup is how this app spells a
  // mode control, and the next one may well be on a page.
  const items = w.page.locator(NAV_SELECTOR)
  /**
   * Wait for the control to EXIST before deciding it does not.
   *
   * `onScreen` counts and measures immediately, so a nav that has not
   * rendered yet is indistinguishable from a nav that no longer carries this
   * destination — and `goOrDie` treats the second as fatal. Views are lazily
   * imported and `setTheme` reloads between themes; `networkidle` fires when
   * the chunk has landed, not when React has painted it.
   *
   * This is the difference between "the door is gone" and "I knocked too
   * early", which is the exact question `goOrDie` claims to answer.
   */
  await items
    .filter({ hasText: new RegExp(`^${name}([,·]|$)`) })
    .first()
    .waitFor({ state: 'attached', timeout: 15000 })
    .catch(() => {})
  // Exact match first, then the same name carrying a **status suffix**.
  //
  // `hasText` reads `textContent`, which includes visually-hidden text — so the
  // moment Today's surface tabs started announcing their state ("Evening,
  // nothing recorded yet") an anchored-exact match reported the tab as retired
  // and killed the gate. The name had not changed; it had grown a suffix.
  //
  // Exact-first rather than prefix-only, so two controls whose names share a
  // prefix cannot swap places. The suffix must begin with a comma or a middot,
  // which is the convention for state appended to an accessible name here.
  const target =
    (await onScreen(w, items.filter({ hasText: new RegExp(`^${name}$`) }))) ??
    (await onScreen(w, items.filter({ hasText: new RegExp(`^${name}[,·]`) })))
  if (!target) return false
  await target.click()
  await w.page.waitForTimeout(300)
  await settle(w)
  return true
}

/** Fail loudly rather than scanning whatever page happened to still be up. */
async function goOrDie(w, name, why) {
  if (await go(w, name)) return
  const lines = [`\n[${name}] ${why}`,
    '  Either the destination was renamed/retired, or it lost its door. Do not',
    '  drop it from VIEWS to make this pass without checking which.']
  /**
   * Say what WAS there.
   *
   * "Could not reach it" with no evidence is a red that carries no
   * information — you cannot tell a renamed tab from a timing race from a
   * control that rendered off screen, and that three-way guess cost a whole
   * session. The dump below answers it in the log instead.
   */
  const found = await w.page.locator(NAV_SELECTOR).allTextContents().catch(() => [])
  const names = found.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
  lines.push(`  url: ${w.page.url()} · viewport: ${w.viewport} · theme: ${w.theme}`)
  lines.push(`  ${names.length} navigable control(s): ${names.slice(0, 24).join(' | ') || '(none — the nav had not rendered)'}`)
  const near = names.filter((t) => t.toLowerCase().includes(name.toLowerCase()))
  if (near.length) lines.push(`  close matches: ${near.join(' | ')} — the name grew a suffix the regex does not allow.`)
  const boxes = await w.page.locator(NAV_SELECTOR).filter({ hasText: new RegExp(`^${name}([,·]|$)`) }).evaluateAll((els) =>
    els.map((e) => { const b = e.getBoundingClientRect(); const st = getComputedStyle(e)
      return `x${Math.round(b.x)} y${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)} vis:${st.visibility} disp:${st.display} op:${st.opacity}` }),
  ).catch(() => [])
  lines.push(`  viewport ${w.page.viewportSize()?.width}x${w.page.viewportSize()?.height} · boxes: ${boxes.join(' ‖ ') || '(none)'}`)
  fail(lines)
}

/**
 * Open every disclosure inside `#main` before scanning · COD-93.
 *
 * axe walks the *rendered* page, so anything behind a closed fold is simply not
 * checked. That is not a theoretical hole: when the Gym contract pass folded the
 * analytics, `BigThreeCard`'s **1.41:1** latte contrast failure went from
 * gate-visible to gate-invisible in the same commit, and the report stayed
 * green. The file header used to say "expand them by hand when they change",
 * which is the tell that it never happened — same shape as "only mocha was
 * checked" sitting in STATUS.md for five sessions.
 *
 * Scoped to `#main` deliberately. The shell header carries four `aria-expanded`
 * menu buttons on every single view; clicking those opens a popover over the
 * page rather than revealing page content, and it would be scanned 132 times.
 *
 * Clicked in the page rather than through Playwright: React's synthetic handler
 * is attached at the root and `el.click()` bubbles to it, so one `evaluate` per
 * pass replaces up to 32 round-trips. Several passes because folds nest —
 * Coaching has drawers inside drawers.
 *
 * Known ceiling: a **single-open accordion** (Coaching's weeks, its techniques)
 * only ever shows one panel, and a pass that clicks all of its shut buttons in
 * one batch leaves whichever React saw last open. So those groups are scanned
 * one representative panel at a time, not exhaustively, and the pass count never
 * settles to zero on them — which is why this is bounded by passes and does not
 * assert everything opened.
 */
async function openFolds(w) {
  let opened = 0
  for (let pass = 0; pass < 4; pass++) {
    const n = await w.page.evaluate(() => {
      // `:not([aria-haspopup])` — a fold reveals page content; a popup covers
      // it. `ExercisePicker` is a combobox and there is one per set row, so
      // without this the gym page would open 35 of them at once, each laying
      // down its own full-screen click-catcher. Its semantics are guarded by
      // `ExercisePicker.test.tsx` instead, which is where widget behaviour
      // belongs — axe cannot assert it either way.
      const shut = [...document.querySelectorAll('#main [aria-expanded="false"]:not([aria-haspopup])')]
      for (const el of shut) el.click()
      return shut.length
    })
    if (n === 0) break
    opened += n
    await settle(w)
  }
  return opened
}

/**
 * Walk the page top to bottom so every `LazyMount` fires its
 * IntersectionObserver and mounts its content, then return to the top.
 * Without this, lazily-mounted sections are simply absent from the DOM at
 * scan time — the closed-fold trap in a new shape: a chart that never
 * mounts cannot fail. Runs before AND the fold pass runs again after,
 * because lazy content can carry folds (Pickleball) and folds can carry
 * lazy content.
 */
async function revealLazy(w) {
  // An explicit event, not a scroll walk: scrolling to the bottom and back
  // left the hide-on-scroll header in a state that intercepted this script's
  // own tab clicks. LazyMount listens for this and mounts immediately.
  await w.page.evaluate(() => window.dispatchEvent(new Event('bujo:reveal-lazy')))
  await settle(w)
}

/** Scan whatever is on screen, under a label. */
async function scan(w, label) {
  w.at = label
  await settle(w)
  // A clean result on a blank page is worse than no gate at all: it reads as
  // proof. Assert the view actually rendered before believing its score.
  /**
   * Wait for the view to render before deciding it did not.
   *
   * The FOURTH race of this shape (see the table in CLAUDE.md): views are
   * lazily imported, so after a nav click `settle()` can return with the
   * chunk still arriving — there are no animations to wait for when nothing
   * has mounted yet. On a cold CI runner that lost, and `main` went red with
   * `[Settings] rendered 0 characters`.
   *
   * POLLED, not a single `waitForFunction`. That was the first fix here and
   * it did not hold: `waitForFunction` throws if the page navigates while it
   * is waiting — "execution context was destroyed" — and the `.catch` that
   * kept a genuine failure readable then swallowed that too, leaving the very
   * next `evaluate` to read a blank, still-loading page. Which is exactly the
   * `0 characters` this was meant to stop. A loop of cheap reads has no such
   * failure mode: a destroyed context is one wasted iteration, not a verdict.
   *
   * The assertion stays, because a clean result on a blank page reads as
   * proof. It just has to be made after giving the view a chance.
   */
  const read = async () =>
    w.page.evaluate(() => (document.querySelector('main')?.innerText ?? '').trim().length).catch(() => 0)

  let rendered = 0
  for (let i = 0; i < 24; i++) {
    rendered = await read()
    if (rendered >= 40) break
    await w.page.waitForTimeout(500)
  }

  /**
   * One reload, reported — not a silent retry.
   *
   * The diagnostic dump finally named this: not a slow view but a blank
   * DOCUMENT. `body says: ""`, `main html: (empty)`, the right url, no dialog
   * and no menu — the app did not boot on that navigation. Twelve seconds of
   * polling cannot fix a boot that never happened.
   *
   * A reload recovers it, and killing a sixteen-minute walk over one is worse
   * than retrying. But a silent retry would turn an intermittent boot failure
   * into something nobody ever sees, which is how a gate starts lying — so it
   * prints, every time, and the run still says a reload was needed.
   */
  if (rendered < 40) {
    w.err(`
[${w.viewport} · ${w.theme} · ${label}] blank after 12s — reloading once. The app did not boot on this navigation.`)
    w.pageErrors = []
    await w.page.reload({ waitUntil: 'networkidle' }).catch(() => {})
    for (let i = 0; i < 24; i++) {
      rendered = await read()
      if (rendered >= 40) break
      await w.page.waitForTimeout(500)
    }
    if (rendered >= 40) w.err(`  recovered after the reload — ${rendered} characters. Not fatal, but not nothing.`)
  }
  if (rendered < 40) {
    const lines = [`\n[${label}] rendered ${rendered} characters — the view did not load, so its result means nothing.`]
    /**
     * Say what was actually on screen.
     *
     * "0 characters" with a 10s wait in front of it rules out the slow-chunk
     * theory and says nothing about what replaced it — a Suspense fallback
     * still pending, an error boundary, a nav click that opened a menu instead
     * of navigating, or a chunk that failed to load. Each wants a different
     * fix and the message cannot tell them apart. Same lesson as COD-202's
     * dump: a red that carries no evidence costs a whole CI cycle per guess.
     */
    const seen = await w.page
      .evaluate(() => ({
        url: location.href,
        mainHtml: (document.querySelector('main')?.innerHTML ?? '').slice(0, 200),
        bodyText: (document.body.innerText ?? '').replace(/[\s\u00a0]+/g, ' ').trim().slice(0, 160),
        dialogs: document.querySelectorAll('[role="dialog"]').length,
        menus: document.querySelectorAll('[role="menu"]').length,
      }))
      .catch(() => null)
    lines.push(`  url: ${seen?.url} · dialogs: ${seen?.dialogs} · menus: ${seen?.menus}`)
    lines.push(`  body says: "${seen?.bodyText}"`)
    lines.push(`  main html: ${seen?.mainHtml || '(empty)'}`)
    lines.push(w.pageErrors.length ? `  page errors: ${w.pageErrors.slice(-6).join(' | ')}` : '  page errors: none captured — the app rendered nothing without throwing.')
    fail(lines)
  }
  let folds = await openFolds(w)
  await revealLazy(w)
  folds += await openFolds(w)
  const results = await new AxeBuilder({ page: w.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const meh = results.violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor')
  w.rows.push({ view: `${w.viewport} · ${w.theme} · ${label}`, serious: bad.length, other: meh.length, folds })

  for (const v of bad) {
    w.err(`\n[${w.viewport} · ${w.theme} · ${label}] ${v.impact}: ${v.id} — ${v.help}`)
    w.err(`  ${v.helpUrl}`)
    for (const node of v.nodes.slice(0, 3)) w.err(`  ${node.html.slice(0, 120)}
    DATA ${JSON.stringify(node.any?.[0]?.data)}`)
  }
}

/**
 * The capture receipt · the one surface `VIEWS` structurally cannot reach.
 *
 * It does not exist until something is captured, so walking pages scans the
 * page it lands on and never the bar itself — the same hole as the empty
 * journal and the closed fold, one step further along: **a surface that only
 * exists after an action cannot fail a gate that only navigates.** So this
 * performs the action, asserts the bar is really there, and scans it in every
 * theme. The contrast is the part worth having: the bar is text over `ink-1`,
 * and `ink-1` moves per theme.
 *
 * One theme per unit now, so the five receipt captures run alongside the view
 * sweeps instead of after them. Nothing about the capture changed.
 */
async function scanReceipt(w, t) {
  w.at = `receipt · ${t}`
  /**
   * `surface=day`, pinned — NOT whatever the clock picks.
   *
   * This walked to a bare `?view=today`, so the surface came from
   * `surfaceForHour(new Date().getHours())`: morning before 11, day until
   * 18, evening after. The ringed row is written into the **rapid log**,
   * which only the day surface renders — measured, all three:
   *
   * | surface | receipt | ringed row |
   * |---|---|---|
   * | day     | yes | **yes** |
   * | evening | yes | no |
   * | morning | yes | no |
   *
   * So the gate could only pass between 11:00 and 18:00 local. It went red
   * in CI at **18:09 UTC** on the very PR that repaired the walk — before
   * that fix it aborted at `[Plan]` and never reached this check, so a
   * clock-dependent assertion sat here unnoticed.
   *
   * A gate whose result depends on what time you run it is worse than no
   * gate: it teaches you to re-run until it is green.
   */
  await w.page.goto(`${BASE}?demo=1&view=today&surface=day`, { waitUntil: 'networkidle' })
  await setTheme(w, t)
  await w.page.getByRole('button', { name: 'Quick add' }).click()
  await w.page.waitForTimeout(350)
  const dialog = w.page.getByRole('dialog')
  await dialog.getByLabel('Smart capture').fill('called mum about the weekend')
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()
  await w.page.waitForTimeout(700)

  // Assert, do not assume: a receipt that stopped rendering would otherwise
  // score a clean zero here forever.
  //
  // A NOTE rather than a lift, deliberately. It lands on Today, where the row
  // it wrote is marked `data-just-captured` — so one capture puts both halves
  // of the feature on screen and both get scanned. A lift lands on Strength,
  // which has no per-workout row to ring.
  // Same rule as `scan` above: wait for both halves, then assert. A fixed
  // 700ms is a guess about a machine, and CI is a slower machine.
  await w.page
    .waitForFunction(
      () => !!document.querySelector('[role="status"]') && !!document.querySelector('#main [data-just-captured]'),
      null,
      { timeout: 15000 },
    )
    .catch(() => {})
  const there = await w.page.evaluate(() => ({
    receipt: !!document.querySelector('[role="status"]'),
    row: !!document.querySelector('#main [data-just-captured]'),
  }))
  if (!there.receipt || !there.row) {
    fail(`
[receipt · ${t}] captured a note; receipt ${there.receipt ? 'appeared' : 'MISSING'}, ringed row ${there.row ? 'appeared' : 'MISSING'}.`,
      '  Either the capture stopped routing through CaptureReceipt, or the bar or the ring stopped rendering.')
  }

  // Both halves. The ring puts a brand wash behind text that was solved
  // against the card — the exact shape of every contrast bug this repo has
  // had — and it exists for six seconds on a page no view-walking gate opens.
  const results = await new AxeBuilder({ page: w.page })
    .include('[role="status"]')
    .include('#main [data-just-captured]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  w.rows.push({ view: `receipt · ${t}`, serious: bad.length, other: 0, folds: 0 })
  for (const v of bad) {
    w.err(`
[receipt · ${t}] ${v.impact}: ${v.id} — ${v.help}`)
    w.err(`  ${v.nodes[0]?.html?.slice(0, 120)}`)
    w.err(`    DATA ${JSON.stringify(v.nodes[0]?.any?.[0]?.data)}`)
  }
}

/**
 * One worker: its own context, its own localStorage, its own demo seed.
 *
 * A context rather than just a page, for two reasons. @axe-core/playwright
 * refuses a page created straight off the browser ("Please use
 * browser.newContext()"), and localStorage is per-context — which is what makes
 * the workers independent at all, since the theme and the whole journal live
 * there. The cost is one demo seed per worker instead of one per run, which is
 * a couple of seconds and buys the isolation.
 */
async function makeWorker(id) {
  const context = await browser.newContext({ viewport: VIEWPORTS[0] })
  const page = await context.newPage()
  const w = {
    id,
    page,
    context,
    theme: null,
    viewport: VIEWPORTS[0].name,
    at: '(nothing yet)',
    size: VIEWPORTS[0].name,
    pageErrors: [],
    out: [],
    rows: [],
  }
  // Everything a unit prints is a finding or a warning, so it all goes to
  // stderr — buffered here and flushed in `UNITS` order by `flushReady`.
  w.err = (text) => w.out.push(text)

  /**
   * Why a page failed, kept until something asks.
   *
   * The gate had no error capture at all, so when `main` came back empty the
   * report could say the body was blank and nothing about the reason. A blank
   * body is a boot failure — a thrown module, a chunk that 404'd, a service
   * worker serving half a shell — and those are four different fixes.
   *
   * Bounded and cleared per navigation: this is for the failure in front of you,
   * not a log.
   */
  page.on('pageerror', (e) => w.pageErrors.push(String(e?.message ?? e).slice(0, 200)))
  page.on('console', (m) => {
    if (m.type() === 'error') w.pageErrors.push(`console: ${m.text().slice(0, 200)}`)
  })
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (/\.(js|css)(\?|$)/.test(u)) w.pageErrors.push(`failed ${r.failure()?.errorText ?? '?'} ${u.slice(-60)}`)
  })

  // Skip the first-run gate: pick local storage so the app boots into the shell.
  await page.addInitScript(() => {
    localStorage.setItem('bujo:onboarded', '1')
    const existing = localStorage.getItem('bujo:data')
    if (!existing) {
      localStorage.setItem('bujo:data', JSON.stringify({ settings: { storageMode: 'local', theme: 'mocha' } }))
    }
  })

  /**
   * Seed the demo journal before scanning anything.
   *
   * Until COD-28 this gate ran against an **empty** journal, so every card behind
   * a `{rows.length > 0 && …}` guard — which is most of the analytics in the app —
   * was absent from the DOM and could not fail. `HighRiskHoursCard` carried a
   * 2.57:1 contrast failure through every green run this file ever printed.
   *
   * `?demo=1` seeds only when `entries.length === 0` (`store.tsx`), writes to
   * localStorage and therefore survives the reloads `setTheme` does, so one load
   * per context is enough for every unit that context runs.
   *
   * Asserted per worker, not once per run. A gate that silently reverts to an
   * empty journal is the bug being fixed, and it would report the same
   * reassuring zero — and with several contexts there are now several journals
   * that could each be empty.
   */
  await page.goto(`${BASE}?demo=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const seeded = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('bujo:data') ?? '{}')
    return { entries: d.entries?.length ?? 0, metrics: d.metrics?.length ?? 0 }
  })
  if (seeded.entries === 0) {
    console.error(`\n[worker ${id}] demo data did not seed — the journal is empty.`)
    console.error('Every "0 serious" below would mean "0 serious for empty pages".')
    await browser.close()
    process.exit(1)
  }
  // Not printed here: the workers boot in parallel, so the caller prints these
  // in id order rather than in whatever order the seeds landed.
  w.seedLine = `Seeded demo journal (worker ${id}): ${seeded.entries} entries, ${seeded.metrics} metrics.`
  return w
}

/** Everything one shard does. The body of the old double loop, verbatim. */
async function runUnit(w, unit) {
  if (w.size !== unit.vp.name) {
    // Reload rather than trusting a resize. The shell reads its breakpoint on
    // mount as well as through media queries, and a bottom tab bar that only
    // appears after a re-render is a bar this gate would scan the absence of.
    // `setTheme` and `scanReceipt` both navigate immediately after this, which
    // is the remount — so there is no separate reload here.
    await w.page.setViewportSize({ width: unit.vp.width, height: unit.vp.height })
    w.size = unit.vp.name
  }
  w.viewport = unit.vp.name
  // Set before the navigation, not after: it is what the failure messages name,
  // and a worker that dies mid-`setTheme` would otherwise report the theme of
  // the *previous* shard.
  w.theme = unit.theme

  if (unit.kind === 'receipt') {
    await scanReceipt(w, unit.theme)
    return
  }

  await setTheme(w, unit.theme)
  for (const [section, tab] of VIEWS) {
    await goOrDie(w, section, 'no rail row with that name — the gate could not reach it.')
    if (tab) await goOrDie(w, tab, `no tab with that name inside ${section}.`)
    const label = tab ? `${section} · ${tab}` : section
    await scan(w, label)

    // Today used to be four screens behind one name — morning, day, evening
    // and habits, each a tab this loop clicked and scanned. They are one page
    // now, so the single `scan` above covers what four passes used to, and
    // there is no surface control left to click. The fold-opening inside
    // `scan` is what reaches the deep-analytics section that used to be the
    // habits surface's own.
  }

  // Companion views, reached by URL because they have no tab to click.
  // `setTheme` persists to the journal in localStorage, which survives the
  // navigation, so these are scanned under the theme of the current pass.
  for (const [label, view] of COMPANIONS) {
    w.at = label
    await w.page.goto(`${BASE}?view=${view}`, { waitUntil: 'networkidle' })
    // The alias table used to bounce these to Fitness. If that ever comes
    // back, the URL will silently be a different page and `scan` would
    // happily grade Fitness under this label — so check where we landed.
    const landed = await w.page.evaluate(() => new URLSearchParams(location.search).get('view'))
    if (landed !== view) {
      fail(`\n[${label}] asked for ?view=${view} and landed on ?view=${landed}.`,
        '  Something is redirecting it — see VIEW_ALIASES in lib/deepLink.ts.')
    }
    await scan(w, label)
  }
}

// ── The queue ────────────────────────────────────────────────────────────────

let cursor = 0
let flushed = 0
/** The unit whose failure stopped the run, if any. */
let aborted = null

/**
 * Print finished units in `UNITS` order.
 *
 * Workers interleave, so the alternative is a log where a red from one theme
 * lands between two greens from another and a summary whose row order changes
 * run to run. Both are undiffable, which is the same disease as a gate nobody
 * runs. `final` lets the last pass step over units that never started.
 */
function flushReady(final = false) {
  while (flushed < UNITS.length) {
    const u = UNITS[flushed]
    if (!u.done && !u.failed) {
      if (!final) break
      u.skipped = true
      flushed++
      continue
    }
    for (const text of u.out) console.error(text)
    if (u.failed) for (const line of u.failed) console.error(line)
    flushed++
  }
}

async function drain(w) {
  while (cursor < UNITS.length && !aborted) {
    const unit = UNITS[cursor++]
    unit.out = []
    unit.rows = []
    w.out = unit.out
    w.rows = unit.rows
    w.pageErrors = []
    unit.started = true
    try {
      await runUnit(w, unit)
      unit.done = true
    } catch (e) {
      unit.failed = await describeDeath(w, unit, e)
      aborted ??= unit
    }
    flushReady()
  }
}

/**
 * What a dead worker leaves behind.
 *
 * A `GateError` already carries its evidence — those messages are the ones the
 * old `process.exit(1)` calls printed. Anything else is a crash, and the crash
 * this gate actually has is `Target crashed` (COD-208), which said nothing at
 * all: not the theme, not the viewport, not the view it was on. So say all
 * three, plus whatever the page can still be asked.
 */
async function describeDeath(w, unit, e) {
  if (e instanceof GateError) return [...e.lines, `  shard: ${unit.label} · at: ${w.at}`]
  const lines = [
    `\n[${unit.label}] the worker died at "${w.at}": ${e?.message ?? e}`,
    '  Not a violation — the browser or the page went away. The table above is partial.',
  ]
  const seen = await w.page
    .evaluate(() => ({
      url: location.href,
      bodyText: (document.body.innerText ?? '').replace(/[\s\u00a0]+/g, ' ').trim().slice(0, 160),
    }))
    .catch(() => null)
  lines.push(`  url: ${seen?.url ?? '(the page could not be read — it is gone)'} · viewport: ${w.viewport} · theme: ${w.theme}`)
  lines.push(`  body says: "${seen?.bodyText ?? '(unreadable)'}"`)
  lines.push(`  page errors: ${w.pageErrors.slice(-6).join(' | ') || 'none captured'}`)
  lines.push(`  stack: ${String(e?.stack ?? '').split('\n').slice(1, 3).map((l) => l.trim()).join(' ⏎ ')}`)
  return lines
}

// ── Run ──────────────────────────────────────────────────────────────────────

console.log(`${UNITS.length} shard(s), ${TOTAL_SCANS} scan(s), ${WORKERS} worker(s) — BUJO_A11Y_WORKERS=1 for the serial walk.`)
const workers = await Promise.all(
  Array.from({ length: Math.min(WORKERS, UNITS.length) }, (_, i) => makeWorker(i)),
)
for (const w of workers) console.log(w.seedLine)
await Promise.all(workers.map((w) => drain(w)))
flushReady(true)
await browser.close()

const rows = UNITS.flatMap((u) => u.rows ?? [])
const serious = rows.reduce((n, r) => n + r.serious, 0)
const skipped = UNITS.filter((u) => u.skipped)

console.log('\nView            serious  other  folds')
for (const s of rows) console.log(`  ${s.view.padEnd(30)} ${String(s.serious).padStart(5)} ${String(s.other).padStart(6)} ${String(s.folds).padStart(6)}`)
console.log(`\n${rows.length} of ${TOTAL_SCANS} scan(s) completed across ${UNITS.filter((u) => u.done).length} of ${UNITS.length} shard(s).`)

if (aborted) {
  console.error(`\nThe gate stopped: [${aborted.label}] failed, and ${skipped.length} shard(s) never ran.`)
  if (skipped.length) console.error(`  not run: ${skipped.map((u) => u.label).join(', ')}`)
  console.error('  This is a PARTIAL result. It is not a pass, whatever the table says.')
  process.exit(1)
}
if (serious > 0) {
  console.error(`\n${serious} serious/critical accessibility violation(s).`)
  process.exit(1)
}
console.log('\nNo serious or critical violations.')
