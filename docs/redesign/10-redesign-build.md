# Redesign build record — steps 1–4

**Date:** 2026-08-02 · branch `feat/ui-polish`
**Decisions:** `docs/redesign/09-redesign-audit.md` (audit) + the decisions doc + `TASKS.md` §H
**Status:** steps 1–4 shipped and verified. Steps 5–10 (per-cluster visual migration, motion pass, accent-inflation pass) not started.

---

## Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npx vitest run` | ✅ 41 files, 678 tests |
| `npm run build` | ✅ 537ms |
| `npx eslint .` | ✅ **0 errors** (was 17), 2 pre-existing warnings |
| 24 views × 5 themes in a real browser | ✅ 0 blank, 0 overflow, 0 console errors |
| Font sizes outside the scale | ✅ **0** |
| `font-weight` above 500 | ✅ **0** |
| External font requests | ✅ **0** |

---

## Step 1 — tokens, fonts, type scale

**Token layer.** `src/styles/tokens.css` — a naming layer, no literals. Every token aliases an
existing variable, so all five themes and the theme-following chart palette keep working:
`ink-0..3` (surfaces), `fg-1..3` (foreground), `line`/`line-strong`, `brand`, seven type steps,
two container tiers.

Two collisions avoided: `--color-accent` and `--color-text` were already taken by the
shadcn/Catppuccin layer and mean *different* things there (`accent` is a raised surface, not the
brand colour). The roles use `brand` and `fg-*` instead.

**Mocha retune.** Surfaces `#1e1e2e/#181825/#11111b` → `#1a1a1f/#141419/#0e0e12`. Saturation
21% → 9% at essentially unchanged lightness, so contrast *improves* (subtext0 7.37 → 7.79,
overlay2 5.81 → 6.14). Catppuccin's palette is untouched; three surface values moved.

**`--fg-3`, computed per theme.** No single grey clears AA on both near-black and near-white:

| Theme | Value | Worst-case contrast |
|---|---|--:|
| mocha | `overlay2` `#9399b2` | 6.14:1 |
| neon | `overlay2` `#8585b8` | 5.57:1 |
| vscode | `overlay2` `#9d9d9d` | 6.08:1 |
| latte | `#6b7075` | 4.74:1 |
| dawn | collapsed to `fg-2` | — |

Dawn is the exception: its cream surfaces leave a band barely one step wide between `subtext0`
(5.31:1) and the 4.5:1 floor — the best warm candidate landed at 4.52:1, two hundredths of
headroom, so any later surface tweak would break it silently. Dawn renders two text tiers.

**Fonts self-hosted.** `@fontsource-variable` (Fraunces, Instrument Sans, JetBrains Mono,
Caveat) — 14 woff2 files, 444 KB, zero external requests. That let `style-src` and `font-src`
drop their Google allowances in `vercel.json`, tightening the enforced CSP.

**Type scale**, seven steps in rem at a 16px root: `display` 32 · `title` 22 · `heading` 17 ·
`body` 15 · `label` 13 · `caption` 11 · `micro` 10. Tailwind's default scale is cleared with
`--text-*: initial`, so `text-xs` … `text-6xl` no longer resolve.

`body` is anchored to `--text-body`; without that, 140 elements were inheriting the browser's
16px default — a size not in the scale at all.

`.num` sets family and tabular figures only, never a size, so it composes with `.fig-fixed`
instead of fighting it.

---

## Step 2 — shell and containers

Two container tiers, not one:

- **`read` 820px** — Today, Plan, logging views, Reading, Help, Recovery, FitnessHub. A short
  measure reads better.
- **`wide` 1180px** — Insights, Stats, Monthly, Trackers, Collections, Settings. Heatmaps,
  calendars and multi-series charts get *worse* when squeezed.

`Page` gained a `width` prop defaulting to `read`. The `aside` variant is always wide — the rail
alone is 22rem, so an 820px cap would leave main ~470px and defeat the split.

---

## Step 3 — type migration

**1,032 replacements across 113 files**, mapped by role rather than nearest pixel:

| From | To | Count |
|---|---|--:|
| `text-xs` (12) | `text-label` (13) | 398 |
| `text-sm` (14) | `text-body` (15) | 337 |
| `text-[10px]`, `text-[9px]`, `text-[8px]` | `text-micro` (10) | 97 |
| `text-[11px]` | `text-caption` (11) | 45 |
| `text-lg`, `text-base` | `text-heading` (17) | 43 |
| `text-xl`, `text-2xl` | `text-title` (22) | 19 |
| `text-3xl`…`text-6xl` | `text-display` (32) | 17 |
| `font-semibold/bold/extrabold` | `font-medium` | 67 |
| `max-w-[1400px]` | `max-w-wide` | 10 |

The two dominant tiers **grow** 1px. The app's de-facto body size was 14px with 12px beneath —
a full step below the agreed scale — and the owner had reported eye strain, which the previous
session already treated once via contrast. Shrinking would have fought that.

