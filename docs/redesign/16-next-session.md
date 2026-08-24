# 16 · Next session — start here

**Written:** 2026-08-24, at the stop point. **Read this, then `docs/QUESTIONS.md`.**

## Do these three things first, in order

1. **Read `docs/QUESTIONS.md`.** Ten decisions, each with a recommendation.
   Anything left blank, take the recommendation and say so out loud in the first
   response. Q1 (PR #96), Q3 (what "spin up" means) and Q6 (Body's tab count)
   are the three that change what gets built.
2. **Check the chain actually finished.** `gh pr list --state open`. If #122 or
   #123 are still open, finish them before touching `sections.ts` — #120–#122 all
   edit that file and Phase A edits it too.
3. **Check the port before believing any screenshot.** `:5173` was occupied by
   *something else* when this session started; the dev server for this working
   copy came up on **`:5174`**. Confirm with
   `Get-CimInstance Win32_Process | ? CommandLine -match 'vite'` before treating
   a screenshot as evidence about this branch.

## The work, in order

**Phase A — BUJO-250..253.** Move Trackers from Insights to Body in
`src/components/shell/sections.ts`. Label it "Tracking", order it after Fitness.
**Do not touch `Trackers.tsx`.** Then audit every other list that resolves a
view id, and reload `?view=trackers` in the address bar.

Ready-to-paste prompt:

> Move the Trackers view from the Insights section to the Body section in
> `src/components/shell/sections.ts`, placed after Fitness and labelled
> "Tracking". Do not change `Trackers.tsx` itself. Then find every other list
> that resolves a view id — `BottomNav`'s `PRIMARY`, the command palette,
> onboarding, `deepLink` aliases — and confirm none silently drops the moved id.
> Reload `?view=trackers` in the address bar and confirm the Body rail row
> lights. Run `npx tsc -b`, `npx vitest run`, `npx eslint .`, `npm run build`
> and quote the output.

**Phase B — BUJO-254..255.** Trackers on the page contract. Slot table first.
1013 lines → orient / act / review, ≤ 2 raised cards, 1 accent (from 9).

**Then** C (Open Food Facts), D (free-exercise-db), E (Insights, Stats, Today),
F (sweep). Full detail: `docs/redesign/15-fitness-consolidation.md`. Tickets:
`docs/TICKETS.md`, Epic FIT-IA, BUJO-245..272.

## What this session established, in one place

**The rollout was never blocked.** `src/components/page/` — all eleven
primitives — has been on `main` throughout, with Fitness, Plan, Nutrition,
NoFap and KitchenSink importing it there. `13-page-contract-rollout.md:85` and
`STATUS.md:19` both said Phase 2 could not start until #113–#123 landed. One
`git ls-tree -r origin/main -- src/components/page` disproves it.

**Merging the chain does not do the redesign.** The tip has zero
`components/page` imports in Today, Insights, Stats and Trackers. It restyles
them 34–58 lines each. The restructure is owed either way; merging first was
about conflict order.

**Twelve PRs, one conflicting file.** Only `STATUS.md` ever conflicted, and only
because each merge rewrites it. No code conflict anywhere in the chain.

**Body is already the fitness hub.** The genuinely misfiled thing is Trackers —
1013 lines, the largest view in the app, filed under Insights while being where
gym attendance and protein get logged.

**shadcn is already installed** — `components.json` and 17 primitives in
`src/components/ui/`. "Use shadcn" is not an adoption decision, it is a question
of how far to push it. See Q4.

**Two hand-maintained public datasets** are worth retiring: `foods.ts` (50 typed
items, admits its own inadequacy in its header) and `EXERCISE_LIBRARY`
(`fitness.ts:100`). Open Food Facts and free-exercise-db, both keyless, both
without a new dependency, both enrichment-only so offline still works.

## State at the stop point

| | |
|---|---|
| `main` | `3190f53` — #127 and #113–#121 merged |
| In flight | #122, #123 — background script resolves `STATUS.md`, waits for CI, merges |
| Still open | #96 (DIRTY, 3.4k lines), #107 (docs), #128 (this branch) |
| Branch | `docs/page-contract-rollout-plan` |
| Dev server | **:5174** — not :5173 |
| Merged branches | **not yet deleted** — do this only after #123 lands, and never with `--delete-branch` while a child PR still targets one |

## What was not done, and is not claimed

- **No screenshots were taken.** Nothing written this session is a claim about
  how any page currently looks.
- **No gates were run** — no `tsc -b`, no `vitest`, no `eslint`, no `a11y`. The
  session produced documents and merges, not code.
- The card and accent counts quoted throughout (Insights 17/6, Stats 11/5,
  Trackers 3/9, Today 8/3) are **greps over source, inherited from doc 13**,
  which flags them as unverified itself. Confirm on the rendered page before
  treating any single figure as final.
- Open Food Facts' CORS behaviour and rate limits come from its public docs,
  **not measured from this app**. Phase C must confirm a real browser request
  before any UI is built on it.
