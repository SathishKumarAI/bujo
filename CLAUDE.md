## Branch workflow

Default to a branch per unit of work — do not commit onto whatever branch
happens to be checked out.

1. **Branch first.** `git checkout -b <type>/<short-slug>` off the branch the
   work builds on (not always `main` — if it extends an open PR, branch off
   that PR's branch so the stack stays in order). Types match the commit
   prefixes: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`.
2. **Commit in logical chunks**, not one blob. One concern per commit, with a
   body explaining *why*, including anything surprising found on the way.
3. **Verify before pushing:** `npm run verify` — chains `tsc -b` (NOT
   `--noEmit`, see below), `vitest run`, `eslint .`, `vite build` in order.
   For UI work, also open the app and check the affected views.
4. **Push and open a PR** with `gh pr create --base <parent-branch>`. State what
   is *not* in the PR as well as what is.
5. **Write `STATUS.md` when you stop**, not when you start.

## Running the browser gates

`npm run a11y`, `npm run smoke`, `npm run clipped` and `npm run space` drive a
real Chromium over real pages. They are **minutes, not seconds**, and no amount
of tuning changes that — `a11y` alone is 166 scans, each a navigation, a fold
pass and an axe run. So:

**Start them in the background and keep working.** Do not sit and watch one.
The wrong reflex is to block on a gate and then, next time, skip it — which is
how every "a gate nobody runs" entry in this file started.

**First, install what they need — it is not in `package.json`.** `playwright`
and `@axe-core/playwright` are in neither `dependencies` nor `devDependencies`
on purpose; `.github/workflows/a11y.yml` installs them per job. On a fresh
checkout every one of those four scripts therefore dies on
`ERR_MODULE_NOT_FOUND` before doing anything. Once per machine:

```
npm i -D --no-save playwright @axe-core/playwright
npx playwright install chromium
```

Do not be reassured by `npx playwright --version` — it answers `1.63.0` from the
npx cache, which is the CLI and not the package the scripts import. COD-273 is
to stop this living only in CI.

```
npx vite build                                   # never while a gate is running
npx vite preview --port 4173 --strictPort &
BUJO_URL=http://localhost:4173 node scripts/a11y-axe.mjs   # background this
```

And note **`npm run design` and `npm run contrast` are not in `npm run verify`
but are in CI** — which is how a locally green change goes red on push. The
design gate greps the source for a hardcoded colour and **cannot tell a comment
from a call site**: a docstring quoting a measured `#rrggbb` fails it, and that
is the right trade. Run all four before pushing.

**Always set `BUJO_URL`.** Every script here reads it (`space-audit.mjs` also
still accepts its old `BASE_URL`). The default port belongs to whichever preview
server started first on this machine, which is how `npm run smoke` spent three
PRs grading a different application — see the trap below.

Narrowing knobs, for the loop where you are fixing one thing:

| Knob | Does |
|---|---|
| `BUJO_THEMES=mocha` | one theme instead of five — roughly a fifth of the run |
| `BUJO_PHONE_THEMES=mocha` | one phone theme instead of two |
| `BUJO_A11Y_WORKERS=n` | pages scanning at once; `1` is the old serial walk |

`a11y` shards on the `viewport · theme` pair and runs **4 pages at once** by
default (`min(4, os.availableParallelism())`) — clamped to 4 rather than to the
core count because Chromium, not the CPU, is the bottleneck, and because every
timing assertion in that file gets *tighter* on a loaded machine. Measured on
this machine against the same preview server, at `95d79af`:

| | wall clock |
|---|---|
| serial, before (COD-224) | **507s** (`475s · 486s` before the glossary fold landed) |
| 4 workers, after | **183s · 186s · 168s** |
| `BUJO_A11Y_WORKERS=1` | **478s** — and a table byte-identical to the 4-worker one |

Same 166 rows in the same order, same verdict on every one. Reach for
`BUJO_A11Y_WORKERS=1` when a failure smells like a race rather than a
violation: four busy pages make every wait in that file tighter, and the table
in the "every browser-gate assertion needs a wait in front of it" trap below is
what that looks like when it goes wrong.

Trap: **`npx tsc --noEmit` typechecks nothing here** — the root `tsconfig.json`
is solution-style (`"files": []` + project references), so it has no root files
and always exits 0. Always use `npx tsc -b`.

Trap: **Tailwind v4 does not fail the build on a stale utility class.** It exits
0 and emits no CSS, so the element silently inherits. When retiring a class,
migrate every call site first and only then remove it from the theme, with a
grep as the gate.

Trap (fixed, COD-93): **`npm run a11y` could not scan inside a collapsed
fold.** axe walks the rendered page, so anything behind a closed section was
simply not checked — folding a section was a way to make a violation vanish
from the gate, and the Gym contract pass did exactly that to a **1.41:1**
contrast bug in the same commit. `openFolds()` now clicks every
`[aria-expanded="false"]` inside `#main`, up to four passes because folds nest,
before every scan. Arming it turned a green run red on a **critical**
`select-name` — Trackers' new-habit category select, unnamed and behind a
`DisclosureRow`, exactly the violation the old wording said "shipped for months
this way". Its ceiling: a **single-open accordion** (Coaching's weeks) shows one
panel at a time, so those groups get one representative panel, not all of them;
the fold count in the summary column oscillates there rather than settling.
Scoped to `#main` on purpose — the shell header's four `aria-expanded` menu
buttons are not page content.

And **the fold count it prints was never comparable between themes.**
`CollapsibleSection` persists its open state through `useStickyState` under
`bujo.ui.*`, so in the old single-page walk the folds `openFolds` clicked open
under **mocha** were still open under latte, neon, vscode and dawn: nothing left
to click, so the column read `0` where mocha read `2` for the same page. The
content was scanned either way — the number was wrong, not the coverage — but
sharded across browser contexts it would instead have depended on which worker
happened to pick up which theme. `setTheme` now clears `bujo.ui.*`, so every
shard meets the page in its authored state and the column means the same thing
on all 166 rows. Separate from the single-open-accordion ceiling above, which is
expected and stays.

Trap: **`vite preview` serves a stale bundle through its service worker.** A
screenshot can show pre-change markup against a freshly built `dist/`. Before
believing what you see:
`navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))`
then clear `caches` and reload.

Trap: **a dev server is pinned to the worktree it was started in.** This repo
has several under `.claude/worktrees/`, each on its own branch, and a tab
pointed at one of their ports will never show changes made here no matter how
hard you reload. Check the port's `Get-CimInstance Win32_Process` command line
before concluding a change did not land.

Trap: **git worktrees inside the repo inflate `vitest`.** Each holds a full
second copy of the app, so vitest discovered both suites and reported their sum
— 743 tests read as 1474 while `.claude/worktrees/today-ux` existed, and the
number moved whenever an unrelated session added or removed a worktree. Fixed by
excluding the path in `vite.config.ts`; eslint already ignored it. A count that
changes with what else is checked out is worse than no count, and this one was
quoted in commit messages before anyone noticed.

Trap: **an audit keyed on a prop misses the feature it feeds.** `Card` renders
its ⓘ from `help ?? subtitle`, so a sweep grepping `help=` reported the Body
cluster clean while every titled card with a subtitle still drew one. Same shape
as the six typographic folds that matched neither the caret-icon nor the
`aria-expanded` grep. Grep the *output*, and confirm on the rendered page.

Trap: **"environmental, not a regression" in a handover note means a gate has
been switched off.** `npm run smoke` carried that sentence across two sessions:
its default browser path was `/usr/bin/google-chrome-stable`, so it could not
launch here at all, and even with the documented `CHROME_PATH` workaround it
went red on `account` because there is no route to Supabase. A gate that is
known to fail has a red that carries no information, and a gate with a manual
incantation is one nobody types — so it silently stopped covering anything, and
two Body tabs (`program`, `nutrition`) fell off its id list unnoticed. Fixed:
falls back to Playwright's own Chromium, and judges a failed resource load by
its **origin** rather than its message. When a gate needs a workaround, fix the
gate; a workaround written in STATUS.md is a gate that is off.

Trap (fixed): **`npm run smoke` was testing a different application.** Its
default was `http://localhost:5173` — Vite's *dev* default, so it belongs to
whichever project on the machine started a dev server first, while every other
script here defaults to 4173 (`vite preview`, what CI starts). With
`interview_prep/frontend` holding 5173, smoke drove **PrepForge — AI/ML
Interview Prep**, found nothing it recognised as an error, and printed
`Smoke: 25/25 views OK · All views rendered clean`. Three PRs quoted that line
as evidence. The port was only half of it: the pass condition was "`main` or
`#root` has more than five characters of text", which any web page satisfies,
so the gate could not tell bujo from a stranger. It now **asserts its own
identity** (`document.title` starts with `bujo` **and** `#main` exists) before
scoring a single view, and it runs in CI beside `a11y` instead of local-only —
a gate nothing runs is a gate that rots. Sibling of the empty-journal and
closed-fold traps, one level up: not "a page that is never visited cannot
fail", but **an app that is never checked cannot fail**. When a browser gate
passes, confirm what it was pointed at.

Trap: **every browser-gate assertion needs a wait in front of it.** Three
separate red runs in one day had one shape — the gate measured a browser state
before the browser had reached it, and each read "not yet" as "not ever":

| Where | It said | It meant |
|---|---|---|
| `go()` | `[Plan] no rail row with that name` | the nav had scrolled out of frame |
| `scanReceipt()` | `ringed row MISSING` | Today was on the evening surface, because of the clock |
| `setTheme()` | `[dawn] theme did not apply — the root says ""` | React had not rendered yet |
| `scan()` | `[Settings] rendered 0 characters` | the lazily-imported view had not mounted |

The last one is the cleanest example of how to read these: the root said `""`,
not the *wrong* theme. A wrong theme is a bug worth failing on; an empty one is
a page that has not finished. **`page.reload({ waitUntil: 'networkidle' })` is
not "the app is ready"** — it resolves when the last chunk arrives, not when
React has rendered with it, so anything written during that first render is a
race. It wins on a warm local machine and loses on a cold CI runner, which is
why all three passed on a PR branch and failed on `main`.

Keep the assertions — they are what separates "five themes scanned" from "one
theme scanned five times" — and put a `waitForFunction`/`waitFor` in front,
with `.catch(() => {})` so a genuine failure still falls through to the message
that says what was actually found.

**And sweep the whole file when you find one.** Three of these were fixed one
at a time, each after a red run; the fourth (`scan`) was sitting in plain sight
the whole time and cost another cycle. `settle()` is not a substitute — it
waits for animations, and a view that has not mounted has none to wait for.
Grep for every `process.exit(1)` in the gate and ask what the line above it
assumed.

Trap (fixed, COD-202): **a browser gate that scrolls hides the navigation it is
about to look for.** `BottomNav` and the top bar's section fold share
`useHideOnScroll`, so the phone's *only* navigation slides away on scroll-down —
and `a11y-axe.mjs` scrolls constantly, opening folds and pulling tab rows into
view. `onScreen` then measured the bar at **y 845 in an 844px viewport**:
present, labelled, one pixel below the fold, and therefore identical by the only
predicate that separates the real bar from the parked off-canvas drawer.
`goOrDie` called that a retired destination and killed the run having scanned
**zero** views. It read as intermittent because it depended on how far the
previous surface had been scrolled; adding Habits — the tallest — to `SURFACES`
made it reliable, which is why a long-fragile gate looked newly dead. `onScreen`
now scrolls back to the top before concluding anything is gone, *before* the
`scrollIntoViewIfNeeded` recovery below it, which scrolls down to a tab and
would re-hide what it just revealed.

The half worth copying: **a gate's failure message must say what it did find.**
"Could not reach it" cost two wrong hypotheses, each tested with a browser probe
— the header folding on scroll, and `openFolds` opening a modal — before the
dump (url, viewport, theme, every navigable control, near-matches, their boxes)
named the cause on the next run's first line. A red that carries no evidence is
only marginally better than a gate that is off.

Trap: **a control can be hidden without being clipped, and neither rendering
gate sees it.** `scripts/clipped-text.mjs` asks whether an element shows less
than it holds (`scrollWidth > clientWidth`); `npm run a11y` asks whether the
accessibility tree is sound. A button at **x=453 in a 390px viewport** passes
both — it shows everything it holds, its own box is fine, and it is focusable
and named. The clip happens at an *ancestor*, and `document.body.scrollWidth`
still reads 390 because it happens above the body. Trackers shipped a
seven-control toolbar of which Month, three layouts, the wheel and the settings
button were **unreachable on a phone**. `clipped-text.mjs` now also fails on "a
control outside the viewport with no ancestor able to scroll it into view" —
**controls only**, because the first draft ran over every leaf with text and
reported 52 cosmetic hits across 23 views, and a gate whose red is mostly noise
is a gate nobody reads. Two corollaries: a wide box inside `overflow-x-auto` is
a *design* (every day cell in the month grid is a button), so the reachability
walk is load-bearing; and `Card` can cap its `right` slot at `max-w-full` but
**cannot wrap a cluster whose markup it does not own** — an over-wide child just
changes which edge it leaves by, so the call site needs `flex-wrap` itself.

Trap: **`MasonryGrid` in a zone under 768px silently does nothing**, and the
class list cannot tell you. It breaks on its *container* (`@3xl` = 768px), so a
review zone measured at **722px** — 46px short — resolves three groups to a
single column. Gym's first packing pass therefore packed nothing, and only the
before/after numbers showed it: `open` moved 4.7 to 4.6. Use `CardGrid` when the
column width is decided by the page split rather than by the card; it asks about
the viewport. Second page this has bitten (Stats' habit masonry in a 580px cell
was the first), which is why it is here and not only in `CardGrid.tsx`.

Trap: **do not `npm run build` while `npm run a11y` is running.** `vite preview`
serves the half-written `dist` and the gate reports `[Plan] rendered 0
characters — the view did not load` and exits 1 — indistinguishable from a real
regression, and it cost a confused re-run. Same family as the stale-service-
worker trap above: the gate is honest, the bytes under it were not.

Trap: **`grid-cols-N` is safe and the *implicit* track is not.** Tailwind's
`grid-cols-2/3` expand to `repeat(n, minmax(0, 1fr))`. A grid with no
`grid-template-columns` at all — which `CardGrid` had below 768px — gets one
implicit `auto` track that sizes to the **widest item's min-content** and may
exceed its own container. A grid track is *shared*, so one wide item drags every
sibling with it: Stats' Activity heatmap (a 53-column `table-fixed`, min-content
398px) stretched all six neighbouring cards to 398px inside a 324px box and put
sixteen controls off the right edge. **A card's own `min-w-0` cannot fix this** —
it is the track that overflows, not the item. Spell the phone column out.

