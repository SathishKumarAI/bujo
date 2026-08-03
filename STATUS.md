# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-03

## Where I stopped

**`feat/activity-registry`** — 6 commits, branched off
`feat/collapsible-header-ux`, **not pushed, no PR open**. The stack is now eight
deep: `#88 → #89 → #90 → #91 → #92 → #94 → collapsible-header-ux → this`.

Verifies green: `npx tsc -b` 0, `npx eslint .` 0 errors / 2 pre-existing
warnings, **1474 tests / 95 files**, `npm run build` clean, `npm run a11y` 0
serious across 10 views.

**Browser pass done** on Fitness, Nutrition and Coaching at 1440 and 760, light
theme, fresh journal. Three defects found and fixed (see `9d88835`) — the worst
was labels sitting *beside* their controls at any width where the act column
was wider than the 380px control cap. Not seen: dark theme, the other four
themes, Recovery, and a journal with real data in it.

**A dev server on 5191 was serving `.claude/worktrees/today-ux`, not this
branch** — the documented trap, live. It was killed and 5191 restarted from
this worktree. Restart the today-ux one if you still want it.

### What this branch did — the Body cluster on a page contract

| Commit | What |
|---|---|
| `7d40f8b` | Activity registry (`src/domain/activities.ts`), schema-3 migration, distance-unit fix |
| `0876b53` | Retired the book spine (`.book::before`) |
| `1a60ee6` | Page-contract primitives in `src/components/page/` |
| `41f7469` | Fitness rebuilt on three zones; tab row collapsed to four; Nutrition promoted to a route |
| `4cd00c7` | Nutrition, Recovery, Coaching onto the contract |
| `df728f4` | Sweep — folds, help icons, card chrome, a11y gate widened |

Load-bearing decisions:

- **Mode is never stored.** Derived via `modeOf(session.activity)`. The registry
  owns which fields render, which stat headlines, and all mode copy
  (`MODE_COPY`). There is nowhere left to write a mode conditional for field
  visibility, so that bug class is structurally gone rather than patched.
- **Three modes.** `sport` was added late — a game is bounded by a scoreboard,
  not a distance, so Pickleball asks for duration alone.
- **Distance is canonical km**, converted only at `lib/units.ts`. v2 wrote the
  *display* unit into `distanceKm`, so half the readers divided by 1.60934 and
  half printed it raw — the same 3.1 showed as "3.1 mi" and "1.9 mi" on one
  screen.
- **Container queries, not media queries** (`styles/layout.css`), one breakpoint
  at 1100px of *container* width, because the sidebar collapses.
- **Sticky is measured, not declared.** `PageLayout` falls back to static when
  the act column is taller than the viewport.

### Next

1. **Look at Recovery, the dark theme, and a journal with real data.** The
   browser pass covered Fitness, Nutrition and Coaching on a fresh light-theme
   journal only.
2. **Recovery still exceeds the two-raised-card cap.** Its remaining cards are
   genuine objects with their own actions (urge log, reset log, per-addiction
   streaks, commitment, trigger plans), so the cap and the "cards are objects"
   rule pull against each other there. Needs a judgement call.
3. **Recovery is not in the a11y scan list** — it is behind an opt-in setting, so
   its sidebar entry is not clickable on a default journal. Needs a fixture.
4. **Recovery deviates from the brief on purpose** — the brief wanted a sleep +
   soreness sparkline, assuming physical recovery; this app's Recovery is the
   abstinence tracker and has no soreness field anywhere. Built urges-vs-resets
   instead. Physical recovery as its own page is a data-model change.
5. **`Workout.sets` is still a required `string[]`**, not the optional field the
   brief's target shape had. Cardio writes `[]`. Changing it breaks
   `HomeWorkout` and the CSV export.
6. **Re-seed demo data** to see corrected distances and activity labels.
7. Push and open the PR against `feat/collapsible-header-ux`. Then merge the
   eight-deep stack bottom-up — still the biggest risk on the board.

### Traps this branch hit

- **The schema-3 distance conversion is not idempotent.** It is gated on the
  stored version; running it twice multiplies by 1.61 again. There is a test
  that migrates three times and asserts the value never moves. Any future
  data-shape migration in `migrate()` needs the same treatment or the same gate.
- **`npm run a11y` serves `dist` through `vite preview`** — rebuild before
  believing a result. A contrast fix looked like it had failed until the bundle
  was rebuilt.
- **Folds hide violations from axe, again.** Adding Coaching to the scan list
  immediately surfaced a `crust`-on-`surface1` contrast failure that had been
  invisible only because the list lived inside a collapsed card.
