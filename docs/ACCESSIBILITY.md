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
| No skip-to-content link | Low | Add a visually-hidden skip link before the nav |
| Focus trap in modals | N/A | No modal dialogs yet; revisit if added |
| Automated axe-core checks | — | Add `@axe-core/playwright` to CI |

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
