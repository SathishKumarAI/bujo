# Feature Tickets — from inception to now

Backlog/changelog of every feature ticket, by epic. Status: ✅ done · 🔜 planned.
IDs are stable references for commits and PRs.

## Epic A — Foundations & rapid logging

| ID | Title | Status |
|---|---|---|
| BUJO-1 | Scaffold Vite + React 19 + TS + Tailwind v4 | ✅ |
| BUJO-2 | Catppuccin Mocha theme tokens + global styles | ✅ |
| BUJO-3 | `JournalData` model + `localStorage` store (`useJournal`) | ✅ |
| BUJO-4 | Forward-compatible `migrate()` loader | ✅ |
| BUJO-5 | Rapid-logging bullets (task/event/note + status lifecycle) | ✅ |
| BUJO-6 | Quick-capture grammar (`t/e/n/*/^`, `#tags`) | ✅ |
| BUJO-7 | Click-to-cycle task status; important/memory signifiers | ✅ |

## Epic B — Spreads (from the inspiration videos)

| ID | Title | Status |
|---|---|---|
| BUJO-10 | Today view: daily log + gratitude + daily memory | ✅ |
| BUJO-11 | Wellbeing sliders: mood/stress/sleep (0–10) + fast-break | ✅ |
| BUJO-12 | Monthly calendar: event dots + location + goals + photo | ✅ |
| BUJO-13 | Habit/intake dot-grid tracker (categories, 30-day %) | ✅ |
| BUJO-14 | Mood·stress·sleep line chart | ✅ |
| BUJO-15 | Birthday list | ✅ |

## Epic C — Tracking & analytics

| ID | Title | Status |
|---|---|---|
| BUJO-20 | Streaks (current + longest) | ✅ |
| BUJO-21 | Task-completion stats | ✅ |
| BUJO-22 | Full-text search across all data | ✅ |
| BUJO-23 | "On this day" flashbacks | ✅ |
| BUJO-24 | Fitness workout log (duration/distance/cal/RPE/sets) + totals | ✅ |
| BUJO-25 | Correlation insights (Pearson sleep↔stress↔mood) | ✅ |
| BUJO-26 | 7-day rolling-average overlays on charts | ✅ |
| BUJO-27 | Year-in-review summary | ✅ |
| BUJO-28 | Index of all months with data | ✅ |

## Epic D — Gendered wellbeing (opt-in)

| ID | Title | Status |
|---|---|---|
| BUJO-30 | Profile/gender setting → feature gating | ✅ |
| BUJO-31 | Neutral cycle / basal-temperature chart + flags (female default) | ✅ |
| BUJO-32 | NoFap abstinence streak journal: counter, milestones, relapse log (male default) | ✅ |

## Epic E — Productivity / method-complete

| ID | Title | Status |
|---|---|---|
| BUJO-40 | Recurring tasks/events (daily/weekly) auto-populate | ✅ |
| BUJO-41 | Migration flow for overdue open tasks (→today/→tomorrow/drop) | ✅ |
| BUJO-42 | Task threading (`originId`) on migrate | ✅ |
| BUJO-43 | Calendar (.ics) import → events on monthly | ✅ |
| BUJO-44 | Daily reminder + browser notification | ✅ |

## Epic F — Realism / journal feel

| ID | Title | Status |
|---|---|---|
| BUJO-50 | Dot-grid paper texture mode | ✅ |
| BUJO-51 | Handwriting font option (Caveat) | ✅ |
| BUJO-52 | Taped-in photo styling (rotation + washi tape) | ✅ |
| BUJO-53 | Page-turn view animation (reduced-motion aware) | ✅ |
| BUJO-54 | Emoji stickers / washi decorations per day | ✅ |
| BUJO-55 | Rotating daily reflection prompts | ✅ |
| BUJO-56 | Weather + auto-location per day (opt-in) | ✅ |

## Epic G — Quality-of-life / UX

| ID | Title | Status |
|---|---|---|
| BUJO-60 | Image upload (auto-downscaled JPEG) on Today + Monthly | ✅ |
| BUJO-61 | Inline rename for habits | ✅ |
| BUJO-62 | Responsive layout (mobile top-bar + collapsible nav) | ✅ |
| BUJO-63 | 3D depth styling on cards/buttons | ✅ |
| BUJO-64 | Light (Latte) + dark (Mocha) theme toggle | ✅ |
| BUJO-65 | In-app Help guide | ✅ |
| BUJO-66 | UI de-slop: editorial serif titles + lucide icons + accent rail | ✅ |
| BUJO-67 | PWA install + offline app shell | ✅ |
| BUJO-68 | Command palette (⌘/Ctrl-K): jump to view + run actions | ✅ |
| BUJO-69 | Open-book frame (spine + page edges) — natural book flow | ✅ |
| BUJO-70b | Custom free-form collections (create / open / add bullets) | ✅ |
| BUJO-71b | Demo/sample data loader + `?demo=1` deep link | ✅ |
| BUJO-72b | README landing: comparison table + "why different" | ✅ |
| BUJO-73 | Stats view: heatmap, radar, scatter, bars, donut, mood calendar, tag cloud | ✅ |
| BUJO-74 | Zoom in/out control + hover-zoom on images | ✅ |
| BUJO-75 | Deep links: `?view=` and `?demo=1` | ✅ |

## Epic J — Fitness / gym (GRIT + wger inspired)

| ID | Title | Status |
|---|---|---|
| BUJO-100 | Dedicated Gym tab (separate from cardio Fitness) | ✅ |
| BUJO-101 | Push/Pull/Legs split selector + next-day suggestion | ✅ |
| BUJO-102 | PPL preset routines + save/load custom routines | ✅ |
| BUJO-103 | Structured set logging (exercise/weight/reps) | ✅ |
| BUJO-104 | Personal records (auto from logged sets) | ✅ |
| BUJO-105 | Body-weight tracking + chart | ✅ |
| BUJO-106 | Muscle map: front/back figure highlighting worked muscles | ✅ |
| BUJO-107 | wger exercise database browser (search + images, public API) | ✅ |
| BUJO-108 | Nutrition / macro diary (calories + protein/carbs/fat) | ✅ |
| BUJO-109 | Credits + references (CREDITS.md, README references) | ✅ |
| BUJO-110 | Fix wger search (endpoint removed) → catalogue fetch + cache | ✅ |
| BUJO-111 | Muscle diagram reacts to logged exercises (union) + PR focus | ✅ |
| BUJO-112 | Per-set-row focus toggle drives the muscle map (current lift) | ✅ |
| BUJO-113 | Exercise detail modal: large image + exact wger muscles + add | ✅ |
| BUJO-114 | Professional lucide icons app-wide (replace emoji) | ✅ |
| BUJO-115 | Sticky sidebar — stays static while content zooms/scrolls | ✅ |
| BUJO-116 | Full production-grade symbol sweep (fast-break, review, milestones) | ✅ |
| BUJO-117 | Global weight unit (kg / lb) setting, used across Gym & body metrics | ✅ |
| BUJO-118 | Single-exercise anatomy view: look up any exercise → front/back muscle map | ✅ |
| BUJO-119 | Exact wger muscles for focused exercise (when cached) + video clip + YouTube link | ✅ |
| BUJO-120 | Pipeline nav: group sidebar into Journal / Health / Review / System | ✅ |
| BUJO-121 | Today: carry-forward yesterday's open tasks + done/total chip | ✅ |
| BUJO-122 | Trackers: per-habit current streak badge | ✅ |
| BUJO-123 | Gym: estimated 1RM (Epley) on PRs + between-sets rest timer | ✅ |
| BUJO-124 | Settings: distance unit (km/mi) + week start (Sun/Mon), applied to calendars | ✅ |
| BUJO-125 | NoFap: urge-surfing "urges resisted" counter | ✅ |
| BUJO-126 | Optional Google Drive sync (appDataFolder JSON) + Drive file browser | ✅ |
| BUJO-127 | Docs: DECISIONS log, build-this-kind-of-app + tracker-module prompts, GOOGLE_DRIVE setup | ✅ |
| BUJO-128 | Tracker redesign + customization: per-habit editor (color/type/target/unit/scheduled days/archive/delete), count habits with targets, global settings (density, hide weekends, show archived) | ✅ |
| BUJO-129 | First-run login/welcome gate: choose "own cloud folder" or "this device" | ✅ |
| BUJO-130 | Own-cloud folder sync (File System Access API) — auto-save to a synced folder | ✅ |
| BUJO-131 | GitHub private-gist storage (back up / restore via PAT) | ✅ |
| BUJO-132 | Global undo/redo: store history, Ctrl+Z / Ctrl+Shift+Z, floating control + palette (skips text fields for native undo) | ✅ |
| BUJO-133 | Inline-edit entry text (double-click) | ✅ |
| BUJO-134 | Fix: replace photo (Replace + Remove controls on ImageUpload) | ✅ |
| BUJO-135 | Coalesce undo for rapid edits (sliders/typing → one undo step) | ✅ |
| BUJO-136 | Full-width layout (use screen real estate) + optimized Settings grid | ✅ |
| BUJO-137 | Demo / ?demo=1 skips the storage gate | ✅ |
| BUJO-138 | Card grids align to top (items-start) — no stretched empty cards | ✅ |
| BUJO-139 | Card primitive redesign: comfortable padding + header rhythm + gap-5 | ✅ |
| BUJO-140 | Animated stat counters: count-up numbers + progress Ring (Insights) | ✅ |
| BUJO-141 | Circular/radial habit tracker (fan wheel) + grid↔wheel toggle, ?wheel=1 | ✅ |
| BUJO-142 | Collapsible sidebar — icon rail that expands on hover, pin toggle | ✅ |
| BUJO-143 | Masonry packing (Plan) to reduce scrolling | ✅ |
| BUJO-144 | Welcome hero redesign (frontend-design skill): aurora mesh + grain + staggered entrance | ✅ |
| BUJO-145 | Vetted MCP installer script (shadcn, chrome-devtools, magic) | ✅ |

