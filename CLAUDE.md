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

## Writing content the UI renders

**Points, not paragraphs.** Anything a person reads on a card — a scenario, a
set of symptoms, a what-to-do, a disclaimer — is a list of short lines, not
prose. Asked for directly: *"I don't think people love to read paragraphs."*
Nobody reads a wall of text on a phone, and a three-sentence string cannot be
scanned, skipped or returned to.

What that means in practice:

| Rule | Why |
|---|---|
| A field people read is `string[]`, not `string`, the moment it holds more than one idea | The type is the rule. A `string` invites the next sentence to be appended |
| One idea per line, and a line is a real line — not a fragment left behind by splitting a sentence on its full stops | `pickleballAcademy.test.ts` asserts a floor of 12 characters per point for exactly this |
| Two points minimum, or it was never a paragraph and should stay one line | A one-item bullet list is a bullet pretending to be structure |
| The heading above the list says what the list is; the points do not repeat it | "When to hit it" then three situations, not three sentences each starting "When…" |
| Keep ordering meaningful — frequency, sequence, or severity — and say which in the data file's docstring | `COURT_INJURIES` is frequency EXCEPT the fall, which is last because it costs most |

The one exception is a single sentence that genuinely is one idea (`unlock`,
`mechanism` on a simple case, a chip's `hint`). Leave those as strings; the rule
is against paragraphs, not against sentences.

Assert it where it can be asserted. `tsc` proves a field is a string and never
that the string says anything — `src/lib/pickleballAcademy.test.ts` is the
pattern: point count, per-point length floor, and no point that is a copy of the
field beside it.

Trap: **a container query against a missing container never matches, and
nothing says so.** `PageLayout` declares no `@container/page`, so a
`@3xl/page:grid-cols-[minmax(0,1fr)_19rem]` inside zone 2 simply did not apply
— the aside rendered **1110px wide, i.e. full width**, with no error, no
warning and a perfectly valid class list. It looks exactly like a breakpoint
you chose wrong. Declare the container on a WRAPPER (an element cannot query
itself) and **verify by measuring the box**, not by reading the classes. Same
family as the stale-utility-class trap above: Tailwind v4 does not fail a build
over a rule that can never match. **Third instance, COD-328:** Pickleball's
Today's-drill strip sat one level ABOVE the `@container/page` wrapper, so its
`@min-[58rem]/page:grid-cols-…` matched at no width at all and the strip stayed
four stacked lines in a 1110px column. The tell is always the same — a
responsive rule that never fires at ANY width, rather than at the wrong one.

Trap (COD-328): **a collapse has to be excluded from EVERY
`grid-template-columns` rule, and the one you miss shows up at one width.**
`PageLayout`'s `collapsibleAct` adds `.page-zones-actless`, and
`styles/layout.css` sets the zone columns twice — `62fr 38fr` at a 900px
container and `1fr 32rem` at 1365px, the second capping the act on wide
screens. Only the first excluded the collapsed state, so hiding the act gave
the review the full width at 1280, 1440 and 1680 and left it **beside a 512px
empty track at 1920 (1062 of 1590) and 2560 (1398 of 1926)**. Reported as "when
I hide the log the content is not scaling", and invisible to a first round of
measurements taken at 1440 only. **Measure a layout change at more than one
width** — and grep for every rule that sets the property you are overriding.

Trap: **`hidden` on a grid child leaves its track behind.** Hiding a 19rem
aside that way keeps the column and the list stays narrow beside a gap —
"shutting it" gives back the height and not the width. Change `grid-cols`
instead. Measured on Coaching's week panel: roadmap **790px → 1110px** only
once the column itself went.

Trap: **`fillMap` is lossy for anything whose value is a list.** It is a
shallow merge, so on a key collision the winner's array replaces the loser's
outright. That is correct for `coachingWeekNotes` (one sentence, last edit
wins) and silent data loss for `practiceLog` (the days you ticked a drill on
the other device). `unionListMap` is the one to copy, and remember the
delete-if-both-sides-lacked-it loop or a merge invents an empty map.

Trap: **a raw `<details>` is invisible to `npm run a11y`.** `openFolds()` finds
content by `[aria-expanded="false"]` and a `<summary>` carries no such
attribute, so Coaching's session template had never been opened by the gate at
any theme or viewport. Grep for `<details` before trusting a fold count — and
note this is the THIRD disclosure implementation the repo has had to learn
about, after `CollapsibleSection` and `Card collapsible`.

Trap: **a facet merge can expire.** Play safe was folded into the knee chapter
on a real measurement — five one-line tips, 0.36 desktop screens, a facet
rather than a peer. Then the chapter gained content and measured **3.32 desktop
and 7.53 phone screens**, the worst on the page by a factor of two. The rule did
not stop being true; the thing it was applied to stopped being small.
**Re-measure a merge after you add to either half**, and split on WHEN SOMEBODY
READS IT rather than on what the original rows happened to be called.

Trap: **a CSS class named for one call site is how the third one writes its
own.** `.week-in` was the roadmap's stagger; the manual chapters wanted exactly
the same 7px rise and the honest options were to reuse a class whose name lies
or to duplicate the keyframes. Renamed to `.settle-in` the moment the second
caller appeared — which is the cheapest possible moment, and the only one where
the rename is a two-line diff.
## A phone logs, a desktop reads

Owner direction, 2026-10-28, applied page by page starting with Body →
Pickleball (COD-450). On a phone:

| Rule | How |
|---|---|
| **No visualizations.** Charts, trend cards and analytics panels are desktop-only | `panels.ts` marks each panel `phone: true` only if you WRITE to it; `panelsFor(phone)` filters the bar |
| **The log is the first thing on the page, and logging needs NO scroll** | a one-screen quick log (`pickleball/QuickLog.tsx`): what every session has on screen, everything optional in a bottom `Sheet` (`ui/sheet.tsx`), the draft pre-filled from last time (`carryOver`). A long grouped form — even fully open and iOS-styled at 2.62 screens — was rejected: "try not to make them scroll down again and again" |
| **iOS geometry**: 17px fields, 44px targets, inset groups, chips as one segmented row | `FieldGroup` + `styles/phone.css` (`.ios-form`) — scoped classes, no media query |
| **Decided by screen width**, never a "desktop mode" | `useDevice()` (`shell/device.tsx`) — ≤767px, or touch under 1024px |
| **Desktop does not change.** Prove it | `FieldGroup` renders the exact desktop wrapper it replaced; probe the page at 1440 before and after and diff the numbers |
| **A chart in a rail registry is flagged, not hidden by hand** | `chart: true` (`lib/cycleCards.ts`) or `phone: true` (`lib/focusCards.ts`), filtered in the SAME `idsIn` predicate the rail counts with — so a rail row never promises a card that is not drawn |
| **Choosing comes in one bar; a list item is one row** | Program (COD-464): week/day as two NATIVE selects in a 44px bar (iOS wheel for free), one row per lift with a tap-per-set counter, the row opening in place. Two 60px steppers + 22 set rows were rejected: "all fit in one space" |
| **Pre-fill from last time and show it** | `lastSetFor` fills the weight AND the row says "last 35×12"; − / + move every unticked set one plate; `suggestWeight` offers +1 plate after a session that hit every rep |
| **The primary button is small and floats** | owner ask: a 44px pill at the right (`.cta.cta-compact` in `.log-dock`), not a full-width slab — the list shows around it |
| **Every phone page gets `.phone-frame`** | `App.tsx` `ViewFrame`; unlayered CSS under it tightens every card band (24 → 16px) without touching desktop |

The full page-by-page record: `docs/sessions/2026-10-29-phone-pages.md`. The
prompt for the next phone page: `docs/MOBILE-BRIEF.md`. The procedure, as a
skill: `.claude/skills/phone-page/SKILL.md`.

## Next up — queued by the owner

**COD-479 · "watch how" on YouTube, on every named thing, phone AND desktop**
— workouts first, then drills, movements, principles, recipes. Asked
2026-10-29: *"I want to see YouTube videos … search in YouTube as well? For
both mobile as well as the desktop versions, not only workouts."* Build ONE
`VideoLink` on top of `lib/video.ts` (search links built from a name, never
pinned ids), adopt it per page, and test each CALL SITE. **Links only, no
embedded player**: an iframe reports every view to Google and needs CSP
`frame-src`, against the "no user data collected" goal (COD-436). Plan and
page list: `docs/NEXT-SESSION.md` §1.

Trap (fixed, COD-467): `useActColumn` shut the act column whenever the page
STACKED, which on a phone hid the form behind a strip — the measured "before"
on Pickleball was one visible field, and Cycle and Nutrition had NO visible
input at all. It now stays open on a phone (a chosen shut still holds). A
phone sweep found it on six pages at once: fix a phone gap in the shared
hook, not page by page.

Phone surfaces (COD-454): `ui/seg.tsx` (iOS segmented control), `ui/cells.tsx`
(inset grouped rows), `ui/sheet.tsx`, all styled in `styles/phone.css`. The
shell's book frame and page-turn are dropped for EVERY phone page in
`App.tsx`'s `ViewFrame` — so a phone card now sits on the page ground, not the
cover's card colour, and an accent-on-wash pill can fall under 4.5 (Coaching's
today-pill went to 4.39 in latte; fixed by moving its text to `fg-1`).

