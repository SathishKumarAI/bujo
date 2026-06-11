# Frontend Specification

How the `bujo` UI is built: stack, design system, component contracts, state,
performance budgets, and conventions. Pairs with `docs/ARCHITECTURE.md`.

## 1. Stack & profile

- **Vite + React 19 + TypeScript**, SPA. Frontend profile: `vite-spa`
  (auth-walled-style app, desktop-primary, no SEO need).
- **Tailwind CSS v4** via the Vite plugin; theme tokens in `src/index.css`.
- **shadcn/ui + Radix** primitives, re-themed to Catppuccin via semantic CSS-var
  aliases (`--primary → mauve`, …). Class-merge via `cn()` (`src/lib/cn.ts`).
- **Recharts** for charts (lazy-loaded). **lucide-react** for icons.
- **vite-plugin-pwa** for installable/offline app shell.

## 2. Performance budgets (and actuals)

| Budget | Target | Actual |
|---|---|---|
| Initial JS (gzip) | < 200 KB | **~80 KB** |
| Chart chunk (lazy) | off initial route | `LineChart` ~100 KB gzip, loaded only on Trackers/Cycle |
| CSS (gzip) | < 30 KB | ~6 KB |
| LCP (desktop) | < 2.5 s | well under (static shell) |

Rules: lazy-load anything heavy; no moment/lodash/axios; prefer native APIs.

## 3. Design system

### Type
- **Display / titles:** Fraunces (serif) — `.font-display`. Gives an editorial,
  non-generic feel.
- **Body / UI:** Inter.
- **Handwriting (optional):** Caveat, toggled by `body.handwriting`.
- **Mono:** JetBrains Mono for glyphs/numbers.

### Color — Catppuccin
Tokens defined in the `@theme` block: `base, mantle, crust, surface0–2,
overlay0–2, text, subtext0/1`, plus accents `mauve` (primary), `green, red,
blue, peach, yellow, teal, sky, sapphire, pink, maroon, lavender`. Light mode is
the Latte override on `:root[data-theme="latte"]`.
Dynamic colors use inline styles via `cat()` (Tailwind JIT can't see runtime
class names) — see `src/lib/colors.ts`.

### Depth & motion
- `.card-3d` — gradient + layered shadow + hover lift.
- `.press-3d` — tactile button press.
- `.page-in` — view transition (respects reduced-motion).
- `.taped` — photos rotate slightly with a washi-tape corner.
- `body.paper` — dot-grid paper texture.

## 4. Component contracts (`src/components/ui.tsx`)

| Component | Props | Notes |
|---|---|---|
| `Card` | `title?, subtitle?, right?, children, className?` | Serif title; 3D shell |
| `Button` | `variant: primary\|ghost\|danger, onClick, type, aria-label, title` | Focus ring, press-3d |
| `Input` / `Textarea` | native props passthrough | Themed |
| `Slider` | `label, value, onChange, color, hint` | 0–10, inline-colored chip |
| `Pill`, `Empty` | — | Small helpers |

Shared widgets: `EntryRow`, `QuickAdd`, `ImageUpload`, `StickerBar`,
`ReminderBanner`.

## 5. State

- One `JournalData` object in a `useReducer`, exposed through `useJournal()`
  context (`src/store.tsx`). Persisted to `localStorage` on every change.
- Actions are typed, immutable updaters. No prop-drilling of setters.
- Side-effects on mount: generate recurring entries; sync theme + paper/
  handwriting body classes.

## 6. Routing / navigation

No router — a `view` state in `App.tsx` switches between view components.
`NAV` is a typed list with lucide icons and optional `show()` gating (Cycle /
Streak appear per settings). Active item: `aria-current` + accent rail.

## 7. Views

`Today, Monthly, Trackers, Fitness, Plan, Collections, Insights, Cycle, NoFap,
Help, Settings` — one file each in `src/views/`. Trackers & Cycle are
`React.lazy` (recharts).

## 8. Accessibility & responsiveness

See `docs/ACCESSIBILITY.md`. Layout is mobile-first: sidebar collapses to a top
bar + toggle under `md`; content is a single column that becomes multi-column
grids at `lg`.

## 9. Conventions

- TypeScript strict; no `any` in app code.
- Inline styles only for runtime-dynamic color; everything else Tailwind.
- Comments explain *why*, not *what*; match surrounding density.
- Tests: pure logic in `src/lib/*.test.ts`; one provider integration test.
- New UI must update `Help` view + `docs/FEATURES.md`.
