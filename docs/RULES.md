# Change rules — what to update on every PR / push

These are the "if you touch X, you must also update Y" rules. They keep code,
tests, docs, diagrams, and the ticket/prompt log in sync. The PR template
(`.github/pull_request_template.md`) is the checklist; `docs-guard.yml` flags
code-only PRs in CI.

## Always (every change)
- [ ] `npm run build` (tsc + vite) green, `npm run lint` clean **on touched files**, `npm test` green.
- [ ] New branch per change → PR → squash-merge (never commit straight to `main`).
- [ ] After a prod deploy, **re-alias** `bujo-journal.vercel.app` to the new deployment.

## If you change… then also update…

| You changed | Update |
|---|---|
| **A data type** (`src/lib/types.ts`) | `docs/diagrams/uml.mdx` (class diagram), `docs/data-engineering/schema.sql` + `docker/initdb.sql` if it's persisted, and a `migrate()` path if not additive. |
| **The store / a persisted field** | `migrate()` default, `docs/diagrams/uml.mdx` (sync/state), tests for the new action. |
| **A view or shell component** | `docs/diagrams/uml.mdx` (component diagram) if the tree changed. |
| **Sync (serverSync / supabase / github / fscloud)** | `docs/diagrams/uml.mdx` (sequence), `docs/data-engineering/*`, `docs/hosting/*` if endpoints change. |
| **The Docker stack** (`docker-compose.yml`, `docker/*`) | `docs/hosting/*`, `docs/data-engineering/*`, and verify with `docker compose up` (+ a curl check for the API). |
| **A pure lib function** | a `*.test.ts` beside it (table-driven, like `capture.test.ts`). |
| **Anything user-facing** | a one-line ticket in `docs/TICKETS.md` (append to the current epic) and the running `docs/WORKLOG.md` entry. |
| **A whole working session** | append a `docs/sessions/YYYY-MM-DD-prompts.md` prompt dump + a `WORKLOG.md` section. |
| **A new feature inspired by research** | cite the source in the PR body + the prompt dump. |

## Prompts / session log
- Every PR body states **what changed and why**, and (for research-driven work) the **source**.
- The session prompt dump (`docs/sessions/*`) maps each user ask → PR. Update it as part of the documenting pass.

## Enforcement
- `.github/pull_request_template.md` — the checklist appears on every PR.
- `.github/workflows/docs-guard.yml` — warns (non-blocking) when a PR touches `src/` or `docker/` but no `docs/`, `*.test.*`, or `TICKETS.md`. Treat the warning as "did I forget a doc?".
