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

**D-18 — Adopt shadcn/ui re-themed to Catppuccin (wrap + gradual).**
*Context:* the 2026-06 layout redesign needed accessible, consistent primitives
(dialog, dropdown, switch, tabs) without losing the Catppuccin look or rewriting
13 views at once.
*Choice:* install shadcn primitives into `components/ui/`; map shadcn's semantic
CSS vars (`--primary`, `--border`, …) onto the existing Catppuccin tokens in
`index.css` (Latte inherits for free). `ui.tsx` `Card`/`Button`/`Input` became
thin wrappers, so existing imports kept working and views migrated one by one.
*Trade-off:* +Radix/cva/tailwind-merge deps → initial JS 84.8 → ~113 KB gzip
(still under the 200 KB budget). Charts stay lazy.

**D-19 — One app shell + a `Page` grid; hoist date-nav to a sticky top bar.**
*Context:* every view rolled its own layout (dead voids, inconsistent headers),
and undo/redo + zoom floated over content.
*Choice:* a `components/shell/` layer — `AppShell` + `Sidebar` + `TopBar` +
`Page` + a shared `DateCursor`. Titles/subtitles + date-nav come from a
`viewChrome` registry; the floating clusters became overflow-menu items.
*Trade-off:* date views must read their day/month from the cursor instead of
local state — a small amount of wiring for one source of truth.

**D-20 — One control vocabulary: Switch for on/off, Segmented for enums.**
*Context:* Settings mixed hand-rolled toggles, button pairs, and a `<select>`
for the same kinds of choice.
*Choice:* shadcn `Switch` for every boolean; a `Segmented` component (in
`ui.tsx`) for every mutually-exclusive enum (theme, units, week-start).
*Result:* equal-height Settings cards and a predictable control language.

**D-21 — Challenges are a first-class view with a separate model, placed in Health.**
*Context:* users want fixed-length discipline challenges (75 Hard, 90-day).
*Choice:* a `Challenge[]` + per-day `challengeLog` (additive, migrate-safe), a
new `Challenges` view, and a nav item in the **Health** group (not a new
top-level group — keep the nav coherent). Progress is shown in **whole numbers**
("Day 23 of 75", integer %), never fractions. Strict challenges reset to Day 1
on a miss; lenient ones don't.

**D-22 — v2 view enhancements reuse `Page` + lightweight charts to hold the budget.**
*Context:* Trackers/Fitness got new analytics (goal rings, sparklines, streaks).
*Choice:* additive `Habit` fields (`weeklyGoal`, `emoji`) + `habitSkips`;
`Settings.fitnessGoalMin`; pure helpers in `stats.ts`/`fitness.ts` (unit-tested).
Trend visuals use inline SVG/CSS sparklines, **not** Recharts, so non-lazy views
don't pull the chart chunk. Gym's structured-set rewrite (per-set RPE/type +
volume/progression charts) is **scoped but deferred** to a focused session — see
`docs/superpowers/plans/2026-06-11-v2-view-enhancements.md` Phase D.

**D-23 — Smart input is a pure-logic core + a thin component.**
*Context:* completion + duplicate detection must be testable and reusable across
the quick-add and habit-add fields.
*Choice:* `lib/suggest.ts` (suggestions + token-overlap duplicate scoring, unit-
tested) feeds a `SmartInput` component that owns the popover, keyboard nav, and a
**corner badge** for duplicates. The bullet grammar still parses in `addEntry`, so
typing `t …`/`e …`/`* …` works unchanged; a live preview makes it discoverable.
*Trade-off:* fuzzy-match threshold is heuristic (0.7) — tunable, non-blocking.

**D-24 — Recommendations are pure + dismissible, never sensitive.**
*Choice:* `lib/recommend.ts` returns ranked `Recommendation[]`; an app-shell bar
shows the top 2 with a nav action and a dismiss. Cycle/NoFap are never surfaced.
*Why:* helpful nudges without nagging or privacy leaks.

**D-25 — Developer Focus tracker is its own view + model, not a habit type.**
*Context:* coding sessions need duration + focus + stress + tags, richer than a
habit dot.
*Choice:* a `DevSession` model + `lib/focus.ts` (weekly minutes, streak,
duration-weighted averages, focus↔stress Pearson) + a `Focus` view in Health.
Charts are inline SVG/CSS (no Recharts) to hold the bundle budget.