Trap: **`count ? sum / count : 0` makes "no data" indistinguishable from "you
scored zero".** `monthlyCompletion` and `weekdayConsistency` both ended that
way, so *Monthly trend* opened with `0% · 0%` for the two months preceding the
first habit's `startedOn` — a total failure that never happened, in the leftmost
position where a trend is read from. Return `null` and let the caller decide;
`moodByWeekday`, immediately below them in the same file, always did. Watch for
the test that hides it: **`expect(null).toBeGreaterThanOrEqual(0)` coerces and
passes**, so `weekdayConsistency returns 7 values in 0..1` would have gone on
passing whatever that function returned. Assert `not.toBeNull()` first.

Trap: **a chart is not empty because a full-page screenshot says so.** The
screenshot tool downscales, and 2px strokes at `opacity 0.35` vanish — Trackers'
Mood/Stress/Sleep line chart and its category radar both read as bare grids at
1440 and are in fact dense and legible. Count the `recharts-curve` paths in the
DOM, or take an **element** screenshot at native size, before calling one
broken. A downscaled page shot cannot support that claim in either direction.

Trap: **`opacity` on text produces a colour no gate can check.** `SectionRail`'s
count badge was `opacity-70` on `fg-2`, which computes to **3.08–3.82:1** on the
selected row across the five themes — five of five under 4.5, for the whole life
of the component. Neither gate could see it and both were right to be quiet:
`check-contrast` reads token *values*, and a faded token is not a token; axe needs
a resolvable background, and the rail was **transparent**, so there was nothing
behind those chips to fail against. Giving the rail a ground (below) turned a
silent failure into a red one — the gate was **blind, not happy**. State a
quieter colour as a token; never reach for opacity to make text recede.

