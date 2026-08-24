# STATUS

**Stopped:** 2026-08-24. Documents and merges only — **no code was written and
no gate was run this session.**

## Start here next session

Read **`docs/redesign/16-next-session.md`** first, then answer
**`docs/QUESTIONS.md`** — ten decisions, each with a recommendation. Blank
answers mean "take the recommendation"; say so out loud when you do.

| # | Task | Command / file | Blocks |
|---|---|---|---|
| 1 | Confirm the chain finished — #122, #123 were still merging at the stop point | `gh pr list --state open` | task 3 |
| 2 | Answer or default `QUESTIONS.md`. Q1 (#96), Q3 ("spin up"), Q6 (Body's tab count) change what gets built | `docs/QUESTIONS.md` | task 3 |
| 3 | **Phase A** — move Trackers from Insights to Body. ~10 lines, do not touch `Trackers.tsx` | BUJO-250..253 | Phase B |
| 4 | Delete the merged branches — only after #123 lands, and never `--delete-branch` while a child PR still targets one | `git push origin --delete <branch>` | — |
| 5 | Decide **#96** (3.4k lines, conflicted since 2026-08-03, superseded by Phase E) and **#107** (docs, CLEAN) | QUESTIONS Q1, Q2 | — |
| 6 | Fix print (white-on-white). Small, self-contained | BUJO-270, Traps below | — |

## What changed this session

**The Modernist chain is landing.** #127 and #113–#121 merged; #122 and #123
were in flight at the stop point, run by a background script that resolves the
conflict, waits for CI, and merges.

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
