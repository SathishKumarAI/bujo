# STATUS

**Stopped:** 2026-08-24. **Phase 0, Phase A and the first half of Phase B
shipped.** All merged. **Zero open PRs, zero stale branches** — the repo is
clean for the first time in this sequence.

## Start here next session

Read **`docs/redesign/16-next-session.md`** first. `docs/QUESTIONS.md` holds the
two decisions that still matter — Q3 (deploy) and Q4 (shadcn depth). **Q6 was
answered by measurement, not by choosing.**

| # | Task | Command / file | Blocks |
|---|---|---|---|
| 1 | **Phase B, second half** — `Trackers.tsx` onto `PageLayout`. Slot table first. This is the one that visibly changes the page | BUJO-254/255 | Phase C |
| 2 | **BUJO-278** — `StatTile`'s `color` prop is a no-op without an `icon`. Audit **every** call site passing `color` and no icon; some of them think they are showing a status signal | — | — |
| 3 | Answer Q3 (does "spin up" mean localhost or a public URL) and Q4 (how far to push shadcn) | `docs/QUESTIONS.md` | Phase E |
| 4 | Fix print (white-on-white). Small, self-contained | BUJO-270, Traps below | — |
| 5 | `smoke-views.mjs` never tests `program` or `nutrition` | BUJO-277 | — |

**Before starting task 1, re-read what Phase B part 1 found** (below). The page's
accent count, its card count and two of its four "defects" were all wrong in the
same direction: measured off source or off a bad screenshot rather than off the
running page.

## What changed this session

**The Modernist chain landed — all twelve.** #127 and #113–#123, plus #107,
#128, **#129** (Phase A) and **#130** (Phase B part 1). **#96 is closed** (3.4k
lines, conflicted three weeks, superseded by Phase E). Fifteen branches deleted.

**Phase B part 1 — two visible defects fixed, and three findings worth more.**

A wrapped metadata badge started at the name cell's left edge (**x=137**) while
the habit name it describes starts at **x=158**, so `2/7wk` under Sugar sat
outdented from its own row and level with the gap above the next one — it read
as the *next* habit's number. Fixed with `pl-7` on the cell and `-ml-7` on its
first child, so wrapped lines indent to the name and rows that already fit do
not move: nine of eleven rows stayed at 32px.

The fourth stat tile read `10 +1🚫` — three quantities where its siblings each
carry one. `StatTile` gained a `hint` slot rather than the call site forking.

**Three of the four accents on that page were never drawn.** `StatTile`'s
`color` prop tints its `icon`, and `TrackerSummaryCard` passes no icon — so
`mauve`, `peach` and `sapphire` were no-ops, and so was the green/yellow/peach
threshold on "today done" that was meant to be a real status signal. **The
audited "9 accents on Trackers" counted a prop, not a pixel.** Same shape as the
`help ?? subtitle` trap already in `CLAUDE.md`. BUJO-278 and BUJO-279 filed.

**Two of my own tickets were withdrawn.** BUJO-274 (dead space beside the
heatmap) and BUJO-275 (a gap above the table) were misread off a screenshot
taken **through the onboarding overlay**. Everything on the page ends at
x≈1310 and the band beyond it is the page gutter, identical on every row.

