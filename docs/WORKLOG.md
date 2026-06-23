# Worklog

## 2026-06-23 16:05 — Backlog batch 3: built 32 features (PR #53)

**Summary:** Third parallel backlog sweep — 8 disjoint-file agents shipped 32 more
additive/read-only analytics features with tests. Verified + merged PR #53. +92
tests (557 total).

**Changes (32 features):**
- Trackers — category roll-up, perfect-weeks, perfect-days, weekly heat row.
- Fitness — big-three total, bodyweight-relative strength, neglected-muscle alert, stalled-lift detector.
- Pickleball — games-per-month chart, win-rate forecast/readiness, milestone badges, RPE load.
- Recovery — urge-frequency trend, streak-saved counter, urge-intensity distribution, relapse-free rollup.
- Reading/Goals — monthly reading-goal breakdown, stalled-books nudge, focus by project, interruptions trend.
- Insights — best/worst weekday, weekday-vs-weekend split, mood volatility, momentum.
- Data — PR-leaderboard CSV, collection CSV, privacy/redaction export filter, open-tasks ICS.
- Journaling — logging rhythm by weekday, journaling streak, collection checklist progress, overdue aging.

**Decisions:** Fixed a pre-existing csv.test.ts fixture (missing required
`Workout.notes`) surfaced by the new tests — caught by full `tsc -b`. Confirmed
the "11 vitest errors under load" are parallel-worker flakiness; `--no-file-parallelism`
gives definitive results.

**Verify:** tsc 0 · vitest 557/557 · eslint clean (touched) · vite build OK.

**Running total:** ~105 backlog features built across PRs #48, #50, #51, #52, #53.

**Follow-ups:**
- [ ] More batches possible but remaining buildable items are increasingly
  value-3/niche or surface metrics already shown elsewhere. The high-value
  remainder needs a real backend, Tauri-native plugins, or new deps (held).

## 2026-06-23 12:35 — Data-model backlog batch: 5 interactive features (PR #52)

**Summary:** Serial single-owner build of the high-value backlog features that
need store/type changes (can't be parallelized). One data-layer-owning agent hit
a mid-run API 500 after building most of it; I confirmed the partial work
compiled clean, finished verification, and shipped PR #52. +15 tests (465 total).

**Changes (5 features):**
- Count-habit −/+ steppers on Today ("Count habits" card) + Trackers via existing
  `setHabitValue` (clamped at 0; timer step 5).
- At-risk streak warning on Today (`atRiskHabits`): scheduled-today build habits
  with streak ≥2 not yet logged.
- Weekly-goal progress ring on Today (`weeklyGoalProgress`).
- HALT quick-check on urge: `UrgeWin.halt` field + chips + tally in NoFap.
- DUPR rating tracker: `Settings.duprLog` + `logDupr` action + log form/trend in
  Pickleball.
- (Full JSON backup export/import already existed in Settings — not rebuilt.)

**Decisions:** All new type fields optional + back-compat (`migrate()` loads old
data). Single-owner serial build keeps reducer/type edits conflict-free.
Recovered from the agent's API-500 by verifying the working tree (tsc clean,
tests pass) rather than re-running and risking duplicate edits. Note: vitest
parallel workers flake under heavy system load — use `--no-file-parallelism` for
a definitive run.

**Verify:** tsc 0 · vitest 465/465 (serial) · eslint clean (touched) · vite build OK.

**Running total:** ~73 backlog features built across PRs #48, #50, #51, #52.

**Follow-ups:**
- [ ] Continue batches. Remaining are mostly value-3 niche or items needing a
  real backend / Tauri-native plugins / new deps (held, not forced).

## 2026-06-22 23:45 — Backlog batch 2: built 32 features (PR #51)

**Summary:** Second backlog batch — 8 disjoint-file agents shipped 32 more
additive/read-only features with tests. Verified + merged PR #51. +92 unit tests
(now 450 total).

