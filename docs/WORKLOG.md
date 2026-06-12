# Worklog

## 2026-06-12 15:20 — Advanced views: Goals, tracker viz, motion, Friends

**Summary:** Added a cross-view Goals roll-up, four new Trackers visualizations,
page motion, and a privacy-safe Friends/contacts collection with opt-in GitHub
enrichment — then a full docs + prompt-template pass. All on `main`, 113 tests green.

**Changes:**
- `views/Goals.tsx` (+nav/chrome) — read-only roll-up of habit weekly goals,
  fitness minutes, challenges, program days, streak; tap to jump.
- `views/Trackers.tsx` + `lib/stats.ts` (`dayCompletion`, `weekdayConsistency`,
  `monthlyCompletion`, tested) — 13-week completion heatmap, streak leaderboard,
  weekday-consistency and monthly-trend charts.
- `lib/exerciseInfo.ts` (earlier), Gym/Cycle chart aria-labels (R2-11 complete).
- `index.css` + `shell/Page.tsx` — `.page-enter` staggered entrance + 3D hover/press,
  all behind `prefers-reduced-motion`.
- `components/FriendsCard.tsx`, `lib/enrich.ts`, `Friend` type + store actions —
  manual contacts with opt-in GitHub public-profile pull (official API).
- Mobile bottom-nav merged to `main` (PR #3).
- Docs — FEATURES/DECISIONS (D-31..33)/DATA_MODEL/TICKETS (Epic ADV + 20-item
  plan) updated; new prompt `docs/prompts/06-add-visualization.md`.

**Decisions:** Contact enrichment is consent-based only (official GitHub public
API) — explicitly rejected web-scraping/people-search (ToS, privacy, CORS).
Goals is a derived roll-up (no new schema). Motion is OS-controlled, not an app toggle.

**Follow-ups:**
- [ ] Epic ADV-2: the documented 20 advanced features/charts (nutrition trends,
  macro rings, year-in-pixels, CSV export, weekly-review wizard, …).
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions).

## 2026-06-12 13:56 — PDF coaching content + mobile + hosting (16 features)

**Summary:** Read the four workout PDFs and turned them into trackable app
content, then cleared a long stream of UX asks — all merged to `main`, with the
mobile view on its own branch and a GitHub Pages deploy wired up.

**Changes:**
- `lib/programs.ts` — encoded a generic 12-week/3-phase hypertrophy program, the
  pull-up workout-format library, and progression exercises (PDF stays gitignored;
  no personal data).
- New **Pull-ups** view (`views/Pullups.tsx`, nav + viewChrome) — program tracker,
  ability calculator/ladder, workout library, progressions. Pull-up cards moved
  out of Gym; `ProgramTracker` extracted (`only` scope prop) so Gym keeps hypertrophy.
- `components/ProgressPhotos.tsx` + `ProgressPhoto` type/store actions — dated
  physique photos with first-vs-latest compare.
- `lib/penalties.ts` (+test) + `PenaltyCard` — 300-drill anime-style penalty
  catalogue, severity from skipped habits/tasks/challenges, on Today.
- `lib/foods.ts` (+test) — American+Indian food DB → macro auto-sum in the
  Nutrition card, sample-day fill, online-lookup link.
- `lib/exerciseInfo.ts` (+test) — form-cue + injury-watch per exercise in the Gym
  anatomy card.
- `lib/speech.ts` + `MicButton` — Web Speech dictation on quick-add.
- Fitness compact 6-tile metrics + history on the right; Settings denser unit grid
  + data-summary; Stats clearer mood calendar; Plan migration sort + priority star.
- `components/ui.tsx` — shared `StatTile` (compact variant) + `ChartCard`; chart
  a11y labels; accent picker (earlier).
- `index.css` — `prose-doc` GitHub-pages typography; Help expanded.
- `shell/BottomNav.tsx` (branch `feat/mobile-view`) — mobile bottom tab bar + FAB.
- `.github/workflows/deploy.yml`, `docs/DATA_MODEL.md` — static hosting + schema map.

