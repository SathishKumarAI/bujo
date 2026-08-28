# STATUS

**Stopped:** 2026-08-27. **Pickleball · COD-12** on `feat/pickleball-design`,
three commits, branched off `bionic/pickleball-data-first-completed`.

The session started from a six-stage prompt to build the Pickleball page.
**Stages 0–5 were already shipped** and in better shape than the prompt
described: Pickleball is a peer tab with its own route, its own
`PickleballSession` record and a 700-line `src/lib/pickleball.ts`, which is the
prompt's "Option A" resolved long ago. Read `src/components/shell/sections.ts`
lines 28–45 before re-litigating that — it is argued there. **Three real gaps
remained**, and those are what shipped:

| # | Gap | Fix |
|---|---|---|
| 1 | Heatmap was a local `grid grid-flow-col` div stack scaled **linearly** against the busiest day, so one tournament Saturday flattened every ordinary session to the lightest step | Renders through `CalendarHeatmap` — quartile buckets, real `<table>`, focusable scroll region |
| 2 | **Three** always-open log forms, each ending in a wide tonal button | DUPR and events behind a ghost `+` in their card headers; `Log session` is the only wide control left |
| 3 | No Pickleball states in `/kitchen-sink` | Empty, typical, overflow (52 weeks + a partner name that has to truncate) |

Two smaller bugs fell out of #1: the subtitle divided the week count by 7 and
read **"Last 1.857 weeks"**, and a JSX text node printed a literal `$`.

**Verification is a script, not a screenshot:**
`scratchpad/verify-pickleball.mjs` drives the preview build through Playwright —
18 checks, all passing, including an **axe pass with both `+` forms open**. That
last one matters: `npm run a11y` walks the rendered page, so a form behind a
shut `+` is a region the gate now cannot reach. Two of its first-run "PASS"
lines were **false passes on a page that never rendered** — a fresh profile
needs `bujo:onboarded` *and* `settings.storageMode`, or the app sits on the
onboarding gate and every "absent" assertion trivially holds.

**Previous entry, still true:**

