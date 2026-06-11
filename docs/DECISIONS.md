# Decision Log (ADR-style)

Why `bujo` is built the way it is. Each entry: the decision, the reasoning, and
the trade-off accepted. Written by the build agent so a future builder (human or
AI) can reuse or challenge the reasoning rather than re-derive it.

> Format: **D-NN — Decision** · *Context* → *Choice* → *Trade-off*.

## Architecture

**D-01 — Local-first, no backend, no accounts.**
*Context:* a private journal + health tracker; competitors lock data in clouds.
*Choice:* everything in `localStorage` under one key (`bujo:data`); zero auth.
*Trade-off:* no multi-device sync (deferred to an opt-in, E2E-encrypted v2);
storage is fragile → mitigated with export + a backup nudge.

**D-02 — One root `JournalData` object + `useReducer` + context.**
*Context:* many feature areas, all small data.
*Choice:* a single typed object, a reducer, and `useJournal()` action methods;
persist on every change via one effect.
*Trade-off:* whole-object writes (fine at this data size); no normalization.

**D-03 — Forward-compatible `migrate()` instead of versioned migrations.**
*Choice:* merge any loaded blob onto a fresh default; fill missing keys.
*Why:* schema grows feature-by-feature; old saves must never break.
*Trade-off:* no destructive migrations — additive-only schema.

**D-04 — Pure logic in `src/lib/`, unit-tested; React only in views.**
*Why:* dates, bullets, stats, recurrence, correlations, fitness math are the
risky parts; keeping them React-free makes them trivially testable.
*Result:* 63 tests cover the logic; views stay thin.

**D-05 — Inline styles for runtime-dynamic colors.**
*Context:* Tailwind v4 JIT can't see `` `text-${color}` `` built at runtime.
*Choice:* a `cat()` hex map (`src/lib/colors.ts`) + `style={{ color: cat(x) }}`.
*Trade-off:* lose Tailwind ergonomics for those spots; gain data-driven color.

**D-06 — Lazy-load chart-heavy views.**
*Context:* Recharts is ~100 KB gzip.
*Choice:* `React.lazy` the Trackers / Cycle / Stats / Gym views.
*Result:* initial bundle stays ~80 KB gzip (vite-spa budget is 200 KB).

## Product

**D-07 — Gendered wellbeing tools are opt-in, off by default.**
*Context:* cycle/temperature and abstinence (NoFap) are sensitive.
*Choice:* a `gender` profile auto-suggests, but both views are toggles; nothing
appears unless enabled.
*Why:* privacy on shared devices; no assumptions.

**D-08 — Reuse a real exercise database (wger) instead of building one.**
*Context:* a credible gym tool needs hundreds of exercises with images/muscles.
*Choice:* read wger's public API; never reinvent 850 exercises.
*Trade-off:* a network dependency for that feature (the rest stays offline).

**D-09 — wger anatomical muscle SVGs over a hand-drawn figure.**
*Context:* the first hand-drawn body map looked amateur.
*Choice:* layer wger's base-body + per-muscle highlight SVGs (CC-BY-SA).
*Why:* professional medical-style art for free; credited.

**D-10 — Exercise→muscle: keyword mapper with wger-exact fallback.**
*Context:* the anatomy view must work offline AND be accurate online.
*Choice:* a local keyword map (`musclesForExercise`) for offline; when the wger
catalogue is cached, prefer its exact muscle ids (`cachedMusclesForName`).
*Trade-off:* keyword guesses are approximate for obscure lifts.

**D-11 — Cache the wger catalogue locally after first search.**
*Context:* wger removed its `/search/` autocomplete endpoint.
*Choice:* fetch `/exerciseinfo/` once, store a slim `{id,name,image,video,
muscles}` index in `localStorage` (30-day TTL), search client-side.
*Trade-off:* a heavier one-time fetch; instant + offline thereafter.

**D-12 — Global unit settings (kg/lb, km/mi, °F/°C, week start).**
*Why:* US vs metric users; respect choice, don't assume.
*Choice:* store the value the user enters and label by unit (no silent
conversion), since users pick one system and stay.

**D-13 — Pipeline navigation (grouped sidebar).**
*Context:* a flat 13-item nav had no narrative.
*Choice:* group into Journal → Health → Review → System — the daily flow of
capture → track → reflect → configure.

## UI / craft

**D-14 — Editorial serif (Fraunces) titles + lucide line icons; no emoji in UI.**
*Why:* emoji read as "AI slop"; a serif display face + consistent line icons
give an intentional, premium feel. Exception: BuJo bullet glyphs
(`· ✕ > ○ – ▲ !`) are kept — they are Ryder Carroll's actual method notation.

**D-15 — Subtle 3D depth + optional paper/book realism.**
*Choice:* `.card-3d`, `.press-3d`, dot-grid `paper`, open-`book` frame, taped
photos, handwriting font — all toggleable; reduced-motion respected.

**D-16 — Zoom scales content only; the sidebar is sticky/static.**
*Why:* zoom is for diagrams/calendars, not navigation chrome — nav must stay
usable at any zoom.

**D-17 — "Own cloud" via a picked folder (File System Access API), not OAuth.**
*Context:* users wanted login + their own cloud; Google Drive OAuth needs app
verification past 100 users and a client ID.
*Choice:* a first-run gate offers **"Use my own cloud"** → pick a folder inside
their existing Drive/Dropbox/OneDrive sync folder; bujo writes `bujo.json` there
and their cloud client syncs it. No accounts, no OAuth, any cloud.
*Trade-off:* Chromium-only; permission re-grant after reload. Google Drive and a
GitHub **private gist** remain as alternative backup targets in Settings.

## What was deliberately deferred

- Accounts + cloud sync (opt-in, E2E-encrypted) — see `prompts/02`.
- Passcode + client-side encryption of the blob.
- Embedded video players (use YouTube search links instead).
- A full nutrition food database (kept a lightweight macro diary).