## Epic H — Data & privacy

| ID | Title | Status |
|---|---|---|
| BUJO-70 | Export/import JSON | ✅ |
| BUJO-71 | Export Markdown (Obsidian/Logseq) | ✅ |
| BUJO-72 | Backup nudge when never backed up | ✅ |

## Epic I — Engineering

| ID | Title | Status |
|---|---|---|
| BUJO-80 | Vitest + Testing Library setup | ✅ |
| BUJO-81 | Unit tests: bullets, date, stats, storage | ✅ |
| BUJO-82 | Unit tests: recurrence, correlations, ics, prompts, weather | ✅ |
| BUJO-83 | Provider integration test (quick-add → persist) | ✅ |
| BUJO-84 | Lazy-load chart views (bundle budget) | ✅ |
| BUJO-85 | Docs: PRD, Architecture, Frontend spec, Security, A11y, Features, Tickets | ✅ |
| BUJO-86 | Replication prompts (build / add-feature / add-login) | ✅ |

## Planned (v2)

| ID | Title | Status |
|---|---|---|
| BUJO-90 | Passcode lock + client-side encryption (Web Crypto) | ✅ (shipped as R2-1: `LockScreen.tsx` + `lib/crypto.ts`, AES-GCM/PBKDF2 at rest) |
| BUJO-91 | Opt-in accounts + E2E-encrypted cloud sync | 🔜 |
| BUJO-92 | Command palette (Cmd/Ctrl-K) | ✅ |
| BUJO-93 | Custom free-form collections UI | ✅ (Collections view: `addCollection`/`removeCollection`, "New collection", index) |
| BUJO-94 | Chart text-alternatives + axe-core CI | ◑ (text-alts done — every chart has a `role="img"` aria-label; only the `axe-core` CI job stays deferred, needs CI wiring) |

## Epic R — Layout redesign (2026-06)

Shell + all-views usability redesign on shadcn/ui re-themed to Catppuccin.
Rationale in `docs/redesign/*.mdx`; spec + plan in `docs/superpowers/`.

| ID | Title | Status |
|---|---|---|
| BUJO-R1 | shadcn init + Catppuccin CSS-var mapping + `cn()` | ✅ |
| BUJO-R2 | `ui.tsx` wraps shadcn (Button/Card/Input) — gradual migration | ✅ |
| BUJO-R3 | App shell: AppShell + Sidebar + sticky TopBar | ✅ |
| BUJO-R4 | Shared `DateCursor` + `viewChrome` registry (hoist date-nav) | ✅ |
| BUJO-R5 | `Page` grid primitive (main + wrapping aside) | ✅ |
| BUJO-R6 | Remove floating undo/redo + zoom → top-bar overflow menu | ✅ |
| BUJO-R7 | Today dashboard reflow | ✅ |
| BUJO-R8 | Monthly / Trackers / Cycle consume cursor + Page | ✅ |
| BUJO-R9 | Settings: Switch + Segmented vocabulary, equal-height grid | ✅ |
| BUJO-R10 | Remaining views adopt shared max-width container | ✅ |
| BUJO-R11 | Docs: MDX rationale + spec/plan + FRONTEND/ARCH/FEATURES/DECISIONS | ✅ |
| BUJO-R12 | Challenges view (75 Hard/90-day/custom, whole-number progress) | ✅ |
| BUJO-R13 | Trackers v2 (today strip, presets, emoji, weekly-goal, detail drawer) | ✅ |
| BUJO-R14 | Fitness v2 (goal ring, sparkline, streak, PBs, auto-pace, edit) | ✅ |
| BUJO-R15 | Collapsed sidebar = stable icon rail (no hover-overlay) | ✅ |
| BUJO-R16 | Challenge viz: progress ring + week-grouped calendar + legend | ✅ |

## Epic V3 — Smart input, dev tracker, richer viz (planned)

Scoped in `docs/prompts/05-platform-v3-smart-input-dev-tracker.md`. **Keep this
table and that doc in sync** (the cross-place task-sync rule applies to our docs).

| ID | Title | Status |
|---|---|---|
| V3-A | Smart input (VS Code-style completion) + duplicate corner-badge | ✅ |
| V3-B | Cross-place task sync — recurrence-instance linking + edit propagates to future occurrences (+ ↻ badge, Plan edit) | ✅ |
| V3-C | Developer "Focus" tracker (coding time · work style · stress) | ✅ |
| V3-D | Richer tracker viz: 12-week heatmap, momentum, collapsible categories (day/week/month + category radar) | ✅ |
| V3-E | Recommendations & smart defaults (dismissible suggestion notes) | ✅ |
| V3-F | Gym v2 — structured `setRows` + plate calc (kg/lb) + previous-session/1RM hints + 2-col redesign + pull-up program | ✅ |
| V3-G | Quick exercise picker — searchable dropdown (recents + library + custom) on set rows + anatomy lookup | ✅ |
| V3-H | Gym structured charts — weekly training-volume bars + per-exercise progression line | ✅ |
| V3-I | Per-set RPE + set type (warmup/working/drop) inputs in the logger grid | ✅ |
| V3-J | Partial completion — per-exercise checkboxes + actual-reps-vs-prescribed field in a program day | ✅ |
| V3-K | Training programs from PDF — pull-up program (week/day, load-into-session, day tracker) + ability/training-set calculator + exercises in library | ✅ |
| V3-L | Space UX — auto-hide sidebar (edge-hover reveal) + recommendations as a top-bar lightbulb badge | ✅ |
| V3-M | Plate calculator — unit-aware plates (kg/lb) + remount on unit change | ✅ |

## Epic P — Polish: scroll, analytics, cloud (2026-06-12)

Page-by-page enhancement pass. Full audit in `docs/redesign/06-app-audit-and-enhancements.mdx`.

| ID | Title | Status |
|---|---|---|
| P-1 | Challenges 2-grid (rules+stats / calendar) + best-streak/days-left stats | ✅ |
| P-2 | Fitness compact one-line history (recent/all toggle) | ✅ |
| P-3 | Trackers Day/Week/Month view toggle | ✅ |
| P-4 | Side-by-side cards to cut scrolling (Fitness Totals+PBs, Focus stats+chart) | ✅ |
| P-5 | Cloud storage — verified: own-folder / Google Drive / GitHub gist (Settings → Data & Cloud) | ✅ |
| P-6 | Trackers category radar chart | ✅ (`CategoryConsistencyCard`, in Trackers "This week / Trends") |
| P-7 | Custom-collections UI (BUJO-93) | ✅ (see BUJO-93) |
| P-8 | Passcode + client-side encryption (BUJO-90) | ✅ (see BUJO-90 / R2-1) |
| P-9 | Accounts + E2E cloud sync (BUJO-91, needs backend) | 🔜 |