`micro` (10px) is a seventh step the brief didn't have. 141 call sites were already rendering at
9–11px inside dense data surfaces (heatmap cells, axis labels, tracker grids); rounding them up
to `caption` would have made 141 pieces of text *larger* in exactly the layouts tuned to be
tight. One extra token beat exempting 141 sites from the system forever.

**Ordering note, and it matters:** Tailwind v4 does **not** fail the build on a stale utility —
it exits 0 and emits nothing, so the element silently inherits its parent's size. Removing the
old scale first would have broken 955 call sites with no build, test or typecheck catching it.
Migration ran first; the `--text-*: initial` reset landed only once the grep gate was clean.

---

## Step 4 — primitive reconciliation

- **`Ring` and `CountUp`** moved from `components/Counter.tsx` to `components/ui/ring.tsx` — the
  audit's one misfiled primitive. `useCountUp` moved to `lib/countUp.ts`.
- **Muscle data** (`MUSCLES`, `musclesForSplit`, `muscleNames`) moved from
  `components/MuscleMap.tsx` to `lib/muscles.ts`; five importers repointed.
- **`/kitchen-sink` route** (`?view=kitchen-sink`, not in the sidebar) — every primitive,
  variant and state on one page: type scale, numerals, foreground tiers, surfaces, all six
  button variants × three sizes × disabled, inputs, Stepper, Segmented, StatTile, Ring, Pill,
  empty state, container tiers.

---

## Bugs found and fixed along the way

1. **JetBrains Mono was never loaded.** `--font-mono` named it; nothing fetched it. Every "mono"
   numeral in the app was silently falling back to Consolas. The brief's "every number in mono
   tabular" would have shipped in a fallback font.
2. **`text-base` was a colour, not a size.** Catppuccin's `--color-base` and Tailwind's
   `--text-base` both generate `.text-base`, and the colour won. Eleven section titles wrote
   `font-display text-base font-medium text-subtext1` and got a colour that `text-subtext1`
   immediately overrode — **no font-size at all**, silently inheriting.
3. **Handwriting mode would have broken.** `@fontsource-variable` registers the family as
   `'Caveat Variable'`; the CSS asked for `'Caveat'` and would have fallen through to cursive.
   Routed through `--font-hand`.
4. **`json.next` could be `undefined`** in the wger pagination loop — hidden by `any`, surfaced
   the moment the response was typed.

## Lint: 17 errors → 0

| Fix | Count |
|---|--:|
| Real fixes — derived state instead of `setState` in an effect body (`ExerciseDB`, `ReminderBanner`, `countUp`), render-phase reset in `CommandPalette`, ref-write moved to an effect in `speech.ts`, wger response typed | 11 |
| Structural — non-component exports moved to `lib/` (`muscles.ts`, `countUp.ts`) | 4 |
| Documented exceptions — context hooks beside their providers (`cursor`, `nav`), vendored shadcn export shape (`button`, `tabs`) | 4 |

Two pre-existing `exhaustive-deps` warnings remain in `App.tsx` boot-path effects, untouched.

---

## Definition of done

| Check | Status |
|---|---|
| Stale `text-xs`…`text-6xl` | ✅ 0 |
| Bracketed font sizes | ✅ 0 |
| `font-weight` above 500 | ✅ 0 |
| Every rendered element on the seven-step scale | ✅ 0 off-scale, verified in-browser |
| `max-w-[1400px]` holdovers | ✅ 0 |
| Pages exceeding their tier | ✅ 0 |
| `--fg-3` ≥ 4.5:1 on card, all themes | ✅ (dawn by collapsing to `fg-2`) |
| External font requests | ✅ 0 |
| Keyboard nav + focus ring | ✅ pre-existing, regression-checked |
| Hex outside token/domain files | ◑ 32 files — mostly domain colour maps, deliberately kept |
| Numbers rendered via `.num` | ◑ primitives done (`Ring`); the app-wide sweep is step 5+ |
| Exactly one accent-filled button per screen | ⬜ not started — needs the manual pass |

---

---

# Steps 5–9 — accent, motion, and the signature (2026-08-02, appended)

Branch `feat/accent-and-motion`.

## A correction to the verification above

**The "24 views × 5 themes" claim in the step 1–4 record was wrong.** Those
sweeps drove navigation with `history.replaceState` + a synthetic `popstate`,
and this app's router does not listen to `popstate` — `?view=` is only read on
load. Every one of those iterations re-measured **Today**. The earlier sweep
that clicked sidebar buttons was valid; the deep-link ones were not.

Re-run properly by clicking nav buttons, and confirmed by asserting on 18
distinct `h1`s per pass. The fixed numbers are in the table below. Two things
the corrected sweep found that the broken one had hidden are recorded under
"Found by looking" below.

## Accent-inflation pass

The rule: **`Quick add` in the top bar is the app's one accent-filled primary,
and it is on every screen — so a view's body gets zero.** Otherwise every screen
has at least two things claiming to be the primary action, which is exactly the
"when four things are primary, nothing is" problem the brief diagnosed.

