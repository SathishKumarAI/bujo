## Branch workflow

Default to a branch per unit of work — do not commit onto whatever branch
happens to be checked out.

1. **Branch first.** `git checkout -b <type>/<short-slug>` off the branch the
   work builds on (not always `main` — if it extends an open PR, branch off
   that PR's branch so the stack stays in order). Types match the commit
   prefixes: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`.
2. **Commit in logical chunks**, not one blob. One concern per commit, with a
   body explaining *why*, including anything surprising found on the way.
3. **Verify before pushing:** `npx tsc -b` (NOT `--noEmit`, see below), then
   `npx vitest run`, `npx eslint .`, `npm run build`. For UI work, also open the
   app and check the affected views.
4. **Push and open a PR** with `gh pr create --base <parent-branch>`. State what
   is *not* in the PR as well as what is.
5. **Write `STATUS.md` when you stop**, not when you start.

Trap: **`npx tsc --noEmit` typechecks nothing here** — the root `tsconfig.json`
is solution-style (`"files": []` + project references), so it has no root files
and always exits 0. Always use `npx tsc -b`.

Trap: **Tailwind v4 does not fail the build on a stale utility class.** It exits
0 and emits no CSS, so the element silently inherits. When retiring a class,
migrate every call site first and only then remove it from the theme, with a
grep as the gate.

Trap: **`npm run a11y` cannot scan inside a collapsed fold.** axe walks the
rendered page, so anything behind a closed section is simply not checked — a
critical `select-name` violation shipped for months this way. Re-run the gate
with new or changed folds **open**, and read a clean report as "clean for
whatever was expanded".

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

Trap: **`scripts/a11y-axe.mjs` visits a fixed `VIEWS` list.** A page not on it is
not checked, and "0 serious" means only "for the pages that were opened". Add new
surfaces. Do not argue a page is unreachable from the code's shape — Recovery was
excluded on the belief it was behind an opt-in, but `nofapEnabled` defaults to
true, and adding it immediately failed on a contrast bug.

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

<!-- plane-agent-rules:v1 -->
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
   about to do. Search the board by `repo:bujo` first. Duplicates are worse
   than nothing because they split the history of a decision.
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

Plane does not replace `STATUS.md`. `STATUS.md` is re-entry context — where you
stopped, the next action, the traps. Plane is the queue. Both, in the same commit
as the work.