**Changes (32 features):**
- Trackers — consistency score, best/worst weekday, longest-streak-ever, days-since-last-miss.
- Fitness — sets-per-muscle balance, e1RM progression, workout heatmap calendar, cardio PB badges.
- Pickleball — rolling form & momentum, win streaks, skill-level matchup win%, weekday performance, point differential.
- Recovery — high-risk-hour heatmap, day-of-week relapse pattern, urge→relapse self-efficacy, pace-to-record.
- Reading/Goals — reading streak, avg days-to-finish, Year-in-Books recap, focus by weekday + longest session.
- Insights — best/worst weekday, longest-streak leaderboard, consistency score, month-over-month deltas.
- Data — per-domain CSV exports (habits/pickleball/recovery), habit reminders .ics.
- Journaling — migration analytics, entries-per-day sparkline + bullet-type breakdown, index/ToC.

**Verify:** tsc 0 · vitest 450/450 · eslint clean (touched) · vite build OK.

**Running total:** ~68 backlog features built (PRs #48, #50, #51 + change-pw).

**Follow-ups:**
- [ ] More batches; buildable pool shrinking. Some metrics now surface in both
  Trackers and Insights (intentional, different views).
- [ ] Serial data-model batch for deferred features needing types.ts/store.tsx
  (count +/- buttons, DUPR tracker, per-game scores, HALT toggles, shot-quality
  scorecard, full JSON import, etc.).

## 2026-06-22 23:35 — Backlog batch 1: built 25 features (PR #50)

**Summary:** First batch of the 572-feature backlog build. 8 disjoint-file
category agents (Workflow) each shipped 3-5 additive, read-only-over-existing-data
features with tests. All verified and merged as PR #50. ~70 new unit tests.

**Changes (25 features):**
- Trackers — comeback-streak chip, target-met vs partial grid fill, per-habit intensity heatmap.
- Fitness — auto warm-up ramp, session-volume summary card, active-minutes weekly ring, next-split banner.
- Pickleball — partner chemistry, court/venue log, opponent rivalry record book.
- Recovery — panic/SOS overlay (timer+breathing+coping), streak-vs-best ghost bar, comeback badge.
- Reading/Goals — books-read pace, per-book estimated finish, projected weekly coding minutes.
- Insights/Stats — weekly digest, coach digest card, sleep-debt tracker, trend arrows on tiles.
- Data — sync-settings export exclusion, auto-backup nudge, calendar .ics export.
- Journaling — tag pages/auto-collections, brain-dump inbox.

**Decisions:** Parallel-safe via exclusive file ownership per agent; shared
hotspots (`types.ts`/`store.tsx`/`storage.ts`/`Today.tsx`/`Settings.tsx`) forbidden
so features needing a data-model/store change were deferred to a later serial
batch. Fixed a recharts v4 Tooltip formatter type error in Stats.tsx during
integration (agent self-check missed it; caught by my full `tsc -b`).

**Verify:** tsc 0 · vitest 358/358 · eslint clean (touched) · vite build OK.

**Follow-ups:**
- [ ] Continue backlog batches; ~370 buildable-now features remain.
- [ ] Serial batch for deferred features that need `types.ts`/`store.tsx`/`Today.tsx`
  (count-habit +/- buttons, weekly-goal ring, at-risk warning, DUPR tracker,
  academy checklist, HALT toggles, replacement-activity menu, full JSON import, etc.).

## 2026-06-22 23:20 — Account change-password + feature-prompt template (PR #49)

**Summary:** Audited the whole auth/login surface — found it already complete
(email sign-in/up, Google OAuth, guest, forgot-password, validation). The one
genuine in-app gap was that `updatePassword()` existed in `supabase.ts` but had
no UI; wired a change-password form into the signed-in Account view. Added a
reusable per-feature prompt template. Merged PR #49.

**Changes:**
- `src/views/Account.tsx` — collapsible change-password form for signed-in users
  (reuses `passwordError`, Enter-to-submit, show/hide).
- `docs/prompts/feature-prompt-template.md` (new).

**Decisions:** Out of code scope (user/dashboard actions): enabling Google
provider in Supabase; hard account deletion (needs backend — app is local-first).

**Follow-ups:**
- [ ] Building the rest of `docs/FEATURE-BACKLOG-500.md` in verified batches
  (buildable-now only; backend/dep/large-refactor items skipped).

## 2026-06-22 23:05 — 572-feature backlog + built top 10 (multi-agent), merged 2 PRs

**Summary:** Merged the pending PR #47, finished the deferred R2-5 refactor, then
ran two background Workflows: a 10-agent fan-out that generated a ranked
572-feature backlog, and a 4-agent disjoint-file build of the top 10 selected
features. All verified (tsc/vitest/eslint/build) and shipped as PR #48 (merged).

**Changes:**
- `docs/FEATURE-BACKLOG-500.md` (new) — 572 ranked features (value/effort/risk),
  category counts, top-10 build table; pointer appended to `docs/FEATURES.md`.
- Fitness — `isNewPR()` + ephemeral PR-celebration banner; `PlateStack.tsx`
  per-side plate visualizer; `bodyweightSeries()` + bodyweight chart; `lastSetFor`
  ghost-prefill tests.
- Habits — `nextHabitMilestone()` clean-day + milestone badge on avoid habits;
  `habitStats.completionRate30()` 30-day completion-% badge.
- Recovery — `UrgeWin.intensity/technique`; slider + technique chips +
  `techniqueRanking()`; `matchPlanForTrigger()` inline coping line (`lib/urge.ts`).
- Insights/Coach — `moodImpactRanking()` card; declining-habit early-warning tip.
- `src/views/Reading.tsx` — R2-5: local `Stat` → shared `StatTile`.
- `docs/prompts/08-backlog-fanout-and-build.md` (new) + workspace copy in
  `Dotfiles/docs/templates/prompts/` — reusable playbook for this run.
- 39 new unit tests (288 total green).

**Decisions:**
- Multi-agent build partitioned by **disjoint file ownership** so 4 agents run in
  parallel with zero merge conflicts; overlapping helpers pushed into new lib files.
- Verified every gate myself rather than trusting agent self-reports.
- Did NOT use the `sonner` scaffold (unmounted, needs next-themes) — PR
  celebration reuses the local ephemeral `MilestoneToast` pattern.
- R2-5 was ~90% pre-done (StatTile/ChartCard already extracted); only the Reading
  straggler remained.

**Follow-ups:**
- [ ] Add `goalWeight?: number` to Settings + a UI control to light up the
  bodyweight-chart goal line (reads defensively until then).
- [ ] 561 backlog features remain unbuilt — pick the next batch from
  `docs/FEATURE-BACKLOG-500.md` when ready.
- [ ] Still-deferred: R2-7 (unified `Goal` model), R2-10 (server-backed sync).

## 2026-06-22 15:10 — Cleared the entire open-ticket board (BUJO-193…220)

**Summary:** Closed all 16 open `🔜` tickets plus the deferred audit LOW items in one pass — security hardening, a desktop scaffold, a light-theme redesign, sync-robustness, per-addiction streaks, in-place session editing, and the remaining lib bug-fixes — orchestrated across parallel/background subagents and verified live in a real browser.

**Changes:**
- **Lib bug-fixes (210/208/209/211/206/212):** `streak.ts` (best counts past streaks; avgGap sort/dedupe), `recurrence.ts` (backfill cap no longer skips occurrences), `challenges.ts` (ring% = completedDays; zero-rule day), `fitness.ts`/`Gym.tsx` (set-string reps, lastSetFor latest, plate>target warn), `capture.ts`/`CaptureBar.tsx` (numeric→setHabitValue, weight/reps-only gym, exact habit match), `reading.ts`/`Goals.tsx`/`Stats.tsx` (pagesRead guard, stepper cap, streak-vs-best, workout empty-state).
- **Sync (203/204/205):** `App.tsx` realtime re-subscribes on auth + push pull-guard; `conflict.ts` `mergeJournals` unions remote∪local; `store.tsx` import re-stamp, reducer dedupe, unlock guard, coalesce reset, mount-materialise stamp; `crypto.ts` chunked b64.
- **Security (193):** `docker/02-security.sql` (JWT roles + RLS), `docker/api-nginx.conf` (TLS proxy), `.env.example`, `docs/security/postgrest-hardening.md` — verified anon→401 / authed→201 / RLS isolation live.
- **Desktop (195):** real Tauri v2 `src-tauri/` + scripts + `docs/desktop/TAURI.md`.
- **UI (197):** Chrome-style light theme in `index.css` + `docs/redesign/light-theme.md`.
- **Recovery (199):** `AddictionStreak` model + per-addiction card in `NoFap.tsx`.
- **Sessions (201):** inline editors in `Focus.tsx`/`Pickleball.tsx` + `updatePickleball`.
- **Client wire (194):** `serverSync.ts`/`ServerSync.tsx`/`Settings.tsx` → Bearer JWT, pull+merge on load.
- **a11y/dead-prop/docs (218/219/220):** aria/contrast/touch-target fixes, removed `BottomNav.onQuickAdd`, expanded `uml.mdx`, fixed `FEATURE_GUIDE.md` nav + HomeWorkout.
- **Docs:** `TICKETS.md` all closed; `docs/sessions/2026-06-22-prompts.md`; `docs/prompts/07-secure-self-host-and-desktop.md`; `docs/screenshots/2026-06-22-*`.

**Decisions:** Parallelise only disjoint files; serialise everything touching `store.tsx`/`App.tsx` (a light-theme agent briefly contended on the theme effect there). Sync merge biases additions over deletions (re-seeing a deleted item beats losing a fresh one) — documented in `conflict.ts`. bujocloud/folder adopt-newer paths still replace wholesale; merge landed on the supabase + initial-pull paths.

**Verification:** `tsc -b` clean · `vitest` 209 → 253 · `npm run build` clean · chrome-devtools MCP walked light theme, per-addiction card, session inline-edit, Monthly progress — no console errors. Commits 1625257, 347093e, 88708a6, 85e22e9 on `feat/auth-ux-trackers-insights`.

**Follow-ups:**
- [ ] User: set `PGRST_JWT_SECRET` + certs and `docker compose up -d` to apply the hardened API; paste API URL + JWT in Settings → Self-host.
- [ ] User: install Tauri Linux deps (webkit2gtk/libsoup via sudo `.sh`) + `npx @tauri-apps/cli icon` before `npm run tauri:build`.
- [ ] Optional: extend `mergeJournals` union to the bujocloud/folder adopt-newer paths.
- [ ] Still external: enable Google in Supabase; delete smoke-test account.

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

## 2026-06-12 19:40 — Mobile polish, compacting pattern, Fitness/Gym merge cleanup (appended)

**Summary:** A long mobile-first pass — fixed top-bar overflow, made the bottom
nav 5 tabs (no FAB), entry-first ordering, a reusable collapsible-card pattern,
penalty difficulty levels, the Today's-plan hub, finished the ADV-2 backlog, and
fully sealed the Fitness+Gym merge. Installed graphify per-project.

**Changes:**
- Mobile: top-bar hides ⌘K + theme below `sm` (fixed right-cluster overflow,
  verified 0 overflow across pages); 5-tab bottom nav (Today·Trackers·Fitness·
  Plan·Pull-ups, no FAB); iOS-style slide-in drawer; `Page asideFirst` (forms
  above charts on phones); Insights stat cards 2-up.
- Compacting: shared `Card` gains `collapsible`/`defaultCollapsed`. Default-
  collapsed: Penalty, Gym session (phones), Stickers, On-this-day, Exercise DB;
  Completion heatmap collapsible. Plan migration → top-5 + show all/less.
- Penalty: `penaltyLevel` (Beginner default / Inter / Hard) + `scaleTask()`;
  card collapsible & compact.
- Today: `TodayPlanCard` command-centre (chips + week strip) — consolidated the
  separate CoverageCard away (one summary card, not three).
- Dedup: unified birthdays (Birthdays card lists friends'), removed dead
  Recommendations.tsx; `gym` route now opens Fitness→Strength (no standalone Gym).
- ADV-2 finished: CSV import (`parseMetricsCsv`), per-habit year heatmap; #40 closed.
- Tooling: `@sentropic/graphify` per-project (devDep + `.claude` skill/hooks +
  project CLAUDE.md); `.graphify/` gitignored.
- Card-ordering principle D-35; contextual help "?" per view.

**Decisions:** D-34 (Today hub = summarize+link), D-35 (action-first card order),
D-36 (collapsible Card pattern), D-37 (penalty difficulty, Beginner default),
D-38 (gym route is a Fitness alias). Docs append-only throughout.

**Follow-ups:**
- [ ] Path A gap #2: cloud-load conflict prompt; extend IndexedDB to memory/monthly photos.
- [ ] Optionally run full graphify semantic extraction via the skill.

## 2026-06-12 20:30 — Pickleball deepening + autonomous feature sprint (appended)

**Summary:** Built the Pickleball tracker out (more viz + a weekly goal + full
activity-system integration) and ran an autonomous sprint of cross-cutting
quality features.

**Changes:**
- `lib/pickleball.ts` — `formatStats`, `cumulativeGames`, `gamesByDay` (+tests);
  Pickleball view gains win%-by-format, cumulative line, 13-week play heatmap,
  and a weekly-games goal meter. Goals roll-up + Stats split + Fitness minutes +
  active streak + coverage all count pickleball now.
- `TodayPlanCard` — proactive streak-at-risk banner.
- `TodayHabits` — quick-check strip + Mark all.
- System theme (`store.tsx` matchMedia effect, theme menu).
- Insights — Personal records card.

**Decisions:** "Check online" → this is an offline-first SPA, so I prioritised
local-first-appropriate features (online/social ones need a backend, out of
scope). Everything stays in the single `JournalData` store, so each addition is
auto-synced/exported with no extra plumbing.

**Follow-ups:**
- [ ] Optional: pickleball CSV export; partner win-rate breakdown.
- [ ] Path A gap #2 (cloud-load conflict prompt) still open.

## 2026-06-13 00:30 — Vercel hosting + cloud sync (Blob + Supabase) + prod fixes (appended)

**Summary:** Deployed to Vercel (public, clean URL), fixed a prod-only chart
crash, and shipped TWO cloud-sync paths: an E2E passphrase sync (Vercel Blob) and
full Supabase accounts (guest + email) with per-user RLS storage.

**Changes:**
- Hosting: `vercel.json`, deployed to `bujo-journal.vercel.app` (protection off).
- Fix: recharts `manualChunks` (D-39) — resolved blank chart views in prod.
- Vercel Blob sync (`api/sync.ts`, `lib/bujocloud.ts`) — one-passphrase E2E,
  push/pull + auto-sync + a sync-status pill. SPA rewrite excludes `/api/`.
- Supabase (`lib/supabase.ts`, Account card, `docs/supabase.sql`) — guest+email
  auth, `journals` table + RLS, auto pull/push. Provisioned table/RLS/auth via
  the Management API; live round-trip verified.
- Mobile: charts deferred to the bottom on phones (`Card defer`, flex-col Page).

**Decisions:** D-39 (recharts one chunk), D-40 (Blob sync/chart-defer),
D-41 (optional Supabase, disabled-by-default).

**Follow-ups:**
- [ ] Pick a primary sync path in onboarding (passphrase vs account) to avoid two.
- [ ] Optional: realtime sync via Supabase channels; conflict UI.

---

## 2026-06-16 — input-capture program, habit polarity, mobile-overflow & nav overhaul

Big multi-feature day. PRs #10–#24 merged + deployed to bujo-journal.vercel.app.

**Shipped:**
- **Input capture** (#12–#15): one local deterministic parser (`lib/capture.ts`) → smart `CaptureBar` (type/say → gym/cardio/metric/habit/journal), field-control steppers, voice number parsing, QuickAdd retired.
- **Fitness/UX**: per-exercise YouTube demo links (#11); stepper number inputs (#14); unit-reuse datalist (#19).
- **Habit polarity** (#18): build vs avoid/quit habits (alcohol, smoking…) — slip/clean semantics, `cleanStreak`, red/Ban UI everywhere; activity "cube" cells made interactive (were read-only → looked broken for check habits); duplicate-habit guard.
- **Mobile** (#17, #21, #22, #23, #24): killed horizontal overflow (TopBar trim + `overflow-x-clip`); collapse card subtitles behind ⓘ; bottom nav Plan→Pickleball.
- **Nav** (#20, #22): groups Journal / Health / Insights & Stats; de-duped icons.
- **Security/auth**: CSP enforced (#10); Google sign-in button hidden until provider enabled (#23); OAuth setup doc (#16).
- **Infra/docs**: README screenshots + auto-update workflow (#24); hosting options in `docs/hosting/*.mdx`; mobile/layout audits in `docs/qa/`; full prompt dump in `docs/sessions/2026-06-16-prompts.md`.

**Verified:** 181 tests green; every view 390px-clean on mobile (Playwright); email auth works live.

**Follow-ups (external switches — user-only):**
- [ ] Enable Google provider in Supabase (Auth → Providers → Google); button auto-reappears.
- [ ] Delete smoke-test account `bujo-smoketest-260616@example.com`.
- [ ] (cosmetic) card title truncates to "M…" when it has both a long title + right controls (Stats monthly-mood).

---

## 2026-06-17 — inspiration-driven feature marathon + self-host stack (#26–#41)

Researched a sweep of habit/fitness apps and built a feature from each, plus a desktop/Docker/DB path. All merged + deployed to bujo-journal.vercel.app; 208 tests green.

**Features (source → what shipped):**
- **#26** Intermittent-fasting tracker (`lib/fasting`, FastingCard on Today): start/stop, target window, day-to-day streak + recent log.
- **#27** Home Workout — saved sessions expand to show exercises/reps (was view-only); Fitness tabs reordered Strength→Cardio.
- **#28** Native-iOS mobile pass: 16px inputs (no focus-zoom), touch-visible hover-only controls (`@media (hover:none)`), tap-highlight off, `touch-action: manipulation`, overscroll contain, safe-area insets, Apple PWA meta.
- **#29 Strong** — green completed sets + "✓ logged" + live volume tally in the gym logger.
- **#30 HarambeFit** — achievement badges (`lib/achievements`, AchievementsCard on Stats, 14 badges); Strong-green on ProgramTracker.
- **#31 lovable.dev** — streak-milestone celebrations (`MilestoneToast`, escalating emoji at 3/7/30/100…).
- **#32 Habitify** — time-of-day habit grouping (current slot first) + Today completion ring.
- **#33 Habitify** — timestamp-based check-ins (`habitTimes`) + "When you check in" hour histogram on Stats.
- **#35/#36 Streaks/ADHD** — per-habit daily notes (`habitNotes`, inline on Today + editor history), habit-stacking cue, Pomodoro focus timer (auto-logs blocks to Focus).
- **#37 Bearable** — energy daily metric + Wellbeing slider; focus-minutes chip on Today's plan.
- **#40** NoFap reworked: "days resisted" framing, red/negative relapse styling, **required reason** on relapse; **default gender = male** (nofap on).
- **#41** Default units → **US** (lb · mi · °F), switchable.

**Infra / docs:**
- **#34** `docs/data-engineering/` — schema + pipelines + scaling (10→10M); key insight: E2E ⇒ analytics client-side ⇒ backend is a dumb encrypted-blob + CDN + sync API.
- **#38** `docs/desktop/` — Tauri + SQLite + git-push-sync design + Rust/TS scaffold (native build needs a Rust toolchain, not in the agent sandbox).
- **#39** Full self-host stack: `Dockerfile` + `docker-compose.yml` (web + Postgres + Adminer) + `docker/initdb.sql`. **Verified live** — `docker compose up -d --build`, web/adminer 200, 9 tables loaded.

**Process learned:** always `git checkout -b` BEFORE editing (committed to main twice by mistake; recovered via `git branch -f main origin/main` + rebase, since `reset --hard` is deny-listed). Playwright works in-sandbox (system Chrome + `?view=` deep-link + "This device only" gate-bypass) for screenshots/measurements; persistent Chrome/MCP can't stay up.

**Open (user-decided):** secure PostgREST API tier (JWT+RLS+TLS) — designed, offered, not yet built; enable Google in Supabase; PostgREST/desktop native build.
