# 🏗️ Software / architecture view

## Stack
- **React 19** + **Vite 8** (rolldown) SPA, **TypeScript**, **Tailwind v4**,
  **Radix UI** primitives, **recharts**, **lucide** icons. PWA via
  `vite-plugin-pwa`. Tests: **Vitest** + Testing Library (224 tests).

## Shape (no backend required)
The whole app is a pure client. One root state object (`JournalData`) lives in a
React context and is mirrored to `localStorage`. Views are pure functions of
that state; mutations are dispatched through a single reducer.

```
src/
  App.tsx              # routing (view state), providers, sync effects, auth gate
  store.tsx            # JournalProvider: useReducer + undo/redo history + actions
  lib/                 # pure domain logic (≈60 modules, each unit-tested)
    types.ts           # JournalData + all entities (the contract)
    storage.ts         # load/save/migrate/seed, empty/seed journals
    stats.ts fitness.ts pickleball.ts reading.ts coach.ts …  # derivations
    supabase.ts bujocloud.ts fscloud.ts github.ts gdrive.ts  # sync adapters
    crypto.ts          # AES-GCM at-rest encryption
  components/
    ui.tsx             # Card (+CARD tokens, ChartCard), Button, primitives
    shell/             # AppShell, Sidebar, TopBar, nav, viewChrome (ViewId map)
  views/               # one component per ViewId (Today, Trackers, …)
```

## State management
- **Single source of truth:** `JournalData`. No Redux — a `useReducer` in
  `store.tsx` with three action kinds: `set` (replace), `patch` (mutate via a
  pure `fn(d)=>d`), `silent` (mount-time, no history).
- **Undo/redo:** the reducer keeps `past[]/present/future[]` (cap 80) and
  coalesces same-label edits within 900 ms into one step. App-wide ⌘Z.
- **Persistence is an effect:** any state change → `save(data)` (or AES-GCM
  encrypt when a passcode is set). Never writes while locked.
- **Derivations are pure functions** in `lib/*` (e.g. `weeklyHabitCount`,
  `coachTips`, `winRateSeries`) — easy to test, no state coupling.

## Rendering & routing
- View is a `useState<ViewId>` (no router); `?view=` seeds it. `NavProvider`
  lets any view navigate. Chart-heavy views are `React.lazy` code-split.
- The shared **`Card`** owns all card chrome via the **`CARD`** token object
  (single place to restyle every card) + the ⛶ enlarge modal + ⓘ help popover.
  `ChartCard` is the enlargeable preset. This is the modularity backbone.

## Quality gates
`tsc -b` + `eslint` (soft — pre-existing debt) + `vitest` + `vite build`. Run all
via `scripts/ship.sh --verify`; CI runs them on every PR. See
[uml.md](uml.md) for the build/deploy pipeline.

## Key conventions
- All domain logic in `lib/` is pure and tested; components stay thin.
- Adding an entity = type in `types.ts` → `emptyJournal()` → store actions →
  view → `viewChrome`/nav → demo seed → tests (forward-compatible `migrate()`).
- Catppuccin tokens only (`cat()`), one-pen minimal aesthetic.
