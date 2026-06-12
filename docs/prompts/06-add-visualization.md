# Prompt — Add a data visualization / advanced view

> Reusable, copy-paste prompt for adding a chart or analytics view to **bujo**.
> Built on the house prompt skeleton: role → XML-tagged context → numbered steps
> → MUST/MUST NOT guardrails → think-then-answer → explicit output format.

---

## Role

You are a senior front-end engineer working in the **bujo** codebase — a
local-first React 19 + TypeScript + Tailwind v4 (CSS-vars) + shadcn + Recharts
SPA. You add focused, well-typed visualizations that read from the single
`JournalData` object and match existing conventions.

## Context

```xml
<stack>Vite · React 19 · TS strict (noUnusedLocals) · Tailwind v4 (no config) · Recharts (lazy) · Vitest</stack>
<data>One JournalData object in localStorage. Pure read-logic lives in src/lib/*; types in src/lib/types.ts. See docs/DATA_MODEL.md.</data>
<ui>Cards via components/ui.tsx (Card, ChartCard, StatTile, Segmented, Empty). Colors via cat('token') (Catppuccin). Charts go in a fixed-height wrapper with role="img" + aria-label.</ui>
<conventions>Whole-number progress (no raw fractions in UI). Lazy-load recharts views (see App.tsx). Keep the gzip budget (~200KB). Honour unit settings (kg/lb · km/mi · °F/°C).</conventions>
```

## Steps

1. Restate the metric in one line: what question does this chart answer?
2. Put **pure** aggregation in `src/lib/stats.ts` (or a new `lib/*.ts`) — a
   function taking `JournalData` and returning plain data. No JSX, no Date.now
   surprises (accept `today` as a param).
3. Write a Vitest test for that function first (empty journal → safe default;
   one realistic case).
4. Render it in the target view inside a `Card`/`ChartCard`, with a fixed-height
   wrapper carrying `role="img"` + a descriptive `aria-label`.
5. Use `cat()` tokens for every colour; respect `prefers-reduced-motion`.
6. `npm run build` (TS must pass — no unused vars) and `npm test` must stay green.
7. Update `docs/FEATURES.md` (the view's row) and, if a decision was made,
   `docs/DECISIONS.md`. Run `/document`.

## Guardrails

- **MUST** keep aggregation pure and unit-tested; **MUST NOT** compute heavy
  logic inline in JSX.
- **MUST** add `role="img"` + `aria-label` to every chart figure.
- **MUST NOT** add a new dependency without checking the bundle budget.
- **MUST NOT** introduce a new persisted field unless the metric genuinely needs
  one — prefer deriving from existing data.
- **MUST** show an `<Empty>` state when there's not enough data.

## Think, then answer

First think step-by-step (which data, which chart type, where it lives, edge
cases: empty/one-point/very-large). Then implement.

## Output format

A short plan, then the diffs (lib function + test + view wiring + docs), then the
`npm run build` / `npm test` result lines.
