# STATUS

**Stopped:** 2026-09-21, on `main`, clean, no open PRs. **Thirty commits**,
seventeen PRs (#234–#251). Plane: COD-199, COD-200, COD-201, COD-203 done;
**COD-202 open and still the thing that matters most.**

## The one that matters — COD-202, `npm run a11y`

It is **intermittent, not dead**, and that is a correction to what this file
said before. Measured this session: one run completed the whole walk and
printed violations; the next two aborted at the second entry with

```
[Plan] no rail row with that name — the gate could not reach it.
```

having scanned **zero** views. Exit 1 either way, so a red run tells you
nothing about whether anything was checked.

**While it was working it found two serious bugs I had just shipped**, which
is the argument for fixing it rather than living with it:

- `role="img"` on a `<ul>` (Insights' habit-consistency card) overrides the
  implicit `list` role and **orphans every `<li>`** — axe fails it as
  `listitem`, and a screen reader loses "3 of 8" navigation. `role="img"` is
  right for a canvas or an SVG plot; it is wrong on markup that genuinely *is*
  a list.
- `text-fg-3` on `bg-ink-2` at 13px measured **4.18:1 on mocha, 4.49 on
  latte** — the `Stepper`'s unit suffix, under the floor in four of five
  themes. `aria-hidden` does not excuse it: it is still read by eyes.

Neither is visible to the other gates. `clipped-text.mjs` asks whether an
element shows less than it holds; `smoke` asks whether the page rendered.
**This is the only gate that can see either class of bug, and it is the one
that cannot be relied on to run.**

Next action: find what the gate clicks to reach a section and compare with
`SECTIONS`. Navigation moved three times recently (#231 header row 2, #240 one
corner menu, #250 the habits surface). Likely it is looking for a door that
was removed. **Fix the gate, not the list** — its own error message says so.

## What shipped

Seventeen PRs. The through-line: **most of these were not new features, they
were things the app already had that nobody could reach.**

| # | What |
|---|---|
| 234 | Settings/Account: phone tab overlap, half the page empty, folds that never folded, motion that reached nothing |
| 235 | One answer to "what is due today" — seven call sites had dropped `startedOn` |
| 236 | Insights absorbs Stats: one page, a filter row, four new charts |
| 238–239 | Voice: pickleball by duration; asks singles/doubles and who with |
| 240 | One menu in the corner; one place owns the theme |
| 241–243 | Tap-to-log, eight frontend bugs, and a lint rule for hover-only controls |
| 244–246 | 3D muscle view, eleven rep shapes, per-exercise camera framing |
| 247, 250 | Today gets every habit type, then the whole habit grid as a fourth surface |
| 248 | Food lookup — Open Food Facts, USDA behind it, off by default |
| 249 | Recovery: 2.8 screens → 1.8, one chip component, no score to protect |

## Traps worth the next session's time

- **A grep finds the spelling you thought of; a lint rule finds the pattern.**
  The manual sweep for `opacity-0 group-hover:opacity-100` missed three sites
  that spell `transition-opacity` *between* the two classes — one of them
  "Delete entry". The rule added in #243 found them on its first run.
- **Measure the instrument before believing it.** A contrast probe printed
  identical numbers for all five themes (wrong `localStorage` key) and then a
  fake 1.30:1 for latte (read `color(srgb 0.80 …)` as 0–255). Two bugs in the
  tool before one in the subject.
- **A page move is a `git mv` plus a rendered-output diff, never a retype.**
  Done three times this session (#236, #249, #250); #250 lost zero headings,
  text lines, buttons and chart labels. The diff also caught a **five-fact
  `StatBar`** — it slices to four and warns only in DEV, so the fifth vanished
  from a production build in silence.
- **`MasonryGrid` is a container query.** On a non-`stacked` page zone-review
  is ~730px and its `@3xl` breakpoint wants 768 — it missed by under 40px and
  changed a page height by nothing. `CardGrid` breaks on the viewport, which
  is the right question when the column is sized by the split.
- **`color-mix()` costs you `onAccent`.** It computes to `color(srgb …)`,
  which the colour helpers do not parse, so a fill built that way cannot ask
  for its own readable foreground.

## Next, in the order I would take it

1. **COD-202.** Everything else ships blind until this runs.
2. `NoFap.logUrge` still has no guard beyond a 3s double-tap window — and
   whether an urge row should be written at all is a product call, not a code
   one. See #249's PR body.
3. Convert the remaining typed-number forms to `ChipPick`/`Stepper`:
   **Pickleball has 12 free-text fields**, Focus 6, Goals 3.
4. `focus/SessionHistory` holds a stale draft if undo or a cloud pull lands
   while an editor is open. Narrow, written down in the file, not fixed.
