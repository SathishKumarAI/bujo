# STATUS

**Stopped:** 2026-08-24. **BUJO-278, BUJO-280 (half) and BUJO-281 (all three
increments) shipped** — **five PRs, all merged. Zero open PRs, zero stale
branches.**

## Start here next session

`docs/QUESTIONS.md` still has **Q3 (deploy)** and **Q4 (shadcn depth)**. Then:

| # | Task | Ticket |
|---|---|---|
| 1 | **The remaining 20 views.** By size: Gym (709), Pickleball (633), then Monthly, Goals, Mindset, Reading | — |
| 2 | **1yr heatmap still leaves 432px.** Needs a stretching cell in `DayGrid`, which has three callers | BUJO-280b |
| 3 | **The same correlation prints twice on Insights**, 300px apart — found by opening the fold | BUJO-283 |
| 4 | **Stats is now the cluster's only cabinet** — six folds, and it absorbed nine panels. It is the next Insights | — |
| 5 | Answer Q3 and Q4 | — |
| 6 | Print fix · `smoke-views.mjs` misses `program`/`nutrition` · `weeklyRadar` mixes hours with 0–10 | BUJO-270/277/282 |

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
- **`npm run smoke` cannot run on Windows without `CHROME_PATH`.** Its default
  is `/usr/bin/google-chrome-stable`. Use
  `CHROME_PATH=$(node -e "const{chromium}=require('playwright');console.log(chromium.executablePath())")`.
  It then passes 22/23 — `account` fails on `ERR_NAME_NOT_RESOLVED` because
  there is no DNS to Supabase here. Environmental, not a regression.
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
