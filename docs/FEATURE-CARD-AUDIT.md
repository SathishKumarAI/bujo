# Feature & card audit — 2026-06-24

A panel audit of the bujo feature views and their cards, run as three parallel
reviewers (Correctness · UI-consistency · UX/accessibility), then **verified by
hand**. This doc records every finding, my verification verdict, and the reasoning
— including the false positives, so we don't re-chase them.

> **Method.** Three subagents each swept the 23 views + `src/components/**` +
> `src/lib/*` on one dimension and returned `file:line` findings. I then read each
> cited line and classified it: **REAL** (fix it), **BY-DESIGN** (intended
> behaviour the reviewer misread), or **FALSE +** (the code already does the right
> thing). Agents over-flag; ~60% of the raw findings did not survive verification.
> That's expected and is the point of the verify step.

## Verdict summary

| Dimension | Raw findings | Real | By-design | False+ |
|---|---:|---:|---:|---:|
| Correctness | 5 | 1 (defensive) | 2 | 2 |
| UI consistency | 11 | 3 | — | 8 (refactor-taste, not gaps) |
| UX / a11y | 12 | 5 | 3 | 4 |

## Correctness panel

| # | Location | Reviewer claim | **Verdict** | Reasoning |
|---|---|---|---|---|
| C1 | `lib/streak.ts:108` | P0: `dayDiff(startedOn,d) <= 0` drops relapses after start; all streak stats wrong | **FALSE +** | By the data model, a relapse *resets* `startedOn` to that day, so every historical relapse is on/before the current start. There are no relapses after `startedOn`; `<= 0` keeps them all. Comment confirms intent. No change. |
| C2 | `views/Today.tsx:151` | P1: reflection `defaultValue=""` hides saved text, duplicates on blur | **BY-DESIGN** (minor UX) | The reflection box is an *append* input — each blur adds a new ` · `-joined line to the day's memory (a journaling log), not an editor of existing text. Not duplication. Real gap = no save confirmation → tracked as U-SAVE below. |
| C3 | `views/Today.tsx:254` | P1: `+{step}` quick-add duplicates the `+` button | **REAL (low)** | Reviewer self-contradicted. Deferred pending a product call on the intended delta; not fixed this pass. |
| C4 | `lib/challenges.ts:116` | P1: `percentComplete` can divide by `durationDays===0` → NaN → broken ring | **REAL (defensive)** | The create form blocks 0 via `!Number(duration)`, but stored/imported data could carry 0. Cheap guard. **FIX:** early-return 0 when `!durationDays`. |
| C5 | `lib/correlations.ts:220` | P2: a 0-count habit can become "biggest win" | **FALSE +** | `now > bestCount` is strict and `bestCount` starts at 0, so a habit needs ≥1 completion to win. 0-count never wins. No change. |

## UI-consistency panel

| # | Location | Finding | **Verdict** |
|---|---|---|---|
| UI1 | `Stats.tsx:24`, `Cycle.tsx:84`, `Pickleball.tsx:17`, `Gym.tsx:495` | Same hard-coded recharts tooltip `{background:'#181825',…}` repeated 4+ times, bypassing `cat()` tokens | **REAL.** Extract a shared `rechartsTooltip` (token-based) and reuse. Also makes tooltips theme-aware (they were stuck on Mocha hexes under the new themes). **FIX.** |
| UI2 | `Focus.tsx:116`, `133` | Custom bar/SVG charts not wrapped in `ChartCard` | **REAL (refactor).** Larger change; logged for a later pass, not this PR. |
| UI3 | `Coaching.tsx` ×5 | Repeated ad-hoc tile divs that could share a primitive | **TASTE.** Not a user-visible gap; deferred. |
| UI4–11 | various | "could use Card/StatTile" suggestions | **TASTE.** No rendering bug; deferred to avoid churn. |

## UX / accessibility panel

