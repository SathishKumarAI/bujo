# Prompt — Build a local-first personal tracker/journal app

> A reusable agent playbook distilled from building `bujo`. Paste into a capable
> coding agent to build *this kind of app* (private journal + habit/health
> tracker) from scratch, with the patterns that worked baked in. Pairs with
> `docs/DECISIONS.md`.

## Role

You are a senior product + frontend engineer. Build a **local-first, private,
offline-capable** personal journal & tracker web app. No backend, no accounts.
Optimize for: privacy, daily-use speed, a premium non-generic UI, and testable
logic.

## Non-negotiable principles (learned the hard way)

1. **Local-first.** One typed root object in `localStorage`; `useReducer` +
   a context with typed action methods; persist on every change. No backend.
2. **Forward-compatible loader.** A `migrate()` that merges any saved blob onto a
   fresh default — additive schema only, never break old data.
3. **Pure logic in `lib/`, unit-tested.** Dates, parsing, stats, domain math
   live React-free with `*.test.ts`. Views stay thin.
4. **Lazy-load anything heavy** (charts) to hold a < 200 KB-gzip initial bundle.
5. **Premium, not generic.** An editorial display serif for titles + a single
   line-icon set (no emoji in chrome). Subtle 3D depth. One accent color.
6. **Inline styles only for runtime-dynamic colors** (Tailwind JIT can't see
   `` `text-${x}` ``) — keep a hex map.
7. **Sensitive features opt-in, off by default.** Surface by profile, never
   assume.
8. **Own your data.** One-click JSON + Markdown export; a backup nudge.
9. **Respect units & locale.** Global kg/lb, km/mi, °C/°F, week-start settings;
   store entered values, label by unit (no silent conversion).
10. **Reuse credible open data** (e.g. exercise DBs) via public APIs; cache a
    slim index locally; **credit every source** in a `CREDITS.md`.

## Build sequence

1. Scaffold Vite + React + TS; add Tailwind v4 (theme tokens in a `@theme`
   block), a chart lib (lazy), an icon set, Vitest + Testing Library.
2. Model `RootData` in `lib/types.ts`; write `storage.ts`
   (empty/seed/migrate/load/save/export/import) with tests.
3. Build pure-logic libs (dates, domain parsing, stats) + tests first.
4. Build the store (`useReducer` + context actions); persist + sync theme.
5. Build a small UI kit (Card, Button, Input, Slider) with consistent 3D + focus
   states; then shared widgets.
6. Build one view per feature; group navigation as a **pipeline**
   (capture → track → review → system), not a flat list.
7. Add export/import, a settings screen, and an in-app Help.
8. Write a PRD, an architecture doc, a decision log, and replication prompts.

## Guardrails

- MUST NOT add a network call to the core loop; any external API is an opt-in,
  clearly-credited feature with an offline fallback.
- MUST keep `migrate()` additive; MUST add tests for new pure logic.
- MUST be keyboard-accessible, responsive, reduced-motion aware.
- SHOULD make zoom scale content only; keep navigation static.

## Verifiable done

Running app, green build, green tests, < 200 KB-gzip initial JS, and a `docs/`
folder containing: PRD, ARCHITECTURE, DECISIONS, FEATURES, TICKETS, CREDITS,
and these prompts.

## Composable sub-prompts

- `01-add-feature.md` — add one feature consistently.
- `02-add-login-and-sync.md` — opt-in, E2E-encrypted accounts (v2).
- `03-add-tracker-module.md` — add a domain module (e.g. fitness/gym) that
  reuses an open dataset + caches it locally.
