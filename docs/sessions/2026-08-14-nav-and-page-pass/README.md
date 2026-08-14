# Nav audit + page pass · 2026-08-14

Branch `fix/nav-audit-ui-pass`. Six commits, all defect fixes.

## Scope, as agreed before starting

| Question | Answer |
|---|---|
| How much | Nav findings + the six pages Today, Plan, Fitness, Nutrition, Insights, Settings |
| Build or document | Build defects and inconsistencies; redesign ideas go to `BACKLOG.md`, not the diff |
| Verify at | 390px phone, 1440px desktop, **both rails** (focused + classic) |
| **Not** in scope | Latte theme (not requested), the other 22 views, any redesign |

## The headline

Three of the six findings were not cosmetic. They were features that did not work
and had never failed a check:

1. **Two whole views had no door** in the classic layout — `?view=gym` and
   `?view=pickleball`.
2. **Every bar chart in the app rendered flat.** Six charts, four files, all bars
   0px tall.
3. **The section tab row never scrolled the current tab into view**, so arriving on
   a later tab showed the wrong tab as leftmost with the real one clipped off-screen.

None of these were visible from the source. All three were found by measuring the
rendered DOM, and the third only because the second had already taught the lesson.

## What shipped

| # | Commit | Fix |
|---|---|---|
| 1 | `04fc1b8` | Strength + Pickleball restored to the classic rail; dead `System` rows deleted; guard test added |
| 2 | `7d129ad` | Section tab row scrolls the active tab into view |
| 3 | `a4f144b` | Card ⓘ no longer drawn where it only repeats the subtitle |
| 4 | `49bfebd` | Every bar chart rendered flat — one wrong flex alignment, six call sites |
| 5 | `22d2616` | Insights masonry measures its container, not the viewport |
| 6 | `9aa2c13` | Plan's week strip wraps instead of truncating to prefixes |

## The loop, per the standing process

Observe (screenshot + a11y tree + console + **measure the DOM**) → diagnose through
the solution / frontend / UX lenses → write the prompt before the code → fix at the
root, grepping every caller → validate with the gates *and* a re-measure → record.

The measuring step earned its place this session. Findings 2 and 5 both looked like
deliberate styling in a screenshot and were only provably wrong once queried:
`getBoundingClientRect().height === 0` on every bar, `columnCount: 2` on a 446px
container. A screenshot cannot distinguish "flat by design" from "broken".

## Files

- `FINDINGS.md` — every finding, with the measurement, and what happened to it
- `OBSERVATIONS.md` — per-page notes from the observe step
- `PROMPTS.md` — the fix written as a prompt, before the code
- `VALIDATION.md` — gate output and the before/after numbers
- `BACKLOG.md` — the redesign ideas that were deliberately **not** built