Trap: **tap-again-to-clear on a PRE-SELECTED control drops data.** Time arrives
selected from last session, and people tap the highlighted option to confirm
it — the e2e did exactly that and logged a session with no duration. `Seg`'s
`allowNone` is for optional answers that start empty, never for a carried-over
value.

Trap: **a `Sheet` is `.ios-form`, and `ChipPick` inside one draws as a
squashed segmented row.** The phone form rules restyle every chip button, so
Nutrition's food chips rendered as eight 44px circles cutting their own names
("Chic", "Gril", "Bro") when the desktop picker was dropped into the Add-food
sheet. A phone list is rows anyway: `NutritionPhone`'s `FoodRow` (name,
serving, + ) is the shape — do not put a desktop chip picker in a sheet.

Trap: **axe's `label-content-name-mismatch` compares WHOLE WORDS.** "Dink"
inside the letters of "Dinking" still failed, at every theme; so does an
`aria-label` that replaces a row's visible text. Say extra words BEFORE the
visible text (`Cell`'s `label` is a visually-hidden prefix), never instead of
it.

Trap (open, COD-455): **the book cover blinds axe on DESKTOP.** `.book`
paints its ground as `linear-gradient(var(--card), var(--card))`, and axe
cannot compute contrast through a background-image, so text under the cover is
"incomplete", never "fail". Dropping the cover on phones surfaced four real,
long-standing failures at once (Insights achievements faded with `opacity-50`
to 1.82–2.94:1, Insights' avg-mood number 1.82, Today's chips 4.21) — fixed,
but desktop still renders the cover. A green desktop scan proves nothing about
contrast until the cover paints a flat `background-color`.

Trap: **the phone session form is a second DRAWING of the same fields.**
`SessionFields` hands off to `SessionFieldsPhone` on a phone (both sheets get it
for free), so a field added to a session goes in BOTH files. The round-trip
test guards the draft, not the drawing. And in a browser probe: an input with a
`list` is a **combobox** and a number input is a **spinbutton** — not a
textbox; two selectors here timed out on that before the form was suspected.

Trap: **"lighter than its track" has no single token across the five
themes.** The card colour is lighter than `ink-2` in latte and dawn and darker
in mocha, neon and vscode — measured, not assumed — so the segmented thumb is a
16% text-colour mix by default and `ink-1` under the two light themes.

## Two documents to read before changing a page

- **`docs/USER-CONTROL.md`** — what a person must always be able to do with
  anything they record. `add` without `edit` is a bug; delete asks first and
  names what it removes; an edit rewrites *every* stored shape, not the one the
  list renders; every chip row has an escape hatch; a shortened label is still
  announced in full. Written after Home Workout shipped a history whose only
  affordance was a `×` that deleted on the first click — while `updateWorkout`
  had been in the store the whole time with two call sites.
- **`docs/REUSABLE-PATTERNS.md`** — the six pieces Pull-ups and Home Workout
  left behind, each with the measurement that decided its shape: the shared
  panel card, one bar per review zone, draw-short/announce-long chips, the
  record editor, links built from a name rather than pinned, and the capped
  list. Read it before building any of them a third time.

## Starting a server — never stop someone else's

This machine runs several projects at once. Measured 2026-10-28: an Astro site
on 4321, three `serve-dist` previews on 4322–4324, another Vite app on 3000,
Plane on 8080, Postgres on 5432/5433. **Never kill, stop or restart a process
this session did not start** — not to free a port, not because it "looks
stale". A port in use means pick another port.

1. **List what is listening first**, with the command line that owns it:
   ```
   Get-NetTCPConnection -State Listen | Select-Object -Unique LocalPort, OwningProcess |
     ForEach-Object { "{0}`t{1}" -f $_.LocalPort, (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)").CommandLine }
   ```
2. **Dev is pinned to `127.0.0.1:5199`** — `npm run dev` is
   `vite --host 127.0.0.1 --port 5199 --strictPort`. The host matters: on
   Windows `localhost` binds `[::1]`, so a second server on `localhost:5199`
   started beside one on `127.0.0.1:5199` without colliding (measured). Open
   `http://127.0.0.1:5199`. `--strictPort` makes it fail loudly instead of
   drifting onto 5173, which belongs to whichever project started first. If 5199 is taken *by this repo*, reuse it; if by
   anything else, pass another port (`npm run dev -- --port 5299`).