## Epic R2 — Roadmap (scoped 2026-06-12)

Vision + full reasoning in `docs/redesign/07-space-vision-and-backlog.mdx`.

| ID | Title | Size | Status |
|---|---|---|---|
| R2-1 | Passcode + client-side encryption — AES-GCM/PBKDF2 at rest, lock-screen gate, encrypt-on-save | ✅ |
| R2-2 | Monthly: habit-completion ribbon per day | S | ✅ |
| R2-3 | Insights: clickable stats → jump to source (nav context) | S | ✅ |
| R2-4 | Stats: activity-heatmap range picker (3/6/12mo) | S | ✅ |
| R2-5 | Shared `StatTile` + `ChartCard` primitives (de-dup) | S | ✅ (shipped as P-14; `ui.tsx` exports, adopted app-wide) |
| R2-6 | Drag-and-drop: **reorder habits** (native DnD on a grip) | M | ✅ |
| R2-7 | Unified cross-view goal system | M | 🔜 |
| R2-8 | Smarter notifications (streak-at-risk, challenge day) | M | ✅ |
| R2-9 | Accent-color picker (Settings → Journal feel) | M | ✅ |
| R2-10 | Accounts + E2E-encrypted cloud sync (needs backend) | L | 🔜 |
| R2-11 | Chart a11y text-alternatives (key charts) — axe-core CI deferred | M | ✅ (every `ResponsiveContainer` chart now has a `role="img"` aria-label; only the axe-core CI job stays deferred) |

**Still open after this run** (each merits its own focused session, not a rushed
end-of-marathon patch):
- ~~**R2-5**~~ ✅ done — `StatTile`/`ChartCard` shipped in `ui.tsx` (P-14) and
  adopted app-wide; no ad-hoc stat-tile holdouts remain (2026-06-24 audit).
- **R2-7** — a unified goal model (one `Goal` type spanning habits, challenges,
  fitness, focus) with a cross-view roll-up. Genuine feature design needed.
  (The Goals *view* roll-up shipped as A-02; the unified *data model* is the
  open piece.)
- **R2-10** — accounts + E2E cloud sync **needs a backend**; out of the
  local-first scope. R2-1's at-rest crypto is the client half of this.
- ~~**R2-11**~~ ✅ chart text-alternatives done (every chart has a `role="img"`
  aria-label); only the `axe-core` CI job stays deferred (needs CI wiring).

## Epic PDF/UX — coaching content + mobile + hosting (shipped)

Driven by the user's workout PDFs + a stream of UX asks. All ✅ on `main`
(mobile on `feat/mobile-view`).

| # | What | Status |
|---|---|---|
| P-01 | Encode 12-week hypertrophy program (generic) + pull-up workout library + progression library | ✅ |
| P-02 | Move exercise anatomy to the right rail | ✅ |
| P-03 | Progress-photo tracker (dated upload, gallery, first-vs-latest compare) | ✅ |
| P-04 | Settings: denser unit grid + "Your data at a glance" | ✅ |
| P-05 | Stats: clearer mood calendar (purpose, legend, avg/best) | ✅ |
| P-06 | Anime-style training penalties (300-drill tiered catalogue, severity from skips) | ✅ |
| P-07 | Fitness: compact 6-tile metrics + history on the right | ✅ |
| P-08 | Dedicated Pull-ups view; pull-up cards & program moved out of Gym | ✅ |
| P-09 | Plan: migration sort (Date/Priority), 2-col grid, priority star | ✅ |
| P-10 | Nutrition: American+Indian food DB → macro auto-sum, sample day, online lookup | ✅ |
| P-11 | Voice input (Web Speech) on quick-add | ✅ |
| P-12 | Trainer/physio form-cue + injury-watch per exercise | ✅ |
| P-13 | GitHub-pages `prose-doc` readable typography + expanded Help | ✅ |
| P-14 | Shared `StatTile`/`ChartCard`/`ProgramTracker` primitives (de-dup) | ✅ |
| P-15 | Merge all work → `main`; GitHub Pages deploy workflow + `DATA_MODEL.md` | ✅ |
| P-16 | Mobile bottom tab bar (`feat/mobile-view`) | ✅ |

**Notes / still open:**
- GitHub Pages must be enabled once: *Repo → Settings → Pages → Build and
  deployment: GitHub Actions*.
- A true server-backed account/sync (R2-10) remains out of local-first scope.
- "Use the web to calculate" nutrition is a search-link + offline DB; a live
  USDA/FoodData API integration would need an API key (future).

## Epic ADV — advanced views, viz, contacts (shipped)

| # | What | Status |
|---|---|---|
| A-01 | R2-11 tail: aria-labels on remaining Gym/Cycle charts | ✅ |
| A-02 | Unified **Goals** roll-up view (R2-7) | ✅ |
| A-03 | Merge mobile bottom-nav → `main` | ✅ |
| A-04 | Tracker visualizations: 13-week heatmap, streak board, weekday, monthly trend | ✅ |
| A-05 | Motion: staggered entrance + 3D hover/press (reduced-motion-aware) | ✅ |
| A-06 | **Friends/contacts** collection + opt-in GitHub public-profile enrich | ✅ |
| A-07 | Docs/prompts pass (FEATURES/DECISIONS/DATA_MODEL/WORKLOG + prompt template) | ✅ |

### Planned next — 20 advanced features/charts (backlog for Epic ADV-2)

Charts (data already present, recharts/inline-SVG):
1. ✅ Nutrition 14-day calorie trend (avg line).
2. Macro-target rings (protein/carbs/fat vs goal).
3. Body-weight moving average + goal line.
4. ✅ Mood-by-weekday bars.
5. ✅ Workout split distribution (push/pull/legs) donut.
6. ✅ Focus cumulative coding-hours line.
7. Year-in-pixels mood grid.
8. Per-habit GitHub-style year heatmap.
9. RPE trend (gym) line.
10. Personal-records timeline.

Features:
11. CSV export per section.
12. Print / PDF-friendly day & month view.
13. Insights filters (date range, tag, habit).
14. Habit archive browser.
15. Per-friend birthday → auto Future-Log entry.
16. Weekly review wizard (guided migration + reflection).
17. Quick-add templates / snippets.
18. Tag manager (rename/merge tags).
19. Data import from CSV.
20. Configurable dashboard (pick which cards show on Today).

### Epic ADV-2 — progress log (appended; do not overwrite)

Charts shipped: ✅ calorie trend, ✅ macro rings, ✅ body-weight moving avg,
✅ mood-by-weekday, ✅ workout-split donut, ✅ focus cumulative hours,
✅ year-in-pixels, ✅ RPE effort trend (8/10).
Charts deferred as already-covered: per-habit year heatmap (drawer has 12-week),
PR timeline (Personal records card exists).

Features shipped: ✅ CSV export per section (entries/habits/metrics/workouts).
Also shipped beyond the list: ✅ Daily coverage summary (yesterday + week),
✅ storage-quota meter/guard, ✅ PRODUCT_GAPS.md (Path A roadmap).

Features still open (medium/large — benefit from a steer):
print/PDF view · Insights filters · habit-archive browser · friend-birthday →
Future-Log · weekly-review wizard · quick-add templates · tag manager ·
CSV import · configurable Today dashboard.

### Epic ADV-2 — progress log #2 (appended)

Features shipped: ✅ tag manager (rename/merge), ✅ print/Save-as-PDF,
✅ quick-add templates, ✅ archived-habits browser, ✅ friend birthdays + countdown,
✅ Insights search type-filters, ✅ configurable Today dashboard, ✅ guided weekly review.
Deferred: CSV import (⊘ — JSON import already restores; generic CSV is schema-ambiguous).

