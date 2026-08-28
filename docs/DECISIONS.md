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

**D-41 — Optional Supabase backend, additive and disabled-by-default.**
*Context:* user wanted real login + guest accounts + a per-user database, on top
of the local-first app. *Choice:* `lib/supabase.ts` with a **null client unless
`VITE_SUPABASE_*` env vars are present** — so adding accounts never changes the
local-first behaviour for anyone who doesn't configure it. Anonymous (guest) auth
is the default entry; email sign-up *links* the guest to keep their data; one
`journals` jsonb row per user, **RLS** the only access control. *Trade-off:*
with accounts, data lives on a server (a data-controller duty) — accepted as an
opt-in path; the passphrase E2E sync stays for the privacy-max path.

**D-42 — The whole header folds a card; the caret stays the accessible control.**
*Context:* every collapsible surface put the entire fold behind an 18px chevron —
miss-prone on touch, and a header that looks like one control but answers in one
corner reads as broken. *Choice:* the header row toggles on click; the caret
remains a real `<button>` carrying `aria-expanded`, so assistive tech and the
keyboard still operate a named control rather than a `role="button"` div.
*Trade-off:* anything interactive in a card's `right` slot ("Mark all",
segmented controls) has to stop propagation or it would collapse the card
mid-click — which in turn makes a *non*-interactive `right` (a `Pill`) a dead
spot. Accepted: collapsing the card when someone reaches for a control in it is
the worse failure. Cards that already own an `onClick` keep the caret-only
target, because two meanings for one click beats neither working.