Exception: modals, dialogs and the pre-app screens (Welcome, Account
signed-out, LockScreen, ErrorBoundary, Onboarding) keep the accent fill. They
*are* their own screen — Quick add is unreachable behind them.

| | Before | After |
|---|--:|--:|
| Views with accent fills in `main` | 6 | **0** |
| Accent-filled elements in `main` | 19 | **0** |

- **48 action buttons demoted** to `secondary` across 21 files.
- **Selection state got a new token** rather than the fill. `--color-brand-wash`
  (16% tint) now marks the selected `Segmented` option, Fitness tab, Pomodoro
  preset, date-picker month and the First-meal pills. A selected segment filled
  with the same colour as a primary button competes with it; a wash reads as
  *a choice already made*, which is what it is.
- **Left alone deliberately:** the sidebar/bottom-nav active rails (a 2px
  indicator, not a fill), Reading's progress bar and the Challenges calendar
  cells — those encode data, and recolouring them would break the encoding.

## Motion pass

Six remaining hardcoded values folded into the existing `--dur-*`/`--ease-*`
tokens (card hover, `.rise`, `page-in`, both modal animations, staged
entrance). The stagger delays (45/90/135/180/225/270ms) stay literal — they are
a sequence, not a duration.

## The signature: the bullet glyph column

Per the brief §5, and the reason this is a bullet journal rather than a tracker.
It was a 20px gutter, 15px, with an instant swap on status change.

- **24px fixed gutter** so every glyph sits on one axis regardless of how the
  text wraps. A ragged bullet column reads as a list of rows; a straight one
  reads as a page of marks.
- **`glyph-set` animation** — the new glyph crossfades and settles (scale 0.62 →
  1.08 → 1) instead of being overwritten, so cycling a status feels like making
  a mark. Keyed on `type-status` so it re-runs each change. Reduced-motion
  aware. This is the log's one piece of deliberate motion.
- **Closed lines recede** — done *and* dropped both strike through and drop to
  `fg-3`, so the eye skips them and lands on what is still open.

## Found by looking, not by measuring

The automated sweep reported these views clean. A screenshot did not.

1. **Plan was broken by my own container-tier call.** It is a CSS multi-column
   masonry; at the 820px `read` tier the two columns collapse to ~380px each,
   wrapping every migration card's title and stacking its actions vertically.
   Moved to `wide`. Measurement said "0 overflow" because nothing overflowed —
   it was just bad.
2. **The `!` priority marker rendered on every row** at 45% opacity, so a
   five-line log showed five amber marks competing with the glyph column for
   the same job. Now it renders only when the entry *is* important; the
   affordance appears on row hover, like delete already did.
3. **Tags rendered twice.** Typing `#travel walk the rim` puts the tag in the
   text *and* in `entry.tags`, so the row read `#travel walk the rim #travel`.
   Chips are now only appended for tags not already written in the line.
4. **Nine elements were still above the weight ceiling** — `<b>`, `<strong>`
   and `<th>` inherit 700 from the user-agent stylesheet, which a grep for
   Tailwind classes never sees. Set to 500 at the base.

## Verification (corrected method)

18 views × 5 themes, driven by nav clicks, asserting 18 distinct `h1`s per pass:

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npx vitest run` | ✅ 678 tests |
| `npx eslint .` | ✅ 0 errors |
| `npm run build` | ✅ 550ms |
| Blank views | ✅ 0 |
| Horizontal overflow | ✅ 0 |
| Accent fills in `main` | ✅ 0 |
| Font sizes off the scale | ✅ 0 |
| `font-weight` above 500 | ✅ 0 |
| Console errors | ✅ 0 |

> Note on the earlier "blank views" reading: nine views looked blank at a 300ms
> settle. With a 900ms wait it is zero — that was lazy-chunk timing, not a
> render failure. Worth knowing before trusting a fast sweep.

---

## Not done

These remain visual-judgement work:

- **Per-cluster migration** (Plan → habits → logging → sports → library → settings/insights).
  The token and type layers are in place underneath all of them, so this is now restyling
  against a settled system rather than inventing one.
- **Motion pass** — `--ease-*`/`--dur-*` tokens exist and reduced-motion is already enforced;
  applying them uniformly is outstanding.
- **Accent-inflation pass** — the brief's sharpest observation and the one no tool can measure.
  25 views, mocha only, one question each: which single element here is the primary action?
- **Day/week strip extraction** — `Heatmap`, `ActivityLayout`, `TodayHabits` remain three
  implementations of one idea. Worth an API proposal before merging by guess.
- **190 raw `<button>`** still bypass the button system, clustered in 8 files (Trackers 16,
  Gym 9, Insights 8, Collections 7, Account 7). Many are legitimately not buttons — heatmap
  cells, glyph toggles, card-shaped targets — so this needs judgement per site, not a codemod.
