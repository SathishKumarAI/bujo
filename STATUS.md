# STATUS

**Stopped:** 2026-08-24. Nothing half-built, nothing uncommitted.

## Start here next session

Every open PR is `CLEAN` with CI `SUCCESS` except #96. Nothing is blocked on a
fix — only on a decision to merge.

| # | Task | Command / file | Blocks |
|---|---|---|---|
| 1 | Merge **#127** then **#128**. Both green, both independent, both small | `gh pr merge 127 --merge --delete-branch` | nothing |
| 2 | Merge **#113 → #123** bottom-up, **merge commits, no `--delete-branch`** | `gh pr merge 113 --merge` … through 123 | everything below |
| 3 | Delete the eleven merged branches, *after* step 2 finishes | `git push origin --delete <branch>` | — |
| 4 | Phase 2 of the plan: convert Today, Insights, Stats, Trackers | `docs/redesign/13-page-contract-rollout.md` | needs step 2 |
| 5 | Decide **#96** — conflicted since 2026-08-03, 3.4k lines, largely superseded by the chain in step 2. Probably a close | — | — |
| 6 | Fix print (white-on-white). Small, self-contained | see Traps below | — |

**Step 2 is the bottleneck.** `PageLayout` and every page primitive live in
those eleven PRs; step 4 has nothing to import until they land.

Do **not** start step 4 by writing code. The method's stop gate comes first:
restate the goal, list reuse-vs-create, name the contradictions, then wait.

## What changed this session

**Line 2 is merged.** `main` is at `a023490`. The four silent data-loss defects
and the photo-sync budget are shipped.

| PR | How |
|---|---|
| #124 data-engineer agent + storage decision | squash `96ac275` |
| #125 four data-loss defects | merge commit `ce8ca6c` |
| #126 photos travel with a push | merge commit `a023490` |

Open PRs: **16 at session start → 13 after merging → 15**, once #127 and #128
were opened. The fifteen are #113–#123 (eleven), #96, #107, #127, #128.

## The merge rule this session paid for

**Squash-merging a stacked PR poisons its children.** The squash rewrites the
parent's commits under a new SHA, so the child still carries the originals and
conflicts add/add against them. #125 needed a hand-resolved conflict on two docs
because of it.

**`--delete-branch` while a child PR still targets that branch auto-closes the
child**, and a closed PR can be neither retargeted nor reopened until the base
ref is restored (`git push origin <sha>:refs/heads/<branch>`). #125 had to be
recovered this way. No commits were lost, but it cost twenty minutes.

Merged with plain merge commits and no `--delete-branch`, **#126 needed zero
rebase and zero force-push**. Use that for #113–#123. Delete branches after,
separately.

## Deploy: there is none, on purpose

PR #127 retires `.github/workflows/deploy.yml`. It ran 8 times and **failed 8
times**, always on `Failed to create deployment (status: 404) … Ensure GitHub
Pages has been enabled` — Pages was never switched on. The `build` job passed
every run; only `deploy` died.

**The Environments tab lies.** `github-pages` shows "last deployed 2026-08-02"
because `actions/deploy-pages` registers the deployment *before* calling the
API — that record was written 30 seconds before the run failed. There has never
been a site behind it.

`vercel.json` and `api/` are deliberately kept. Pages could never have served
them: `api/sync.ts` and `api/feedback.ts` are serverless functions, and Pages
cannot set HTTP headers, so the CSP/HSTS/XFO/COOP set would vanish. Deleting
them would break `bujocloud` sync and the feedback button. See D-49.

Also caught: `ci.yml` excluded `main` via `branches-ignore`, because deploy.yml
gated it. Removing deploy.yml alone would have left `main` with no gate at all.
Fixed in #127.

## The UI question, answered with numbers

Full audit in `docs/redesign/13-page-contract-rollout.md`. The short version:

The three-zone contract **already exists** on the Modernist tip — `PageLayout`
with zone1/2/3, container query, measured sticky, plus `StatBar`,
`SummaryStrip`, `EmptyFrame`, `DisclosureRow`. **Four of 28 views use it.**

| Page | `<Card>` | Accents | Cap is 2 cards / 1 accent |
|---|---|---|---|
| Insights | 17 | 6 | |
| Stats | 11 | 5 | |
| Trackers | 3 | 9 | |
| Today | 8 | 3 | |
| **Fitness** (converted) | **0** | **0** | the target |

Every page that reads as "flat stack of cards" is one that never adopted it.
This is a rollout problem, not a design problem.

## Still open, unchanged

- **F-7** four sync writers can be live at once — a product call, not a defect.
- **F-8** sync passphrase in plaintext `localStorage` — a product call.
- **SQLite exporter** (step 7) not built; its precondition is now met.
- **PR #96** (Today UX, +2620/−767) conflicted since 2026-08-03 and largely
  superseded. Probably a close, but 3.4k lines is not the agent's call.
- **Body is eight tabs.** A ninth needs a decision to split the section.

## Traps found this session

- **Squash + stacked PRs + `--delete-branch`** — see the merge rule above. The
  child PR closes itself and the failure reads as a merge conflict.
- **Print emits white-on-white.** `print-color-adjust` is `economy`, so Chrome
  drops the dark surface — which sits on a `div` inside `#root`, not on `body`,
  so the print block's `body { background: #fff }` does nothing. Text keeps
  `rgb(205,214,244)`. Fix by swapping `data-theme` to `latte` on `beforeprint`
  (covers Ctrl+P *and* the Settings button) and giving `ExploreBanner` a
  `no-print` class — it is a `div`, so `header, nav {display:none}` misses it.
- **A killed background task can leave the process alive.** The harness reported
  the :5173 vite server stopped; `Get-NetTCPConnection` showed it still
  listening 40 minutes later. Check the port, not the task status.
- **`git worktree remove` fails on Windows while vite holds the rolldown
  `.node` binary.** Kill the node process whose command line contains the
  worktree path first, then remove.
- **Judge a UI on the right branch.** `main` differs from the Modernist tip by
  **153 files, +5568/−2978** in `src/`. Screenshots of `main` are not evidence
  about a redesign sitting in unmerged PRs.

## Environment

- Dev server :5173, root repo, currently on `main`. Nothing else running.
- `.claude/worktrees/` holds three **empty** orphan dirs — `fix94`, `verify87`,
  `wt94` (2026-08-03). Gitignored (`.gitignore:47`), 0 tracked files, not
  registered with git. Safe to delete, harmless to leave.
- `chrome-devtools` MCP needs Chrome started with `--remote-debugging-port=9333`;
  it does not attach to an already-running Chrome.
- Demo data is persisted, not regenerated — re-seed via Settings → Data.