Trap: **a transparent sticky element is one the page scrolls through, and no gate
sees it.** `SectionRail` shipped `position: sticky` with
`background-color: rgba(0,0,0,0)` and `z-index: auto` on all seven adopters, so
content painted in the same pixels as the chip row. Nothing is clipped, so
`clipped-text` is quiet; the accessibility tree is sound, so axe is quiet. **Text
over text is never a design** — it is the rare geometric defect with no judgement
in it, and it needs *both* a background and a `z-index` (a background with
`z-index: auto` still loses to a positioned sibling). Three separate passes
reported it independently: a defect in a shared primitive gets found once per
adopter, not once.

Trap: **a style rule each author must retype is one that gets forgotten.**
`.prose-doc a` was the only anchor rule in the app, so an inline link anywhere
else inherited its parent's colour with no underline. Measured across seven views:
nine inline anchors outside `.prose-doc`, **every one underlined only because its
call site remembered `className="underline"`** — and the one that forgot was a
source citation, the thing this repo requires be credited and reachable. The fix
belongs in `@layer base`, not unlayered: an unlayered rule **beats** Tailwind's
utilities (that is the `.zone-act input` vs `.hidden` trap one section down), so a
deliberately-styled link could no longer override itself. And do not guard it with
`:not([class*='text-'])` — that also matches `hover:text-…`, which left the
glossary's own source links inheriting body colour.

