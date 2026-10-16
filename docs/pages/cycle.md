# Cycle

`src/views/Cycle.tsx` · nav: Wellbeing → Cycle · `?view=cycle`

## What this page is

A menstrual-cycle log and the readings taken from it: a day editor
(temperature, five flags, a drive rating), a month list, and a review zone that
answers *where am I*, *when is the window*, *what tends to happen on which day*
and *how do I use this*.

Everything in the review is keyed to the **cycle**, not the calendar month. A
month boundary cuts a cycle at an arbitrary point, which is how a perfectly
ordinary chart came to read as two unrelated fragments.

Nothing here predicts and nothing here diagnoses. Every derivation returns
`null` rather than a fake zero, every estimate is worded as one, and
`CYCLE_DISCLAIMER` sits outside the rail so no reader can reach a row without
having passed it.

## What shipped · COD-334, 2026-10-16

The last page on `docs/PAGE-ROLLOUT.md`. Measured at `?demo=1`, mocha, with the
served bundle hash checked against `dist/index.html` every time, **per rail row
and at four widths** — a rail page's single number is whichever row it opens
on, which is COD-237.

Desktop figures are with the act shut, which is what the act collapse bought:

| row | 1440 before | 1440 after | phone before | phone after |
|---|---|---|---|---|
| This cycle | 1,254px · 1.39 | **1,258px · 1.40** | 2,448px · 2.90 | **1,881px · 2.23** |
| How you feel | 1,749px · 1.94 | **1,696px · 1.88** | 3,192px · 3.78 | **2,626px · 3.11** |
| Fertility | 1,433px · 1.59 | **1,368px · 1.52** | 2,659px · 3.15 | **2,092px · 2.48** |
| Patterns | 1,434px · 1.59 | **1,438px · 1.60** | 2,429px · 2.88 | **1,863px · 2.21** |
| Guide | 6,640px · **7.38** | **2,785px · 3.09** | 11,050px · **13.09** | **5,051px · 5.98** |
| Manual | — | 1,073px · 1.19 | — | 1,672px · 1.98 |

Four things changed, and three of them are one measurement each.

### 1 · The act column can be put away

Cycle was the last page on the contract with no `useActColumn`/`ActStrip`: the
day editor held **424px at 1440 and 520px at 1920** on every visit, and the
review had 678px / 854px with no way to get the rest.

| | review | act |
|---|---|---|
| 1440 before | 678px | 424px |
| 1440 shut | **846px** | **40px** |
| 1920 before | 854px | 520px |
| 1920 shut | **1,326px** | **40px** |

The phone number is the one that matters. Stacked, the editor, the optional
fold, the legend and the month list are **682px of column above a review the
page exists to show**, so `useActColumn` starts shut there — the rule that
lives in the hook rather than at the call site because nobody guesses it.

The hide affordance is **drawn**, in `Card`'s existing `right` slot, not left
in a `title` (REUSABLE-PATTERNS §27). A phone cannot hover, and an affordance
nobody finds is why this page shipped with no way to collapse the editor at
all.

### 2 · The manual is its own row, one card at a time

The Guide row was **11,050px / 13.09 phone screens** against 2.9–3.8 for every
other row, and 5,435px of that was one card: nine manual sections in a
`CardGrid`, inside a `Card`, inside the row, with their own contents `<nav>`
above them.

Only one of those two faults is length. The row carried **three navigations**
— the rail, the contents list, the scroll — for one subject, where
`docs/PAGE-SHAPE.md` allows a review zone one. So the manual took a row of its
own and became a `CardDeck` (§30): one section on screen, eight a swipe away,
and the deck's count, arrows and dots **are** the contents list, so the `<nav>`
went with the grid rather than surviving as a second way to do the same thing.

Worst card on the page, phone: **5,435px → 827px**.

### 3 · The review grid asks the panel, not the window

Zone 3 was `CardGrid className="2xl:grid-cols-2"` — a viewport query deciding
the layout of a column sized by the page split. The cap was itself a patch for
the same mistake (at 1600 the grid's own `2xl:grid-cols-3` fired inside a 722px
column and drew three tracks of 227px), so one viewport query was pinned shut
by another and putting the act away bought width nothing could spend. COD-247.

`StatGrid` gained a second step set, `steps="pair"`, and both halves of it were
measured:

- **A ~330px card floor, not 450.** These are rings, diagrams and short
  legends; the page already draws them at 329px with the act open and 413px
  with it shut. The stat floor would have made 846px a single column.
- **Two columns at most.** No group here has more than two cards that are not
  full-width, so a third track cannot hold a third card — it can only make two
  narrower and leave a dead column. Measured at a 1,326px panel: three steps
  took `This cycle` from **1,107px to 1,169px** and the cards from 653px to
  429px.

`SPAN_PANEL` (`col-span-full`) replaced `SPAN_2`, which is two more viewport
queries and claims "two of three" in a grid whose column count is a container
query. A second `@container/page` went on the panel wrapper: the outer one is
what the rail's own `@4xl/page` asks and it measures zone 3 *including* the
11rem rail and the 2rem gap.

### 4 · Zone 1 says what to do

`lib/cycleInsights.ts` → `nextStep`, seven rules ordered by urgency: `first` ·
`late` · `due` · `stale` · `fertile` · `young` · `steady`. Total, so zone 1
renders it with no conditional that could leave a hole at the top of the page,
and it reads the same detection engine the phase pill and the chart read.

Two carry a floor:

- **`stale` needs a temperature in the last 30 days** before it may complain
  about a missing one. `morningsSinceTemp` returns `null`, not a count, so the
  reader whose goal is `understand` is not nagged about a feature they
  declined.
- **`young` reports its sample size** rather than discarding it.

`late` says the estimate has run out and stops. A test asserts the sentence
contains no word that reads as a result.

Cost: **+52px desktop, +74px phone** per row.

**Not `actTop`.** Measured at 1440 with the act open, `This cycle` is 1,306px
either way: the act column is 807px and zone 1 is ~120px, so moving the orient
block into the left column does not shorten the taller one. Recovery needed it
because its zone 1 is a ring and a block; this one is still a bar.

## Shape

`PageLayout` tier 1180, zone 1 spanning both columns.

| zone | holds |
|---|---|
| 1 · orient | the `nextStep` sentence, then cycle day · phase+confidence · next period · your average, then the privacy line |
| 2 · act | the day editor, the optional fold, the flag legend, the month list — collapsible to a 40px strip |
| 3 · review | one bar: This cycle · How you feel · Fertility · Patterns · Guide · Manual |

### The rail

`lib/cycleCards.ts` is the registry, and `views/Cycle.test.tsx` asserts the
rendered `data-card` set equals it **in both directions** — the assertion that
exists because a rail makes a lost card *quieter*, not louder.

| row | cards | the question it answers |
|---|---|---|
| This cycle | wheel · phasefood · length | where am I, and is this cycle like the last few |
| How you feel | feelings · drivephase · moodphase | is this me, or is this my cycle |
| Fertility | fertile · luteal · bbt | when is the window, and did the temperature confirm it |
| Patterns | symptoms · grid | what tends to happen, and on which cycle day |
| Guide | phases · food · goal · data | reference, settings, and your own data |
| Manual | manual (a 9-card deck) | how to use this page, and what it cannot tell you |

The flag legend is in **zone 2, not the guide**: "which colour is which" is
asked while pressing the chips, and a rail row would answer it on a row you
have to select first.

The disclaimer is **outside the rail**, for the same reason inverted — a
medical disclaimer behind a row you have to select is one most readers never
meet.

## The gate

`scripts/a11y-panels.mjs` now carries a `cycle` entry with all six rows —
COD-237 named this page as one of six whose rail made `npm run a11y` cover
less than the folds it replaced, and it was the last of them unarmed. The
`Manual` row is a deck, so `stepDecks` reports `9/9` there; without it the gate
would see one of nine and call the row covered.

**Arming it found a real violation immediately**, which is the argument for
arming it: `label-content-name-mismatch` (serious, WCAG 2.5.3) on **all twelve
rows at once**, because the new hide button painted "Tap to hide" and announced
"Hide the log — the review takes the width". The rule compares the name against
what is DRAWN — a speech-input user says what they can see — so announcing
*more* is fine and announcing something *else* is not. The name now contains
the painted words.

Canaried (`BUJO_CANARY=1`) before its green was quoted, as every gate here is.

## Where to look

| Change | File |
|---|---|
| Zone layout, the act strip, which card is where | `src/views/Cycle.tsx` |
| Which card belongs to which rail row, and which take the full panel | `src/lib/cycleCards.ts` |
| The sentence at the top, and every derivation behind the four facts | `src/lib/cycleInsights.ts` |
| Ovulation detection, the fertile window, the confidence word | `src/lib/ovulation.ts` |
| The cycle-day heatmap and the sentences above it | `src/lib/cyclePatterns.ts` |
| Desire / mood / energy by phase | `src/lib/cycleFeelings.ts` |
| The ⓘ content, and which manual section each one links to | `src/lib/cycleHelp.ts` |
| The manual's nine sections | `src/lib/cycleManual.ts` |
| Flag hues, words and meanings | `src/components/cycle/flags.ts` |

## Traps this page has already paid for

- **An unseeded domain is a subject no gate is checking.** `lib/demo.ts` wrote
  every domain *except* `data.cycle`, so the whole orientation block was absent
  from the DOM and `npm run a11y` visited this page on every run and could not
  fail on any of it. Seeding four cycles turned the first green run red.
- **`InfoTip`'s `onMore` had no call site**, so all 18 `more:` targets in
  `lib/cycleHelp.ts` pointed at sections nothing linked to. `cycleHelp.test.ts`
  was green throughout and right to be: it asserts every target *resolves*,
  which says nothing about whether anything links. A dead field is found by
  grepping the FIELD, never the module.
- **A seeded generator is a shared resource.** Four extra `rand()` calls added
  inside the pickleball loop shifted every number drawn after it and failed
  `cycleSnapshot.test.ts` on a coverline moving 97.41 → 97.42.
- **jsdom reports a 0px shell**, so every component test meets the stacked
  layout and therefore the shut act column. `Cycle.test.tsx` presses the strip
  and asserts `aria-expanded="false"` on the way in — the only coverage that
  default has outside a browser probe.
- **Demo data is persisted, not regenerated.** Editing `lib/demo.ts` changes
  nothing for an existing journal; bump `DEMO_VERSION` or re-seed from
  Settings → Data.

## Open

- **COD-247's other half.** At 2560 with the act shut the panel is 1,662px and
  the two narrow cards are 821px each. A third column is not the answer, for
  the reason measured above; capping the card is, and it is a separate change.
- **`food` is the Guide row's worst panel** at 2,509px on a phone — the second
  catalogue in that row, and not the manual's problem to solve.