3. **Previews: 4310 and up**, always `--strictPort`, always `BUJO_URL` set to
   match (see the gates section below).
4. **Run servers in the background** and stop only the ones you started, by
   the PID you started.

Google sign-in on a dev port only returns to that port if the origin is in
Supabase's redirect allow-list (`http://localhost:5199/**`,
`http://127.0.0.1:5199/**`); otherwise Supabase silently sends you to the Site
URL. See `docs/auth/google-oauth-setup.md`.

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

**Written down and then walked into, 2026-10-16.** A comment in `CalendarSpan`
recording the contrast bug it had just fixed quoted the three colours involved
as hexes; `npm run verify` was green, `main` went red on push, and the fix was
to name them by TOKEN ("latte's mauve") instead. The lesson is not the rule —
the rule was already here — it is that `verify` passing is not the same as the
gates passing, and the four that are not in it are the four nobody remembers.

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

Trap: **an unpinned gate changes its own rules without a commit.** `a11y.yml`
installed `playwright` and `@axe-core/playwright` per job with no version, so
axe went 4.13 → 4.14 on its own, 4.14 turned `label-content-name-mismatch`
(WCAG 2.5.3) on, and the gate went red **on `main` and on every open branch at
once** — days before anyone read the log, because a red on your own branch
reads as "something I did". Three page passes shipped under it. The findings
were real (137 controls over nine components: a pill drawing `migrated 4×` and
named `Migration history for "…"`, a rail painting `All24`), which is the point
— the gate was right and nothing in any diff said why it had started failing.
**Pin the gate's own dependencies**, so a new rule set arrives as a commit with
its findings attached. And when a gate goes red across every branch including
`main`, suspect the gate's environment before suspecting the branch: `git log`
on the workflow is the first thing to read, and a version that is not in it is
the answer.

Two corollaries, both from the same hunt. **`label-content-name-mismatch`
compares the name against the PAINTED text, and `aria-hidden` does not exempt a
string from it** — correctly, since a speech-input user says what they can see.
So the repo's draw-short/announce-long rule (`REUSABLE-PATTERNS.md` §3) only
holds while the long name CONTAINS the short label; announcing more is fine,
announcing something else is not. And **two adjacent spans with no text node
between them paint one word**: `<span>All</span><span>24</span>` is `All24`, so
a name of `All — 24 panels` cannot contain it. The rail's own comment described
that exact concatenation and fixed the *reading* with an em dash, which is what
created the mismatch.

Trap: **`npx tsc --noEmit` typechecks nothing here** — the root `tsconfig.json`
is solution-style (`"files": []` + project references), so it has no root files
and always exits 0. Always use `npx tsc -b`.

Trap: **Tailwind v4 does not fail the build on a stale utility class.** It exits
0 and emits no CSS, so the element silently inherits. When retiring a class,
migrate every call site first and only then remove it from the theme, with a
grep as the gate.

**And it is not only STALE classes — an arbitrary value or a container name
can emit nothing too, having never existed.** Three in one session, all exit
0, no warning: `w-[6ch]` (the field rendered at the browser's default, and
widening it from `5.5ch` changed not one pixel — *twice*), `@container/more`
(so a `@2xl/more:grid-cols-2` beside it queried a container that did not
exist and matched at **no width at all**), and `@3xl:max-w-5xl` on a dialog
that is not inside any container, which therefore shipped 512px wide while
reporting success.

**The tell is always the same: a tweak to a number has no effect.** When
changing a value does nothing, stop changing it and ask whether the class is
in the output — `grep '<the class>' dist/assets/*.css`, which is two seconds
and ends the guessing. Note the corollary for container queries specifically:
the query rule DOES get emitted (`@container more (width>=42rem){…}`), so
finding your breakpoint in the CSS proves nothing — it is the `container-name`
*declaration* that is missing, and a query against a container that does not
exist never matches and never says so.

Trap: **read a gate's PREDICATE before believing its noun.** `clipped`
reported *"37px shown of 39px (5 chars)"* on a field whose value is five
characters, which reads as a width — and `findOverflowingFields` measures
**`scrollHeight` against `clientHeight`**. It was a HEIGHT: the display step's
1.15 line-height needs a 37px line box inside a 37px content box. Three
guesses went into widening something that was too short, one of which was the
`w-[6ch]` above, so the two traps compounded. The gates in this repo are
terse on purpose; `scripts/` is where they say what they actually test.

Trap: **`a ?? b ? c : d` parses as `(a ?? b) ? c : d`.** `??` binds tighter
than the conditional, so the obvious one-liner for a per-option tone
(`o.tone ?? tone === 'brand' ? 'mauve' : tone`) resolves every TONED row to
mauve: `o.tone` is a truthy string, so the ternary's condition is satisfied
and the first arm wins. It produces a *plausible* colour, which is the family
`cat()`'s silent mauve fallback already belongs to — no type, no gate and no
screenshot of a single theme can see it. Name the intermediate value.

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

Trap (fixed, COD-294): **the first load after any new build served the
PREVIOUS build**, everywhere — `vite preview`, dev, and production. The worker
skip-waits and claims the page, but the document has already fetched its bundle
from the old precache, and the injected `registerSW.js` is three statements that
register and nothing else. So load 1 was stale and load 2 was current, once per
release, for every user. Measured with two real builds and one manual reload:
**before, 1 navigation and the document ended on build A; after, 2 navigations
and build B.** `main.tsx` now reloads once on `controllerchange`, guarded by
`lib/swUpdate.ts` — and the guard that matters is that **an update arriving
mid-sign-in is skipped**, because reloading over `#access_token=…` throws the
fragment away before `detectSessionInUrl` persists the session, which looks
exactly like COD-290/COD-293 and would have been blamed on them. The entry
below is what this trap used to say; it is kept because the manual reset is
still the way to clear a worker you have already poisoned, and because it is
the clearest example in this file of a workaround that should have been a fix.