**Phase A shipped with evidence, and it overturned two written assumptions.**
The eight-tab ceiling was a count nobody had measured — 9 tabs report
`scrollWidth === clientWidth` at 1280/1440/1920, so the planned *Train*/*Body*
rail split was dropped. And `BottomNav` needed no change at all, because #120
had already deleted the hand-written `PRIMARY` list the audit was worried about.

Gates, quoted: `npx tsc -b` exit 0 · `npx vitest run` 798 passed (55 files) ·
`npx eslint .` 0 errors, 2 pre-existing warnings · `npm run build` emitted ·
`npm run design` passed (273 files) · `npm run clipped` clean across 23 views at
1440 and 390 · `npm run a11y` **no serious or critical violations**, five themes
× two viewports, with Stats included for the first time.

**Twelve PRs, one conflicting file.** Across the whole chain the only conflict
was `STATUS.md` — this file — and only because each merge rewrites it. **No code
conflict anywhere.** The "the stack is scary" framing was one doc.

**They are fully stacked**, each PR targeting its parent's branch, so each needs
`gh pr edit <n> --base main` as its parent lands. Auto-merge is disabled on this
repo, so each also has to wait for CI (~5 min) before `gh pr merge` will take it.

Four new documents:

| File | What |
|---|---|
| `docs/redesign/14-dashboard-inspiration.md` | The ShadcnStore reference, and the nine patterns **not** to copy |
| `docs/redesign/15-fitness-consolidation.md` | The six-phase plan, and two corrections to the record |
| `docs/redesign/16-next-session.md` | The handoff |
| `docs/QUESTIONS.md` | Ten open decisions with recommendations |

Plus `docs/TICKETS.md` Epic **FIT-IA**, BUJO-245..272, and a correction banner on
`docs/redesign/13-page-contract-rollout.md`.

## The two things this repo believed that were not true

**1. The rollout was never blocked.** `13-page-contract-rollout.md:85` and this
file's previous revision both said `PageLayout` and every page primitive lived
only inside PRs #113–#123, so Phase 2 had nothing to import. All eleven files in
`src/components/page/` have been on `main` throughout, and Fitness, Plan,
Nutrition, NoFap and KitchenSink import them there. What the chain actually
carries is the Modernist *look* — bands, radius 0, shell and nav.

One command disproves it:

```
git ls-tree -r --name-only origin/main -- src/components/page
```

**2. Merging the chain does not do the redesign.** Today, Insights, Stats and
Trackers have **zero** `components/page` imports on the chain tip. It restyles
them 34–58 lines each and restructures none of them. The conversion is owed
either way; merging first was about conflict order — #120–#122 edit
`sections.ts`, #117 edits all four target views.

**The lesson, now BUJO-272:** an adoption count is evidence about the branch it
was taken on and nothing else. The previous session's own last trap — *judge a
UI on the right branch* — existed, was written down, and still did not prevent
this, because it was aimed at screenshots and the failure came through a grep.

## The fitness question, answered

**Body is already the fitness hub.** `src/components/shell/sections.ts` files
Fitness, Strength, Pickleball, Coaching and Nutrition under it, with Program and
Challenges arriving in #122 and Recovery/Cycle gated.

The genuinely misfiled thing is **Trackers** — 1013 lines, the largest view in
the app, filed under *Insights* while being where gym attendance, protein and
steps actually get logged. That splits the daily loop across two rail sections.
It is a move, not a rebuild — Phase A, BUJO-250.

**Consequence to decide:** moving it makes Body ten tabs against a recorded
ceiling of eight. QUESTIONS Q6 recommends splitting the rail into *Train* and
*Body* rather than nesting — nesting is how Pickleball got buried once already,
and `sections.ts`'s own docstring says that redirect "did not move the page, it
deleted it".

## Two hand-maintained datasets worth retiring

Both replace a list in this repo, both are keyless, neither adds a dependency,
and both stay **enrichment-only** so the app still works offline.

| Source | License | Replaces |
|---|---|---|
| Open Food Facts search + barcode | ODbL, no key, CORS-enabled | `src/lib/foods.ts` — 50 typed-out items whose own header admits it sends you to a web search for anything else |
| free-exercise-db | Unlicense (public domain) | `EXERCISE_LIBRARY`, `src/lib/fitness.ts:100` |

Rejected with reasons, so it is not relitigated: **wger** needs a self-hosted
Django backend this local-first PWA deliberately lacks; **Nutritionix / Edamam /
USDA FoodData Central** all require an API key, and a key in a client-side PWA
is a published key; **any charting library** undoes the accent discipline.

`fitness.test.ts` must be extended *before* the exercise swap —
`musclesForExercise` feeds the muscle map and is what breaks silently.

## shadcn is already installed

`components.json` plus 17 primitives in `src/components/ui/` (button, dialog,
command, popover, tabs, tooltip, scroll-area, switch, toggle-group, sonner…).
"Use shadcn" is therefore not an adoption decision but a question of how far —
see QUESTIONS Q4. The recommendation is to add only the primitives the rebuilt
pages need (`card`, `badge`, `table`, `select`) rather than migrating the
hand-rolled `ui.tsx`, because a repo-wide primitive sweep is exactly the change
that silently alters content.

## Deploy: there is none, on purpose

Unchanged, and #127 (merged) retires the workflow. Pages ran 8 times and failed
8 times — it was never enabled, and it could not serve this app anyway:
`api/sync.ts` and `api/feedback.ts` are serverless functions, and Pages cannot
set the CSP/HSTS/XFO/COOP headers. `vercel.json` and `api/` are kept for that
reason. **The Environments tab lies** — `actions/deploy-pages` registers the
deployment before calling the API, so the record predates the failure by 30
seconds. There has never been a site behind it. See D-49, and QUESTIONS Q3.

## Still open, unchanged

- **F-7** four sync writers can be live at once — a product call, not a defect.
- **F-8** sync passphrase in plaintext `localStorage` — a product call.
- **SQLite exporter** not built; its precondition is met.
- **PR #96** (+2620/−767) conflicted since 2026-08-03, superseded by Phase E.

## Traps

Everything in `CLAUDE.md` still applies. Added or re-confirmed this session:

- **`:5173` was not this working copy.** The dev server for this branch came up
  on **`:5174`** because something else already held 5173. Check the port's
  process command line before treating a screenshot as evidence — this is the
  worktree trap, and it fired on the first command of the session.
- **`gh pr merge` reads a cached mergeability state.** Immediately after a push
  it still reports "Pull Request has merge conflicts". Wait for GitHub to
  recompute rather than concluding the resolution failed.
- **Auto-merge is disabled on this repo** — `enablePullRequestAutoMerge` errors
  with "Auto merge is not allowed for this repository". Every merge must wait on
  CI in the foreground.
- **Merging a stacked PR does not advance `main`** unless you retarget it first.
  Without `gh pr edit <n> --base main` it merges into its parent's branch.
- **Merging main into each branch separately breaks the ancestry**, so the tip
  stops containing its siblings and you cannot shortcut by merging only the last
  one. Merge them in order.

## Environment

- Dev server **:5174**, root repo, branch `docs/page-contract-rollout-plan`.
  Something unidentified holds :5173.
- `.claude/worktrees/` holds three empty orphan dirs — gitignored, safe to leave.
- `chrome-devtools` MCP needs Chrome started with `--remote-debugging-port=9333`.
- Demo data is persisted, not regenerated — re-seed via Settings → Data.
