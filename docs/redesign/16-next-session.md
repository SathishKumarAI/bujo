# 16 · Next session — start here

**Updated:** 2026-08-24, after the page-contract rollout.
**Open decisions:** `docs/QUESTIONS.md` — **Q3 (deploy)** and **Q4 (shadcn depth)**
are the only two left. Q1, Q2, Q6 were answered or settled by measurement.

## State

`main` is clean: **zero open PRs, zero stale branches.** Servers: dev `:5174`,
preview `:4173` (the a11y gate needs the preview running or it dies on
`ERR_CONNECTION_REFUSED`).

**Contract adoption: 8 of 28 views**, up from 4 — Fitness, Plan, Nutrition,
NoFap, KitchenSink, **Trackers, Insights, Stats**.

| Page | Cards | Zones | Note |
|---|---|---|---|
| Trackers | 17 → **3** | 1·2·3 | `PageLayout` gained `stacked` for it |
| Insights | 17 → **16** | 1·2·3 | Shape fixed; the six-drawer cabinet is not |
| Stats | 11 | 1·—·3 | No zone 2, deliberately: nothing to *do* here |
| Today | **4** | — | Assessed, deliberately **not** converted |

## Do next, in order

1. **BUJO-281 — Insights is still a six-drawer cabinet.** 16 Cards against a cap
   of 2, fourteen of them inside six collapsed `Section`s where the contract
   allows one disclosure. This is the largest remaining gap in the cluster, and
   it is an IA decision about what Insights is *for* — not a refactor. Decide
   before coding.
2. **BUJO-280 — the Activity heatmap leaves ~800px dead.** At 6mo its grid is
   ~370px of fixed cells inside a `SPAN_ALL` card running ~1180. It cannot just
   be narrowed: `SPAN_ALL` exists for the 1yr range at ~730px, so the range
   control changes content width threefold. Needs a stretching cell or a
   content-sized card.
3. **BUJO-278 — `StatTile.color` is a no-op without an `icon`.** Audit every
   call site passing `color` and no icon; some of them believe they are showing
   a status signal and are not.
4. **The remaining 20 views.** Highest value by size: `Gym` (709), `Pickleball`
   (633), then Monthly, Goals, Mindset, Reading, Collections, Focus.
5. Answer **Q3** and **Q4**.
6. BUJO-270 print fix · BUJO-277 `smoke-views.mjs` misses `program` and
   `nutrition` · BUJO-282 `weeklyRadar` plots hours and 0–10 on one axis set.

## What the rollout established

**`PageLayout` needed a variant, and the contract predicted it.** The 62/38
split assumes a narrow form beside a list. Trackers' review is a 31-column grid
needing ~910px — in a 62% column it would scroll horizontally and hide the last
week of the month, the page's whole subject. `stacked` keeps the wide container
and does not split. Per the contract's own Stage 2 rule, it went in the
primitive, not as a fork at the call site.

**That surfaced a latent CSS bug.** `.zone-act { grid-column: 2 }` and
`.zone-review { grid-column: 1 }` were never scoped to the splitting case, so a
single-column page carrying both zones would place its act in a column the grid
does not declare and the browser would invent an implicit second one. Latent
only because all four converted pages were tier 1180.

**Two duplicated facts found by conversion**, not by grep: Insights printed
"Longest streak" both as a top-row tile and inside Personal records further down
the same page; Trackers wrapped `TodayStrip`'s own bordered "Today" box inside a
card titled "Today".

**A page with no act is allowed to have no zone 2.** Stats is the case. The
contract says a zone you have no content for is omitted, not filled.

## Traps added

- **The onboarding tour covers every view**, and its dismiss control is
  `button[aria-label="Skip tour"]` — an aria-label with **no text content**, so
  text selectors cannot find it. Two capture runs photographed the tour.
- **Demo data loads from inside a Settings fold** that must be opened first.
- **A fresh Playwright context has an empty journal**, so a measurement over
  habit rows returns `[]` and reads as "nothing wrong" rather than "nothing
  there". Load demo data in the same run.
- **`gh pr merge` reads a cached mergeability state**; straight after a push it
  still reports conflicts. Wait rather than re-resolving.
- **Auto-merge is disabled on this repo.** Every merge waits on CI.
- **A stacked PR must be retargeted** (`gh pr edit <n> --base main`) or it merges
  into its parent's branch and `main` does not move.

## Not claimed

Screenshots were **1440 desktop only, default theme, demo data**. Phone was not
looked at in this pass. The converted pages were verified by the gates in all
five themes and two viewports, but *looked at* in one.
