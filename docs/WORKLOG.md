# Worklog

## 2026-06-10 — Fitness/Gym, visualizations, wger, icons (BUJO-73…116)

Big fitness + visualization + polish session, all local-first, all credited.

**Visualizations (Stats tab)**
- Activity heatmap (GitHub-style), weekly radar, sleep-vs-mood scatter,
  workout-minutes bars, task-status donut, mood calendar, tag cloud.
- 7-day rolling-average overlays on the Trackers chart.

**Gym tab (GRIT + wger inspired, own code)**
- Push/Pull/Legs split selector + next-day suggestion; PPL presets + custom
  routines; structured set logging; personal records (parsed from sets);
  body-weight chart; nutrition / macro diary.
- **Muscle map**: switched from a hand-drawn SVG to **wger's anatomical muscle
  diagrams** (base body + per-muscle overlays, CC-BY-SA). The map reacts to the
  exercises you log (union), a per-row **focus** toggle, or a clicked PR.
- **wger exercise database**: rebuilt the client after wger removed `/search/`
  — now fetches `/exerciseinfo/`, caches a slim index in localStorage, searches
  client-side. **Exercise detail modal**: large image + exact wger muscles on
  the body map + "Add to session".

**UX / polish**
- Zoom in/out control + hover-zoom on images; **sticky sidebar** stays static
  while content zooms.
- **Professional lucide icons app-wide**, replacing emoji on buttons/labels
  (image upload, settings, gym splits, PRs, routines, fast-break, year-in-review,
  milestones, birthdays, ics import). BuJo bullet glyphs kept (method notation).
- `?view=` and `?demo=1` deep links.

**Credits**
- `CREDITS.md` + README references list every source the user provided
  (Ryder Carroll, two YouTube videos, Lazy Genius, GRIT, wger) and all library/
  font/service licenses. All code original; wger muscle diagrams & exercise
  images used under CC-BY-SA via wger's public assets/API.

**Verification**: `npm run build` ✓ · `npm test` ✓ (57 tests) · screenshots.

## 2026-06-10 — Realism pack v1.1 + UI de-slop + full docs

Added 20 features to make the journal feel like real paper and fit real daily
life, refined the UI away from a generic look, and wrote the full doc set.

**Features (see `docs/TICKETS.md` epics E/F/G)**
- Realism: dot-grid paper texture, handwriting font (Caveat), taped-in photos,
  page-turn animation, emoji stickers, rotating reflection prompts.
- Daily life: recurring tasks (daily/weekly), end-of-month migration flow with
  task threading, daily reminder + browser notification, opt-in weather +
  auto-location (open-meteo + reverse geocode), calendar (.ics) import, PWA
  install + offline (vite-plugin-pwa).
- Insight: correlation detection (Pearson sleep↔stress↔mood), 7-day rolling
  averages on charts, year-in-review, index of months.
- New `Plan` view (recurring + migration + ICS). New libs: recurrence,
  correlations, ics, prompts, weather, image.

**UI de-slop**
- Editorial serif titles (Fraunces), lucide line icons replacing emoji nav,
  active accent rail + `aria-current`, refined sidebar + serif wordmark.

**Verification**
- `npm run build` ✓ (80 KB gzip initial, recharts lazy) · `npm test` ✓ (44 tests)
  · polished screenshot captured.

**Docs**
- New: SECURITY, ACCESSIBILITY, FRONTEND_SPEC, TICKETS.
- Updated: PRD (§5b realism pack), ARCHITECTURE, FEATURES, README, Help.

**Decisions**
- All network features (weather/geocode) opt-in, off by default — preserves the
  zero-network local-first guarantee.
- Gender-based wellbeing tools remain opt-in.

## 2026-06-10 — Initial build (v1, local-first MVP)

Built `bujo`, a minimal local-first digital bullet journal, from an empty
directory to a published public repo in one session.

**Shipped**
- Scaffolded Vite + React 19 + TS; added Tailwind v4, Recharts, Vitest.
- Catppuccin Mocha (dark) + Latte (light) themes; subtle 3D depth utilities.
- Data model + `localStorage` store (`useReducer` + `useJournal()` context),
  forward-compatible `migrate()`.
- Pure logic libs (date, bullets, stats, storage, image, colors) — fully tested.
- Views: Today, Monthly, Trackers, Fitness, Collections, Insights, Cycle,
  NoFap, Help, Settings.
- Features from inspiration videos + web research: rapid logging, quick-capture
  grammar, gratitude, daily memory, location-per-month, habit dot-grid, mood/
  stress/sleep chart, fitness log, future log, birthdays, streaks, search,
  on-this-day, JSON/Markdown export-import.
- Gender-gated wellbeing tools: neutral cycle/temperature chart (female) and
  NoFap abstinence streak journal (male) — both opt-in, off by default.
- Image uploads (canvas-downscaled JPEG) on Today + Monthly; inline rename.
- Responsive shell, lazy-loaded chart views.

**Verification**
- `npm run build` ✓ · `npm test` ✓ · dev server screenshot captured.

**Docs**
- PRD, ARCHITECTURE, FEATURES, and three replication prompts.
