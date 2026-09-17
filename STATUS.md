# STATUS

**Stopped:** 2026-09-16, on `main`, clean. Two PRs merged this session:
**#230** the guide, the manual and the tutorials; **#231** Today's surface tabs
moved into the header's second row. Plane items: COD-196 (done), COD-198 (done),
**COD-197 (open, see "The one red gate" below)**.

## What shipped

### #230 · one catalogue, three readers

The in-app guide named **fifteen of the app's twenty-four screens.** Goals,
Program, Nutrition, Coaching, Reading, Mindset, Stats, Pickleball and Home
workout were absent from the one page a lost user opens — and nothing failed
when they were added, because `views/Help.tsx` carried its own hand-written copy
of what each screen does. `docs/pages/help.md` had already written down the fix.

`src/lib/guide.ts` now holds **only what nothing else records**: one sentence of
*why* each page exists and two to four *how* steps. Title and the "what it is"
blurb come from `VIEW_CHROME`; the grouping comes from `SECTIONS`. Three readers
off that one source:

- `views/Help.tsx` — rebuilt on the three-zone contract. Search over
  twenty-four folded cards grouped by nav section; a hit opens itself; every
  card has an *Open `<name>`* button.
- `docs/FEATURE-REFERENCE.md` — **generated**, `npm run manual`. Do not edit it.
- the top-bar "?" and every card's ⓘ, which already read `VIEW_CHROME`.

`docs/MANUAL.md` is hand-written and is the part a program cannot generate: why
the product exists, the first five minutes, the daily/weekly/monthly ritual,
the bullet grammar, troubleshooting.

**`guide.test.ts` is the load-bearing part.** It asserts coverage in both
directions and asserts `what` is byte-identical to `VIEW_CHROME[view].help`. Add
a view without a guide entry and it fails by name.

### #231 · the surface tabs moved up

Row 2 of the header holds `SectionTabs` for the fifteen views that have one, and
centres it. Today has one tab, so that row rendered a centred "Today / Your
daily log" — beside a date pill already stating the date, under a lit rail row
already saying Today — while Morning / Day / Evening sat in the day masthead.
`components/shell/topbar/SurfaceTabs.tsx` now owns them, in row 2, centred,
neutral-toned so row 2 stays quieter than row 1's accent pill.

## The one red gate

**`npm run a11y` does not complete on this machine, and does not on `main`
either.** It aborts at `scanReceipt()` —
`[receipt · mocha] captured a note; receipt appeared, ringed row MISSING` —
which calls `process.exit(1)` **before** the view walk, so nothing is scanned
and no table is printed. Filed as **COD-197** with the likely cause: the
assertion waits a fixed 700ms and then reads `#main [data-just-captured]`, which
is not enough on a loaded machine. It is intermittent — one run in five got
through and printed the full table.

Verified pre-existing by stashing the branch, rebuilding `main` and re-running:
identical failure. **Do not "fix" it by deleting the assertion.** Replace the
fixed wait with `page.waitForSelector('#main [data-just-captured]', { timeout:
5000 })` and keep the loud error for a real timeout.

Until then, a targeted axe pass is the workaround — and note that a workaround
in a STATUS file is a gate that is off, which is why COD-197 exists. The shape
that worked, run against a `vite preview` with `playwright` + `@axe-core/playwright`
installed `--no-save`:

- new **context** (`browser.newContext()`), not `newPage()` — `@axe-core/playwright`
  refuses a page from the default context.
- set `localStorage['bujo:onboarded'] = '1'` on the first load or the first-run
  tour's modal intercepts every click and Playwright times out.
- set the theme by rewriting `bujo:data.settings.theme` and reloading, and open
  folds with four passes of `#main [aria-expanded="false"]:not([aria-haspopup])`,
  exactly as the gate does.

## Gates, this session

All green except the above: `tsc -b` · `vitest` **1062 tests across 84 files** ·
`eslint` · `design` (308 files) · `contrast` (5 themes) · `smoke` 25/25 ·
`clipped` clean at 1440, 1024 and 390 · axe on `?view=help` and on Today × 3
surfaces, 5 themes × 2 widths, **0 serious/critical**.

## Traps found this session

- **`?view=help` had never been scanned by `a11y`.** It is behind the top bar's
  "?", so no tab clicks to it and it was not in `COMPANIONS` — the page a user
  opens *because they are already stuck* had no accessibility evidence. Adding
  it failed immediately: `fg-2` on `ink-3` is **4.07:1**, in four themes at
  once. Fixed by moving the ground (`ink-2` + `shadow-raise`), not the text.
  Same pairing as COD-58, recorded in a comment in the very file that missed it.
- **`a11y`'s `go()` locator was scoped to `main`.** Moving the surface switcher
  into `<header>` would have made `goOrDie` report "no surface control with that
  name on Today" — a gate reading a relocation as a deletion, beside its own
  instruction not to answer that by deleting the entry. Widened to `header` too.
- **A segmented control in a `min-w-0` flex child draws past its own box.** No
  `overflow-x-auto` and at 390px "Evening" rendered *underneath* the date pill
  with the ‹ arrow pushed off the row. `clipped` does not catch this — the box
  is not clipped, it is overdrawn.
- **A bash heredoc silently truncated a long file write.** `cat > file <<'EOF'`
  with ~400 lines of content came back with a *warning* about the delimiter and
  a file cut at line 124 — valid-looking TypeScript, mid-array. Use the editor
  tools for anything long, and check `wc -l` when you do not.

## Before you start

- `npm run verify` first, so a red gate is attributable to you rather than
  inherited. Browser gates need `npm i -D --no-save playwright @axe-core/playwright
  && npx playwright install chromium` — a deploy prunes them.
- **Check the port before believing a screenshot.** `vite preview` walks up from
  4173; it landed on **4175** this session because two earlier gate runs were
  still holding the lower ports. Every gate defaults to 4173, so pass
  `BUJO_URL=` when it does not.
- The preview server serves `dist/`, so **rebuild before running a browser
  gate**.
- Demo data is persisted, not regenerated — re-seed via Settings → Data → Load
  demo data after editing `src/lib/demo.ts`.
- After editing `src/lib/guide.ts`, run **`npm run manual`** in the same commit.
  `docs/FEATURE-REFERENCE.md` is generated and a stale one is worse than none.
