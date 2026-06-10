# Architecture

`bujo` is a single-page React app with **no backend**. All state lives in one
JSON object persisted to `localStorage`.

## Stack

- **Vite + React 19 + TypeScript** — SPA, `vite-spa` frontend profile.
- **Tailwind CSS v4** — theme tokens in `src/index.css` (`@theme` block).
- **Recharts** — line charts, lazy-loaded so they're off the initial bundle.
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

## Directory map

```
src/
├── lib/            pure logic + types (unit-tested)
├── components/     reusable UI (ui kit, EntryRow, QuickAdd, ImageUpload)
├── views/          one file per screen (Today, Monthly, Trackers, …)
├── store.tsx       JournalProvider + useJournal() context
├── App.tsx         responsive shell + sidebar nav + view routing
└── main.tsx        entry; wraps <App> in <JournalProvider>
```

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
