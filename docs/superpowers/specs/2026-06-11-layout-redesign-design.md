# Layout Redesign — Design Spec

**Date:** 2026-06-11 · **Owner:** Sathish Kumar · **Status:** Approved for planning

A usability-first redesign of the `bujo` app shell and all 13 views. Keeps the
Catppuccin look and all tested logic; changes layout, control consistency, and
the component substrate (adopts shadcn/ui primitives, re-themed to Catppuccin).

## 1. Why

A live audit of the running app (chrome-devtools MCP, 1440×900, demo data)
surfaced six concrete problems:

| # | Problem | Seen in |
|---|---------|---------|
| 1 | Dead right-side void — "main column + right rail" where the rail dead-ends, leaving a large empty area below | Today, Monthly |
| 2 | No unified layout — some views are 2-col+rail, others full-width grid; every view rolls its own | all |
| 3 | Long vertical scroll on the most-used view — Today stacks 6 cards; key actions fall below the fold | Today |
| 4 | No app header — view title + date-nav live inside each view inconsistently; the command palette is invisible | all |
| 5 | Bolted-on floating controls — undo/redo (bottom-left) and zoom (bottom-right) overlap content | all |
| 6 | Inconsistent controls — toggles vs segmented pills for the same kind of choice; ragged card heights in grids | Settings |

Before screenshots live in `docs/redesign/` and `docs/screenshot-*.png`.

## 2. Goals / non-goals

**Goals**
- One coherent, responsive app shell every view opts into — no dead voids, no
  per-view layout reinvention.
- A single control vocabulary (Button, Switch, Segmented, Dialog, Dropdown,
  Tooltip) via shadcn/ui re-themed onto existing Catppuccin tokens.
- Today reflows into an above-the-fold dashboard.
- Global affordances (quick-add, command palette, theme/zoom/undo) consolidated
  into a sticky top bar.
- Full rationale documented in MDX; existing docs + in-app Help updated.

**Non-goals**
- No change to journal logic, data model, storage, or tests' expected behaviour.
- No new app features — this is presentation + IA only.
- No router; keep the `view` state switch in `App.tsx`.
- No color-palette change — Catppuccin stays; shadcn vars map onto it.

## 3. Decisions (locked with user)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Shell + all 13 views | Consistency across the app |
| Direction | Bigger visual restyle | Spacing scale, card system, control vocabulary |
| Components | Adopt shadcn primitives | A11y-robust, re-themed to Catppuccin |
| Date-nav | Hoist to global top bar | One place, consistent across date views |
| Migration | Wrap + gradual | `ui.tsx` wraps shadcn; views migrate opportunistically; current imports keep working |
| Deps risk | Proceed, watch budget | Verify initial JS < 200 KB gzip post-build; roll back any component that blows it |

## 4. Architecture

No router change. New presentation layer wraps the existing view switch.

```
App.tsx
└─ AppShell                     components/shell/AppShell.tsx   (grid owner)
   ├─ Sidebar                   components/shell/Sidebar.tsx    (resizable/collapsible, grouped nav)
   ├─ TopBar                    components/shell/TopBar.tsx     (title · date-nav · quick-add · ⌘K · overflow menu)
   │  └─ ViewChrome registry    components/shell/viewChrome.ts  (per-view title/subtitle/date-nav descriptor)
   └─ Page                      components/shell/Page.tsx       (responsive main/aside grid, max-w)
      └─ <Current view/>
```

### 4.1 Top bar
- Left: current view title + subtitle (from `viewChrome` registry).
- Inline: contextual date prev / today / next — rendered only for views whose
  registry entry declares `dateNav: true` (Today, Monthly, Trackers, Cycle).
  The view exposes its date state through the store; the bar calls shared
  date actions. No date logic moves — only its controls relocate.
- Right: **Quick Add** (opens the global QuickAdd dialog, reachable from every
  view), **⌘K** command-palette trigger, **overflow menu** (DropdownMenu:
  theme dark/light, zoom −/reset/＋, undo/redo, toggles for book / paper /
  handwriting).
- Deletes the two floating control clusters in `App.tsx`. Keyboard shortcuts
  (⌘Z / ⌘⇧Z / ⌘K) are preserved.