Trap: **`space-audit` and `a11y` measure only the group a rail opens on.** A
`SectionRail` renders one group at a time, so every space number quoted for a rail
page is *that group*: Recovery reports 1.7 screens while its `patterns` group is
**3.6 desktop / 7.5 phone**, and Insights reports 1.7 while its `mood` domain is
**2.65 / 5.12**. `a11y` reached **6 of 28** Insights panels while a comment in
`VIEWS` claimed otherwise; arming it went green → **7 serious** → green. This is
the Settings tab-shell blindness (COD-232) in a second shape, now across seven
pages — and a rail row has no `aria-expanded`, so `openFolds` cannot find it. When
you put a page on a rail, **arm both gates for its groups in the same change**, or
the page's numbers describe a fraction of it.

Trap: **the a11y gate restarts animations and then measures them.** `settle()`
runs at the top of `scan`, and *then* `openFolds` and `revealLazy` click every
fold and mount every `LazyMount` — each starting a fresh `page-enter` fade. So axe
read colour from a **mid-fade blend** and reported an arithmetically perfect
failure describing no token in the app: `#7c8195 on #1a1a1f = 4.48`, which is
`fg-2` at 70% over `ink-0` when the settled pairing is **7.79**. It cost three
separate investigations in one day — two agents worked around it in their own
probes and one changed a colour token and reverted it. Fixed with a second
`await settle(w)` immediately before `AxeBuilder`. Fifth entry in the
wait-before-assert table above, and the first where the gate's **own actions** were
what it failed to wait for. Note the corollary: that arithmetic also fits a real
faded token, so do not assume the fade — adding the settle and seeing the number
*survive* is what distinguishes them.