Trap: **`vite preview` serves a stale bundle through its service worker.** A
screenshot can show pre-change markup against a freshly built `dist/`. Before
believing what you see:
`navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))`
then clear `caches` and reload.

**And reload twice.** Unregistering does not evict the worker already
controlling the open page — it keeps control through the very navigation meant
to replace it, so the first reload after the unregister is still served by it.
Verified while checking COD-290: the page ran `index-DfwUZGbn.js` while `dist/`
held `index-CMBntfQy.js`, and the fix under test looked like it had done
nothing. **Compare the served bundle hash against your own `dist/index.html`**
(`grep -o 'assets/index-[^"]*\.js'` on each) before believing a screenshot in
either direction — the failure mode here is not a missed bug, it is reverting a
change that works.

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
`useHideOnScroll`, so the phone's *only* navigation slid away on scroll-down (no longer: the bar stays put since 2026-10-29, `BottomNav.tsx`) —
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

Trap: **`MasonryGrid` in a column narrower than its threshold silently does
nothing**, and the class list cannot tell you. It breaks on its *container*, and
**the thresholds have since moved up to 64/96/120rem** — so the number to beat
for a second column is now **1024px**, not the 768px this entry was written
about. Gym's first packing pass measured a 722px review zone against the old
768 and packed nothing (`open` moved 4.7 to 4.6); Pickleball's rail panel
measures **870px at a 1440 viewport** — a 1180px shell minus a 13rem rail and a
2rem gap — and so drew one column for seven cards, **1561px**, while reading
`@min-[64rem]:columns-2` and looking correct. It only ever worked at 1920, where
that panel is 1350px. Use `CardGrid` when the column width is decided by the
page split rather than by the card; it asks about the viewport, and a rail takes
its 13rem whatever the window does.

**And it is not only grids — a `sm:` on a FORM ROW is the same bug.** Strength's
set row broke on `sm:`, a viewport query, inside an act column that is **416px**
at a 1440 viewport: `sm` was true, so it drew its seven desktop tracks in 416px
— 308px of fixed track left the picker 108px and each number input a 32px box
for a 30px placeholder, rendering `lb`, `re`, `RP`. The comment above it
asserted the slack "comes out of the picker's 1fr, which has hundreds to spare
at sm", which is the misreading itself: at `sm` the COLUMN is 416px, not the
window. Reported as "reps, RPE, they are not quite visible". The rule: **any
breakpoint inside zone 2 or zone 3 is a container query** — both columns are
sized by the page split and by whether the act is open — and the container goes
on a WRAPPER, because an element cannot query itself. Measured on the swap: Performance's review
zone **1561px → 1022px**, the landing **2.84 → 2.24 desktop screens**, at the
cost of the row pocket masonry exists to avoid (~200px beside the shortest
card). Third page this has bitten, after Stats' habit masonry in a 580px cell,
which is why it is here and not only in `CardGrid.tsx`.

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

Trap: **two charts of one dataset, and the duplicate is the one that is
always on screen.** Recovery's "signature visual" sat above the rail on every
row and drew `urgeTrend.weeks` — the series `UrgeTrendCard` already drew, over
the same eight weeks. Reported as "move it somewhere else, it's a waste of
space"; moving it would have kept the duplication and changed its address. The
question to ask of any always-visible band is **what series does it draw**, and
then grep that series: its only unique signal here was a dot on weeks
containing a reset, which is a marker, not a chart. Deleting it took a
component, a lib module and a test with it.

Trap: **a chart can have an axis nobody can see.** The same card carried
`<YAxis width={30}>` behind `margin={{ left: -24 }}` — the ticks were rendered
and then pushed off the canvas, so the chart had a scale that existed in the
DOM and nowhere else. An outside review asked for "a light y-axis or value
labels" on a card that already had one. A negative margin on a Recharts
container eats the axis gutter first; if an axis is missing, check the margin
before adding the axis.

Trap: **a percentage height on a flex child with no height resolves to
nothing.** `PairedSparkline` sized its bars `height: ${(count / max) * 100}%`
inside `flex flex-col justify-end` columns that had no height of their own, so
**every real bar computed to 0px** while the zero-weeks — which used an
absolute `6px` stub — were the only thing that drew. The chart showed bars
exactly where there was no data. A screenshot cannot show this (it looks like
"sparse data"); counting the DOM can, and the fix is absolute units, which need
no containing block.

Trap: **a test keyed to copy breaks every time the copy moves.**
`NoFap.test.tsx` found its subject with `/^Urge surfing/` on a section's text,
then `/Log an urge or a reset/`, then needed a third edit in the same change
when the card stopped carrying a title at all — three breakages, none of them
about the behaviour under test. Anchor on structure instead: a `role`, an
`aria-label`, a `data-` hook. `container.querySelector('[role="radiogroup"]
[aria-label="What are you logging?"]').closest('section')` survives every
rewording, and if the accessible name goes, that IS a regression worth failing.

Trap: **a tie is not a winner, and a descending sort will pick one anyway.**
"HALT pattern: Lonely most often · 6×" printed directly above `Lonely 6 ·
Tired 6 · Angry 1` — the headline read `rows[0]` and the winner was decided by
the order `HALT_STATES` happens to be declared in. There is no honest
tie-break; the fix is to say there is a tie (`topTied` / `tiedLabel` in
`lib/urge.ts`). Same family as every other overstatement in this file: a figure
claiming more than its sample supports.

Trap: **a progress bar measured against something other than the sentence
beside it.** `streakStats.progressPct` measured from the PREVIOUS milestone —
`(16−14)/(30−14)` = 13% — and was drawn directly under "Next: One month · 14
days to go". A reader seeing 16, 30 and a bar reads 16 of 30. Segment progress
is not a bad idea; it is a bad idea *unlabelled next to a sentence implying the
other one*, and it also jumps backwards to ~0% on the day you REACH a
milestone, which reads as losing progress for gaining it. If a figure and a
sentence share a card, they measure the same thing or one of them says what it
measures.

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