**D-43 — One caret rotated, and open-only animation.**
*Context:* folds swapped between two glyphs (`CaretUp`/`CaretDown`, `▴`/`▾`),
which reads as a cut rather than a state change. *Choice:* one glyph, rotated
via `.caret-turn` + `data-open`; bodies fade in with `.collapse-in`. Both built
on the existing motion tokens — no new durations or curves. *Trade-off:* **the
close is instant.** Animating it would mean keeping the body mounted while
closed, and the collapsed-by-default cards carry real weight (Coaching's drill
library, Gym's exercise database). An enter-only animation is the honest trade
at this content size. *Note:* `.caret-turn` is unlayered CSS and beats
`@layer utilities`, so a Tailwind `transition-*` on the same element silently
does nothing.

**D-44 — A fold has to earn itself.**
*Context:* Plan's Setup was collapsed by default, so the two cards people open
that page to reach were behind a click, in a column of their own, next to 800px
of nothing. *Choice:* a fold pays for itself when the content is long or rarely
wanted; Setup is neither, so it is a plain titled section under the columns.
More generally, page *configuration* sits below page *content* rather than
competing with it for a column, and a column only exists when something
conditional is there to fill it. *Trade-off:* the page is longer by default.
*Consequence worth knowing:* unhiding Setup exposed a critical `select-name`
violation that had shipped for months — **`npm run a11y` cannot scan inside a
closed fold**, so every gate result is conditional on what was open when it ran.

**D-45 — Mode is a property of the activity, not a state of the UI.**
*Context:* four separate things decided what the workout form showed — a
hardcoded `<select>`, a sticky `fitness.tab` string, the persisted `split`
field, and `activity === 'Home'` equality in three modules. Nothing tied them
together, so Cardio rendered a strength "sets" box and Pickleball was offered a
distance field. *Choice:* one declarative registry (`src/domain/activities.ts`)
owns label, mode, required fields, best stat and mode copy; mode is derived via
`modeOf()` and never stored. *Trade-off:* adding an activity means editing a
table rather than a component, and legacy free-form values need a migration.
*Consequence worth knowing:* typing `Workout.activity` as `ActivityKey` found
every remaining free-form writer in a single `tsc -b`, including one in
`CaptureBar` a manual audit had missed — **a type is a better audit than a
grep**.

**D-46 — The Body cluster is four surfaces, and activities are not surfaces.**
*Context:* Pull-ups, Home workout and Pickleball sat in the nav as peers of
Coaching and Recovery, mixing two levels of taxonomy. *Choice:* collapse to
Fitness · Nutrition · Recovery · Coaching; the three activities become entries
on the activity select, with the retired ids rewritten in `readDeepLink` so old
bookmarks resolve. *Trade-off:* there is no router, so this is a read-time
rewrite rather than a real 301. *Consequence worth knowing:* the tools behind
those pages are not deleted — Pickleball's data is a different type entirely —
so each keeps one contextual link from zone 2 when its activity is selected.

**D-47 — Every page is at most three zones, and there is no fourth.**
*Context:* Body pages were flat stacks of 4–15 cards, with the most useful
visual (the training calendar) folded away and streak badges accreting at the
bottom. *Choice:* orient → act → review, one signature visual per page, at most
two raised cards, and content fitting none of the three belongs on another page.
Layout is a **container query**, not a viewport one, because the sidebar
collapses and viewport width is the wrong question. *Trade-off:* Recovery does
not fit the two-card cap — its remaining cards are genuine objects with their
own actions — and is knowingly left over it. *Consequence worth knowing:*
sticky cannot be declared unconditionally; a sticky column taller than the
viewport never scrolls to its own bottom, so `PageLayout` measures and falls
back to static.

**D-48 — An audit must test the feature, not the prop that feeds it.**
*Context:* the sweep grepped for `help=` and reported the Body cluster free of
help icons. But `Card` renders its ⓘ from `help ?? subtitle`, so removing the
prop only changed the popover text — every titled card with a subtitle still had
one, and the component directories were never globbed at all. *Choice:* a
`hideInfo` opt-out on `Card`, applied across the cluster, rather than deleting an
affordance 42 other cards rely on. *Trade-off:* two ways to render a card header
until someone decides about the app as a whole. *Consequence worth knowing:*
this is the second time a grep keyed on *how something is written* passed while
the thing itself was still drawn — the first was the six typographic folds. Both
were caught by looking at the page.

**D-49 — No hosted deploy target; the Pages workflow is retired, Vercel's code
stays.**
*Context:* `.github/workflows/deploy.yml` had run 8 times since 2026-06-24 and
failed 8 times. Every failure was the same one, and it was never a build
problem — the `build` job passed every time and `deploy` died on
`Failed to create deployment (status: 404) … Ensure GitHub Pages has been
enabled`. Pages was never switched on in repo settings, which is the step the
workflow's own header comment names. Someone eventually set the workflow to
`disabled_manually` to stop the noise, so it read as dormant rather than broken.
The `github-pages` environment still shows "last deployed 2026-08-02" because
`actions/deploy-pages` registers the deployment *before* calling the API — that
record was written 30 seconds before the run failed. **There has never been a
site behind it.**
*Choice:* delete `deploy.yml`. Do **not** touch `vercel.json` or `api/`.
*Why not delete those too:* Pages could not have hosted them anyway. `api/sync.ts`
and `api/feedback.ts` are serverless functions, and `vercel.json` carries the
entire security header set — CSP, HSTS, `X-Frame-Options`, COOP/CORP,
`Permissions-Policy`. GitHub Pages serves static files and **cannot set HTTP
headers at all**. Deleting them would strip those headers and break `bujocloud`
sync (`lib/bujocloud.ts:31,45`) and the feedback button
(`FeedbackButton.tsx:49`) — a feature removal, not a cleanup. They are inert
with nothing deployed, so they cost nothing to keep and stay ready to revive.
*Trade-off:* no hosted build of any kind right now; the app is dev-server and
local only. Reviving Pages means enabling it in settings **first**, then
restoring this file from git history. Reviving Vercel needs nothing but a
deploy.
*Consequence worth knowing:* `/api/sync`'s 4.5 MB Vercel body limit is the whole
subject of D-40 and of the photo-sync budget in `lib/imageStore.ts` — whatever
replaces Vercel inherits that constraint, or invalidates the budget built
around it.


**D-50 — A fold's default is decided by whose content it is.**
*Context:* `4609317` (2026-08-04) dropped 18 `defaultCollapsed` call sites on an
explicit "keep the dropdowns open" request, and `defaultOpen` is `true`
everywhere. That was right for analytics and it is what closed the
*reference-open, personal-collapsed* pattern on Stats, Pickleball and Focus.
Applied to a **manual** it is backwards: Coaching reached 5.80 screens with 32
disclosure points and Recovery 6.33 with 724px of set-once configuration and
869px of static guide, all open.
*Choice:* analytics, history and anything derived from the journal default
**open**; reference and set-once configuration default **closed**, and must
carry a `stickyKey`. The rule underneath is `docs/pages/README.md`'s: what the
app learned about you outranks what the app can tell everybody.
*Trade-off:* one extra click on a first visit to reach a technique or a coping
list. `stickyKey` is what makes it survivable — the choice persists — and it
bought 3.6 screens on Coaching and 2.2 on Recovery. **This narrows an explicit
past request rather than reversing it**, so it is applied per page and argued at
the call site, not made the global default.
*Consequence worth knowing:* closing a fold removes it from `npm run a11y`'s
view — `CollapsibleSection` unmounts its children. Anything closed must be
re-checked with `node scripts/verify-folds.mjs <view>`.

**D-51 — A gate seeds real data, and asserts that it did.**
*Context:* `scripts/a11y-axe.mjs` seeded `{ settings }` and nothing else, so
every card behind a `{rows.length > 0 && …}` guard — most of this app's
analytics — was never in the DOM. Every "0 serious, 0 critical" it had ever
printed meant "for the pages that were opened, **in their empty state**".
Arming it with `?demo=1` produced **16** serious violations in four of five
themes, some of them years old.
*Choice:* the gate loads demo data before scanning and **exits 1 if the seed did
not land**. The assertion is the point: a gate that silently falls back to an
empty journal prints the same reassuring zero as a working one, which is
indistinguishable from success.
*Trade-off:* empty states are no longer scanned — they are genuinely different
UI and want their own pass. Recorded as a known gap in
`docs/ACCESSIBILITY.md` rather than quietly dropped.
*Consequence worth knowing:* this is the **third** way this gate has been caught
grading something other than the app — after "cannot see inside a closed fold"
and "cannot see a page missing from `VIEWS`". Assume there is a fourth. When a
gate reports clean, ask what it was looking at before believing it.

**D-52 — `cat('crust')` is not a foreground; `onAccent()` is.**
*Context:* `crust` is the light-on-*saturated* half of a colour pair and is
near-white in the light themes, so `crust` on a fill is correct in Mocha and
fails in Latte and Dawn. `onAccent()` was written to solve exactly this and had
**two adopters against 21 hand-written `cat('crust')` call sites** — a helper
built and then not rolled out. `PlateStack` carried the assumption in a comment:
`/* Catppuccin Mocha crust */`, correct for one theme in five, out loud.
*Choice:* every foreground on a fill goes through `onAccent(fill)`, which picks
the better neutral per theme and pushes it to 4.6. Its partner mistake —
`cat('overlay0')` as text on the *neutral* branch of the same ternary, 2.57:1 at
10px — takes `subtext0`.
*Trade-off:* a function call per fill rather than a constant, and Stats'
`moodColor` had to emit hex rather than `hsl()` so `onAccent` could parse it.
*Consequence worth knowing:* `docs/ACCESSIBILITY.md` had recorded
`complete ? crust : overlay0` as the **correct** pattern. That one expression is
both bugs at once, which is why the rule is stated as: when a ternary picks a
foreground per state, **both branches are a decision**.
