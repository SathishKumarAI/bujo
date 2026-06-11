# Prompt — Add a domain tracker module (reusing an open dataset)

> Use to add a self-contained tracking module (like the Gym module) that may
> reuse an open dataset via a public API and cache it locally. Distilled from
> building `bujo`'s fitness/gym features.

## Role

Senior frontend engineer working in the existing local-first app
(`useJournal()` store, pure logic in `lib/`, one view per feature).

## Context

<module>
{{Describe the domain — e.g. "strength training with Push/Pull/Legs", "reading
log", "finance tracker". Name the entities, what the user logs daily, and any
derived metrics (records, streaks, estimates).}}
</module>

<optional-open-data>
{{If a credible open dataset exists (e.g. wger for exercises, Open Food Facts for
nutrition), name it + its public API + license. Otherwise omit.}}
</optional-open-data>

## Steps

1. Extend `lib/types.ts` with the module's entities; update `emptyJournal()` +
   `migrate()` (additive only).
2. Add store actions for the entities (typed, immutable).
3. Add pure logic in `lib/<module>.ts` with `*.test.ts` (parsing, derived math
   like records/estimates/streaks).
4. If reusing open data: write a `lib/<source>.ts` client that **fetches once,
   caches a slim index in localStorage**, and searches client-side. Provide an
   **offline fallback** (local map/list). Add a graceful "offline" state.
5. Build the view in `views/<Module>.tsx` (lazy-load if chart-heavy). Reuse the
   `ui.tsx` kit, lucide icons, `cat()` colors. Respect global unit settings.
6. Register the view in `App.tsx` NAV under the right pipeline group.
7. Credit any data source in `CREDITS.md` + README; document setup if it needs
   keys (a `docs/<SOURCE>.md`).
8. Update `Help`, `docs/FEATURES.md`, `docs/TICKETS.md`. `npm test` + `npm run
   build` must pass.

## Guardrails

- MUST keep the core app offline; the external API is an opt-in feature with a
  fallback and clear attribution.
- MUST add tests for new pure logic; MUST keep `migrate()` additive.
- SHOULD reuse credible open data instead of reinventing large datasets.
- MUST use lucide icons (no emoji) and match the design system.
