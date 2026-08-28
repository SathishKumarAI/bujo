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
| Empty states are no longer scanned | Low | The gate now seeds demo data, so it grades the *populated* app. Empty and populated are different UI; a second pass would cover both |
| `yellow` and `pink` unsolved in the light themes | Medium | latte `yellow` is **1.83:1** as text. Not a live failure — every call site was moved off it — but a trap for the next `cat('yellow')`. **COD-32**, a design call: the solver's answer collapses two steps of a three-step scale |

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
| `crust` foreground on neutral chips (**two sites**) | A colour picked as the light-on-dark half of a saturated fill was set unconditionally, so the neutral state of the chip was dark-on-dark: Coaching's week numbers and Recovery's milestone ladder — in both cases the numbers you are counting towards. Each now pairs a foreground with its own background. ~~Every other `cat('crust')` in the app already branches correctly (`complete ? crust : overlay0`), which is why only these two failed.~~ **That last sentence was wrong, and wrong in an instructive way — see below** |
| Automated axe-core checks | The `a11y` job runs `scripts/a11y-axe.mjs` on every PR — 5 themes on desktop, 2 on phone, plus Today's three time-of-day surfaces and the companion views |
| **The gate was grading an empty app** (**16 violations**) | `scripts/a11y-axe.mjs` seeded `{ settings }` and nothing else, so every card behind a `{rows.length > 0 && …}` guard — most of this app's analytics — was absent from the DOM and could not fail. It now loads `?demo=1` and **asserts the seed landed**. Arming it turned one green run into **16 serious `color-contrast` violations** across Challenges, Plan, Trackers, Stats and Strength, in four of five themes. All fixed; see the three colour rules below |

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
>
> Use **`node scripts/verify-folds.mjs <view>`** — it loads `?demo=1`, opens
> every disclosure in three passes (opening an outer fold *mounts* inner ones
> that were not in the DOM), and re-runs axe at 1440 and 390. It reports how
> many are still shut, because single-select disclosures cannot all be open at
> once: read its result as "clean for what could be opened".

## The three ways this gate has lied

Each was found the same way — by making the gate look somewhere it had not been
looking — and each one produced real, shipped violations. They are listed
together because the shape repeats: **a clean report is a claim about what was
scanned, never about the app.**

| # | It could not see… | What it hid |
|---|---|---|
| 1 | **inside a closed fold** | a **critical** `select-name` in Plan's Setup, for months |
| 2 | **a page not on its `VIEWS` list** | Recovery, excluded on the belief it was behind an opt-in — `nofapEnabled` defaults to **true**, and adding it immediately failed on contrast |
| 3 | **a card that had no data to render** | **16** serious `color-contrast` violations, because the gate seeded an empty journal and most analytics is behind a `{rows.length > 0 && …}` guard |

The seed is now **asserted**, not assumed: if demo data fails to load, the gate
exits 1 and says so. A gate that silently reverts to an empty journal prints the
same reassuring zero it printed for its whole existence.

## Colour rules, each learned from a shipped failure

**`cat('crust')` is not a foreground.** It is the light-on-*saturated* half of a
pair and is near-white in the light themes, so `crust` on a fill is correct in
Mocha and wrong in Latte and Dawn. **Use `onAccent(fill)`** — it picks the better
neutral per theme and pushes it to 4.6. That helper already existed, with two
adopters against **21** hand-written `cat('crust')` call sites; finishing the
migration fixed 7 of the 16. `PlateStack` carried the assumption in a comment —
`/* Catppuccin Mocha crust */` — i.e. right for one theme in five, out loud.

**Its partner mistake is `cat('overlay0')` as text on the neutral branch of the
same ternary** — **2.57:1** at 10px, four instances. Use `subtext0`. The two
together are why `complete ? crust : overlay0`, recorded in the table above as
the *correct* pattern, was in fact both bugs at once. When a ternary picks a
foreground per state, **both branches are a decision**.

**The accent-on-wash idiom is calibrated at `'22'`.** `scripts/solve-contrast.mjs`
solved every accent to clear 4.5 as text on a **13%** wash of itself. A `'33'`
wash lifts the background toward the text and puts it back under — latte's Plan
pill measured **4.25**. One hex digit, failing silently.

**A "solved palette" is not solved.** `solve-contrast.mjs` only ever solved the
two *light* themes, and even there its output was applied for green/red/peach
and skipped for yellow and pink. vscode's `red` failed its own wash at **3.97**
and had to be solved by hand. Measure the accent you are about to use as text;
do not assume the script covered it.

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