**Stopped:** 2026-08-24. **BUJO-278, BUJO-280 (half) and BUJO-281 (all three
increments) shipped** — **six PRs (#136–#142), all merged. Zero open PRs.**

**Correction to the previous revision of this file:** it said "zero stale
branches" and that has not been true for some time. Counted rather than
inherited: **64 local branches already merged into `main`**, **21 local branches
never merged**, and **33 remote branches** besides `main`. None are from this
session — every branch opened here was merged and deleted — but the claim was
being copied forward each handoff without anyone running `git branch --merged`.
The 64 merged ones are safe to delete; the 21 unmerged ones need a look before
anything happens to them, so **neither set was touched.** Same failure as the
audits below: a number repeated instead of measured.

## Start here next session

`docs/QUESTIONS.md` still has **Q3 (deploy)** and **Q4 (shadcn depth)**. Then:

| # | Task | Ticket |
|---|---|---|
| 1 | **The remaining 20 views.** By size: Gym (709), Pickleball (633), then Monthly, Goals, Mindset, Reading | — |
| 2 | **1yr heatmap still leaves 432px.** Needs a stretching cell in `DayGrid` — still **3 direct callers** (`ActivityLayout`, `Heatmap`, `CalendarHeatmap`; counted, not inherited). What changed is downstream: `CalendarHeatmap` now has a third product call site, and Pickleball's 3mo/6mo/**1yr** toggle is exactly the width that strands | BUJO-280b |
| 3 | **The same correlation prints twice on Insights**, 300px apart — found by opening the fold | BUJO-283 |
| 4 | **Stats is now the cluster's only cabinet** — six folds, and it absorbed nine panels. It is the next Insights | — |
| 5 | Answer Q3 and Q4 | — |
| 6 | Print fix · `weeklyRadar` mixes hours with 0–10 | BUJO-270/282 |

~~`smoke-views.mjs` misses `program`/`nutrition`~~ — fixed, COD-19. The id list
moved to `scripts/view-ids.mjs` and `viewChrome.test.ts` now fails if it drifts
from `VIEW_CHROME` again.

**Today is still deliberately untouched.** See BUJO-264, unchanged.

## What shipped

| PR | What | Evidence |
|---|---|---|
| **#136** | `StatTile.color` is a type error without an `icon` | 45 dead call sites across 8 files, deleted |
| **#137** | The Activity card sizes to its heatmap range; `SPAN_ALL` deleted | dead width 978→378 · 796→196 |
| **#138** | Tag manager → Settings → Data, and the BUJO-281 decision | rendered-page check |
| **#139** | Nine analytics panels → Stats | **all nine byte-identical** |
| **#141** | Pickleball digest deleted, Correlations opened | 0 folds, 530→249 lines |

**Insights is done.** 6 folds → **0**, 530 → **249 lines**, 1,300px at 1440 —
one screen and a bit with nothing hidden. Stats holds the record; Insights
answers what changed and what to do next. The decision and its rejected
alternative are in `docs/redesign/17-insights-ia.md`.

## The one thing this session was really about

**Three separate audits had counted a prop instead of a pixel.** They are the
same bug wearing three faces:

| Audit said | Measurement said |
|---|---|
| "9 accents on Trackers" | 3 of them were `color` with no `icon` — **props, never drawn** |
| "16 Cards against a cap of 2" on Insights | every one already `background: transparent, radius 0, borders 0/0/2px/0` — **`CARD.band` IS a heading and a hairline** |
| `help=` sweep found the Body cluster clean | `Card` renders its ⓘ from `help ?? subtitle` (already in `CLAUDE.md`) |

Each was written down confidently, and each was wrong in the same direction —
**source greps over-count features that render as nothing.** BUJO-278 now makes
its case impossible: `StatTile`'s props are a union, so `color` without `icon`
is a *type error* rather than an invisible one. `npx tsc -b` found all 45 sites;
no grep could have told a live tint from a dead one.

**The rule, third time earned: grep the output, not the input.** Computed styles
from the running page take one script and settle it.

## The check that paid for itself immediately

Moving nine panels between two views, each panel's rendered HTML was dumped from
Insights on the parent commit and from Stats on the child, then diffed. **All
nine byte-identical.**

That was not ceremony. The first draft of `SplitCol` silently dropped its two
accent icons while looking like a faithful copy — the same shape as the
extracted banner that once replaced an office phone number with 911. The diff
caught it before it was committed. Do this for every move; "it is the same
markup" is the claim this repo keeps being wrong about.

## Traps added or confirmed

- **`gh pr merge --delete-branch` permanently closes any PR stacked on it.**
  #140 targeted #139's branch; merging #139 deleted that branch, GitHub closed
  #140, and it **cannot be reopened** — "Cannot change the base branch of a
  closed pull request". Had to re-create it as #141. **Retarget the child to
  `main` *before* merging the parent**, not after.
- ~~**`npm run smoke` cannot run on Windows without `CHROME_PATH`.**~~ **Fixed,
  COD-19.** It runs everywhere with no environment variable now, and it is
  green: `BUJO_URL=http://localhost:5199 node scripts/smoke-views.mjs` →
  **25/25, exit 0**. Both halves of "nobody runs it" were here — a hardcoded
  `/usr/bin/google-chrome-stable` that killed it at launch, and an `account`
  failure on `ERR_NAME_NOT_RESOLVED` that this file twice called
  "environmental, not a regression" rather than fixing. **That phrase, written
  down twice, was the tell.** A gate known to exit non-zero is a gate whose red
  carries no information, and a documented manual workaround is one nobody
  types. Third-party reachability is not what "does every view render" means, so
  the gate now discriminates on the resource's ORIGIN rather than on the
  message — a `Failed to load resource` against `/assets/…` still fails it,
  which was checked by aborting a real chunk, not assumed.
- **`[aria-expanded]` counted over the whole document includes nav chrome.**
  Insights reported "4 folds" with zero folds on the page. Scope the query to
  `<main>`.
- **`SPAN_ALL` and `SPAN_2` were identical below 1536px** — `CardGrid` only has
  two columns there, so `2xl:col-span-3` did nothing at the 1,180px tier every
  converted page renders at. `SPAN_ALL` is deleted; do not reintroduce a helper
  whose name claims more than its classes do.
- **`npm run design`'s file count moves on its own** (272 → 275 across this
  session as files were added). Do not quote it as a stable number — same
  disease as the vitest count already documented in `CLAUDE.md`.

Everything in `CLAUDE.md` still applies, including the worktree/port,
service-worker and collapsed-fold traps.

## Still open, unchanged

- **F-7** four sync writers can be live at once — a product call, not a defect.
- **F-8** sync passphrase in plaintext `localStorage` — a product call.
- **SQLite exporter** not built; its precondition is met.
- The two hand-maintained datasets worth retiring (Open Food Facts,
  free-exercise-db) — unchanged, and `fitness.test.ts` must be extended
  *before* the exercise swap.
- **Deploy: there is none, on purpose.** Unchanged. See D-49 and QUESTIONS Q3.

## Environment

- Dev server **:5173**, preview **:4173**, both this working copy (checked via
  `Get-CimInstance Win32_Process`). :5174 is a second dev server on this repo.
- Demo data is persisted, not regenerated — re-seed via Settings → **Data** tab
  (a tab, not a fold) → Load demo data.
- Playwright scripts run from the scratchpad need
  `createRequire('file:///…/bujo/package.json')` — module resolution is relative
  to the script, not the cwd.
