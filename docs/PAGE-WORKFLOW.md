# The page workflow

How a page in this app gets fixed. Written after running it across nine
screens, because the order matters more than any individual fix and doing it
out of order wastes an afternoon — twice, so far, both recorded below.

`DESIGN.md` says what things look like. `PAGE-SHAPE.md` says where they go.
This says **how to get from "this page is a mess" to a merged PR.**

---

## 0 · Measure before you form an opinion

Never start from a screenshot. Every real finding in this codebase came from
a number, and two plausible redesigns were killed by one.

```
npm run space -- <view> | --all   scroll as shipped AND with every fold open,
                                  cards, columns, mostly-empty cards
npm run a11y                      accessibility tree, 5 themes × 2 viewports
npm run clipped                   controls outside the viewport with no way in
npm run contrast                  both palettes agree, accents clear 4.5:1
```

Then drive the running app and read the **DOM**, not the picture:

```js
document.documentElement.scrollHeight          // page height
document.body.scrollWidth                      // horizontal overflow
document.querySelector('.zone-act').getBoundingClientRect()
[...document.querySelectorAll('#main [aria-expanded]')]   // disclosure points
getComputedStyle(el).gridTemplateColumns       // what the grid ACTUALLY did
```

**Both space numbers, always.** Shipped alone rewards hiding content; open
alone punishes a disclosure for existing. When shipped rises and open does
not, nothing grew — a fold was opened.

### Things a screenshot will lie to you about

| It looks like | It is |
|---|---|
| A chart is missing | A 2px stroke at low opacity. Count `.recharts-curve` |
| A card is empty | The demo seed never wrote that domain |
| The grid has one column | It does — because the container is 46px under the breakpoint |
| The field is full-width by design | `Input`'s own `w-full` beat the caller's `w-20` |

---

## 1 · Pick the instrument from the shape of the page

| Symptom, measured | Instrument |
|---|---|
| **5+ peer groups**, or "open" far exceeds "shipped" | **`SectionRail`** — the group names become navigation |
| Two cards list the same rows | One table |
| A chart behind `defaultOpen={false}` | Open it. A chart nobody finds does not exist |
| Short act beside a long review | Put something in the act column that belongs to the act |
| A control stretched across the page | Check the component honours `className` |

### What does NOT work, measured twice

**Widening the tier.** All ten narrow pages flipped to `tier={1440}`: page
height changed on **8 of 10 by zero**, and the dead column got worse. The
review clears the 768px masonry step and nothing packs into it.

**Stacking.** The seven pages with the most dead space set to `stacked`:
+469, +641, +1224, +1346px. `max(act, review)` becomes `act + review`.

**The lever is removing content from the page, not reflowing it.** Insights
went 6.3 → 1.8 screens because five of six groups stopped rendering.

**And the order is what makes Insights' `tier={1440}` + `stacked` look like a
win.** It is the same page shape those two experiments failed on; what changed
first was that only one group renders. Re-tested on Cycle *after* its rail
landed, stacking still loses: **1.0 → 1.9 screens shipped, page height
1,087 → 1,819px (+732)** — `max(act, review)` becoming `act + review`, with
Cycle's 760px act column the whole cost. It buys a vertical rail and 545px
cards against 351px ones, and that is not worth 0.9 of a screen on a page whose
review zone is now shorter than its form. Insights has no such act column
(23 analytics cards, a search box), which is why the same two flags are right
there and wrong here. **Measure the rail first, the width second, and never
assume the second result transfers.**

---

## 2 · The rail, when it is the answer

Reach for `components/page/SectionRail.tsx` past about four peer groups.

```
insights   6.3 → 1.8 screens desktop, 13.5 → 3.1 phone
help       4.5 → 1.3 shipped, 10.9 → 1.6 open
pickleball 4.3 → 3.0, folds 17 → 8
pullups    open 5.7 → 2.2, folds 7 → 1
coaching   the 12.9-screen open state stops existing
cycle      2.5/4.8 → 1.0/1.0 desktop, 4.4/10.6 → 2.3/3.5 phone, folds 4 → 0
```

Rules, all learned the hard way:

- **Default to a real group, never "All".** Landing on everything is landing
  on the page you just replaced. Pick the group someone actually opens the
  page for — not the first in the list, and not the biggest. Coaching
  defaults to Drills, not the 2,921px shot library.
- **A query crosses groups.** Finding a card whose group you do not remember
  is the whole reason search exists. There is a test for this on Insights.
- **Counts are live; a zero row is disabled, not hidden.** A rail whose rows
  move as you type cannot be aimed at.
