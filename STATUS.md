# STATUS

**Stopped:** 2026-08-29. On `refactor/gym-page-contract`, clean.
**#181 merged** (`main` at `85c3682`). **#182 open**, CI running.

## What this session did

Started from "work on `?view=gym`", then a reported bug: the exercise picker
"not showing all the text".

| PR | What | Ticket |
|---|---|---|
| #181 · merged | The picker was unreadable because a filling animation trapped it in a stacking context | — |
| #182 · open | Gym on the three-zone contract; 4.67 → 1.38 screens at 1440, 6.89 → 2.37 at 390 | — |

Filed, not fixed: **COD-89** three lists of the same lifts · **COD-90**
`stalledLifts` fires on 6 of 6 · **COD-91** `ExercisePicker` is not a combobox ·
**COD-92** set-row controls under the 44px touch floor · **COD-93** the a11y
gate does not open folds.

## The one thing to carry forward

**A fix can look right, land, and do nothing — and the only way to know is to
re-measure the symptom, not the mechanism.**

The picker bug was diagnosed correctly on the second try. The first diagnosis
was: `transform: translateY(0)` computes to `matrix(1,0,0,1,0,0)`, which is not
`none`, which creates a stacking context — so end every keyframe on
`transform: none`. That is all true, it is a real CSS rule, and it fixed
nothing. I confirmed the edited CSS was being served (`curl` the dev server,
read the keyframe back) and the computed transform was *still* the matrix.

The actual rule is that **an animation which is filling a transform holds a
stacking context for as long as it fills, whatever value it holds**, and
`animation-fill-mode: both` fills forever. The value was never the variable.
Nine entrance animations moved `both` → `backwards`; `celebrate-confetti` keeps
`both` and is marked `fill-both-ok`, because it ends displaced at opacity 0 and
must keep filling.

Two things worth keeping from that:

- **The gate I wrote first encoded the wrong rule and passed a broken page.**
  It matched keyframes ending on `translateY(0)`. Rule 7 in
  `check-design-system.mjs` reads the *fill mode* instead. A static gate is only
  as good as the mechanism it believes in, and writing the gate is not proof you
  understood the bug.
- **The decisive measurement was three lines**: `elementFromPoint` at the centre
  of the open panel, plus `panel.contains(hit)`. Before: the Body-weight chart's
  `<svg>`, `false`. After: the panel's own `<li>`, `true`. Screenshots showed
  "the menu looks transparent", which is what sent the first diagnosis at the
  background colour instead of the z-order.

Second: **folding a section removes it from `npm run a11y`.** That gate does not
open folds — its header says so — so when the contract pass folded Gym's
analytics, `BigThreeCard`'s **1.41:1** latte contrast bug went from
gate-visible to gate-invisible. Found by re-running axe with every
`[aria-expanded="false"]` in `#main` clicked open, three passes deep. Fixed the
contrast bug; filed the gate as COD-93. **Re-run axe with folds open whenever
you add or move one**, and read a clean a11y run as "clean for whatever was
expanded".

Third, smaller: **the set row did not fit a phone, through two green rendering
gates.** 324px column, 326px of grid tracks, so the remove button sat at
**x=387 in a 390 viewport** while `document.body.scrollWidth` still read 390 —
the ancestor-clip trap already in CLAUDE.md, hit again. The same squeeze
collapsed `1fr` to 50px, making the exercise picker the *narrowest* control in
the row it exists to fill. Both found by iterating control rects, not by
looking.

## Measured

Demo journal, dev server 5199.

| | before | after |
|---|---|---|
| gym · 1440 | 4207px · 4.67 screens | **1246px · 1.38** |
| gym · 390 | 5818px · 6.89 screens | **1997px · 2.37** |
| folds open on arrival | 10 of 10 | **0 of 9** |
| charts on first paint | 4 | **0** |
| controls off-screen at 390 | 1 | **0** |

Gates on #182: `tsc -b` 0 · eslint 0 errors · vitest **887/887** · build ok ·
`design` 288 files · `contrast` 5 themes · `clipped` 23 views · `smoke` 25/25 ·
axe with every fold open, 0 serious at mocha 1440 / latte 1440 / mocha 390.

## Next action

Merge #182 once CI is green. Then COD-93 (arm the a11y gate to open folds) is
the highest-leverage of the five filed — it is the reason the other bugs on this
page were invisible, and it protects every page, not this one.