### 4.2 Sidebar
- Keep grouped nav (Journal / Health / Review / System) and `show()` gating.
- Rebuild on shadcn primitives + `Resizable`/collapse; cleaner icon rail.
  Active item keeps `aria-current` + accent rail.
- Brand sits in the top bar on mobile; sidebar becomes a Sheet/drawer under `md`.

### 4.3 Page / content grid
- `<Page main aside?>` owns `max-w` (raised from 1600 where it helps) and a
  responsive grid. `aside` sits beside `main` at `xl`, and **wraps under** it at
  narrower widths instead of leaving a void. Views pass `main`/`aside` slots.

## 5. Component system (shadcn → Catppuccin)

- `npx shadcn init` in Tailwind-v4 / CSS-variables mode. No `tailwind.config.js`
  is created; shadcn vars are declared alongside the existing `@theme` block in
  `src/index.css` and **mapped onto Catppuccin tokens** (`--primary → mauve`,
  `--background → base`, `--border → surface0`, etc.) for both Mocha (dark) and
  Latte (`:root[data-theme="latte"]`).
- Adopt: `button, switch, tabs, dialog, dropdown-menu, tooltip, popover,
  separator, scroll-area, resizable, sonner`.
- Keep domain widgets unchanged in logic, re-skin shells only: `Slider` (mood),
  `EntryRow`, `QuickAdd`, `Heatmap`, `MuscleMap`, `RadialTracker`, Recharts views.
- `ui.tsx` `Card` / `Button` / `Input` / `Textarea` become thin wrappers over the
  shadcn equivalents so existing imports across views keep working (low-churn).
- New deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*`
  (per component). `lucide-react` already present.

## 6. Per-view reflow

| View | Change |
|---|---|
| Today | Dashboard reflow: capture + daily log primary (above fold); Wellbeing + "on this day" in aside; Gratitude / Reflection / Daily memory / Stickers in a balanced grid below. No tall scroll, no void. |
| Monthly | Balance the right rail so calendar + rail end together; rail wraps under on narrow. |
| Trackers | Fix cramped `%` column gutter; adopt `<Page>`. |
| Settings | Equal-height card grid; unify toggle-vs-segmented into one rule (Switch for on/off, Segmented for enums). |
| Fitness, Gym, Insights, Stats, Collections, Plan, Cycle, NoFap, Help | Adopt `<Page>` + consistent card system + control vocabulary. |

## 7. Guardrails

- **Perf:** initial JS < 200 KB gzip (verify `vite build` after shadcn). Charts
  stay `React.lazy`. Roll back any primitive that blows the budget.
- **Tests:** all existing `src/lib/*.test.ts` + the store test stay green. This
  is presentation-only; no logic edits.
- **A11y:** keep `aria-current`, visible focus rings, `prefers-reduced-motion`
  respect; shadcn/Radix add correct roles for dialog/menu/tooltip.
- **Visual:** no Catppuccin color regression — verified via chrome-devtools
  before/after screenshots.

## 8. Documentation deliverables

- **Rationale in MDX** — new `docs/redesign/`: `00-overview.mdx`, `01-audit.mdx`
  (these findings + before shots), `02-design-system.mdx`, `03-shell.mdx`,
  `04-views.mdx`, `05-before-after.mdx`.
- **Updates** — `FRONTEND_SPEC.md` (shell + grid + shadcn), `ARCHITECTURE.md`,
  `FEATURES.md`, `DECISIONS.md` (ADR: adopt shadcn), `TICKETS.md` (redesign
  epic), `WORKLOG.md`, in-app `Help` view.

## 9. Build sequence (for the plan)

1. shadcn init + Catppuccin var mapping; verify build + budget.
2. `ui.tsx` wrappers over shadcn (no view changes yet) — tests green.
3. `AppShell` + `Sidebar` + `TopBar` + `viewChrome` registry; delete floating
   controls; wire quick-add + command palette + menu.
4. `<Page>` grid primitive.
5. Today dashboard reflow (showcase).
6. Remaining views adopt `<Page>` + vocabulary, view by view.
7. Before/after screenshots; write MDX + update docs + Help.
8. Final build, budget check, full test run.
