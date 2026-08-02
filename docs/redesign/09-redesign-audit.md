# Redesign audit — step 0

**Date:** 2026-08-02 · branch `feat/ui-polish` @ `dbcdbf3`
**Brief:** `docs/new/files/bujo-redesign-prompt.md` §10 — "Audit first. Before writing any styles."
**Status:** no code written. This is the surface area, measured.

---

## The headline

**The brief's core premise is wrong, and that's good news.** It says the app "looks like an
unstyled prototype" with "inconsistent primitives … cards, inputs, buttons, pills and steppers
each have a different corner radius, border treatment, and height," and it plans to extract
seven shared components it expects don't exist.

Measured: **six of those seven already exist and are adopted across 23 of 25 views.** There is
already a single card token (`CARD.container`), a single button system (shadcn `ui/button`, 209
call sites), a shared `StatTile`, `ChartCard`, `EntryRow`, `Stepper` and `Ring`. The primitive
layer isn't missing — it was built over the last three sessions and finished in PR #79.

The real problems are narrower and different from the diagnosis:

| Brief's diagnosis | Measured reality |
|---|---|
| "Inconsistent primitives" | Primitives exist and are adopted. **188 raw `<button>` bypass them**, clustered in 8 files. |
| "No max width" | `Page` already constrains to `max-w-[1400px]`. The brief wants **820px** — a deliberate 40% narrowing, not a bug fix. |
| "Cards have identical padding/border/background" | True, and *by design* — one `CARD.container` constant. Changing hierarchy means editing **one line**. |
| "No hardcoded hex anywhere" (DoD) | 392 hex literals, but **255 (65%) are the token layer itself** (`index.css`, `lib/colors.ts`). Real leakage: 137 across 38 files. |
| "Typography has no system" | Confirmed. **10 distinct sizes** where the brief wants 6, and Tailwind's scale doesn't align with the target values. |
| "Accent inflation" | Confirmed, unmeasurable by grep — needs a visual pass per view. |

**Revised scope: the token/type/weight work is real and roughly as costed. The "extract
primitives" work is ~85% already done. The page count is 2× what the brief assumed.**

---

## 1. Surface area

| | Count |
|---|---|
| Views | **25** (brief lists 12) |
| Components | **106** across 9 directories |
| Total files (`.ts`/`.tsx`/`.css`, excl. tests) | 200 |
| Total lines | **30,889** |
| View lines | 9,287 |

Views the brief doesn't mention: **Settings** (815 LOC, 5 tabs), **Insights**, **Stats**,
**Monthly**, **Goals**, **Collections**, **Reading**, **Account**, **Welcome**, **Help**,
**Cycle**, **FitnessHub**. Settings alone is the second-largest view in the app.

Component clusters: root `components/` 50 · `recovery/` 13 · `ui/` 12 (shadcn) · `shell/` 10 ·
`gym/` 9 · `trackers/` 5 · `pickleball/` 4 · `fields/` 2 · `feedback/` 1.

---

## 2. Every view, measured

`hex` = hardcoded colors · `btn` = raw `<button>` · `Btn` = `<Button>` · `w>500` = font-weight
above 500 · `arb` = arbitrary Tailwind values `x-[...]`