Trap: **`open` is not the page's length, and quoting it against the `shipped`
budget manufactures a fault.** Home Workout reported **9.6 desktop screens
open** and a rail pass was planned on that number alone; decomposed per
section it ships at **2.34**, and the ten screens are an 83-movement catalogue
unfolding from an 80px collapsed card — a catalogue behaving correctly. The
budget in `space-audit` is a *desktop `open`* budget, and a page whose folds
hold a catalogue will blow it by design. **Both columns, always, and name which
one you are quoting.**

The sharper half: that page's real fault was not length at all. It carried
**two navigations** — three peer sections stacked above a Manual holding its
own twelve-row `SectionRail` — and no pixel count can see that. When a page
"feels like a mess", the first measurement is **how many navigations the zone
has**, not how tall it is. A page can be the right length and the wrong shape.

Trap: **a card is for a named item WITH a body; a row is for one without.**
Putting the thirty-one entries of `HOME_SOURCES` on `PanelCard` measured **5.44
desktop screens and 10.95 on a phone** against **2.50 / 4.72** for the list they
replaced — more than twice the page for the same thirty-one facts, because a
source is a link and a publisher and has no body for the card to hold. Two
columns of two-line rows landed at **1.93 / 4.56**, better than either. The same
arithmetic trimmed a per-card link from a bordered footer row to an inline line.
"Use the card everywhere" is not the rule; the rule is that the card earns its
border by having something to put inside it.

Trap: **"the URLs are not working" was thirteen of fifteen rows having no URL
at all.** Reported against both equipment panels. Of the eight rows in
`HOME_EQUIPMENT` exactly one carried a `url`, of the seven in
`PULLUP_EQUIPMENT` exactly one, and **both pinned URLs answered 200**. Nothing
was broken; `{e.url && <a>}` simply rendered nothing fourteen times. **Count how
many rows carry the field before debugging the field's value** — and fix it the
way `lib/video.ts` already says to, by *building* the link from the name rather
than pinning one, because a pinned page rots and a search always lands.

Trap: **count a chip row's lines by row height over its tallest child, and
cross-check against the sum of the widths.** The `top`-value method is already
recorded below as wrong; this is the method that is right, and it found a real
defect the wrong one hid. Pull-ups' Rounds row measured **218px of controls in
a 184px half** — four `px-3` chips, a `w-14` escape input and four 6px gaps —
so it had been wrapping the input onto its own line, the exact shape that file
calls "a broken control rather than an overflow". `dense` plus a `w-10` input
is **170px in 184px**. Arithmetic is the cross-check: `span > box` wraps, and
if a probe says "wraps" while `span < box`, the probe is wrong.

Trap: **a comment that records a measurement goes stale when a neighbour
changes width.** The comment above that Rounds row said "five chips plus the
escape hatch is exactly one row in the act column" and had been false for some
time — it was measured when the card was wider. A pinned geometry comment is
evidence with a date on it that nobody wrote down. **Re-measure the comment
when you touch the card**, and when a comment and the code disagree, find out
which one is lying before trusting either.

Trap: **the control you need has usually already solved it.** `ChipPick` has
carried three separate fields for a shortened chip — a visible `label`, a
`name` for the accessible name and a `hint` for the hover title — since it was
written, with its own comment saying "a shortened label is a shortened *name*
unless it is said somewhere", and **nothing had ever used all three together**.
Drawing `H push` while announcing `Horizontal push` needed no new prop. Read
the component's props before adding one.

Trap: **a dead field is found by grepping the FIELD, not the module.**
`lib/homeProgramming.ts` was imported, rendered and plainly alive, and inside it
`Routine.needs` and `Routine.how` had **no call site at all** — the data said
what to have in the room and how to run the session, and the page rendered
neither. `chapterFor()` was the same, with `Manual.tsx` having retyped its one
line. A module's import does not vouch for its exports: grep each field.

**And the test that proves a link's TARGET exists cannot see that nothing
links.** `InfoTip` takes an `onMore` and renders its "Learn more" only when a
caller passes one; **no caller ever did**, so all 18 `more:` targets in
`lib/cycleHelp.ts` pointed at manual sections nothing reached, for the life of
the component. `cycleHelp.test.ts` was green throughout and was *right* to be —
it asserts every target RESOLVES, which is a statement about the data file and
says nothing about the journey. Same family as "a scan that silently matches
nothing passes", one level up: here the scan matched everything and the thing
being scanned was never used. When a field exists to be passed, test the
**call**, in the view's own test, not the lookup.

**And a field with a reader can still be write-only.** `challengeNotes` had
one — `RuleNote` — so every grep for a dead field came back clean; what the
grep could not see is that the view rendered it for `today` and for **no other
day**, so a note written this morning could never be read back, corrected or
removed on any of the other seventy-four. `lib/demo.ts` had been seeding
fourteen of them across nine days that nothing on the page could show. The
store had always taken a `day` argument, so the capability was there and the
affordance was not. **Grep the reader's ARGUMENTS, not only the field**: a
reader pinned to one value of a key is a reader for one row and a blind spot
for the rest. The symptom to watch for is a grid of N cells where N−1 of them
are inert — count the controls in a zone (`.zone-review button`) and ask what
the other cells are for.

Trap: **a method call on a derived value makes the React Compiler treat that
value's INPUTS as mutable, and the error points anywhere but at your line.**
`phase.label.toLowerCase()` inside a card subtitle — where `phase` is
`phaseOf(day, length, …)` — made the compiler mark **`length`** as
possibly-mutated and refuse to preserve the memoisation of **six** `useMemo`s
a hundred lines ABOVE it. Every message read `This dependency may be modified
later` and pointed at `length` in a dep array; not one pointed at the call.
The same shape killed a three-line attempt to remember the selected day per
month (`picked[ym] ?? …` reads off a state object, twelve errors), and a
`.reduce` over `analysis.lutealLengths` in render (six more). `useCallback`
and `useMemo` do **not** rescue it — memoising the reduce changed nothing.

The rules that come out of it: **interpolate plain values, not method calls**
(`${length ?? 28}` is fine, `${x.label.toLowerCase()}` is not); **do a derived
value's formatting in the child component**, where the parent's memo graph
cannot be tainted; and when `npm run eslint` reports a cluster of "existing
memoization could not be preserved", **bisect by reverting candidate
expressions, not by reading the error locations** — the locations are the
victims. Cost an hour on COD-337.