**D-26 — Training programs are encoded as app data; source PDFs are gitignored.**
*Context:* a user-supplied pull-up program PDF (and a personal document) sat in
`docs/pdf/`.
*Choice:* encode the program structure in `lib/programs.ts` and surface it as a
Gym **ProgramCard** (week/day selector, load-into-session, day tracker). Add
`docs/pdf/` to `.gitignore` so neither the **personal PDF (PII)** nor the
copyrighted program PDFs are ever committed.
*Why:* keep PII and third-party copyrighted material out of the repo; the app
ships only the abstracted training structure.

**D-27 — Structured gym sets are additive (`setRows`), legacy strings kept.**
*Choice:* `Workout.setRows: WorkoutSet[]` (exercise/weight/reps/rpe/kind) is
written on finish alongside the legacy `sets: string[]` for display/back-compat.
Enables `sessionVolume` / `exerciseProgression` / `lastSetFor` (previous-session
reference + live 1RM in the logger). Per-set RPE/type inputs + volume/progression
charts are scoped (TICKETS V3-H/I) but not yet wired.

**D-28 — Plate denominations follow the unit.** kg uses 25/20/15/10/5/2.5/1.25;
lb uses 45/35/25/10/5/2.5. Fixes a unit bug where lb users saw kg plates.

**D-29 — Reclaim screen space: auto-hide sidebar + recommendations as an icon.**
*Context:* the sidebar + a recommendations banner ate horizontal and vertical space.
*Choice:* an opt-in **auto-hide** mode (sidebar becomes a fixed overlay revealed by
a left-edge hover zone via Tailwind `peer-hover`; content goes full-width) and
move recommendations into a top-bar **lightbulb + count badge** dropdown.
*Why:* maximise content area without losing one-tap access to nav or suggestions.

**D-30 — Passcode encryption is at-rest + a lock gate, never lossy.**
*Choice:* `crypto.ts` (PBKDF2 → AES-GCM); when a passcode is set, `save()`
encrypts to `bujo:enc` and drops the plaintext `bujo:data`. A `LockScreen` in
`JournalProvider` gates the app on load; unlock decrypts into memory. A **wrong
passcode throws and never wipes data**; removing the passcode rewrites plaintext.
*Trade-off:* no recovery if the passcode is lost — the UI says so and nudges a
JSON export. Local-only; pairs with future E2E cloud sync (BUJO-91).

**D-31 — Contact enrichment is consent-based, never scraping.**
*Choice:* the Friends collection is manual; the only network call is an opt-in
GitHub lookup (`lib/enrich.ts`) hitting the **official public API** for data the
person chose to publish. *Rejected:* searching the open web / people-search /
scraping LinkedIn/Instagram — against site ToS, often wrong, a privacy hazard,
and impossible from a CORS-bound local-first SPA anyway. Enrichment degrades to
null on any failure (offline, rate-limit, unknown user).

**D-32 — Goals is a read-only roll-up, not a new goal store.**
*Choice:* `views/Goals.tsx` aggregates targets that already live elsewhere
(habit `weeklyGoal`, `fitnessGoalMin`, challenges, `programDone`, the streak) —
no new schema. *Why:* one "am I on track?" screen without duplicating state; it
stays empty until targets exist (zero clutter).

**D-33 — Motion is opt-out via the OS, not an app setting.**
*Choice:* entrance/hover/press animations live entirely inside a
`@media (prefers-reduced-motion: no-preference)` block, so the OS accessibility
preference governs them — no toggle to maintain.

## What was deliberately deferred

- Accounts + cloud sync (opt-in, E2E-encrypted) — see `prompts/02`.
- Passcode + client-side encryption of the blob.
- Embedded video players (use YouTube search links instead).
- A full nutrition food database (kept a lightweight macro diary).