- **`count` is optional.** Only meaningful when groups hold comparable
  things: "Habits 5" informs, "Mental game 1" is a number about nothing.
- **Sticky, if the thing it replaced was.** Six folds each had a `stickyKey`;
  losing that is a regression dressed as a redesign.

### Two mechanical traps, hit on the first call site every single time

```tsx
{/* WRONG — an element cannot query itself: the grid never fires */}
<div className="@container/page grid @4xl/page:grid-cols-[11rem_1fr]">

{/* RIGHT — container outside, grid inside */}
<div className="@container/page">
  <div className="grid grid-cols-[minmax(0,1fr)] @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
```

`grid-cols-[minmax(0,1fr)]` is not decoration. Without a base template the
grid gets one implicit `auto` track sized to its widest item's min-content —
the seven-chip rail made that **426px inside a 390px viewport** and scrolled
the whole page sideways. The rail's own `overflow-x-auto` cannot save it: the
track overflows, not the item.

### `CardGrid` asks the viewport, and a split page's column does not care

At `tier={1180}` the review zone is 722px wide whatever the screen does, so
`CardGrid`'s `2xl:grid-cols-3` fires on a 1600px *window* and cuts that 722px
into three **227px** tracks. Cycle shipped that way — the "cards a third of the
size" half of a report about it — and `className="2xl:grid-cols-2"` at the call
site put it back to two tracks of 350 with the page height unchanged
(1,088 → 1,088px). `MasonryGrid` is not the alternative: it breaks on its
*container* at 768px, so at 722 it silently draws one column. Grid columns are
the mirror of the `tier`/`stacked` question above — ask which box decides the
width before choosing which query answers it.

### A chip row is often the right answer on a split page

Zone 3 on a split `tier={1180}` page is **722px** — under `@4xl`, so the rail
stays horizontal. That is usually fine and sometimes better: on Help,
`stacked` + `tier={1440}` bought a vertical rail and cost **0.7 screens**. At
1.3 screens there is no scrolling left for a rail to save. Measure, then
choose; and write down why, because the next reader will see a chip row on a
wide screen and assume it was an oversight.

---

## 3 · Prove the move, not the build

A green build proves nothing about a relocation. This repo has lost eleven
workout formats to a pass that retyped a data module instead of moving it,
with `tsc`, eslint, vitest and the build all green.

**Rendered content diff** — for a restructure:

```
walk every group in the browser, open every fold, union the innerText,
diff before against after
```

The only lines that should disappear are the ones you meant to delete. On
Insights that was nine old group headings and nothing else. On Pickleball and
Help it was zero.

**Source diff** — for a pure move, and it is stronger:

```py
extract each body from `git show HEAD:file` and from the working tree,
strip indentation, compare line by line
```

Pullups' six chapter bodies: 10, 7, 23, 12, 12, 13 lines — all IDENTICAL.
The browser probe kept timing out on that page's nested folds; the source
check took a second and proved more.

**Read a diff before believing it.** Coaching's showed four missing lines
that turned out to be a *swap* — the Skill ladder is a single-open accordion,
so exactly one level's detail is visible in either snapshot. Check the
reverse direction.

---

## 4 · Ship it

One branch per page. `npm run verify` (`tsc -b`, vitest, eslint, build), then
`npm run a11y`, then the gates the change touches. Quote real numbers in the
commit body — before → after, and say which got worse.

A PR body says what is **not** in it as well as what is.

---

## The traps this workflow exists to catch

Each of these shipped green and was found by measuring:

- **An unseeded domain is a subject the gates cannot check.** `lib/demo.ts`
  wrote every domain except `data.cycle`, so a page the a11y gate visits ten
  times a run could not fail. Seeding it turned the next run red.
- **A demo in an older shape than the app writes tests the wrong branch.**
  The seed wrote only legacy `sets` strings, so every `setRows` path ran on
  its fallback — and hid that `parseSet` dropped the set count, making
  "sets this week" read **9 against a true 39**.
- **A count in a comment has nothing keeping it true.** Two docstrings said
  "26 principles" while the library held 46 and the page rendered "46 of 46"
  thirty pixels away.
- **A component that concatenates `className` silently ignores the caller.**
  Ten fields across the app were stretched; one asked for 80px and rendered
  889.
- **A page that offers names must use those names as its structure.** Six
  domain chips over nine differently-named groups reads as "scattered", and
  nothing fails.
- **"Environmental, not a regression" in a handover means a gate is off.**

## Where the numbers live

`STATUS.md` is re-entry context — where it stopped, the next action, the
traps. Each page's own findings are in the commit that fixed them; the
durable rules are in `PAGE-SHAPE.md` and `CLAUDE.md`. This file is the method.