Trap: **a grid step above the number of cards in the row makes every card
narrower for nothing.** Cycle's review was moved to a container-queried
`StatGrid` and given the usual 2/3/4 ladder; at a 1,326px panel the third step
fired and `This cycle` went **1,107px → 1,169px**, cards 653px → 429px, for an
empty third track — because no group on that page has more than **two** cards
that are not full-width. A column count is a promise about how many cards
there are, not about how wide the panel is. Count the row's non-wide cards
before adding a step, and cap the ladder there. Same arithmetic that moved
`moodphase` out of that page's `patterns` group when it left `drivephase`
alone beside 381px of dead space.

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

Trap: **`cat()` returns mauve for any name it does not know**, so a typo paints
a plausible colour instead of failing. `colors.ts:90` falls back to `CAT.mauve`,
and the palette spells its neutrals `text` / `subtext0` / `overlay0` — `fg-1`
and `fg-2` are **CSS custom properties, not palette keys**. `cat('fg-1')` on the
calendar's day numbers therefore tinted every *unfilled* date mauve, on a page
where mauve means "you trained": the empty days were coloured like the full
ones. Nothing failed, nothing logged, and both gates were right to be quiet —
`check-contrast` reads token values and this *was* a real token, just the wrong
one. Caught only on a screenshot. **A fallback that returns a plausible value
hides its own misuse**; prefer one that throws in development, and when writing
an inline colour check the name against the palette rather than against the
Tailwind class you were thinking of.

**The same mistake one argument over: `onAccent(color)` where `color` is a
TOKEN NAME.** `onAccent` takes a HEX — it parses the colour to pick the better
neutral and pushes it to 4.6 — so `onAccent('mauve')` parses garbage and returns
`#000000` for every fill in every theme. `CalendarSpan` did exactly that on its
date numbers, a paragraph under the comment above, which is the same family:
**3.92:1 on latte's #6c4cf0, 3.19:1 on dawn's #974608**, on every filled heatmap
cell. It went red the day the demo seed first produced a full-strength cell in
the rendered window — "a branch the seed never takes cannot fail", third
instance. When one module exports a helper taking a token and another taking a
hex, the call sites are a typo apart and neither `tsc` nor a static gate can
tell them apart: only a screenshot or an armed per-panel scan can. `npm run
a11y:panels` caught it, which is the argument for arming it.

Trap: **a floor of two is not a floor.** `momentumIndicator` guarded on
`recentVals.length < 2` and then compared that 2-day sample against a 7-day one,
so deleting five days of entries moved Insights' headline mood **5.0 → 6.5 with
an up arrow** and reported three green improvements, every one of them "you
stopped logging the bad days". Measured in the browser: the lapse read
**`8/10 ↑`** where the truth with those days restored is **`4.5/10 ↓`** — not
overstated, *inverted*. It is the `count ? sum / count : 0` trap above, one
level up: not a fabricated zero but a **fabricated improvement**, which is worse
because a zero looks wrong and progress does not. Any figure that compares two
windows needs a coverage floor on **both** sides (half the window, here 4 of 7)
and must return its sample size rather than discard it — `metricMean` threw its
count away, which is precisely how the digest could compare one day against
seven. And state the coverage **as text**: it was in a `title` tooltip the whole
time and lost, because an arrow beats a tooltip and on a phone the tooltip does
not exist at all.

Trap: **silence is not a measurement, and a day that has not happened is not a
rest day.** The month heatmap ran to the end of the month and labelled the
sixteen days still to come as rest days — a claim about days that have not
occurred. They also have to be kept out of any quartile or mean: sixteen future
zeroes drag the thresholds down and repaint a quiet month as a strong one, so
the ramp ends up measuring the calendar rather than the training. Same family as
the lapse bug above. Draw them, date them, and exclude them from the arithmetic.

Trap: **an `sr-only` element carrying a measured class still measures.**
`useHeaderHeight` sums every `.app-header`, and an `sr-only` box is clipped to
roughly a pixel rather than to nothing — so keeping an `sr-only` h1 with that
class on the bar-less views published `--header-h: 10px` where it should have
been `0px`, and the eight sticky offsets that read it all sat 10px low. Keep the
h1 (a page with no h1 cannot be announced); drop the class.

Trap: **`maxWidth: 'max-content'` collapses a grid with no intrinsic content.**
The heatmap table's cells are empty divs, so `max-content` resolved to roughly
nothing and every cell rendered at **8px**. Cap the width arithmetically —
`calc(cols * clamp(...))` — whenever the children have no text to size from.

Trap: **a geometry fix that does not change the layout is not a fix.** The
heatmap was reported as "a lot of empty space, why are you not scaling it to the
sides" and three passes failed in a row: shortening the year strip, capping the
cell size, then removing the cap (which filled the width with 190px tiles).
**All three were still drawing a year's layout with fewer columns.** `DayGrid`
is column-major because a 53-column strip is read left-to-right; a week is a
*row* and a month is a *calendar*, and nothing short of making the layout follow
the range fixes it. When a third tweak to the same number fails, the parameter
is not the problem.

Trap: **ask the deployment what it is before asking the code.** A diagnosis in
`docs/auth/` reasoned from the deployed bundle alone — zero `supabase.co` across
eleven chunks, no sign-in button on the page — and concluded the Vercel env vars
were unset, Vite inlined `undefined`, and Rollup dropped the feature. Both
variables had been set for **124 days**; the alias was simply pinned to a build
that predated the feature. The reasoning fit every observation and was false.
`vercel env ls` and `vercel ls` settle it in two commands, and they are the
first two to run, not the last.

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

**And SCOPE is part of the currency, not only the unit.** Fitness toned its
weekly bars against `fitnessGoalMin` — a target `weeklyActiveMinutes` computes
over *every* activity, lifting and pickleball included — while the card itself
counts the sessions of one mode. On the demo journal that is **578 minutes in
zone 1 against a 123-minute bar two inches below it**: a 4.7x disagreement in
which both figures are correct and only the rows behind them differ, and a red
bar on a perfectly good week. Before judging a figure against a target, check
the target was computed over the same ROWS. The fix has the same shape as the
unit one — the card compares its blocks with each other and names what it
counts, and the target stays beside the number it was set for.

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