**D-34 — "Today as a daily command-center": summarize-and-link, don't duplicate.**
*Idea (user):* surface Fitness, Plan, Pull-ups and Trackers on Today so the whole
day is actionable from one screen (a mobile-first "what do I do today?" hub).
*Pros:* one-glance daily hub, less navigation, higher adherence, fits the
entry-first mobile direction and the existing coverage/penalty cards.
*Cons:* Today grows long (scroll fatigue); **re-embedding habits/workout/program
re-creates the cross-view duplication we just merged**; an "everything dashboard"
risks doing nothing well; more coupling.
*Decision:* build a **compact, collapsible "Today's plan" summary card** that
*links* into each view ("3 habits left · suggested Pull day · 2 tasks due ·
pull-up Day 3") rather than re-rendering those UIs. Read-only, reuses the
coverage/goals logic — the daily hub without the bloat or duplication.
*Status:* analysis recorded; build pending user go-ahead.

**D-35 — Card order within a view = action-first, analytics-last.**
*Principle:* order each view's cards by usability/frequency — (1) primary
capture/action, (2) today's status, (3) secondary entry, (4) reference/lookup,
(5) charts/analytics. The same vertical order serves web and mobile; the only
web/mobile split is rail placement, handled by `Page asideFirst` (forms above
charts on phones for Fitness/Focus). *Applied:* Today (plan→log→detail), Trackers
(grid→presets→charts→viz→archived), Gym (logger→program→DB→charts→photos),
Fitness/Focus (form-first on mobile), Insights (Weekly-Review hoisted above the
read-only analytics). Most views were already action-first by construction;
Insights was the main reorder. *Why:* a phone user opens a view to *do*, not to
read charts — reduce scroll-to-action.

**D-36 — Reusable collapsible Card = the compacting pattern.**
*Choice:* the shared `Card` takes `collapsible` / `defaultCollapsed`; a header
chevron hides the body. One prop compacts any card — no bespoke collapse code.
*Applied default-collapsed:* Training penalty, Gym "Today's session" (phones),
Stickers, On-this-day, Exercise database. *Collapsible (open):* Completion
heatmap. *Why:* phones need entry-first, low scroll; secondary/heavy cards
shouldn't push the primary action down. Same behaviour web + mobile.

**D-37 — Penalty difficulty is user-set; Beginner is the default.**
*Context:* the 300-drill catalogue is sized for "hard" (e.g. 6 km run) — not
realistic for most users. *Choice:* a `penaltyLevel` setting (beginner ·
intermediate · hard); `scaleTask()` scales the leading rep/time count
(beginner ≈ 40%, min 1). Default **beginner**. *Why:* the penalty is a gentle
nudge, not a boot-camp; it must stay doable or it gets ignored/dismissed.

**D-38 — Fitness+Gym fully merged; the `gym` route is an alias, not a view.**
*Context:* after merging into the tabbed Fitness hub, "Gym" still leaked via the
Goals link and old `?view=gym` bookmarks (rendered the un-tabbed Gym titled
"Gym"). *Choice:* `gym` now routes to `FitnessHub initialTab="strength"` and its
chrome title is "Fitness". No standalone "Gym" view is reachable in-app. *Why:*
one home for training; the word "Gym" only survives as a tab-less deep-link alias.

**D-39 — recharts must be one chunk (prod-only crash fix).**
*Symptom:* every lazy chart view went blank in production with
`TypeError: r is not a function` from a split `RadarChart-*.js` chunk (dev was
fine). *Cause:* Rollup split recharts/its d3 deps across lazy chunks; a
cross-chunk init reference resolved to undefined. *Fix:* `vite.config.ts`
`build.rollupOptions.output.manualChunks` forces `recharts|react-smooth|
victory-vendor|d3-*|internmap|recharts-scale` into a single `recharts` chunk.
*Lesson:* verify chart views on the **deployed build**, not just dev — minified
chunking bugs don't show in `npm run dev`.

**D-40 — Cloud sync: one passphrase, E2E, Vercel Blob; charts defer on mobile.**
Cloud sync (`api/sync.ts` + `lib/bujocloud.ts`) stores ciphertext at a hashed
path on a public Vercel Blob store; an opt-in auto-sync (pull-on-open,
push-on-change) lives in Settings. The SPA rewrite in `vercel.json` must exclude
`/api/`. Card `defer` (Page is flex-col) sinks chart cards below content on
phones — entry-first.
