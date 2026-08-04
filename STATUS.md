# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-04

## Where I stopped — `chore/real-data-pass`

Seven commits off `feat/ia-routing`, **not pushed**. The job was the thing
every prior pass skipped: **look at it with data in it.**

`npx tsc -b` 0, **738 tests / 50 files**, `npx eslint .` 0 errors / 2
pre-existing warnings, `npm run build` clean, **`npm run a11y` 0 serious across
80 scans** (5 themes x 16 surfaces, every fold open).

### The real-data walk found four defects, all invisible on a fresh journal

Demo data loaded through Settings → Data, then every surface walked at 1440
and 390, plus both layouts.

1. **The week strip encoded nothing.** Seven fixed-height blocks tinted from a
   three-bucket colour scale, so any week whose days land in one bucket drew
   seven identical bars — and on a real journal that is most weeks. Height
   carries the score now, colour stays as the redundant cue.
2. **The habit close-out called a slip a success.** For an `avoid` habit a
   tick means you slipped; the Evening checklist struck it through with a ✓.
   The demo has no avoid habits, so this needed two to be added by hand before
   it could be seen. **Worth repeating: the demo data does not cover `avoid`,
   `count` or `timer` habits well. Add them before trusting a habit sweep.**
3. **The footer count did not reconcile** — "5 of 8" under ten rows.
4. **Achievements were a wall of ellipses** — "First w…", "Centur…", "Unbro…".

Also: no horizontal overflow on any of 18 views at 390px with real data, which
settles the brief's last mobile item empirically rather than by argument.

### The a11y gate runs all five themes, every fold open — and it is clean

"Only mocha was checked" had sat in this file for several sessions, which is
the tell that a manual step never happens. The gate loops the themes now and
**asserts the root attribute actually changed** before believing a result.

It found 15 serious violations on the first run. All fixed. **80 scans, 0
serious.** Two halves to the fix, and the second matters more:

- **The palette.** The light accents were too light to read at body size even
  on plain white (`#e8710a` on `#ffffff` = 3.08:1). Darkened to values solved
  by `scripts/solve-contrast.mjs`. vscode's greys went the other way.
  **Yellow is deliberately untouched** — it never failed, and yellow at 4.5:1
  on white is not darker yellow, it is brown.
- **Point of use.** `readableOn` / `onAccent` / `over` in `lib/colors` derive a
  text colour from the background it actually lands on; `Pill` uses them. This
  is the fix the `Pill` doc predicted — "a one-file fix when I1 is decided" —
  and it decides I1. Darkening accents far enough to fix this in the palette
  alone would also darken every chart fill, and a non-text graphic only needs
  3:1.

Two things that will bite again: the threshold is **4.6, not 4.5** because
`toHex` rounds each channel; and `onAccent` cannot just pick the better of a
theme's two neutrals, because dawn's yellow beats both.

**Never hand-roll a contrast check to shortcut this.** One written during this
session reported ~50 failures per theme, every one an artefact of reading
`rgba(r, g, b, 0.08)` tints as opaque. axe composites the stack. Use axe.

### Every fold is open by default now

Requested. 18 `defaultCollapsed` call sites dropped, and the three collapse
primitives default to open. Still collapsible — the fold is a choice you make,
not the state you are handed.

