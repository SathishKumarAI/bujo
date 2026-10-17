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
| Guide | 6,640px · **7.38** | **1,037px · 1.15** | 11,050px · **13.09** | **2,004px · 2.37** |
| Manual | — | 1,073px · 1.19 | — | 1,672px · 1.98 |

Five things changed, and four of them are one measurement each. The page's
worst row is now **1.88 desktop screens and 3.11 on a phone**, against 7.38 and
13.09 before.

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

What was left behind in `Guide` was still 4,158px on a phone, because `phases`
and `food` are catalogues too — four and five phases of prose each. That row
is a deck as well (`DECK_GROUPS` in `lib/cycleCards.ts`, with the per-row
measurement that chose it), and it is now the page's *shortest* desktop row:
**1,037px · 1.15 screens**, phone **2,004px · 2.37**.

The other four rows stay grids. Their cards are instruments you compare — the
wheel against the phase, the symptom grid against the heatmap — and a deck
showing one at a time is the wrong shape for a comparison. None is over 3.2
phone screens, which is the number that would change that.

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
| Guide | phases · food · goal · data (a deck) | reference, settings, and your own data |
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

Canaried (`BUJO_CANARY=1`) before its green was quoted, as every gate here is:
all twelve rows went red on the planted `select-name`.

Result after the fix: **ALL CLEAN across every panel** — the full run, five
desktop themes and two phone themes, 133 rows, of which Cycle is 42. The decks
report `9/9` and `4/4`.

Known gap: `nextStep` lands on `steady` for the demo journal, so the other six
tones and glyphs are unit-tested but have never been *rendered* by a gate. A
branch the seed never takes cannot fail — the same shape as latte's yellow at
2.02:1 behind a count the seed never produced.

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

## The follow-ups · 2026-10-17

The four things COD-334 left open, taken in order. Three were real; one was
not, and saying so is the result.

**COD-247's other half is closed, and it was the MARK, not the card.** At 2560
with the act shut the panel is 1,662px and the `length` chart takes the whole
row — correctly, because it is a time series and the axis should span the
panel. What had no ceiling was the bar: Recharts divides the plot by the
number of bars, and three completed cycles gave

| | bar width before | after |
|---|---|---|
| 1440 | 212px | **180px** |
| 1920 | 340px | **180px** |
| 2560 | **430px** | **180px** |

`MAX_BAR` in `components/page/chartStyle.ts` carries the reasoning: past about
180px a bar stops reading as a measurement and starts reading as a panel. The
cap only ever shrinks a bar and only above that width, so a dense chart is
unaffected. **Nine other files render a `<Bar>` and none passes it** —
COD-336, filed rather than swept, because changing nine charts without
measuring any of them is the inference this repo keeps paying for.

**The rail count is true now.** `Manual` is one registered card holding a
nine-card deck, so the row said **1** above a deck saying **1 of 9** — two
figures each correct under its own definition, naming neither, which is this
page's oldest fault in miniature. `CycleCardMeta.panels` is derived from
`CYCLE_MANUAL.length`, `panelsIn` is the one place the difference is written
down, and the contract test asserts both halves: the row renders exactly the
registry's cards, and the rail counts exactly the panels the reader meets.

**The six undrawn `nextStep` branches have the check that was possible.**
Seeding a journal per branch is the complete answer and is not this change.
What was silent and is now not: `STEP_TONE` and `STEP_ICON` moved out of the
JSX into `components/cycle/stepStyle.ts` as `Record<CycleStep['id'], …>`, so
`tsc` proves every rule has both — an inline object indexed by `step.id`
returns `undefined` for a rule added later, and `cat(undefined)` paints
**mauve**, which on this page means "you ovulated". A test asserts every tone
is a real palette key; canaried by misspelling one.

**`food` was not a fault.** It is 2,509px on a phone and the reader does not
meet 2,509px: the Guide row is a `CardDeck`, its track is the height of the
ACTIVE card, and the row lands on `phases` at 1,089px. The page measures
**2.37 phone screens** there. The card is four phases of cited NHS/ACOG
reference with a body each, which is what a card is for — "a card is for a
named item with a body" — and it is reached by a deliberate swipe. Quoting a
card's own height against a page budget manufactures a fault; the entry is
retired rather than actioned.

## Open

- **COD-336** — the `maxBarSize` sweep over the other nine bar charts.
- **Seeding a journal per `nextStep` branch**, so the other six tones are
  rendered by a gate rather than only asserted.
