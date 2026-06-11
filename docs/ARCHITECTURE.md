# Architecture

`bujo` is a single-page React app with **no backend**. All state lives in one
JSON object persisted to `localStorage`.

## Stack

- **Vite + React 19 + TypeScript** — SPA, `vite-spa` frontend profile.
- **Tailwind CSS v4** — theme tokens in `src/index.css` (`@theme` block); shadcn
  semantic vars (`--primary`, `--border`, …) are mapped onto Catppuccin there.
- **shadcn/ui + Radix** — accessible primitives (button, switch, tabs, dialog,
  dropdown-menu, tooltip, popover, …) re-themed to Catppuccin; `cn()` =
  clsx + tailwind-merge (`src/lib/cn.ts`).
- **Recharts** — line charts, lazy-loaded so they're off the initial bundle.
- **lucide-react** — line icons (tree-shaken).
- **vite-plugin-pwa** — installable, offline app shell (service worker).
- **Vitest + Testing Library** — unit + integration tests.

## Data flow

```
localStorage ("bujo:data")
      ▲  │
 save │  │ load / migrate            (src/lib/storage.ts)
      │  ▼
   useReducer  ──►  JournalData  ──►  useJournal() context   (src/store.tsx)
      ▲                                   │
      │ actions (addEntry, toggleHabit…)  ▼
   UI components / views  ◄──────────  read data
```

- **Single source of truth:** `JournalData` (`src/lib/types.ts`).
- **`store.tsx`** holds it in a `useReducer`, exposes typed action methods via
  context, and persists on every change with a `useEffect`.
- **Pure logic** (no React) lives in `src/lib/` and is fully unit-tested:
  - `date.ts` — local-time date math (no UTC drift, no date lib).
  - `bullets.ts` — glyphs, status cycling, quick-capture parser, tag parsing.
  - `stats.ts` — streaks, completion, on-this-day, search.
  - `storage.ts` — load/save/migrate, seed data, JSON & Markdown export/import.
  - `image.ts` — canvas downscale + JPEG re-encode for uploads.
  - `colors.ts` — Catppuccin hex map for inline styles (Tailwind can't see
    runtime-built class names).
  - `recurrence.ts` — materialise recurring rules into entries (idempotent).
  - `correlations.ts` — Pearson + plain-language insights + rolling average.
  - `ics.ts` — minimal iCalendar parser for calendar import.
  - `prompts.ts` — rotating daily reflection prompts (deterministic by day).
  - `weather.ts` — open-meteo fetch + WMO map + reverse geocode (opt-in).
  - `fitness.ts` — PPL splits, exercise→muscle keyword map, parseSet, PRs, 1RM.
  - `viz.ts` — heatmap, radar, scatter, weekly bars, task/tag breakdowns.
  - `wger.ts` — wger exercise catalogue fetch + localStorage cache + search.
  - `gdrive.ts` — optional Google Drive sync (GIS token + Drive REST), opt-in.

## Directory map

```
src/
├── lib/            pure logic + types (unit-tested) + cn() class-merge
├── components/
│   ├── ui/         shadcn primitives (button, switch, dialog, …)
│   ├── ui.tsx      bespoke kit (Card, Button, Input, Slider, Segmented) — wraps shadcn
│   └── shell/      app shell: AppShell, Sidebar, TopBar, Page, cursor, viewChrome
├── views/          one file per screen (Today, Monthly, Trackers, …)
├── store.tsx       JournalProvider + useJournal() context
├── App.tsx         view switch + shell composition (no router)
└── main.tsx        entry; wraps <App> in <JournalProvider>
```

## App shell (presentation layer)

`components/shell/` wraps the `view` switch without adding a router:

- **`AppShell`** owns the grid (sidebar + topbar/content) and the global
  quick-add dialog.
- **`TopBar`** renders the view title/subtitle (from `viewChrome.ts`), a
  contextual date-nav, quick-add, ⌘K, and an overflow menu (theme/zoom/undo/
  paper/handwriting/book). It replaces the old floating control clusters.
- **`cursor.tsx`** is a `DateCursor` context holding shared `day`/`month` state
  so the top bar can drive Today/Monthly/Trackers/Cycle.
- **`Page`** is the responsive `main`/`aside` grid every view opts into.

## Key decisions

| Decision | Why |
|---|---|
| `localStorage`, not IndexedDB | Data is small (text + a few downscaled photos); simpler API; trivial export. |
| Inline styles for dynamic colors | Tailwind v4's JIT can't see `` `text-${color}` ``; a hex map keeps colors data-driven. |
| Lazy-load chart views | Recharts is ~100 KB gzip; keeping it off the initial route holds the bundle budget. |
| Forward-compatible `migrate()` | Any older/partial saved blob is merged onto a fresh default, so schema growth never breaks existing journals. |
| Gendered tools off by default | Privacy: cycle/abstinence views only appear when the user opts in (auto-suggested by profile). |

## Testing

`npm test` runs Vitest. Logic modules are covered directly; `store.test.tsx`
renders the provider with `QuickAdd` to verify the parse→persist round-trip.
