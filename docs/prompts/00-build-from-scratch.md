# Prompt — Build `bujo` from scratch

> Reusable build prompt. Paste into Claude Code (or any capable coding agent) in
> an empty directory to regenerate the whole app. Follows the workspace
> prompt-skeleton: role → context → steps → guardrails → output.

---

## Role

You are a senior frontend engineer. Build a production-quality, **local-first**
digital bullet-journal SPA. No backend, no accounts — all data in
`localStorage`.

## Context

<inspiration>
Minimal one-pen Bullet Journal method (Ryder Carroll). Spreads inspired by two
YouTube videos: a van-life minimalist journal (location-per-month calendar,
gratitude page, daily memory line, mood/stress/sleep + intake trackers) and a
"minimalist bullet journal setup 2025" beginner guide.
</inspiration>

<stack>
Vite + React 19 + TypeScript, Tailwind CSS v4, Recharts (lazy-loaded),
Vitest + Testing Library. Theme: Catppuccin Mocha (dark) + Latte (light).
</stack>

<data-model>
One root `JournalData` object persisted to localStorage key "bujo:data":
entries (rapid-log bullets), habits + habitLog (dot-grid), metrics
(mood/stress/sleep/fastBreak per day), workouts, cycle points, gratitude,
memories (+photo), birthdays, monthly meta (location/goals/photo), collections,
nofap streak, settings (theme, gender, tempUnit, toggles).
</data-model>

## Steps

1. Scaffold with `npm create vite@latest bujo -- --template react-ts`; add
   `tailwindcss @tailwindcss/vite recharts`; dev-add `vitest
   @testing-library/react @testing-library/user-event @testing-library/jest-dom
   jsdom @vitest/coverage-v8`.
2. Configure Tailwind v4 via the Vite plugin; define Catppuccin tokens in a
   `@theme` block; add a `latte` light override and 3D depth utility classes.
3. Build pure logic in `src/lib/` (unit-tested): `types.ts`, `date.ts`,
   `bullets.ts`, `stats.ts`, `storage.ts`, `image.ts`, `colors.ts`.
4. Build `store.tsx`: `useReducer` over `JournalData`, `useJournal()` context
   exposing typed actions, persist on change, sync `<html data-theme>`.
5. Build the UI kit (`components/ui.tsx`: Card, Button, Input, Textarea, Slider,
   Pill) plus `EntryRow`, `QuickAdd`, `ImageUpload`.
6. Build one view per screen in `src/views/`: Today, Monthly, Trackers, Fitness,
   Collections, Insights, Cycle, NoFap, Help, Settings.
7. Build `App.tsx`: responsive sidebar shell, view routing, lazy-load the
   recharts views, gate Cycle/NoFap behind settings.
8. Write Vitest tests for every logic module + a provider integration test.
9. `npm run build` and `npm test` must both pass cleanly.

## Guardrails

- MUST keep all data client-side; NO network calls, NO analytics.
- MUST downscale uploaded images (canvas → JPEG ≤1024px) before storing.
- MUST make `migrate()` forward-compatible (merge onto a fresh default).
- MUST keep initial JS payload < 200 KB gzip (lazy-load charts).
- MUST gender-gate the Cycle and NoFap views; both off by default.
- MUST be keyboard-accessible and responsive (mobile → desktop).
- MUST use inline styles for runtime-dynamic colors (Tailwind JIT limitation).

## Output

A running app (`npm run dev`), green build, green tests, and `docs/` with a PRD,
architecture doc, and these prompts.
