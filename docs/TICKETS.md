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
| BUJO-90 | Passcode lock + client-side encryption (Web Crypto) | 🔜 |
| BUJO-91 | Opt-in accounts + E2E-encrypted cloud sync | 🔜 |
| BUJO-92 | Command palette (Cmd/Ctrl-K) | ✅ |
| BUJO-93 | Custom free-form collections UI | 🔜 |
| BUJO-94 | Chart text-alternatives + axe-core CI | 🔜 |

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
| V3-D | Richer tracker viz: 12-week heatmap, momentum, collapsible categories (day/week/month + radar deferred) | ◑ |
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
| P-6 | Trackers category radar chart | 🔜 |
| P-7 | Custom-collections UI (BUJO-93) | 🔜 |
| P-8 | Passcode + client-side encryption (BUJO-90) | 🔜 |
| P-9 | Accounts + E2E cloud sync (BUJO-91, needs backend) | 🔜 |

## Epic R2 — Roadmap (scoped 2026-06-12)

Vision + full reasoning in `docs/redesign/07-space-vision-and-backlog.mdx`.

| ID | Title | Size | Status |
|---|---|---|---|
| R2-1 | Passcode + client-side encryption — AES-GCM/PBKDF2 at rest, lock-screen gate, encrypt-on-save | ✅ |
| R2-2 | Monthly: habit-completion ribbon per day | S | ✅ |
| R2-3 | Insights: clickable stats → jump to source (nav context) | S | ✅ |
| R2-4 | Stats: activity-heatmap range picker (3/6/12mo) | S | ✅ |
| R2-5 | Shared `StatTile` + `ChartCard` primitives (de-dup) | S | 🔜 |
| R2-6 | Drag-and-drop: **reorder habits** (native DnD on a grip) | M | ✅ |
| R2-7 | Unified cross-view goal system | M | 🔜 |
| R2-8 | Smarter notifications (streak-at-risk, challenge day) | M | ✅ |
| R2-9 | Accent-color picker (Settings → Journal feel) | M | ✅ |
| R2-10 | Accounts + E2E-encrypted cloud sync (needs backend) | L | 🔜 |
| R2-11 | Chart a11y text-alternatives (key charts) — axe-core CI deferred | M | ◑ |

**Still open after this run** (each merits its own focused session, not a rushed
end-of-marathon patch):
- **R2-5** — extract `StatTile`/`ChartCard` from the ~dozen ad-hoc stat/chart
  blocks. Pure refactor; touches many files, so do it deliberately.
- **R2-7** — a unified goal model (one `Goal` type spanning habits, challenges,
  fitness, focus) with a cross-view roll-up. Genuine feature design needed.
- **R2-10** — accounts + E2E cloud sync **needs a backend**; out of the
  local-first scope. R2-1's at-rest crypto is the client half of this.
- **R2-11 tail** — full chart sweep + `axe-core` CI job (needs CI wiring).

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
