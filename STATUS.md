# STATUS

**Stopped:** 2026-09-21, on `main`, clean, nothing open. **Nine PRs merged
this stretch (#252–#260)**, and `main`'s a11y workflow is green on two
consecutive runs after three red merges.

## Where the app is

Today is **one page**. It was four surfaces behind a tab row — morning, day,
evening, habits — and the split was paid for in duplication the code had
already stopped fighting: habits were captured in **four** places, and
`surfaceUntouched` declines to count them at all because "they render on Day
*and* Evening". The order is now capture → review → visualisations, which is
what the page is for: **capture used to be a tab away**, so at 7am writing a
line began with choosing a surface.

`npm run space -- <view> | --all` measures any page: screens of scroll as
shipped AND with every fold open, cards, how many columns the layout actually
uses, and cards whose box is mostly air. Two scroll numbers because either
alone is gameable — measuring only the opened page punishes a disclosure for
existing; measuring only the shipped page rewards hiding content.

## The one thing that is instrumented, not fixed

**An intermittent blank boot on `?view=settings` in CI.** The document renders
nothing — `body says: ""`, right url, no dialogs — and it never reproduced
locally. Filed as **COD-211**.

Three fixes treated it as a timing race and each held locally and died on CI.
Two theories were measured and disproven: the lazy chunk is not slow (8x CPU
throttle: `main` goes 12 → 319 characters in ~500ms) and the missing `?demo=1`
on the companions URL renders fine (319–31,655 characters).

The gate now captures `pageerror`, console errors and failed JS/CSS requests
and prints them at the point of failure, and reloads once **loudly**. It had no
error capture at all, which is exactly why three rounds of guessing were
possible. The next occurrence names its own cause.

## Traps earned today, all in CLAUDE.md

- **Every browser-gate assertion needs a wait in front of it.** Four in one day:
  navigation (COD-202), a receipt check that could only pass between 11:00 and
  18:00, the theme attribute, and the view render. Each read "not yet" as "not
  ever", each passed on a warm machine and failed on a cold runner.
  `waitUntil: 'networkidle'` is not "the app is ready".
- **`waitForFunction` dies with the execution context.** It throws when the page
  navigates mid-wait, and a `.catch` that protects the diagnostic path swallows
  it. Poll instead — a destroyed context is then one wasted iteration, not a
  verdict.
- **Do not `npm run build` while `npm run a11y` runs.** The preview server
  serves the half-written `dist` and the gate reports a view that "did not
  load".
- **`MasonryGrid` in a zone under 768px silently does nothing** — it queries its
  container (`@3xl`), and Gym's review zone is 722px. Second page it has bitten.
- **An element cannot query itself.** `@2xl/band:` on `BandRow`, which IS the
  `@container/band`, emitted no CSS and collapsed desktop to one column with
  nothing failing.
- **A number over budget is a question, not a verdict.** Four of the eight pages
  over three screens are deliberately that long and two say so in the file with
  the measurements that decided it.

## Next, in the order I would take it

1. **COD-211** — the blank boot. The diagnostics are in; the next red run should
   name the cause rather than cost another three cycles.
2. **COD-208** — a crash inside the gate's `scan()` still escapes before the
   summary table prints, so that red cannot say how much was checked.
3. `pullups` (5.6 open) and `nofap` (4.7) are unexamined. Both are collapsed
   reference content at 1.9 and 1.8 shipped, so they may be working as intended
   — run `npm run space` and the `space-audit` skill before touching them.
4. `insights` is 6.8 desktop / **11.9 phone**, the largest page in the app.
   Shortening it means cutting cards: a product decision.
5. `NoFap.logUrge` still has no guard beyond a 3s double-tap window.
6. Two `Stepper` components exist (`fields/` and `ui/quickpick`), and two
   disclosure primitives. Worth one consolidation pass.

## Numbers worth not misreading

`npm run a11y` reports **166 rows, down from 194**. That is the four-surface
walk collapsing into one scan per theme and viewport — same coverage, fewer
pages. It is not lost checks.