**Decisions:** Personal coaching PDF encoded as *generic* training structure only
(no name/coach/stats); PDF gitignored. Pull-up program lives in the Pull-ups view,
hypertrophy in the Gym, via one shared `ProgramTracker` scoped by `only`. Merged
the 88-commit stack to `main` by fast-forward; mobile kept on its own branch per
request. Nutrition "web calc" = offline DB + search link (a live USDA API needs a key).

**Follow-ups:**
- [ ] Enable GitHub Pages: Repo → Settings → Pages → GitHub Actions.
- [ ] Open/merge the `feat/mobile-view` PR when ready.
- [ ] Optional: live food-macro API; server-backed sync (R2-10) still out of scope.

## 2026-06-12 02:14 — R2 backlog autonomous run (7 of 11 shipped)

**Summary:** Worked the R2 roadmap end-to-end without checkpoints, per the
"do all, don't wait" directive. Shipped 7 items, scoped 1 partial, and left 3
honestly flagged as too large/infra-dependent to rush.

**Changes:**
- R2-1 — `lib/crypto.ts` (PBKDF2→AES-GCM), `LockScreen.tsx`, `store.tsx`
  encrypt-on-save + unlock gate, Settings passcode card. Wrong passcode throws,
  never wipes (verified in-browser round-trip).
- R2-2 — Monthly per-day habit-completion ribbon on calendar cells.
- R2-3 — Insights stat cards / Index / search results now nav to their source
  (`useNav` + cursor); `Card` gained `onClick`.
- R2-4 — Stats activity-heatmap range picker (3/6/12 mo).
- R2-6 — Drag-to-reorder habits within a category (native HTML5 DnD on a hover
  grip, rewrites the `order` field).
- R2-8 — `reminderMessage()` picker (streak-at-risk › challenge-day › plain
  nudge) drives the banner + one OS notification/day; 4 unit tests.
- R2-9 — Accent-color picker (Settings → Journal feel) overrides `--primary`
  app-wide via a store effect + `settings.accent`.
- R2-11 — ◑ partial: `role="img"` + `aria-label` text alternatives on the key
  Stats/Trackers/Focus/Fitness chart figures.
- Docs — TICKETS/DECISIONS/FEATURES updated; 99 tests green, build ~360ms.

**Decisions:** Stopped short of half-building the big ones. R2-5 (StatTile/
ChartCard extraction) is a wide refactor better done deliberately; R2-7 (unified
goal model) needs real design; R2-10 (accounts + E2E cloud sync) needs a backend
and is out of local-first scope — R2-1's at-rest crypto is its client half.
axe-core CI deferred (needs CI wiring).

**Follow-ups:**
- [ ] R2-5 — extract shared `StatTile`/`ChartCard` primitives.
- [ ] R2-7 — design + build the cross-view `Goal` system.
- [ ] R2-10 — decide if a sync backend is in scope; if so, spec it.
- [ ] R2-11 tail — full chart a11y sweep + axe-core CI job.

## 2026-06-11 21:30 — Finished V3 backlog (RPE/type · task sync · actuals)

**Summary:** Cleared the last three deferred tickets on `feat/v3-smart-input`.
94 tests green.

**Changes:**
- **V3-I** — per-set RPE input + set-type toggle (warmup/working/drop) in the Gym
  logger; persisted on `WorkoutSet`. Body-weight & training-volume charts now
  side by side.
- **V3-B** — `updateRecurrence` propagates text/type/important to a rule's future
  open occurrences; removing a rule clears its future instances; EntryRow shows a
  ↻ badge; Plan view can edit a rule inline.
- **V3-J** — program days get per-exercise checkboxes **and** an "actual" field
  (`programActuals`) to record reps/sets achieved vs prescribed.

## 2026-06-11 20:30 — Gym v3 build-out + space UX + PDF programs

**Summary:** Implemented the Gym backlog + space-saving shell changes on
`feat/v3-smart-input`. 94 tests green.

**Changes:**
- **Quick exercise picker** (V3-G) — searchable dropdown (recents + library +
  custom) on set rows AND the anatomy lookup.