Trap (COD-329): **a sticky toggle hides half a page from a gate exactly the way
a tab shell does.** Fitness's Cardio/Sport switch is `useStickyState`, not a URL
parameter, so a probe that clears `bujo.ui.*` and scans seven themes scans the
CARDIO half seven times. The sport half was worse than unscanned: `lib/demo.ts`
seeded no workout whose activity derives mode `sport` (pickleball lives in
`data.pickleball`), so its entire review zone measured **47px — one empty
frame** at every theme and both viewports, for the life of the page. Two
lessons, both already in this file in other clothes: when a gate walks the DOM
ask what is NOT in it (COD-232), and an unseeded domain is a subject no gate is
checking (`data.cycle`, `activity: 'pullups'`). `scripts/a11y-panels.mjs` takes
one `PAGES` entry per sticky-state variant for this reason.

Trap: **jsdom reports a 0px shell, so every component test sees the STACKED
layout.** `PageLayout` decides the split by measuring `.page-shell`'s
`clientWidth`, and `useActColumn` shuts the act when stacked — which is the
measured default, not a bug. So adding the act collapse to a page turns its
existing view tests red on a correct change, and the fix is for the test to
open the strip (and assert `aria-expanded="false"` on the way in, which is the
only coverage that default has outside a browser probe). Reaching for a jsdom
width shim instead would be contorting the app to make a test pass.

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

Trap: **a rail fixes a page once, and the sections re-grow beside it.**
Pull-ups' review zone was a `SectionRail` of six manual chapters with three
peer sections stacked *above* it — the program tracker, the history list and an
"Analytics" heading — so the table of contents was the last thing on the page
and the thing it was meant to replace was back. Measured as shipped at
`?demo=1`: **1885px / 2.09 desktop screens and 3490px / 4.14 on a phone**, of
which the review zone was `859 + 47 + 375 + 385`. Folding the history, the
summary strip, the heatmap and the program into the same rail (eight panels,
one at a time) took it to **1041px / 1.16 screens**, worst panel 1.89. The rule
that keeps it: **a review zone has one navigation in it.** A new section next
to a rail is a new rail row, or it belongs on another page. And the same
measurement is the argument for moving a card OUT of zone 2 — the act column is
the narrow right-hand one (`layout.css` puts `.zone-act` at `grid-column: 2`),
so anything that is read rather than filled in has more room in the review.

Trap: **`SectionRail` defaults to a breakpoint a review column can never
reach.** `railAt` is `'4xl'` (896px) and zone 3 at the 1180 tier is **722px**,
so a rail placed there renders its *phone* chip strip on a 1440 desktop — the
case the `railAt` prop was added for, missed by the call site that needed it.
Pass `railAt="2xl"` **and** match the caller's grid breakpoint
(`@2xl/page:grid-cols-[12rem_minmax(0,1fr)]`); the two disagreeing is worse
than either, because the grid hands the rail a 192px column and the rail fills
it with a horizontal strip. Six chips fit 722px and hid this; eight did not.

Trap: **an accent has no solved foreground — `brand` is the only pair.**
`index.css` defines `--color-brand-wash` and `--color-brand-text` and *nothing
else* of that shape, so `text-teal on bg-teal/15` is the accent-on-wash idiom
applied without the calibration that makes it work: in a light theme the
accents are solved to about 4.6 against the page ground, and a 15% wash of the
accent moves that ground toward the text and spends the whole margin. Measured
on `ChipPick`'s selected chips, composited over the first opaque ancestor:
**latte 4.25 / 3.64 / 4.33 / 4.40** and **dawn 4.54 / 3.81 / 4.59 / 4.70** for
green/yellow/peach/red — seven of ten under 4.5, worst 3.64, and the two tones
that already shipped (`teal`, `peach`) carried it at every call site. Neither
gate can see it: `check-contrast` reads token values and a token over a wash of
itself is not a token, and axe needs a resolvable background. The fix is the
one this file keeps arriving at — **do not bleach the accent, move the
foreground**: the text is `fg-1` and the colour stays in the border and the
fill. After: **6.42 worst of twenty readings.** A colour *ramp* at rest belongs
in the border, which is a graphic at 3:1 rather than text at 4.5 — and measure
it against the border the app already ships rather than against the floor:
`border-line-strong` on a chip is **1.02–1.64** across the five themes, so the
ramp's 1.97–3.81 improves the boundary it was feared to weaken.

Trap: **a browser probe that regex-parses a computed colour is reading
garbage.** Tailwind v4 emits `oklab(0.48592 -0.108732 0.067276 / 0.5)` for
`border-green/50`, and `colour.match(/[\d.]+/g)` on that yields `0.48592` as
"red" and `-0.108732` as "green" — so two full passes of a contrast table were
wrong, once producing four *identical* ratios for four different tones, which
is the tell. Resolve through a 1x1 canvas instead (`fillStyle = colour`,
`getImageData`): the browser parses whatever syntax it is and composites the
alpha over a ground you chose. Same family as the mid-fade blend and the
inline-style theme trap — an arithmetically perfect number describing a pairing
that exists nowhere in the app.

Trap: **a shorter item centred in a flex row is not a second line.** A probe
counting distinct child `top` values reported the duration chip row as wrapped
at 1440 and not wrapped at 390 — the wrong way round, which is what should have
given it away. The escape input is `py-1` against the chips' taller box, so
`items-center` puts it 2.2px lower and it sits on the same line. Count rows
from the row box's own height over its tallest child. The real wrap, when it
came, was visible as arithmetic: a 211px chip row in a 209px fieldset.

Trap: **the seed can miss a whole activity, and the page filtering for it
cannot fail.** `views/Pullups.tsx` filters `workouts` on
`activity === 'pullups'`; `lib/demo.ts` drew from
`['run','strength','yoga','walk','cycle']`, so that filter matched **nothing**
and the history list rendered its empty frame at 47px, the summary strip read
`0 · 0 · 0` and the heatmap drew 84 blank cells — at five themes and two
viewports, on every `npm run a11y` run, for the life of the page. Sibling of
the unseeded `data.cycle`. Two corollaries worth copying: write the seeded rows
through the **same helper the form writes** (`setLines`), or a hand-typed
`'Pull-up 4x5'` stores fine, counts as zero reps and gives you a history of
sessions worth nothing; and **check what group the seeded numbers land in** —
topping out at a best set of 5 put the demo in Novice, whose training set is
`1`, so the calculator opened on "1 rep/set · Ladder 1 · Pyramid 1", which
reads as broken rather than as beginner.

