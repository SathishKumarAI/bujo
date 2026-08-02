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
