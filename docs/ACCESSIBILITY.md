# Accessibility (a11y)

Target: **WCAG 2.1 AA**. This document records the current state and the gaps.

## Principles applied

- **Semantic HTML** — `nav`, `main`, `header`, `section`, `ul/li`, `table`,
  real `button` and form controls (not click-`div`s).
- **Keyboard operable** — every action is a focusable native control; visible
  focus rings via `focus-visible:ring-2 ring-mauve`.
- **Labels** — icon-only buttons carry `aria-label` (status cycle, delete,
  remove sticker, menu, prev/next). Inputs have associated `<label>` or
  `aria-label`.
- **Active state** — the current nav item sets `aria-current="page"` and is
  shown with both color and an accent rail (not color alone).
- **Reduced motion** — the page-turn animation is disabled under
  `@media (prefers-reduced-motion: reduce)`.
- **Theming** — Catppuccin Mocha (dark) and Latte (light); both chosen for
  readable contrast on text/subtext tokens.

## Contrast

| Pair | Theme | Notes |
|---|---|---|
| `text` on `base` / `mantle` | Mocha & Latte | AA for body text |
| `subtext0/1` on surfaces | both | AA for secondary text |
| `overlay0` hints | both | Used only for non-essential hints, kept ≥ 4.5:1 where it carries meaning |

Color is never the *only* signal: tasks use glyphs (`· ✕ > <`), events a ring,
important an `!`, dropped a strikethrough.

## Known gaps / backlog

| Gap | Severity | Plan |
|---|---|---|
| Recharts SVG charts lack text alternatives | Medium | Add an `aria-label` summary + a data table toggle for the mood/sleep chart |
| Sticker/emoji buttons announce raw emoji | Low | Add descriptive `aria-label` per emoji |
| Color-picker for habits relies on swatch color | Low | Add a name/label to each swatch |
| Automated axe-core checks | — | Add `@axe-core/playwright` to CI |

### Closed

| Gap | Closed by |
|---|---|
| No skip-to-content link | `AppShell` renders a visually-hidden `Skip to content` link as the first focusable element, targeting `<main id="main">` |
| Focus trap in modals | Radix (`ui/dialog`, `ui/alert-dialog`) traps and restores focus for dialogs built on it; every hand-rolled overlay (command palette, card enlarge modal, Stats enlarge, habit editor, habit detail, exercise detail, SOS overlay, onboarding tour) uses `useFocusTrap` — Tab cycles inside, focus returns to the opener on close |
| Month calendar cells announced as bare numbers | Each `Monthly` day cell carries an `aria-label` with the date, item count, mood and habit progress, plus `aria-current="date"` on today |
| Saves gave no announcement | Off-screen saves (weekly reflection, gym routine) fire a `notify.success` toast, which sonner announces politely |
| Six folds drew a state they never announced | The typographic disclosures (`▸ ▾ ▴`) in Coaching, Home Workout, Pull-ups and Trackers now carry `aria-expanded` — they had none, and matched neither the caret-icon nor the `aria-expanded` grep, so two sweeps missed them |
| Recurring-rule form controls unnamed (**critical**) | Neither `<select>` in Plan's rule form had an accessible name. Fixed with `aria-label` on all three controls — visible labels would break the row's "Take vitamins · task · daily" sentence |
| Activity grids conveyed data by colour alone | `DayGrid` was a `<div role="img">` with one summary label and per-cell `title` — `title` is not a reliable accessible name and is skipped entirely on touch. It is now a `<table>` with weekday row headers, week-start column headers and a visually-hidden per-cell label carrying the actual value. Headers are `sr-only`: the visual is a heatmap, not a spreadsheet. Fixes Stats and Trackers too, which share the primitive |
| `crust` foreground on neutral chips (**two sites**) | A colour picked as the light-on-dark half of a saturated fill was set unconditionally, so the neutral state of the chip was dark-on-dark: Coaching's week numbers and Recovery's milestone ladder — in both cases the numbers you are counting towards. Each now pairs a foreground with its own background. Every other `cat('crust')` in the app already branches correctly (`complete ? crust : overlay0`), which is why only these two failed |

**Rule for new overlays:** if it is a `fixed inset-0` div rather than a Radix
dialog, it must call `useFocusTrap` (`src/lib/useFocusTrap.ts`). The hook
deliberately traps Tab only — no `focusin` guard — because these overlays open
Radix confirm dialogs that portal outside the trapped node.

**Rule for new folds:** the caret is a real `<button>` with `aria-expanded`, and
it stays the control even though the whole header is clickable — the header
click is a pointer convenience, never a `role="button"` div standing in for it.
Full pattern and inventory: `docs/COLLAPSE-PATTERN.md`.

> ⚠️ **The gate cannot see inside a closed fold.** `npm run a11y` scans the
> rendered page, so anything behind a collapsed section is simply not checked.
> Unhiding Plan's Setup surfaced a **critical** `select-name` violation that had
> been shipping for months. When you add or change a fold, re-run the gate with
> it **open**, and read a clean report as "clean for what was expanded".

## How to test

- **Keyboard:** Tab through the whole app; every control reachable and operable;
  focus always visible.
- **Screen reader:** VoiceOver/NVDA — nav items announce label + current page;
  buttons announce their `aria-label`.
- **Zoom:** 200% browser zoom must not clip content (layout is responsive).
- **Reduced motion:** enable OS "reduce motion" → no view animation.

## Owner

a11y is owned by the maintainer; this file is the running checklist. PRs that add
UI must keep these guarantees (see `docs/prompts/01-add-feature.md`).

**Rule for heatmaps and day grids:** they are `<table>`s with row and column
headers, and every cell carries its value in text. Colour is never the only
channel. Cells are deliberately **not** tab stops — a 12-week grid is 84 cells,
and making each focusable puts 84 stops between the grid and the next control,
which is a focus trap by another name. Screen readers reach them through table
navigation, which is what the headers are for.

**Rule for the gate's view list:** `scripts/a11y-axe.mjs` visits a fixed list,
and a gate that does not open a page cannot vouch for it. Add new surfaces to
`VIEWS`. Recovery was left out once on the reasoning that it sits behind an
opt-in setting — `nofapEnabled` defaults to **true**, so it had been reachable
all along, and adding it immediately surfaced a serious contrast failure. Argue
from the rendered page, not from the shape of the code.

