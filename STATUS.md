# STATUS — feat/wide-screen-scale (PR #293, COD-249)

Stopped after opening the PR. Nothing is merged and nothing is half-applied.

## Where it stopped

Branch `feat/wide-screen-scale`, three commits, rebased onto `29cdf6d`.
PR #293 open against `main`. All gates green on the rebased branch.

## The next action

Read the PR and merge it, or answer the one open design question below. There
is no unfinished code.

**The open question, if anyone wants to reopen it:** the ceiling is 2000px, so
a 4K screen is still 49.8% gutter. That is a deliberate stop — the orient bar
spans the shell, and four facts across 2,560px stop reading as a bar — but it
is the number a reviewer is most likely to push on. Everything else about the
shape is measured rather than chosen.

## What it does

A tier cap is a floor now, not a ceiling. One expression in `styles/layout.css`:

```css
.shell-fluid { max-width: max(var(--shell-floor, var(--container-wide)),
                             min(var(--container-max), 100vw - var(--shell-gutter))); }
```

Past a 1365px container the act column stops at 32rem and the review takes the
rest, so the new room becomes card columns rather than a wider form.

## The traps, for whoever is here next

- **`--shell-gutter: 260px` is not a taste call and must not be rounded.** It is
  exactly what a 1180px shell leaves at a 1440 viewport, which is what makes the
  fluid term *equal* the floor at 1440. Change it and the 1440 layout moves —
  the thing three separate measurements in this repo say must not happen.
- **The `max()` is the zoom guard.** Viewport units inside Settings' zoom
  subtree resolve against the divided viewport: at zoom 1.25 on a 1440 screen
  `100vw - 260px` computes **892**, narrower than today. The floor absorbs it.
  Do not simplify to a bare `min()`.
- **`@container (min-width: 1365px)` must not drop below 1345.** The widest
  container reachable at a 1440 viewport is the dashboard tier's 1344px. 1365 is
  also the width at which 38% equals 32rem, so the switch is continuous — the
  two constraints happen to agree, and both have to hold.
- **Tailwind sorts a named container variant and an arbitrary one by neither
  number nor source order.** `@7xl:columns-3` plus an arbitrary fourth step
  emitted the arbitrary rule *first*, so three columns won everywhere and
  `columns-4` sat in the class list doing nothing. All four masonry steps are
  spelled as arbitrary rem widths now. **Read the emitted CSS, not the class
  list**, when a step does not fire.
- **A class name written inside a comment becomes a live CSS rule.** Tailwind
  scans the file as text. The sentence explaining why a retired class was wrong
  kept generating it.
- **`npm run space` only proves the unchanged half.** It runs at 1440 and 390 —
  exactly the widths this PR must not move — so a zero diff there is the proof
  that nothing regressed, and says nothing at all about 1920+. The wide numbers
  came from the Chrome MCP at emulated viewports, recorded in the PR body.
- **Confirm a preview port by its bundle hash, never its title.** Several
  worktrees serve this app; every one answers with the same `<title>`. Compare
  `curl -s localhost:PORT/ | grep -o 'assets/index-[^"]*\.js'` against your own
  `dist/index.html`.
- **Do not rebuild while a browser gate or a measurement run is driving the
  preview.** A rebuild changes the chunk hashes and the open page fetches a file
  that no longer exists — it surfaces as the app's crash screen
  ("Cadence hit a snag"), not as a build error.
- **Insights' masonry third column had never rendered at any width**, despite
  `@7xl:columns-3` being in the class list since the 1440 tier was introduced
  for exactly that reason. `@7xl` is a 1280px *container*, and the rail plus gap
  leave 1136 on a 1344px shell. It arrives at a 1920 viewport now.

## Filed, not fixed

- **COD-247** — `NoFap.tsx:344` and `Cycle.tsx:385` pin their review grid to two
  columns. Measured 2 × 585 at 2560 where 3 × 383 would fit. Not a one-line
  delete: on Recovery the pin is what makes #292's `wide` panel span a full row.
- **COD-248** — Today's capture input stretches to ~1,400px at 2560. The 380px
  control cap is scoped to `.zone-act` and Today is built on `shell/Page`.