Trap: **setting `data-theme` on the root does not re-theme an inline style.**
The CSS variables repaint immediately, so the *background* under an element
changes; but `cat()` and `onRaised()` resolve from `src/lib/colors.ts` at render
time, so any `style={{ color: … }}` keeps the value React last wrote. Measure a
contrast pair that way and you get the **new ground against the old
foreground** — a probe here reported latte's over-limit warning at **1.68:1**
when it is **5.81**, wrong by 3.5x and wrong in the alarming direction. Sixth
entry in the wait-before-assert table, and a close relative of the mid-fade
blend above: both produce an arithmetically perfect failure describing a pairing
that exists nowhere in the app. Switch themes the way the app does — write
`settings.theme` and reload — and measure after the reload. The tell is that the
foreground is *identical across every theme you probe* while only the background
moves.

Trap: **a seed test that passes and a browser that shows nothing are not a
contradiction.** `cycleSeed.test.ts` asserted mood and energy were seeded, and
passed; the running app showed **100 seeded days with zero of either**. Both were
true: the test seeds a fresh journal, and `?demo=1` only ever seeded when
`d.entries.length === 0`, so a demo opened once was frozen at whatever the seed
looked like that day and every field added afterwards was invisible — which
reads exactly like the feature being broken rather than like the demo being old.
`DEMO_VERSION` re-seeds a journal that IS the demo (`settings.demoSeeded`), never
a real one, and only on a URL asking for the demo. **Bump it whenever the seed
gains a field a page renders**; it moved three times in one day and each move was
a feature nobody could see. Sibling of the unseeded-`data.cycle` trap above: that
one was a domain the seed skipped, this one is a domain the seed reaches and the
*browser* never re-ran.

Trap: **a ratio must compare like with like, and a unit change is how that
breaks.** The recovery ledger divided urges resisted by lapse *amount*, which was
fine while amounts were occurrences and became nonsense the moment an addiction
could be measured in minutes: five resisted urges against 235 minutes of
scrolling rendered as **"2% of the pulls you logged, you did not follow"** for
what was a good month. Both sides of a ratio need the same currency — here
*events*, because a 90-minute scroll is one decision that went the other way, the
same as one cigarette is. The amount stays, for saying what it cost. Whenever a
quantity gains a unit, grep every place it is divided by or compared against
something else.

Trap: **hand-rolling a control the app already has is how a new panel ships
looking unstyled.** Three new panels used inline `cat('surface0')` /
`cat('surface2')` backgrounds for their chips instead of `ChipPick`, which
already carries the pill radius, the `bg-ink-2` rest fill, the per-tone selected
state, `active:scale-95` and a real `<fieldset>`/`<legend>`. It was reported as
"looking very bad", correctly, and the fix deleted ~120 lines. DESIGN.md's "fill
defines a control" rule exists for exactly this; **reach for the component before
the token, and the token before a hex.** Same family as the `cat('crust')`
trap — a local decision where a shared one already exists.

Trap: **reaching for the smallest type step by default.** New Cycle cards used
`text-micro` 13 times against 19 `text-label` — a ratio of **0.68** where the
app-wide ratio is **0.17** — and read cramped because of it. `micro` is for a
dense numeric ruler where thirty numbers share a 400px strip, not for a legend or
a value anyone reads. Count your own usage against the app's before believing the
sizes are fine.

Trap: **a sweep piped through `head` is a sweep you did not do.** It truncates
silently, the exit code stays 0, and the output *looks* like a complete answer —
so "nine call sites, and that was all of them" got written into a PR body when
the grep behind it had been cut off at 40 lines. Three more sites each carried
their own opinion of what a habit type means, and each silently dropped the type
that had just been added: it never rendered on Today's classic layout, the CSV
exported every one of its days as not-done, and the sparkline drew *taller the
worse the day*. **Count the matches before reading them** (`| wc -l`, or no pipe
at all) whenever the result is going to be quoted as exhaustive. The helper
introduced in that same PR could not save it, which is the general lesson:
`isNumericHabit` only helps where it is *called*, and a call site that re-decides
the meaning inline is invisible to every migration.

Trap: **two preset vocabularies that do not match each other.**
`ADDICTION_PRESETS` offers "Nicotine" and `URGE_PRESETS` offers "Smoking", and
`UrgeWin` has no addiction field — it carries free text — so any per-addiction
join over urges is a *name* join that, for a default user, matches **nothing**.
The card that needs it prints its coverage fraction (`3 of 5`) and names the
missing label rather than drawing an empty grid, because an empty grid reads as
"no urges at any hour" (a measurement) when the truth is "nothing is labelled
this" (a gap in the record). Reconciling the two lists is cheaper than the schema
change and makes a shipped chart start working. COD-251.

