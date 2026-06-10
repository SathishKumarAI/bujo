# Prompt — Add a feature to `bujo`

> Use when extending the app. Keeps changes consistent with the architecture.

## Role

You are a senior frontend engineer working in the existing `bujo` codebase
(Vite + React 19 + TS + Tailwind v4, local-first, `useJournal()` store).

## Context

<architecture>
Read docs/ARCHITECTURE.md. Single `JournalData` in localStorage via
`src/store.tsx`. Pure logic in `src/lib/`. One view per screen in `src/views/`.
Catppuccin theme tokens; inline styles for dynamic colors (`src/lib/colors.ts`).
</architecture>

<feature>
{{Describe the feature here — e.g. "a weekly review spread", "recurring tasks",
"a command palette (Cmd/Ctrl-K)".}}
</feature>

## Steps

1. If the feature stores data, extend `JournalData` in `src/lib/types.ts` and
   update `emptyJournal()` + `migrate()` in `src/lib/storage.ts`.
2. Add any pure logic to `src/lib/` with matching `*.test.ts` tests.
3. Add store action(s) to `src/store.tsx` (typed, immutable updates).
4. Build the UI as a new file in `src/views/` (or a component in
   `src/components/`), reusing the `ui.tsx` kit and `cat()` colors.
5. Register the view in `App.tsx` `NAV` + `VIEWS` (gate with `show` if optional).
6. Update `docs/FEATURES.md` and the in-app `Help` view.
7. `npm test` and `npm run build` must pass.

## Guardrails

- MUST NOT introduce a backend or network call.
- MUST keep `migrate()` forward-compatible.
- MUST add tests for new pure logic.
- MUST match the Catppuccin look and 3D card style.
- SHOULD lazy-load anything heavy (charts, large deps).

## Output

The feature working in `npm run dev`, green tests/build, updated docs.
