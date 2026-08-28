# STATUS

**Stopped:** 2026-08-28. **Zero open PRs, clean tree, `main` at `e4508db`.**
Five merged this session: **#161 #162 #163 #164 #165**. Closed **COD-35**,
**COD-32** and **COD-37** — the whole of what the last STATUS nominated as next.

## What shipped

| PR | What | Ticket |
|---|---|---|
| #161 | Challenges rebuilt on the three-zone contract; the numbers add up | COD-35 |
| #162 | STATUS · the diagnosis was "too many numbers" and it was wrong | — |
| #163 | Worklog | — |
| #164 | The light themes had illegible accents, and the palette was written down twice | COD-32 |
| #165 | A checkbox, because an event is not a setting | COD-37 |

## The one thing to carry forward

**Both tickets this session were filed from a number somebody read rather than
measured, and both were wrong in the same direction — they understated it.**

- `docs/pages/challenges.md` recorded "the card states its progress four times"
  as a P1. Read literally that says *delete three of them*, and doing so would
  have hidden the defect: all six numbers were correct under their own
  definitions, and what was missing is that **no two could be added to each
  other**. Five numbers on a screen is fine once they agree.
- COD-32 listed four bad palette values from `solve-contrast.mjs`'s output.
  Measuring found **six**, retired **two** of the four as false (latte and dawn
  `pink` are fine at 4.55 and 5.02), and turned up a second bug the ticket did
  not know existed — the palette is written down twice and the copies had
  drifted in four places.

The habit worth keeping: **before acting on a recorded number, re-measure it.**
It cost about ten minutes each time and changed what the work was both times.

## Next action

Two tickets, both filed with measurements attached rather than impressions,
both the same shape as COD-35 — which is now a worked example to copy:

1. **COD-48 · Goals says `1 of 7 on track` and it is not true.** `Goals.tsx:153`
   counts `value >= target` — goals already *finished* — and labels it "on
   track", while `Goals.tsx:274` renders a per-goal pill also reading "on track"
   from `pace.onTrack` (`observedRate >= requiredRate`, `lib/goals.ts:52`). One
   phrase, two predicates, one screen. It is worse for avoid-goals: Caffeine
   2/5 and Sugar 2/7 are *under* their caps, i.e. succeeding, and `value >=
   target` scores both as failures. Fix the same way COD-35 was fixed — name
   what each number answers, do not print fewer of them.
2. **COD-49 · Recovery's orient bar repeats the hero it sits above.** Two of its
   four facts are the ring restated 200px lower: `Days clean 16` / `16 DAYS
   CLEAN`, and `Next milestone One month · 14d` / `Next: One month · 14 days to
   go`. Zone 1 is for facts that change the next thirty seconds.

Then, lower: **COD-50** (TodayHabits and Trackers still hand-roll the checkbox
COD-37 added — but they carry a third "slipped" state, so it is not a rename)
and **COD-51** (dawn `flamingo` is dE 16 from `maroon`; add a dE floor to
`check-contrast.mjs` if you touch it).

**The census nominates no page.** Re-run 2026-08-28: the tallest left are
Pickleball **5.92** and Stats **5.21**, and both are long because their
analytics are open, which is the state `docs/pages/` asked for. Height is not a
queue.

## Gates, and what each one is now good for

`npm run` — `contrast` and `design` are static (fast, no browser, no seed);
`a11y`, `smoke`, `clipped` and the census need a server and see only what
rendered.

| Gate | Catches | Blind to |
|---|---|---|
| `contrast` **(new)** | an accent under 4.5:1 as text; the two palettes disagreeing | anything about *use* — a token can be legible and still be the wrong colour |
| `design` | hand-written accent-on-wash, px icon sizes, retired variants, glyph names as prose | anything not expressible as a line-level regex |
| `a11y` | axe serious/critical, 5 themes × 2 widths, with the demo seed armed | closed folds, unvisited views, and **branches the seed never takes** |
| `verify-folds <view>` | the same, with that view's folds forced open | other views |
| `smoke` / `clipped` | a view that throws; text clipped at 1440 or 390 | anything that renders and fits |
| `page-census.mjs` | height, fold count, charts open by default | quality — it is a thermometer, not a judge |

## Traps hit this session

- **A branch the demo seed never takes cannot fail a rendering gate.** Latte's
  `yellow` was **2.02:1** — below even the 3.0 floor for a graphic — through
  every green `npm run a11y` this project has printed, because the only place it
  renders is the `count >= 2 ? peach : yellow` arm of Plan's migration pill and
  the seed produces counts of 2, 3 and 4 only. Third member of a family:
  empty-journal (COD-28), closed-fold, and now unreachable-branch. **When a
  static check is possible, prefer it** — that is what `check-contrast.mjs` is.
- **The palette was two files and nobody owned the diff.** `--color-*` in
  `index.css` for Tailwind, a literal map in `lib/colors.ts` for `cat()`. #157
  fixed vscode's `red` in one of them, so `text-red` and `cat('red')` painted
  different colours on the same screen for two sessions. Gated now.
- **Contrast ratio cannot answer "are these two colours distinguishable".** Two
  colours of equal luminance have a ratio of 1.0 whatever their hue. Separation
  is **dE**, and using the wrong metric is how "darken it until it passes" looked
  like a fix when it collapses yellow into peach.
- **A gate you have not watched fail might match nothing.** The new
  design-system rule was proven by writing the bug into a probe file, watching
  it go red, then writing the safe pairing and watching it stay green. Do this
  for every rule added to a linter — this repo has shipped several that were
  green because they matched zero lines.
- **The census clamps at 1.00 screens**, so Challenges, Account and Settings all
  print 1.00 and are not the same height. Measure `#main` directly before
  concluding nothing moved.
- **A Playwright screenshot is frosted by the onboarding overlay** unless
  `localStorage['bujo:onboarded']` is set on an *earlier* load
  (`scripts/a11y-axe.mjs:178`). The first shot of the Challenges rebuild was a
  blurred rectangle and read as a broken layout.
- **`Segmented` renders a Radix `ToggleGroupItem`**, so
  `getByRole('button', …)` times out. Query by text.
- **Radix controlled inputs** reject `checked` + `readOnly` for a static gallery
  sample; use `defaultChecked`.

## Verification, as run

Against `http://localhost:5199` (dev server, which sidesteps the
stale-service-worker trap), demo data seeded and asserted present:

- `npx tsc -b` exit 0 · `npx vitest run` **61 files, 854 tests** (831 at the
  start of the session) · `npx eslint .` 0 errors, 2 pre-existing `App.tsx`
  warnings · `npm run build` clean.
- `npm run contrast` — 5 themes, 14 accents, both palettes agree.
- `npm run design` — passed, 276 files, **with the new rule proven to fire**.
- `npm run a11y` — 0 serious, 0 critical, both viewports, all five themes.
- `node scripts/verify-folds.mjs challenges` — 0/0 at 1440 and 390, folds open.
- `node scripts/clipped-text.mjs` — clean, 23 views. `npm run smoke` — 25/25.
- Challenges re-measured on the rendered page: **1.41 screens → 1.00** at 1440.
- Trackers and Plan opened in latte and dawn, Challenges and the kitchen sink in
  mocha and latte, and looked at. The three-step scale is still three steps.
- Goals and Recovery read on the rendered page — that is where COD-48's
  `1 of 7 on track` and COD-49's doubled `16` came from.