| View | LOC | hex | btn | Btn | w>500 | arb | Shared primitives used |
|---|--:|--:|--:|--:|--:|--:|---|
| Trackers | 989 | 9 | **16** | 19 | 1 | 26 | Card, StatTile, Page, CollapsibleSection, Empty, Button, Input, Stepper |
| Settings | 815 | **18** | 6 | 39 | 0 | 5 | Card, StatTile, Page, Disclosure, Button, Input |
| Gym | 709 | 0 | 9 | 10 | 2 | 8 | Card, StatTile, Page, CollapsibleSection, Empty, Button, Input |
| NoFap | 643 | 14 | 4 | 12 | **7** | 10 | Card, StatTile, CollapsibleSection, Empty, Button, Input |
| Pickleball | 624 | 1 | 1 | 10 | 0 | 6 | Card, StatTile, Page, Empty, Button, Input |
| Insights | 520 | 0 | 8 | **0** | **10** | 7 | Card, Empty, Ring, Input |
| Focus | 513 | 3 | 1 | 7 | 0 | 6 | Card, StatTile, Page, CollapsibleSection, Empty, Button, Input |
| Reading | 431 | 1 | 3 | 7 | 0 | 14 | StatTile, CollapsibleSection, Button |
| Fitness | 405 | 0 | 1 | 7 | 2 | 9 | Card, StatTile, Page, CollapsibleSection, Empty, Button, Input, Stepper |
| Collections | 375 | 2 | 7 | 4 | 0 | 4 | Card, Empty, Button, Input |
| Monthly | 339 | 0 | 2 | 1 | 3 | 5 | Card, Page, Button, Input |
| Today | 338 | 0 | 3 | 3 | 0 | 3 | Card, Page, Empty, Button, Input |
| Stats | 329 | 1 | 0 | 6 | 2 | 12 | Card, Empty, Button |
| Plan | 284 | 1 | 5 | 9 | 0 | 2 | Card, Empty, Button, Input |
| Challenges | 282 | 0 | 2 | 4 | 2 | 5 | Card, Page, Empty, Button, Input |
| Goals | 281 | 2 | 1 | 2 | 0 | 1 | Card, Page, Empty, Button, Input, Stepper |
| Account | 266 | 4 | 7 | 8 | 1 | 1 | **Button only** |
| Coaching | 256 | 0 | 6 | 2 | 0 | 7 | Card, StatTile, Page, Button |
| Welcome | 198 | 0 | 5 | 5 | 1 | 0 | **Button only** |
| Pullups | 142 | 0 | 1 | 0 | 0 | 1 | Card, Page, CollapsibleSection, Input |
| HomeWorkout | 138 | 0 | 2 | 4 | 0 | 2 | Card, Page, Empty, Button, Input |
| FitnessHub | 122 | 0 | 2 | 0 | 3 | 4 | **none** |
| Help | 119 | 0 | 0 | 0 | 0 | 1 | Card, CollapsibleSection |
| Cycle | 95 | 0 | 1 | 0 | 0 | 0 | Card, Page, Input |
| Mindset | 74 | 0 | 1 | 1 | 0 | 1 | Card, Page, Empty, Button |
| **Totals** | **9,287** | **56** | **94** | **160** | **34** | **140** | |

**Reading the table:**

- **Primitive adoption is high.** 22 of 25 views use `Card` + `Page`. Only **FitnessHub**
  (a tab shell), **Welcome** and **Account** (both pre-auth, deliberately bespoke) sit outside
  the system. The brief's fear of "one-off markup everywhere" doesn't hold.
- **Raw buttons cluster.** 94 of the app's 188 are in views, and half of those are in 5 files:
  Trackers 16, Gym 9, Insights 8, Account 7, Collections 7. This is a targeted fix, not a sweep.
- **Insights is the outlier**: 0 `<Button>`, 8 raw, 10 heavy weights. It never joined the button
  migration. Highest-value single file in the whole redesign.
- **Trackers is the biggest job**: largest view, most raw buttons, most arbitrary values, and it
  carries 4 alternate layouts (classic grid / activity / wheel / cards).

---

## 3. Token layers that already exist

The brief asks for `src/styles/tokens.css`. Three token layers already exist. **This is the
single most important finding for H1** — the decision isn't "create tokens", it's "remap three
existing token layers or replace them".

