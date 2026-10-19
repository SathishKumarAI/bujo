# STATUS

**Stopped:** 2026-10-18, on `feat/cycle-design-system`, **one PR open** —
COD-357, three commits. #436 merged first, so this builds on a clean `main`.

## Where it stands

Three reports in one session, each more specific than the last: *"these are
looking quite bad"* → *"could you please modernize this"* → *"redesign the
vocabulary, the buttons, the sections — everything for the cycle, and after
the cycle the entire site"*. Two comps were built and reviewed before any
code: [the controls](https://claude.ai/code/artifact/842ffd23-b740-49fd-9835-5df3b3631eb8)
and [the system](https://claude.ai/code/artifact/d06fa879-3c1a-452c-849b-8aff641d74eb).
The plan that came out of them is `docs/DESIGN-SYSTEM.md`.

**The most useful finding was that the system already mostly existed.**
`Button` has its four variants, `Stat` is richer than anything the comp drew,
`ChartCard` is nearly a figure frame, and the seven type steps are in
`tokens.css` — the `answer` step is simply unused on Cycle. So the plan went
from "a design system" to four primitive edits, one new primitive and one
page.

| commit | what |
|---|---|
| `b3a78b0` | four controls — token fills, rail replaces the boxed track, `Switch`, `--color-edge` |
| `bfad430` | the slow path into `DayWindow`, the legend into the manual, an ⓘ on every input |

Measured, same build, same demo journal:

| | before | after |
|---|---|---|
| act card at rest | 667px | **628px** |
| act card with both folds open | 2,187px | **628px** |
| the whole day, in the window at 1024 | — | **896px** |
| controls offered before you touch anything | 53 | 7 |
| controls reachable | 53 | **53** |

## The next action

Steps 1–3 of `docs/DESIGN-SYSTEM.md` are done. What is left, in order:

1. **Zone 1 is still five bands** — a banner, a month stepper, a four-up fact
   row, a three-up stat strip and a privacy line, none of them the page's
   answer. The comp's §04 rebuilds it as one card with `20` at the `answer`
   step and the phase drawn as a band rather than a 260px donut. Not done
   here because it is a page change with no primitive under it, and this
   branch was already large.
2. **`ChartCard` has no `footer`**, so every chart's key and sample size sit
   loose in its body — which is what let the band chart's right-hand column
   run off the panel edge.
3. **The rest of the app**: every page inherits the primitives already; what
   remains per page is whatever was hand-rolled instead of using them, and the
   browser gates are what find those.
4. **COD-364's second half** — `--ctl-ring` still leaves every input and
   select at 1.37–1.72, and `ChipPick`'s own rail border with it.
5. Carried in and unchanged: COD-360 (`intimacy` is write-only),
   `docs/QUESTIONS.md`, Home Workout's bare `useState` act, COD-247 for
   Recovery.

## What this session found that nobody reported

- **Three Tailwind v4 classes that emitted no CSS**, each failing silently
  with exit 0: `@container/more` (so a two-column grid queried a container
  that did not exist and matched at no width), `@3xl:max-w-5xl` on a dialog
  (it shipped 512px wide, reporting success), and `w-[6ch]` (two separate
  widenings of the temperature field changed not one pixel). **The tell is
  always the same — a tweak to a number has no effect.** The check is
  `grep '<the class>' dist/assets/*.css`.
- **`dayFields.ts`'s `help` keys were dead.** Five fields carry one,
  `cycleHelp.ts` has an entry with a `more:` target for every one, and
  `InfoTip` rendered on exactly four facts in zone 1 and nowhere else. The ⓘ
  that was asked for turned out to be a dead field, not a new feature.
- **`a ?? b ? c : d` parses as `(a ?? b) ? c : d`**, which made every toned
  rail paint mauve — a precedence bug that produces a *plausible* colour, so
  no type and no gate can see it.
- **`FlagLegend` had no caller** once the key moved, and nothing would have
  failed on it. An export nobody imports is not an error.

## Standing traps this session paid for again

- **The quietest type step is not free.** Endpoint labels went to `fg-3` and
  measured **3.78 (neon) · 3.81 (vscode) · 3.88 (mocha) · 4.49 (latte)** at
  10px; `npm run a11y` called it six serious violations. `fg-3` is for chrome,
  and the word saying which end of a scale is which is not chrome.
- **A gate's wording can name the wrong dimension.** `clipped` reported *"37px
  shown of 39px (5 chars)"* on a five-character field — that is
  `findOverflowingFields` measuring **scrollHeight**, and the fix was
  `leading-none`, not width. Read the gate's predicate before believing its
  noun; three guesses were spent widening something that was too short.
- **`git checkout <file>` wipes uncommitted work**, third session running.
  Copy the file first.

## Environment

**Preview on 4310, started from this worktree.** 4173 is also this worktree
but was serving a stale worker mid-session, which is what made an already-fixed
gate keep failing — compare `assets/index-*.js` against `dist/index.html`
before believing any measurement, in either direction.

```
npx vite preview --port 4310 --strictPort &
BUJO_URL=http://localhost:4310 node scripts/a11y-panels.mjs
```

`playwright` and `@axe-core/playwright` are installed on this machine but are
still not in `package.json` (COD-273).
