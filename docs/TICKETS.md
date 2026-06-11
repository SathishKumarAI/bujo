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
| BUJO-92 | Command palette (Cmd/Ctrl-K) | 🔜 |
| BUJO-93 | Custom free-form collections UI | 🔜 |
| BUJO-94 | Chart text-alternatives + axe-core CI | 🔜 |