**Opening them exposed three bugs that had been hiding.** CLAUDE.md already
documents the trap ("`npm run a11y` cannot scan inside a collapsed fold ... a
critical `select-name` violation shipped for months this way") and it was still
true, three times over: an unnamed `<select>` in Collections, `VideoLink`
rendering a nameless anchor when `ProgramTracker` passes `label=""`, and the
plate badges' hardcoded `text-crust` at 2.02:1 on yellow.

The lesson is not "remember to open folds before running the gate" — that is
what the old note said and it did not work. **A default-collapsed card is a
place bugs go to survive.**

### The archive is done

Eight orphaned lib functions moved to `archive/src/lib/*.txt`, commented out,
each with a note on what supersedes it. Tests 757 -> 738; the 19 that went only
pinned archived code.

**The list was 13 and is 8** — five had callers *inside their own module*,
which the first sweep missed by excluding the defining file. Any future run of
that check has to include it. Removing them stranded three more things reachable
only from the code that left (`rollingAverage`, an `Entry` import, a `task()`
fixture).

---

## Where I stopped — `feat/ia-routing`

Six commits off `feat/activity-registry`, **not pushed, no PR**. The third
redesign pass: information architecture and routing. Base it on
`feat/activity-registry` (#100) when you open the PR, not on `main`.

Verifies green: `npx tsc -b` 0, `npx vitest run` **755 tests / 50 files**,
`npx eslint .` 0 errors / 2 pre-existing warnings, `npm run build` clean,
`npm run a11y` **0 serious across 15 surfaces**.

Browser pass done at 1440 and 390, mocha, on both layouts.

### Both layouts ship — `settings.layout`

This was asked for mid-pass and is the load-bearing decision of the branch.
`focused` (default) is the five-section rail plus the split Today; `classic`
is the seventeen-destination rail plus the one-page Today. Settings → Journal
feel → Layout. **They share their cards** (`src/views/today/cards.tsx`), so
the fixes below landed in both and neither can drift into being the stale one.

One key covers both the rail and Today deliberately: the two changes answer
the same complaint from opposite ends, and someone who wants the old rail
back almost certainly wants the old Today with it. Split it if that proves
wrong.

### What changed

| Area | What |
|---|---|
| Routing | `writeDeepLink` pushes history; `onRouteChange` listens for `popstate`; day chevrons and rail rows are real anchors |
| Nav | Five sections (`components/shell/sections.ts`), views inside them are tabs; no group headers; `BottomNav` renders the rail straight through |
| Today | Morning / Day / Evening surfaces, `?surface=` for the override |
| Fields | `SegmentScale` (11 dots, `—` for unset) replaced `Slider`, which is deleted; sleep is a half-hour stepper |
| Copy | Zero ⓘ on Today; "Training penalty" → "Make-up work"; three writing prompts → one rotating |
| Gate | `scripts/a11y-axe.mjs` navigates by link *and* button, walks `[section, tab]` pairs, waits on `getAnimations()` |

### Things worth knowing before you touch this

- **Strength tools had no door.** `gym` is a full view — exercise picker,
  program tracker, plate calculator, muscle map, progress photos — and was
  reachable only from a link inside Fitness that renders when the mode is
  `strength`. It was never in `NAV`, so it had also never been scanned by the
  a11y gate. It is a Body tab now, and `sections.test.ts` asserts every view
  in `VIEW_CHROME` has a section or is an explicitly exempt preference page.
- **The a11y gate had silently stopped navigating.** Its selector was
  `nav button, aside button`; the rail rows became `<a>`. Every click matched
  nothing, and the render-length assert does not catch it because Today
  renders plenty of text — twelve views would have been scored as Today and
  reported clean. This is the third variant of the same failure this gate has
  had. Assume the selector is wrong after any nav change.
- **The gate was also measuring mid-animation.** Insights "failed" contrast at
  `#797d91`, a colour in no theme — `fg-2` composited at ~0.68 opacity because
  the fixed 500ms wait was not always enough on a loaded machine. It waits on
  `document.getAnimations()` now. It produced a false failure this time; the
  same artefact hides real ones just as easily, which is the worse direction.
- **`Tabs` was the wrong primitive** and the brief asked for it. Radix `Tabs`
  implements the ARIA tabs pattern, where a trigger owns a `tabpanel` in the
  same document. These tabs are separate pages, so it emitted `aria-controls`
  naming a panel that never renders — `axe` critical. The tab row is a `<nav>`
  of links with `aria-current="page"` instead. If someone "fixes" it back to
  `Tabs`, that violation returns.
- **`TodayHabits` was reading the wall clock, not the cursor.** It hardcoded
  `todayISO()` while the rest of the page took the day from the route, so on
  any day but today it showed the wrong day's habits. Fixed as part of the
  split; would have been a real bug in classic too.
- **`h-auto!` in the tab row is load-bearing** — was, before the primitive was
  dropped; the same shape will recur. The vendored `TabsList` ships
  `group-data-[orientation=horizontal]/tabs:h-9`, which beats a plain
  `h-auto`, so 44px triggers overflowed a 36px box and `overflow-x-auto`
  computed `overflow-y` to `auto`, drawing a vertical scrollbar on a row of
  five tabs.

### The "what else is missing?" audit

Run mechanically after Pickleball turned up, because the same mistake had
already been made twice and eyeballing it is what let it through.

**Four checks, and only one real finding.**

1. *Views with no section* — now a test (`sections.test.ts`). Clean.
2. *Components nothing imports* — `resizable` and `scroll-area`, both
   unused vendored shadcn files. Harmless.
3. *Store actions with no UI caller* — `renameHabit` (superseded by
   `updateHabit(id, {name})`, which the habit editor uses) and
   `removeBodyMetric`. Neither is a missing feature.
4. *Exported lib functions with no consumer* — 13 hits, and **they are
   duplicates of things already on screen, not features waiting to ship**:

   | Orphan | Already shipped as |
   |---|---|
   | `taskAging` | `overdueBuckets`, in Plan's aging histogram |
   | `migrationAnalytics` | `migrationCounts`, Plan's "chronically deferred" |
   | `trainingHeatmap` | Fitness's `CalendarHeatmap`, 12 weeks |
   | `recoveryState` | `RecoveryMap` in Strength tools, per-muscle |
   | `categoryRollup` | `CategoryConsistencyCard` in Trackers |
   | `habitWeekdayPerformance` | `bestWeekday` in Trackers |
   | `cardioBadges` | deliberately removed — it returned `null` until you had earned a badge, so it was invisible to exactly the people it was meant to motivate |

   Plus `strengthBand`, `dayCoverage`, `focusStressCorrelation`,
   `periodTrend`, `bodyweightSeries`, `activeDayStreak`.

   **They are worth deleting, and that is not done.** Left alone on purpose:
   it is ~13 functions plus their tests, some may be someone's in-flight
   work, and this branch is already eight commits deep. The risk of leaving
   them is that the next audit re-flags them and someone wires up a second
   aging histogram next to the first.

So: no features were missing beyond Pickleball. What the audit actually
found is that **this repo's failure mode is a page losing its door, not a
feature never being built** — three times now (Strength tools, Pickleball,
and `pickleball/Section.tsx` recorded as dead code when its only importer
was simply unreachable). The orphan test covers views. Nothing covers a card
that renders only behind a condition nobody meets, which is how Strength
tools hid.

### Not done

1. **Not pushed, no PR.** And the `#96 → #99 → #100` order below is unchanged
   and still blocking — this branch sits on top of all of it.
2. **44px is met for what this pass touched, not app-wide.** Habit pills,
   segment dots, count steppers, rail rows, section tabs, bottom tabs and the
   surface switcher are all ≥44. The top bar's six icon buttons are 28px and
   `Segmented` is 31px at its default size in ~30 other call sites. Both
   predate this pass; both need a visual decision, not a sweep.
4. **A journal with real data was not used.** Everything above was verified on
   a fresh journal, so the long-list and dense-day cases are unproven — in
   particular the sticky capture box on the Day surface, which cannot be seen
   working until the log is taller than the viewport.
5. **The sticky capture is sticky-top, not a sticky footer** as the brief
   asked. The bottom of a phone screen already holds `BottomNav`, so a footer
   capture would sit on top of it. It pins under the header instead.
6. **Insights has no horizontal-scroll wrapper under 640px yet** — the brief's
   last mobile item. Nothing was observed overflowing on the pages checked,
   but it was not tested with real chart data, which is when it would.

---

## Previously — `feat/activity-registry`

**`feat/activity-registry`** — 15 commits, PR #100 against
`feat/collapsible-header-ux` (PR #99). **`origin/main` is merged in** as of
`1aedf67`; the branch is 0 behind main. **Not pushed** — the merge commit is
local only, so PR #100 still shows the pre-merge branch.

### Read this before touching the stack

The merge was done **against the advice this file gave last session**, on
request. Two consequences, both live:

1. **#96 is still open, so the double-resolution it warned about is now
   likely.** `feat/today-ux` (#96) touches `ui.tsx`, `App.tsx` and `Today.tsx`
   — the three files that cost the most to resolve here. When #96 lands on
   main, this branch merges main again and re-resolves them.
2. **PR #100's diff is now 131 files.** Its base, `feat/collapsible-header-ux`,
   is still **76 behind main**, so the PR now reads as if this branch authored
   all of main's 76 commits. It is not reviewable in that state. Before
   pushing, either merge main into #99 first, or retarget #100 to `main`.

Remaining order is unchanged: **#96 → #99 → #100**.

### The merge — how ~110 conflict hunks across 38 files were resolved

Both sides had restructured the same views: main brought the layout redesign
(#95, capture-first Today + column grid) and the token/icon system (#94), this
branch brought the activity registry and the Body-cluster page contract.

The rule, decided in-session: **main wins page-level layout, this branch wins
the content inside, shared primitives take both.**

- **`ui.tsx` / `CollapsibleSection` — union, not a pick.** This branch's
  `hideInfo`, header-folds-the-card and animated `.caret-turn` kept; main's
  per-card accessible names (`Collapse Today's habits`, not `Collapse`),
  `CARD.headerButton` and the `<h2>` wrapper kept. Neither side's `Card`
  survived alone.
- **`TopBar` / `Sidebar`** — this branch's nine-controls-to-five reduction
  stands. The doc comment arguing it survived the merge as context, which is
  what settled it.
- **`App.tsx` NAV** — activity registry wins; Pull-ups / Home workout /
  Pickleball stay presets inside Fitness, not nav peers.
- **Today, Plan, Coaching, Collections, Settings, Pickleball** — main's
  `<Page>` shell and `CardGrid`. Where that meant taking main's file whole,
  this branch's a11y work was re-applied by hand: Coaching kept its
  `aria-expanded` and the `surface1` contrast fix, which main did not have.
- **NoFap kept this branch's file** — main's only change there was the icon
  migration this branch had already done, plus the `<Page>` wrapper.
- **Recovery's help prose from main is gone on purpose.** This branch retired
  the ⓘ in that cluster, so the text would have been unreachable.
- **`FitnessHub.tsx` and `pickleball/Section.tsx` restored from main** on
  request, after this branch had deleted both. **Nothing imports either — they
  are dead code until something wires them up.**

Verifies green after the merge: `npx tsc -b` 0, `npx eslint .` 0 errors / 2
pre-existing warnings, **743 tests / 48 files**, `npm run build` clean.
Today, Plan, Fitness and Recovery checked in the browser at 1440, no console
errors. **`npm run a11y` was NOT re-run after the merge** — it was 0 serious
across 10 views before it, and the merge changed folds and card headers, which
is exactly what that gate cannot see through when closed.

Verifies green: `npx tsc -b` 0, `npx eslint .` 0 errors / 2 pre-existing
warnings, **743 tests / 48 files**, `npm run build` clean, `npm run a11y` 0
serious across 10 views.

**Browser pass done** on Fitness, Nutrition, Recovery and Coaching at 1440 and
760, light and dark. Seven defects found and fixed across `9d88835` and
`15fec09` — labels sitting *beside* their controls wherever the act column
exceeded the 380px cap; the ⓘ popover surviving the Stage 6 sweep on 22 cards
(`Card` draws it from `help ?? subtitle`, so grepping `help=` proved nothing);
Recovery missing from the a11y gate and failing on contrast the moment it was
added; the Recovery sparkline drawing 2px bars at zero data; and `BottomNav`
silently down to three tabs on phones because its id list still named two
retired destinations.

Not seen: the other three themes, and a journal with real data in it.

**A dev server on 5191 was serving `.claude/worktrees/today-ux`, not this
branch** — the documented trap, live. It was killed and 5191 restarted from
this worktree. Restart the today-ux one if you still want it.

### What this branch did — the Body cluster on a page contract

| Commit | What |
|---|---|
| `7d40f8b` | Activity registry (`src/domain/activities.ts`), schema-3 migration, distance-unit fix |
| `0876b53` | Retired the book spine (`.book::before`) |
| `1a60ee6` | Page-contract primitives in `src/components/page/` |
| `41f7469` | Fitness rebuilt on three zones; tab row collapsed to four; Nutrition promoted to a route |
| `4cd00c7` | Nutrition, Recovery, Coaching onto the contract |
| `df728f4` | Sweep — folds, help icons, card chrome, a11y gate widened |
| `9d88835` | Browser-pass fixes — label stacking, shared `NumField`, mode-aware placeholder |
| `1aedf67` | Merge `origin/main` — the layout redesign and icon system, reconciled |

Load-bearing decisions:

- **Mode is never stored.** Derived via `modeOf(session.activity)`. The registry
  owns which fields render, which stat headlines, and all mode copy
  (`MODE_COPY`). There is nowhere left to write a mode conditional for field
  visibility, so that bug class is structurally gone rather than patched.
- **Three modes.** `sport` was added late — a game is bounded by a scoreboard,
  not a distance, so Pickleball asks for duration alone.
- **Distance is canonical km**, converted only at `lib/units.ts`. v2 wrote the
  *display* unit into `distanceKm`, so half the readers divided by 1.60934 and
  half printed it raw — the same 3.1 showed as "3.1 mi" and "1.9 mi" on one
  screen.
- **Container queries, not media queries** (`styles/layout.css`), one breakpoint
  at 960px of *container* width, because the sidebar collapses. Above it the
  split is 62/38 with review LEFT and act RIGHT, placed explicitly against DOM
  order so a phone still gets the log form first.
- **Sticky is measured, not declared.** `PageLayout` falls back to static when
  the act column is taller than the viewport.

### Next

1. **Unblock PR #100 before pushing** — merge main into `feat/collapsible-header-ux`,
   or retarget #100 to `main`. Right now its diff is 131 files (see above).
2. **Fix the legacy activity deep link.** `?view=pullups` resolves the view but
   drops the activity — you land on Fitness / Cardio / Run instead of Strength /
   Pull-ups. `deepLink.ts` returns `{view:'fitness', activity:'pullups'}`
   correctly; the loss is downstream, because `Fitness` is a `lazy()` chunk and
   `writeDeepLink` rewrites the URL to `?view=fitness` before it mounts and
   reads it. The documented form `?view=fitness&activity=pullups` works.
   **Predates the merge** — same `lazy()` line on `f5af2cd`.
3. **Re-run `npm run a11y` with the new and changed folds open.** Not run since
   the merge.
4. **Look at a journal with real data, and the latte / neon / vscode / dawn
   themes.** The browser pass used a fresh journal in mocha and latte only.
2. **Recovery still exceeds the two-raised-card cap.** Its remaining cards are
   genuine objects with their own actions (urge log, reset log, per-addiction
   streaks, commitment, trigger plans), so the cap and the "cards are objects"
   rule pull against each other there. Needs a judgement call.
4. **Recovery deviates from the brief on purpose** — the brief wanted a sleep +
   soreness sparkline, assuming physical recovery; this app's Recovery is the
   abstinence tracker and has no soreness field anywhere. Built urges-vs-resets
   instead. Physical recovery as its own page is a data-model change.
5. **`Workout.sets` is still a required `string[]`**, not the optional field the
   brief's target shape had. Cardio writes `[]`. Changing it breaks
   `HomeWorkout` and the CSV export.
6. **Re-seed demo data** to see corrected distances and activity labels.
7. Merge #96, then merge `main` into #99 and #100 in that order and resolve.

### Traps this branch hit

- **The schema-3 distance conversion is not idempotent.** It is gated on the
  stored version; running it twice multiplies by 1.61 again. There is a test
  that migrates three times and asserts the value never moves. Any future
  data-shape migration in `migrate()` needs the same treatment or the same gate.
- **`npm run a11y` serves `dist` through `vite preview`** — rebuild before
  believing a result. A contrast fix looked like it had failed until the bundle
  was rebuilt.
- **Folds hide violations from axe, again.** Adding Coaching to the scan list
  immediately surfaced a `crust`-on-`surface1` contrast failure that had been
  invisible only because the list lived inside a collapsed card.
- **A typed field is a better audit than a grep.** Making `Workout.activity` an
  `ActivityKey` found every free-form writer in one `tsc -b`, including one in
  `CaptureBar` that the Stage 0 audit had missed.
- `quartileLevels` shipped with `floor(q·n)` instead of `ceil(q·n)−1`, putting
  the top cut on the maximum so level 4 was unreachable. Caught by its own test.

---

## Previously — `feat/collapsible-header-ux`

9 commits, branched off `feat/icon-button-stage1` (PR #94), **not pushed, no PR
open**. If you push it, base the PR on `feat/icon-button-stage1`, not `main`, or
the diff shows six other branches' commits.

### What that branch did — the fold (§K)

`docs/COLLAPSE-PATTERN.md` is the full record; decisions are D-42/43/44. Short
version:

- **The whole header folds a card**, not just an 18px caret. The caret stays a
  real `<button>` with `aria-expanded` — still the accessible control; the header
  click is a pointer convenience on top. 42 cards and 30 sections inherit it.
- **One caret rotates**; two glyphs no longer swap. Bodies fade in on open.
  Close is deliberately instant — the body unmounts while closed and the
  collapsed-by-default cards carry real weight.
- **Four section primitives became two.** `pickleball/Section` and Settings'
  `Disclosure` deleted; they plus five open-coded inline sections moved onto
  `CollapsibleSection` / `QuietSection`.
- **Two cards had dead titles** — `PenaltyCard` and Gym's "Today's session" both
  hand-rolled a caret into `right` rather than using `Card collapsible`.
- **Plan stopped reserving an empty column.** "Chronically deferred" is
  conditional, so the unconditional two-column masonry left ~800px empty for
  most journals. Setup lost its fold and became an always-open footer with
  eight one-tap rule suggestions.
- **Demo data now has a migration history**, so "Chronically deferred" is
  actually visible in the demo.

### Its next steps (still open)

1. **Push it and open the PR** against `feat/icon-button-stage1`.
2. **Merge the stack bottom-up.** Seven deep now — the biggest risk on the board.
3. **`graphify hook-rebuild` is refusing to write** — the new graph has 1782
   nodes against a stored 1784 (deleting `pickleball/Section.tsx` shrank it), so
   it wants `force=true`. Left alone because it overwrites tracked state.
4. **Per-view container tiers** — the one Stage 5 item left.
5. **B4** — the app chunk is still 658 kB (193 gzip); recharts at 429 kB is the
   next lever.
6. **§H redesign decisions** — H5, H6, H7, H9, H11, H13 still open.
7. **B1/G1/G2** — the Supabase project returns NXDOMAIN, so every account and
   cloud-sync feature is dead until it is repointed or the env vars unset.

### Traps that branch hit, so you don't

- **`npm run a11y` cannot see inside a closed fold.** Unhiding Plan's Setup
  exposed a *critical* `select-name` violation that had been shipping for
  months — axe scans the rendered page, and collapsed content is not on it.
  Read every clean report as "clean for whatever was expanded".
- **`vite preview` serves a stale bundle through its service worker.** Twice a
  screenshot showed pre-change markup against a freshly built `dist/`.
  Unregister the worker and clear caches before believing what you see.
- **A dev server pinned to a worktree keeps serving that worktree's branch.**
  Six stale `vite` processes were running on 5173–5176, 5180 and 5191; the one
  on 5191 served `.claude/worktrees/today-ux` at `feat/today-ux`, so changes
  made here could never appear in the tab pointed at it. All six killed. Check
  which port and which worktree before concluding a change did not land.
- **An audit keyed on how something is drawn misses anything drawn another way.**
  Six folds using typographic `▸ ▾ ▴` matched neither the caret-icon grep nor
  the `aria-expanded` grep, and survived a sweep that claimed to be complete.
- **Demo data is persisted, not regenerated.** Changing `src/lib/demo.ts` does
  nothing for an existing journal — re-seed via Settings → Data → Load demo data.
- **`.caret-turn` is unlayered CSS and beats `@layer utilities`.** A Tailwind
  `transition-*` on the same element silently never runs, and `npm run design`
  does not catch it.

Older traps that still hold — theme flips not invalidating inherited custom
properties, regex renames rewriting prose, `.claude/worktrees/` carrying other
sessions' checkouts, verifying UI in all five themes — are in the git history of
this file (`913f8df`).

**Read next:** `TASKS.md` (the board, §K is this branch) ·
`docs/COLLAPSE-PATTERN.md` (the fold) · `docs/ICON-BUTTON-SYSTEM.md` (the pass
this grew out of) · `docs/ACCESSIBILITY.md` (the rules and the gate's blind spot).
