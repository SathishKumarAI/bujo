# Pipeline — verify, commit, deploy in one command

Two layers automate the test → build → deploy → commit flow so a future session
ships with one command instead of a dozen (and burns far fewer tokens).

## 1. `scripts/ship.sh` — the one-command dev pipeline

Runs the full quality gate, then optionally commits, pushes, builds, deploys to
the single Vercel **bujo** project, and re-aliases `bujo-journal.vercel.app`.

```bash
scripts/ship.sh -m "feat: thing"     # verify → commit → push → deploy prod → alias
scripts/ship.sh --verify             # gates only (tsc + soft eslint + tests)
scripts/ship.sh -m "msg" --no-deploy # verify → commit → push (skip Vercel)
scripts/ship.sh --deploy-only        # build + deploy prod + alias (no git)
scripts/ship.sh -m "msg" --preview   # deploy a preview URL instead of prod
scripts/ship.sh --no-tests           # skip vitest (doc-only changes)
```

What each step does:

| Step | Command | Hard gate? |
|---|---|---|
| Typecheck | `tsc -b` | ✅ aborts on failure |
| Lint | `eslint .` | ⚠ soft — repo carries pre-existing debt; reported, not fatal |
| Tests | `vitest run` (219) | ✅ |
| Build | `vercel build --prod` | ✅ + warns if Supabase env isn't inlined (login would break) |
| Commit/push | `git add -A && commit && push` (only with `-m`) | — |
| Deploy | `vercel deploy --prebuilt --prod` | ✅ |
| Re-alias | `vercel alias set <url> bujo-journal.vercel.app` | ✅ |

**Why a prebuilt prod deploy:** the Vercel project isn't Git-connected, and the
`VITE_SUPABASE_*` keys live in the Production env (the anon key is public by
design). Building locally with `--prod` inlines them, so the deployed app has a
working login. The build step warns if they're missing.

## 2. `.github/workflows/ci.yml` — automated tests on every PR, branch and `main`

Runs typecheck + soft lint + tests + build on every pull request and every push,
`main` included. `main` used to be excluded because `deploy.yml` ran the same
gate there; that workflow was retired in D-49, so the exclusion went with it —
otherwise `main` would be the one branch with no gate. So: CI proves green on
the way in; `ship.sh` ships to Vercel.

## Typical loop for a future session

```bash
# 1. make changes …
scripts/ship.sh --verify              # fast check while iterating
# 2. when happy:
scripts/ship.sh -m "feat(x): …"       # ships to prod end-to-end
```