| Layer | Where | What it holds |
|---|---|---|
| CSS custom properties | `src/index.css` (719 lines) | 5 `:root` theme blocks — default/mocha, `[data-theme='latte']`, `neon`, `vscode`, `dawn` — plus per-theme overrides for `.card-3d`, `.press-3d`, `.book`, `.aurora`. **133 hex literals live here, correctly.** |
| Chart palette | `src/lib/colors.ts` | `CAT` (Catppuccin base) + `THEME_PALETTES` for all 5 themes; `setActiveTheme()` is called during render so charts follow the theme (AUD-6). **122 hex, correctly.** |
| Card chrome | `src/components/ui.tsx` → `CARD` | One constant: `rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-5 lg:p-6`. Every card in the app routes through it. |

So the brief's definition-of-done check —
`grep -rE "#[0-9a-fA-F]{3,6}" src/` returns nothing outside `tokens.css` — **would fail today at
392 matches, but 255 of those are the tokens themselves.** The check needs rewriting to exclude
the token files, or it measures nothing useful. Actual leakage to fix: **137 hex in 38 files**.

Worst offenders outside the token layer:

| File | hex | Nature |
|---|--:|---|
| `views/Settings.tsx` | 18 | Theme-picker swatches — arguably legitimate, they *are* the colors |
| `lib/urge.ts` | 14 | Data-model color map (urge categories) |
| `views/NoFap.tsx` | 14 | Streak/relapse status colors |
| `lib/fitness.ts` | 13 | Chart series colors |
| `views/Trackers.tsx` | 9 | Habit colors |
| `lib/pickleball.ts` | 8 | Skill-tier colors |

**Note the pattern:** most non-token hex is in `lib/*.ts` **data** files, where a color is a
property of a domain object (a habit's color, an urge category's color), not a style decision.
Those shouldn't move to `tokens.css` — they should reference token *names*. Worth deciding
explicitly rather than letting a grep-driven sweep flatten them.

---

## 4. The three systems the brief wants to constrain

### Radius — 8 distinct, brief wants 3

`rounded` · `rounded-sm` · `rounded-md` · `rounded-lg` · `rounded-xl` · `rounded-2xl` ·
`rounded-full` · `rounded-none`

Maps to the brief's `--r-control: 8px` / `--r-card: 14px` / `--r-pill: 999px` as:
`sm|md|lg → control` · `xl|2xl → card` · `full → pill` · `rounded`/`none` → audit individually.

⚠️ **Conflict:** `CARD.container` uses a *responsive* radius (`rounded-xl sm:rounded-2xl`) — that
was BUJO-239, a deliberate density decision (tighter on phones). "Exactly three radii" kills it.
Decide whether responsive radius survives.

### Type scale — 10 distinct, brief wants 6

`text-xs` · `text-sm` · `text-base` · `text-lg` · `text-xl` · `text-2xl` · `text-3xl` ·
`text-4xl` · `text-5xl` · `text-6xl`

⚠️ **Tailwind's scale does not align with the brief's target of `32 / 22 / 17 / 15 / 13 / 11`:**

| Brief | Tailwind nearest | Actual px | Gap |
|--:|---|--:|---|
| 32 | `text-3xl` | 30 | −2 |
| 22 | `text-xl` | 20 | −2 |
| 17 | `text-lg` | 18 | +1 |
| 15 | `text-base` | 16 | +1 |
| 13 | `text-sm` | 14 | +1 |
| 11 | `text-xs` | 12 | +1 |

Every target value needs a custom Tailwind theme extension or an arbitrary value. And the app
has a **global font-scale feature** (FONT-1: S/M/L/XL scales the rem root, with `.fig-fixed`
counter-scaling to keep figures at natural size) — fixed px values in `tokens.css` would break
it. **This is a real conflict, not a preference.** Either the type scale goes through rem, or
the font-size setting dies.

### Font weight — 68 uses above 500, brief wants zero

Across 38 files. Concentrated: Insights 10, NoFap 7, TopBar 3, FitnessHub 3, Monthly 3.
Mechanical fix, no design decision needed.

### Arbitrary values — 394 uses of `x-[...]`

