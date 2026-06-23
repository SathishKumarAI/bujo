# Prompt — Generate a feature backlog, then build the top N (multi-agent)

> Use when you want a large, ranked feature backlog AND the best few built +
> shipped in one pass. This is the playbook that produced
> `docs/FEATURE-BACKLOG-500.md` (572 features) + PR #48 (top 10 built).
> Requires explicit opt-in to multi-agent orchestration (a Workflow).

## Role

You are the orchestrator. You drive two background Workflows and verify their
output yourself — you do NOT trust agent self-reports; you re-run the gates.

## Context

<app>
Read `CLAUDE.md` + `docs/ARCHITECTURE.md`. `bujo` = local-first React 19 / Vite /
TS / Tailwind PWA. Pure logic in `src/lib/*.ts` with co-located `*.test.ts`
(vitest). Views in `src/views/`. State via `useJournal()` (`src/store.tsx`).
Colors via `cat()` (`src/lib/colors.ts`). Catppuccin Mocha. No backend.
</app>

<scope>
{{How many features to GENERATE (default ~500) and how many to BUILD (default
top 10). Confirm with the user before firing — it spawns dozens of agents.}}
</scope>

## Steps

1. **Scout first (inline, cheap).** List `src/views`, `src/lib`, `src/components`;
   read `package.json` scripts + key types. Feed this real surface to the
   generators so ideas are grounded, not generic.
2. **Generation Workflow** — ~10 category agents, each generating ~55 ideas with
   a JSON schema `{title, desc, value 1-5, effort S/M/L, risk low/med/high}`.
   `parallel()` (barrier — need all to dedup). Dedup by normalized title in JS.
   Rank: value desc → effort S<M<L → risk low<med<high. A final selector agent
   picks the **top N buildable-now** (low-risk, additive, unit-testable) with a
   concrete `plan` naming likely `src/lib`/`src/views` files.
3. **Write the doc** — `docs/FEATURE-BACKLOG-500.md`: category counts, top-N
   table (why + plan), then full backlog grouped by category. Append a pointer
   line to `docs/FEATURES.md` (append-only — never overwrite).
4. **Verify the plans** before building — grep that every referenced
   function/type actually exists; note ones that don't (e.g. `sonner` is an
   unmounted scaffold here — use `MilestoneToast` pattern instead).
5. **Build Workflow** — partition the N features into agents by **disjoint file
   ownership** (no two agents touch the same file; push overlapping helpers into
   new `lib/*.ts` files). `parallel()`, schema-validated summaries. Each agent:
   reads before editing, reuses existing helpers, adds `*.test.ts`, runs its own
   vitest.
6. **Verify yourself** (the real gate): `npx tsc -b` → 0; `npx vitest run` → all
   pass; `npx eslint <touched files>` → clean (repo has pre-existing debt
   elsewhere, so lint only the files you touched); `npm run build` → OK.
   Confirm `git status` shows exactly the expected disjoint file set.
7. **Ship** — one feature commit + the doc commit, branch + PR to `main`
   (see `templates/prompts/commit-and-pr.md`). Then `/document`.

## Guardrails

- MUST get explicit user opt-in before launching a Workflow (it is billable and
  spawns many agents). Confirm generate-count + build-count.
- MUST partition build agents by disjoint files — overlapping edits in one
  worktree corrupt each other. New shared helpers go in NEW lib files.
- MUST re-run tsc / vitest / eslint / build yourself; agent "all green" is a
  claim, not proof.
- MUST keep changes additive + back-compat (optional params, no broken exports,
  forward-compatible `migrate()`).
- MUST NOT add a backend, new deps, or network calls.
- MUST append (not overwrite) docs; convert relative dates to absolute.

## Output

`docs/FEATURE-BACKLOG-500.md` (ranked), top-N built behind green
tsc/vitest/eslint/build, a PR to `main`, and a `docs/WORKLOG.md` entry.

## Why this works

Fan-out generation beats one-shot (diverse category lenses, no self-anchoring).
Schema-forced output = parseable, no scraping. Disjoint-file partitioning makes
parallel builds conflict-free. Orchestrator-side verification catches the ~10%
of agent claims that are optimistic. See `docs/WORKLOG.md` 2026-06-22 for the
run this codifies.
