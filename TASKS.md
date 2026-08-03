# bujo — pending tasks & bugs

**Generated:** 2026-08-02 · branch `feat/ui-polish` · commit `dbcdbf3`

> **Redesign steps 1–9 are shipped** — tokens, type scale, accent-inflation pass, motion pass and the bullet-glyph signature. See `docs/redesign/10-redesign-build.md`.
>
> ⚠️ **Correction:** the earlier "24 views × 5 themes" verification was invalid — it drove navigation with `popstate`, which this router ignores, so it re-measured Today every time. Re-run by clicking nav buttons and asserting 18 distinct `h1`s. Corrected results are in the build record.
>
> **Superseded:** steps 1–4 — see `docs/redesign/10-redesign-build.md`. eslint is at **0 errors** (was 17), the type scale is live across 113 files, fonts are self-hosted, and `?view=kitchen-sink` shows every primitive. Steps 5–10 (per-cluster restyle, motion, accent-inflation pass) remain.
>
> **Newest thing here → [§H, the redesign brief in `docs/new/`](#h-redesign-brief--docsnewfiles-new-untracked).** It's the biggest item on this page and it collides with shipped work in four places. Decide H1–H4 and H10 before anything else in it starts.

**How to use this file:** mark each item you want done. Leave the rest alone.

- `[ ]` = untouched, I ignore it
- `[>]` = **do this** (I pick these up)
- `[~]` = do it, but ask me first
- `[x]` = done / already handled
- `[-]` = won't do, drop it

Add a note after any line (`— why / how you want it`) and I'll follow it.

---

## Verification baseline (as of this scan)

Everything below is confirmed by running it, not inferred.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc -b` | ✅ exit 0 |
| Tests | `npx vitest run` | ✅ 41 files, 678 tests passed |
| Build | `npm run build` | ✅ 537ms, PWA precache 60 entries |
| Lint | `npx eslint .` | ✅ **0 errors**, 2 warnings (was 17 errors) |
| Dev server | `npm run dev` | ✅ http://localhost:5173 |
| All 24 views × 5 themes | in-browser sweep | ✅ 0 blank, 0 overflow, **0 runtime errors** |
| View smoke script | `npm run smoke` | ❌ crashes (missing dep) |

> ⚠️ `npx tsc --noEmit` typechecks **nothing** in this repo (solution-style tsconfig, always exits 0). Always use `npx tsc -b`.

---

## A. Blockers / decisions only you can make

- [ ] **A1 · Open the PR stack.** 3 PRs open, all stacked, all already ancestors of `HEAD`:
  - #77 `feat/ui-feedback-keyboard` — toast + keyboard layer
  - #78 `feat/ui-resilience` — error boundary, skeletons, empty states, offline banner
  - #79 `feat/ui-polish` — one button system + motion tokens + CollapsibleSection
  Since they stack, merging #79 alone carries all 9 commits. Decide: merge all three in order, or squash into one PR to `main`.
- [ ] **A2 · `package-lock.json` is modified.** `node_modules/.bin/` was empty — the tree was copied from Linux and the symlinks died, so `vite` wasn't runnable. `npm install` fixed it but rewrote the lockfile with Windows-resolved deps. Commit it, or `git checkout package-lock.json` and treat this machine as install-only?
- [ ] **A3 · `scripts/ship.sh` shows as modified but has no content change** — file mode 755→644, a Windows-checkout artifact. Fix: `git config core.fileMode false`, then `git checkout scripts/ship.sh`.
- [ ] **A4 · `STATUS.md` is still the blank template.** Workspace rule (`CLAUDE.md`) says fill it when you stop. Want me to write it from the current state?

---

## B. Bugs — verified, with evidence

- [ ] **B1 · Supabase project no longer exists → all account/cloud-sync features are dead.**
  `VITE_SUPABASE_URL` in `.env` points at `ueahhgqxshfvkjgcwtnh.supabase.co`. DNS returns **NXDOMAIN** while `supabase.co` itself resolves (`76.76.21.21`) — so the project was deleted or its ref changed, this is not a local network problem. The app fires `/auth/v1/settings` twice on boot (`src/lib/supabase.ts:24`), both fail `ERR_NAME_NOT_RESOLVED`, and the failure is silent: no user-facing message, sign-in just never appears.
  Fix options: (a) point at a live project, (b) unset the vars so the null-client path kicks in cleanly, (c) surface "cloud unavailable" in the UI instead of failing silently.
- [ ] **B2 · Duplicate boot probe.** That same `/auth/v1/settings` request fires **twice** per load. Likely a double-invoked effect (StrictMode) with no in-flight guard. Cheap fix, and it halves the failure noise.
- [ ] **B3 · `npm run smoke` and `npm run shots` crash locally.** Both scripts `require('playwright')`, which is not in `package.json` (CI installs it with `npm i -D --no-save`, so CI is fine). Locally you get a raw `MODULE_NOT_FOUND` stack. Fix: catch the require and print "run `npm i -D --no-save playwright` first", or add it as an optional devDependency.
- [ ] **B4 · Bundle regression.** `dist/assets/index-*.js` is now **687 kB** (203 kB gzip). BUJO-224 got it to 642 kB; it has grown 45 kB since. Rolldown warns over the 500 kB budget. Worth a chunking pass.
- [x] **B5 · Reading view renders no `<h1>`/`<h2>` in `<main>`** — fixed on
  `fix/a11y-gaps`. Its top-level section titles (three shelves, Stalled books, the yearly
  goal) are now real `<h2>`s; headings inside the collapsible analytics groups stay `<h3>`.
  Tag change only — the type scale lives in the class list, so nothing moved visually.

---

## C. Lint debt — ✅ CLEARED (17 errors → 0)

Done 2026-08-02. Full breakdown in `docs/redesign/10-redesign-build.md`.

- [x] **C1 · `set-state-in-effect` (4)** — real fixes, not suppressions: `ExerciseDB` and
  `ReminderBanner` now derive the cleared state instead of writing it from an effect body;
  `CommandPalette` resets during render via the documented prop-change pattern; `countUp`
  returns a derived value under reduced motion.
- [x] **C2 · `only-export-components` (7)** — `muscles.ts` and `countUp.ts` extracted to `lib/`;
  `Ring`/`CountUp` moved to `components/ui/ring.tsx`. The remaining four are documented
  exceptions: two context hooks beside their providers (matching the existing convention in
  `device.tsx`/`Page.tsx`), and two vendored shadcn files whose export shape `shadcn add`
  regenerates.
- [x] **C3 · `no-explicit-any` (5)** — wger response typed. Typing it immediately surfaced a real
  latent bug: `json.next` is `undefined` on the last page, which the `any` had been hiding.
- [x] **C4 · `react-hooks/refs` (1)** — `speech.ts` ref-write moved out of render into an effect.
- [ ] **C5 · `exhaustive-deps` (2 warnings)** — `src/App.tsx:136` and `:188`, missing `replaceAll`.
  Left alone: both are boot-path effects where adding the dep changes behaviour. Verify intent first.

---

## D. Dead code / cleanup

- [ ] **D1 · Delete `archive/components/`.** The three duplicate `CollapsibleSection` copies, already commented out and outside the TS program. Left in place last session because deletion is deny-listed — needs your go-ahead.
- [ ] **D2 · Prune ~20 merged `feat/*` branches on origin.** Carried across three worklog entries, never done.

---

## E. Feature backlog — open tickets

From `docs/TICKETS.md`. These are the only items still marked 🔜/◑ after the last audit.

- [ ] **E1 · R2-7 / BUJO-91 — unified `Goal` data model.** One type spanning habits, challenges, fitness and focus, with a cross-view roll-up. The Goals *view* shipped (A-02); the *model* didn't. Genuine design work, not a mechanical change.
- [ ] **E2 · R2-10 / P-9 — accounts + E2E-encrypted cloud sync.** Needs a backend, so it's out of the current local-first scope. R2-1's at-rest crypto is the client half. Blocked on a scope decision from you, not on code.
- [ ] **E3 · BUJO-176 — same-unit tracker combined totals/compare.** Logged as "if that was the intent" — needs you to confirm what you actually wanted.
- [~] **E4 · AUD-5 — deferred a11y, mostly done.** Monthly day cells now carry a full
  `aria-label` (date, items, mood, habit progress) + `aria-current="date"`; the weekly
  reflection and gym-routine saves fire toasts. Heatmap and the Focus charts already had
  `role="img"` labels, so the remaining piece — "Focus → `ChartCard`" — is a cosmetic
  refactor, deliberately not done.
- [ ] **E5 · BUJO-94 tail — axe-core CI job.** Chart text-alternatives are all done; only the CI wiring is left.
- [ ] **E6 · PRODUCT_GAPS #2 — sync-conflict prompt on silent cloud load.** `updatedAt` stamping exists; the newer/older prompt only fires on first-run folder pick, not on silent reload. Touches the App boot path.
- [ ] **E7 · PRODUCT_GAPS #7 — Playwright e2e.** Related to B3; CI currently has no e2e gate.
- [ ] **E8 · ~561 unbuilt items in `docs/FEATURE-BACKLOG-500.md`** (582 rows total). Pick a batch if you want more feature volume — otherwise this stays parked.

### Held indefinitely (need infra or a dependency decision)
- [ ] Real backend: account deletion, multi-device server sync
- [ ] Tauri-native plugins: tray, notifications, autostart, native filesystem
- [ ] Apple Health / Obsidian importers
- [ ] Home-screen widgets / Wear OS (native shell), social challenges (backend)

---

## F. UI/UX backlog leftovers

From `docs/UIUX-CRAFT-BACKLOG.md`. The feedback/keyboard/resilience/button work is done (PRs #77–#79); these survived.

- [x] **F1 · Hand-rolled buttons — judged, not swept** (branch `refactor/button-adoption`).
  Seven real buttons migrated: `Onboarding` "Show me", `RestTimer` play/pause + reset,
  `ReminderBanner` enable + dismiss, `SmartInput` Go to / Merge, `HabitDetail` and
  `ExerciseDB` close ×. Insights also lost a *fourth* private copy of
  `CollapsibleSection`. **Left raw on purpose**, with reasons in the commit: row and
  card click-surfaces (Collections rows, Insights results/jump list/topic cards,
  CoachCard tips, TodayPlanCard banner, ExercisePicker "+ Add"), selection chips
  (Insights kind filters, RestTimer presets — that is the chip system, consistent with
  itself), and chip internals (CaptureBar: a 20px pill cannot hold a 24px icon button).
  `ExploreBanner` was already on `Button` — the list was stale. ~175 raw `<button>`
  remain and most of them should stay that way.
- [x] **F2 · Skip-to-content link — already shipped.** `AppShell` has rendered one since
  the shell work; only `docs/ACCESSIBILITY.md` was stale. Doc corrected.
- [x] **F3 · Focus trap** — `src/lib/useFocusTrap.ts` (6 tests) + adopted by all eight
  hand-rolled overlays; Radix dialogs (quick-add, shortcut help, confirm) already trapped.
  Traps Tab only, no `focusin` guard — these overlays open Radix confirm dialogs that
  portal outside the trapped node. Verified in-browser: Tab wraps, Escape restores.
- [ ] **F4 · Palette fuzzy matching** — today it's a plain substring filter (`CommandPalette.tsx:97`); no recent/frequent ranking.
- [ ] **F5 · Vim-style jumps** — `g t` Today, `g s` Stats, `j`/`k` between entries, `x` toggle status.
- [x] **F6 · Persist last tab/range/section** — `useStickyState` (localStorage under
  `bujo.ui.*`, deliberately *not* the journal store: it syncs and it has an undo stack).
  Applied to FitnessHub tabs, Trackers day/week/month, and Insights' six sections via an
  opt-in `stickyKey` on `CollapsibleSection`. 5 tests.
- [x] **F7 · Deep links** — `?view=&day=` now round-trips: written on every navigation,
  read on boot, day seeds the cursor. `replaceState` not `pushState`, because this router
  ignores `popstate` and a Back button that silently does nothing is worse than none.
  **Not done:** entry-level anchors (`&entry=<id>` + scroll/highlight) — day granularity
  only.
- [x] **F8 · Collapse long entry text** — entries over 180 chars clamp to two lines with
  `show more` / `show less`. Character threshold, not rendered height, so the control does
  not appear and vanish as the column resizes.
- [x] **F9 · One `Pill`** — rewritten around `tone` (`wash` / `muted` / `solid`) and
  scale-named `size` (`micro` / `caption` / `label`); 18 hand-rolled sites in 12 files
  migrated. Two reconciliations toward the majority: `33` washes dropped to `22`, and the
  `surface0` count pills moved to `surface1`. **Note:** every pill now reads its colour
  from one file, so §I1 (accent-as-text failing AA in latte) becomes a one-file fix.
- [ ] **F10 · Decide `SyncIndicator`'s fate** — fold into the toast system, or keep it deliberately as a status pill. Right now both exist by accident.

---

## G. External — only you can do these

Nothing here is code; each is a click in someone else's dashboard.

- [ ] **G1 ·** Fix or retire the Supabase project (see B1). Sign-in stays hidden until a provider is live.
- [ ] **G2 ·** Enable Google provider in Supabase — the sign-in button auto-reappears when it's on.
- [x] **G3 ·** ~~Enable GitHub Pages~~ — **resolved by disabling instead** (2026-08-02).
  The `Deploy to GitHub Pages` workflow ran on every push to `main` and failed
  every time, because Pages was never enabled on the repo. Production already
  ships to Vercel via `scripts/ship.sh` (see `docs/PIPELINE.md`), so Pages was a
  second, unused deploy path putting a permanent red X on `main`.
  Set to `disabled_manually` via `gh workflow disable`; the workflow file is
  untouched. To bring it back: enable Pages in repo settings, then
  `gh workflow enable "Deploy to GitHub Pages"`.
- [ ] **G4 ·** Delete the smoke-test account `bujo-smoketest-260616@example.com`.
- [ ] **G5 ·** Self-host stack: set `PGRST_JWT_SECRET` + certs, `docker compose up -d`, then paste the API URL + JWT into Settings → Self-host.
- [ ] **G6 ·** Tauri build prerequisites (Linux box): webkit2gtk/libsoup via sudo script, then `npx @tauri-apps/cli icon` before `npm run tauri:build`.

---

## H. Redesign brief — `docs/new/files/` (new, untracked)

Five files, 1031 lines, not in git (untracked, **not** gitignored):

| File | What it is |
|---|---|
| `bujo-redesign-prompt.md` | 212-line brief: diagnosis, tokens, type system, 10 numbered tasks, definition-of-done, a 7-step sequenced workflow |
| `tokens.css` | The token layer, ready to drop in — plus base element styles and `.num` / `.col` / `.rule` helpers |
| `ui.css` | 268 lines of component CSS: `.btn` (3 variants), `.card`, `.section-head`, `.field`, `.seg`, `.stepper`, `.glyph`, `.entry`, `.tag`, `.ring`, `@keyframes roll`/`tick` |
| `ui.jsx` | The primitives: `Button`, `Card`, `SectionHeader`, `Field`, `Rolling`, `SegmentScale`, `Stepper`, `LogEntry`, `FastRing` |
| `KitchenSink.jsx` | The `/kitchen-sink` review route the brief's step 2 asks for |

The diagnosis is sound and the reference implementation is real, working code — not a mood board. But it was written against a screenshot, so it doesn't know what this codebase already is. **These are the collisions. Decide them before any code is written**, because most of them are one-way doors.

- [x] **H1 · DONE: remapped, not replaced.** The brief is plain CSS with a `tokens.css` import; the app is **Tailwind v4 + shadcn**, styled through Catppuccin CSS vars. The definition-of-done check `grep -rE "#[0-9a-fA-F]{3,6}" src/` already passes trivially today (colors are Tailwind class names, not hex) — so that check would *pass* while proving nothing. Pick one: (a) remap the token values into the existing Tailwind/Catppuccin var layer and keep utility classes, (b) adopt the brief's plain-CSS classes as a parallel system, or (c) full rewrite off Tailwind. **(a) is the only one I'd recommend** — (b) leaves two systems alive, which is precisely the failure mode the brief itself warns about.
- [x] **H2 · DONE: `--fg-3` computed per theme, all ≥ 4.5:1.** Computed against the brief's own surfaces:

  | Value | On `--ink-0` `#0B0B0F` | On `--ink-1` `#131218` (cards) |
  |---|---|---|
  | `#6B6878` (the prompt) | 3.63:1 ❌ | **3.44:1** ❌ |
  | `#7A7788` (tokens.css) | 4.51:1 ~ | **4.28:1** ❌ |

  Note the two files already disagree — `tokens.css` has silently bumped the value, which suggests this was noticed but not finished. The brief flags it too ("check `--text-3` specifically — it's borderline"). It isn't borderline on cards, it fails. Last session moved 555 text uses off `overlay0`/`overlay1` for this identical reason; adopting `--text-3` as-is for body text walks straight back into it. Fix: lift to ≥ `#8A8798` before adoption, or restrict `--text-3` to non-text decoration only.
- [x] **H3 · DONE: self-hosted via @fontsource; CSP tightened.** `tokens.css` line 1 is an `@import` from `fonts.googleapis.com`. CSP is **enforced** (BUJO-156, verified at 0 violations) and the app is an offline-first PWA. That import means a CSP amendment, a render-blocking third-party request, a privacy leak on every load, and no fonts offline. Self-host the three families instead (`@fontsource/*` or vendored woff2) — same typography, none of the cost.
- [x] **H4 · DONE: all five survive; mocha is canonical.** The app ships mocha / latte / neon / vscode / dawn, with a Settings swatch picker and **theme-aware charts** (`THEME_PALETTES` + `cat()` in `lib/colors`, AUD-6). The brief specifies exactly one dark palette and "one accent. One." Is this a 6th theme, a replacement for mocha, or does it delete the theme system? This decides how much of `lib/colors` survives.
- [ ] **H5 · "Visual pass only" — but three tasks aren't.** The brief says "do not change data models, storage, or business logic … every existing feature must still work identically", then asks for: sliders → 10-segment tap scale (§4, an input-model change), "reduce card count" (§1, an IA change), and top-bar reduction to 3 controls (§2, moving 7 features into the palette). Those are fine changes — they just aren't visual, and two of them **overwrite BUJO-231**, the three-tier card-layout pass shipped across all 23 views. Confirm you want that undone.
- [ ] **H6 · Scope is bigger than the brief thinks.** §10 lists 12 pages. The app has **18 nav views plus Settings**. Missing from the brief: Monthly, Goals, Insights, Stats, Collections, Reading, Settings. Settings alone is 5 tabs and 61 kB. Realistic scope is ~1.5× what's written.
- [ ] **H7 · Already shipped — don't rebuild.** The brief asks for six things that landed in PRs #77–#79 last session: global `:focus-visible` ring, the `prefers-reduced-motion` block (§9's "non-negotiable" snippet is already in `index.css`), one Button system with variants, ⌘K command palette, `aria-label` on every icon-only button, motion duration/easing tokens. Reconcile against what exists rather than writing them twice — the brief's ring spec and the shipped one differ, so pick a winner.
- [x] **H8 · DONE: kitchen sink written in TSX.** Reference files are `.jsx` + plain `.css`; the repo is TypeScript with `tsc -b` in CI. `ui.jsx` and `KitchenSink.jsx` need porting to `.tsx` with real prop types before they compile.
- [ ] **H9 · `framer-motion` is not a dependency.** §9 allows it for springs. Adding it is ~34 kB gzip on a bundle already 45 kB over budget (B4). The spring easing is already in `tokens.css` as `--spring` — CSS may be enough. Decide before installing.
- [x] **H10 · Step 0 audit — DONE → `docs/redesign/09-redesign-audit.md`.** Every view measured, every token layer located, migration costed by cluster. Headline: **the brief's premise that primitives don't exist is wrong** — 6 of the 7 it plans to extract already exist and are adopted in 23/25 views. Real scope is narrower (tokens, type, weight, 188 raw buttons in 8 hot files) but the page count is **25, not 12**. Remaining steps 1–7 stay blocked on H1–H4 below.
- [x] **H12 · RESOLVED: the scale is in rem, FONT-1 lives.** The brief's scale is `32/22/17/15/13/11` in px. FONT-1 ships a global S/M/L/XL text-size setting that works by scaling the rem root (with `.fig-fixed` counter-scaling so charts stay put). **Fixed px in `tokens.css` breaks it.** Either the type scale goes through rem, or the font-size setting dies. Also: none of the 6 target values map cleanly onto Tailwind's scale (each is 1–2px off), so every one needs a theme extension. **Blocks step 1.**
- [x] **H14 · Dawn can't carry three text tiers — DECIDED: collapse.** Computed across all five themes: the third tier works comfortably in the three dark themes (`overlay2`, 5.6–6.1:1) and narrowly in latte (`#6b7075`, 4.74:1). Dawn's cream surfaces leave a band barely one step wide — the best warm candidate `#7a6e5d` lands at **4.52:1, two hundredths above the floor**, so any future surface tweak breaks it silently. **Shipped as a collapse to the secondary tier: dawn renders two text tiers, not three.** Override if you'd rather take the fragile value.
- [x] **H15 · DECIDED: added a 7th step, `micro` (10px).** The audit's 814 count only caught *named* classes. Including bracketed sizes the real total is **955 sites**, of which **`text-[10px]` ×88, `text-[11px]` ×45 and `text-[9px]` ×8** are smaller than `caption` (11px), the smallest step in the agreed scale. They cluster in dense data surfaces — Trackers 17, Reading 6, Insights 6, Coaching 6, MatchupCards 6. Mapping them up to `caption` makes 141 pieces of text **larger** in exactly the layouts tuned to be tight. Options: (a) add a 7th step below caption (`micro`, 10px) for data-dense surfaces, (b) let them round up to `caption` and accept the density change, (c) leave bracketed values in place for chart/grid internals and exempt them from the DoD. **(a) is my recommendation** — it's one more token and it keeps the rule honest, versus (c) which puts 141 sites permanently outside the system.
- [x] **H16 · DECIDED: role-based mapping — the two dominant tiers grow 1px.** 735 of the 814 named sites are just these two. The app's de-facto body size is `text-sm` (14px, 337 uses) with `text-xs` (12px, 398 uses) beneath it — so **the app currently runs a full step smaller than the brief's scale**, and `body` (15px) would go essentially unused under the audit's literal mapping. Two readings: **(i) preserve density** — `xs→caption`, `sm→label`, everything shrinks ~1px and `body` stays unused; **(ii) implement the brief's intent** — `xs→label`, `sm→body`, nearly every string grows 1–2px and the app gets the comfortable 15px reading size the scale was designed around, at the cost of re-tuning dense layouts. (ii) is what the brief asks for; (i) is what the current app is. Your call — it changes how every screen looks.
- [ ] **H13 · Audit's recommended plan changes** (detail in §8 of the audit doc): move the shell from step 7 to step 2 (it sets width/nav/top-bar for every page, so doing it last re-touches everything); rewrite the hex definition-of-done check to exclude the token files (it currently flags the token layer itself, 255 of 392 matches); mock the 820px column on one view before committing to a 40% narrowing app-wide; budget the accent-inflation pass separately since no tool can measure it.
- [ ] **H11 · Commit `docs/new/`?** (still open) Currently untracked and not ignored, so it'll follow you into any commit that stages broadly. Track it as the design source of record, or move it out of the repo.

---

## Suggested order, if you want one

1. **A2, A3** — clean the working tree first, so nothing else is confused by it.
2. **A1** — get the 9 UI commits merged before they rot. Do this **before** any redesign work; the redesign touches the same files and merging afterwards would be a conflict marathon.
3. **B1, B2** — the only bug a real user would actually hit.
4. **H1–H4, H10** — settle the redesign's one-way doors. Nothing else in H can start until the stack, the contrast values, the fonts, and the theme question have answers.
5. **H10 step 0** — the audit table. No code, and it sizes the real job.
6. **C1–C5** — lint debt in one mechanical pass; all 17 gone. Good filler while H is being decided.
7. **D1, B3, B5** — small cleanups.
8. Then the redesign proper, or pick from **E** / **F** by what you want the product to do.

---

## J. Icon & button system — Stage 0 done, Stage 1 needs a go-ahead

Full spec + the Stage 0 audit: **`docs/ICON-BUTTON-SYSTEM.md`**. Three decisions
are settled and not up for relitigation: Phosphor icons with weight (not colour)
as the active signal, one **tonal** loud button per screen (no solid accent fill
anywhere), and shadcn controls with the variants rewritten.

**Verification rule for every stage: all five themes — mocha, latte, neon,
vscode, dawn.** Not mocha plus a spot check. Three themes redefine the accent
(dawn's is an *amber*), two invert surface polarity, and dawn renders two text
tiers where the rest render three. A wash that reads on near-black can vanish on
cream. Anything checked in mocha alone is unchecked.

- [x] **J0 · Stage 0 audit — DONE.** Headlines, all of which change the plan:
  - **24 routes**, not ~25. 21 nav rows (2 settings-gated), `gym` is an alias.
  - **The theme bridge already exists and runs the other way**: `index.css`
    defines shadcn's vars *from* Catppuccin, and `tokens.css` defines the
    purpose layer *from* those. Adding the spec's `shadcn-bridge.css` would give
    the same variables two definitions. Recommend extending the existing layer.
  - **The Stage 1 hazard does not apply** — themes are already on
    `:root[data-theme=…]` on `documentElement`, so a `:root` bridge resolves.
  - **`--text-3` already clears 4.5:1 in all five** (4.74–6.55:1). That stage is
    done; dawn is the known exception that renders two tiers, not three (§H14).
  - **Tailwind v4, no config file, zero `.jsx`** — install with TypeScript, and
    the "content globs" question does not apply.
  - **Cost is bigger than the spec assumes:** lucide is imported in **85 files**
    at **16 distinct px sizes** (none rem, so none track the font-scale
    control); the `Button` cva has **8 sizes** against a target of 3; there are
    **10 distinct radii** against a target of 3; and **37 solid-accent buttons**
    (8 explicit `variant="default"` + 29 bare `<Button>`) are what decision 2
    deletes.
- [x] **J1 · Stage 1 — DONE. Tokens extended, not bridged twice.** All four open
  questions answered "go with the recommendation". Added `toggle-group`,
  `toggle`, `command` (+ `cmdk`); added the wash (oklab 14% / 20% hover), the
  danger wash, three radii (8/14/pill) and three control heights (28/36/44, in
  rem). Verified in **all five themes** on the rendered kitchen sink.
  - **The finding:** a tonal primary puts the accent *as text* on the accent *as
    a wash* — which failed AA in latte (4.39:1) and dawn (4.07:1), and the
    destructive equivalent failed in latte, vscode and dawn (3.80–4.28:1). §I1
    arrived early. Fixed at the token: `--color-brand-text` and
    `--color-danger-text` are per-theme, so nothing downstream has to remember.
    Everything now measures **5.05–7.00:1**.
  - Wash visibility ΔE 10.4–16.4 across the five, so no theme needed a local
    percentage override.
  - `shadcn add` cannot resolve this repo's `@` alias (solution-style root
    tsconfig, no `paths`) and writes to a literal `@/` folder. Files copied by
    hand; `@/` is gitignored + eslint-ignored as a reference copy.
- [x] **J2 · Stage 2 — DONE. lucide → Phosphor, behind one wrapper.** 85 files,
  397 JSX icons converted by codemod (`scripts/codemod/`, kept because it
  documents the 144-glyph mapping better than a diff), plus 19 dynamic-glyph
  sites by hand. `components/icons.ts` is the only importer of Phosphor;
  `components/Icon.tsx` owns size (three steps, **rem**) and state (**duotone
  when active, regular at rest** — never a colour change).
  - Verified in **all five themes**: active glyph = 2 paths with an opacity
    layer, resting = 1 path, at 1.125rem, in each theme's `--color-brand-text`.
  - Rating stars and the important marker dropped `fill` for `active`, so state
    reads as weight like everywhere else. `VideoLink`'s px `size` prop became a
    scale step.
  - The five vendored shadcn primitives point at the registry too, so the app
    ships one icon library. Caveat: `shadcn add` reintroduces lucide imports in
    anything it regenerates.
  - **Cost, flagged not hidden:** the icon set is 413 kB raw / 93 kB gzip in its
    own chunk. Phosphor ships six weights per glyph and two are used, so ~2/3 is
    unshakeable with this package layout. Decide in J6 whether to trim the
    vocabulary or generate a two-weight local build. Relates to **B4**.
- [x] **J7 · Weight & alignment contract — `docs/LAYOUT-WEIGHT-ALIGNMENT.md`.**
  Every card and component gets a weight (1 primary / 2 working / 3 quiet) and
  an explicit side: **left is identity, right is state and actions**. Applied
  already: `EntryRow`'s `!` moved out of the left gutter into one right-hand
  cluster with `×` (the log gets that indent back on every row), and **Today is
  now three weighted columns** — full-width command band, log at two of three
  tracks, tap-to-log and quiet cards in the third.
- [x] **J8 · Stickers ("Decorate the day") removed — including saved data.**
  Confirmed destructive: the Today card, the Monthly day-cell strip, the store
  actions, the demo seeding, the type field and `StickerBar.tsx` are gone, and
  `migrate()` strips `stickers` from any journal it loads. Stickers placed
  before this upgrade survive only in backups taken before it.
- [x] **J3 · Stage 3 — DONE (except the ToggleGroup rebuild).** Four variants
  (`primary` tonal / `secondary` / `ghost` / `danger`), three heights in rem
  (28/36/44), one radius token, no shadows. All 240 call sites migrated:
  `default`→`primary` (31 solid fills gone), `outline`→`secondary`,
  `link`→`ghost`, `destructive`→`danger`. Default variant is now `secondary`,
  so a bare `<Button>` can no longer become an accidental primary.
  - Selection state (Trackers type / time-of-day) demoted from the solid
    variant to wash-on-`secondary` — selection is not the screen's action.
  - `src/lib/onePrimary.ts` warns in dev when a view mounts two primaries,
    counting *mounted* components rather than grepping source.
  - **Bug found and fixed by measuring, not reviewing:** tailwind-merge cannot
    distinguish custom `text-label` (size) from `text-brand-text` (colour), so
    a small primary rendered in the foreground colour. Sizes now use
    `text-[length:…]`.
  - **`Segmented` is now Radix `ToggleGroup`** (same API, ~30 call sites
    unmoved). Roving focus is off because with it on every item computed
    `tabIndex: -1` — the control could not be tabbed into at all. Deselect is
    refused; the selected colour is inline, bound to `--brand-text`, because the
    vendored `toggleVariants` ships a competing `data-[state=on]:text-*`.
    Its filled grey track became a hairline: the wash had been stacking on a
    lighter base and vscode measured **4.63:1**, 0.13 above the floor. Now
    7.00 mocha · 5.94 neon · 5.86 vscode · 5.49 dawn · 5.35 latte.
  - **`Stepper` is deliberately not on `ToggleGroup`** — a toggle group picks
    one of a set; a stepper nudges a number, with hold-to-repeat and a typing
    escape hatch. Its ± controls do go through `Button`.
  - Radius overrides are gone (the codemod removed 17 on buttons).
- [x] **J4 · Stage 4 — DONE.** `/kitchen-sink` now carries its own five-theme
  switcher and S/M/L/XL text-size control, both driving the real settings (a
  faked switch would hide the §I2 palette desync). Swept **5 themes × 3 scales
  = 15 combinations**: 0 page overflow, 0 clipped buttons, 0 card overflow, and
  heights scaling 25/32/40 → 28/36/44 → 35/45/55, which is the rem sizing
  proving itself.
- [~] **J5 · Stage 5 — started.** Today (weighted three columns, §J7) and the
  copy rules are done; the per-view container-tier and hex-literal work is not.
  - **Empty states** are invitations now, not status reports: eleven bare "No X
    yet" strings name the action instead ("Log a workout to see which splits you
    actually train").
  - **Error copy** says what happened *and* what is still true — and Drive's
    eight blocking `alert()` calls became toasts, which also stops a modal
    freezing the in-browser review loop.
  - **Codemod damage repaired:** the lucide→Phosphor rename hit *prose*. Five
    user-visible strings shipped as "MagnifyingGlass your Drive…" and
    "PersonSimpleRun layout" before a grep of every renamed name back out of
    string literals found them. The hazard is now written into the script:
    `Search`, `Activity`, `Settings`, `Scale` and `Repeat` are ordinary English
    words, and an 85-file diff hides this perfectly.
- [~] **J6 · Stage 6 — mechanical half DONE.** 0 lucide refs, 0 Phosphor imports
  outside the registry, 0 px icon sizes, 0 px font sizes, 0 solid-accent
  buttons, exactly 3 control heights, and the ten radii collapsed to three
  (`card` ×144, `pill` ×143, `control` ×137) by codemod.
  **Not cleared, with reasons in the doc:** 34 side-specific/geometry radius
  stragglers; ~170 hex literals that are mostly *data* (theme swatch previews,
  chart palettes, habit colour pickers) and need carving out before the check
  can be a gate; ~174 deliberately-raw `<button>`; `Segmented`/`Stepper` not yet
  on `ToggleGroup`.

---

## I. Contrast & theme — parked 2026-08-02 (do not start without a decision)

Measured, not started. Two separate things, don't conflate them:

- [ ] **I1 · Semantic accent colours fail AA as text.** In latte, measured over
  757 real text nodes: green `#1e8e3e` at 3.99:1, orange `#e8710a` at 3.09:1,
  blue `#1a73e8` at 4.27:1, and any accent-on-its-own-wash pill at ~1:1
  (e.g. `#f29900` on `rgba(242,153,0,0.13)`). These are status colours used as
  *text*, which is the part that has to clear 4.5:1 — the same class of bug the
  earlier session fixed for the muted greys. Needs a per-theme tuned set of
  "accent, but legible as text" values, like `--fg-3` got.
- [ ] **I2 · `cat()` does not follow a direct `data-theme` change.** Setting the
  attribute on `<html>` repaints CSS surfaces but leaves the JS palette on its
  previous theme, so inline `style={{ color: cat(...) }}` renders *latte
  foregrounds on mocha surfaces*. Via Settings the store calls
  `setActiveTheme`, so the normal path is fine — but any other way of changing
  the attribute silently desyncs. Worth a guard (subscribe to the attribute)
  rather than relying on every caller remembering.

Note: this also means **any earlier "N low-contrast nodes" figure in this file
or the build record was measured through a desynced palette** and overstates the
problem. I1 above is the re-measured, trustworthy version.

---

## K. Information architecture & routing — Stages 0–4 DONE, Stage 5 open

The third pass (`bujo-ia-routing-prompt.md`). Structure, not styling: no new
visual language, no data-model change. Full contract in **`docs/ROUTING.md`**.

- [x] **K0 · Stage 0 audit — DONE. The headline: there was no router.**
  `App.tsx` held `useState<ViewId>`; `lib/deepLink.ts` mirrored it into
  `?view=`/`?day=` with `replaceState`, and its own comment said why — nothing
  listened for `popstate`, so pushed entries would have built a Back button
  that silently did nothing. Stage 1 was therefore "add routing to an app that
  has none", not "put the date in the existing router".
  - The day was **not** `useState` in Today: `CursorProvider` already owned it,
    seeded once from `?day=`. The single-source part existed; only its source
    was wrong.
  - The sidebar was already data-driven (`NAV`, 21 entries, 17 visible).
  - **Dead wire found:** `metric.fastBreak` ("First meal") is written by the
    wellbeing card and read by *nothing*, while `FastingCard`'s own subtitle
    says "end it at your first meal". Still open — see K6.

- [x] **K1 · Stage 1 — the day is in the URL.** `#/day/:date`, react-router.
  `HashRouter` on a deployment constraint, not taste: GitHub **project** Pages
  serves at `/bujo/` with no SPA rewrite, so clean paths need a per-host `base`,
  a `basename`, a `404.html` shim and a PWA `navigateFallback`. `isISODay`
  validates by round-tripping the formatter, because `new Date(2026, 12, 45)`
  rolls `2026-13-45` to 2027-02-14 and a regex would let it through. Chevrons
  are `<Link>`s so middle-click works. Future days render the capture field
  disabled ("Nothing to log yet") at an identical 41px, so stepping across
  today does not resize the card.

- [x] **K2 · Stage 2 — five sections, every view a real URL.** 21 nav entries
  across 7 groups → 5, headers deleted (they were scaffolding for the count).
  Paths are data in `src/lib/routes.ts`; `ViewId` was kept so ~30 `useNav()`
  call sites, the palette and the leader keys never changed. Active state
  matches the **section**, so `/body/pullups` lights Body. `writeDeepLink`
  deleted — the URL is the state.
  - Placement: Focus → Insights (a logging tool, filed by decision not by fit),
    Cycle + Recovery → Body, Account → `/settings/account`.
  - **`/plan/week/:isoWeek` dropped** — no week view exists.
  - `BottomNav` lost its own hand-picked five; it mirrors the rail now.

- [x] **K3 · Stage 3 — Today split by time of day.** Morning (check-in) / Day
  (the log, alone) / Evening (close-out + one prompt), as a filter over one day
  record. `TodayHabits` gained `variant="pills" | "checklist"` rather than a
  twin. Clock picks the surface; `?view=` overrides and survives refresh but is
  **not** persisted across days. A complete check-in collapses to a read-only
  summary with Edit.
  - **Bug fixed on the way:** `TodayHabits` called `todayISO()` internally —
    harmless while it only rendered on today, live the moment days became
    routable.
  - Two deviations from the spec's card lists, both to keep features alive:
    `PenaltyCard` on Morning (it is prescriptive, which is the plan's job), and
    `CountHabits` beside the habit row on Day.

- [x] **K4 · Stage 4 — the details.** `SegmentScale` (11 dots, `—` when
  unanswered) replaces every wellbeing `<input type="range">`; sleep is a
  half-hour `Stepper`, because hours are not a rating. **Every ⓘ is gone,
  app-wide** — nine on Today was nine labels admitting they failed — replaced
  by one `?` in the top bar that reveals the same explainers inline. Week-strip
  bar height encodes coverage (was seven identical bars). Empty state leads
  with the live streak or yesterday's open tasks. **"Training penalty" →
  "Make-up work"**, renamed in Help and Settings too.
  - Item 5 (three writing prompts → one rotating, with an expander) landed in
    K3, because "Evening: one writing prompt" required it.

- [x] **K5 · Stage 5 — mobile. DONE.** Capture pins above the tab bar on
  phones, portalled to `<body>` because `main` computes `overflow-y: auto` (so
  `sticky` positions against the wrong scrollport — it scrolled off at
  `top: -512`) and `.book-inner` carries a transform (so a plain `fixed` would
  take *it* as its containing block). `BottomNav` publishes its measured height
  as `--bottom-nav` so the bar above clears it without a hard-coded 48px.
  - **The 44px floor must be absolute px, not `min-h-11`.** The rem version
    measured **39px**, because this app scales the rem root for its S/M/L/XL
    text-size setting — a thumb does not shrink when you pick a smaller font.
  - The spec predicted the habit pills and segment dots would fail; both already
    passed. What actually failed: per-habit note buttons at **16px**, card
    chevrons at 18px, `EntryRow`'s glyph/`!`/`×` at 23–24px, mic and Add at
    36px, plan chips at 37px, sidebar drawer rows at 39px. Fixed at the source —
    every `Button` size has a mobile floor now.
  - **The 1180px tier never overflowed.** It is a `max-width`; Insights, Stats,
    Trackers and Monthly all measure clean at 490px. The thing that overflowed
    was the Stage 2 section tab strip (Body's six tabs, 545px in a 424px
    column). It scrolls horizontally now.
  - Measured after at 390px: Day, Morning, Evening, Body and Insights all report
    **0** sub-44px targets, no horizontal overflow anywhere.
  - **Two exceptions left standing:** Trackers' habit dot-grid (29 cells at
    ~23px — a 365-day grid cannot have 44px cells without ceasing to be one) and
    one 32px "recurring rules" toggle on Plan.
  - Fixed on the way: Trackers' layout picker offered **"PersonSimpleRun"** as a
    user-visible label — the lucide→Phosphor codemod hitting prose again, the
    hazard §J5 warns about. Now "Activity".

- [ ] **K6 · `metric.fastBreak` is a dead wire.** Written by the wellbeing card,
  read by nobody. `FastingCard` says "end it at your first meal" but never looks
  at the field. K3 put both on the Morning surface, which makes the gap more
  visible, not less. Either wire it (recording a first meal ends the running
  fast) or drop the control.

- [ ] **K7 · The month cursor is asymmetric.** It is a route on Monthly
  (`/plan/month/:yearMonth`) but Trackers and Cycle carry a month with no route
  of their own, so they keep component state — stepping months is in history on
  one and not the others. Commented in `cursor.tsx` rather than papered over.

## L. Habit polarity — the `avoid` flag was being ignored in six places

Found from a single user report ("why does it say *Missed Alcohol* when I
stayed sober?"). `habitLog` membership means opposite things by polarity: for a
build habit a logged day is a win, for an `avoid` habit it is a slip.

- [x] **L1 · The seed was the root cause.** `seedJournal()` shipped Caffeine,
  Sugar and Alcohol as `stimulant` with **no `avoid` flag**, so the app began
  life treating "drink alcohol" as a goal — and every fix below keys off that
  flag, so none of them reached a habit the seed had mislabelled. Sugar and
  Alcohol are `avoid: true` now; Caffeine is left as a build habit because
  `demo.ts` gives it the cue "With breakfast". `streak.ts:16` had listed both as
  quit-tracker presets all along, so two files disagreed about the same names.
- [x] **L2 · Migration for existing journals.** `relabelSeededQuitHabits()` in
  `migrate()`, matched on the seed's own fingerprint (starter name + starter
  category + `avoid` still undefined), so a renamed or recategorised habit is
  untouched. Idempotent. **Does not rewrite `habitLog`** — the ticks already
  record what happened; only the reading of them changes. Streaks and ratios
  for those two move on first load, which is the correction, not a side effect.
- [x] **L3 · Six read sites fixed**, each with failing-first tests:
  `penalties.ts` (a clean day read as "Missed Alcohol"; a real slip earned
  nothing — the tick **is** the miss now, scored off `cleanStreak`),
  `stats.ts dayCompletion` (drinking scored `ratio: 1`, a perfect day — the
  widest-reach instance, since the week strip, the habit chips and
  `weekdayConsistency` all read it), `coverage.ts` ("Most missed: Alcohol" after
  five sober days), `stats.ts reminderMessage` (*"Log Alcohol today to keep your
  4-day streak alive"*), `recommend.ts` (*"Alcohol is on a 20-day streak — turn
  it into a challenge"*), and the two streak-leaderboard reads in
  `TrackerVisuals` / `Trackers.tsx:732`.
  - `reminderMessage` and `recommend` **exclude** avoid habits rather than
    inverting them with `cleanStreak`, which was the original plan: a clean
    streak is at risk every hour of every day, so inverting would fire daily and
    crowd out every genuine build-habit streak. `MilestoneToast` already
    celebrates clean runs.
- [ ] **L4 · Open question: should a slip earn a bigger make-up?** Right now a
  slip is one item at the same weight as a missed habit. Arguably a relapse is
  the most consequential thing on that card.
