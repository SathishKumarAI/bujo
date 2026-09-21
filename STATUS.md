# STATUS

**Stopped:** 2026-09-21, on `fix/a11y-gate-hide-on-scroll`. **COD-202 is fixed
and `npm run a11y` is green** — the thing the last three entries of this file
said was blocking everything else.

## COD-202, closed: the gate was one pixel out

`npm run a11y` aborted at the second `VIEWS` entry, having scanned **zero**
views, with

```
[Plan] no rail row with that name — the gate could not reach it.
```

**Cause.** `BottomNav` and the top bar's section fold share `useHideOnScroll`,
so the phone's *only* navigation slides away on scroll-down. The gate scrolls
constantly — `openFolds()` on every page, `scrollIntoViewIfNeeded` on every
tab row — so by the time it looked for the next section, `onScreen` measured
the bar at **y 845 in an 844px viewport**. Present, labelled, one pixel below
the fold, and by the only predicate that separates the real bar from the parked
off-canvas drawer, off screen. `goOrDie` calls that a retired destination and
exits 1.

It read as intermittent because it depended on how far the previous surface had
been scrolled. Adding Habits — the tallest — to `SURFACES` in #250 made it
reliable, so a gate that had been fragile for a while looked newly dead.

**Fix, two parts.** `onScreen` scrolls the page back to the top before
concluding anything is gone — what a user does without thinking — and only on
the path where nothing was found, so it costs nothing normally. And `goOrDie`
now dumps what it *did* find: url, viewport, theme, every navigable control,
near-matches, their boxes.

The second part is the one worth carrying forward. Two hypotheses were tested
with browser probes and disproven against a message that said only "could not
reach it" — the header folding on scroll, and `openFolds` opening a modal. The
dump named the cause on the very next run's first line. **A red that carries no
evidence is only marginally better than a gate that is off.**

**Result:** 194 rows — both viewports, all five themes, every view and tab —
exit 0, twice.

A third run died on `browserContext.newPage: Target crashed`, but only because
I had stacked it on top of one still finishing — environmental, and the two
clean runs are on the same commit. What is *not* environmental is the shape of
that failure: the exception escapes, node prints a stack trace, and the summary
table never prints, so a reader cannot tell whether 0 views or 190 were clean.
That is COD-202's complaint arriving by another route. Filed as **COD-208**,
low. Do not fix it with a blind retry — a renderer that crashes on a particular
view is a finding about that view.

## What the repaired gate found immediately

Insights' correlation matrix carried `role="img"` on its scroll container with
the whole matrix flattened into the `aria-label`. Two bugs in one element:

- It **overrode the `<table>` underneath** — a real table with `scope="col"` and
  `scope="row"` headers, which can already say "Sleep, Stress, r 0.41" as you
  move cell by cell — replacing it with one unnavigable sentence. Same mistake
  as `role="img"` on the `<ul>` two cards up in that file, fixed in #251.
- The same div was a scroll region with **no tab stop**. At 390px the matrix is
  wider than its column, so a keyboard-only user could not pan it at all.

Now a focusable labelled group, with the summary in a `<caption>` where a
table's summary belongs — supplementing the cells rather than replacing them.

That is three serious violations this gate has caught in two sessions, none of
them visible to `clipped-text.mjs` (which asks whether an element shows less
than it holds) or to `smoke` (which asks whether the page rendered). It is the
only gate that can see this class of bug, which was the whole argument for
fixing it rather than living with it.

## Next, in the order I would take it

1. `NoFap.logUrge` still has no guard beyond a 3s double-tap window — and
   whether an urge row should be written at all is a product call, not a code
   one. See #249's PR body.
2. Convert the remaining typed-number forms to `ChipPick`/`Stepper`:
   **Pickleball has 12 free-text fields**, Focus 6, Goals 3.
3. `focus/SessionHistory` holds a stale draft if undo or a cloud pull lands
   while an editor is open. Narrow, written down in the file, not fixed.
4. The phone nav hiding on scroll-down is deliberate, but it is worth asking
   whether the *only* navigation on a phone should be the thing that hides. It
   fooled a gate written specifically to find unreachable controls.

## Traps worth the next session's time

The COD-202 one is now in `CLAUDE.md` with the rest. From the session before it,
still unrecorded anywhere else:

- **A grep finds the spelling you thought of; a lint rule finds the pattern.**
  The manual sweep for `opacity-0 group-hover:opacity-100` missed three sites
  that spell `transition-opacity` *between* the two classes — one of them
  "Delete entry". The rule added in #243 found them on its first run.
- **Measure the instrument before believing it.** A contrast probe printed
  identical numbers for all five themes (wrong `localStorage` key) and then a
  fake 1.30:1 for latte (read `color(srgb 0.80 …)` as 0–255). Two bugs in the
  tool before one in the subject.
- **A page move is a `git mv` plus a rendered-output diff, never a retype.**
  Done three times (#236, #249, #250); #250 lost zero headings, text lines,
  buttons and chart labels. The diff also caught a **five-fact `StatBar`** — it
  slices to four and warns only in DEV, so the fifth vanished from a production
  build in silence.
- **`MasonryGrid` is a container query.** On a non-`stacked` page zone-review is
  ~730px and its `@3xl` breakpoint wants 768 — it missed by under 40px.
  `CardGrid` breaks on the viewport, which is the right question when the column
  is sized by the split.
- **`color-mix()` costs you `onAccent`.** It computes to `color(srgb …)`, which
  the colour helpers do not parse, so a fill built that way cannot ask for its
  own readable foreground.