- **A typed field is a better audit than a grep.** Making `Workout.activity` an
  `ActivityKey` found every free-form writer in one `tsc -b`, including one in
  `CaptureBar` that the Stage 0 audit had missed.
- `quartileLevels` shipped with `floor(q·n)` instead of `ceil(q·n)−1`, putting
  the top cut on the maximum so level 4 was unreachable. Caught by its own test.

---

## Previously — `feat/collapsible-header-ux`

9 commits, branched off `feat/icon-button-stage1` (PR #94), **not pushed, no PR
open**. If you push it, base the PR on `feat/icon-button-stage1`, not `main`, or
the diff shows six other branches' commits.

### What that branch did — the fold (§K)

`docs/COLLAPSE-PATTERN.md` is the full record; decisions are D-42/43/44. Short
version:

- **The whole header folds a card**, not just an 18px caret. The caret stays a
  real `<button>` with `aria-expanded` — still the accessible control; the header
  click is a pointer convenience on top. 42 cards and 30 sections inherit it.
- **One caret rotates**; two glyphs no longer swap. Bodies fade in on open.
  Close is deliberately instant — the body unmounts while closed and the
  collapsed-by-default cards carry real weight.
- **Four section primitives became two.** `pickleball/Section` and Settings'
  `Disclosure` deleted; they plus five open-coded inline sections moved onto
  `CollapsibleSection` / `QuietSection`.
- **Two cards had dead titles** — `PenaltyCard` and Gym's "Today's session" both
  hand-rolled a caret into `right` rather than using `Card collapsible`.
- **Plan stopped reserving an empty column.** "Chronically deferred" is
  conditional, so the unconditional two-column masonry left ~800px empty for
  most journals. Setup lost its fold and became an always-open footer with
  eight one-tap rule suggestions.
- **Demo data now has a migration history**, so "Chronically deferred" is
  actually visible in the demo.

### Its next steps (still open)

1. **Push it and open the PR** against `feat/icon-button-stage1`.
2. **Merge the stack bottom-up.** Seven deep now — the biggest risk on the board.
3. **`graphify hook-rebuild` is refusing to write** — the new graph has 1782
   nodes against a stored 1784 (deleting `pickleball/Section.tsx` shrank it), so
   it wants `force=true`. Left alone because it overwrites tracked state.
4. **Per-view container tiers** — the one Stage 5 item left.
5. **B4** — the app chunk is still 658 kB (193 gzip); recharts at 429 kB is the
   next lever.
6. **§H redesign decisions** — H5, H6, H7, H9, H11, H13 still open.
7. **B1/G1/G2** — the Supabase project returns NXDOMAIN, so every account and
   cloud-sync feature is dead until it is repointed or the env vars unset.

### Traps that branch hit, so you don't

- **`npm run a11y` cannot see inside a closed fold.** Unhiding Plan's Setup
  exposed a *critical* `select-name` violation that had been shipping for
  months — axe scans the rendered page, and collapsed content is not on it.
  Read every clean report as "clean for whatever was expanded".
- **`vite preview` serves a stale bundle through its service worker.** Twice a
  screenshot showed pre-change markup against a freshly built `dist/`.
  Unregister the worker and clear caches before believing what you see.
- **A dev server pinned to a worktree keeps serving that worktree's branch.**
  Six stale `vite` processes were running on 5173–5176, 5180 and 5191; the one
  on 5191 served `.claude/worktrees/today-ux` at `feat/today-ux`, so changes
  made here could never appear in the tab pointed at it. All six killed. Check
  which port and which worktree before concluding a change did not land.
- **An audit keyed on how something is drawn misses anything drawn another way.**
  Six folds using typographic `▸ ▾ ▴` matched neither the caret-icon grep nor
  the `aria-expanded` grep, and survived a sweep that claimed to be complete.
- **Demo data is persisted, not regenerated.** Changing `src/lib/demo.ts` does
  nothing for an existing journal — re-seed via Settings → Data → Load demo data.
- **`.caret-turn` is unlayered CSS and beats `@layer utilities`.** A Tailwind
  `transition-*` on the same element silently never runs, and `npm run design`
  does not catch it.

Older traps that still hold — theme flips not invalidating inherited custom
properties, regex renames rewriting prose, `.claude/worktrees/` carrying other
sessions' checkouts, verifying UI in all five themes — are in the git history of
this file (`913f8df`).

**Read next:** `TASKS.md` (the board, §K is this branch) ·
`docs/COLLAPSE-PATTERN.md` (the fold) · `docs/ICON-BUTTON-SYSTEM.md` (the pass
this grew out of) · `docs/ACCESSIBILITY.md` (the rules and the gate's blind spot).