| # | Location | Finding | **Verdict** |
|---|---|---|---|
| U1 | `views/Cycle.tsx:54` | Flag toggle buttons lack `aria-label`/`aria-pressed` | **REAL.** Icon+text but no pressed state for SR. **FIX.** |
| U2 | `components/Heatmap.tsx:16` | Grid cells are `<span title>` — grid not announced | **REAL (light).** Cells are read-only, so per-cell buttons would be wrong; add `role="img"` + summary `aria-label` on the grid. **FIX.** |
| U3 | `components/Coaching.tsx:103` | Expand/collapse chevron button has no accessible name | **REAL.** **FIX** with `aria-label` + `aria-expanded`. |
| U4 | `views/Monthly.tsx` | Calendar day buttons rely on `title` only | **REAL (light).** Add `aria-label` with date + completion. **FIX.** |
| U5 | `components/TodayHabits.tsx` | "Mark all" no feedback | **REAL (minor) = U-SAVE.** Pairs with C2 — both want a small "saved/marked" confirmation. Deferred (needs a toast pattern decision). |
| U6 | `views/Trackers.tsx:135` | Layout toggles lack `aria-label` | **FALSE +.** Already have `aria-label={...layout}` + `aria-pressed` (line 138-139). |
| U7 | `components/EntryRow.tsx:72` | Delete button no label | **FALSE +.** Already has `aria-label` (line 72). |
| U8 | `Today.tsx:67` sliders | Sliders lack labels | **PARTLY FALSE.** Wrapped in `<label>`; accessible name exists. Visual placement is a taste call; no fix. |
| U9–12 | various | Pomodoro icon buttons, Focus chart role, legend text | **REAL (light)** for Pomodoro labels; rest taste. Pomodoro deferred. |

## Fixes applied this pass (real + safe + low-risk)

1. **C4** — `challenges.ts percentComplete` guards `durationDays === 0` (no NaN ring).
2. **UI1** — shared `rechartsTooltip` in `lib/colors.ts`, applied to Stats / Cycle /
   Pickleball / Gym (×5). DRY only — the tokens are still static Mocha hexes
   (`cat()` is not yet CSS-var-backed), so tooltips are *not* theme-aware; that's a
   separate, larger change (see deferred).
3. **U1** — Cycle flag buttons: `aria-pressed` + `aria-label` with on/off state.
4. **U3** — Coaching week chevron (glyph-only button): `aria-expanded` + `aria-label`.

## Deferred (logged, not lost)

- **U2** Heatmap grid `role="img"` + summary label; **U4** Monthly day-button
  `aria-label` — real but the components already convey state via `title`; batch
  with the next a11y sweep.
- **C3** `+step` quick-add delta — needs a product decision on intended increment.
- **U5 / C2** save/confirmation affordance (Mark-all, reflection) — wants a shared
  toast pattern; do it once, app-wide.
- **UI2** Focus custom charts → `ChartCard`; **UI3** Coaching tile primitive — refactors, own pass.
- **U9** Pomodoro icon-button labels.
- ~~**Theme-aware charts**~~ ✅ **done (2026-06-24).** `cat()` now resolves against
  a per-theme JS palette (`THEME_PALETTES` in `lib/colors.ts`, mirroring the
  `--color-*` CSS blocks). The store calls `setActiveTheme(resolvedTheme)`
  synchronously during render, so charts + inline styles pick up mocha / latte /
  neon / vscode / dawn colors with no post-render flash. `rechartsTooltip()`
  became a function so it reads the live palette. Chose JS palettes over reading
  `getComputedStyle` because charts need concrete colors (not `var()`) and the
  DOM-read approach forced a setState-in-effect the linter rejects.

## Key lesson (kept here on purpose)
Multi-agent review is a *finder*, not an *authority*. Roughly 60% of raw findings
here were false positives or by-design. Every fix in this repo goes through:
**find → read the actual line → classify → fix only the survivors.**