Trap: **a preview port cannot be identified by its `<title>`.** Every worktree in
this repo serves an identical title, so the check that was written down here as
the way to confirm what a port is serving does not work across worktrees — one
agent measured a whole run against a different worktree's bundle. Compare the
served `assets/index-*.js` against your own `dist/index.html`. Same family as the
smoke gate that spent three PRs pointed at another application, one level down.

Trap: **there are two disclosure implementations and only one puts text in its
toggle.** `CollapsibleSection` renders its title inside the button;
`Card collapsible` renders a caret glyph and nothing else, so its name lives
entirely in `aria-label`. A sweep that reads `textContent` therefore sees every
`CollapsibleSection` and **no card fold at all** — `scripts/page-census.mjs`
shipped that way and reported Coaching as 14 folds when it has 32, and
Pickleball as 4 when it has 18. Read the accessible name
(`aria-label ?? textContent`), and scope the query to `#main`: the shell header
carries four `aria-expanded` menu buttons on every view, so a document-wide
count adds a flat 4 to every page. Same family as the `help ?? subtitle` trap
below — and note it was the script written to stop people quoting unmeasured
numbers that got it wrong.

Trap: **squash-merging the bottom of a PR stack permanently closes its child
PR.** Deleting the base branch on merge auto-closes any PR pointing at it, and
GitHub will not reopen or retarget a closed PR whose base branch is gone
(`Cannot change the base branch of a closed pull request`) — #145 and #147 had
to be re-created as #148 and #149 with their bodies copied across. Rebase each
child onto `main` with `git rebase --onto main <old-base-sha> <branch>` and
retarget it **before** merging its parent.

Trap (fixed, COD-28): **`npm run a11y` used to run against an empty journal**,
so every `{peakHour && <Card/>}` / `{rows.length > 0 && …}` was absent from the
DOM and could not fail. It now loads `?demo=1` and **asserts the seed landed**
before scanning — arming it turned one green run into **16 serious violations**
that had been invisible for the gate's whole existence. Keep the assertion: a
gate that silently reverts to an empty journal prints the same reassuring zero.
Sibling of the `VIEWS`-list trap below: "a page that is never visited cannot
fail" became "a card that never renders cannot fail".

**And it runs one domain deeper than the seed goes.** `lib/demo.ts` wrote
every domain *except* `data.cycle`, so the Cycle page — which the gate visits
on every run, at five themes and two viewports — had never been rendered with
data by anything. Its whole orientation block is `{day != null && phase && …}`,
its chart drew a bare grid over thirty empty rows, and none of it could fail.
Seeding four cycles turned the first green run red on a **serious**
`scrollable-region-focusable`. When you add a domain to `types.ts`, add it to
the seed in the same change: an unseeded domain is a whole subject the gates
are silently not checking.

Trap: **`cat('crust')` is not a foreground.** It is the light-on-*saturated*
half of a pair, and it is near-white in the light themes — so `crust` on any
fill is correct in Mocha and wrong in Latte and Dawn. **Use `onAccent(fill)`**,
which picks the better neutral per theme and pushes it to 4.6. That helper
existed and had two adopters against 21 hand-written `cat('crust')` call sites;
finishing the migration fixed 7 of the 16 violations above. Its partner mistake
is `cat('overlay0')` as text on the *neutral* branch of the same ternary —
**2.57:1** at 10px, four instances. Use `subtext0` there. When you write a
ternary that picks a foreground per state, both branches are a decision.

Trap: **the accent-on-wash idiom is calibrated at `'22'`, and `'33'` breaks
it.** The accents clear 4.5 as text on a **13%** wash of themselves. A 20% wash
lifts the background further toward the text and puts it back under — Plan's
migration pill measured 4.25 on latte red. One hex digit, and nothing fails
loudly.

Trap (fixed, COD-32): **the palette was written down twice and the copies had
diverged.** Every theme lives in `src/index.css` as `--color-*` *and* in
`src/lib/colors.ts` as a literal map, because Tailwind utilities resolve the
first and `cat()` (inline styles, charts) resolves the second. Nothing kept
them in step: vscode's `red` was solved by hand in #157 and applied to
`colors.ts` only, so `text-red` painted `#f14c4c` and `cat('red')` painted
`#f57979` **on the same screen**. Mocha's three surfaces had drifted the same
way. `npm run contrast` now fails on any divergence and on any accent under
4.5:1 as text — **run it, and edit both files.**