The escape hatches already in the codebase. Each is a place where the design system didn't have
the value someone needed — worth reading as a list of gaps in the *current* system before
designing the next one.

**Amended after step 1** — the recurring ones, with `data-[…]`/`aria-[…]` variant selectors
filtered out (those are shadcn state selectors, not design values):

| Arbitrary value | Uses | Reads as |
|---|--:|---|
| `text-[10px]` | **88** | a missing scale step |
| `text-[11px]` | **45** | a missing scale step |
| `rounded-[2px]` | 13 | a missing radius step |
| `max-w-[1400px]` | 10 | the container width — becomes `--container-wide` |
| `text-[9px]` | **8** | a missing scale step |
| `gap-[3px]` | 5 | a missing space step |
| `ring-[3px]` | 4 | focus-ring width |
| `min-w-[10rem]` | 4 | dropdown min width |

⚠️ **This corrects the type-scale count above.** The 814 figure only counted *named* classes
(`text-xs` … `text-6xl`). Adding the bracketed sizes gives **955 font-size call sites**, and
**141 of them are below 12px** — beneath the floor of the entire proposed scale, whose smallest
step is `caption` at 11px.

Concentration of the sub-12px sizes: Trackers 17 · Reading 6 · Insights 6 · Coaching 6 ·
MatchupCards 6 · Pickleball 5 · NoFap 5 · Fitness 5 · Stats 4 · Challenges 4 · TrackerVisuals 4 ·
ActivityLayout 4.

These are dense data surfaces — heatmap cells, chart axis labels, tracker grids. Mapping them up
to `caption` (11px) makes 141 pieces of text *larger*, which is the opposite of what those
layouts were tuned for. **This needs a decision before the type migration runs** (see TASKS.md
§H15).

---

## 5. The brief's seven extraction candidates

§10: *"Candidates I expect: a stat tile, a log-entry row, a day/week strip, a progress ring, a
section header with an action, a metric stepper, and a chart wrapper."*

| Candidate | Status | Where |
|---|---|---|
| Stat tile | ✅ exists, adopted app-wide | `ui.tsx` → `StatTile` (shipped as P-14 / R2-5) |
| Chart wrapper | ✅ exists, adopted app-wide | `ui.tsx` → `ChartCard` |
| Log-entry row | ✅ exists | `components/EntryRow.tsx` |
| Metric stepper | ✅ exists | `components/fields/Stepper.tsx` |
| Progress ring | ✅ exists, **misfiled** | `components/Counter.tsx` → `Ring`. Belongs in `ui`. |
| Section header + action | ✅ exists, as props not a component | `Card({ title, subtitle, right, help })` |
| **Day/week strip** | ❌ **the one real gap** | **3 unreconciled variants**: `Heatmap.tsx`, `ActivityLayout.tsx`, `TodayHabits.tsx` |

**One genuine extraction, not seven.** The day/week strip is worth doing regardless of the
redesign — three implementations of the same visual idea is exactly the drift the brief is
trying to prevent.

Also already shipped and *not* in the brief's inventory: `Pill`, `Empty`, `Segmented`,
`Disclosure`, `CollapsibleSection`, `Skeleton`, `Kbd`, `ErrorBoundary`, `Toasts`,
`ConfirmDialog`/`useConfirm`, `OfflineBanner`.

---

## 6. Migration cost, by cluster

Ordered as the brief's §10 asks, with measured size. "Bespoke %" = share of interactive elements
using raw markup instead of primitives.