Trap (COD-328): **a seeded generator is a shared resource, and taking from it
in a new place rewrites everything downstream.** `lib/demo.ts` draws every
domain from ONE deterministic stream, so four extra `rand()` calls added inside
the pickleball loop shifted every number drawn after it: `cycleSnapshot.test.ts`
went red on a coverline that moved **97.41 → 97.42** — a temperature fixture
failing because of a pickleball change, with nothing in the diff to connect
them. Derive new seeded fields from something already in hand (the loop index,
a value already drawn) rather than from a fresh `rand()`, and if you must draw,
expect every snapshot fixture after that point to move.

Trap: **a seed has to cover the WINDOW the card reads, not merely the field.**
`lib/demo.ts` wrote `foodLog` on the most recent **four** days, with a comment
explaining that ninety would imply every day was chip-logged — a good argument
for a number that was still wrong, because `topFoods` reads **fourteen**. So
Nutrition's "What it was made of" card had a third of its window and rendered
as a stub on the one journal anybody ever looks at. "The most recent few" is
not a window; grep what the card actually asks for.

**And the same seed had gone dead in a second way**: `demoFoodLog` looked six
names up in `FOODS` and dropped the misses, so when the library was rewritten
from 48 foods to 103, three of them (`Chicken breast`, `Dal`, `Roti`) silently
became nothing. The seed kept running, every gate stayed green, and the only
symptom was a card with two rows in it. **A lookup that silently finds nothing
passes** — the same shape as the tripwire whose regex stopped matching, and the
fix is the same: assert the COUNT (`demoFoods.test.ts`), because a name that
resolves to nothing leaves no trace to assert on. Watch for the test that does
not catch it either: asserting "every name in the log is in `FOODS`" passes
trivially, since a dropped name never reaches the log.

Trap: **demo data is persisted, not regenerated.** Editing `src/lib/demo.ts`
changes nothing for an existing journal — re-seed via Settings → Data → Load
demo data.

Trap: **a tripwire's regex literals can silently stop matching.** Two carriers
dropped out of `egress.contract.test.ts`'s `SENDS` assertion while the data they
described was byte-identical, and the test stayed green because a pattern that
matches nothing contributes nothing. **Root cause was never isolated**, which is
precisely why the fix is structural rather than a one-line correction: build the
patterns from `String.raw` strings compiled with `new RegExp`, and **assert each
pattern against a known-positive sample** in the same file. A pattern that stops
matching then fails as itself, loudly, instead of as a quiet zero. The general
rule, and the reason all three of this repo's contract tests were armed against
a planted violation before being trusted: **a scan that silently matches nothing
passes.** `csp.contract.test.ts` has an explicit assertion for exactly that
(`the source glob matched nothing`), and it is not paranoia — it is the failure
mode that ships.

Trap: **`button:has-text("…")` is a substring match, and the row count hides
it.** A probe verifying that a coach session loads clicked a *different* button
whose label happened to contain `Load `, and reported the feature broken. The
expensive half is the assertion that was about to be written: **the number of
rows**, which would have passed either way, because the wrong button also adds
rows. Scope a browser-probe click to an exact label (`/^Load \d+$/`) and
**assert on the value, not on the shape of the result** — the exercise names
appearing, not the inputs going from 4 to 34.

Trap: **Vite loads `.env.local` for vitest, so `isConfigured()` differs between
this machine and CI.** Supabase is configured locally and not in CI, so a test
asserting `isConfigured() === false` is green on one and red on the other, in
either direction depending on which you wrote it against. Assert the
**relationship** — a client is built iff configured, the call never throws, the
result is memoised — never either answer. Same family as the preview-port traps
above: the test was right about the code and wrong about the environment it
would run in.

Trap: **for "login works but the UI is blank", read the redirect chain before
reading the source.** COD-290 through COD-296 was one sentence of report with
six causes, and **the one that mattered was in the OAuth error query string the
whole time** (`error_description=Unable+to+exchange+external+code` — a wrong
provider client secret, a dashboard field no code change can reach). Five code
PRs shipped first, each fixing something genuinely broken: identity in one
component's `useState`, a stale service worker, a client built too late for
`detectSessionInUrl`, an un-allow-listed redirect origin, a CSP with no
`supabase.co`. That is exactly why none of them being the cause was not obvious.
Driving the real browser and reading the network panel found it in **sixty
seconds**. Corollary: **`redirectTo` is a request, not an instruction** — Supabase
substitutes the Site URL when the origin is not allow-listed and returns 302 as
if nothing happened, so measure it by sending one and reading the `Location`
header back.

Trap: **a deny-list of storage keys cannot be kept in step with the keys.**
"Erase everything" walked a hand-written list of 23 and therefore left behind the
sync passphrase, **the Supabase session** (so the device was erased and still
signed in), the passcode salt, the onboarding flags and **every photo** in the
`bujo-images` IndexedDB. Nothing failed; the dialog said it was done. Sweep by
**prefix** (`bujo:`, `bujo.ui.`, `sb-`) and keep an explicit short *allow*-list
of what survives, which is the direction that stays correct as the key space
grows. Two corollaries worth copying: delete the IndexedDB databases with a
timeout race, because `deleteDatabase` blocks silently forever on a held
connection and hangs the dialog; and **return a report of what was actually
removed**, since "we tried" and "it is gone" are different claims.

Trap: **`vercel.json` headers do not apply to `vite preview`, so every gate runs
without the CSP.** Three shipped features were dead **in production only** —
Google Drive sign-in (`accounts.google.com/gsi/client` against `script-src
'self'`), and both food-lookup providers (absent from `connect-src`) — and a CSP
failure is uniquely quiet: the request never leaves, the console note is easy to
miss, and the feature simply does nothing. Neither the type checker nor any
browser gate can see it. `csp.contract.test.ts` now asserts that every absolute
host named in a file that *fetches* is allowed or is listed in `NOT_FETCHED`
with a reason — scoped to files that already fetch, because the repo is full of
citation links and an `<a href>` is not egress.

Trap: **retiring a destination leaves hand-written id lists behind, and only a
gate sees them.** `?view=account` became a 301 into Settings, and
`scripts/view-ids.mjs` still listed `account` — caught by the repo's own
`viewChrome` test, which reads a list a type cannot. Same family as the retired
`BottomNav` `PRIMARY` list. And when you add a *query* to a gate's destination,
check how the gate parses it: `['Settings · appearance', 'settings&tab=feel']`
folded the tab into the view id, `goOrDie` reads only the `view` parameter, and
four of twelve a11y shards went red. The fix is a third `query` element **plus
an assertion that the tab actually stuck** — otherwise the gate silently scans
the default panel five times and reports five themes.

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