Trap: **a static gate catches what a rendering gate structurally cannot.** The
armed a11y gate was green while latte's `yellow` sat at **2.02:1** — below even
the 3.0 floor for a graphic — because the only place it renders is one branch
of Plan's `count >= 4 ? red : count >= 2 ? peach : yellow`, and the demo seed
produces counts of 2, 3 and 4 only. **A branch the seed never takes cannot
fail.** Same family as the empty-journal and closed-fold traps: prefer a check
on the *source* when one is possible.

Trap: **in a light theme there is no legible light yellow.** Any yellow that
clears 4.5:1 on white is dark, and darkening `#f29900` straight down lands on
`#8a5700` — dE 14 from latte's `peach`, i.e. the same brown, which collapses
the red/peach/yellow three-step scale Plan and Trackers both use. Re-pick by
**hue** instead (the olive-gold side, h≈50): `#816c03` is dE 31 from peach.
When an accent cannot be darkened into legibility without colliding, move it
sideways in hue, not down in lightness.

Trap: **`scripts/a11y-axe.mjs` visits a fixed `VIEWS` list.** A page not on it is
not checked, and "0 serious" means only "for the pages that were opened". Add new
surfaces. Do not argue a page is unreachable from the code's shape — Recovery was
excluded on the belief it was behind an opt-in, but `nofapEnabled` defaults to
true, and adding it immediately failed on a contrast bug.

Trap (open, COD-237): **replacing folds with a `SectionRail` makes the a11y gate
cover less, and the fold column reads it as an improvement.** `openFolds()` finds
content by `[aria-expanded="false"]`; a rail is a nav of single-select buttons and
has no `aria-expanded` at all, so the gate scans whichever group the page opens on
and never sees the others. Recovery's fold column went **3 → 0** in the same
commit that made twenty panels reachable — the gate used to open three folds and
scan all of them, and now scans the six in `progress`. Six pages are in this state
(Insights, Coaching, Pickleball, Pull-ups, Help, Recovery). Same shape as COD-232's
tab shell, one mechanism over, and the same answer: **drive it per group with a
throwaway probe and say what you measured.** Recovery's four groups were probed at
five desktop and two phone themes — 28 scans, 0 serious or critical — so arming it
there is free; that is not known for the other five. A rail is still the right
instrument; what is not allowed is letting the fold count read as coverage.

Trap (retired): `BottomNav`'s `PRIMARY` list used to be silently filtered
against the sidebar items, so retiring a nav id dropped its phone tab with no
error — collapsing the Body cluster left the bar at three. There is no list any
more: both nav bars read `SECTIONS` directly. Kept as a warning against
re-introducing a hand-written id list that resolves against another source.

Trap: **a data module can go dead without anything failing.** A pass adding
"cards from the training guide" to `views/Pullups.tsx` rewrote the lists
*inline* instead of reading `lib/pullups.ts`: `PULLUP_WORKOUTS` went from
fourteen formats to three, `PULLUP_PROGRESSIONS` from nine to seven rewritten
ones, and the ability table was dropped. `tsc -b`, eslint, vitest and the build
were all clean — an export nobody imports is not an error — and the page still
rendered a plausible-looking list, so the loss was invisible on screen too. Same
family as the emergency-banner extraction in the global rules, running the other
way: the copy was retyped rather than reused. **When a view stops importing a
data module, that is the finding.** Assert the counts in a test
(`lib/pullups.test.ts`), because nothing else will.

Trap (open, COD-232): **a tab shell holds one panel in the DOM, and both
rendering gates grade the one it opens on.** `npm run space -- settings` reports
`0.9 shipped / 0.9 open · 2 cards` for a four-tab view; that is the Profile tab,
and every space number ever quoted for Settings measured a fraction of it.
`npm run a11y` has the same hole from the other end — it reaches Settings by URL
and scans whatever mounted, so the passcode form, the cloud passphrase, every
export button and the erase-everything dialog have never been seen by axe at any
theme or viewport. `openFolds` reaches inside a closed fold; nothing reaches
inside an unselected tab. Driven per tab with a throwaway probe, Settings was
**2.7 screens of content over five tabs, three of them under half a screen** —
the "empty, and there is width going spare" report that no gate could see, since
the `space` budget only flags 3+ screens and every card cleared the 45% fill
floor. Probed across five desktop themes, the unscanned tabs are clean as they
ship, so arming this is free; the ticket carries the implementation notes,
including that `space-audit.mjs` never sets `bujo:onboarded` and so cannot click
anything while the onboarding modal is up. Corollary already fixed: **four
controls behind default-off toggles had never been rendered by any gate** — the
reminder time and the local model's three fields, all inside a `Row` whose label
is a `<span>` that names nothing, and with the toggles forced on that was one
**critical** `label` violation at every theme. Same family as latte's yellow at
2.02:1 behind a branch the seed never took: when a gate walks the DOM, ask what
is not in it.

Trap: **demo data is persisted, not regenerated.** Editing `src/lib/demo.ts`
changes nothing for an existing journal — re-seed via Settings → Data → Load
demo data.

## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:
- For codebase or architecture questions, when `.graphify/graph.json` exists, first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`); these return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- Before proposing or committing .graphify artifacts, run `graphify portable-check .graphify`; commit-safe graph artifacts must use repo-relative paths, and never commit .graphify/branch.json, .graphify/worktree.json, .graphify/needs_update, or .graphify/cache/. If a repo already tracks any of them, first add them to .gitignore, then propose `git rm --cached .graphify/branch.json .graphify/worktree.json .graphify/needs_update` and `git rm -r --cached .graphify/cache`; never mutate git state without asking
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` instead of generic traversal
- Read `.graphify/GRAPH_REPORT.md` only for broad architecture review or when `query` / `path` / `explain` do not surface enough context
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current

<!-- plane-agent-rules:v2 -->
## Issue tracking (Plane, local)

All work across `~/Documents/coding` is tracked in one Plane board.
The `plane` MCP server is registered at user scope, so its tools are available
in every session — no setup needed per repo.

- Workspace `coding`, project `Coding` (identifier `COD`), at <http://localhost:8080/coding/>
- **This repo is the label `repo:bujo`.** Every work item you create must carry it.
- Also add one `type:` label matching the conventional-commit type you intend to
  use: `type:feat` `type:fix` `type:refactor` `type:perf` `type:docs` `type:test`
  `type:build` `type:chore`.

States, and what each one means here:

| State | Means |
|---|---|
| `Backlog` | Captured, not committed to. Default for anything you file mid-task. |
| `Todo` | Pulled into the current cycle. This week's list. |
| `In Progress` | A branch exists. |
| `In Review` | A PR is open, waiting on CI or a read. |
| `Done` | Squash-merged, branch deleted. |
| `Cancelled` | Decided against. Say why in a comment — that reasoning is the value. |

Rules:

1. **Before starting work, check for an existing work item** for what you are
   about to do. Duplicates are worse than nothing because they split the history
   of a decision. **Two ways to look, and both have a trap** — see "Finding an
   existing item" below. An empty result from a search you got wrong reads
   exactly like an empty board, which is how duplicates get filed.
2. **A found bug outside the current task's scope gets filed, not silently left.**
   File it in `Backlog` with `repo:bujo`, say in your reply that you filed it.
   This is the mechanism the global CLAUDE.md rule refers to.
3. **Move the item as the branch moves**: `In Progress` when the branch is cut,
   `In Review` when the PR opens, `Done` on squash-merge.
4. **Put the work item id in the PR body** (`COD-12`), not only in the branch name.
5. Do not create Plane *projects*. One project is deliberate — repos are labels
   so a repo can move between `now/`, `shelf/` and `live/` without its tickets
   being migrated.
6. Cycles are weeks. If the user asks "what am I doing this week", read the
   current cycle, not the whole backlog.

### Finding an existing item

This Plane is the **Community edition**. `workitem list` with a `pql` or any
structured filter fails outright:

> PQL and structured filters are not supported on this Plane edition.

So **there is no server-side way to filter by the `repo:` label.** Filter in your
own head instead — list, then read:

```
workitem list  project_id=<COD uuid>  per_page=100
               fields=sequence_id,name,state,labels
```

and keep only the rows whose `labels` contain this repo's label UUID. Get that
UUID once from `label list` (the API returns UUIDs everywhere and accepts nothing
else). The board is small enough that one unfiltered list is cheaper than the
round-trips to avoid it.

`workitem search` also works, but **it matches a contiguous substring of the
title, not a set of words.** Searching `"LM Studio local model"` returns nothing
while `"LM Studio"` returns two items — the first phrase appears in no title.
**Search one distinctive token** (`local_model`, `vault.yaml`, `8787`), never a
sentence, and treat a miss as "my query was too long", not as "no such ticket".

### Useful UUIDs

Every repo shares one project and one set of states, so these are fixed. Only the
`repo:` label differs — look yours up with `label list`.

| Thing | UUID |
|---|---|
| project `Coding` (COD) | `384bb763-72eb-497f-8ddb-142f7c178668` |
| state `Backlog` | `c1497bfa-8446-49f0-aa45-976b0311b82f` |
| state `Todo` | `c074ade8-4a34-4a89-8de3-e7ab61caedf6` |
| state `In Progress` | `824d6862-acf5-4562-82d3-fc1ee7eaadd9` |
| state `In Review` | `25021b28-b089-490e-9628-d4c0fd1a5253` |
| state `Done` | `ede567e7-3e57-405e-ac93-fb04db6bcfff` |
| state `Cancelled` | `85b6f97d-30e3-4cf4-ae58-063a0e239b4f` |

Plane does not replace `STATUS.md`. `STATUS.md` is re-entry context — where you
stopped, the next action, the traps. Plane is the queue. Both, in the same commit
as the work.

<!-- /plane-agent-rules -->