Structural: ✅ **Merged Fitness + Gym** into one tabbed hub (Cardio | Strength),
dropping a duplicate nav item; Gym lazy-loads per tab and stays deep-linkable.
Also: ✅ comprehensive `docs/FEATURE_GUIDE.md` (every view/sub-feature, 5+ lines).

ADV-2 tally: 8/10 charts (2 covered by existing UI), 9/10 features (1 deferred).

### Epic ADV-2 — closeout (appended)

Charts 9/10: ✅ calorie trend · macro rings · body-weight avg · mood-by-weekday ·
workout-split · focus cumulative · year-in-pixels · RPE trend · per-habit year
heatmap. PR timeline = covered by the Personal-Records card (not rebuilt).
Features 10/10: ✅ tag manager · print/PDF · quick-add templates · archive browser ·
friend birthdays · Insights filters · configurable Today dashboard · weekly review ·
CSV export · **CSV import**.
Plus beyond-list: Today's-plan hub, dedup (birthdays/Fitness+Gym/dead code),
5-tab bottom nav, iOS drawer, contextual help, card-ordering pass (D-35),
IndexedDB photos, onboarding, graphify install. **Task #40 closed.**

## Epic SYNC-FB-HABIT — session 2026-06-15 (appended)

Three features shipped in one working session, plus follow-ups queued.