| # | Cluster | Views | LOC | raw btn | Bespoke | Notes |
|--:|---|--:|--:|--:|---|---|
| 1 | **Today** (reference impl) | Today | 338 | 3 | low | Small file. The 10 sub-cards live in `components/` — real work is there, not in the view. |
| 2 | Plan | Plan | 284 | 5 | low | |
| 3 | Habits cluster | Trackers, Challenges, Focus | 1,784 | 19 | **high** | Trackers alone is 989 LOC with 4 alternate layouts. Biggest single chunk. |
| 4 | Logging cluster | Fitness, Gym, Pullups, HomeWorkout, FitnessHub | 1,516 | 15 | med | FitnessHub uses zero primitives. |
| 5 | Sports | Pickleball, Coaching | 880 | 7 | low | |
| 6 | Mindset, Recovery, Library | Mindset, NoFap, Collections, Reading, Monthly, Goals | 1,942 | 18 | med | NoFap: 14 hex + 7 heavy weights. Reading uses no `Card` and renders **no `<h1>`/`<h2>`** (see TASKS.md B5). |
| 7 | Shell, modals, settings | Settings, Account, Welcome, Help, Cycle, Insights, Stats + `shell/` | 2,543 | 27 | **high** | Settings 815 LOC / 5 tabs. Insights never joined the button migration. Account + Welcome are pre-auth bespoke. |

The brief's §10 order puts the shell **last**. Given the shell (`AppShell`, `TopBar`, `Sidebar`,
`BottomNav`, `Page`) sets the container width, the nav chrome and the top-bar reduction that
**every** page inherits, doing it last means every earlier page gets re-touched. **Recommend
moving the shell to position 2**, right after Today proves the pattern.

---

## 7. What the definition-of-done actually measures here

| DoD check | Verdict today | Note |
|---|---|---|
| `grep -rE "#[0-9a-fA-F]{3,6}" src/` returns nothing outside tokens | ❌ 392 matches | Needs rewriting to exclude `index.css` + `lib/colors.ts`, else it flags the token layer. Real target: 137. |
| No `border-radius` outside the three tokens | ❌ 8 distinct classes | Conflicts with responsive radius (BUJO-239). |
| No `font-weight` above 500 | ❌ 68 uses / 38 files | Purely mechanical. |
| Every number uses mono/tabular | ❌ not started | No `.num` equivalent exists. Large diffuse change — every stat, streak, count, duration. |
| No page wider than `--col` (820px) | ❌ all pages are `max-w-[1400px]` | A 40% narrowing of every view. **The single biggest visual change in the brief** — worth a mock before committing. |
| Exactly one accent-filled button per screen | ❌ unmeasured | Not grep-able. Needs a per-view visual pass; budget it. |
| Every route keyboard-navigable + visible focus ring | ✅ **already true** | Global `:focus-visible` shipped last session. |

---

## 8. What I'd change about the plan

1. **Reorder: shell second, not last.** It sets width, nav and top bar for every page.
2. **Rewrite the hex DoD check** to exclude the token files, and decide separately what happens
   to domain colors in `lib/*.ts` — they're data, not styling.
3. **Resolve the type scale against the font-scale feature** before writing `tokens.css`. Fixed
   px breaks FONT-1. This blocks step 1.
4. **Fix `--text-3` before adoption, not after** — it fails AA on cards at both values the two
   files disagree on (3.44:1 and 4.28:1). Detail in TASKS.md §H2.
5. **Drop the "extract primitives" framing.** Six of seven exist. Reframe step 2 as *reconcile
   the existing primitives with the new tokens*, plus one genuine extraction (day/week strip).
6. **Mock the 820px column first.** It's the change most likely to be regretted at full scale,
   and it's cheap to preview on one view.
7. **Budget the accent-inflation pass separately.** It's the brief's sharpest observation and the
   only major item no tool can measure — it needs eyes on all 25 views.

---

## Blocked on you

Step 1 (`tokens.css` + fonts) cannot start until these are answered — all are in
`TASKS.md` §H:

- **H1** — remap tokens into the existing Tailwind/Catppuccin layer, or replace it?
- **H2** — `--text-3` value, given it fails AA on cards
- **H3** — self-host the three font families instead of the Google Fonts `@import`?
- **H4** — do the other 4 themes survive?
- **§4 above** — fixed px type scale, or keep the rem-based font-scale feature?