- **Volume + progression charts** (V3-H) — weekly training-volume bars +
  per-exercise progression line (`workoutVolume`/`weeklyVolumeSeries`/
  `exerciseProgression`).
- **Partial completion** (V3-J) — per-exercise checkboxes in a program day;
  the day auto-completes when all are checked.
- **Training programs from the PDFs** (V3-K) — `lib/programs.ts` pull-up program
  + **ability/training-set calculator** (max pull-ups → group, ladder/pyramid,
  daily/weekly volume); program exercises added to the library. Source PDFs
  gitignored (PII + copyright).
- **Space UX** (V3-L) — auto-hide sidebar (edge-hover reveal, full-width content)
  + recommendations as a top-bar lightbulb badge.
- **Plate calculator** (V3-M) — unit-aware plates + remount on unit change
  (fixed the stale-kg bug).
- Deleted the personal PDF from disk (user-authorised; was already gitignored).

**Follow-ups:** V3-I (per-set RPE/type inputs); V3-J actuals (reps achieved vs
prescribed).

## 2026-06-11 19:00 — Gym redesign + training programs + structured sets + V3 epics

**Summary:** Continued v3 on `feat/v3-smart-input`. Shipped smart input,
Focus tracker, tracker viz, recommendations (PR #2), then a Gym overhaul:
2-column dashboard, plate calc, training programs from a PDF, structured sets.
94 tests green; 127 KB gzip.

**Changes:**
- **Gym redesign** — reflowed to a `Page` main+aside dashboard (utility cards in
  the rail); routines click-to-load.
- **Training programs** — `lib/programs.ts` encodes the pull-up program;
  `ProgramCard` (week/day selector, load-into-session, day tracker). Source PDFs
  **gitignored** (`docs/pdf/` — keeps a personal PDF + copyrighted programs out).
- **Structured sets** — `Workout.setRows` + helpers (`lastSetFor`,
  `sessionVolume`, `exerciseProgression`, tested); written on finish; per-row
  previous-session + live-1RM hints.
- **Plate calculator** — unit-aware plate denominations (kg vs lb) — bug fix.
- **Units audit** — confirmed kg/lb · km/mi · °F/°C all read the Settings toggle
  in Gym + Fitness; no hardcodes.
- Earlier in the day: V3-A smart input, V3-C Focus, V3-D viz, V3-E recommendations.

**Decisions:** programs as data not PDFs (D-26); additive `setRows` (D-27);
unit-aware plates (D-28).

**Follow-ups (TICKETS Epic V3):**
- [ ] V3-G quick exercise picker (dropdown/combobox per row)
- [ ] V3-H structured charts (volume + progression)
- [ ] V3-I per-set RPE/type inputs
- [ ] V3-J partial completion (per-exercise within a program day + actuals)

## 2026-06-11 17:06 — Layout redesign + Challenges + Trackers/Fitness v2

**Summary:** Major usability redesign of the whole app on a new shadcn/ui
substrate (re-themed to Catppuccin), then a new Challenges feature and v2
enhancements to Trackers and Fitness. 77 tests green; initial JS 120 KB gzip
(budget 200). Branch `feat/layout-redesign`.

**Changes:**
- `components/shell/*` — new app shell: `AppShell`, `Sidebar`, sticky `TopBar`
  (title + hoisted date-nav + quick-add + ⌘K + overflow menu), shared
  `DateCursor` context, `viewChrome` registry, `Page` grid primitive.
- `components/ui/*` + `lib/cn.ts` — shadcn primitives; `index.css` maps shadcn
  semantic vars onto Catppuccin (Latte inherits). `ui.tsx` wraps shadcn + adds `Segmented`.
- All 13 views reflowed onto `Page`/max-width; Today is a dashboard; floating
  undo/redo + zoom moved into the top bar.
- Top bar: dedicated theme button + Settings gear; Help in ⋯ menu; System group
  removed from the sidebar. Settings is now tabbed.
- **Challenges** — new view + nav item (Health): `Challenge` model +
  `challengeLog`, `lib/challenges.ts` (presets + whole-number progress helpers),
  store actions, day-grid + strict reset.
- **Trackers v2** — today focus strip, presets, emoji + weekly-goal, detail
  drawer (streak/30-90%/day-of-week/skip). New `Habit` fields + `habitSkips`.
- **Fitness v2** — weekly goal ring, 8-week sparkline, active streak,
  this-week/all-time totals, cardio PBs, auto-pace, edit + repeat-last.
- Docs: `docs/redesign/*.mdx`, spec + 2 plans under `docs/superpowers/`,
  updated FRONTEND_SPEC/ARCHITECTURE/FEATURES/DECISIONS/TICKETS/Help.

**Decisions:** shadcn wrapped gradually (no big-bang rewrite); date-nav hoisted
via a shared cursor; one control vocabulary (Switch/Segmented); challenge &
fitness analytics use inline SVG/CSS (no Recharts) to protect the bundle;
challenge/streak progress shown in whole numbers, never fractions.

**Follow-ups:**
- [ ] Gym v2 (structured per-set model, volume/progression charts) — scoped,
  deferred (plan Phase D).
- [ ] 2026-06-11 PM backlog: dev-time tracker, command-completion input
  suggestions, duplicate-detection badge, cross-place task sync, richer
  tracker/challenge visualizations — see `docs/prompts/`.

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

## 2026-06-12 16:40 — ADV-2 charts + coverage + CSV + Path-A start (appended)

**Summary:** Built 8 of 10 planned advanced charts, the daily-coverage summary,
per-section CSV export, and the first Path-A item (storage-quota guard + gaps doc).

**Changes:**
- Stats — mood-by-weekday, workout-split donut, year-in-pixels (helpers
  `moodByWeekday`/`workoutSplitCounts`, tested).
- Focus — cumulative coding-hours line (inline SVG). Gym — body-weight 7-day
  moving average, session RPE trend. Nutrition — 14-day calorie trend + macro rings.
- `lib/coverage.ts` + `CoverageCard` — yesterday done/missed + 7-day status (tested).
- `lib/csv.ts` + Settings buttons — entries/habits/metrics/workouts CSV (tested).
- `docs/PRODUCT_GAPS.md` — Path A roadmap; Settings storage-quota meter/guard.

**Decisions:** Path A (local-first + own-cloud) chosen over a backend. Per-habit
year heatmap and PR timeline deferred (existing drawer heatmap + PR card cover them).
Docs are append-only going forward (saved to memory).

**Follow-ups:**
- [ ] ADV-2 features: print/PDF, Insights filters, weekly-review wizard,
  configurable Today dashboard, tag manager, quick-add templates, CSV import.
- [ ] Path A: IndexedDB photo store; `updatedAt` + cloud-load conflict prompt; onboarding.

## 2026-06-12 18:30 — ADV-2 finish + Fitness/Gym merge + Path-A start (appended)

**Summary:** Finished the ADV-2 feature backlog, merged Fitness+Gym into one
tabbed hub, verified the mobile view in Chrome, and started Path A (IndexedDB
image store + onboarding).

**Changes:**
- Features — tag manager, print/PDF, quick-add templates, archived-habits browser,
  friend birthdays, Insights search filters, configurable Today dashboard, guided
  weekly review (CSV import deferred).
- `views/FitnessHub.tsx` — Cardio | Strength tabs over the shared workout store;
  dropped the duplicate Gym nav item (Gym lazy-loads per tab, still deep-linkable).
- `lib/imageStore.ts` + ProgressPhotos — IndexedDB photo offload (back-compat),
  export inlines images. `views/Welcome.tsx` — sample-journal onboarding path.
- Docs — `FEATURE_GUIDE.md` (full manual), PRODUCT_GAPS progress, append-only.

**Decisions:** Merged Fitness+Gym (tabs) per user pick. Photos → IndexedDB to lift
the localStorage ceiling; kept inline-on-export for portable backups. Verified
mobile in Chrome via the devtools MCP (no console errors).

**Follow-ups:**
- [ ] Path A gap #2: `updatedAt` + cloud-load conflict prompt.
- [ ] Extend IndexedDB offload to memory/monthly photos.