| ID | Title | Status |
|---|---|---|
| BUJO-146 | Cloud-sync conflict resolution — prompt before clobbering unsynced local edits (`resolveIncoming` + `updatedAt` stamp) | ✅ |
| BUJO-147 | In-app feedback widget → files a GitHub issue (anonymous serverless `/api/feedback`, honeypot + rate limit) | ✅ |
| BUJO-148 | Habit metric types: `timer` (minutes) + `rating` (1–5), additive to `check`/`count` | ✅ |
| BUJO-149 | Habit **activity-heatmap** layout + classic/activity switcher (persisted in `Settings.trackerLayout`) | ✅ |
| BUJO-150 | Expanded habit presets (timer/rating examples: Run, Stretch, Focus, Mood, Energy, Steps, Coffee, Vitamins, Journal, No sugar) | ✅ |
| BUJO-151 | Drag-to-reorder in the activity view (classic-grid only today; rows honor saved `order`) | ✅ |
| BUJO-152 | Guest (view-only) + Google sign-in (secure storage) auth split, with per-page data security model | ✅ (built, PR #6; Google button gated on the external Supabase provider switch) |

Shared internals: `habitDoneOn` / `habitValueOn` / `habitIntensity` / `habitTarget` /
`nextHabitValue` extracted to `stats.ts` as the single source of truth so completion,
streaks, consistency, weekday-breakdown, and the activity heatmap all agree across
layouts. Pre-existing stats fns (`habitStreak`, `habitConsistency`, `weeklyHabitCount`,
`habitDayOfWeekBreakdown`, `reminderMessage`) rewired to honor numeric types.

Audit (3 reviewers): fixed timer-cycle skipping non-divisible targets (was making such
habits permanently incompletable), numeric-habit blind spots in reminders + weekday
breakdown, triple-duplicated step logic, and a11y labels on the activity strip/stars/toggle.

## Epic UX-2 — session 2026-06-15 cont. (appended)

| ID | Title | Status |
|---|---|---|
| BUJO-153 | Pickleball: "Practice today" card — daily drill + how-to-improve + warm-up + resource links | ✅ (PR #7) |
| BUJO-154 | Home Workout tab — curated bodyweight library, YouTube pro-demo + search links, session logging saved as Workout(activity='Home') → DB/sync/stats | ✅ |
| BUJO-152 | Google sign-in + guest=explore / account-to-use gate | ✅ partial (PR #6; needs Supabase Google provider) |
| BUJO-155 | Settings layout redesign — designed header + sticky icon sidebar rail (desktop) / scroll row (mobile) + grouped account/sync/privacy section | ✅ |

## Epic CAPTURE-UX — session 2026-06-16 (appended)

Input-capture program + habit polarity + a mobile/nav overhaul. PRs #10–#24 (+ doc #16) merged to `main` and deployed to bujo-journal.vercel.app. Prompt dump: `docs/sessions/2026-06-16-prompts.md`.

| ID | Title | Status |
|---|---|---|
| BUJO-156 | Enforce CSP (Report-Only → enforced) — verified 0 violations | ✅ (#10) |
| BUJO-157 | YouTube demo link on every exercise (shared `lib/video.ts` + `<VideoLink>`) | ✅ (#11) |
| BUJO-158 | Smart **capture bar** — one local parser (`lib/capture.ts`) routes a line to gym/cardio/metric/habit/journal; reuses SmartInput+MicButton | ✅ (#12) |
| BUJO-159 | Capture Phase 2 field controls (`Stepper`/`EmojiScale`) + "edit fields" + Gym repeat-last-set | ✅ (#13) |
| BUJO-160 | Capture Phase 3 — spoken-number normalization ("eighty by five" → 80x5) | ✅ (#13) |
| BUJO-161 | Stepper-ize Trackers + Fitness number inputs | ✅ (#14) |
| BUJO-162 | Retire QuickAdd (superseded by CaptureBar) + tighten habit matcher | ✅ (#15) |
| BUJO-163 | Google OAuth setup runbook | ✅ doc (#16) |
| BUJO-164 | Mobile Trackers sticky habit-name column overflow/overlap fix | ✅ (#17) |
| BUJO-165 | **Habit polarity** — build vs avoid/quit (alcohol/smoking/sugar): slip/clean semantics, `cleanStreak`, red/Ban UI in all surfaces; dedup guard | ✅ (#18) |
| BUJO-166 | Activity "cube" cells made interactive (were read-only → looked broken for check habits) | ✅ (#18) |
| BUJO-167 | Reuse existing units (same-unit consistency datalist) | ✅ (#19) |
| BUJO-168 | Layout-space + nav-cleanup across all 19 views; de-dup Goals/Challenges icon | ✅ (#20) |
| BUJO-169 | TopBar mobile viewport overflow (481px→390) — icon trim | ✅ (#21) |
| BUJO-170 | Nav regroup (Journal / Health / Insights & Stats) + `overflow-x-clip` + hosting MDX docs | ✅ (#22) |
| BUJO-171 | Collapse card subtitles on mobile (ⓘ tap to reveal) | ✅ (#23) |
| BUJO-172 | Hide Google sign-in until provider enabled (fixes "provider not enabled" error page) | ✅ (#23) |
| BUJO-173 | Auto-updating README screenshots (`npm run shots` + CI workflow) | ✅ (#24) |
| BUJO-174 | Mobile bottom nav: Plan → Pickleball | ✅ (#24) |
| BUJO-175 | Drag-to-reorder habits in activity view (BUJO-151 tail) | ✅ (grip handle per row, reuses `reorderHabits`) |
| BUJO-176 | "Same-unit tracker" combined totals/compare (if that was the intent) | 🔜 |

**External switches (user-only):** enable Google provider in Supabase (button auto-reappears); delete smoke-test account `bujo-smoketest-260616@example.com`.
**Cosmetic:** card title truncates ("M…") when it has both a long title + right controls (Stats monthly-mood).

## Epic INSPO-2 — app-research feature run + self-host stack (session 2026-06-17, appended)

Mined Strong / HarambeFit / lovable.dev / Habitify / Bearable / Streaks / an ADHD-focus guide; built a feature from each, plus desktop/Docker/DB. PRs #26–#41, merged + deployed.

| ID | Title | Status |
|---|---|---|
| BUJO-177 | Intermittent-fasting tracker (window, target, day-to-day streak) | ✅ (#26) |
| BUJO-178 | Home-workout saved-session detail; Fitness tab order Strength→Cardio | ✅ (#27) |
| BUJO-179 | Native-iOS mobile pass (16px inputs, touch-visible controls, safe areas) | ✅ (#28) |
| BUJO-180 | Strong green completed sets + live volume tally (gym) | ✅ (#29) |
| BUJO-181 | HarambeFit achievement badges (14, Stats); Strong green on ProgramTracker | ✅ (#30) |
| BUJO-182 | lovable.dev streak-milestone celebrations (MilestoneToast) | ✅ (#31) |
| BUJO-183 | Habitify time-of-day grouping + Today completion ring | ✅ (#32) |
| BUJO-184 | Timestamp check-ins + "when you check in" hour histogram | ✅ (#33) |
| BUJO-185 | Data-engineering schema/pipelines/scaling design (10→10M) | ✅ doc (#34) |
| BUJO-186 | Per-habit notes (inline Today + editor history) + stacking cue + Pomodoro timer | ✅ (#35/#36) |
| BUJO-187 | Pomodoro auto-logs focus blocks to Focus | ✅ (#36) |
| BUJO-188 | Bearable energy metric + slider; focus-minutes chip on Today | ✅ (#37) |
| BUJO-189 | Docker self-host + desktop (Tauri/SQLite/git-sync) design + scaffold | ✅ (#38) |
| BUJO-190 | Full self-host stack — web + Postgres + Adminer (verified) | ✅ (#39) |
| BUJO-191 | NoFap — days-resisted, red relapses, required reason; default gender male | ✅ (#40) |
| BUJO-192 | Default to US units (lb · mi · °F), switchable | ✅ (#41) |
| BUJO-193 | Secure PostgREST API tier (JWT + RLS + TLS) | ✅ done (2026-06-22) |
| BUJO-194 | Wire app to self-host Postgres (PostgREST backend) | ✅ done (2026-06-22) |
| BUJO-195 | Scaffold real Tauri `src-tauri/` + store adapter | ✅ done (2026-06-22) |
| BUJO-196 | Streak redesign — progress-ring hero, lifetime total-clean days, recovery-benefits ladder, trigger patterns, dated **urge log** (quick-pick presets + custom), slip-but-continue reframe | ✅ |
| BUJO-197 | **Light mode redesign** — user dislikes current Latte light theme; build a more **modern, Chrome-style** light theme (cleaner neutrals, softer surfaces, crisp borders). Think + build, then document. | ✅ done (2026-06-22) |
| BUJO-198 | Recovery — addiction **trigger plans** (if-then per trigger point) + per-addiction urge chart | ✅ |
| BUJO-199 | **Per-addiction streaks** — today the ring/ladder track one main streak; make each addiction its own streak + ladder + best (multi-streak data model). Clarified in UI for now. | ✅ done (2026-06-22) |
| BUJO-200 | **Custom goals** — user-defined targets with manual progress in the Goals view (`CustomGoal`) | ✅ |
| BUJO-201 | Edit logged **Pickleball / Focus sessions** in place (currently delete-and-re-log) | ✅ done (2026-06-22) |
| BUJO-202 | Feature QA pass · 20+ user questions, answers, gaps → `docs/qa/feature-questions.md` | ✅ |
| BUJO-203 | Sync robustness · Supabase realtime subscribe after auth resolves; stamp updatedAt on silent/mount changes; pull-before-push guard | ✅ done (2026-06-22) |
| BUJO-204 | Per-collection merge in `resolveIncoming`; re-stamp on import; distinguish explore-fail from empty account | ✅ done (2026-06-22) |
| BUJO-205 | crypto b64 chunking; bulkAddEvents dedupe in reducer; unlock empty-blob guard; undo coalesce reset | ✅ done (2026-06-22) |
| BUJO-206 | Smart-capture routing · count-habit via setHabitValue; weight-only/reps-only gym; exact habit-name match | ✅ done (2026-06-22) |
| BUJO-207 | Numeric habits in Monthly/Today progress (use habitDoneOn, not habitLog.length) | ✅ done (2026-06-22) |
| BUJO-208 | Recurrence backfill cap drops old occurrences while advancing lastGenerated | ✅ done (2026-06-22) |
| BUJO-209 | Challenges strict %/day vs completedDays text disagree; zero-rule challenge trap | ✅ done (2026-06-22) |
| BUJO-210 | streak.best ignores long completed past streak; avgGap mishandles unsorted/dup dates | ✅ done (2026-06-22) |
| BUJO-211 | Gym legacy set-string rep slot; "Repeat last" = heaviest not latest; plate calc bar>target warning | ✅ done (2026-06-22) |
| BUJO-212 | Polish · custom-goal cap; Goals streak-vs-best on first streak; reading pagesRead unknown-total; Stats empty-state for workout bars | ✅ done (2026-06-22) |
| BUJO-213 | Fixed this pass · migrate hardening, radar calm/adherence, program 100%, search filter reset, birthday validation, pickleball future-plan, readability (em-dash→·), Recovery urge tips + viz-to-rail | ✅ |
| BUJO-214 | 50+ logical-gaps audit → `docs/qa/logical-gaps-audit.md` | ✅ |
| BUJO-215 | Coaching Academy tab · 12-week program + per-week detail, skill ladder, drill library, mental game, knee ACL/MCL rehab+prehab; research dumped to `docs/research/` | ✅ |
| BUJO-216 | Coaching · full technique guide (how-to + cues + mistakes for every shot) so the app is self-contained | ✅ |
| BUJO-217 | **Mindset tab** · app-wide interactive thinking-style tool — pick principles to focus on + journal a note each (`MindsetFocus`, lib/mindset.ts) | ✅ |
| BUJO-218 | a11y deferred items · FriendsCard/ProgramTracker/TagManager aria-labels, ProgramTracker 32px pills, Cycle active-flag contrast | ✅ done (2026-06-22) |
| BUJO-219 | Remove dead `BottomNav.onQuickAdd` prop (declared/passed, unused) | ✅ done (2026-06-22) |
| BUJO-220 | Docs drift · expand `uml.mdx` data-model class diagram; fix FEATURE_GUIDE bottom-nav line + add HomeWorkout section | ✅ done (2026-06-22) |

## Epic BACKLOG-BUILD — 2026-06-22/23 (appended)

Large autonomous build + ship + deploy run. ~147 features built from the 572-item
backlog, plus perf/UX/test health work. All verified (tsc/vitest/eslint/build +
view smoke) and deployed live to bujo-journal.vercel.app.

| Ticket | Description | Status |
|--------|-------------|--------|
| BUJO-221 | Generate 572-feature ranked backlog → `FEATURE-BACKLOG-500.md` (10-agent fan-out, scored) | ✅ |
| BUJO-222 | Build top-10 + batches 1–4 + 2 data-model batches ≈ 147 features | ✅ (#48,#50–#55) |
| BUJO-223 | Account change-password UI (wire existing `updatePassword`) | ✅ (#49) |
| BUJO-224 | P0 perf — lazy-load all non-landing views; index **947KB→642KB** | ✅ (#56) |
| BUJO-225 | Extract ~44 cards from 4 bloated views into components + collapsible density sections | ✅ (#56) |
| BUJO-226 | View smoke tests — `npm run smoke` boots all 23 views in headless Chrome | ✅ (#56) |
| BUJO-227 | Typing-practice tracker in Focus (WPM, 1hr weekday goal, streak, trend, practice-site links) + habit preset | ✅ (#57) |
| BUJO-228 | 4× production deploys via `ship.sh`, each verified live (HTTP 200 + smoke) | ✅ |
| BUJO-229 | UX/IA card-arrangement recommendation → `docs/UX-CARD-LAYOUT.csv` (+ .md) | ✅ |
| BUJO-231 | Implement the BUJO-229 card-layout across all 23 views (three-tier order: primary-action → this-week → collapsed deep-analytics); `CollapsibleSection` for progressive disclosure | ✅ (PR #59) |
| BUJO-230 | Reusable prompt playbooks: `prompts/08-backlog-fanout-and-build.md`, `prompts/feature-prompt-template.md` | ✅ |
| BUJO-232 | Drag-to-reorder habits in the **activity** layout (BUJO-151/175 closeout) + audit pass marking stale-but-done tickets (R2-5, R2-11, P-6, V3-D) | ✅ |

**Still held (need infra/dep decision):** real backend (account-delete, multi-device
server sync), Tauri-native plugins (tray/notifications/autostart/native-fs),
Apple-Health/Obsidian importers. Listed in `FEATURE-BACKLOG-500.md`.

## Epic UX-3 — appearance, navigation & quick-open (2026-06-24, appended)

User-requested polish pass: more themes, a tidier sidebar, and VS Code-style
quick-open.

| ID | Title | Status |
|---|---|---|
| BUJO-233 | **5 selectable themes** — add `vscode` (VS Code Dark Modern: flat editor neutrals, low-fatigue) + `dawn` (warm cream light) to the existing mocha/latte/neon; each is a CSS-var override block | ✅ |
| BUJO-234 | **Theme picker** — swatch grid in Settings → Journal feel (was a binary TopBar toggle only); command palette lists every theme | ✅ |
| BUJO-235 | **Sidebar regroup** — split the overloaded 10-item Health group into Fitness / Sports / Habits / Wellbeing; split Insights&Stats into Library / Review (no group is unwieldy now) | ✅ |
| BUJO-236 | **⌘P / Ctrl-P quick-open** — VS Code-style "go to page", alias of the ⌘K command palette | ✅ |

## Epic SETTINGS — page audit & UX overhaul (2026-06-24, appended)

Full audit + backlog: `docs/SETTINGS-AUDIT.md`. The Data tab carried ~10 cards;
the tab nav was a cramped vertical rail.

| ID | Title | Status |
|---|---|---|
| SET-1 | Split the overloaded Data tab — new **Sync & privacy** tab (Account/Cloud/Passcode/Advanced); rename "Journal feel" → **Appearance** (now 5 tabs) | ✅ |
| SET-2 | **Group the Backup card** — Export/Import JSON stays primary; CSV / calendar-feed / integrity exports fold into `Disclosure` sections | ✅ |
| SET-4 | **Reset appearance to defaults** button | ✅ |
| SET-5 | Shared `Disclosure` collapsible primitive (de-dup 3 ad-hoc toggles) | ✅ |
| SET-9 | **Horizontal pill tab bar** replacing the stacked/clipped rail — all sections visible, content full-width (user feedback) | ✅ |
| SET-3 | ~~Settings search box~~ | ✗ removed per user feedback (built, then reverted) |

## Epic A11Y-FONT — feature/card audit + global text size (2026-06-24, appended)

Panel audit (3 reviewers) → verified by hand (~60% were false-positive/by-design;
see `docs/FEATURE-CARD-AUDIT.md`), then fixed the survivors + built a text-size control.

| ID | Title | Status |
|---|---|---|
| FONT-1 | **Global text size** (S/M/L/XL) — scales the rem root so all text/controls grow across every screen; `Settings.fontScale`, applied in `store`, control in Appearance + in Reset-appearance | ✅ |
| FONT-2 | **Figures excluded** — `.fig-fixed` counter-scale (`zoom: 1/var(--font-scale)`) on `ChartCard` keeps charts/figures at natural size (user: "not for the figure cards") | ✅ |
| AUD-1 | `challenges.percentComplete` guards `durationDays === 0` (no NaN ring) | ✅ |
| AUD-2 | Shared `rechartsTooltip` (de-dup the literal across Stats/Cycle/Pickleball/Gym ×5) | ✅ |
| AUD-3 | a11y: Cycle flag buttons `aria-pressed`/`aria-label`; Coaching week chevron `aria-expanded`/`aria-label` | ✅ |
| AUD-4 | Audit doc with every finding + verification verdict + reasoning (`FEATURE-CARD-AUDIT.md`) | ✅ |
| AUD-5 | Deferred: Heatmap/Monthly aria, save-toasts, Focus→ChartCard | 🔜 |
| AUD-6 | **Theme-aware charts** — `cat()` resolves a per-theme `THEME_PALETTES` (lib/colors); store calls `setActiveTheme` in render; `rechartsTooltip()` reads live palette. Charts now follow mocha/latte/neon/vscode/dawn | ✅ |
| AUD-7 | **Page-width consistency** — Reading (`max-w-5xl`) + NoFap (`max-w-[820px]`) → standard `max-w-[1400px]` like every other view | ✅ |

## Epic HABIT-VIEW — per-habit activity detail (2026-06-24, appended)

| ID | Title | Status |
|---|---|---|
| BUJO-237 | **Per-habit detail view** — tapping a habit opens a focused modal: 18-week day heatmap + stat tiles (streak/clean, best-ever, 30/90-day %, best weekday, perfect weeks) + "Edit settings" handoff. Heatmap-led, no line graph (user choice). `components/trackers/HabitDetail.tsx`; wired from all Trackers layouts | ✅ |
| BUJO-238 | **Year-wise date jump** — the shared date-nav label opens a picker (year ◀▶ + 12-month grid; native date field for day-views) so you can leap to any month/year instead of stepping ‹ › one at a time. Lands on every month-nav view (Today/Monthly/Trackers/Stats/Cycle/Insights) via the shared TopBar. `components/shell/DateJumpPicker.tsx` | ✅ |
| BUJO-239 | **Responsive card density** — research said CSS breakpoints (not the JS device hook) are the right "knows desktop vs mobile" lever for spacing (no reflow, pre-hydration). Tightened the shared `CARD.container` (`p-4 sm:p-5 lg:p-6`, `rounded-xl sm:rounded-2xl`), header margin (`mb-3 sm:mb-4`), and `Page` gaps (`gap-4 sm:gap-5`) → denser on phones, roomy on desktop. One-place change, every card adapts | ✅ |
| BUJO-240 | **Sidebar auto-hide toggle (desktop)** — expose the existing edge-hover auto-hide as a Settings → Appearance toggle (`sidebarAutoHide`). Confirmed safe on mobile: the hover behaviour is entirely `md:`-gated, so touch devices keep the always-visible BottomNav + tap-drawer and never depend on a mouse | ✅ |
| BUJO-241 | **Per-habit activity discoverability** — visible Activity-icon affordance next to each habit (all 3 layouts) so the detail view (BUJO-237) is findable | ✅ |

## Epic COMPETITIVE — features mined from other habit apps (2026-06-24, appended)

Research + gap-fill vs HabitKit and the web-highlights top-apps comparison. Full
audit: `docs/COMPETITIVE-FEATURES.md`. **Additive only — nothing removed.** bujo
already matched ~12/14 of HabitKit and ~26/30 of the comparison; built the real gaps.

| ID | Title | Status |
|---|---|---|
| BUJO-242 | **Share habit grid as PNG** (HabitKit signature) — "Share" in the per-habit detail renders the heatmap to a canvas → PNG download | ✅ |
| BUJO-243 | **Habit strength meter** — surface the existing recency-weighted `consistencyScore` + A–F `habitGrade` as a visible bar in the detail | ✅ |
| BUJO-244 | **HabitKit-style "Cards" layout** — 4th tracker layout: each habit a large colourful 13-week tile-grid card; tap a cell to log (a new heatmap-grid logging surface). `components/GridCardsLayout.tsx` | ✅ |
| — | Out of scope: home-screen widgets / Wear OS (native shell), social / community challenges (backend), MBTI (niche) | ⊘ |

## Epic FIT-IA — one place for fitness, and the contract rollout (2026-08-24, appended)

Session findings in `docs/redesign/15-fitness-consolidation.md`; open decisions
in `docs/QUESTIONS.md`; the reference that says what *not* to copy is
`docs/redesign/14-dashboard-inspiration.md`.

**The premise this epic corrects:** the rollout was never blocked on the
Modernist chain. `src/components/page/` — all eleven primitives — has been on
`main` the whole time, with five views importing it. `13-page-contract-rollout.md`
and `STATUS.md` both said otherwise. Separately, the chain tip has **zero**
`components/page` imports in Today/Insights/Stats/Trackers, so merging it was
about conflict order, not about doing the work.

### Phase 0 — unblock (in flight this session)

| ID | Title | Status |
|---|---|---|
| BUJO-245 | Merge the Modernist chain #113–#123 into `main`, merge commits, retargeting each to `main` as its parent lands. Only `STATUS.md` ever conflicts — no code conflict in twelve PRs | 🔜 |
| BUJO-246 | Retire the Pages deploy workflow (#127) that ran 8 times and failed 8 times | ✅ |
| BUJO-247 | Delete the twelve merged branches, **after** the chain finishes — never with `--delete-branch` while a child still targets one | 🔜 |
| BUJO-248 | Decide PR #96 (Today UX, +2620/−767, conflicted since 2026-08-03, superseded by Phase E) — see QUESTIONS Q1 | 🔜 |
| BUJO-249 | Decide PR #107 (worklog docs, CLEAN) — see QUESTIONS Q2 | 🔜 |

### Phase A — Trackers is filed in the wrong section

| ID | Title | Status |
|---|---|---|
| BUJO-250 | **Move Trackers from Insights to Body**, labelled "Tracking", ordered after Fitness. `Trackers.tsx` is 1013 lines — the largest view in the app — and it is where gym attendance and protein get logged, so filing it under Insights splits the daily loop across two sections | 🔜 |
| BUJO-251 | Audit every list that resolves a view id after the move — `BottomNav`'s `PRIMARY` is silently filtered against sidebar items, so a moved id can drop a phone tab with **no error**; also the command palette, onboarding, and `deepLink` aliases | 🔜 |
| BUJO-252 | Verify `?view=trackers` still resolves by **reloading the address bar**, not by clicking — in-app clicks never consult `VIEW_ALIASES` | 🔜 |
| BUJO-253 | Decide Body's tab count — moving Trackers in makes it ten, against a recorded ceiling of eight. Recommend splitting the rail into *Train* and *Body* (QUESTIONS Q6) | 🔜 |

### Phase B — Trackers on the page contract

| ID | Title | Status |
|---|---|---|
| BUJO-254 | Write Trackers' slot table before any code: route, job, primary object, container tier, zone contents, signature visual, where the single accent is spent, empty state, what moves off | 🔜 |
| BUJO-255 | Rebuild Trackers on `PageLayout` — orient (habits alive, today's completion), act (log today), review (heatmap + list). Target ≤ 2 raised cards, 1 accent, from 9 accents today | 🔜 |

### Phase C/D — stop hand-maintaining public data

| ID | Title | Status |
|---|---|---|
| BUJO-256 | **Open Food Facts search in Nutrition.** ODbL, no API key, CORS-enabled. Replaces the dead end in `src/lib/foods.ts`, whose own header admits it sends you to a web search for anything not in its 50 typed-out items. `fetch` only, no dependency | 🔜 |
| BUJO-257 | Write **resolved macros** into the journal record, never a product id alone — or the entry stops reading correctly the day the API goes away | 🔜 |
| BUJO-258 | Keep `FOODS` as the offline seed and make the network path an enrichment only. Test with the network stubbed out; this app is local-first and must log food with no connection | 🔜 |
| BUJO-259 | Gate the outbound call behind a Settings toggle, off by default — a food search leaks what you are eating (QUESTIONS Q7) | 🔜 |
| BUJO-260 | **free-exercise-db replaces `EXERCISE_LIBRARY`** (`src/lib/fitness.ts:100`). ~870 exercises, Unlicense/public domain, static JSON, data only — no images (QUESTIONS Q8) | 🔜 |
| BUJO-261 | Extend `fitness.test.ts` **before** swapping the dataset. `musclesForExercise` feeds the muscle map and is the thing that will break silently | 🔜 |
| — | Rejected: **wger** (needs a self-hosted Django backend this local-first PWA deliberately lacks); **Nutritionix / Edamam / USDA FoodData Central** (all require an API key, and a key in a client-side PWA is a published key); **any charting library** (undoes the accent discipline) | ⊘ |

### Phase E — the four pages that are actually looked at

| ID | Title | Status |
|---|---|---|
| BUJO-262 | Insights on the contract — **17 `<Card>` against a cap of 2, six accent colours against one**. The worst offender in the app by measurement | 🔜 |
| BUJO-263 | Stats on the contract — 11 cards, 5 accents | 🔜 |
| BUJO-264 | Today on the contract — 8 cards across `Today.tsx` + `today/cards.tsx`, 3 accents | 🔜 |
| BUJO-265 | Graft §10 grid discipline onto each converted page: content-weighted column ratios (not uniform splits), one shared gap token for every gutter, cells filling their allotted height instead of top-anchoring, constant padding regardless of content type | 🔜 |
| BUJO-266 | Add the shadcn primitives the rebuilt pages actually need — `card`, `badge`, `table`, `select` — restyled onto bujo tokens, rather than a repo-wide migration of `ui.tsx` (QUESTIONS Q4) | 🔜 |

### Phase F — sweep, and distrust the sweep

| ID | Title | Status |
|---|---|---|
| BUJO-267 | Card-count and accent-count greps per page — then confirm on the **rendered** page. The counts in `13-page-contract-rollout.md` are greps over source and it flags them as unverified itself | 🔜 |
| BUJO-268 | Add every converted page to `scripts/a11y-axe.mjs`'s fixed `VIEWS` list — otherwise "0 serious" means only "for the pages that were opened" | 🔜 |
| BUJO-269 | Re-run `npm run a11y` with new and changed folds **open** — axe walks the rendered page and cannot see inside a collapsed section | 🔜 |
| BUJO-270 | Fix print: white-on-white today. `print-color-adjust` is `economy` so Chrome drops the dark surface (which sits on a `div`, not `body`) while text keeps `rgb(205,214,244)`. Swap `data-theme` to `latte` on `beforeprint`; give `ExploreBanner` a `no-print` class since it is a `div` and `header, nav {display:none}` misses it | 🔜 |
| BUJO-271 | Desktop screenshots per phase, in light and dark — after confirming the port's process command line, since a tab pointed at a stale worktree never shows the change | 🔜 |

### Process

| ID | Title | Status |
|---|---|---|
| BUJO-272 | **An adoption count is evidence about the branch it was taken on, and nothing else.** Doc 13 measured the chain tip and concluded something about `main`. One `git ls-tree` would have caught it. Fold this into the "judge a UI on the right branch" trap, which already existed and still did not prevent it | 🔜 |

### Epic FIT-IA — progress log (appended; do not overwrite)

**2026-08-24, Phase 0 + Phase A shipped.**

| ID | Outcome |
|---|---|
| BUJO-245 | ✅ All twelve merged — #127 and #113–#123. Only `STATUS.md` ever conflicted |
| BUJO-246 | ✅ |
| BUJO-247 | 🔜 twelve merged branches still to delete |
| BUJO-248 | ✅ #96 closed — superseded by Phase E |
| BUJO-249 | ✅ #107 merged |
| BUJO-250 | ✅ Trackers → Body, labelled "Tracking", after Fitness. PR #129 |
| BUJO-251 | ✅ No list to fix — #120 deleted `BottomNav`'s `PRIMARY`, so the sections *are* the tabs |
| BUJO-252 | ✅ `?view=trackers` loaded in the address bar **and reloaded** at 1280/1440/1920 → Body › Tracking |
| BUJO-253 | ✅ **No split.** Measured: 8 tabs before, 9 after, `scrollWidth === clientWidth` at all three widths. The eight-tab ceiling was a count, never a width |
| BUJO-268 | ✅ `['Insights','Stats']` added — Stats had **never** been scanned. It failed immediately on contrast |

**The bug BUJO-268 exposed, fixed in the same PR:** the mood calendar drew an
unlogged day's date at 10px in `overlay0` on the empty-cell surface — 2.57:1 in
mocha, 2.67:1 in neon, against a 4.5:1 floor. Now `subtext0`. `npm run a11y`
reports no serious or critical violations across five themes and two viewports.

### Phase B — measured from the rendered page, not from source

Screenshot of Body › Tracking at 1440×900 with demo data. These are the
"scattered boxes" symptom, named:

| ID | Title | Status |
|---|---|---|
| BUJO-273 | **The habit table's left column is too narrow, so metadata wraps out of the row.** "2/7wk" lands on its own line under Sugar, "◆60 · 5d clean" under Vegetables — the badge escapes its row and reads as belonging to the next habit. Content-weighted columns, §10 | 🔜 |
| BUJO-274 | **Dead space at the right edge of the heatmap.** The month grid stops at day 31 near x≈1300 while the card runs to x≈1420. The cell track is fixed-width rather than distributed, so a 31-day month leaves a gap and a 28-day month leaves four | 🔜 |
| BUJO-275 | **A vertical gap between the "Today" chip row and the habit table** that belongs to neither. Cells should fill their allotted height rather than top-anchoring, §10 | 🔜 |
| BUJO-276 | **The fourth stat tile reads "10 +1 🚫"** — three unrelated quantities crushed into one line while the other three tiles carry a single number. Either it is one stat or it is two | 🔜 |
| BUJO-277 | `smoke-views.mjs`'s fixed `VIEWS` list is missing **`program`** and **`nutrition`** — both are Body tabs and neither is smoke-tested. Found during the BUJO-251 audit, out of scope for #129 | 🔜 |

**2026-08-24, Phase B part 1 — the stat strip and the row wrap.**

| ID | Outcome |
|---|---|
| BUJO-273 | ✅ Wrapped badge lines now start at the habit name's x, not the cell's. `pl-7` on the cell + `-ml-7` on its first child, so rows whose badges already fit are untouched |
| BUJO-274 | ⊘ **Misread, not a defect.** The stat tiles, the chip strip and the `%` column all end at x≈1310; 1310→1420 is the page gutter, identical on every row. The first screenshot was read through the onboarding overlay |
| BUJO-275 | ⊘ **Misread, not a defect.** Ordinary section spacing between the chip row and the table |
| BUJO-276 | ✅ `10 +1🚫` split into value `10` and hint `+1 to avoid`. `StatTile` gained an optional `hint` slot rather than the call site forking |

**Found while fixing BUJO-276: three of the four accents on this page were
never drawn.** `StatTile`'s `color` prop tints its `icon` only, and
`TrackerSummaryCard` passes no icon — so `mauve`, `peach` and `sapphire` there
rendered nothing at all, and the fourth (`todayPct` green/yellow/peach, a
genuine directional signal) never rendered either. The audited "9 accents on
Trackers" is therefore partly phantom: it counted a prop, not a pixel. The dead
props are removed.

| ID | Title | Status |
|---|---|---|
| BUJO-278 | **`StatTile`'s `color` prop silently does nothing without an `icon`.** ✅ **Done 2026-08-24** — the prop is now a union (`{icon, color?}` \| `{icon?: undefined, color?: never}`), so `tsc -b` refuses the combination instead of rendering nothing. It named **45 dead call sites across 8 files**; all 45 deleted. Two of them did compute their colour from the value (DUPR "Change", pickleball "Net") and got no icon back — both already print their own `+`/`−`, which reads in greyscale where a hue does not. `StatTile.test.tsx` asserts the tinted and untinted markup are byte-identical, which is the measurement that made deleting them safe | ✅ |
| BUJO-279 | The "today done" tile's green/yellow/peach threshold was intended as a status signal and has never rendered. Decide whether it should — it is the one number on this strip with an unambiguous direction | 🔜 |

**2026-08-24, Phase B part 2 + Phase E — the contract rollout.**

| ID | Outcome |
|---|---|
| BUJO-254/255 | ✅ Trackers on `PageLayout`. `PageLayout` gained `stacked`; a latent `layout.css` placement bug fixed with it. PR #132 |
| BUJO-262 | ✅ Insights on `PageLayout`. The four-`Big` row deleted — its "Longest streak" tile duplicated the Personal records card further down the same page. PR #133 |
| BUJO-263 | ✅ Stats on `PageLayout`. No zone 2: it is the one page in the cluster with nothing to do on it |

| ID | Title | Status |
|---|---|---|
| BUJO-280 | **The Activity heatmap leaves ~800px dead.** Measured at 1440: at the 6mo default the grid is ~370px of fixed-size cells inside a `SPAN_ALL` card running the full ~1180. `SPAN_ALL` exists for the 1yr range (~730px), so the card cannot simply be narrowed — the range control changes its content width threefold. The fix is a cell that stretches to the width it is given, or a card that sizes to its content. **This is the real version of what BUJO-274 wrongly claimed** | 🟡 |
| BUJO-280a | ✅ **Done 2026-08-24 — the card sizes to its content.** The span now follows the range (`heatWeeks === 52 ? SPAN_2 : undefined`). Measured at 1440, dead width before → after: **3mo 978 → 378 · 6mo 796 → 196 · 1yr 432 → 432**. At 6mo the freed column is filled by Achievements moving up beside it, so the space became a card rather than a smaller hole. Also deleted `SPAN_ALL`: after this it had zero call sites, and below 1536px it was byte-identical to `SPAN_2` anyway, because the grid only has two columns there — it read as a stronger claim than it made | ✅ |
| BUJO-280b | **1yr still leaves 432px, and only a stretching cell can close it.** 53 columns of fixed 11px cells draw 748px; the two-column card is 1180. Filling it needs cell size to follow the container — `(1180 − 54×3) / 53 ≈ 19px` at 1440, a different number at every breakpoint, so it cannot be a constant. The CSS-only version is `table-layout: fixed` + `width: 100%` + `aspect-ratio: 1` + a `max-width` cap on the cell, inside `DayGrid`. Left undone deliberately: `DayGrid` has three callers (Stats heatmap, Trackers per-habit row, `CalendarHeatmap`) whose sizing is deliberate, and this is the wrong ticket to change all three under | 🔜 |
| BUJO-281 | **Insights is still a six-drawer cabinet** — 16 Cards against a cap of 2, 14 of them inside six collapsed `Section`s where the contract allows one disclosure. Deciding what Insights is *for* is an IA decision, not a refactor. **Decided 2026-08-24: split by question** (see below). Rolling out in three increments; 281a done | 🟡 |
| BUJO-281a | ✅ **Done — Tag manager moved to Settings → Data.** The one thing on Insights that *changes* anything: renaming a tag rewrites every entry carrying it. It was a maintenance tool filed by where it was built, behind the sixth of six folds. Verified on the rendered page — Settings → Data draws the Tags card with its rows, Insights no longer contains the string | ✅ |
| BUJO-281b | ✅ **Done — the nine analytics panels moved to Stats.** Mood analytics went into Stats' existing *Mood views* fold and Habit analytics into *Habit timing* (renamed *Habits*); Lifetime renders **open** beside Achievements, which is the same subject. **Insights: 6 folds → 2. Stats: still 6.** Extracted to `components/stats/{MoodAnalytics,HabitAnalytics,LifetimeCards}.tsx` rather than pasted inline — Stats would have gone past the 500-line ceiling. Verified by dumping each panel's rendered HTML from Insights on the parent commit and from Stats on this one: **all nine byte-identical.** That check earned its keep — the first draft of `SplitCol` silently dropped its two accent icons | ✅ |
| BUJO-281c | Insights chrome: drop the Pickleball domain digest (the Pickleball page has all four of its numbers and more), and dissolve the remaining action-less Cards — Weekly digest, Coach digest, Patterns, Momentum — into headed regions with a hairline. Leaves 2 real cards (Weekly review, Search) and no folds | 🔜 |
| BUJO-282 | `weeklyRadar` mixes scales — Mood/Calm/Habits/Consistency are 0–10, Sleep is raw hours, all plotted on one radar labelled "0–10". A 7h night reads as a 7/10 axis | 🔜 |

**Today: assessed, deliberately not converted.**

| ID | Outcome |
|---|---|
| BUJO-264 | ⊘ **Not converted, on purpose.** Today already implements the contract's intent by a different route: the morning/day/evening `Segmented` *is* the orient control, the capture bar *is* the act, and entries plus habit pills are the review. It also has the lowest counts in the app — 4 Cards and 2 accents, against Insights' 16 and 6 |

Two further reasons, both worth writing down rather than rediscovering:

- **Today is two layouts**, `TodayFocused` and `TodayClassic`, chosen by
  `settings.layout`. Converting one and not the other is exactly the
  half-migration behind a flag that `CLAUDE.md` forbids, and converting both
  doubles the blast radius on the app's most-used surface.
- **Its narrow column is not dead space.** Measured at 1440: content sits in a
  centred ~820px column. That is the 820 tier behaving as documented — *"the
  820 tier stays single column at every width; its gutters are the point"* —
  not the full-width page failing to fill itself.

| ID | Title | Status |
|---|---|---|
| BUJO-283 | If Today is ever converted, do **both** layouts in one change, and use `StatBar`'s `mode`/`segments` for the surface toggle — that is the Fitness pattern and the surface toggle is already exactly it | 🔜 |
